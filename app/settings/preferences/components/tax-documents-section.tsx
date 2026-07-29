"use client";

import { Download, FileText } from "lucide-react";
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

export interface TaxDocument {
  id: string;
  period: string;
  dateRange: string;
  type: string;
  status: "Ready" | "Processing";
  generatedAt: string;
  downloadUrl: string;
}

export const AVAILABLE_TAX_DOCUMENTS: TaxDocument[] = [
  {
    id: "stmt-2026-q2",
    period: "Q2 2026",
    dateRange: "Apr 1 - Jun 30, 2026",
    type: "Transaction statement",
    status: "Ready",
    generatedAt: "Jul 2, 2026",
    downloadUrl:
      "data:text/plain;charset=utf-8,Stellopay%20Q2%202026%20transaction%20statement",
  },
  {
    id: "tax-2025",
    period: "Tax year 2025",
    dateRange: "Jan 1 - Dec 31, 2025",
    type: "Tax summary",
    status: "Ready",
    generatedAt: "Jan 8, 2026",
    downloadUrl:
      "data:text/plain;charset=utf-8,Stellopay%202025%20tax%20summary",
  },
  {
    id: "stmt-2025-q4",
    period: "Q4 2025",
    dateRange: "Oct 1 - Dec 31, 2025",
    type: "Transaction statement",
    status: "Ready",
    generatedAt: "Jan 3, 2026",
    downloadUrl:
      "data:text/plain;charset=utf-8,Stellopay%20Q4%202025%20transaction%20statement",
  },
];

interface TaxDocumentsSectionProps {
  statements?: TaxDocument[];
}

export default function TaxDocumentsSection({
  statements = AVAILABLE_TAX_DOCUMENTS,
}: TaxDocumentsSectionProps) {
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
        {statements.length > 0 ? (
          <Table aria-label="Available statements and tax documents">
            <TableCaption>
              Documents are generated from completed Stellopay activity.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Date range</TableHead>
                <TableHead scope="col">Document type</TableHead>
                <TableHead scope="col">Generated</TableHead>
                <TableHead scope="col" className="text-right">
                  Download
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-white">
                    {statement.period}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                    {statement.dateRange}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                    {statement.type}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                    {statement.generatedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={statement.downloadUrl}
                        download={`${statement.id}.txt`}
                        aria-label={`Download ${statement.period} ${statement.type}`}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Download
                      </a>
                    </Button>
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
