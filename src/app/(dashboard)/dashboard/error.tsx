"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <AlertTriangle size={28} strokeWidth={2.5} style={{ color: "#e8500a" }} />
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
          Something went wrong
        </h1>

        <p
          className="mb-8 mx-auto text-base"
          style={{ color: "#8a8070", lineHeight: 1.65, maxWidth: "30ch" }}
        >
          An unexpected error occurred. Your data is safe.
        </p>

        <button
          onClick={reset}
          className="w-full h-12 rounded-[4px] text-sm font-bold cursor-pointer transition-colors duration-150 bg-[#1a1714] text-[#f5f2eb] border-[1.5px] border-[#1a1714] hover:bg-[#e8500a] hover:border-[#e8500a]"
          style={{ boxShadow: "3px 3px 0 #1a1714" }}
        >
          Try again
        </button>

        <Link
          href="/"
          className="inline-block mt-4 text-sm font-semibold no-underline text-[#8a8070] hover:text-[#1a1714] transition-colors duration-150"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
