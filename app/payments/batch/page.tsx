"use client";

import { useState, useRef, useTransition, useId } from "react";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateUploadedFile, MAX_FILE_SIZE_BYTES } from "@/utils/file-validation";
import { parseCsvChunked } from "@/utils/csvParse";
import {
  validateBatchData,
  generateErrorReportCsv,
  getBatchTemplateCsv,
  MAX_BATCH_ROWS,
  BatchValidationResult,
  stroopsToAmountString,
  parseAmountToStroops,
} from "@/lib/batch-payments";
import { downloadCsvContent } from "@/utils/csvUtils";
import { submitBatch, SubmitBatchResponse } from "@/lib/api/payments";
import { truncateStellarAddress } from "@/utils/stellarAddress";

export default function BatchPayrollPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);

  const [validationResult, setValidationResult] = useState<BatchValidationResult | null>(null);
  const [excludedRowNumbers, setExcludedRowNumbers] = useState<Set<number>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<SubmitBatchResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputId = useId();

  // Handle file selection and validation
  async function handleFile(file: File) {
    setFileError(null);
    setSubmitSuccess(null);
    setSubmitError(null);
    setValidationResult(null);
    setExcludedRowNumbers(new Set());

    // 1. Validate file by content, size, and structure before parsing
    const validation = await validateUploadedFile(file, {
      allowedTypes: ["text/csv"],
      structuralKind: "csv",
    });

    if (!validation.valid) {
      setFileError(validation.error.message);
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setParseProgress(0);

    try {
      const text = await file.text();

      // 2. Strict chunked parsing to prevent UI blocking
      const parsed = await parseCsvChunked(text, {
        maxRows: MAX_BATCH_ROWS + 1, // account for header
        onProgress: (p) => setParseProgress(p),
      });

      if (parsed.rows.length === 0) {
        setFileError("The uploaded CSV contains no payment data rows.");
        setIsParsing(false);
        return;
      }

      if (parsed.rows.length > MAX_BATCH_ROWS) {
        setFileError(`Batch exceeds maximum allowed size of ${MAX_BATCH_ROWS} rows.`);
        setIsParsing(false);
        return;
      }

      // 3. Batch validation and duplicate detection
      startTransition(() => {
        const result = validateBatchData(parsed.headers, parsed.rows);
        setValidationResult(result);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse CSV file.";
      setFileError(msg);
    } finally {
      setIsParsing(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function toggleRowExclusion(rowNumber: number) {
    setExcludedRowNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  }

  function excludeAllInvalidRows() {
    if (!validationResult) return;
    const invalidRows = validationResult.rows.filter((r) => !r.isValid).map((r) => r.rowNumber);
    setExcludedRowNumbers(new Set(invalidRows));
  }

  function handleDownloadTemplate() {
    downloadCsvContent("stellopay-batch-template.csv", getBatchTemplateCsv());
  }

  function handleDownloadErrorReport() {
    if (!validationResult) return;
    const invalidRows = validationResult.rows.filter((r) => !r.isValid);
    if (invalidRows.length === 0) return;
    const errorCsv = generateErrorReportCsv(invalidRows);
    downloadCsvContent(`${fileName || "batch"}-errors.csv`, errorCsv);
  }

  function handleReset() {
    setFileName(null);
    setFileError(null);
    setValidationResult(null);
    setExcludedRowNumbers(new Set());
    setSubmitSuccess(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmitBatch() {
    if (!validationResult) return;

    // Filter rows that are both valid and not excluded
    const activeValidRows = validationResult.rows.filter(
      (r) => r.isValid && !excludedRowNumbers.has(r.rowNumber),
    );

    if (activeValidRows.length === 0) {
      setSubmitError("No valid rows selected for batch payment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        items: activeValidRows.map((r) => ({
          address: r.data.address,
          amount: r.data.amount,
          asset: r.data.asset,
          memo: r.data.memo || undefined,
        })),
        batchName: fileName || "Payroll Batch",
      };

      const response = await submitBatch(payload);
      setSubmitSuccess(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Active totals calculation
  const activeValidRows = validationResult
    ? validationResult.rows.filter((r) => r.isValid && !excludedRowNumbers.has(r.rowNumber))
    : [];

  const activeTotalsByAsset = activeValidRows.reduce((acc, row) => {
    const asset = row.data.asset;
    try {
      const stroops = parseAmountToStroops(row.data.amount);
      const current = acc[asset] || 0n;
      acc[asset] = current + stroops;
    } catch {
      // Ignore
    }
    return acc;
  }, {} as Record<string, bigint>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Batch Payroll Payments</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Import a CSV file to validate recipient addresses, verify exact amounts, and submit bulk payroll.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          {validationResult && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {!validationResult && (
        <Card className="border-dashed border-2 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed transition-all cursor-pointer ${
                isDragging ? "border-purple-500 bg-purple-500/10" : "border-zinc-700"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Drag and drop your payroll CSV here
              </h2>
              <p className="text-sm text-zinc-400 mb-4 max-w-md">
                Files must be valid UTF-8 CSVs up to {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB and max {MAX_BATCH_ROWS} rows.
              </p>

              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <Button
                type="button"
                variant="secondary"
                disabled={isParsing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing CSV... ({parseProgress}%)
                  </>
                ) : (
                  "Select CSV File"
                )}
              </Button>
            </div>

            {fileError && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 flex items-start gap-3"
              >
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-200">File Validation Failed</h4>
                  <p className="text-sm mt-0.5">{fileError}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Summary and Controls */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div
            role="status"
            aria-live="polite"
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Total Rows</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {validationResult.totalRows}
                    </p>
                  </div>
                  <FileText className="w-7 h-7 text-zinc-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Valid Rows</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {validationResult.validCount}
                    </p>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Invalid Rows</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      {validationResult.invalidCount}
                    </p>
                  </div>
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Duplicates Found</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {validationResult.duplicateCount}
                    </p>
                  </div>
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Asset Totals Section */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">
                Active Batch Totals by Asset (Exact Decimal Precision)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="status"
                aria-live="polite"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
              >
                {Object.keys(activeTotalsByAsset).length === 0 ? (
                  <p className="text-sm text-zinc-500">No active valid rows.</p>
                ) : (
                  Object.entries(activeTotalsByAsset).map(([asset, stroops]) => (
                    <div
                      key={asset}
                      className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center"
                    >
                      <span className="font-mono text-sm font-medium text-purple-300">
                        {asset}
                      </span>
                      <span className="font-mono text-base font-bold text-white">
                        {stroopsToAmountString(stroops)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-3">
              {validationResult.invalidCount > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownloadErrorReport}
                    className="flex items-center gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs sm:text-sm"
                  >
                    <Download className="w-4 h-4 text-red-400" />
                    Download Error Report ({validationResult.invalidCount})
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={excludeAllInvalidRows}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Exclude All Bad Rows
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                disabled={isSubmitting || activeValidRows.length === 0}
                onClick={handleSubmitBatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Batch...
                  </>
                ) : (
                  <>
                    Submit Batch ({activeValidRows.length} payments)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Submission Feedback */}
          {submitSuccess && (
            <div
              role="alert"
              aria-live="polite"
              className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-200">Batch Successfully Queued!</h4>
                <p className="text-sm mt-0.5">{submitSuccess.message}</p>
                <p className="text-xs text-emerald-400/80 mt-1 font-mono">
                  Batch ID: {submitSuccess.batchId} | Time: {submitSuccess.submittedAt}
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-200">Batch Submission Failed</h4>
                <p className="text-sm mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Validation Table */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-base font-semibold text-white flex items-center justify-between">
                <span>Row-by-Row Review ({validationResult.rows.length} rows)</span>
                <span className="text-xs text-zinc-400 font-normal">
                  Excluded: {excludedRowNumbers.size} row(s)
                </span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-800/70 text-xs uppercase text-zinc-400 font-semibold border-b border-zinc-700/60">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-16">Row</th>
                    <th scope="col" className="px-4 py-3">Recipient Address</th>
                    <th scope="col" className="px-4 py-3">Amount</th>
                    <th scope="col" className="px-4 py-3">Asset</th>
                    <th scope="col" className="px-4 py-3">Memo</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {validationResult.rows.map((row) => {
                    const isExcluded = excludedRowNumbers.has(row.rowNumber);

                    return (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isExcluded ? "opacity-40 bg-zinc-950/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          #{row.rowNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <span title={row.data.address}>
                            {truncateStellarAddress(row.data.address, 8, 8) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.data.amount || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-purple-300">
                          {row.data.asset || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 truncate max-w-[120px]">
                          {row.data.memo || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.isValid ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                Invalid
                              </Badge>
                              <div className="text-[11px] text-red-400 leading-tight">
                                {row.errors.map((err, eIdx) => (
                                  <div key={eIdx}>• {err}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExclusion(row.rowNumber)}
                            className="text-xs text-zinc-400 hover:text-white"
                          >
                            {isExcluded ? "Include" : "Exclude"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
