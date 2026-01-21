"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsTableSkeletonProps {
  /**
   * Number of skeleton rows to display
   */
  rows?: number;
}

/**
 * Skeleton loading state for the transactions table
 * Displays placeholder rows with shimmer animation
 */
export function TransactionsTableSkeleton({
  rows = 6,
}: TransactionsTableSkeletonProps) {
  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Transaction Type
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Address
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Date
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Token
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Amount
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0 py-4 px-6">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index} className="border border-[#2D2D2D]">
                {/* Transaction Type */}
                <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" shade="light" />
                  </div>
                </TableCell>
                {/* Address */}
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* Date */}
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                {/* Token */}
                <TableCell className="flex place-items-center space-x-2 py-8 px-6">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                {/* Amount */}
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Status */}
                <TableCell className="py-4 px-6">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 border border-[#2D2D2D] rounded-lg">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" shade="light" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-10" shade="light" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-10" shade="light" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-14" shade="light" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default TransactionsTableSkeleton;
