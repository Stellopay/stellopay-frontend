import type { ComponentType } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/commonUtils";

interface StateIconProps {
  className?: string;
}

export interface ErrorStateProps {
  title: string;
  description: string;
  icon?: ComponentType<StateIconProps>;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Accessible, tokenized error state for async surfaces.
 *
 * Security: pass friendly copy only. Do not render raw exception messages,
 * stack traces, request bodies, or service responses through this component.
 */
export default function ErrorState({
  title,
  description,
  icon: Icon = AlertCircle,
  retryLabel = "Try again",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 px-6 py-8 text-center",
        className,
      )}
    >
      <Icon className="mb-3 size-6 text-destructive" aria-hidden="true" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button type="button" onClick={onRetry} className="mt-4">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
