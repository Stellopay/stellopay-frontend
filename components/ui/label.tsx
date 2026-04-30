"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/utils/commonUtils";

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean;
  error?: boolean;
  descriptionId?: string;
}

function Label({
  className,
  required,
  error = false,
  descriptionId,
  children,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "transition-colors duration-200",
        error && "text-destructive",
        !error && "text-foreground",
        className,
      )}
      aria-required={required}
      aria-describedby={descriptionId}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive" aria-label="required field">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };
