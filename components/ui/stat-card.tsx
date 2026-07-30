"use client";

import React, { FC, ReactNode } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  /** Size variant: "sm" (compact/dashboard) or "lg" (large/landing). Defaults to "sm". */
  size?: "sm" | "lg";
  /** Main title / label for the card */
  title?: ReactNode;
  /** Secondary subtitle (used primarily in compact/dashboard scale) */
  subtitle?: ReactNode;
  /** Primary stat value (string, number, or animated React component) */
  value: ReactNode;
  /** Optional data-testid attribute for value element */
  valueTestId?: string;
  /** Optional icon element (rendered at top left in compact scale) */
  icon?: ReactNode;
  /** Optional background styling class for icon container */
  iconBgColor?: string;
  /** Trend change text (e.g. "+12.5% vs last month") */
  change?: string;
  /** Is the trend positive (emerald) or negative (rose) */
  isPositive?: boolean;
  /** Custom trend component or element override */
  trendSlot?: ReactNode;
  /** Optional bottom slot (e.g., mini chart component) */
  chartSlot?: ReactNode;
  /** Optional link destination for card drilldown */
  href?: string;
  /** Accessible label when card is rendered as a link */
  ariaLabel?: string;
  /** Additional CSS class names for the container */
  className?: string;
  /** Optional data-testid attribute for the card container */
  testId?: string;
}

export const StatCard: FC<StatCardProps> = ({
  size = "sm",
  title,
  subtitle,
  value,
  valueTestId,
  icon,
  iconBgColor,
  change,
  isPositive,
  trendSlot,
  chartSlot,
  href,
  ariaLabel,
  className = "",
  testId,
}) => {
  const isLarge = size === "lg";

  const renderTrend = () => {
    if (trendSlot) return trendSlot;
    if (!change) return null;

    const parts = change.split(" ");
    const badgeText = parts[0];
    const restText = parts.slice(1).join(" ");

    return (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap min-w-0">
        <div
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
            isPositive
              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
              : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
          }`}
        >
          {isPositive !== undefined &&
            (isPositive ? (
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-hidden="true" />
            ))}
          {badgeText}
        </div>
        {restText && (
          <span className="text-xs text-zinc-600 dark:text-zinc-500 truncate">
            {restText}
          </span>
        )}
      </div>
    );
  };

  const cardContent = isLarge ? (
    <>
      <span
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6B47ED] dark:text-[#A78BFA] tracking-tight block"
        data-testid={valueTestId}
      >
        {value}
      </span>
      {title && (
        <span className="mt-2 text-sm md:text-base font-normal text-[#52525B] dark:text-[#A3A3A3]">
          {title}
        </span>
      )}
    </>
  ) : (
    <>
      {(icon || title || subtitle) && (
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className={`w-12 h-12 rounded-xl ${iconBgColor || ""} flex items-center justify-center shrink-0`}
              >
                {icon}
              </div>
            )}
            {(title || subtitle) && (
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-0">
        <div
          className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight truncate max-w-full min-w-0"
          title={
            typeof value === "string" || typeof value === "number"
              ? String(value)
              : undefined
          }
          data-testid={valueTestId}
        >
          {value}
        </div>
        {renderTrend()}
      </div>

      {chartSlot}
    </>
  );

  const baseClasses = isLarge
    ? `bg-white dark:bg-[#18181B] rounded-2xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] px-6 py-8 md:px-8 md:py-10 flex flex-col items-center justify-center text-center ${className}`.trim()
    : `bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm transition-all min-w-0 overflow-hidden ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        data-testid={testId}
        aria-label={ariaLabel}
        className={`${baseClasses} cursor-pointer hover:shadow-md hover:border-zinc-400 dark:hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#09090B]`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={baseClasses} data-testid={testId}>
      {cardContent}
    </div>
  );
};
