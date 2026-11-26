"use client";

import { useCallback, useEffect, useState } from "react";

import { getTransactionById } from "@/lib/api";
import type { Transaction } from "@/types/transaction";

interface UseTransactionResult {
  data: Transaction | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Load one transaction and cancel stale requests when the id changes. */
export function useTransaction(id: string): UseTransactionResult {
  const [data, setData] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestNumber, setRequestNumber] = useState(0);

  const refetch = useCallback(() => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getTransactionById(id, controller.signal)
      .then((transaction) => {
        if (controller.signal.aborted) return;
        setData(transaction);
        setIsLoading(false);
      })
      .catch((reason: unknown) => {
        const isAbortError =
          typeof reason === "object" &&
          reason !== null &&
          "name" in reason &&
          reason.name === "AbortError";
        if (controller.signal.aborted || isAbortError) return;

        setError(
          reason instanceof Error
            ? reason
            : new Error("Failed to load transaction."),
        );
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [id, requestNumber]);

  return { data, isLoading, error, refetch };
}
