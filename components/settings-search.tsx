"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { Input } from "@/components/ui/input";

/**
 * Searchable control definition mapping control labels to their section and
 * searchable keywords. This drives the cross-tab search feature in settings.
 */
export interface SearchableControl {
  label: string;
  section: string;
  keywords: string[];
}

/**
 * Complete catalog of searchable controls across all settings sections.
 * Each control can be found by its primary label or any of its keywords.
 *
 * @security Only labels and keywords are indexed — no sensitive data like
 *   email addresses or wallet keys are included.
 */
export const SEARCHABLE_CONTROLS: SearchableControl[] = [
  // Account section controls
  {
    label: "First name",
    section: "account",
    keywords: ["name", "first", "profile", "identity"],
  },
  {
    label: "Last name",
    section: "account",
    keywords: ["name", "last", "surname", "profile", "identity"],
  },
  {
    label: "Display name",
    section: "account",
    keywords: ["name", "display", "username", "profile"],
  },
  {
    label: "Email address",
    section: "account",
    keywords: ["email", "mail", "contact", "address"],
  },
  {
    label: "Timezone",
    section: "account",
    keywords: ["timezone", "time", "zone", "region", "locale"],
  },
  {
    label: "Settlement currency",
    section: "account",
    keywords: ["currency", "settlement", "money", "usd", "ngn", "eur"],
  },
  {
    label: "Deactivate account",
    section: "account",
    keywords: ["deactivate", "delete", "close", "danger", "destructive"],
  },

  // Notifications section controls
  {
    label: "Transaction alerts",
    section: "notifications",
    keywords: ["alert", "notification", "transaction", "transfer", "deposit"],
  },
  {
    label: "Security notifications",
    section: "notifications",
    keywords: ["alert", "notification", "security", "password", "signin", "sign-in"],
  },
  {
    label: "Product updates",
    section: "notifications",
    keywords: ["alert", "notification", "update", "feature", "product"],
  },
  {
    label: "Marketing and announcements",
    section: "notifications",
    keywords: ["marketing", "announcement", "campaign", "promotional", "news"],
  },
  {
    label: "Email",
    section: "notifications",
    keywords: ["email", "mail", "channel", "delivery"],
  },
  {
    label: "Push notifications",
    section: "notifications",
    keywords: ["push", "notification", "channel", "delivery", "browser"],
  },
  {
    label: "SMS fallback",
    section: "notifications",
    keywords: ["sms", "text", "mobile", "channel", "fallback"],
  },

  // Security section controls
  {
    label: "Password and recovery",
    section: "security",
    keywords: ["password", "recover", "change", "security", "authentication"],
  },
  {
    label: "Authenticator app verification",
    section: "security",
    keywords: ["2fa", "two-factor", "authenticator", "verification", "totp"],
  },
  {
    label: "New device approval",
    section: "security",
    keywords: ["device", "approval", "sign-in", "signin", "authentication"],
  },
  {
    label: "Large transfer approval",
    section: "security",
    keywords: ["transfer", "approval", "confirmation", "security"],
  },
  {
    label: "Active sessions",
    section: "security",
    keywords: ["session", "sign-out", "logout", "device", "browser"],
  },
  {
    label: "Sign out all sessions",
    section: "security",
    keywords: ["sign-out", "logout", "session", "danger", "destructive"],
  },

  // Wallets section controls
  {
    label: "Connected wallets",
    section: "wallets",
    keywords: ["wallet", "connected", "address", "stellar"],
  },
  {
    label: "Add wallet",
    section: "wallets",
    keywords: ["add", "wallet", "address", "stellar", "connected"],
  },
  {
    label: "Approval required for new recipients",
    section: "wallets",
    keywords: ["approval", "recipient", "transfer", "safeguard"],
  },
  {
    label: "Lock approved address book",
    section: "wallets",
    keywords: ["lock", "address", "book", "trusted", "safeguard"],
  },
  {
    label: "Travel rule checks",
    section: "wallets",
    keywords: ["travel", "rule", "check", "compliance", "transfer"],
  },
  {
    label: "Remove primary wallet",
    section: "wallets",
    keywords: ["remove", "wallet", "danger", "destructive", "delete"],
  },
];

