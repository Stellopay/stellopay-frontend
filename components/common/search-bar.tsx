"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import useSidebar from "@/context/sidebar-context";
import { SearchIcon } from "@/public/svg/svg";

export interface SearchBarProps {
  /**
   * Called with the current query as the user types. Debounced by
   * `debounceMs`, except when the query is cleared via the clear button,
   * which fires immediately with an empty string.
   */
  onSearch?: (value: string) => void;
  /** Debounce delay in milliseconds before `onSearch` fires. Defaults to 300ms. */
  debounceMs?: number;
}

export const SearchBar = ({ onSearch, debounceMs = 300 }: SearchBarProps = {}) => {
  const { isSidebarOpen, isMobile } = useSidebar();
  const [value, setValue] = useState("");

  // Show expanded search on mobile or when desktop sidebar is expanded
  const isExpanded = isMobile || (isSidebarOpen && !isMobile);

  // Keep the latest onSearch without resetting the debounce timer on parent re-renders.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Tracks the last query actually delivered to onSearch, so an immediate
  // clear doesn't get re-delivered a second time once the debounce timer
  // for the pre-clear keystroke fires.
  const lastSentRef = useRef<string | undefined>(undefined);

  // Debounce the search callback so it doesn't fire on every keystroke.
  useEffect(() => {
    if (!onSearchRef.current) return;

    const timer = setTimeout(() => {
      if (lastSentRef.current === value) return;
      lastSentRef.current = value;
      onSearchRef.current?.(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  const handleClear = () => {
    setValue("");
    lastSentRef.current = "";
    onSearchRef.current?.("");
  };

  const showClearButton = isExpanded && value !== "";

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={isExpanded ? "Search" : ""}
        aria-label="Search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`border border-zinc-200 dark:border-[#2D333E] bg-zinc-50 dark:bg-[#0D0D0D] text-sm font-normal text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-[#98A2B3] py-2 focus:border outline-none focus:border-zinc-300 dark:focus:border-[#464d5c] w-full transition-colors ${
          isExpanded
            ? `pl-10 rounded-sm ${showClearButton ? "pr-9" : "pr-3"}`
            : "!px-2 pl-6 rounded-lg"
        }`}
      />
      <div
        className={`absolute ${
          isExpanded ? "left-3" : "left-1/2 -translate-x-1/2"
        } top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400`}
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
