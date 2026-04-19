import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center px-6">
      <div className="text-center w-full max-w-[420px]">

        <div
          className="mx-auto mb-7 flex items-center justify-center w-16 h-16 rounded-full"
          style={{
            background: "rgba(232,80,10,0.1)",
            border: "2px solid #e8500a",
          }}
        >
          <FileQuestion size={28} strokeWidth={2.5} style={{ color: "#e8500a" }} />
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 900,
            fontSize: "2rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#1a1714",
          }}
        >
          Page not found
        </h1>

        <p
          className="mb-8 mx-auto text-base"
          style={{ color: "#8a8070", lineHeight: 1.65, maxWidth: "30ch" }}
        >
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>

        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full h-12 rounded-[4px] text-sm font-bold no-underline transition-colors duration-150 bg-[#1a1714] text-[#f5f2eb] border-[1.5px] border-[#1a1714] hover:bg-[#e8500a] hover:border-[#e8500a]"
          style={{ boxShadow: "3px 3px 0 #1a1714" }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
