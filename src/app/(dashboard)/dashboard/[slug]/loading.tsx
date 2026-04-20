export default function StatusPageLoading() {
  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      {/* Nav skeleton */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{
          borderBottom: "1.5px solid #1a1714",
          background: "rgba(245,242,235,0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-[9px] h-[9px] rounded-full bg-[#e8500a]"
            style={{ animation: "blink 2.4s ease-in-out infinite" }}
          />
          <div className="h-5 w-16 rounded-[2px] bg-[#e4dfd4] animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#e4dfd4] animate-pulse" />
          <div className="h-4 w-20 rounded-[2px] bg-[#e4dfd4] animate-pulse hidden sm:block" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-14">
        {/* Heading skeleton */}
        <div
          className="mb-10 pb-10"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <div className="h-3 w-24 rounded-[2px] bg-[#e4dfd4] animate-pulse mb-3" />
          <div className="h-10 w-64 rounded-[2px] bg-[#e4dfd4] animate-pulse mb-3" />
          <div className="h-4 w-full max-w-sm rounded-[2px] bg-[#e4dfd4] animate-pulse" />
        </div>

        {/* Services skeleton */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-32 rounded-[2px] bg-[#e4dfd4] animate-pulse" />
          <div className="h-9 w-28 rounded-[4px] bg-[#e4dfd4] animate-pulse" />
        </div>

        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-6 py-4 rounded-[4px] bg-white flex items-center justify-between"
              style={{ border: "1.5px solid #e4dfd4" }}
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-24 rounded-[2px] bg-[#e4dfd4] animate-pulse" />
                <div className="h-7 w-28 rounded-[4px] bg-[#e4dfd4] animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 rounded-[4px] bg-[#e4dfd4] animate-pulse" />
                <div className="w-9 h-9 rounded-[4px] bg-[#e4dfd4] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
