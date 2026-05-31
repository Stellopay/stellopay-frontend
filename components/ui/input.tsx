import * as React from "react";

import { cn } from "@/utils/commonUtils";

interface InputProps extends Omit<
  React.ComponentProps<"input">,
  "className" | "type"
> {
  className?: string;
  type?: React.ComponentProps<"input">["type"];
  error?: boolean;
  success?: boolean;
  warning?: boolean;
  loading?: boolean;
  helperText?: string;
  labelId?: string;
  descriptionId?: string;
  errorId?: string;
}

import { Loader2 } from "lucide-react";

function Input({
  className,
  type,
  error = false,
  success = false,
  warning = false,
  loading = false,
  helperText,
  labelId,
  descriptionId,
  errorId,
  ...props
}: InputProps) {
  const describedBy = React.useMemo(() => {
    const ids = [];
    if (descriptionId) ids.push(descriptionId);
    if (errorId && (error || success || warning)) ids.push(errorId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId, error, success, warning]);

  return (
    <div className="relative w-full">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
          "transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          // Error states
          error && "border-destructive ring-destructive/20",
          error &&
            "focus-visible:border-destructive focus-visible:ring-destructive/50",
          // Success states
          success && "border-success ring-success/20",
          success &&
            "focus-visible:border-success focus-visible:ring-success/50",
          // Warning states
          warning && "border-warning ring-warning/20",
          warning &&
            "focus-visible:border-warning focus-visible:ring-warning/50",
          // Loading state
          loading && "pr-10",
          // Default states
          !error && !success && !warning && "border-input",
          className,
        )}
        aria-invalid={error}
        aria-describedby={describedBy}
        aria-labelledby={labelId}
        disabled={props.disabled || loading}
        {...props}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {helperText && !error && !success && !warning && (
        <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export { Input };
