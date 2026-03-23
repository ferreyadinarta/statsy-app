import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f2eb] p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12 pb-6 border-b border-[#1a1714]">
          <span className="font-black text-lg tracking-tight text-[#e8500a]">
            ● Statsy
          </span>
          <LogoutButton />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">
          Dashboard
        </h1>
        <p className="text-[#8a8070] mb-1">Logged in as {user.email}</p>
        <p className="text-[#8a8070] text-sm">
          Status pages coming in Chat 03.
        </p>
      </div>
    </div>
  );
}
