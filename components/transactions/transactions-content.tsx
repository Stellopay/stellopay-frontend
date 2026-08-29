"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type {
  SortField,
  SortConfig,
  SortDirection,
  TransactionFilters,
  Transaction,
  TransactionProps,
  SavedView,
} from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { getTransactions, MAX_TRANSACTION_PAGE_SIZE } from "@/lib/api";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";
import { BulkActionBar } from "./bulk-action-bar";
import { TransactionsStatement } from "./transactions-statement";
import { ErrorState } from "@/components/ui/error-state";
import AdvancedFilterPanel, {
  type AdvancedFilterValues,
} from "./advanced-filter-panel";
import FilterChips, { type FilterChip } from "./filter-chips";
import CsvExportToolbar from "./transactions-export-toolbar";
import {
  generateTransactionsCsv,
  downloadCsvContent,
} from "@/utils/csvUtils";
import { dedupeTransactionsById } from "@/utils/transactionUtils";
import {
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "./transactions-config";
import { safeStorage } from "@/utils/safeStorage";
import { useWallet } from "@/context/wallet-context";

const DEFAULT_SELECTED_FILTER = "All Transactions";
const DEFAULT_SORT_CONFIGS: readonly SortConfig[] = [
  { field: "date", direction: "desc" },
];

const FILTER_QUERY_VALUE_TO_LABEL: Readonly<Record<string, string>> = {
  all: DEFAULT_SELECTED_FILTER,
  sent: "Payment Sent",
  received: "Payment Received",
};

const FILTER_LABEL_TO_QUERY_VALUE: Readonly<Record<string, string>> = {
  [DEFAULT_SELECTED_FILTER]: "all",
  "Payment Sent": "sent",
  "Payment Received": "received",
};

const SORT_FIELDS = [
  "date",
  "amount",
  "type",
  "status",
] as const satisfies readonly SortField[];
const SORT_DIRECTIONS = [
  "asc",
  "desc",
] as const satisfies readonly SortDirection[];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const TRANSACTIONS_QUERY_KEYS = {
  search: "q",
  filter: "filter",
  fromDate: "from",
  toDate: "to",
  sort: "sort",
  page: "page",
} as const;

type SearchParamsLike = Pick<URLSearchParams, "get" | "toString">;

export interface TransactionsUrlState {
  filters: TransactionFilters;
  page: number;
}

function cloneSortConfigs(configs: readonly SortConfig[]): SortConfig[] {
  return configs.map(({ field, direction }) => ({ field, direction }));
}

export function createDefaultTransactionFilters(): TransactionFilters {
  return {
    searchQuery: "",
    filterQuery: "",
    ...getDefaultDateRange(),
    selectedFilter: DEFAULT_SELECTED_FILTER,
    sortConfigs: cloneSortConfigs(DEFAULT_SORT_CONFIGS),
  };
}

function isValidIsoDate(value: string | null): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false;

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value);
}

function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}

function parsePage(value: string | null): number {
  if (!value) return 1;
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 1;
}

function parseSelectedFilter(value: string | null): string {
  if (!value) return DEFAULT_SELECTED_FILTER;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue in FILTER_QUERY_VALUE_TO_LABEL) {
    return FILTER_QUERY_VALUE_TO_LABEL[normalizedValue];
  }

  const matchingLabel = Object.values(FILTER_QUERY_VALUE_TO_LABEL).find(
    (label) => label.toLowerCase() === normalizedValue,
  );

  return matchingLabel ?? DEFAULT_SELECTED_FILTER;
}

function serializeSelectedFilter(label: string): string {
  return FILTER_LABEL_TO_QUERY_VALUE[label] ?? "all";
}

export function parseSortConfigs(value: string | null): SortConfig[] {
  if (!value) return cloneSortConfigs(DEFAULT_SORT_CONFIGS);

  const seenFields = new Set<SortField>();
  const sortConfigs: SortConfig[] = [];

  for (const rawToken of value.split(",")) {
    if (sortConfigs.length >= 2) break;

    const token = rawToken.trim();
    if (!token) continue;

    // Support both `date.desc` and `date:desc` for hand-written links while
    // always writing the compact dot format back into the address bar.
    const [field, direction] = token.split(/[.:]/);
    if (!field || !direction) continue;
    if (!isSortField(field) || !isSortDirection(direction)) continue;
    if (seenFields.has(field)) continue;

    seenFields.add(field);
    sortConfigs.push({ field, direction });
  }

  return sortConfigs.length > 0
    ? sortConfigs
    : cloneSortConfigs(DEFAULT_SORT_CONFIGS);
}

