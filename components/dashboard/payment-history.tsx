"use client";

import Image from "next/image";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { CardSkeleton } from "@/components/ui/card-skeleton";

export default function PaymentHistory() {
  const { data, isLoading, error, refetch } = usePaymentHistory();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton lines={2} showHeader={false} />
        <CardSkeleton lines={2} showHeader={false} />
        <CardSkeleton lines={2} showHeader={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="text-sm text-red-400 text-center py-4">
        Failed to load payment history.
        <button
          type="button"
          onClick={refetch}
          className="ml-3 rounded-md border border-red-400/40 px-3 py-1 text-xs text-red-200 transition hover:bg-red-400/10"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((history) => (
        <div
          key={history.id}
          className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {history.paymentDescription}
              </h4>
              <div className="w-6 h-6 border border-zinc-200 dark:border-zinc-700 rounded-lg flex justify-center items-center bg-white dark:bg-zinc-800 shadow-sm relative">
                <Image
                  src="/notification.png"
                  alt="notify"
                  width={16}
                  height={16}
                  className="w-3.5 h-3.5 object-contain dark:invert-[0.9]"
                />
                <span className="w-1.5 h-1.5 absolute -top-0.5 -right-0.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-800" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {history.paymentId && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {history.paymentId.trim()}
                </span>
              )}
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {history.history}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
