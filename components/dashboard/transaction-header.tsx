import { Date } from "../transactions/date";

interface TransactionHeaderProps {
  pageTitle: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClearDateRange?: () => void;
}

export default function TransactionHeader({
  pageTitle,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDateRange,
}: TransactionHeaderProps) {
  const hasDateRange = Boolean(startDate || endDate);

  return (
    <div className="w-full px-4 md:px-6 pt-4 border-b border-[#1A1A1A]">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-2xl font-semibold pl-4">{pageTitle}</h1>
        <div className="flex items-center justify-between gap-4">
          <Date
            date={startDate}
            onDateChange={onStartDateChange}
            placeholder="Start date"
          />
          <span className="text-sm text-[#e5e5e5]">To</span>
          <Date
            date={endDate}
            onDateChange={onEndDateChange}
            placeholder="End date"
          />
          {hasDateRange && onClearDateRange && (
            <button
              type="button"
              onClick={onClearDateRange}
              className="h-10 rounded-md border border-[#242428] px-3 text-sm font-medium text-[#CBD2EB] transition hover:bg-[#1a1a1a] hover:text-white"
            >
              Clear date range
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
