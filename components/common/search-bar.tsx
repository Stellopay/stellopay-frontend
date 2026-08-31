"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import useSidebar from "@/context/sidebar-context";
import { SearchIcon } from "@/public/svg/svg";
import { cn } from "@/utils/commonUtils";

export interface SearchBarProps {
  /**
   * Controlled value to display in the input. When omitted, SearchBar manages
   * its own local value for backward compatibility with existing consumers.
   */
  value?: string;
  /** Input placeholder when the search field is expanded. */
  placeholder?: string;
  /** Accessible name for the input. */
  ariaLabel?: string;
  /** Extra classes applied to the input element. */
  className?: string;
  /**
   * Called with the current query as the user types. Debounced by
   * `debounceMs`, except when the query is cleared via the clear button,
   * which fires immediately with an empty string.
   */
  onSearch?: (value: string) => void;
  /** Debounce delay in milliseconds before `onSearch` fires. Defaults to 300ms. */
  debounceMs?: number;
}

export const SearchBar = ({
  value,
  placeholder = "Search",
  ariaLabel = "Search",
  className,
  onSearch,
  debounceMs = 300,
}: SearchBarProps = {}) => {
  const { isSidebarOpen, isMobile } = useSidebar();
  const [draftValue, setDraftValue] = useState(value ?? "");

  // Show expanded search on mobile or when desktop sidebar is expanded
  const isExpanded = isMobile || (isSidebarOpen && !isMobile);

  // Keep the latest onSearch without resetting the debounce timer on parent re-renders.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Tracks the last query actually delivered to onSearch, so an immediate
  // clear doesn't get re-delivered a second time once the debounce timer
  // for the pre-clear keystroke fires. Initialize from the incoming value so a
  // controlled URL-initialized search does not fire onSearch on mount.
  const lastSentRef = useRef<string | undefined>(value ?? "");

  // Synchronize controlled value changes (for example, URL hydration or Clear
  // all from the transactions toolbar) into the visible draft without treating
  // the sync itself as a new user search.
  useEffect(() => {
    if (value === undefined) return;
    setDraftValue(value);
    lastSentRef.current = value;
  }, [value]);

  // Debounce the search callback so it doesn't fire on every keystroke.
  useEffect(() => {
    if (!onSearchRef.current) return;

    const timer = setTimeout(() => {
      if (lastSentRef.current === draftValue) return;
      lastSentRef.current = draftValue;
      onSearchRef.current?.(draftValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [draftValue, debounceMs]);

  const handleClear = () => {
    setDraftValue("");
    lastSentRef.current = "";
    onSearchRef.current?.("");
  };

  const showClearButton = isExpanded && draftValue !== "";

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={isExpanded ? placeholder : ""}
        aria-label={ariaLabel}
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        className={cn(
          "border border-zinc-200 dark:border-[#2D333E] bg-zinc-50 dark:bg-[#0D0D0D] text-sm font-normal text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-[#98A2B3] py-2 focus:border outline-none focus:border-zinc-300 dark:focus:border-[#464d5c] w-full transition-colors",
          isExpanded
            ? `pl-10 rounded-sm ${showClearButton ? "pr-9" : "pr-3"}`
            : "!px-2 pl-6 rounded-lg",
          className,
        )}
      />
      <div
        className={`absolute ${
          isExpanded ? "left-3" : "left-1/2 -translate-x-1/2"
        } top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400`}
        aria-hidden="true"
      >
        <SearchIcon />
      </div>
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
