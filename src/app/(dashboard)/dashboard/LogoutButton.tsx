"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="border border-[#1a1714] rounded px-4 py-2 text-sm font-medium hover:bg-[#1a1714] hover:text-[#f5f2eb] transition-colors cursor-pointer"
    >
      Log out
    </button>
  );
}
