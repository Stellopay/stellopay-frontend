"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Download,
  FileText,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/context/wallet-context";
import { generateInvoicePdf } from "@/components/invoices/invoice-pdf";
import {
  deleteInvoice,
  loadInvoices,
  setInvoiceStatus,
} from "@/lib/invoices-store";
import { createAccountScope } from "@/lib/realtime-registry";
import type { Invoice, InvoiceDisplayStatus } from "@/types/invoice";
import { getInvoiceStatus } from "@/types/invoice";
import {
  calculateInvoiceTotals,
  formatMinorUnits,
  parseMoneyToMinorUnits,
  parseTaxRateToBps,
} from "@/utils/moneyUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/commonUtils";

const STATUS_FILTERS: Array<"all" | InvoiceDisplayStatus> = [
  "all",
  "draft",
  "sent",
  "paid",
  "overdue",
];

const STATUS_STYLES: Record<InvoiceDisplayStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

function totalFor(invoice: Invoice): number {
  const totals = calculateInvoiceTotals(
    invoice.lineItems.map((item) => ({
      quantity: item.quantity,
      unitPriceMinorUnits: parseMoneyToMinorUnits(item.unitPrice) ?? 0,
    })),
    parseTaxRateToBps(invoice.taxRate) ?? 0,
  );
  return totals.totalMinorUnits;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function InvoicesPage() {
  const { address, network } = useWallet();
  const account = createAccountScope(network.id, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | InvoiceDisplayStatus
  >("all");
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setInvoices(loadInvoices(account));
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const result: Record<"all" | InvoiceDisplayStatus, number> = {
      all: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
    };
    for (const invoice of invoices) {
      result[getInvoiceStatus(invoice)] += 1;
    }
    return result;
  }, [invoices]);

  const visibleInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const status = getInvoiceStatus(invoice);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!needle) return true;
      return [invoice.number, invoice.customerName, invoice.customerEmail]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [invoices, search, statusFilter]);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      await generateInvoicePdf(invoice);
      toast.success(`Invoice ${invoice.number} downloaded.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The invoice PDF could not be generated.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = (invoice: Invoice, status: "sent" | "paid") => {
    try {
      setInvoiceStatus(account, invoice.id, status);
      refresh();
      toast.success(`Invoice ${invoice.number} marked as ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    }
  };

  const handleDelete = (invoice: Invoice) => {
    try {
      deleteInvoice(account, invoice.id);
      refresh();
      toast.success(`Invoice ${invoice.number} deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Invoices
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create invoices, track their status and download PDF copies.
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus aria-hidden />
            New invoice
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div
          role="group"
          aria-label="Filter invoices by status"
          className="flex flex-wrap gap-2"
        >
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                statusFilter === status
                  ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              {status} ({counts[status]})
            </button>
          ))}
        </div>

        <div className="w-full max-w-xs">
          <label
            htmlFor="invoice-search"
            className="mb-1 block text-sm font-medium"
          >
            Search invoices
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              id="invoice-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Number or customer"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {visibleInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <FileText className="mx-auto h-10 w-10 text-zinc-400" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            No invoices found
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {invoices.length === 0
              ? "Create your first invoice to get started."
              : "Try a different status filter or search term."}
          </p>
          {invoices.length === 0 && (
            <Button asChild className="mt-6">
              <Link href="/invoices/new">Create invoice</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Invoices</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Invoice
                </th>
                <th scope="col" className="px-4 py-3">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3">
                  Due date
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visibleInvoices.map((invoice) => {
                const status = getInvoiceStatus(invoice);
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {invoice.status === "draft" ? (
                        <Link
                          href={`/invoices/new?edit=${encodeURIComponent(invoice.id)}`}
                          className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
                        >
                          {invoice.number}
                        </Link>
                      ) : (
                        invoice.number
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-xs text-zinc-500">
                        {invoice.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          STATUS_STYLES[status],
                        )}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {invoice.currency} {formatMinorUnits(totalFor(invoice))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void handleDownload(invoice)}
                          disabled={downloadingId === invoice.id}
                          aria-label={`Download PDF for invoice ${invoice.number}`}
                          title="Download PDF"
                          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Download aria-hidden />
                        </button>
                        {status === "draft" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(invoice, "sent")}
                            aria-label={`Mark invoice ${invoice.number} as sent`}
                            title="Mark as sent"
                            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Send aria-hidden />
                          </button>
                        )}
                        {status !== "paid" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(invoice, "paid")}
                            aria-label={`Mark invoice ${invoice.number} as paid`}
                            title="Mark as paid"
                            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Check aria-hidden />
                          </button>
                        )}
                        {invoice.status === "draft" && (
                          <Link
                            href={`/invoices/new?edit=${encodeURIComponent(invoice.id)}`}
                            aria-label={`Edit draft invoice ${invoice.number}`}
                            title="Edit"
                            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Pencil aria-hidden />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(invoice)}
                          aria-label={`Delete invoice ${invoice.number}`}
                          title="Delete"
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Invoices are stored in this browser for the connected account.
      </p>
    </main>
  );
}
