import { ArrowDownToLine, Send } from "lucide-react";

export default function DashboardHeader({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="w-full px-4 md:px-10 pt-6 pb-4 border-b border-[#1A1A1A]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-2xl font-semibold">{pageTitle}</h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md border border-[#2C2C2C] hover:bg-[#111] transition w-full sm:w-auto">
            <Send className="h-4 w-4" />
            Send Payment
          </button>
          <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] transition w-full sm:w-auto">
            <ArrowDownToLine className="h-4 w-4" />
            Request Payment
          </button>
        </div>
      </div>
    </div>
  );
}
