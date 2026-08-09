/**
 * Shortcut registry — a single source of truth for every keyboard shortcut
 * in the app. New shortcuts are easy to add: just extend the array.
 *
 * Grouping is by area (global, dashboard, transactions). The same data
 * powers the '?' help modal so it's always in sync.
 */

export interface ShortcutEntry {
  /** Human-readable label shown in the help modal. */
  label: string;
  /** Keys the user presses (e.g. "?" or "g + t"). */
  keys: string;
  /** Area grouping key. */
  group: 'global' | 'dashboard' | 'transactions' | 'settings';
  /**
   * Optional description that appears in the help modal.
   * When omitted, the `label` is used as the description.
   */
  description?: string;
}

/**
 * All registered shortcuts. Keep sorted by group then label.
 * Feel free to add new entries as features ship.
 */
export const SHORTCUTS: ShortcutEntry[] = [
  // ── Global ────────────────────────────────────────────────────
  {
    label: 'Open keyboard-shortcut help',
    keys: '?',
    group: 'global',
    description: 'Shows this modal listing every available shortcut.',
  },
  {
    label: 'Skip to main content',
    keys: 'Ctrl / Cmd + 1',
    group: 'global',
    description: 'Moves keyboard focus directly to the main content area.',
  },
  {
    label: 'Go to Dashboard',
    keys: 'g + d',
    group: 'global',
  },
  {
    label: 'Go to Transactions',
    keys: 'g + t',
    group: 'global',
  },
  {
    label: 'Go to Settings',
    keys: 'g + s',
    group: 'global',
  },

  // ── Dashboard ─────────────────────────────────────────────────
  {
    label: 'Navigate quick-actions',
    keys: 'Tab / Shift + Tab',
    group: 'dashboard',
    description: 'Move focus between quick-action cards.',
  },
  {
    label: 'Activate focused action',
    keys: 'Enter',
    group: 'dashboard',
  },

  // ── Transactions ──────────────────────────────────────────────
  {
    label: 'Previous page',
    keys: '←',
    group: 'transactions',
  },
  {
    label: 'Next page',
    keys: '→',
    group: 'transactions',
  },
  {
    label: 'Search transactions',
    keys: '/',
    group: 'transactions',
    description: 'Focuses the transaction search bar.',
  },

  // ── Settings ──────────────────────────────────────────────────
  {
    label: 'Navigate tabs',
    keys: '← / →',
    group: 'settings',
    description: 'Switch between settings tabs when the tab bar is focused.',
  },
];

/**
 * Returns the shortcut groups as a map keyed by group name.
 * Groups are ordered: global, dashboard, transactions, settings.
 */
export function getShortcutGroups(): Record<ShortcutEntry['group'], ShortcutEntry[]> {
  const groups: Record<ShortcutEntry['group'], ShortcutEntry[]> = {
    global: [],
    dashboard: [],
    transactions: [],
    settings: [],
  };

  for (const entry of SHORTCUTS) {
    groups[entry.group].push(entry);
  }

  return groups;
}

/**
 * Human-readable group labels for the modal.
 */
export const GROUP_LABELS: Record<ShortcutEntry['group'], string> = {
  global: 'Global',
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  settings: 'Settings',
};