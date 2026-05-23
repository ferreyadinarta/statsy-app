type Variant = "info" | "tip" | "warning";

const VARIANTS: Record<Variant, { bg: string; border: string; ink: string; label: string }> = {
  info: { bg: "#f0f7fa", border: "#1a5a7a", ink: "#1a5a7a", label: "Note" },
  tip: { bg: "#e8f5ee", border: "#1a7a4a", ink: "#1a7a4a", label: "Tip" },
  warning: { bg: "#fdf2eb", border: "#e8500a", ink: "#e8500a", label: "Heads up" },
};

export default function Callout({
  variant = "tip",
  children,
}: {
  variant?: Variant;
  children: React.ReactNode;
}) {
  const v = VARIANTS[variant];
  return (
    <div
      className="my-5 rounded-[4px] px-5 py-4"
      style={{ background: v.bg, border: `1.5px solid ${v.border}` }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5"
        style={{ color: v.ink }}
      >
        {v.label}
      </div>
      <div className="text-[15px] leading-relaxed" style={{ color: "#1a1714" }}>
        {children}
      </div>
    </div>
  );
}
