"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardNavbar from "@/components/dashboard/dashboard-navbar";
import AccountOverview from "@/components/dashboard/account-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import QuickTransfer from "@/components/dashboard/quick-transfer";
import dynamic from "next/dynamic";
import Skeleton from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import ClientAnalyticsView from "@/components/analytics/client-analytics-view";
import { allTransactions } from "@/lib/transactions";

const AnalyticsInsights = dynamic(
  () =>
    import("@/components/dashboard/analytics-insights").then(
      (mod) => mod.AnalyticsInsights,
    ),
  {
    loading: () => (
      <div
        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-[#111111] space-y-6"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <span className="sr-only">Loading analytics insights...</span>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" shade="dark" />
            <Skeleton className="h-4 w-64" shade="dark" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-xl" shade="dark" />
            <Skeleton className="h-10 w-24 rounded-xl" shade="dark" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
        </div>
      </div>
    ),
    ssr: true,
  },
);

export type RecentActivityType =
  "transaction" | "wallet" | "security" | "settings";

export interface RecentActivityEvent {
  id: string;
  type: RecentActivityType;
  title: string;
  description: string;
  /** ISO-8601 timestamp used for deterministic merge/sort behavior. */
  timestamp: string;
  /** Secondary detail such as a transaction id or settings area. */
  metadata?: string;
}

interface RecentActivityEventGroups {
  transactions?: RecentActivityEvent[];
  wallet?: RecentActivityEvent[];
  settings?: RecentActivityEvent[];
}

interface ActivityTypePresentation {
  label: string;
  Icon: LucideIcon;
  iconContainerClassName: string;
  iconClassName: string;
}

export const RECENT_ACTIVITY_LIMIT = 12;
export const MAX_RECENT_ACTIVITY_LIMIT = 15;

const ACTIVITY_TYPE_PRESENTATION: Record<
  RecentActivityType,
  ActivityTypePresentation
> = {
  transaction: {
    label: "Transaction",
    Icon: FileText,
    iconContainerClassName:
      "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    iconClassName: "text-blue-700 dark:text-blue-300",
  },
  wallet: {
    label: "Wallet",
    Icon: Wallet,
    iconContainerClassName:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    iconClassName: "text-emerald-700 dark:text-emerald-300",
  },
  security: {
    label: "Security",
    Icon: Shield,
    iconContainerClassName:
      "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    iconClassName: "text-amber-800 dark:text-amber-300",
  },
  settings: {
    label: "Settings",
    Icon: Settings,
    iconContainerClassName:
      "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
    iconClassName: "text-violet-700 dark:text-violet-300",
  },
};

export const DEFAULT_WALLET_ACTIVITY_EVENTS: RecentActivityEvent[] = [
  {
    id: "wallet-primary-connected",
    type: "wallet",
    title: "Primary wallet connected",
    description:
      "Stellar wallet GAAQ...ABOV was added as the default settlement wallet.",
    timestamp: "2023-04-12T10:45:00.000Z",
    metadata: "Wallets",
  },
  {
    id: "wallet-network-preference-saved",
    type: "wallet",
    title: "Stellar network preference saved",
    description:
      "Stellar was confirmed as the active supported network for wallet operations.",
    timestamp: "2023-04-11T08:45:00.000Z",
    metadata: "Wallets",
  },
];

export const DEFAULT_SETTINGS_ACTIVITY_EVENTS: RecentActivityEvent[] = [
  {
    id: "security-two-step-enabled",
    type: "security",
    title: "Two-step verification enabled",
    description:
      "A security setting was changed to require a verification code at sign-in.",
    timestamp: "2023-04-12T10:05:00.000Z",
    metadata: "Security",
  },
  {
    id: "settings-notifications-updated",
    type: "settings",
    title: "Notification preferences updated",
    description:
      "Email and push alerts for transaction and security activity were changed.",
    timestamp: "2023-04-11T18:30:00.000Z",
    metadata: "Preferences",
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getActivityTime = (timestamp: string) => {
  const time = Date.parse(timestamp);
  return Number.isNaN(time) ? 0 : time;
};

const formatActivityAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

export function normalizeRecentActivityLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return RECENT_ACTIVITY_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 0), MAX_RECENT_ACTIVITY_LIMIT);
}

