"use client";

import { useState } from "react";
import { Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";
import { getSavedTimezone } from "@/utils/date-utils";
import {
  TAX_STATEMENT_DISCLAIMER,
  deriveTaxPeriods,
  buildTaxReportData,
  generateTaxReportCsv,
  generateTaxReportPdfBlob,
  triggerBlobDownload,
  type TaxPeriod,
} from "@/utils/taxReport";

export interface TaxDocument {
  id: string;
  period: string;
  dateRange: string;
  type: string;
  status: "Ready" | "Processing";
  generatedAt?: string;
  downloadUrl?: string;
}

// Deprecated empty list preserved for backward compatibility without static placeholder data URLs
export const AVAILABLE_TAX_DOCUMENTS: TaxDocument[] = [];

export interface TaxDocumentsSectionProps {
  statements?: TaxDocument[];
  transactions?: Transaction[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  timezone?: string;
}

export default function TaxDocumentsSection({
  transactions: propTransactions,
  isLoading: propIsLoading,
  error: propError,
  onRetry: propOnRetry,
  timezone: propTimezone,
}: TaxDocumentsSectionProps) {
  // If transactions are not provided as props, fetch via hook
  const {
    data: hookData,
    isLoading: hookIsLoading,
    error: hookError,
    refetch,
  } = useTransactions({ pageSize: 100 });

  const transactions = propTransactions ?? hookData?.data ?? [];
  const isLoading =
    propIsLoading ?? (propTransactions !== undefined ? false : hookIsLoading);
  const error =
    propError ?? (propTransactions !== undefined ? null : hookError);
  const handleRetry = propOnRetry ?? refetch;

  const timezone = propTimezone || getSavedTimezone();
  const periods = deriveTaxPeriods(transactions, timezone);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadCsv = (period: TaxPeriod) => {
    try {
      setDownloadError(null);
      const reportData = buildTaxReportData(transactions, period, timezone);
      const csvContent = generateTaxReportCsv(reportData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerBlobDownload(blob, `${period.id}.csv`);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to generate CSV download",
      );
    }
  };

  const handleDownloadPdf = async (period: TaxPeriod) => {
    try {
      setDownloadError(null);
      setDownloadingId(`${period.id}-pdf`);
      const reportData = buildTaxReportData(transactions, period, timezone);
      const blob = await generateTaxReportPdfBlob(reportData);
      triggerBlobDownload(blob, `${period.id}.pdf`);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to generate PDF download",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
      <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
        <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
          Statements and tax documents
        </CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400">
          Download periodic statements and tax-relevant transaction summaries
          for accounting, reconciliation, and year-end reporting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Informational Disclaimer Banner */}
        <div
          role="note"
          aria-label="Informational tax disclaimer"
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200"
        >
          <p className="font-semibold">Notice</p>
          <p className="mt-0.5">{TAX_STATEMENT_DISCLAIMER}</p>
        </div>

        {downloadError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{downloadError}</span>
          </div>
        )}

        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center py-12 text-zinc-500"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <span className="mt-3 text-sm">Loading activity records...</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <AlertCircle
              className="h-10 w-10 text-destructive"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : periods.length > 0 ? (
          <Table aria-label="Available statements and tax documents">
            <TableCaption>
              Documents are dynamically generated from recorded Stellopay
              activity.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Date range</TableHead>
                <TableHead scope="col">Document type</TableHead>
                <TableHead scope="col" className="text-right">
                  Downloads
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-white">
                    {period.period}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                    {period.dateRange}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                    {period.type}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCsv(period)}
                        aria-label={`Download ${period.period} CSV`}
                      >
                        <Download
                          className="mr-1 h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(period)}
                        disabled={downloadingId === `${period.id}-pdf`}
                        aria-label={`Download ${period.period} PDF`}
                      >
                        {downloadingId === `${period.id}-pdf` ? (
                          <Loader2
                            className="mr-1 h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Download
                            className="mr-1 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10" aria-hidden="true" />}
            title="No statements available yet"
            description="Statements appear here after completed payment activity is ready for monthly, quarterly, or annual reporting."
          />
        )}
      </CardContent>
    </Card>
  );
}
