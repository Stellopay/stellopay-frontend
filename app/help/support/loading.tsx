export default function SupportLoading() {
  return (
    <div
      role="status"
      aria-label="Loading support content"
      className="min-h-screen p-4 sm:p-6 text-white"
    >
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[#2D2D2D]" />
        <div className="flex gap-2">
          <div className="h-11 w-28 animate-pulse rounded-l-lg bg-[#2D2D2D]" />
          <div className="h-11 w-36 animate-pulse rounded-r-lg bg-[#2D2D2D]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-[#2E2E2E] bg-[#121212]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
