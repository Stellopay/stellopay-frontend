"use client";

import React from "react";
import { Inbox, SearchX, AlertTriangle, WifiOff } from "lucide-react";
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

/**
 * The four empty-surface situations this primitive covers.
 *
 * `default`  nothing has been created yet.
 * `search`   a query or filter matched nothing (the data exists, the filter is
 *            too narrow).
 * `error`    the data could not be loaded. Rendered in the danger tone and
 *            announced assertively, because the user's action failed.
 * `offline`  the device has no connection, so the surface cannot be filled.
 */
export type EmptyStateVariant = "default" | "search" | "error" | "offline";

interface VariantConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "neutral" | "danger";
  role: "status" | "alert";
  live: "polite" | "assertive";
  /** Default CTA label used when only `onRetry` is supplied. */
  actionLabel: string;
}

/**
 * Per-variant defaults. Copy lives here so features stop hand-rolling their
 * own wording for the same four situations; any string can still be overridden
 * with the `title` / `description` props.
 */
const VARIANTS: Record<EmptyStateVariant, VariantConfig> = {
  default: {
    icon: <Inbox />,
    title: "Nothing here yet",
    description: "Items you create will show up in this space.",
    tone: "neutral",
    role: "status",
    live: "polite",
    actionLabel: "Clear Filters",
  },
  search: {
    icon: <SearchX />,
    title: "No matching results",
    description:
      "No results match your search or filters. Try a different term or clear the filters.",
    tone: "neutral",
    role: "status",
    live: "polite",
    actionLabel: "Clear Filters",
  },
  error: {
    icon: <AlertTriangle />,
    title: "Something went wrong",
    description:
      "We couldn't load this content. Please try again in a moment.",
    tone: "danger",
    role: "alert",
    live: "assertive",
    actionLabel: "Try Again",
  },
  offline: {
    icon: <WifiOff />,
    title: "You're offline",
    description:
      "Check your internet connection, then reload to see this content.",
    tone: "neutral",
    role: "status",
    live: "polite",
    actionLabel: "Retry",
  },
};

export interface EmptyStateProps {
  /**
   * Which empty-surface situation this is. Selects the default icon, copy,
   * colour tone and live-region urgency. Defaults to `default`.
   *
   * @example
   * // Filter matched nothing — variant copy is enough.
   * <EmptyState variant="search" onRetry={clearFilters} />
   *
   * @example
   * // Failed request: danger tone, role="alert", assertive announcement.
   * <EmptyState variant="error" action={{ label: "Retry", onClick: refetch }} />
   *
   * @example
   * // Variant defaults with feature-specific copy layered on top.
   * <EmptyState
   *   variant="offline"
   *   description="Your transactions will sync once you're back online."
   * />
   */
  variant?: EmptyStateVariant;
  /**
   * Illustration slot. Accepts any custom SVG or `next/image` element and
   * replaces the icon entirely; the icon-only path stays the default when this
   * is omitted. The illustration is decorative (the panel marks it
   * `aria-hidden`), so the title and description must carry the meaning.
   *
   * @example
   * <EmptyState
   *   title="No wallets"
   *   description="Add your first wallet to get started."
   *   illustration={<EmptyWalletSvg />}
   *   action={{ label: "Add wallet", onClick: handleAdd }}
   * />
   */
  illustration?: React.ReactNode;
  /** The icon to display. Defaults to the variant's icon. */
  icon?: React.ReactNode;
  /** The empty state title. Defaults to the variant's title. */
  title?: string;
  /**
   * A user-friendly description of why the state is empty or how to populate
   * it. Defaults to the variant's description.
   */
  description?: string;
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
   * Optional custom action text if onRetry is provided. Defaults to the
   * variant's action label ("Clear Filters" for `default` and `search`).
   */
  actionLabel?: string;
}

/**
 * The canonical empty-state primitive.
 *
 * Displays an icon (or a custom illustration), title, and description for
 * empty lists and data surfaces, with an optional call-to-action button via
 * the `action` prop (preferred) or the legacy `onRetry` + `actionLabel` pair.
 *
 * Pick a `variant` first — `default`, `search`, `error` or `offline` — and only
 * override `title` / `description` when the feature needs more specific
 * wording. Features should reach for this component rather than re-creating
 * empty-state markup, so spacing, tone and announcement behaviour stay
 * consistent across the app.
 *
 * @example Bare minimum: variant copy only.
 * <EmptyState variant="search" />
 *
 * @example List with a create action.
 * <EmptyState
 *   title="No transactions"
 *   description="Transactions you send will appear here."
 *   action={{ label: "New transaction", onClick: openComposer }}
 * />
 *
 * @example Custom illustration instead of the icon.
 * <EmptyState variant="default" illustration={<EmptyBoxSvg />} />
 *
 * Layout is delegated to {@link StatePanel}, the pattern shared with
 * `ErrorState`, so the two stay visually aligned. Only the semantic
 * differences live here: the variant icon, tone, and live-region urgency.
 *
 * Accessibility: the neutral variants use `role="status"` with
 * `aria-live="polite"` so screen readers announce the empty state when it
 * appears without interrupting the current reading flow — an empty result is
 * not an error, so it must not preempt whatever the user is already hearing.
 * The `error` variant is the exception: it uses `role="alert"` with
 * `aria-live="assertive"` because the user's request failed. Icons and
 * illustrations are decorative and hidden from assistive tech, so meaning is
 * never carried by glyph or colour alone (SC 1.4.1).
 */
export function EmptyState({
  variant = "default",
  illustration,
  icon,
  title,
  description,
  action,
  onRetry,
  actionLabel,
}: EmptyStateProps) {
  const config = VARIANTS[variant];

  // Resolve the CTA: the new `action` prop wins; fall back to the legacy pair.
  const resolvedAction: EmptyStateAction | null = action
    ? action
    : onRetry
      ? { label: actionLabel ?? config.actionLabel, onClick: onRetry }
      : null;

  // The illustration slot wins over the icon. Wrapping it keeps StatePanel's
  // icon sizing (which targets direct `svg` children) from shrinking artwork
  // to icon dimensions, while still bounding it on narrow viewports.
  const decoration = illustration ? (
    <div className="mx-auto w-full max-w-[220px] [&>*]:h-auto [&>*]:w-full">
      {illustration}
    </div>
  ) : (
    (icon ?? config.icon)
  );

  return (
    <StatePanel
      tone={config.tone}
      role={config.role}
      live={config.live}
      icon={decoration}
      title={title ?? config.title}
      description={description ?? config.description}
    >
      {resolvedAction && (
        <StatePanelAction tone={config.tone} onClick={resolvedAction.onClick}>
          {resolvedAction.label}
        </StatePanelAction>
      )}
    </StatePanel>
  );
}