export function getTransactionTimestamp(date: string, time = "") {
  const fallback = `${date}T00:00:00.000Z`;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);

  if (!match) {
    return fallback;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return fallback;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

export function formatActivityTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const hours24 = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} • ${hours12}:${minutes} ${period}`;
}

export function createTransactionActivityEvent(
  transaction: Transaction,
): RecentActivityEvent {
  const direction = transaction.amount < 0 ? "sent to" : "received from";
  const amount = `${formatActivityAmount(transaction.amount)} ${transaction.token}`;

  return {
    id: `transaction-${transaction.id}`,
    type: "transaction",
    title: transaction.type,
    description: `${transaction.status} ${amount} ${direction} ${transaction.address}.`,
    timestamp: getTransactionTimestamp(transaction.date, transaction.time),
    metadata: transaction.txId,
  };
}

export function mergeRecentActivityEvents(
  eventGroups: RecentActivityEventGroups,
  limit = RECENT_ACTIVITY_LIMIT,
): RecentActivityEvent[] {
  const safeLimit = normalizeRecentActivityLimit(limit);

  return [
    ...(eventGroups.transactions ?? []),
    ...(eventGroups.wallet ?? []),
    ...(eventGroups.settings ?? []),
  ]
    .sort((a, b) => {
      const timestampDifference =
        getActivityTime(b.timestamp) - getActivityTime(a.timestamp);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return a.id.localeCompare(b.id);
    })
    .slice(0, safeLimit);
}

interface RecentActivityFeedProps {
  limit?: number;
  viewAllHref?: string;
  walletEvents?: RecentActivityEvent[];
  settingsEvents?: RecentActivityEvent[];
  className?: string;
}

export function RecentActivityFeed({
  limit = RECENT_ACTIVITY_LIMIT,
  viewAllHref = "/transactions",
  walletEvents = DEFAULT_WALLET_ACTIVITY_EVENTS,
  settingsEvents = DEFAULT_SETTINGS_ACTIVITY_EVENTS,
  className = "",
}: RecentActivityFeedProps) {
  const safeLimit = normalizeRecentActivityLimit(limit);
  const pageSize = safeLimit || RECENT_ACTIVITY_LIMIT;
  const { data, isLoading, error, refetch } = useTransactions({
    pageSize,
  });

  const transactionEvents = useMemo(
    () => data?.data.map(createTransactionActivityEvent) ?? [],
    [data],
  );

  const events = useMemo(
    () =>
      mergeRecentActivityEvents(
        {
          transactions: transactionEvents,
          wallet: walletEvents,
          settings: settingsEvents,
        },
        safeLimit,
      ),
    [transactionEvents, walletEvents, settingsEvents, safeLimit],
  );

  return (
    <section
      aria-labelledby="recent-activity-heading"
      className={`w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-[#111111] sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800/70 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="recent-activity-heading"
              className="text-xl font-bold text-zinc-900 dark:text-white"
            >
              Recent activity
            </h2>
            <p
              id="recent-activity-description"
              className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400"
            >
              Latest transactions, wallet connections, security events, and
              settings changes for your account.
            </p>
          </div>
        </div>

        <Link
          href={viewAllHref}
          aria-label="View all account activity"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#111111] sm:self-start"
        >
          View all
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="pt-5">
        {isLoading ? (
          <div
            role="status"
            aria-label="Loading recent account activity"
            aria-busy="true"
            aria-live="polite"
            className="space-y-3"
          >
            <span className="sr-only">Loading recent account activity...</span>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/30 sm:grid-cols-[auto_minmax(0,1fr)_8rem]"
              >
                <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="col-start-2 h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:col-start-auto sm:justify-self-end" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Recent activity unavailable"
            description="We couldn't load the latest transaction activity. Try again to refresh the unified feed."
            onRetry={refetch}
            retrying={isLoading}
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Transactions, wallet connections, security events, and settings changes will appear here."
          />
        ) : (
          <ol
            role="list"
            aria-label={`${events.length} recent account activity events`}
            aria-describedby="recent-activity-description"
            aria-live="polite"
            className="divide-y divide-zinc-100 dark:divide-zinc-800/70"
          >
            {events.map((event) => {
              const presentation = ACTIVITY_TYPE_PRESENTATION[event.type];
              const Icon = presentation.Icon;
              const formattedTime = formatActivityTimestamp(event.timestamp);

              return (
                <li
                  key={event.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <div
                    data-activity-icon={event.type}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${presentation.iconContainerClassName}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${presentation.iconClassName}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <h3 className="break-words text-sm font-semibold text-zinc-900 dark:text-white">
                        {event.title}
                      </h3>
                      <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {presentation.label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-zinc-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                    {event.metadata && (
                      <p className="mt-2 break-words text-xs font-semibold text-zinc-500 dark:text-zinc-500">
                        {event.metadata}
                      </p>
                    )}
                  </div>

                  <time
                    dateTime={event.timestamp}
                    aria-label={`Activity time: ${formattedTime}`}
                    className="col-start-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:col-start-auto sm:whitespace-nowrap sm:text-right"
                  >
                    {formattedTime}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

/**
 * Dashboard component displaying the main user analytics, quick actions,
 * recent account activity, and account overview. Dynamically imports
 * AnalyticsInsights below-the-fold to speed up initial route execution and
 * loading metrics.
 */
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const accountSummaryRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const analyticsInsightsRef = useRef<HTMLDivElement>(null);
  const clientAnalyticsRef = useRef<HTMLDivElement>(null);

  const recentRecipients = useMemo(() => {
    const seen = new Map<string, { address: string; label?: string }>();
    for (const tx of allTransactions) {
      const addr = tx.address;
      if (!seen.has(addr)) {
        seen.set(addr, { address: addr, label: tx.type });
      }
    }
    return Array.from(seen.values());
  }, []);

  // Simulate loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0D0D0D] transition-colors duration-200">
      <DashboardNavbar />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-10">
        <div ref={accountSummaryRef}>
          <AccountOverview />
        </div>

        <QuickTransfer recentRecipients={recentRecipients} />

        <QuickActions />

        <div ref={analyticsInsightsRef}>
          <AnalyticsInsights />
        </div>

        <div ref={clientAnalyticsRef}>
          <ClientAnalyticsView
            isLoading={isLoading}
            showNotifications={true}
            showDropdown={true}
          />
        </div>

        {/* <TransactionHistory /> */}
      </div>

      <DashboardTour
        accountSummaryRef={accountSummaryRef}
        quickActionsRef={quickActionsRef}
        analyticsInsightsRef={analyticsInsightsRef}
        clientAnalyticsRef={clientAnalyticsRef}
      />
    </div>
  );
}
