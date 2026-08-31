"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionsTableProps, TransactionProps, Tag } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TokenIcon from "@/components/transactions/token-icon";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import { getStatusColor, getStatusIcon } from "@/utils/transactionUtils";
import { truncateStellarAddress } from "@/utils/stellarAddress";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { TRANSACTIONS_PAGE_SIZE } from "./transactions-config";
import { DownloadReceiptButton } from "./download-receipt-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExternalLink, RotateCw } from "lucide-react";
import { safeStorage } from "@/utils/safeStorage";
import { TagChip } from "./tag-chip";

// ── Density configuration ───────────────────────────────────────────────────

type TableDensity = "compact" | "comfortable" | "spacious";

const DENSITY_STORAGE_KEY = "transactions-table-density";

interface DensityStyle {
  head: string;
  cell: string;
  skeleton: string;
}

const DENSITY_CONFIG: Record<TableDensity, DensityStyle> = {
  compact: {
    head: "py-2 px-3 text-xs",
    cell: "py-2 px-3 text-xs",
    skeleton: "py-2 px-3",
  },
  comfortable: {
    head: "py-3 px-4 text-sm",
    cell: "py-3 px-4 text-sm",
    skeleton: "py-3 px-4",
  },
  spacious: {
    head: "py-4 px-5 text-sm",
    cell: "py-4 px-5 text-sm",
    skeleton: "py-4 px-5",
  },
};

