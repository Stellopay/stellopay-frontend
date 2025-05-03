export default function DashboardHeader() {
  return (
    <div className="w-full px-4 md:px-8 py-6 bg-[#1a0c1d] border-b border-[#1A1A1A]">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-xl font-semibold">
        
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md border border-[#2c2c2c] hover:bg-[#111] transition w-full sm:w-auto">
            <span>🚀</span> Send Payment
          </button>
          <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border hover:bg-[#f3f3f3] transition w-full sm:w-auto">
            <span>⬇️</span> Request Payment
          </button>
        </div>
      </div>
    </div>
  );
}
