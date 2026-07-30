"use client";

import React from "react";
import { Inbox } from "lucide-react";
import { StatePanel, StatePanelAction } from "@/components/ui/state-panel";

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
 * Layout is delegated to {@link StatePanel}, the pattern shared with
 * `ErrorState`, so the two stay visually aligned. Only the semantic
 * differences live here: the inbox icon, the neutral tone, and the polite
 * live-region urgency.
 *
 * Accessibility: uses `role="status"` with `aria-live="polite"` so screen
 * readers announce the empty state when it appears without interrupting the
 * current reading flow. An empty result is not an error, so it must not
 * preempt whatever the user is already hearing.
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
    <StatePanel
      tone="neutral"
      role="status"
      live="polite"
      icon={icon || <Inbox />}
      title={title}
      description={description}
    >
      {resolvedAction && (
        <StatePanelAction tone="neutral" onClick={resolvedAction.onClick}>
          {resolvedAction.label}
        </StatePanelAction>
      )}
    </StatePanel>
  );
}
