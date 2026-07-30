"use client";

import React from "react";
import { AccountSummaryCardProps } from './summary-data';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatUtils';
import { StatCard } from '@/components/ui/stat-card';

const RechartsMiniBarChart = dynamic(
  () => import('./RechartsMiniBarChart').then(mod => mod.RechartsMiniBarChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-end"
        style={{ height: '3rem' }}
        aria-label="Loading chart"
        role="img"
      >
        <Skeleton className="w-full h-full rounded-[4px]" shade="dark" />
      </div>
    ),
  },
);

export default function AccountSummaryCard({
  title,
  subtitle,
  value,
  change,
  isPositive,
  icon,
  iconBgColor,
  chartColor,
  chartData,
  currency,
  decimals,
  filterQuery,
}: AccountSummaryCardProps) {
  const displayValue =
    typeof value === 'number'
      ? formatCurrency(value, currency, decimals)
      : value;

  const href =
    filterQuery !== undefined
      ? `/transactions?filter=${encodeURIComponent(filterQuery)}`
      : undefined;

  return (
    <StatCard
      size="sm"
      title={title}
      subtitle={subtitle}
      value={displayValue}
      valueTestId="account-summary-card-value"
      icon={icon}
      iconBgColor={iconBgColor}
      change={change}
      isPositive={isPositive}
      chartSlot={
        <RechartsMiniBarChart
          data={chartData}
          color={chartColor}
          ariaLabel={`${title} mini chart`}
          height="3rem"
        />
      }
      href={href}
      testId={href ? "account-summary-card-link" : undefined}
      ariaLabel={href ? `View ${title} transactions` : undefined}
    />
  );
}