export interface SettingsSearchResult {
  control: SearchableControl;
  relevance: number;
}

interface SettingsSearchProps {
  onResultSelect?: (section: string, label: string) => void;
}

/**
 * Performs a search across all searchable controls, ranking results by
 * relevance. Returns controls where the query matches the label or any keyword
 * (substring, case-insensitive). Results are sorted by relevance score.
 *
 * @param query - The search query (case-insensitive)
 * @returns Array of results with relevance scores, sorted descending
 */
export function searchControls(query: string): SettingsSearchResult[] {
  const normalized = query.toLowerCase().trim();

  if (normalized.length === 0) {
    return [];
  }

  const results = SEARCHABLE_CONTROLS.map((control) => {
    let relevance = 0;

    // Exact label match (highest relevance)
    if (control.label.toLowerCase() === normalized) {
      relevance = 100;
    }
    // Label starts with query
    else if (control.label.toLowerCase().startsWith(normalized)) {
      relevance = 80;
    }
    // Label contains query
    else if (control.label.toLowerCase().includes(normalized)) {
      relevance = 60;
    }
    // Any keyword starts with query
    else if (control.keywords.some((kw) => kw.startsWith(normalized))) {
      relevance = 50;
    }
    // Any keyword contains query
    else if (control.keywords.some((kw) => kw.includes(normalized))) {
      relevance = 30;
    }

    return { control, relevance };
  }).filter((result) => result.relevance > 0);

  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * SettingsSearch component.
 *
 * Provides cross-tab search for settings controls. Users type a query to find
 * a control across any tab, and the search result can be selected to navigate
 * to that tab and highlight the control.
 *
 * ## Accessibility
 *
 * - Search input is keyboard-navigable (Tab, Enter, Escape)
 * - Results list is a live region with role="listbox" for screen readers
 * - Each result is keyboard-selectable via arrow keys
 * - Selecting a result announces the tab change
 *
 * ## Responsive behavior
 *
 * - On mobile (< md): search input is compact with minimized result display
 * - On desktop (md+): search shows all results in a scrollable dropdown
 */
export default function SettingsSearch({ onResultSelect }: SettingsSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const results = useMemo(() => searchControls(query), [query]);
  const hasResults = results.length > 0;
  const noResults = query.length > 0 && !hasResults;

  const handleClear = () => {
    setQuery("");
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  const handleSelectResult = (section: string, label: string) => {
    onResultSelect?.(section, label);
    handleClear();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Escape":
        handleClear();
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
        setIsOpen(true);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
        setIsOpen(true);
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectResult(
            results[highlightedIndex].control.section,
            results[highlightedIndex].control.label,
          );
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative w-full md:w-96">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search settings..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9 rounded-2xl border-zinc-200 dark:border-white/10"
          aria-label="Search settings controls"
          aria-expanded={isOpen && hasResults}
          aria-controls="settings-search-results"
          aria-activedescendant={
            highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
          }
          role="combobox"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div
          id="settings-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#09090B]"
        >
          {noResults ? (
            <div className="p-4 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No results found for "{query}"
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Try searching for a control name, like "password" or "wallet"
              </p>
            </div>
          ) : hasResults ? (
            <ul className="divide-y divide-zinc-200 dark:divide-white/10">
              {results.map((result, index) => (
                <li
                  key={`${result.control.section}-${result.control.label}`}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() =>
                    handleSelectResult(
                      result.control.section,
                      result.control.label,
                    )
                  }
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors",
                    index === highlightedIndex
                      ? "bg-blue-50 dark:bg-blue-500/10"
                      : "hover:bg-zinc-50 dark:hover:bg-white/5",
                  )}
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {result.control.label}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {result.control.section.charAt(0).toUpperCase() +
                      result.control.section.slice(1)}{" "}
                    section
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Start typing to search
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Screen-reader announcement of search results */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {hasResults
          ? `${results.length} setting${results.length === 1 ? "" : "s"} found`
          : noResults
            ? `No settings found for "${query}"`
            : ""}
      </div>
    </div>
  );
}
