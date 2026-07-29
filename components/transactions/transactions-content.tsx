"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type {
  SortField,
  SortConfig,
  TransactionFilters,
  Transaction,
  TransactionProps,
  SavedView,
} from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";
import { ErrorState } from "@/components/ui/error-state";
import AdvancedFilterPanel, {
  type AdvancedFilterValues,
} from "./advanced-filter-panel";
import FilterChips, { type FilterChip } from "./filter-chips";
import {
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "./transactions-config";
import { safeStorage } from "@/utils/safeStorage";
import { useWallet } from "@/context/wallet-context";

/** Map token symbol → icon path */
const getTokenIcon = (token: string): string => {
  switch (token) {
    case "USDC":
      return "/usdc-logo.png";
    case "XLM":
      return "/stellar-xlm-logo.png";
    default:
      return "/usd.png";
  }
};

/** localStorage key prefix for saved views. Appended with the wallet address for per-account isolation. */
const SAVED_VIEWS_KEY_PREFIX = "stellopay.transactions-saved-views";

/** Maximum number of saved views per account. */
const MAX_SAVED_VIEWS = 10;

/** Maximum length for a saved view name. */
const MAX_VIEW_NAME_LENGTH = 50;

/** Build the per-account storage key. */
function getSavedViewsKey(address: string | null): string {
  if (!address) return `${SAVED_VIEWS_KEY_PREFIX}.default`;
  return `${SAVED_VIEWS_KEY_PREFIX}.${address}`;
}

/** Load saved views from localStorage, returning an empty array on any failure. */
function loadSavedViews(address: string | null): SavedView[] {
  const stored = safeStorage.getItem(getSavedViewsKey(address));
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v: unknown): v is SavedView =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as SavedView).id === "string" &&
        typeof (v as SavedView).name === "string" &&
        typeof (v as SavedView).createdAt === "string" &&
        typeof (v as SavedView).filters === "object",
    );
  } catch {
    return [];
  }
}

/** Persist saved views to localStorage. */
function persistSavedViews(address: string | null, views: SavedView[]): void {
  safeStorage.setItem(getSavedViewsKey(address), JSON.stringify(views));
}

/** Convert internal Transaction → display TransactionProps */
const toTransactionProps = (t: Transaction): TransactionProps => ({
  id: t.id,
  type: t.type,
  address: t.address,
  date: t.date,
  time: t.time,
  token: t.token,
  amount:
    t.amount >= 0
      ? `+$${t.amount.toFixed(2)}`
      : `-$${Math.abs(t.amount).toFixed(2)}`,
  status: t.status as "Completed" | "Pending" | "Failed",
  tokenIcon: getTokenIcon(t.token),
});

/** Build active filter chips from current filter state. */
function buildFilterChips(filters: TransactionFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.selectedFilter !== "All Transactions") {
    chips.push({
      key: "status",
      label: "Status",
      value: filters.selectedFilter,
    });
  }
  if (filters.minAmount !== undefined) {
    chips.push({
      key: "minAmount",
      label: "Min",
      value: `$${filters.minAmount}`,
    });
  }
  if (filters.maxAmount !== undefined) {
    chips.push({
      key: "maxAmount",
      label: "Max",
      value: `$${filters.maxAmount}`,
    });
  }
  if (filters.counterparty) {
    chips.push({
      key: "counterparty",
      label: "Counterparty",
      value: filters.counterparty,
    });
  }
  return chips;
}

