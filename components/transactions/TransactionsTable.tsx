import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { Transaction } from "@/types/transaction";
import { formatAmount, formatDate } from "@/utils/transactionUtils";
import TokenIcon from "./TokenIcon";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({
  transactions,
}: TransactionsTableProps) {
  return (
    <Card className="bg-[#110e11] border-[#2D2D2D] overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2D2D2D] bg-[#191919] hover:bg-[#191919]">
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Transaction Type
              </TableHead>
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Address
              </TableHead>
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Date
              </TableHead>
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Token
              </TableHead>
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Amount
              </TableHead>
              <TableHead className="text-white font-semibold text-sm py-4 px-6 text-left">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  No transactions found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="border-[#2D2D2D] hover:bg-[#160f17] transition-colors"
                >
                  <TableCell className="py-5 px-6 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-medium text-sm leading-tight">
                        {transaction.type}
                      </span>
                      <span className="text-gray-400 text-xs font-mono leading-tight">
                        #{transaction.txId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 align-top">
                    <span className="text-gray-300 font-mono text-sm">
                      {transaction.address}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 px-6 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm font-medium leading-tight">
                        {formatDate(transaction.date)}
                      </span>
                      <span className="text-gray-400 text-xs leading-tight">
                        {transaction.time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 align-top">
                    <div className="flex items-center gap-3">
                      <TokenIcon token={transaction.token} />
                      <span className="text-white font-medium text-sm">
                        {transaction.token}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 align-top">
                    <span
                      className={`font-semibold text-sm ${
                        transaction.amount >= 0 
                          ? "text-green-400" 
                          : "text-white"
                      }`}
                    >
                      {formatAmount(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 px-6 align-top">
                    <Badge
                      className={`
                        text-xs px-3 py-1.5 rounded-full font-semibold border-0
                        ${transaction.statusColor === "success" 
                          ? "bg-green-500/20 text-green-400" 
                          : ""
                        }
                        ${transaction.statusColor === "warning" 
                          ? "bg-orange-500/20 text-orange-400" 
                          : ""
                        }
                        ${transaction.statusColor === "destructive" 
                          ? "bg-red-500/20 text-red-400" 
                          : ""
                        }
                        hover:bg-opacity-30 transition-colors
                      `}
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}