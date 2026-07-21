"use client";

import React from "react";
import { Inbox } from "lucide-react";

/**
 * Descriptor for the optional call-to-action button rendered inside
 * EmptyState.  Passing this prop is the preferred way to add a primary CTA
 * (e.g. "Add your first wallet", "Create a transaction") to any empty state.
 *
 * The legacy `onRetry` + `actionLabel` pair is still supported for backward
 * compatibility but `action` takes precedence when both are supplied.
 */
export interface EmptyStateAction {
  /** Button label shown to the user, e.g. "Add your first wallet". */
  label: string;
  /** Handler invoked when the button is clicked. */
  onClick: () => void;
}

export interface EmptyStateProps {
  /** The icon to display. Defaults to an inbox icon. */
  icon?: React.ReactNode;
  /** The empty state title. */
  title: string;
  /** A user-friendly description of why the state is empty or how to populate it. */
  description: string;
  /**
   * Optional call-to-action button slot.
   *
   * When provided, renders a primary action button below the description.
   * Takes precedence over the legacy `onRetry` / `actionLabel` pair.
   *
   * @example
   * <EmptyState
   *   title="No wallets"
   *   description="Add your first wallet to get started."
   *   action={{ label: "Add wallet", onClick: handleAdd }}
   * />
   */
  action?: EmptyStateAction;
  /**
   * @deprecated Use the `action` prop instead.
   * Optional callback to trigger an action (like retry or clear filters).
   */
  onRetry?: () => void;
  /**
   * @deprecated Use the `action` prop instead.
   * Optional custom action text if onRetry is provided. Defaults to "Clear Filters".
   */
  actionLabel?: string;
}

/**
 * Reusable EmptyState component.
 *
 * Displays an icon, title, and description for empty lists or data surfaces.
 * An optional call-to-action button can be added via the `action` prop
 * (preferred) or the legacy `onRetry` + `actionLabel` pair.
 *
 * Accessibility: uses `role="status"` with `aria-live="polite"` so screen
 * readers announce the empty state when it appears without interrupting the
 * current reading flow.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  onRetry,
  actionLabel = "Clear Filters",
}: EmptyStateProps) {
  // Resolve the CTA: the new `action` prop wins; fall back to the legacy pair.
  const resolvedAction: EmptyStateAction | null = action
    ? action
    : onRetry
      ? { label: actionLabel, onClick: onRetry }
      : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center border border-[#2D2D2D] bg-[#111111] rounded-xl"
    >
      <div className="text-zinc-500 mb-4">
        {icon || <Inbox className="w-10 h-10" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6">{description}</p>
      {resolvedAction && (
        <button
          onClick={resolvedAction.onClick}
          className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3A3A3A] transition-colors text-white text-sm font-medium rounded-lg"
        >
          {resolvedAction.label}
        </button>
      )}
    </div>
  );
}