const DENSITY_OPTIONS: Array<{ value: TableDensity; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

// ── Status-state helpers (a11y from #1196) ───────────────────────────────────

const RETRYABLE_STATUSES = new Set(["Rejected", "Timeout", "Failed", "Retry"]);

function getTransactionStatusState(
  status: string,
): "completed" | "current" | "error" | undefined {
  if (status === "Pending" || status === "Retry") return "current";
  if (status === "Completed" || status === "Success") return "completed";
  if (status === "Rejected" || status === "Timeout" || status === "Failed")
    return "error";
  return undefined;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TransactionsTablePropsExtended extends TransactionsTableProps {
  isLoading?: boolean;
  /** Set of transaction ids that are currently selected. */
  selectedIds?: Set<string>;
  /**
   * Called when the user toggles a single row checkbox.
   * `checked` is the new desired state.
   */
  onSelectRow?: (id: string, checked: boolean) => void;
  /**
   * Called when the user clicks the select-all header checkbox.
   * `checked` is the new desired state (true = select all visible rows).
   */
  onSelectAll?: (checked: boolean) => void;
  /** All user-defined tags for the tag picker */
  allTags?: Tag[];
  /** Map of transaction id -> assigned tag ids */
  tagAssignments?: Record<string, string[]>;
  /** Assign a tag to a transaction */
  onAssignTag?: (txId: string, tagId: string) => void;
  /** Unassign a tag from a transaction */
  onUnassignTag?: (txId: string, tagId: string) => void;
  /** Create a new tag and return it */
  onCreateTag?: (name: string) => Tag;
  /** Retry a failed or timed-out transaction. */
  onRetryTransaction?: (id: string) => void;
}

// ── Quick-view dialog ────────────────────────────────────────────────────────

/**
 * Quick-view dialog component for displaying transaction details.
 * Implements WCAG 2.1 AA accessibility with proper ARIA labels,
 * keyboard navigation, and focus management.
 */
function TransactionQuickViewDialog({
  transaction,
  open,
  onOpenChange,
  triggerRef,
}: {
  transaction: TransactionProps | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  if (!transaction) return null;

  const StatusIcon = getStatusIcon(transaction.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          // Prevent focus from moving to the dialog on open
          // so we can manage it ourselves
          e.preventDefault();
        }}
        onCloseAutoFocus={() => {
          // Return focus to the triggering row when dialog closes
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Transaction Receipt</span>
            <Badge
              aria-label={`Status: ${transaction.status}`}
              className={getStatusColor(transaction.status)}
            >
              <StatusIcon className="size-4" aria-hidden="true" />
              <span className="text-sm">{transaction.status}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {transaction.type} #{transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Type & ID */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-sm font-semibold">{transaction.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-sm font-semibold">#{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <p className="text-sm font-semibold">{transaction.status}</p>
            </div>
          </div>

          {/* Address & Counterparty */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Address
              </p>
              <p
                className="text-sm font-mono break-all cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                title={transaction.address}
                tabIndex={0}
              >
                {transaction.address}
              </p>
            </div>
            {transaction.counterparty && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Counterparty
                </p>
                <p
                  className="text-sm font-mono break-all cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                  title={transaction.counterparty}
                  tabIndex={0}
                >
                  {transaction.counterparty}
                </p>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <time
                dateTime={transaction.date}
                className="text-sm font-semibold"
              >
                {transaction.date}
              </time>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <time
                dateTime={transaction.time}
                className="text-sm font-semibold"
              >
                {transaction.time}
              </time>
            </div>
          </div>

          {/* Token & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Token</p>
              <div className="flex items-center gap-2">
                <TokenIcon
                  token={transaction.token}
                  src={transaction.tokenIcon}
                  size={16}
                />
                <span className="text-sm font-semibold">
                  {transaction.token}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Amount
              </p>
              <p
                className={`text-sm font-semibold ${
                  transaction.amount.startsWith("+")
                    ? "text-green-500"
                    : transaction.amount.startsWith("-")
                      ? "text-red-500"
                      : ""
                }`}
              >
                {transaction.amount}
              </p>
            </div>
          </div>

          {/* Fee */}
          {transaction.fee && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fee</p>
              <p className="text-sm font-semibold">{transaction.fee}</p>
            </div>
          )}

          {/* Memo */}
          {transaction.memo && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Memo</p>
              <p className="text-sm break-words">{transaction.memo}</p>
            </div>
          )}

          {/* Transaction Hash */}
          {transaction.hash && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Transaction Hash
              </p>
              <p
                className="text-sm font-mono break-all cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                title={transaction.hash}
                tabIndex={0}
              >
                {transaction.hash}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" asChild>
            <Link
              href={`/transactions/${transaction.id}`}
              className="flex items-center gap-2"
              aria-label={`View full details for transaction ${transaction.id}`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View Full Details
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function TransactionsTable({
  transactions,
  isLoading = false,
  selectedIds = new Set(),
  onSelectRow,
  onSelectAll,
  allTags = [],
  tagAssignments = {},
  onAssignTag,
  onUnassignTag,
  onCreateTag,
  onRetryTransaction,
}: TransactionsTablePropsExtended) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionProps | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isEmpty = !isLoading && transactions.length === 0;

  // ── Density state ──────────────────────────────────────────────────────────
  const [density, setDensity] = useState<TableDensity>("comfortable");

  useEffect(() => {
    const stored = safeStorage.getItem(
      DENSITY_STORAGE_KEY,
    ) as TableDensity | null;
    if (stored && ["compact", "comfortable", "spacious"].includes(stored)) {
      setDensity(stored);
    }
  }, []);

  const handleDensityChange = useCallback((value: TableDensity) => {
    setDensity(value);
    safeStorage.setItem(DENSITY_STORAGE_KEY, value);
  }, []);

  const s = DENSITY_CONFIG[density];

  // ── Live status-change announcement (a11y from #1196) ─────────────────────
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const previousStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    transactions.forEach((transaction) => {
      const previousStatus = previousStatusesRef.current[transaction.id];
      if (previousStatus && previousStatus !== transaction.status) {
        setLiveAnnouncement(
          `Transaction ${transaction.id} status changed from ${previousStatus} to ${transaction.status}.`,
        );
      }
      previousStatusesRef.current[transaction.id] = transaction.status;
    });
  }, [transactions]);

  // ── Ref to the table wrapper for keyboard navigation ──────────────────────
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // ── Dialog handlers ────────────────────────────────────────────────────────
  const handleRowClick = (
    transaction: TransactionProps,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    triggerRef.current = event.currentTarget;
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleRowKeyDown = (
    transaction: TransactionProps,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerRef.current = event.currentTarget;
      setSelectedTransaction(transaction);
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedTransaction(null);
    }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const selectableIds = transactions.map((t) => t.id);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));

  const someSelected =
    !allSelected && selectableIds.some((id) => selectedIds.has(id));

  const headerCheckedState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const isSelectable = Boolean(onSelectRow && onSelectAll);

  return (
    <>
      {/* Screen-reader live region for status changes (#1196) */}
      <span role="status" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </span>

      {/* Density Toggle — desktop only, hidden from print */}
      <div className="hidden md:flex items-center gap-2 mb-3 print:hidden">
        <span className="text-xs text-zinc-400">Density:</span>
        <div
          role="radiogroup"
          aria-label="Table density"
          className="inline-flex rounded-lg border border-[#2D2D2D] bg-[#191919] p-0.5"
        >
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={density === opt.value}
              onClick={() => handleDensityChange(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                density === opt.value
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div
        ref={tableWrapperRef}
        className="hidden md:block print:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]"
      >
        <Table>
          {/* caption is visually hidden but announced by screen readers */}
          <caption className="sr-only">
            Transaction history. Click a row to view transaction details.
          </caption>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              {isSelectable && (
                <TableHead
                  scope="col"
                  className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-4 w-12 print:hidden"
                >
                  <Checkbox
                    aria-label={
                      allSelected
                        ? "Deselect all transactions on this page"
                        : "Select all transactions on this page"
                    }
                    checked={headerCheckedState}
                    onCheckedChange={(checked) =>
                      onSelectAll?.(checked === true)
                    }
                    className="border-[#555] data-[state=checked]:border-white data-[state=indeterminate]:border-white print:hidden"
                  />
                </TableHead>
              )}
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head}`}
              >
                Transaction Type
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head} w-[200px]`}
              >
                Address
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head}`}
              >
                Date
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head}`}
              >
                Token
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head} w-[140px]`}
              >
                Amount
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head} w-[120px]`}
              >
                Status
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head} w-[180px] print:hidden`}
              >
                Tags
              </TableHead>
              <TableHead
                scope="col"
                className={`text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 ${s.head} w-[140px] print:hidden`}
              >
                Receipt
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: TRANSACTIONS_PAGE_SIZE }).map((_, index) => (
                <TableRow
                  key={`skeleton-${index}`}
                  className="border border-[#2D2D2D]"
                >
                  <TableCell
                    className={`font-medium border border-[#2D2D2D] ${s.skeleton}`}
                  >
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell
                    className={`border border-[#2D2D2D] ${s.skeleton}`}
                  >
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell
                    className={`border border-[#2D2D2D] ${s.skeleton}`}
                  >
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell
                    className={`flex place-items-center gap-2 ${s.skeleton}`}
                  >
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell
                    className={`border border-[#2D2D2D] ${s.skeleton}`}
                  >
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className={s.skeleton}>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className={s.skeleton}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className={s.skeleton}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={isSelectable ? 9 : 8}
                  className="py-12 text-center"
                >
                  <EmptyState
                    title="No Transactions Found"
                    description="No transactions found. Try adjusting your filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction, index) => {
                const StatusIcon = getStatusIcon(transaction.status);
                return (
                  <TableRow
                    key={transaction.id ?? index}
                    className="border border-[#2D2D2D]"
                    aria-selected={
                      isSelectable
                        ? selectedIds.has(transaction.id)
                        : undefined
                    }
                  >
                    {isSelectable && (
                      <TableCell
                        className={`border border-[#2D2D2D] ${s.cell} w-12 print:hidden`}
                      >
                        <Checkbox
                          aria-label={`Select transaction ${transaction.id}`}
                          checked={selectedIds.has(transaction.id)}
                          onCheckedChange={(checked) =>
                            onSelectRow?.(transaction.id, checked === true)
                          }
                          className="border-[#555] data-[state=checked]:border-white"
                        />
                      </TableCell>
                    )}
                    <TableCell
                      className={`font-medium border border-[#2D2D2D] ${s.cell}`}
                    >
                      <span className="text-[#D7E0EF]">{transaction.type}</span>
                      <p>#{transaction.id}</p>
                    </TableCell>
                    <TableCell
                      className={`border border-[#2D2D2D] ${s.cell} w-[180px] max-w-[180px]`}
                    >
                      <span
                        className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                        title={transaction.address}
                        tabIndex={0}
                      >
                        {truncateStellarAddress(transaction.address)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`border border-[#2D2D2D] ${s.cell}`}
                    >
                      <time dateTime={transaction.date}>
                        {transaction.date} {transaction.time}
                      </time>
                    </TableCell>
                    <TableCell
                      className={`flex place-items-center gap-2 ${s.cell}`}
                    >
                      <TokenIcon
                        token={transaction.token}
                        src={transaction.tokenIcon}
                        size={20}
                      />
                      <span>{transaction.token}</span>
                    </TableCell>
                    <TableCell
                      className={`border border-[#2D2D2D] ${s.cell} max-w-[150px]`}
                    >
                      <span
                        className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                        title={transaction.amount}
                        tabIndex={0}
                      >
                        {transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className={s.cell}>
                      <Badge
                        aria-label={`Status: ${transaction.status}`}
                        aria-current={
                          transaction.status === "Pending" ||
                          transaction.status === "Retry"
                            ? "step"
                            : undefined
                        }
                        className={getStatusColor(transaction.status)}
                        data-state={getTransactionStatusState(
                          transaction.status,
                        )}
                      >
                        <StatusIcon className="size-4" aria-hidden="true" />
                        <span className="text-sm">{transaction.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`${s.cell} print:hidden max-w-[180px]`}
                    >
                      <TagChip
                        assignedTags={(
                          tagAssignments[transaction.id] ?? []
                        )
                          .map((id) => allTags.find((t) => t.id === id))
                          .filter(Boolean) as Tag[]}
                        allTags={allTags}
                        onAssign={(tagId) =>
                          onAssignTag?.(transaction.id, tagId)
                        }
                        onUnassign={(tagId) =>
                          onUnassignTag?.(transaction.id, tagId)
                        }
                        onCreateTag={(name) =>
                          onCreateTag?.(name) ?? {
                            id: "",
                            name,
                            color: "#34D399",
                          }
                        }
                        transactionId={transaction.id}
                      />
                    </TableCell>
                    <TableCell className={`${s.cell} print:hidden`}>
                      <button
                        type="button"
                        onClick={(e) => handleRowClick(transaction, e)}
                        onKeyDown={(e) => handleRowKeyDown(transaction, e)}
                        className="p-2 rounded-md hover:bg-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] transition-colors"
                        aria-label={`View details for transaction ${transaction.id}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {onRetryTransaction &&
                        RETRYABLE_STATUSES.has(transaction.status) && (
                          <button
                            type="button"
                            onClick={() =>
                              onRetryTransaction(transaction.id)
                            }
                            className="p-2 rounded-md hover:bg-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] transition-colors"
                            aria-label={`Retry transaction ${transaction.id}`}
                          >
                            <RotateCw
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      <DownloadReceiptButton
                        transaction={{
                          id: transaction.id,
                          hash: transaction.hash ?? transaction.txId,
                          amount: transaction.amount,
                          counterparty:
                            transaction.counterparty ?? transaction.address,
                          timestamp: `${transaction.date} ${transaction.time}`.trim(),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 print:hidden">
        {isLoading ? (
          <div className="p-4 border rounded-lg border-[#2D2D2D]">
            <TransactionTableSkeleton rows={TRANSACTIONS_PAGE_SIZE} />
          </div>
        ) : isEmpty ? (
          <div className="p-8 border rounded-lg border-[#2D2D2D]">
            <EmptyState
              title="No Transactions Found"
              description="No transactions found. Try adjusting your filters."
            />
          </div>
        ) : (
          transactions.map((transaction, index) => {
            const StatusIcon = getStatusIcon(transaction.status);
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => handleRowClick(transaction, e)}
                onKeyDown={(e) => handleRowKeyDown(transaction, e)}
                className="w-full text-left p-4 border rounded-lg hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] transition-colors"
                aria-label={`View details for transaction ${transaction.id}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {transaction.type} #{transaction.id}
                    </p>
                    <p
                      className="text-sm text-muted-foreground block truncate max-w-[180px] cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                      title={transaction.address}
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {truncateStellarAddress(transaction.address)}
                    </p>
                  </div>
                  <Badge
                    aria-label={`Status: ${transaction.status}`}
                    aria-current={
                      transaction.status === "Pending" ||
                      transaction.status === "Retry"
                        ? "step"
                        : undefined
                    }
                    data-state={getTransactionStatusState(transaction.status)}
                    className={getStatusColor(transaction.status)}
                  >
                    <StatusIcon className="size-4" aria-hidden="true" />
                    <span className="text-sm">{transaction.status}</span>
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p>
                      {transaction.date} {transaction.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Token</p>
                    <p>{transaction.token}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p
                      className={`block truncate max-w-[120px] cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1 ${
                        transaction.amount.startsWith("+")
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                      title={transaction.amount}
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {transaction.amount}
                    </p>
                  </div>
                </div>
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <TagChip
                    assignedTags={(tagAssignments[transaction.id] ?? [])
                      .map((id) => allTags.find((t) => t.id === id))
                      .filter(Boolean) as Tag[]}
                    allTags={allTags}
                    onAssign={(tagId) => onAssignTag?.(transaction.id, tagId)}
                    onUnassign={(tagId) =>
                      onUnassignTag?.(transaction.id, tagId)
                    }
                    onCreateTag={(name) =>
                      onCreateTag?.(name) ?? {
                        id: "",
                        name,
                        color: "#34D399",
                      }
                    }
                    transactionId={transaction.id}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Quick-view Dialog */}
      <TransactionQuickViewDialog
        transaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        triggerRef={triggerRef}
      />
    </>
  );
}
