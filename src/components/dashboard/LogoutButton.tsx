"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

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
      className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium transition-colors duration-150 cursor-pointer"
      style={{ color: "#8a8070", border: "1.5px solid transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#1a1714";
        e.currentTarget.style.borderColor = "#e4dfd4";
        e.currentTarget.style.background = "white";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#8a8070";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <LogOut size={13} />
      Log out
    </button>
  );
}
