import * as React from "react";

import { cn } from "@/utils/commonUtils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: boolean;
  success?: boolean;
  warning?: boolean;
}

function Textarea({
  className,
  error = false,
  success = false,
  warning = false,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 border-input flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs",
        "transition-[color,box-shadow] outline-none",
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
        // Default states
        !error && !success && !warning && "border-input",
        className,
      )}
      aria-invalid={error}
      {...props}
    />
  );
}

export { Textarea };
