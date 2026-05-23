import Link from "next/link";

export default function CtaButton({
  href = "https://statsy.page/signup",
  children = "Get started free →",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="my-8 flex justify-center">
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] font-semibold text-[15px] no-underline transition-colors"
        style={{
          background: "#e8500a",
          color: "#ffffff",
          fontFamily: "var(--font-head)",
          letterSpacing: "-0.01em",
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </div>
  );
}
