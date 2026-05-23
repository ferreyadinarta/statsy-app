export default function QuickAnswer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-6 rounded-[4px] px-5 py-4"
      style={{
        background: "#fdf9f5",
        border: "1.5px solid #e4dfd4",
        borderLeft: "3px solid #e8500a",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
        style={{ color: "#e8500a" }}
      >
        Quick Answer
      </div>
      <div className="text-[15px] leading-relaxed" style={{ color: "#1a1714" }}>
        {children}
      </div>
    </div>
  );
}
