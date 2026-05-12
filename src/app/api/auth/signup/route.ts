import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendSignupConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/callback`;

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (error) {
    console.error("[signup] generateLink error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { hashed_token, verification_type } = data.properties;
  if (hashed_token && verification_type) {
    // Build direct callback URL with token_hash — bypasses Supabase's PKCE redirect
    // which would fail without a code verifier on admin-generated links
    const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/callback?token_hash=${hashed_token}&type=${verification_type}`;
    const emailResult = await sendSignupConfirmationEmail({ to: email, confirmLink });
    if (emailResult.error) {
      console.error("[signup] Resend error:", emailResult.error);
    }
  }

  return NextResponse.json({ ok: true });
}
