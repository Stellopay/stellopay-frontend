"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { useTransactionTags } from "@/hooks/useTransactionTags";
import type { Transaction } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadReceiptButton } from "./download-receipt-button";
import { getStatusColor } from "@/utils/transactionUtils";

function getTimestamp(transaction: Transaction): Date {
  const date = new Date(`${transaction.date}T00:00:00.000Z`);
  const time = transaction.time.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i,
  );

  if (!Number.isNaN(date.getTime()) && time) {
    let hours = Number(time[1]);
    const meridiem = time[4]?.toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const minutes = Number(time[2]);
    const seconds = Number(time[3] ?? 0);

    if (hours < 24 && minutes < 60 && seconds < 60) {
      date.setUTCHours(hours, minutes, seconds);
      return date;
    }
  }

  const parsed = new Date(`${transaction.date} ${transaction.time}`);
  return Number.isNaN(parsed.getTime()) ? new Date(transaction.date) : parsed;
}

function formatTimestamp(date: Date, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
    timeStyle: "long",
  };
  if (timezone) options.timeZone = timezone;

  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "long",
    }).format(date);
  }
}

function formatAmount(amount: number, token: string): string {
  const sign = amount < 0 ? "−" : "+";
  return `${sign}${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} ${token}`;
}

export function TransactionDetailView({
  transaction,
}: {
  transaction: Transaction;
}) {
  const profile = useProfile();
  const { getTagsForTransaction } = useTransactionTags();
  const timezone =
    profile.status === "success"
      ? profile.profile.timezone || undefined
      : undefined;
  const timestamp = getTimestamp(transaction);
  const tags = [
    ...(transaction.tags ?? []),
    ...getTagsForTransaction(transaction.id).map((tag) => tag.name),
  ];
  const uniqueTags = [...new Set(tags)];
  const hash = transaction.hash ?? transaction.txId;
  const counterparty = transaction.counterparty ?? transaction.address;

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to transactions
      </Link>

      <section
        aria-labelledby="transaction-heading"
        className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{transaction.type}</p>
            <h1
              id="transaction-heading"
              className="mt-1 text-2xl font-semibold"
            >
              Transaction #{transaction.id}
            </h1>
          </div>
          <Badge
            aria-label={`Status: ${transaction.status}`}
            className={getStatusColor(transaction.status)}
          >
            {transaction.status}
          </Badge>
        </header>

        <p className="mt-8 text-3xl font-semibold" aria-label="Amount">
          {formatAmount(transaction.amount, transaction.token)}
        </p>

        <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Counterparty</dt>
            <dd className="mt-1 break-all font-mono text-sm">{counterparty}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Transaction hash</dt>
            <dd className="mt-1 break-all font-mono text-sm">{hash}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Fee</dt>
            <dd className="mt-1 text-sm">
              {transaction.fee ?? "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Timestamp</dt>
            <dd className="mt-1 text-sm">
              <time dateTime={timestamp.toISOString()}>
                {formatTimestamp(timestamp, timezone)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Memo</dt>
            <dd className="mt-1 break-words text-sm">
              {transaction.memo || "No memo provided"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Tags</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {uniqueTags.length > 0 ? (
                uniqueTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm">No tags</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          <DownloadReceiptButton
            transaction={{
              id: transaction.id,
              hash,
              amount: formatAmount(transaction.amount, transaction.token),
              counterparty,
              timestamp: timestamp.toISOString(),
            }}
          />
          <Button asChild variant="outline">
            <Link href="/transactions">Transaction list</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
