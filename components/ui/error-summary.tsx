"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import type { FieldErrors, FieldValues } from "react-hook-form";

export interface ErrorSummaryProps<T extends FieldValues> {
  /** React Hook Form errors object. Only fields with messages are shown. */
  errors: FieldErrors<T>;
  /**
   * An optional mapping from field name to the `id` of the DOM element that
   * should receive focus when the link is activated. When omitted, the link
   * uses `#field-${fieldName}`.
   */
  fieldIdMap?: Record<string, string>;
  /**
   * Optional additional CSS classes.
   */
  className?: string;
}

/**
 * ErrorSummary — an accessible form-level error summary that lists all
 * validation errors with anchor links jumping to each field.
 *
 * Rendered above the form on failed submit. Focus is moved to this component
 * on mount (i.e. when errors change) so keyboard and screen reader users
 * immediately hear the full list of problems.
 *
 * WCAG 2.1 AA: Satisfies SC 3.3.1 (Error Identification) and SC 2.4.3
 * (Focus Order) by listing all errors together with links that move focus
 * to each field.
 *
 * @example
 * ```tsx
 * const form = useForm({ resolver: zodResolver(mySchema) });
 *
 * <ErrorSummary errors={form.formState.errors} />
 *
 * {form.formState.errors.root && (
 *   <ErrorSummary errors={form.formState.errors} />
 * )}
 * ```
 */
export function ErrorSummary<T extends FieldValues>({
  errors,
  fieldIdMap,
  className = "",
}: ErrorSummaryProps<T>) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const errorEntries = Object.entries(errors).filter(
    ([, value]) =>
      value &&
      typeof value === "object" &&
      "message" in value &&
      value.message,
  );

  // Move focus to the summary when errors appear
  useEffect(() => {
    if (errorEntries.length > 0 && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [errorEntries.length]);

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${className}`}
      data-testid="error-summary"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold text-red-800 dark:text-red-300"
            id="error-summary-heading"
          >
            {errorEntries.length === 1
              ? "There is 1 error"
              : `There are ${errorEntries.length} errors`}
          </h3>
          <ul
            aria-labelledby="error-summary-heading"
            className="mt-2 space-y-1"
          >
            {errorEntries.map(([fieldName, error]) => {
              const fieldId = fieldIdMap?.[fieldName] ?? `field-${fieldName}`;
              const message =
                error && typeof error === "object" && "message" in error
                  ? String(error.message)
                  : "";

              return (
                <li key={fieldName} className="text-sm">
                  <a
                    href={`#${fieldId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      // Try by explicit ID first, then by name attribute
                      const element =
                        document.getElementById(fieldId) ??
                        document.querySelector<HTMLElement>(
                          `[name="${fieldName}"]`,
                        );
                      if (element) {
                        element.focus();
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                    className="text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded dark:text-red-300 dark:hover:text-red-200"
                  >
                    <span className="font-medium">{getFieldLabel(fieldName)}</span>
                    {message && <span>: {message}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Converts a camelCase field name to a human-readable label.
 * e.g. "newPassword" → "New password", "confirmPassword" → "Confirm password"
 */
function getFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
