/**
 * Shortcut registry — single source of truth for every keyboard shortcut
 * exposed in the application.
 *
 * Adding a new shortcut:
 *   1. Add an entry to the relevant group (or create a new group).
 *   2. Wire the actual handler in the component / hook that owns the action.
 *   3. The shortcut help modal (`ShortcutHelpModal`) picks up the change
 *      automatically — no extra registration step required.
 *
 * Shape
 * -----
 * `ShortcutEntry`  — a single key binding with a human-readable description.
 * `ShortcutGroup`  — a labelled collection of entries (e.g. "Global", "Dashboard").
 * `SHORTCUT_GROUPS` — ordered list of groups shown in the help modal.
 */

export interface ShortcutEntry {
  /** Display label shown in the help modal, e.g. "?", "g then d". */
  keys: string[];
  /** Human-readable description of what the shortcut does. */
  description: string;
  /** Optional target route associated with the shortcut. */
  href?: string;
}

export interface ShortcutGroup {
  /** Unique identifier used as a React key. */
  id: string;
  /** Human-readable heading shown in the modal, e.g. "Global". */
  label: string;
  /** Ordered list of shortcuts in this group. */
  shortcuts: ShortcutEntry[];
}

/**
 * All application keyboard shortcuts, grouped by context.
 * Order determines display order in the help modal.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "global",
    label: "Global",
    shortcuts: [
      {
        keys: ["?"],
        description: "Show / hide this keyboard shortcut reference",
      },
      {
        keys: ["Ctrl", "K"],
        description: "Open the command palette (Cmd on Mac)",
      },
      {
        keys: ["Esc"],
        description: "Close the current modal or dismiss a popover",
      },
      {
        keys: ["/"],
        description: "Focus the search bar",
      },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    shortcuts: [
      {
        keys: ["g", "d"],
        description: "Go to Dashboard",
        href: "/dashboard",
      },
      {
        keys: ["g", "p"],
        description: "Go to Send Payment",
        href: "/payments/new",
      },
      {
        keys: ["g", "t"],
        description: "Go to Transactions",
        href: "/transactions",
      },
      {
        keys: ["g", "a"],
        description: "Go to Analytics",
        href: "/analytics-view",
      },
      {
        keys: ["g", "s"],
        description: "Go to Settings",
        href: "/settings/preferences",
      },
      {
        keys: ["g", "h"],
        description: "Go to Help & Support",
        href: "/help/support",
      },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    shortcuts: [
      {
        keys: ["r"],
        description: "Refresh account overview",
      },
      {
        keys: ["n"],
        description: "Start a new payment",
        href: "/payments/new",
      },
    ],
  },
  {
    id: "transactions",
    label: "Transactions",
    shortcuts: [
      {
        keys: ["f"],
        description: "Open the filter panel",
      },
      {
        keys: ["e"],
        description: "Export transactions as CSV",
      },
      {
        keys: ["ArrowLeft"],
        description: "Previous page",
      },
      {
        keys: ["ArrowRight"],
        description: "Next page",
      },
    ],
  },
];
