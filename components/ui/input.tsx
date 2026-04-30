import * as React from "react";

import { cn } from "@/utils/commonUtils";

interface InputProps extends Omit<
  React.ComponentProps<"input">,
  "className" | "type"
> {
  className?: string;
  type?: React.ComponentProps<"input">["type"];
  error?: boolean;
  helperText?: string;
  labelId?: string;
  descriptionId?: string;
  errorId?: string;
}

function Input({
  className,
  type,
  error = false,
  helperText,
  labelId,
  descriptionId,
  errorId,
  ...props
}: InputProps) {
  const describedBy = React.useMemo(() => {
    const ids = [];
    if (descriptionId) ids.push(descriptionId);
    if (errorId && error) ids.push(errorId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId, error]);

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
          // Default states
          !error && "border-input",
          className,
        )}
        aria-invalid={error}
        aria-describedby={describedBy}
        aria-labelledby={labelId}
        {...props}
      />
      {helperText && !error && (
        <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export { Input };
