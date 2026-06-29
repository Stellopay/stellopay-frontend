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

interface TransactionsTablePropsExtended extends TransactionsTableProps {
  isLoading?: boolean;
}

export function TransactionsTable({ transactions, isLoading = false }: TransactionsTablePropsExtended) {
  const isEmpty = !isLoading && transactions.length === 0;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]">
        <Table>
          {/* caption is visually hidden but announced by screen readers */}
          <caption className="sr-only">Transaction history</caption>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Transaction Type
              </TableHead>
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Address
              </TableHead>
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Date
              </TableHead>
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Token
              </TableHead>
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Amount
              </TableHead>
              <TableHead scope="col" className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: TRANSACTIONS_PAGE_SIZE }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="border border-[#2D2D2D]">
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
                  <TableCell className="flex place-items-center space-x-2 py-8 px-6">
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
                <TableRow key={transaction.id ?? index} className="border border-[#2D2D2D]">
                  <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                    <span className="text-[#D7E0EF]">{transaction.type}</span>
                    <p>#{transaction.id}</p>
                  </TableCell>
                  <TableCell className="border border-[#2D2D2D] py-4 px-6">
                    {transaction.address}
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
                  <TableCell className="border border-[#2D2D2D] py-4 px-6 ">
                    {transaction.amount}
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
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: TRANSACTIONS_PAGE_SIZE }).map((_, index) => (
            <div key={`skeleton-mobile-${index}`} className="p-4 border rounded-lg border-[#2D2D2D]">
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
                  <p className="text-sm text-muted-foreground">
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
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p
                    className={
                      transaction.amount.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }
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