export function serializeSortConfigs(configs: readonly SortConfig[]): string {
  const seenFields = new Set<SortField>();
  const safeConfigs = configs.filter(({ field, direction }) => {
    if (!isSortField(field) || !isSortDirection(direction)) return false;
    if (seenFields.has(field)) return false;
    seenFields.add(field);
    return true;
  });

  const configsToSerialize =
    safeConfigs.length > 0
      ? safeConfigs
      : cloneSortConfigs(DEFAULT_SORT_CONFIGS);

  return configsToSerialize
    .slice(0, 2)
    .map(({ field, direction }) => `${field}.${direction}`)
    .join(",");
}

export function parseTransactionsUrlState(
  searchParams: SearchParamsLike,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
): TransactionsUrlState {
  const fromDateParam = searchParams.get(TRANSACTIONS_QUERY_KEYS.fromDate);
  const toDateParam = searchParams.get(TRANSACTIONS_QUERY_KEYS.toDate);

  let fromDate = isValidIsoDate(fromDateParam)
    ? fromDateParam
    : defaults.fromDate;
  let toDate = isValidIsoDate(toDateParam) ? toDateParam : defaults.toDate;

  if (new Date(fromDate) > new Date(toDate)) {
    fromDate = defaults.fromDate;
    toDate = defaults.toDate;
  }

  return {
    filters: {
      ...defaults,
      searchQuery: searchParams.get(TRANSACTIONS_QUERY_KEYS.search) ?? "",
      selectedFilter: parseSelectedFilter(
        searchParams.get(TRANSACTIONS_QUERY_KEYS.filter),
      ),
      fromDate,
      toDate,
      sortConfigs: parseSortConfigs(
        searchParams.get(TRANSACTIONS_QUERY_KEYS.sort),
      ),
    },
    page: parsePage(searchParams.get(TRANSACTIONS_QUERY_KEYS.page)),
  };
}

export function buildTransactionsQueryString(
  currentSearchParams: SearchParamsLike,
  state: TransactionsUrlState,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
): string {
  const nextParams = new URLSearchParams(currentSearchParams.toString());

  Object.values(TRANSACTIONS_QUERY_KEYS).forEach((key) => {
    nextParams.delete(key);
  });

  const searchQuery = state.filters.searchQuery;
  if (searchQuery.trim().length > 0) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.search, searchQuery);
  }

  const selectedFilter = serializeSelectedFilter(state.filters.selectedFilter);
  if (selectedFilter !== "all") {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.filter, selectedFilter);
  }

  if (state.filters.fromDate !== defaults.fromDate) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.fromDate, state.filters.fromDate);
  }

  if (state.filters.toDate !== defaults.toDate) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.toDate, state.filters.toDate);
  }

  const serializedSort = serializeSortConfigs(state.filters.sortConfigs);
  if (serializedSort !== serializeSortConfigs(defaults.sortConfigs)) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.sort, serializedSort);
  }

  if (state.page > 1) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.page, String(state.page));
  }

  return nextParams.toString();
}

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
const toTransactionProps = (
  t: Transaction,
  getTagNames: (txId: string) => string[],
): TransactionProps => ({
  id: t.id,
  type: t.type,
  txId: t.txId,
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
  memo: t.memo,
  tags: getTagNames(t.id),
});

export default function TransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    allTags,
    tagAssignments: tagAssignmentsRaw,
    assignTag,
    unassignTag,
    addTag,
    getTagNamesForTransaction,
  } = useTransactionTags();

  const defaultFiltersRef = useRef<TransactionFilters | null>(null);
  if (defaultFiltersRef.current === null) {
    defaultFiltersRef.current = createDefaultTransactionFilters();
  }

  const initialUrlStateRef = useRef<TransactionsUrlState | null>(null);
  if (initialUrlStateRef.current === null) {
    initialUrlStateRef.current = parseTransactionsUrlState(
      searchParams,
      defaultFiltersRef.current,
    );
  }

