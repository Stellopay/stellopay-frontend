"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionProps, TransactionsTableProps } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import TokenIcon from "./token-icon";

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block w-full rounded-[12px] overflow-x-auto overflow-y-visible border border-[#2D2D2D]">
        <Table className="min-w-full">
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
              <TableRow 
                key={index} 
                className="border border-[#2D2D2D] cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                onClick={() => {
                  if (transaction.txHash) {
                    window.open(`https://sepolia.starkscan.co/tx/${transaction.txHash}`, '_blank');
                  }
                }}
              >
                <TableCell className="font-medium border border-[#2D2D2D] py-4 px-6">
                  <h6 className="text-[#D7E0EF]"> {transaction.type} </h6>
                  <p>#{transaction.id}</p>
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6 max-w-[200px]">
                  <span className="truncate block">{transaction.address}</span>
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  {transaction.date} {transaction.time}
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6">
                  {transaction.type?.toLowerCase().includes("funded") ? (
                    (() => {
                      // Try to get token from transaction.token, or extract from amount
                      let token = transaction.token || "";
                      if (!token && transaction.amount) {
                        // Extract token from amount string (e.g., "11.00 STRK" or "$11.00")
                        const amountStr = transaction.amount.toUpperCase();
                        const tokenMatch = amountStr.match(/\b(USDC|USDT|STRK|XLM)\b/);
                        if (tokenMatch) {
                          token = tokenMatch[1];
                        } else if (amountStr.includes("$")) {
                          // Default to USDC if amount has $ symbol
                          token = "USDC";
                        }
                      }
                      return token ? (
                        <div className="flex items-center space-x-2">
                          <TokenIcon token={token} />
                          <span className="text-white">{token}</span>
                        </div>
                      ) : (
                        <span className="text-white">-</span>
                      );
                    })()
                  ) : (
                    <span className="text-white">-</span>
                  )}
                </TableCell>
                <TableCell className="border border-[#2D2D2D] py-4 px-6 ">
                  {transaction.type?.toLowerCase().includes("funded") ? (
                    <span className="text-white">
                      {transaction.amount && transaction.amount !== "-" 
                        ? transaction.amount.replace(/^-/, "") 
                        : "-"}
                    </span>
                  ) : (
                    <span className="text-white">-</span>
                  )}
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
          <div 
            key={index} 
            className="p-4 border rounded-lg cursor-pointer hover:bg-[#1A1A1A] transition-colors"
            onClick={() => {
              if (transaction.txHash) {
                window.open(`https://sepolia.starkscan.co/tx/${transaction.txHash}`, '_blank');
              }
            }}
          >
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
