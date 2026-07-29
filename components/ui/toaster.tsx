"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/context/theme-context";

/**
 * Single app-wide Sonner instance, mounted once in `app/layout.tsx`.
 * Tracks the app's own light/dark resolution (not sonner's OS-only
 * `theme="system"`) so toasts always match the rest of the UI, and every
 * toast keeps a visible border plus a `Loader2`-style spinner-free close
 * button that is reachable by keyboard.
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      richColors
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          success: "!text-success",
          error: "!text-destructive",
          closeButton:
            "border-border bg-popover text-popover-foreground hover:bg-popover",
        },
      }}
      {...props}
    />
  );
}
