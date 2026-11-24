/**
 * @fileoverview Payment request context for managing SEP-0007 payment requests.
 *
 * This context manages the lifecycle of payment requests including creation,
 * status updates (Pending, Paid, Expired), and persistence to localStorage.
 *
 * Status derivation:
 * - Pending: Default status for new requests
 * - Expired: Requests past their expiry date
 * - Paid: Manually marked as paid (until Horizon streaming is implemented)
 */

"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from "react";

/**
 * Status of a payment request.
 */
export type RequestStatus = "Pending" | "Paid" | "Expired";

/**
 * A payment request for receiving funds via SEP-0007 URI.
 */
export interface PaymentRequest {
  /** Unique identifier for the request. */
  id: string;
  /** The destination Stellar address. */
  destination: string;
  /** The amount requested (optional). */
  amount?: string;
  /** The asset code (e.g., "USDC", "XLM"). */
  assetCode?: string;
  /** The asset issuer address (for custom assets). */
  assetIssuer?: string;
  /** Optional memo for the payment. */
  memo?: string;
  /** Optional memo type. */
  memoType?: string;
  /** Optional human-readable message. */
  message?: string;
  /** The generated SEP-0007 URI. */
  uri: string;
  /** Current status of the request. */
  status: RequestStatus;
  /** ISO timestamp when the request was created. */
  createdAt: string;
  /** ISO timestamp when the request expires (optional). */
  expiresAt?: string;
  /** ISO timestamp when the request was marked as paid (optional). */
  paidAt?: string;
}

/**
 * Parameters for creating a new payment request.
 */
export interface CreatePaymentRequestParams {
  /** The destination Stellar address. */
  destination: string;
  /** The amount requested (optional). */
  amount?: string;
  /** The asset code (e.g., "USDC", "XLM"). */
  assetCode?: string;
  /** The asset issuer address (for custom assets). */
  assetIssuer?: string;
  /** Optional memo for the payment. */
  memo?: string;
  /** Optional memo type. */
  memoType?: string;
  /** Optional human-readable message. */
  message?: string;
  /** Optional expiry time in hours from creation. */
  expiryHours?: number;
}

interface RequestsContextValue {
  /** All payment requests. */
  requests: PaymentRequest[];
  /** Add a new payment request. */
  addRequest: (params: CreatePaymentRequestParams & { uri: string }) => PaymentRequest;
  /** Update the status of a payment request. */
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  /** Delete a payment request. */
  deleteRequest: (id: string) => void;
  /** Get a single request by ID. */
  getRequest: (id: string) => PaymentRequest | undefined;
  /** Get all active (non-expired, non-paid) requests. */
  getActiveRequests: () => PaymentRequest[];
  /** Update expired requests to Expired status. */
  updateExpiredRequests: () => void;
}

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);

const STORAGE_KEY = "stellopay-requests-storage";

/**
 * Generates a unique ID for a payment request.
 */
function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculates the expiry timestamp based on hours from now.
 */
function calculateExpiry(hours?: number): string | undefined {
  if (!hours || hours <= 0) return undefined;
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}

/**
 * Checks if a request is expired based on its expiresAt timestamp.
 */
function isExpired(request: PaymentRequest): boolean {
  if (!request.expiresAt) return false;
  return new Date(request.expiresAt) < new Date();
}

/**
 * SSR-safe localStorage read for payment requests.
 */
function readRequestsFromStorage(): PaymentRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return [];
    const data = storage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write payment requests to localStorage.
 */
function writeRequestsToStorage(requests: PaymentRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // Storage may be unavailable in restricted contexts
  }
}

export interface RequestsProviderProps {
  children: React.ReactNode;
}

export const RequestsProvider: React.FC<RequestsProviderProps> = ({ children }) => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  // Hydrate requests from localStorage on mount
  useEffect(() => {
    const stored = readRequestsFromStorage();
    setRequests(stored);
  }, []);

  // Persist to localStorage whenever requests change
  useEffect(() => {
    writeRequestsToStorage(requests);
  }, [requests]);

  // Update expired requests periodically (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests((prev) =>
        prev.map((req) =>
          isExpired(req) && req.status === "Pending" ? { ...req, status: "Expired" } : req,
        ),
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const addRequest = useCallback((params: CreatePaymentRequestParams & { uri: string }) => {
    const id = generateId();
    const now = new Date().toISOString();
    const expiresAt = calculateExpiry(params.expiryHours);

    const newRequest: PaymentRequest = {
      id,
      destination: params.destination,
      amount: params.amount,
      assetCode: params.assetCode,
      assetIssuer: params.assetIssuer,
      memo: params.memo,
      memoType: params.memoType,
      message: params.message,
      uri: params.uri,
      status: "Pending",
      createdAt: now,
      expiresAt,
    };

    setRequests((prev) => [...prev, newRequest]);
    return newRequest;
  }, []);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status,
              paidAt: status === "Paid" ? new Date().toISOString() : req.paidAt,
            }
          : req,
      ),
    );
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  }, []);

  const getRequest = useCallback(
    (id: string) => {
      return requests.find((req) => req.id === id);
    },
    [requests],
  );

  const getActiveRequests = useCallback(() => {
    return requests.filter((req) => req.status === "Pending" && !isExpired(req));
  }, [requests]);

  const updateExpiredRequests = useCallback(() => {
    setRequests((prev) =>
      prev.map((req) =>
        isExpired(req) && req.status === "Pending" ? { ...req, status: "Expired" } : req,
      ),
    );
  }, []);

  const value = useMemo<RequestsContextValue>(
    () => ({
      requests,
      addRequest,
      updateRequestStatus,
      deleteRequest,
      getRequest,
      getActiveRequests,
      updateExpiredRequests,
    }),
    [requests, addRequest, updateRequestStatus, deleteRequest, getRequest, getActiveRequests, updateExpiredRequests],
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
};

/**
 * Hook to access the requests context.
 * Throws an error if used outside of RequestsProvider.
 */
export function useRequests(): RequestsContextValue {
  const ctx = useContext(RequestsContext);
  if (!ctx) {
    throw new Error(
      "useRequests must be used within a RequestsProvider. Wrap the tree in <RequestsProvider>.",
    );
  }
  return ctx;
}
