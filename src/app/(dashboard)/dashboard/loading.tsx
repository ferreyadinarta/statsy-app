export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <div
        className="h-[65px]"
        style={{
          borderBottom: "1.5px solid #1a1714",
          background: "rgba(245,242,235,0.92)",
        }}
      />
      <main className="max-w-5xl mx-auto px-8 py-14">
        <div
          className="mb-10 pb-10"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <div className="h-3 w-20 rounded bg-[#e4dfd4] mb-3 animate-pulse" />
          <div className="h-9 w-64 rounded bg-[#e4dfd4] mb-3 animate-pulse" />
          <div className="h-3 w-48 rounded bg-[#e4dfd4] animate-pulse" />
        </div>
        <div
          className="rounded-[4px] py-20 flex flex-col items-center gap-4"
          style={{ border: "1.5px dashed #c4bfb4", background: "white" }}
        >
          <div className="w-12 h-12 rounded bg-[#e4dfd4] animate-pulse" />
          <div className="h-4 w-40 rounded bg-[#e4dfd4] animate-pulse" />
          <div className="h-3 w-56 rounded bg-[#e4dfd4] animate-pulse" />
          <div className="h-9 w-36 rounded bg-[#e4dfd4] animate-pulse mt-2" />
        </div>
      </main>
    </div>
  );
}
