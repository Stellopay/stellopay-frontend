"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionsTableProps } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor } from "@/utils/transactionUtils";
import { EmptyState } from "@/components/ui/empty-state";
import { TRANSACTIONS_PAGE_SIZE } from "./transactions-config";
import { useRef, type KeyboardEvent } from "react";
import { DownloadReceiptButton } from "./download-receipt-button";

interface TransactionsTablePropsExtended extends TransactionsTableProps {
  isLoading?: boolean;
}

/**
 * TransactionsTable
 *
 * Renders the main transactions data grid with:
 * - Native `<table>` semantics so screen readers announce table/row/cell roles
 *   automatically without extra `role` attributes.
 * - A visually-hidden `<caption>` that screen readers announce as the table label.
 * - Truncated address and amount cells with a `title` tooltip so long values
 *   are accessible on hover/focus without breaking the table layout.
 * - Arrow-key row navigation (ArrowDown / ArrowUp / Home / End) so keyboard
 *   users can move between rows without leaving the table.
 * - Each data row has `tabIndex=0` and `data-navigable` so focus can land on
 *   rows and tests can locate navigable rows reliably.
 */
export function TransactionsTable({
  transactions,
  isLoading = false,
}: TransactionsTablePropsExtended) {
  const isEmpty = !isLoading && transactions.length === 0;

  /** Ref to the table wrapper div so we can query its navigable rows. */
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  /** Returns all data rows that have keyboard navigation enabled. */
  function getNavigableRows(): HTMLTableRowElement[] {
    if (!tableWrapperRef.current) return [];
    return Array.from(
      tableWrapperRef.current.querySelectorAll<HTMLTableRowElement>(
        "tr[data-navigable]",
      ),
    );
  }

  /**
   * Keyboard handler attached to each navigable row.
   * - ArrowDown  → focus next row (clamped at last)
   * - ArrowUp    → focus previous row (clamped at first)
   * - Home       → focus first row
   * - End        → focus last row
   * All other keys are left for default browser handling.
   */
  function handleRowKeyDown(
    e: KeyboardEvent<HTMLTableRowElement>,
    index: number,
  ) {
    const rows = getNavigableRows();
    if (rows.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = rows[Math.min(index + 1, rows.length - 1)];
        next?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = rows[Math.max(index - 1, 0)];
        prev?.focus();
        break;
      }
      case "Home": {
        e.preventDefault();
        rows[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        rows[rows.length - 1]?.focus();
        break;
      }
      default:
        break;
    }
  }

  return (
    <>
      {/* Desktop Table */}
      <div
        ref={tableWrapperRef}
        className="hidden md:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]"
      >
        <Table>
          {/* caption is visually hidden but announced by screen readers */}
          <caption className="sr-only">Transaction history</caption>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
              >
                Transaction Type
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
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
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
              >
                Amount
              </TableHead>
              <TableHead
                scope="col"
                className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6"
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
                <TableCell colSpan={6} className="py-12 text-center">
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
                  // Keyboard navigation attributes
                  data-navigable
                  tabIndex={0}
                  onKeyDown={(e) => handleRowKeyDown(e, index)}
                  className="border border-[#2D2D2D] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                >
                  <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                    <span className="text-[#D7E0EF]">{transaction.type}</span>
                    <p>#{transaction.id}</p>
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6 max-w-[200px]">
                    <span
                      className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ms-1"
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
                  <TableCell className="flex place-items-center gap-2 py-8 px-6">
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
                      className="block truncate cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ms-1"
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
          Array.from({ length: TRANSACTIONS_PAGE_SIZE }).map((_, index) => (
            <div
              key={`skeleton-mobile-${index}`}
              className="p-4 border rounded-lg border-[#2D2D2D]"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : isEmpty ? (
          <div className="p-8 border rounded-lg border-[#2D2D2D]">
            <EmptyState
              title="No Transactions Found"
              description="No transactions found. Try adjusting your filters."
            />
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {transaction.type} #{transaction.id}
                  </p>
                  <p
                    className="text-sm text-muted-foreground block truncate max-w-[180px] cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ml-1"
                    title={transaction.address}
                    tabIndex={0}
                  >
                    {transaction.address}
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
                    className={`block truncate max-w-[120px] cursor-help focus:outline-none focus:ring-2 focus:ring-[#D7E0EF] rounded px-1 -ms-1 ${
                      transaction.amount.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                    title={transaction.amount}
                    tabIndex={0}
                  >
                    {transaction.amount}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
