"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

const STORAGE_KEY = "transactions-sort-preference";
const DEFAULT_SORT: SortOption = "date-desc";

function isValidSort(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((opt) => opt.value === value);
}

export default function Sort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedFromStorage = useRef(false);

  const urlSort = searchParams.get("sort");
  const currentSort: SortOption = isValidSort(urlSort) ? urlSort : DEFAULT_SORT;

  // On first load only: if there's no sort param in the URL, pre-fill it
  // from the saved localStorage preference (deep links with a sort param
  // are left untouched).
  useEffect(() => {
    if (hasHydratedFromStorage.current) return;
    hasHydratedFromStorage.current = true;

    if (urlSort) return; // URL already has a sort param — don't override it

    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private browsing, etc.) — silently ignore
      return;
    }

    if (isValidSort(saved)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", saved);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

    // Only update the saved preference on an explicit user change,
    // never on render/hydration.
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore write failures
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="transactions-sort"
        className="text-sm font-medium text-muted-foreground"
      >
        Sort by
      </label>
      <select
        id="transactions-sort"
        value={currentSort}
        onChange={(e) => handleChange(e.target.value as SortOption)}
        aria-label="Sort transactions"
        className="rounded-md border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}