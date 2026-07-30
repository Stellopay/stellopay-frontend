import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/commonUtils";

export interface ChartData {
  value: number;
}

export interface AccountSummaryCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: ReactNode;
  iconBgColor: string;
  chartColor: string;
  chartData: ChartData[];
  currency?: string;
  decimals?: number;
  /**
   * Optional filter query value used for drill-down navigation.
   * When set, clicking the card deep-links to /transactions?filter=XXX.
   */
  filterQuery?: string;
}

export const summaryCardsData: AccountSummaryCardProps[] = [
  {
    title: "Total Balance",
    subtitle: "Across all chains",
    value: "$847,500.00",
    change: "+12.5% vs last month",
    isPositive: true,
    iconBgColor: "bg-blue-500/10",
design-system/mini-bar-chart-dark-tokens
    chartColor: "--chart-1",

    chartColor: "var(--chart-blue)",
 main
    icon: null, // Will be replaced with actual icon component
    filterQuery: "",
    chartData: [
      { value: 40 },
      { value: 70 },
      { value: 45 },
      { value: 90 },
      { value: 65 },
      { value: 50 },
      { value: 80 },
      { value: 35 },
      { value: 100 },
      { value: 75 },
    ],
  },
  {
    title: "Paid This Month",
    subtitle: "24 transactions",
    value: "$125,340.00",
    change: "+8.2% vs last month",
    isPositive: true,
    iconBgColor: "bg-emerald-500/10",
 design-system/mini-bar-chart-dark-tokens
    chartColor: "--chart-2",

    chartColor: "var(--chart-green)",
 main
    icon: null,
    filterQuery: "Payment Sent",
    chartData: [
      { value: 30 },
      { value: 50 },
      { value: 40 },
      { value: 70 },
      { value: 55 },
      { value: 45 },
      { value: 85 },
      { value: 35 },
      { value: 60 },
      { value: 75 },
    ],
  },
  {
    title: "To Be Paid",
    subtitle: "12 pending contracts",
    value: "$54,200.00",
    change: "-3.1% vs last month",
    isPositive: false,
    iconBgColor: "bg-amber-500/10",
 design-system/mini-bar-chart-dark-tokens
    chartColor: "--chart-3",

    chartColor: "var(--chart-amber)",
 main
    icon: null,
    filterQuery: "Payment Received",
    chartData: [
      { value: 60 },
      { value: 40 },
      { value: 80 },
      { value: 50 },
      { value: 90 },
      { value: 45 },
      { value: 70 },
      { value: 35 },
      { value: 85 },
      { value: 65 },
    ],
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

/**
 * Skeleton placeholder for a single {@link AccountSummaryCard}.
 *
 * The layout intentionally mirrors the real card's structure so that no
 * layout shift occurs when the resolved content replaces the skeleton:
 *
 * ```
 * ┌────────────────────────────────────────┐
 * │  [icon]  [title]                       │
 * │          [subtitle]                    │
 * ├────────────────────────────────────────┤
 * │  [value — wide]                        │
 * │  [badge]  [label]                      │
 * ├────────────────────────────────────────┤
 * │  [mini bar chart]                      │
 * └────────────────────────────────────────┘
 * ```
 *
 * @param className - Extra Tailwind classes forwarded to the card wrapper.
 * @param shade     - Passed through to every {@link Skeleton} child so the
 *   placeholder blends with the host surface (light or dark).
 */
export function SummaryCardSkeleton({
  className,
  shade = "dark",
}: {
  className?: string;
  shade?: "light" | "dark";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800",
        "rounded-2xl p-6 flex flex-col gap-4 shadow-elevation-1",
        className,
      )}
    >
      {/* Row 1: icon + title / subtitle */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Icon placeholder — matches w-12 h-12 rounded-xl */}
          <Skeleton shade={shade} className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            {/* title — text-sm */}
            <Skeleton shade={shade} className="h-3 w-28" />
            {/* subtitle — text-xs */}
            <Skeleton shade={shade} className="h-2.5 w-20" />
          </div>
        </div>
      </div>

      {/* Row 2: value + change badge */}
      <div className="flex flex-col gap-1">
        {/* value — text-3xl font-bold */}
        <Skeleton shade={shade} className="h-8 w-36" />
        <div className="flex items-center gap-1.5 mt-1">
          {/* change badge pill */}
          <Skeleton shade={shade} className="h-5 w-16 rounded-full" />
          {/* "vs last month" label */}
          <Skeleton shade={shade} className="h-3 w-24" />
        </div>
      </div>

      {/* Row 3: mini bar chart — matches h-[3rem] used by RechartsMiniBarChart */}
      <Skeleton shade={shade} className="h-12 w-full rounded-lg" />
    </div>
  );
}

/**
 * Grid of three {@link SummaryCardSkeleton} placeholders.
 *
 * Drop this in wherever the real cards grid would appear while data is
 * loading. The grid columns match `AccountOverview`'s cards grid exactly
 * (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) so there is no layout
 * shift when the real grid mounts.
 *
 * Accessibility: the wrapper carries `role="status"` and
 * `aria-label="Loading account summary"` so screen readers announce the
 * loading state without reading out the individual skeleton elements
 * (each card is `aria-hidden`).
 *
 * @param shade - Forwarded to every {@link SummaryCardSkeleton}.
 */
export function SummaryCardsSkeleton({
  shade = "dark",
}: {
  shade?: "light" | "dark";
}) {
  return (
    <div
      role="status"
      aria-label="Loading account summary"
      aria-busy="true"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: summaryCardsData.length }).map((_, i) => (
        <SummaryCardSkeleton key={i} shade={shade} />
      ))}
    </div>
  );
}
