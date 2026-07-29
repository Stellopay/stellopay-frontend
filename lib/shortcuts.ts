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
      },
      {
        keys: ["g", "t"],
        description: "Go to Transactions",
      },
      {
        keys: ["g", "a"],
        description: "Go to Analytics",
      },
      {
        keys: ["g", "s"],
        description: "Go to Settings",
      },
      {
        keys: ["g", "h"],
        description: "Go to Help & Support",
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
