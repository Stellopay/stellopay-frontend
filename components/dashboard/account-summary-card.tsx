'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";
import { AccountSummaryCardProps } from './summary-data';
import { RechartsMiniBarChart } from './RechartsMiniBarChart';

export default function AccountSummaryCard({
  title,
  subtitle,
  value,
  change,
  isPositive,
  icon,
  iconBgColor,
  chartColor,
  chartData
}: AccountSummaryCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isPositive
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
              : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change.split(' ')[0]}
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-500">
            {change.split(' ').slice(1).join(' ')}
          </span>
        </div>
      </div>

       <RechartsMiniBarChart data={chartData} color={chartColor} ariaLabel={`${title} mini chart`} height="3rem" />
    </div>
  );
}