export default function TransactionsContent() {
  const { address } = useWallet();

  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    searchQuery: "",
    filterQuery: "",
    ...getDefaultDateRange(),
    selectedFilter: "All Transactions",
    sortConfigs: [{ field: "date", direction: "desc" }],
  }));
  const [currentPage, setCurrentPage] = useState(1);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [hasHydratedViews, setHasHydratedViews] = useState(false);
  const addressRef = useRef(address);

  // Hydrate saved views from localStorage on mount
  useEffect(() => {
    setSavedViews(loadSavedViews(address));
    setHasHydratedViews(true);
  }, [address]);

  // Persist saved views whenever they change (skip initial render before hydration)
  useEffect(() => {
    if (!hasHydratedViews) return;
    persistSavedViews(address, savedViews);
  }, [savedViews, address, hasHydratedViews]);

  // Keep the address ref in sync so downstream effects can detect account switches.
  useEffect(() => {
    addressRef.current = address;
  }, [address]);
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false);
  const itemsPerPage = TRANSACTIONS_PAGE_SIZE;

  const { data, isLoading, error, refetch } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const paginatedTransactions: TransactionProps[] = useMemo(
    () => (data?.data ?? []).map(toTransactionProps),
    [data],
  );

  const updateFilter = useCallback(
    <K extends keyof TransactionFilters>(
      key: K,
      value: TransactionFilters[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    [],
  );

  const handleSort = useCallback(
    (field: SortField, options?: { shiftKey?: boolean }) => {
      setFilters((prev) => {
        const currentConfigs = prev.sortConfigs;
        const primary = currentConfigs[0];

        // Shift-click: add/modify secondary sort
        if (options?.shiftKey && primary && primary.field !== field) {
          const secondary = currentConfigs[1];
          // If this field is already the secondary sort, toggle direction
          if (secondary?.field === field) {
            const newConfigs: SortConfig[] = [
              { field: primary.field, direction: primary.direction },
              {
                field,
                direction:
                  secondary.direction === "asc" ? "desc" : "asc",
              },
            ];
            return { ...prev, sortConfigs: newConfigs };
          }
          // Otherwise set it as secondary with 'asc' default
          const newConfigs: SortConfig[] = [
            { field: primary.field, direction: primary.direction },
            { field, direction: "asc" },
          ];
          return { ...prev, sortConfigs: newConfigs };
        }

        // Click without shift: set as primary sort,
        // toggling direction if it's already the primary field
        const isSameField = primary?.field === field;
        const newDirection =
          isSameField && primary?.direction === "asc" ? "desc" : "asc";
        return {
          ...prev,
          sortConfigs: [{ field, direction: newDirection }],
        };
      });
      setCurrentPage(1);
    },
    [],
  );

  // ── Saved views helpers ────────────────────────────────────────────────

  /** Save the current filter/sort state as a named view. */
  const handleSaveView = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > MAX_VIEW_NAME_LENGTH) return;
      if (savedViews.length >= MAX_SAVED_VIEWS) return;

      const newView: SavedView = {
        id: crypto.randomUUID?.() ?? `sv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: trimmed,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };
      setSavedViews((prev) => [...prev, newView]);
    },
    [filters, savedViews.length],
  );

  /** Load (apply) a saved view's filter/sort state. */
  const handleLoadView = useCallback((view: SavedView) => {
    setFilters(view.filters);
    setCurrentPage(1);
  }, []);

  /** Rename a saved view. */
  const handleRenameView = useCallback(
    (view: SavedView, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed.length > MAX_VIEW_NAME_LENGTH) return;
      setSavedViews((prev) =>
        prev.map((v) => (v.id === view.id ? { ...v, name: trimmed } : v)),
      );
    },
    [],
  );

  /** Delete a saved view. */
  const handleDeleteView = useCallback((view: SavedView) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== view.id));
  }, []);

  // ── Advanced filter panel helpers ──────────────────────────────────────

  /** Draft values for the open panel (pre-apply). */
  const advancedPanelValues: AdvancedFilterValues = useMemo(
    () => ({
      status: filters.selectedFilter,
      minAmount:
        filters.minAmount !== undefined ? String(filters.minAmount) : "",
      maxAmount:
        filters.maxAmount !== undefined ? String(filters.maxAmount) : "",
      counterparty: filters.counterparty ?? "",
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    }),
    [filters],
  );

  const [draftPanelValues, setDraftPanelValues] =
    useState<AdvancedFilterValues>(advancedPanelValues);

  const handlePanelOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // Reset draft to current committed values when opening
        setDraftPanelValues(advancedPanelValues);
      }
      setAdvancedPanelOpen(open);
    },
    [advancedPanelValues],
  );

  const handlePanelApply = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedFilter: draftPanelValues.status,
      fromDate: draftPanelValues.fromDate || prev.fromDate,
      toDate: draftPanelValues.toDate || prev.toDate,
      minAmount:
        draftPanelValues.minAmount !== ""
          ? parseFloat(draftPanelValues.minAmount)
          : undefined,
      maxAmount:
        draftPanelValues.maxAmount !== ""
          ? parseFloat(draftPanelValues.maxAmount)
          : undefined,
      counterparty:
        draftPanelValues.counterparty !== ""
          ? draftPanelValues.counterparty
          : undefined,
    }));
    setCurrentPage(1);
    setAdvancedPanelOpen(false);
  }, [draftPanelValues]);

  const handlePanelClearAll = useCallback(() => {
    const defaults = getDefaultDateRange();
    setDraftPanelValues({
      status: "All Transactions",
      minAmount: "",
      maxAmount: "",
      counterparty: "",
      fromDate: defaults.fromDate,
      toDate: defaults.toDate,
    });
  }, []);

  const activeChips = useMemo(() => buildFilterChips(filters), [filters]);

  /** Remove a single advanced filter by its key. */
  const handleChipRemove = useCallback((chipKey: string) => {
    setFilters((prev) => {
      switch (chipKey) {
        case "status":
          return { ...prev, selectedFilter: "All Transactions" };
        case "minAmount":
          return { ...prev, minAmount: undefined };
        case "maxAmount":
          return { ...prev, maxAmount: undefined };
        case "counterparty":
          return { ...prev, counterparty: undefined };
        default:
          return prev;
      }
    });
    setCurrentPage(1);
  }, []);

  /** Clear all advanced filters (amount range + counterparty) via chips. */
  const handleClearAllChips = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedFilter: "All Transactions",
      minAmount: undefined,
      maxAmount: undefined,
      counterparty: undefined,
    }));
    setCurrentPage(1);
  }, []);



  return (
    <div className="min-h-screen text-white mt-4">
      <div className="w-full max-w-7xl mx-auto mb-4">
        <TransactionsHeader
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={(date) => updateFilter("fromDate", date)}
          onToDateChange={(date) => updateFilter("toDate", date)}
        />

        <div className="px-4 sm:px-6 lg:px-8 bg-[#160f17] pt-3 border-[#2D2D2D] border rounded-xl">
          <TransactionsFilters
            searchQuery={filters.searchQuery}
            selectedFilter={filters.selectedFilter}
            sortConfigs={filters.sortConfigs}
            onSearchChange={(q) => updateFilter("searchQuery", q)}
            onFilterChange={(f) => updateFilter("selectedFilter", f)}
            onSort={handleSort}
            onAdvancedFilterToggle={() => handlePanelOpenChange(true)}
            hasAdvancedFilters={
              filters.selectedFilter !== "All Transactions" ||
              filters.minAmount !== undefined ||
              filters.maxAmount !== undefined ||
              !!filters.counterparty
            }
            savedViews={hasHydratedViews ? savedViews : undefined}
            onSaveView={handleSaveView}
            onLoadView={handleLoadView}
            onRenameView={handleRenameView}
            onDeleteView={handleDeleteView}
          />

          {/* Active filter chips */}
          <FilterChips
            chips={activeChips}
            onRemove={handleChipRemove}
            onClearAll={handleClearAllChips}
            className="px-0 pb-3"
          />

          <div className="py-4">
            {/* Loading state */}
            {isLoading && <TransactionTableSkeleton rows={itemsPerPage} />}

            {/* Error state */}
            {!isLoading && error && (
              <ErrorState
                title="Failed to Load"
                description={error}
                onRetry={refetch}
              />
            )}

            {/* Data state */}
            {!isLoading && !error && (
              <>
                <TransactionsTable transactions={paginatedTransactions} />
                <TransactionsPagination
                  totalItems={data?.total ?? 0}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Advanced filter panel (drawer) */}
      <AdvancedFilterPanel
        open={advancedPanelOpen}
        onOpenChange={handlePanelOpenChange}
        currentValues={draftPanelValues}
        onValuesChange={setDraftPanelValues}
        onApply={handlePanelApply}
        onClearAll={handlePanelClearAll}
        disabled={isLoading}
      />
    </div>
  );
}
