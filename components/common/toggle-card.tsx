"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/commonUtils";
import { ToggleCardProps } from "@/types/ui";

export default function ToggleCard({
  title,
  description,
  badge,
  enabled,
  disabled = false,
  onToggle,
}: ToggleCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 text-zinc-900 shadow-sm transition-all dark:border-white/10 dark:bg-white/5 dark:text-white">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium md:text-base">{title}</span>
          {badge ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-300"
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        className={cn(
          "flex h-8 w-14 items-center rounded-full p-1 duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#09090B]",
          enabled
            ? "bg-zinc-900 dark:bg-white"
            : "bg-zinc-300 dark:bg-zinc-700",
        )}
      >
        <div
          className={cn(
            "h-6 w-6 rounded-full bg-white shadow-md duration-300 ease-in-out dark:bg-[#09090B]",
            enabled ? "translate-x-6" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
