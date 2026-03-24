import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(232,80,10,0.1)",
            border: "2px solid #e8500a",
          }}
        >
          <FileQuestion
            size={32}
            strokeWidth={2.5}
            style={{ color: "#e8500a" }}
          />
        </div>
        <h1
          className="mb-3"
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 900,
            fontSize: "2rem",
            letterSpacing: "-0.03em",
            color: "#1a1714",
          }}
        >
          Status page not found
        </h1>
        <p className="text-base mb-8" style={{ color: "#3d3830" }}>
          This status page doesn't exist or has been removed.
        </p>
        <Link
          href="https://statsy.page"
          className="inline-flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-sm font-bold no-underline transition-all bg-[#1a1714] text-[#f5f2eb] border-[1.5px] border-[#1a1714] hover:bg-[#e8500a] hover:border-[#e8500a]"
          style={{
            boxShadow: "2px 2px 0 #1a1714",
          }}
        >
          Go to Statsy
        </Link>
      </div>
    </div>
  );
}
