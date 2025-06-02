"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TransactionProps } from "@/lib/interface";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface TransactionsTableProps {
  transactions: TransactionProps[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block w-full rounded-[12px] overflow-auto border border-[#2D2D2D]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#191919]">
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Transaction Type
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Address
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Date
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Token
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Amount
              </TableHead>
              <TableHead className="text-white font-bold border-[#2D2D2D] border-y-2 border-t-0">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index} className="border border-[#2D2D2D]">
                <TableCell className="font-medium border border-[#2D2D2D] md:py-4">
                  <h6 className="text-[#D7E0EF]"> {transaction.type} </h6>
                  <p>#{transaction.id}</p>
                </TableCell>
                <TableCell className="border border-[#2D2D2D] md:py-4">
                  {transaction.address}
                </TableCell>
                <TableCell className="border border-[#2D2D2D] md:py-4">
                  {transaction.date} {transaction.time}
                </TableCell>
                <TableCell className="flex gap-2 h-full items-center my-auto md:py-4">
                  <Image
                    src={transaction.tokenIcon}
                    alt={transaction.token}
                    width={20}
                    height={20}
                  />
                  {transaction.token}
                </TableCell>
                <TableCell className="border border-[#2D2D2D] ">
                  {transaction.amount}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${transaction.status === "Completed" ? "bg-[#102B19] text-[#04842E]" : transaction.status === "Pending" ? "bg-[#191919] text-[#9F6603]" : "bg-[#1A1A1A] text-[#B70B05]"}`}
                  >
                    {transaction.status}
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
