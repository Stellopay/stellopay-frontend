"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
import type { Transaction } from "@/types/transaction";
import { safeStorage } from "@/utils/safeStorage";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  FileText,
  Wallet,
  Shield,
  Settings,
  Clock3,
  ChevronRight,
  Rocket,
  ArrowRight,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardTour } from "@/components/dashboard/dashboard-tour";
import { useTransactions } from "@/hooks/useTransactions";

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

export type WidgetId =
  | "account-overview"
  | "quick-transfer"
  | "quick-actions"
  | "analytics-insights"
  | "client-analytics";

export const WIDGET_IDS: WidgetId[] = [
  "account-overview",
  "quick-transfer",
  "quick-actions",
  "analytics-insights",
  "client-analytics",
];

export const WIDGET_LABELS: Record<WidgetId, string> = {
  "account-overview": "Account overview",
  "quick-transfer": "Quick transfer",
  "quick-actions": "Quick actions",
  "analytics-insights": "Analytics insights",
  "client-analytics": "Client analytics",
};

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
      className={`w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-elevation-1 transition-colors dark:border-zinc-800 dark:bg-[#111111] sm:p-6 ${className}`}
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

function getWidgetLabel(id: WidgetId): string {
  return WIDGET_LABELS[id];
}

function WidgetDragHandle({
  listeners,
  id,
  index,
  total,
  onMove,
}: {
  listeners: Record<string, unknown>;
  id: WidgetId;
  index: number;
  total: number;
  onMove: (id: WidgetId, direction: "up" | "down") => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-4 dark:border-zinc-800">
      <button
        {...listeners}
        className="inline-flex items-center justify-center rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-white"
        aria-label={`Drag ${getWidgetLabel(id)} to reorder`}
        aria-roledescription="sortable"
        type="button"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
        <span className="ml-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {getWidgetLabel(id)}
        </span>
      </button>
      <div className="flex items-center gap-0.5" role="group" aria-label={`Reorder ${getWidgetLabel(id)}`}>
        <button
          type="button"
          onClick={() => onMove(id, "up")}
          disabled={index === 0}
          aria-label={`Move ${getWidgetLabel(id)} up`}
          className="inline-flex items-center justify-center rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-white"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(id, "down")}
          disabled={index === total - 1}
          aria-label={`Move ${getWidgetLabel(id)} down`}
          className="inline-flex items-center justify-center rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-white"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function SortableWidget({
  id,
  index,
  total,
  onMove,
  tourRef,
  children,
}: {
  id: WidgetId;
  index: number;
  total: number;
  onMove: (id: WidgetId, direction: "up" | "down") => void;
  tourRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-10" : ""}`}
      role="listitem"
      aria-label={`${getWidgetLabel(id)} widget`}
      {...attributes}
    >
      <div className={`${isDragging ? "opacity-60" : ""}`}>
        <WidgetDragHandle
          listeners={listeners}
          id={id}
          index={index}
          total={total}
          onMove={onMove}
        />
        <div ref={tourRef}>{children}</div>
      </div>
    </div>
  );
}

function DashboardDragOverlay({ id }: { id: WidgetId }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-[#1A1A1A]">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <GripVertical className="h-4 w-4 text-zinc-400" aria-hidden="true" />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {getWidgetLabel(id)}
        </span>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {getWidgetLabel(id)}
      </p>
    </div>
  );
}

/**
 * Dashboard component displaying the main user analytics, quick actions,
 * recent account activity, and account overview. Dynamically imports
 * AnalyticsInsights below-the-fold to speed up initial route execution and
 * loading metrics.
 */
/**
 * Checks whether the account has any data by looking at available transactions
 * and other data sources. This is the single source of truth for determining
 * whether to show the onboarding empty state vs the regular dashboard.
 */
function hasAccountData(): boolean {
  return allTransactions.length > 0;
}

/**
 * Welcoming empty-state component shown on the dashboard's first paint when
 * the account is confirmed to have no data. Provides clear next-step guidance
 * so new users know what to do rather than seeing a blank dashboard.
 */
function DashboardOnboardingEmptyState() {
  const steps = [
    {
      icon: Wallet,
      title: "Connect a wallet",
      description:
        "Link your Stellar wallet to start sending and receiving payments.",
    },
    {
      icon: ArrowUpRight,
      title: "Make your first transfer",
      description:
        "Send funds to any Stellar address instantly with zero fees.",
    },
    {
      icon: BarChart3,
      title: "Explore analytics",
      description:
        "Track your transactions and account activity in real time.",
    },
  ];

  return (
    <section
      role="status"
      aria-live="polite"
      className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-elevation-1 transition-colors dark:border-zinc-800 dark:bg-[#111111] sm:p-12"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6] shadow-sm">
          <Rocket className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome to Stellopay
        </h2>
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
          Your dashboard is ready. Connect a wallet and make your first
          transaction to see your account activity, analytics, and more.
        </p>
        <div className="mb-8 grid gap-4 text-left sm:grid-cols-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6]">
                  <StepIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="mb-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {index + 1}. {step.title}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
        <Link
          href="/help/support"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#111111]"
        >
          Get started guide
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDataConfirmedEmpty, setIsDataConfirmedEmpty] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([...WIDGET_IDS]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeDragId, setActiveDragId] = useState<WidgetId | null>(null);
  const accountSummaryRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const analyticsInsightsRef = useRef<HTMLDivElement>(null);
  const clientAnalyticsRef = useRef<HTMLDivElement>(null);

  const refMap: Partial<Record<WidgetId, React.RefObject<HTMLDivElement | null>>> = useMemo(
    () => ({
      "account-overview": accountSummaryRef,
      "quick-actions": quickActionsRef,
      "analytics-insights": analyticsInsightsRef,
      "client-analytics": clientAnalyticsRef,
    }),
    [],
  );

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

  useEffect(() => {
    const saved = safeStorage.getWidgetOrder();
    if (
      saved &&
      saved.length === WIDGET_IDS.length &&
      saved.every((id) => WIDGET_IDS.includes(id as WidgetId))
    ) {
      setWidgetOrder(saved as WidgetId[]);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    safeStorage.setWidgetOrder(widgetOrder);
  }, [widgetOrder, hasHydrated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Check if the account genuinely has no data after the initial load
      if (!hasAccountData()) {
        setIsDataConfirmedEmpty(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgetOrder((items) => {
      const oldIndex = items.indexOf(active.id as WidgetId);
      const newIndex = items.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) return items;
      const result = [...items];
      const [moved] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, moved);
      return result;
    });
  }, []);

  const handleMove = useCallback(
    (id: WidgetId, direction: "up" | "down") => {
      setWidgetOrder((items) => {
        const index = items.indexOf(id);
        if (index === -1) return items;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return items;
        const result = [...items];
        const [moved] = result.splice(index, 1);
        result.splice(targetIndex, 0, moved);
        return result;
      });
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case "account-overview":
        return <AccountOverview />;
      case "quick-transfer":
        return <QuickTransfer recentRecipients={recentRecipients} />;
      case "quick-actions":
        return <QuickActions />;
      case "analytics-insights":
        return <AnalyticsInsights />;
      case "client-analytics":
        return (
          <ClientAnalyticsView
            isLoading={isLoading}
            showNotifications={true}
            showDropdown={true}
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0D0D0D] transition-colors duration-200">
      <DashboardNavbar />

      {isLoading ? (
        /* ── Loading skeleton (first paint) ──────────────────────
         * Visually distinct from the empty state. Uses a shimmer
         * animation so the user knows data is on the way.
         */
        <div
          role="status"
          aria-label="Loading dashboard"
          aria-busy="true"
          aria-live="polite"
          className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-6"
        >
          <span className="sr-only">Loading your dashboard...</span>

          {/* Header skeleton */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#111111]">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" shade="dark" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" shade="dark" />
                <Skeleton className="h-4 w-72" shade="dark" />
              </div>
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#111111]"
              >
                <Skeleton className="h-4 w-24 mb-4" shade="dark" />
                <Skeleton className="h-8 w-36 mb-2" shade="dark" />
                <Skeleton className="h-4 w-48" shade="dark" />
              </div>
            ))}
          </div>

          {/* Activity skeleton */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#111111]">
            <Skeleton className="h-5 w-36 mb-6" shade="dark" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" shade="dark" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-2/3" shade="dark" />
                    <Skeleton className="h-3 w-full" shade="dark" />
                  </div>
                  <Skeleton className="h-3 w-20" shade="dark" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isDataConfirmedEmpty ? (
        /* ── Confirmed-empty state ─────────────────────────────────
         * Only shown after loading is confirmed complete AND the
         * account has genuinely no data. Provides welcoming guidance.
         */
        <div className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <DashboardOnboardingEmptyState />
        </div>
      ) : (
        /* ── Normal dashboard with data ─────────────────────────── */
        <div className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <DndContext
            onDragStart={(event) =>
              setActiveDragId(event.active.id as WidgetId)
            }
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={widgetOrder}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="space-y-10"
                role="list"
                aria-label="Dashboard widgets"
              >
                {widgetOrder.map((id, index) => (
                  <SortableWidget
                    key={id}
                    id={id}
                    index={index}
                    total={widgetOrder.length}
                    onMove={handleMove}
                    tourRef={refMap[id]}
                  >
                    {renderWidget(id)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragId ? (
                <DashboardDragOverlay id={activeDragId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <DashboardTour
        accountSummaryRef={accountSummaryRef}
        quickActionsRef={quickActionsRef}
        analyticsInsightsRef={analyticsInsightsRef}
        clientAnalyticsRef={clientAnalyticsRef}
      />
    </div>
  );
}