export default function TransactionsContent() {
  const { address } = useWallet();

  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    ...initialUrlState.filters,
    sortConfigs: cloneSortConfigs(initialUrlState.filters.sortConfigs),
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

  // ── Selection state ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, pageIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const nextQueryString = buildTransactionsQueryString(
      new URLSearchParams(currentQueryString),
      { filters, page: currentPage },
      defaultFilters,
    );

    if (nextQueryString === currentQueryString) return;

    router.replace(
      nextQueryString ? `${pathname}?${nextQueryString}` : pathname,
      { scroll: false },
    );
  }, [
    currentPage,
    currentQueryString,
    defaultFilters,
    filters,
    pathname,
    router,
  ]);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  // A statement needs the ledger before the selected range to calculate its
  // opening balance. Keep this request independent of table search/filter UI.
  // The API currently caps a response at 100 records; production APIs should
  // expose a server-side statement endpoint for ledgers larger than that.
  const statementLedger = useTransactions({
    filters: {
      fromDate: "",
      toDate: "",
      searchQuery: "",
      filterQuery: "",
      selectedFilter: "All Transactions",
      sortConfigs: [{ field: "date", direction: "asc" }],
    },
    page: 1,
    pageSize: 100,
  });

  // ── aria-live announcement for filter result count ──────────────────
  const prevTotalRef = useRef<number | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    // Only announce when data is present and not in a loading / error state.
    if (isLoading || error || !data) return;

    const total = data.total ?? 0;
    const prev = prevTotalRef.current;

    // Suppress announcement on the initial render.
    if (prev === undefined) {
      prevTotalRef.current = total;
      return;
    }

    // Suppress when the count hasn't actually changed (e.g. re-render).
    if (prev === total) return;

    // Debounce so rapid filter changes only produce one announcement.
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLiveMessage(
        total === 0
          ? "No transactions found."
          : `${total} transaction${total === 1 ? "" : "s"} found.`,
      );
    }, 500);

    prevTotalRef.current = total;

    // Cancel pending timer on re-run (e.g. when transitioning to
    // loading / error) or on unmount.
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [data, isLoading, error]);

  const paginatedTransactions: TransactionProps[] = useMemo(() => {
    const transactions = dedupeTransactionsById(
      (data?.data ?? []).map((t) =>
        toTransactionProps(t, getTagNamesForTransaction),
      ),
    );
    if (tagFilter) {
      return transactions.filter((t) => t.tags?.includes(tagFilter));
    }
    return transactions;
  }, [data, tagFilter, getTagNamesForTransaction]);

  // ── CSV Export state ────────────────────────────────────────────────────
  const [exportPreviewCount, setExportPreviewCount] = useState<number | null>(
    null,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /** Fetch the count of rows matching a given date range (independent of pagination). */
  const handlePreviewRequest = useCallback(
    async (dateRange: { fromDate: string; toDate: string }) => {
      setIsLoadingPreview(true);
      try {
        const result = await getTransactions({
          filters: {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            selectedFilter: "All Transactions",
          },
          page: 1,
          pageSize: MAX_TRANSACTION_PAGE_SIZE,
        });
        setExportPreviewCount(result.total);
      } catch (err) {
        console.error("Failed to fetch export preview:", err);
        setExportPreviewCount(null);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [],
  );

  /** Fetch all matching rows for the date range and trigger CSV download. */
  const handleExport = useCallback(
    async (
      selectedColumns: string[],
      dateRange: { fromDate: string; toDate: string },
    ) => {
      setIsExporting(true);
      try {
        const result = await getTransactions({
          filters: {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            selectedFilter: "All Transactions",
          },
          page: 1,
          pageSize: MAX_TRANSACTION_PAGE_SIZE,
        });
        const displayRows = result.data.map(toTransactionProps);
        const csvContent = generateTransactionsCsv(
          displayRows,
          selectedColumns,
        );
        const filename = `transactions-${dateRange.fromDate}_to_${dateRange.toDate}.csv`;
        downloadCsvContent(filename, csvContent);
      } catch (err) {
        console.error("Failed to export transactions:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  /** Reset export preview when the export toolbar dialog closes. */
  const handleExportDialogClose = useCallback(() => {
    setExportPreviewCount(null);
  }, []);

  // ── Stable select-all that has access to current page ids ────────────────────
  const paginatedTransactionsRef = useRef(paginatedTransactions);
  paginatedTransactionsRef.current = paginatedTransactions;

  const handleSelectAllForPage = useCallback(
    (checked: boolean) => {
      const pageIds = paginatedTransactionsRef.current.map((t) => t.id);
      handleSelectAll(checked, pageIds);
    },
    [handleSelectAll],
  );

  // ── Filter helpers (clear selection on any filter/page change) ───────────────
  const updateFilter = useCallback(
    <K extends keyof TransactionFilters>(
      key: K,
      value: TransactionFilters[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
      clearSelection();
    },
    [clearSelection],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      clearSelection();
    },
    [clearSelection],
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
                direction: secondary.direction === "asc" ? "desc" : "asc",
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
      clearSelection();
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

  // ── Bulk action handlers ─────────────────────────────────────────────────────
  const handleBulkExport = useCallback(() => {
    // Stub: collect the selected transactions and trigger a CSV download.
    // Replace with a real implementation once the export endpoint is available.
    const selected = paginatedTransactions.filter((t) => selectedIds.has(t.id));
    const csv = [
      ["ID", "Type", "Address", "Date", "Token", "Amount", "Status"].join(","),
      ...selected.map((t) =>
        [t.id, t.type, t.address, t.date, t.token, t.amount, t.status].join(
          ",",
        ),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    clearSelection();
  }, [paginatedTransactions, selectedIds, clearSelection]);

  return (
    <div className="min-h-screen text-white mt-4">
      <div className="w-full max-w-7xl mx-auto mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 bg-[#1a0c1d] mb-4 rounded-lg">
          <TransactionsHeader
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(date) => updateFilter("fromDate", date)}
            onToDateChange={(date) => updateFilter("toDate", date)}
          />
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <CsvExportToolbar
              previewCount={exportPreviewCount}
              isLoadingPreview={isLoadingPreview}
              onPreviewRequest={handlePreviewRequest}
              onExport={handleExport}
              isExporting={isExporting}
              defaultFromDate={filters.fromDate}
              defaultToDate={filters.toDate}
              onDialogClose={handleExportDialogClose}
            />
          </div>
        </div>
  const handleBulkTag = useCallback(() => {
    // Stub: open a tag-assignment dialog.
    // Replace with real implementation once the tag feature is built.
    console.log("Tag transactions:", Array.from(selectedIds));
  }, [selectedIds]);

  const handleBulkArchive = useCallback(() => {
    // Stub: send archive request for all selected ids.
    // Replace with real implementation once the archive endpoint is available.
    console.log("Archive transactions:", Array.from(selectedIds));
    clearSelection();
  }, [selectedIds, clearSelection]);

  return (
    <div className="min-h-screen text-white mt-4">
      {/*
        aria-live region announces selection count changes to screen readers
        without interrupting the user's current focus.
      */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="selection-announcement"
      >
        {selectedIds.size > 0
          ? selectedIds.size === 1
            ? "1 transaction selected"
            : `${selectedIds.size} transactions selected`
          : ""}
      </div>

      <div className="w-full max-w-7xl mx-auto mb-4 transactions-print-root">
        <TransactionsHeader
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={(date) => updateFilter("fromDate", date)}
          onToDateChange={(date) => updateFilter("toDate", date)}
        />

        <div className="mb-4 flex justify-end px-4 sm:px-6 lg:px-8 print:hidden">
          <button
            type="button"
            onClick={() =>
              setStatementRange({
                fromDate: filters.fromDate,
                toDate: filters.toDate,
              })
            }
            savedViews={hasHydratedViews ? savedViews : undefined}
            onSaveView={handleSaveView}
            onLoadView={handleLoadView}
            onRenameView={handleRenameView}
            onDeleteView={handleDeleteView}
          />

        {statementRange && (
          <TransactionsStatement
            fromDate={statementRange.fromDate}
            toDate={statementRange.toDate}
            ledger={statementLedger.data?.data ?? []}
            onClose={() => setStatementRange(null)}
          />
        )}

        {/* Visually-hidden live region that announces filter result counts to
             screen readers. Uses aria-live="polite" so announcements do not
             interrupt the user's current task. */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>

        <div className="px-4 sm:px-6 lg:px-8 bg-[#160f17] pt-3 border-[#2D2D2D] border rounded-xl">
          <div className="print:hidden">
            <TransactionsFilters
              searchQuery={filters.searchQuery}
              selectedFilter={filters.selectedFilter}
              sortConfigs={filters.sortConfigs}
              onSearchChange={(q) => updateFilter("searchQuery", q)}
              onFilterChange={(f) => updateFilter("selectedFilter", f)}
              onSort={handleSort}
              tagFilter={tagFilter}
              allTags={allTags}
              onTagFilterChange={(tagName) => {
                setTagFilter(tagName);
                setCurrentPage(1);
                clearSelection();
              }}
            />
          </div>

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
                <TransactionsTable
                  transactions={paginatedTransactions}
                  selectedIds={selectedIds}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAllForPage}
                  allTags={allTags}
                  tagAssignments={tagAssignmentsRaw}
                  onAssignTag={assignTag}
                  onUnassignTag={unassignTag}
                  onCreateTag={addTag}
                />
                <div className="print:hidden">
                  <TransactionsPagination
                    totalItems={data?.total ?? 0}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating bulk-action bar – rendered outside the scrollable content area
          so it always stays anchored to the viewport bottom */}
      <div className="print:hidden">
        <BulkActionBar
          selectedCount={selectedIds.size}
          onExport={handleBulkExport}
          onTag={handleBulkTag}
          onArchive={handleBulkArchive}
          onClearSelection={clearSelection}
        />
      </div>
    </div>
  );
}
