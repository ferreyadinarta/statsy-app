import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/reset-password`;

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  // Always return 200 to avoid leaking which emails are registered
  if (!error && data?.properties?.action_link) {
    await sendPasswordResetEmail({
      to: email,
      resetLink: data.properties.action_link,
    });
  }

  return NextResponse.json({ ok: true });
}
