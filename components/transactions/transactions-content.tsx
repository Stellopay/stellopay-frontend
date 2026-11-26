"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileText, Archive, Tag } from "lucide-react";
import { toast } from "sonner";
import type {
  SortField,
  SortConfig,
  TransactionFilters,
  Transaction,
  TransactionProps,
  SavedView,
} from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionTags } from "@/hooks/useTransactionTags";
import { useArchivedTransactions } from "@/hooks/useArchivedTransactions";
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

import {
  TRANSACTIONS_QUERY_KEYS,
  type TransactionsUrlState,
  cloneSortConfigs,
  createDefaultTransactionFilters,
  parseSortConfigs,
  serializeSortConfigs,
  parseTransactionsUrlState,
  buildTransactionsQueryString,
  buildShareableTransactionsQueryString,
  buildShareableTransactionsUrl,
} from "./transactions-url-state";

export {
  TRANSACTIONS_QUERY_KEYS,
  type TransactionsUrlState,
  createDefaultTransactionFilters,
  parseSortConfigs,
  serializeSortConfigs,
  parseTransactionsUrlState,
  buildTransactionsQueryString,
  buildShareableTransactionsQueryString,
  buildShareableTransactionsUrl,
};

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

const SAVED_VIEWS_KEY_PREFIX = "stellopay.transactions-saved-views";
const MAX_SAVED_VIEWS = 10;
const MAX_VIEW_NAME_LENGTH = 50;

function getSavedViewsKey(address: string | null): string {
  if (!address) return `${SAVED_VIEWS_KEY_PREFIX}.default`;
  return `${SAVED_VIEWS_KEY_PREFIX}.${address}`;
}

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

function persistSavedViews(address: string | null, views: SavedView[]): void {
  safeStorage.setItem(getSavedViewsKey(address), JSON.stringify(views));
}

const TRANSACTION_STATUS_LABELS: Record<string, TransactionProps["status"]> = {
  completed: "Completed",
  success: "Completed",
  pending: "Pending",
  retry: "Pending",
  rejection: "Failed",
  timeout: "Failed",
  failed: "Failed",
};

function getTransactionStatusLabel(status: string): TransactionProps["status"] {
  return TRANSACTION_STATUS_LABELS[status.toLowerCase()] ?? "Pending";
}

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
  status: getTransactionStatusLabel(t.status),
  tokenIcon: getTokenIcon(t.token),
  memo: t.memo,
  tags: getTagNames(t.id),
});

