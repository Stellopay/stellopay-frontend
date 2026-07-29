"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionsTableProps, TransactionProps } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getStatusColor } from "@/utils/transactionUtils";
import { truncateStellarAddress } from "@/utils/stellarAddress";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { TRANSACTIONS_PAGE_SIZE } from "./transactions-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

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
}

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
            <span>Transaction Details</span>
            <Badge
              aria-label={`Status: ${transaction.status}`}
              className={getStatusColor(transaction.status)}
            >
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
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-sm font-semibold">{transaction.status}</p>
            </div>
          </div>

          {/* Address & Counterparty */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
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
                <p className="text-sm font-medium text-muted-foreground">Counterparty</p>
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
              <time dateTime={transaction.date} className="text-sm font-semibold">
                {transaction.date}
              </time>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <time dateTime={transaction.time} className="text-sm font-semibold">
                {transaction.time}
              </time>
            </div>
          </div>

          {/* Token & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Token</p>
              <div className="flex items-center gap-2">
                <Image
                  src={transaction.tokenIcon}
                  alt={`${transaction.token} token icon`}
                  width={16}
                  height={16}
                />
                <span className="text-sm font-semibold">{transaction.token}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
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
              <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
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

export function TransactionsTable({
  transactions,
  isLoading = false,
  selectedIds = new Set(),
  onSelectRow,
  onSelectAll,
}: TransactionsTablePropsExtended) {
  const isEmpty = !isLoading && transactions.length === 0;
  
  // State for quick-view dialog
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionProps | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const handleRowClick = (transaction: TransactionProps, event: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleRowKeyDown = (transaction: TransactionProps, event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Open dialog on Enter or Space
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
      // Clear selected transaction when dialog closes
      setSelectedTransaction(null);
    }
  };

  /** Ids on the current page that can actually be selected */
  const selectableIds = transactions.map((t) => t.id);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));

  const someSelected =
    !allSelected && selectableIds.some((id) => selectedIds.has(id));

  /** Indeterminate state for the header checkbox */
  const headerCheckedState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const isSelectable = Boolean(onSelectRow && onSelectAll);

  return (
    <>
      {/* Desktop Table */}
      <div
        ref={tableWrapperRef}
        className="hidden md:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]"
      >
        <Table>
          {/* caption is visually hidden but announced by screen readers */}
          <caption className="sr-only">Transaction history. Click a row to view transaction details.</caption>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              {isSelectable && (
                <TableHead
                  scope="col"
                  className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-4 w-12"
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
                    className="border-[#555] data-[state=checked]:border-white data-[state=indeterminate]:border-white"
                  />
                </TableHead>
              )}
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
              >
                Transaction Type
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6 w-[200px]"
              >
                Address
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
              >
                Date
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
              >
                Token
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6 w-[140px]"
              >
                Amount
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6 w-[120px]"
              >
                Status
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
                  {isSelectable && (
                    <TableCell className="border border-[#2D2D2D] py-4 px-4 w-12">
                      <Skeleton className="size-4 rounded" />
                    </TableCell>
                  )}
                  <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="flex place-items-center gap-2 py-8 px-6">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={isSelectable ? 7 : 6}
                  className="py-12 text-center"
                >
                  <EmptyState
                    title="No Transactions Found"
                    description="No transactions found. Try adjusting your filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.id ?? index}
                  className="border border-[#2D2D2D]"
                >
                  <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                    <span className="text-[#D7E0EF]">{transaction.type}</span>
                    <p>#{transaction.id}</p>
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6 max-w-[200px]">
                    <span
                      className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                      title={transaction.address}
                      tabIndex={0}
                    >
                      {transaction.address}
                    </span>
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6">
                    <time dateTime={transaction.date}>
                      {transaction.date} {transaction.time}
                    </time>
                  </TableCell>
                  <TableCell className="flex place-items-center space-x-2 py-8 px-6">
                    <Image
                      src={transaction.tokenIcon}
                      alt={`${transaction.token} token icon`}
                      width={20}
                      height={20}
                    />
                    <span>{transaction.token}</span>
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6 max-w-[150px]">
                    <span
                      className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                      title={transaction.amount}
                      tabIndex={0}
                    >
                      {transaction.amount}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge
                      aria-label={`Status: ${transaction.status}`}
                      className={getStatusColor(transaction.status)}
                    >
                      <span className="text-sm">{transaction.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-2 w-12">
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
                  </TableCell>
                </TableRow>
              ))
            )}

            <DownloadReceiptButton
            transaction={{
              id: transaction.id,
              hash: transaction.hash,
              amount: transaction.amount,
              counterparty: transaction.counterparty,
              timestamp: transaction.timestamp,
            }}
          />
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
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
          transactions.map((transaction, index) => (
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
                    {transaction.status}
                  </p>
                </div>
                <Badge
                  variant={
                    transaction.status === "Completed"
                      ? "default"
                      : transaction.status === "Pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {transaction.status}
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
            </button>
          ))
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
