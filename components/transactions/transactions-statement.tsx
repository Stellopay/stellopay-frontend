"use client";

import type { Transaction } from "@/types/transaction";
import { formatDate, parseTransactionDate } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/formatUtils";

export interface StatementSummary {
  openingBalance: number;
  closingBalance: number;
  moneyIn: number;
  moneyOut: number;
  transactionCount: number;
  categories: Array<{ category: string; total: number; count: number }>;
}

const dateValue = (date: string) =>
  (parseTransactionDate(date) ?? new Date(date)).getTime();

/**
 * Builds a reconciliation summary from a complete account ledger. The opening
 * balance is the signed total of entries before `fromDate`; entries on both
 * selected boundary dates are included in the statement period.
 */
export function createStatementSummary(
  ledger: Transaction[],
  fromDate: string,
  toDate: string,
): StatementSummary {
  const from = new Date(`${fromDate}T00:00:00`).getTime();
  const to = new Date(`${toDate}T23:59:59.999`).getTime();
  const period = ledger.filter((transaction) => {
    const timestamp = dateValue(transaction.date);
    return Number.isFinite(timestamp) && timestamp >= from && timestamp <= to;
  });
  const openingBalance = ledger.reduce((total, transaction) => {
    const timestamp = dateValue(transaction.date);
    return Number.isFinite(timestamp) && timestamp < from
      ? total + transaction.amount
      : total;
  }, 0);
  const categories = new Map<string, { total: number; count: number }>();
  for (const transaction of period) {
    const current = categories.get(transaction.type) ?? { total: 0, count: 0 };
    categories.set(transaction.type, {
      total: current.total + transaction.amount,
      count: current.count + 1,
    });
  }
  const moneyIn = period.reduce(
    (total, transaction) => total + Math.max(transaction.amount, 0),
    0,
  );
  const moneyOut = period.reduce(
    (total, transaction) => total + Math.min(transaction.amount, 0),
    0,
  );

  return {
    openingBalance,
    closingBalance: openingBalance + moneyIn + moneyOut,
    moneyIn,
    moneyOut,
    transactionCount: period.length,
    categories: [...categories.entries()]
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => a.category.localeCompare(b.category)),
  };
}

interface TransactionsStatementProps {
  fromDate: string;
  toDate: string;
  ledger: Transaction[];
  onClose: () => void;
}

export function TransactionsStatement({
  fromDate,
  toDate,
  ledger,
  onClose,
}: TransactionsStatementProps) {
  const summary = createStatementSummary(ledger, fromDate, toDate);

  return (
    <section
      className="statement-print-root mx-4 mb-6 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:mx-6 sm:p-6 lg:mx-8"
      aria-labelledby="statement-title"
    >
      <div className="statement-actions mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Reconciliation document</p>
          <h2 id="statement-title" className="text-xl font-semibold">Account statement</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Close statement
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Print or save as PDF
          </button>
        </div>
      </div>

      <header className="mb-6">
        <h3 className="text-2xl font-semibold">Statement summary</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <time dateTime={fromDate}>{formatDate(fromDate)}</time> to{" "}
          <time dateTime={toDate}>{formatDate(toDate)}</time>
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Opening balance", summary.openingBalance],
          ["Money in", summary.moneyIn],
          ["Money out", summary.moneyOut],
          ["Closing balance", summary.closingBalance],
        ].map(([label, amount]) => (
          <div key={label as string} className="rounded-lg border border-border bg-muted/30 p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(amount as number)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <caption className="caption-top p-4 text-left font-semibold">
            Totals by category <span className="font-normal text-muted-foreground">({summary.transactionCount} transactions)</span>
          </caption>
          <thead className="border-y border-border bg-muted/50 text-muted-foreground">
            <tr><th scope="col" className="px-4 py-3 font-medium">Category</th><th scope="col" className="px-4 py-3 text-right font-medium">Transactions</th><th scope="col" className="px-4 py-3 text-right font-medium">Net total</th></tr>
          </thead>
          <tbody>
            {summary.categories.length ? summary.categories.map((category) => (
              <tr key={category.category} className="border-b border-border last:border-0">
                <th scope="row" className="max-w-[16rem] break-words px-4 py-3 text-left font-medium">{category.category}</th>
                <td className="px-4 py-3 text-right tabular-nums">{category.count}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(category.total)}</td>
              </tr>
            )) : <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No transactions were posted in this date range.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Amounts are signed transaction totals. Opening balance is calculated from recorded activity before the selected start date.</p>
    </section>
  );
}
