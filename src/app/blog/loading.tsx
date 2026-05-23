export default function BlogIndexLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#f5f2eb" }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-12 py-5"
        style={{
          background: "rgba(245,242,235,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1.5px solid #e4dfd4",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{
              background: "#e8500a",
              animation: "blink 2.4s ease-in-out infinite",
            }}
          />
          <span
            className="text-lg font-black"
            style={{
              color: "#1a1714",
              fontFamily: "var(--font-head)",
              letterSpacing: "-0.03em",
            }}
          >
            Statsy
          </span>
        </div>
        <div className="h-4 w-48 rounded bg-[#e4dfd4] animate-pulse" />
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-12 pt-16 pb-24">
        <div className="h-14 w-32 rounded bg-[#e4dfd4] animate-pulse mb-3" />
        <div className="h-4 w-80 rounded bg-[#e4dfd4] animate-pulse mb-12" />

        <div className="space-y-8">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-[#e4dfd4] animate-pulse mb-2" />
              <div className="h-7 w-3/4 rounded bg-[#e4dfd4] animate-pulse mb-2" />
              <div className="h-4 w-full rounded bg-[#e4dfd4] animate-pulse mb-1" />
              <div className="h-4 w-5/6 rounded bg-[#e4dfd4] animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
