"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TransactionProps, TransactionsTableProps } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <>
      {/* Desktop Table */}
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
            {transactions.map((transaction, index) => (
              <TableRow key={index} className="border border-[#2D2D2D]">
                <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                  <h6 className="text-[#D7E0EF]"> {transaction.type} </h6>
                  <p>#{transaction.id}</p>
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  {transaction.address}
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  {transaction.date} {transaction.time}
                </TableCell>
                <TableCell className="flex place-items-center space-x-2 py-8 px-6">
                  <Image
                    src={transaction.tokenIcon}
                    alt={transaction.token}
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
                    className={`${transaction.status === "Completed" ? "bg-[#102B19] text-[#04842E]" : transaction.status === "Pending" ? "bg-[#191919] text-[#9F6603]" : "bg-[#1A1A1A] text-[#B70B05]"}`}
                  >
                    <span className="text-sm">{transaction.status}</span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {transactions.map((transaction, index) => (
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
        ))}
      </div>
    </>
  );
}
