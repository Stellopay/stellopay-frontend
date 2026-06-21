import type { ComponentType } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/utils/commonUtils";

interface StateIconProps {
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ComponentType<StateIconProps>;
  className?: string;
}

/**
 * Accessible empty state for list, table, and chart surfaces.
 */
export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 px-6 py-8 text-center",
        className,
      )}
    >
      <Icon className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
