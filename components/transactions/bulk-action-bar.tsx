"use client";

import { Archive, Download, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  /** Number of currently selected rows. Must be > 0 to render. */
  selectedCount: number;
  onExport: () => void;
  onTag: () => void;
  onArchive: () => void;
  onClearSelection: () => void;
}

/**
 * Floating bar that appears at the bottom of the viewport when one or more
 * transaction rows are selected.  Provides Export, Tag, and Archive actions
 * plus a button to dismiss the selection.
 *
 * Accessibility notes (WCAG 2.1 AA):
 *  - role="toolbar" with aria-label groups the action buttons semantically.
 *  - The dismiss button has an explicit aria-label so its purpose is clear to
 *    screen readers even though it only contains an icon.
 *  - The bar is rendered inside an aria-live="polite" region in the parent so
 *    selection-count changes are announced without interrupting the user.
 *  - All interactive elements are reachable by keyboard (Tab / Enter / Space).
 *  - Focus is not programmatically moved into the bar; users reach it through
 *    normal tab order.
 */
export function BulkActionBar({
  selectedCount,
  onExport,
  onTag,
  onArchive,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const label =
    selectedCount === 1 ? "1 transaction selected" : `${selectedCount} transactions selected`;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={[
        // Positioning: fixed to viewport bottom, centered horizontally
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        // Layout
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        // Visual style – dark glass card consistent with the dashboard palette
        "bg-[#1e1a1f] border border-[#3E3E3E] shadow-2xl",
        // Smooth entrance
        "animate-in slide-in-from-bottom-4 duration-200",
      ].join(" ")}
      data-testid="bulk-action-bar"
    >
      {/* Selected count label */}
      <span className="text-sm text-[#D7E0EF] font-medium whitespace-nowrap pr-1">
        {label}
      </span>

      <div
        role="toolbar"
        aria-label="Bulk action buttons"
        className="flex items-center gap-2"
      >
        {/* Export */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="text-[#D7E0EF] hover:bg-[#2D2D2D] hover:text-white gap-1.5"
        >
          <Download className="size-4" aria-hidden="true" />
          Export
        </Button>

        {/* Tag */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onTag}
          className="text-[#D7E0EF] hover:bg-[#2D2D2D] hover:text-white gap-1.5"
        >
          <Tag className="size-4" aria-hidden="true" />
          Tag
        </Button>

        {/* Archive */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onArchive}
          className="text-[#D7E0EF] hover:bg-[#2D2D2D] hover:text-white gap-1.5"
        >
          <Archive className="size-4" aria-hidden="true" />
          Archive
        </Button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#3E3E3E] mx-1" aria-hidden="true" />

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="text-[#D7E0EF] hover:bg-[#2D2D2D] hover:text-white size-8"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
