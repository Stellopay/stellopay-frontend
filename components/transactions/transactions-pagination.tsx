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
 */

import { useCallback, useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function TransactionsPagination({
  totalItems,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
}: TransactionsPaginationProps) {
  const navId = useId();
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  // Guard: clamp currentPage to valid range
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));

  const startItem = totalItems === 0 ? 0 : getStartIndex(safePage, itemsPerPage) + 1;
  const endItem = Math.min(getEndIndex(safePage, itemsPerPage), totalItems);

  const isFirstPage = safePage === 1;
  const isLastPage = safePage === totalPages || totalPages === 0;

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
      if (e.key === "ArrowLeft") { e.preventDefault(); go(safePage - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(safePage + 1); }
      else if (e.key === "Home") { e.preventDefault(); go(1); }
      else if (e.key === "End") { e.preventDefault(); go(totalPages); }
    },
    [go, safePage, totalPages],
  );

  const pageRange = buildPageRange(safePage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      aria-labelledby={navId}
      className="flex flex-col items-center justify-center mt-6 gap-4 lg:flex-row"
      onKeyDown={handleKeyDown}
    >
      {/* Screen-reader-only label */}
      <span id={navId} className="sr-only">
        Pagination navigation
      </span>

      {/* Item summary */}
      <span className="text-gray-400 text-sm order-2 lg:order-1" aria-live="polite">
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
    </nav>
  );
}
