"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getReceiptValidationError } from "./receipt-validation";
import {
  generateTransactionReceiptPdf,
  type ReceiptTransaction,
} from "./receipt";

export function DownloadReceiptButton({
  transaction,
}: {
  transaction: ReceiptTransaction;
}) {
  const validationError = getReceiptValidationError(transaction);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (validationError) return;
    setError(null);
    setIsGenerating(true);
    try {
      await generateTransactionReceiptPdf(transaction);
    } catch {
      setError("Couldn't generate the receipt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start">
      <Button
        onClick={handleDownload}
        disabled={isGenerating || Boolean(validationError)}
        variant="ghost"
        size="sm"
        aria-label={
          validationError
            ? "Download PDF receipt"
            : `Download PDF receipt for transaction ${transaction.hash}`
        }
        className="focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isGenerating ? "Generating…" : "Download receipt"}
      </Button>
      {(validationError || error) && (
        <span role="alert" className="text-xs text-destructive mt-1">
          {validationError?.message ?? error}
        </span>
      )}
    </div>
  );
}
