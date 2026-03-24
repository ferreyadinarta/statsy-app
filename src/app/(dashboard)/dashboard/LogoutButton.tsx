"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="border-[#1a1714] text-[#1a1714] hover:bg-[#1a1714] hover:text-[#f5f2eb] cursor-pointer text-xs font-semibold uppercase tracking-wider"
    >
      Log out
    </Button>
  );
}
