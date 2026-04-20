export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-16 pb-20">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div
            className="h-10 w-48 sm:w-64 rounded animate-pulse"
            style={{ background: "#e4dfd4" }}
          />
          <div
            className="h-10 w-44 sm:w-56 rounded-full animate-pulse self-start sm:self-auto"
            style={{ background: "#e4dfd4" }}
          />
        </div>

        {/* Services skeleton */}
        <div className="flex flex-col gap-3 mb-16">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 sm:px-6 py-5 rounded-[4px] animate-pulse"
              style={{
                border: "1.5px solid #e4dfd4",
                background: "white",
              }}
            >
              <div
                className="h-5 w-28 sm:w-32 rounded"
                style={{ background: "#e4dfd4" }}
              />
              <div
                className="h-8 w-24 sm:w-32 rounded-full"
                style={{ background: "#e4dfd4" }}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[1.5px] border-[#e4dfd4] py-8 mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center">
          <div
            className="h-4 w-32 rounded mx-auto animate-pulse"
            style={{ background: "#e4dfd4" }}
          />
        </div>
      </footer>
    </div>
  );
}