export default function TransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address } = useWallet();

  const {
    allTags,
    assignments,
    assignTag,
    unassignTag,
    addTag,
    getTagNamesForTransaction,
  } = useTransactionTags();

  const {
    archivedIds,
    showArchived,
    setShowArchived,
    archiveTransactions,
    unarchiveTransactions,
    isArchived,
  } = useArchivedTransactions(address);

  const [tagFilter, setTagFilter] = useState<string>("");
  const [statementRange, setStatementRange] = useState<{
    fromDate: string;
    toDate: string;
  } | null>(null);

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

  const defaultFilters = defaultFiltersRef.current;
  const initialUrlState = initialUrlStateRef.current;
  const currentQueryString = searchParams.toString();

  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    ...initialUrlState.filters,
    sortConfigs: cloneSortConfigs(initialUrlState.filters.sortConfigs),
  }));
  const [currentPage, setCurrentPage] = useState(initialUrlState.page);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [hasHydratedViews, setHasHydratedViews] = useState(false);
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false);
  const itemsPerPage = TRANSACTIONS_PAGE_SIZE;

  useEffect(() => {
    setSavedViews(loadSavedViews(address));
    setHasHydratedViews(true);
  }, [address]);

  useEffect(() => {
    if (!hasHydratedViews) return;
    persistSavedViews(address, savedViews);
  }, [savedViews, address, hasHydratedViews]);

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

  const { data, isLoading, error, refetch } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

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

  const paginatedTransactions: TransactionProps[] = useMemo(() => {
    let transactions = dedupeTransactionsById(
      (data?.data ?? []).map((t) =>
        toTransactionProps(t, getTagNamesForTransaction),
      ),
    );

    if (!showArchived) {
      transactions = transactions.filter((t) => !isArchived(t.id));
    }

    if (tagFilter) {
      return transactions.filter((t) => t.tags?.includes(tagFilter));
    }
    return transactions;
  }, [data, tagFilter, getTagNamesForTransaction, showArchived, isArchived]);

  const [exportPreviewCount, setExportPreviewCount] = useState<number | null>(
    null,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        setExportPreviewCount(null);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [],
  );

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
        const displayRows = result.data.map((t) =>
          toTransactionProps(t, getTagNamesForTransaction),
        );
        const csvContent = generateTransactionsCsv(
          displayRows,
          selectedColumns,
        );
        const filename = `transactions-${dateRange.fromDate}_to_${dateRange.toDate}.csv`;
        downloadCsvContent(filename, csvContent);
      } catch (err) {
        // handled
      } finally {
        setIsExporting(false);
      }
    },
    [getTagNamesForTransaction],
  );

  const handleExportDialogClose = useCallback(() => {
    setExportPreviewCount(null);
  }, []);

  const paginatedTransactionsRef = useRef(paginatedTransactions);
  paginatedTransactionsRef.current = paginatedTransactions;

  const handleSelectAllForPage = useCallback(
    (checked: boolean) => {
      const pageIds = paginatedTransactionsRef.current.map((t) => t.id);
      handleSelectAll(checked, pageIds);
    },
    [handleSelectAll],
  );

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

        if (options?.shiftKey && primary && primary.field !== field) {
          const secondary = currentConfigs[1];
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
          const newConfigs: SortConfig[] = [
            { field: primary.field, direction: primary.direction },
            { field, direction: "asc" },
          ];
          return { ...prev, sortConfigs: newConfigs };
        }

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
    [clearSelection],
  );

  const handleSaveView = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > MAX_VIEW_NAME_LENGTH) return;
      if (savedViews.length >= MAX_SAVED_VIEWS) return;

      const newView: SavedView = {
        id:
          crypto.randomUUID?.() ??
          `sv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: trimmed,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };
      setSavedViews((prev) => [...prev, newView]);
    },
    [filters, savedViews.length],
  );

  const handleLoadView = useCallback((view: SavedView) => {
    setFilters(view.filters);
    setCurrentPage(1);
  }, []);

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

  const handleDeleteView = useCallback((view: SavedView) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== view.id));
  }, []);

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

  const handleApplyAdvancedFilters = useCallback(
    (values: AdvancedFilterValues) => {
      setFilters((prev) => ({
        ...prev,
        selectedFilter: values.status,
        minAmount:
          values.minAmount.trim() !== ""
            ? parseFloat(values.minAmount)
            : undefined,
        maxAmount:
          values.maxAmount.trim() !== ""
            ? parseFloat(values.maxAmount)
            : undefined,
        counterparty: values.counterparty.trim() || undefined,
        fromDate: values.fromDate,
        toDate: values.toDate,
      }));
      setCurrentPage(1);
      clearSelection();
      setAdvancedPanelOpen(false);
    },
    [clearSelection],
  );

  const handleClearAdvancedFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedFilter: "All Transactions",
      minAmount: undefined,
      maxAmount: undefined,
      counterparty: undefined,
      ...defaultFilters,
    }));
    setCurrentPage(1);
    clearSelection();
    setAdvancedPanelOpen(false);
  }, [defaultFilters, clearSelection]);

  const handleBulkExport = useCallback(() => {
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

  const handleBulkTag = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const firstTag = allTags[0]?.id;
    if (firstTag) {
      for (const id of ids) {
        assignTag(id, firstTag);
      }
    } else {
      const newTag = addTag("Bulk Tag");
      for (const id of ids) {
        assignTag(id, newTag.id);
      }
    }
    toast.success(`Tagged ${ids.length} transactions`);
    clearSelection();
  }, [selectedIds, allTags, assignTag, addTag, clearSelection]);

  const handleBulkArchive = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    archiveTransactions(ids);
    clearSelection();
    toast.success(`Archived ${ids.length} transactions`, {
      action: {
        label: "Undo",
        onClick: () => {
          unarchiveTransactions(ids);
        },
      },
    });
  }, [selectedIds, archiveTransactions, unarchiveTransactions, clearSelection]);

  return (
    <div className="min-h-screen text-white mt-4">
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 bg-[#1a0c1d] mb-4 rounded-lg">
          <TransactionsHeader
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(date) => updateFilter("fromDate", date)}
            onToDateChange={(date) => updateFilter("toDate", date)}
          />
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-700 bg-gray-900 text-primary focus:ring-primary"
              />
              Show archived
            </label>
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

        <div className="mb-4 flex justify-end px-4 sm:px-6 lg:px-8 print:hidden">
          <button
            type="button"
            onClick={() =>
              setStatementRange({
                fromDate: filters.fromDate,
                toDate: filters.toDate,
              })
            }
            disabled={statementLedger.isLoading || !!statementLedger.error}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            aria-describedby="statement-help"
          >
            <FileText aria-hidden="true" size={16} />
            Generate statement
          </button>
          <span id="statement-help" className="sr-only">
            Creates a printable reconciliation statement for the selected date
            range.
          </span>
        </div>

        {statementRange && (
          <TransactionsStatement
            fromDate={statementRange.fromDate}
            toDate={statementRange.toDate}
            ledger={statementLedger.data?.data ?? []}
            onClose={() => setStatementRange(null)}
          />
        )}

        <div className="px-4 sm:px-6 lg:px-8 bg-[#160f17] pt-3 border-[#2D2D2D] border rounded-xl">
          <div className="print:hidden">
            <TransactionsFilters
              searchQuery={filters.searchQuery}
              selectedFilter={filters.selectedFilter}
              sortConfigs={filters.sortConfigs}
              onSearchChange={(q) => updateFilter("searchQuery", q)}
              onFilterChange={(f) => updateFilter("selectedFilter", f)}
              onSort={handleSort}
              onAdvancedFilterToggle={() => setAdvancedPanelOpen(true)}
              hasAdvancedFilters={Boolean(
                filters.minAmount !== undefined ||
                  filters.maxAmount !== undefined ||
                  filters.counterparty,
              )}
              savedViews={hasHydratedViews ? savedViews : undefined}
              onSaveView={handleSaveView}
              onLoadView={handleLoadView}
              onRenameView={handleRenameView}
              onDeleteView={handleDeleteView}
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
            {isLoading && <TransactionTableSkeleton rows={itemsPerPage} />}

            {!isLoading && error && (
              <ErrorState
                title="Failed to Load"
                description={error}
                onRetry={refetch}
              />
            )}

            {!isLoading && !error && (
              <>
                <TransactionsTable
                  transactions={paginatedTransactions}
                  selectedIds={selectedIds}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAllForPage}
                  allTags={allTags}
                  tagAssignments={assignments}
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

      <AdvancedFilterPanel
        open={advancedPanelOpen}
        onOpenChange={setAdvancedPanelOpen}
        currentValues={advancedPanelValues}
        onValuesChange={() => {}}
        onApply={() => handleApplyAdvancedFilters(advancedPanelValues)}
        onClearAll={handleClearAdvancedFilters}
      />

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
