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
            <TableRow className="border-[#2D2D2D]  bg-[#191919] hover:bg-[#191919]">
              <TableHead className="text-white font-medium py-4 px-6">
                Transaction Type
              </TableHead>
              <TableHead className="text-white font-medium py-4 px-6">
                Address
              </TableHead>
              <TableHead className="text-white font-medium py-4 px-6">
                Date
              </TableHead>
              <TableHead className="text-white font-medium py-4 px-6">
                Token
              </TableHead>
              <TableHead className="text-white font-medium py-4 px-6">
                Amount
              </TableHead>
              <TableHead className="text-white font-medium py-4 px-6">
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
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-[#D7E0EF] font-medium text-sm">
                        {transaction.type}
                      </span>
                      <span className="text-white text-xs">
                        {transaction.txId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-[#D7E0EF] font-mono text-sm">
                      {transaction.address}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-white text-sm">
                      {formatDate(transaction.date)} | {transaction.time}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <TokenIcon token={transaction.token} />
                      <span className="text-white font-medium text-sm">
                        {transaction.token}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span
                      className={`font-medium text-sm ${transaction.amount >= 0 ? "text-green-400" : "text-white"}`}
                    >
                      {formatAmount(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge
                      className={`
                        text-xs px-3 py-1 rounded-full font-medium
                        ${transaction.statusColor === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : ""}
                        ${transaction.statusColor === "warning" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : ""}
                        ${transaction.statusColor === "destructive" ? "bg-red-500/20 text-red-400 border border-red-500/30" : ""}
                        hover:bg-opacity-30
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
