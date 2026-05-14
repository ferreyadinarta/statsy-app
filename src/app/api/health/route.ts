import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from("status_pages").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: "db_unreachable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}