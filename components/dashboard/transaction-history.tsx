"use client";

import { useRef, useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

const tokenIconMapWithUrls: Record<string, string> = {
  USDC: "/usd.png",
  XLM: "/stellar.png",
};

interface TransactionRowProps {
  transaction: {
    id: string;
    type: string;
    txId: string;
    address: string;
    date: string;
    time: string;
    token: string;
    amount: number;
    status: string;
    statusColor: "success" | "warning" | "destructive";
  };
  onRetry?: () => void;
}

const isCurrentStatus = (status: string) =>
  /pending|processing|confirming/i.test(status);

const isCompletedStatus = (status: string) =>
  /success|completed|complete/i.test(status);

const isRetryStatus = (status: string) => /retry/i.test(status);

const isFailureStatus = (status: string) =>
  /fail|reject|timeout|timed out|error|cancel|retry/i.test(status);

const getStatusLabel = (status: string) => {
  if (isCurrentStatus(status)) return `Current step: ${status}`;
  if (isCompletedStatus(status)) return `Completed: ${status}`;
  if (isRetryStatus(status)) return `Action needed: ${status}`;
  if (isFailureStatus(status)) return `Failed: ${status}`;
  return `Status: ${status}`;
};

const getStatusState = (status: string) => {
  if (isCurrentStatus(status)) return "current";
  if (isCompletedStatus(status)) return "completed";
  if (isRetryStatus(status)) return "retry";
  return "failed";
};

const getStatusAnnouncement = (
  transaction: TransactionRowProps["transaction"],
) => {
  const status = transaction.status;
  if (isCurrentStatus(status)) return `${transaction.type} ${transaction.txId} pending`;
  if (isCompletedStatus(status)) return `${transaction.type} ${transaction.txId} completed`;
  if (isRetryStatus(status)) return `${transaction.type} ${transaction.txId} retry`;
  if (status.toLowerCase().includes("reject"))
    return `${transaction.type} ${transaction.txId} rejected`;
  if (status.toLowerCase().includes("timeout"))
    return `${transaction.type} ${transaction.txId} timed out`;
  return `${transaction.type} ${transaction.txId} ${status}`;
};

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onRetry,
}) => {
  const statusColorMap = {
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive:
      "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <tr className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {transaction.type}
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {transaction.txId}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {transaction.address}
        </span>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {transaction.date}
        </span>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {tokenIconMapWithUrls[transaction.token] && (
            <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 flex items-center justify-center">
              <img
                src={tokenIconMapWithUrls[transaction.token]}
                alt={`${transaction.token} icon`}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
            </div>
          )}
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {transaction.token}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="text-sm font-bold text-zinc-900 dark:text-white">
          {transaction.amount}
        </span>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColorMap[transaction.statusColor]}`}
            aria-label={getStatusLabel(transaction.status)}
            aria-current={isCurrentStatus(transaction.status) ? "step" : undefined}
            data-state={getStatusState(transaction.status)}
          >
            {transaction.status}
          </span>
          {isFailureStatus(transaction.status) && (
            <button
              type="button"
              onClick={onRetry}
              aria-label={`Retry ${transaction.type} ${transaction.txId}`}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2 rounded hover:text-blue-700 dark:hover:text-blue-300"
            >
              Retry
            </button>
          )}
          <a
            href={`/transactions/${transaction.id}`}
            aria-label={`View details for ${transaction.type} ${transaction.txId}`}
            className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 underline underline-offset-2 rounded hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Details
          </a>
        </div>
      </td>
    </tr>
  );
};

const TransactionHistory: React.FC = () => {
  const { data, isLoading, error, refetch } = useTransactions();
  const wasLoadingRef = useRef(true);
  const previousCountRef = useRef<number | null>(null);
  const previousStatusesRef = useRef<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && data) {
      const count = data.data.length;
      if (
        previousCountRef.current === null ||
        previousCountRef.current !== count
      ) {
        setAnnouncement(
          count === 0
            ? "No transactions loaded"
            : `${count} transaction${count === 1 ? "" : "s"} loaded`,
        );
      }
      previousCountRef.current = count;
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, data]);

  useEffect(() => {
    if (!data) return;
    const currentStatuses: Record<string, string> = {};
    const announcements: string[] = [];

    for (const transaction of data.data) {
      currentStatuses[transaction.id] = transaction.status;
      const previousStatus = previousStatusesRef.current[transaction.id];
      if (previousStatus && previousStatus !== transaction.status) {
        announcements.push(getStatusAnnouncement(transaction));
      }
    }

    if (announcements.length > 0) {
      setAnnouncement(announcements.join(". "));
    }
    previousStatusesRef.current = currentStatuses;
  }, [data]);

  if (isLoading) {
    return (
      <div
        className="w-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors shadow-elevation-1"
        role="status"
        aria-label="Loading transactions"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
              <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="h-10 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <TransactionTableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load"
        description="Failed to load transaction history."
        onRetry={refetch}
      />
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <>
        {announcement && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {announcement}
          </div>
        )}
        <EmptyState
          title="No Transactions"
          description="You have no transactions yet."
        />
      </>
    );
  }

  return (
    <>
      {announcement && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={announcement}
          className="sr-only"
        >
          {announcement}
        </div>
      )}
      <div className="w-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors shadow-elevation-1">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-zinc-600 dark:text-zinc-400"
              >
                <path
                  d="M15.8333 8.75V8.3333C15.8333 5.19064 15.8332 3.61926 14.857 2.64296C13.8806 1.66667 12.3093 1.66667 9.16662 1.66667C6.02403 1.66667 4.45267 1.66672 3.47636 2.643C2.50008 3.6193 2.50006 5.1906 2.50003 8.33324L2.5 12.0833C2.49998 14.8228 2.49997 16.1927 3.25657 17.1146C3.3951 17.2834 3.54988 17.4382 3.71869 17.5768C4.64064 18.3333 6.01041 18.3333 8.74995 18.3333"
                  stroke="currentColor"
                  strokeWidth={1.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.83325 5.83333H12.4999M5.83325 9.16666H9.16659"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 15.4167L13.75 14.9583V12.9167M10 14.5833C10 16.6544 11.6789 18.3333 13.75 18.3333C15.8211 18.3333 17.5 16.6544 17.5 14.5833C17.5 12.5122 15.8211 10.8333 13.75 10.8333C11.6789 10.8333 10 12.5122 10 14.5833Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Transaction History
            </h2>
          </div>
          <a
            href="/"
            aria-label="View all transactions"
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
          >
            View All
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Transaction type
                </th>
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Token
                </th>
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {data.data.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onRetry={() => refetch()}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TransactionHistory;