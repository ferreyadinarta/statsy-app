import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 border-b border-[#1a1714] bg-[rgba(245,242,235,0.92)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e8500a] animate-pulse" />
          <span className="font-black text-xl tracking-[-0.04em] text-[#1a1714]">
            Statsy
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8a8070] hidden sm:block">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-14">
        {/* Page heading */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e8500a] mb-2">
            Dashboard
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1714] mb-2">
            Your status pages
          </h1>
          <p className="text-[#8a8070] text-sm">
            Manage your pages, services, and incidents from here.
          </p>
        </div>

        <Separator className="mb-10 bg-[#e4dfd4]" />

        {/* Empty state */}
        <Card className="border-dashed border-[#c4bfb4] bg-white">
          <CardContent className="flex flex-col items-center text-center py-20">
            <div className="w-12 h-12 rounded-lg bg-[rgba(232,80,10,0.08)] border border-[rgba(232,80,10,0.15)] flex items-center justify-center text-2xl mb-6">
              📡
            </div>
            <CardTitle className="font-serif text-xl tracking-tight text-[#1a1714] mb-2">
              No status pages yet
            </CardTitle>
            <CardDescription className="max-w-xs mb-8 leading-relaxed">
              Create your first status page and start keeping your users
              informed when things go wrong.
            </CardDescription>
            <Button
              disabled
              className="bg-[#1a1714] text-[#f5f2eb] opacity-40 cursor-not-allowed"
            >
              + Create status page
            </Button>
            <p className="text-xs text-[#8a8070] mt-3">
              Coming in the next step
            </p>
          </CardContent>
        </Card>

        {/* Plan bar */}
        <Card className="mt-6 border-[#e4dfd4] bg-[#ede9e0]">
          <CardContent className="flex items-center justify-between py-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8070]">
                Plan
              </span>
              <Badge
                variant="outline"
                className="border-[#1a1714] text-[#1a1714] font-bold uppercase text-xs"
              >
                Free
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8a8070]">
              <span>1 page</span>
              <Separator orientation="vertical" className="h-3 bg-[#c4bfb4]" />
              <span>3 services per page</span>
              <Separator orientation="vertical" className="h-3 bg-[#c4bfb4]" />
              <span>50 subscribers</span>
            </div>
            <Button
              variant="link"
              className="text-xs font-semibold text-[#e8500a] p-0 h-auto"
            >
              Upgrade to Pro →
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
