"use client";

/**
 * TransactionsPagination
 *
 * Consolidated, accessible pagination component for all transaction views.
 * Replaces both the old `components/transactions/pagination.tsx` and the
 * previous `transactions-pagination.tsx`.
 *
 * Features:
 * - Configurable itemsPerPage (default 10)
 * - Ellipsis for large page counts (shows at most 7 page buttons)
 * - Full keyboard navigation (arrow keys, Home, End)
 * - ARIA: role="navigation", aria-label, aria-current="page", aria-disabled
 * - "Showing X to Y of Z items" summary
 * - Jump-to-page input for direct page navigation
 */

import { useCallback, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionsPaginationProps } from "@/types/ui";
import {
  getStartIndex,
  getEndIndex,
  getTotalPages,
} from "@/utils/paginationUtils";

/** Build the page-number window shown between the Prev/Next buttons.
 *  Always shows at most 7 slots: first, last, current ±1, and ellipsis. */
function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}

/**
 * Clamps a raw page number to the valid range `[1, totalPages]`.
 *
 * @param raw        - The page number entered by the user (may be any integer).
 * @param totalPages - The maximum valid page number (inclusive).
 * @returns          The clamped page number, guaranteed to be ≥ 1 and ≤ totalPages.
 *
 * @example
 * clampPage(0, 5)  // → 1
 * clampPage(7, 5)  // → 5
 * clampPage(3, 5)  // → 3
 */
export function clampPage(raw: number, totalPages: number): number {
  return Math.min(Math.max(raw, 1), Math.max(totalPages, 1));
}

/**
 * Parses a string value coming from the jump-to-page input.
 *
 * @param value - The raw string from the `<input>` element.
 * @returns The parsed integer, or `null` when the string is empty,
 *          non-numeric, or not a finite integer.
 *
 * @example
 * parsePageInput("3")    // → 3
 * parsePageInput("")     // → null
 * parsePageInput("abc")  // → null
 * parsePageInput("2.5")  // → null   (non-integer)
 */
export function parsePageInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || !Number.isFinite(parsed)) return null;
  return parsed;
}

export default function TransactionsPagination({
  totalItems,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
}: TransactionsPaginationProps) {
  const navId = useId();
  const jumpInputId = useId();
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  // Guard: clamp currentPage to valid range
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));

  const startItem =
    totalItems === 0 ? 0 : getStartIndex(safePage, itemsPerPage) + 1;
  const endItem = Math.min(getEndIndex(safePage, itemsPerPage), totalItems);

  const isFirstPage = safePage === 1;
  const isLastPage = safePage === totalPages || totalPages === 0;

  /** Raw string value of the jump-to-page input. */
  const [jumpValue, setJumpValue] = useState("");
  /** Whether the current jump-to-page input value is invalid (non-numeric). */
  const [jumpError, setJumpError] = useState(false);

  const go = useCallback(
    (page: number) => {
      if (onPageChange && page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [onPageChange, totalPages],
  );

  /** Keyboard handler for the page-button list */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(safePage - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(safePage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(1);
      } else if (e.key === "End") {
        e.preventDefault();
        go(totalPages);
      }
    },
    [go, safePage, totalPages],
  );

  /**
   * Attempts to navigate to the page number currently in the jump input.
   *
   * - If the input is empty or non-numeric, marks the field as invalid and
   *   resets it to the current page so the user gets immediate feedback.
   * - Otherwise clamps the value to `[1, totalPages]` and calls `onPageChange`.
   */
  const handleJump = useCallback(() => {
    const parsed = parsePageInput(jumpValue);

    if (parsed === null) {
      // Non-numeric or empty — show error state and reset to current page
      setJumpError(true);
      setJumpValue(String(safePage));
      return;
    }

    setJumpError(false);
    setJumpValue("");
    go(clampPage(parsed, totalPages));
  }, [jumpValue, safePage, totalPages, go]);

  /** Allow submitting the jump input with the Enter key. */
  const handleJumpKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleJump();
      }
    },
    [handleJump],
  );

  const pageRange = buildPageRange(safePage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      aria-labelledby={navId}
      tabIndex={0}
      className="flex flex-col items-center justify-center mt-6 gap-4 lg:flex-row focus:outline-none"
      onKeyDown={handleKeyDown}
    >
      {/* Screen-reader-only label */}
      <span id={navId} className="sr-only">
        Pagination navigation
      </span>

      {/* Item summary */}
      <span
        className="text-gray-400 text-sm order-2 lg:order-1"
        aria-live="polite"
      >
        Showing {startItem} to {endItem} of {totalItems} items
      </span>

      {/* Page controls */}
      <div
        className="flex items-center justify-center gap-2 order-1 lg:order-2"
        role="group"
        aria-label="Page navigation"
      >
        {/* Previous */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(safePage - 1)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          aria-disabled={isFirstPage}
          className="w-8 h-8 p-0 text-gray-400 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Page numbers */}
        {pageRange.map((slot, idx) =>
          slot === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              aria-hidden="true"
              className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={slot}
              variant="ghost"
              size="sm"
              onClick={() => go(slot)}
              aria-label={`Page ${slot}`}
              aria-current={slot === safePage ? "page" : undefined}
              className={`w-8 h-8 p-0 text-sm ${
                slot === safePage
                  ? "bg-white text-black hover:bg-white"
                  : "text-gray-400 hover:text-black hover:bg-white"
              }`}
            >
              {slot}
            </Button>
          ),
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(safePage + 1)}
          disabled={isLastPage}
          aria-label="Go to next page"
          aria-disabled={isLastPage}
          className="w-8 h-8 p-0 text-gray-400 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Jump-to-page controls */}
      <div
        className="flex items-center gap-2 order-3"
        role="group"
        aria-label="Jump to page"
      >
        <label
          htmlFor={jumpInputId}
          className="text-gray-400 text-sm whitespace-nowrap"
        >
          Go to page
        </label>
        <Input
          id={jumpInputId}
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => {
            setJumpValue(e.target.value);
            setJumpError(false);
          }}
          onKeyDown={handleJumpKeyDown}
          error={jumpError}
          aria-label="Jump to page number"
          data-testid="jump-to-page-input"
          aria-describedby={jumpError ? `${jumpInputId}-error` : undefined}
          className="w-16 h-8 text-sm text-center"
          placeholder={String(safePage)}
        />
        {jumpError && (
          <span
            id={`${jumpInputId}-error`}
            role="alert"
            className="sr-only"
          >
            Please enter a valid page number.
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleJump}
          aria-label="Go to entered page"
          className="h-8 px-3 text-sm text-gray-400 hover:bg-white hover:text-black"
        >
          Go
        </Button>
      </div>
    </nav>
  );
}
