import type { ApprovalPayment, ApprovalRequest } from "@/types/approval";
import {
  createApprovalRequest,
  transitionApprovalRequest,
  type ApprovalAction,
} from "@/lib/approvals-state";

const REQUESTS_KEY = "stellopay.approval-requests";
const THRESHOLDS_KEY = "stellopay.approval-thresholds";

export type ApprovalThresholds = Record<string, number>;

function getStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Approval storage is only available in the browser.");
  }
  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const value = getStorage().getItem(key);
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Stored approval data for "${key}" is invalid JSON.`);
  }
}

function writeJson<T>(key: string, value: T): void {
  getStorage().setItem(key, JSON.stringify(value));
}

export function getApprovalThresholds(): ApprovalThresholds {
  const thresholds = readJson<ApprovalThresholds>(THRESHOLDS_KEY, {});
  if (
    typeof thresholds !== "object" ||
    thresholds === null ||
    Array.isArray(thresholds) ||
    Object.entries(thresholds).some(
      ([asset, amount]) =>
        !/^[A-Z0-9._-]{2,12}$/.test(asset) ||
        !Number.isSafeInteger(amount) ||
        amount < 0,
    )
  ) {
    throw new Error("Stored approval thresholds are invalid.");
  }
  return thresholds;
}

export function setApprovalThreshold(
  asset: string,
  amountMinorUnits: number,
): void {
  if (!/^[A-Z0-9._-]{2,12}$/.test(asset)) {
    throw new Error("Asset must be a valid uppercase asset code.");
  }
  if (!Number.isSafeInteger(amountMinorUnits) || amountMinorUnits <= 0) {
    throw new Error("Threshold must be a positive integer in minor units.");
  }
  writeJson(THRESHOLDS_KEY, {
    ...getApprovalThresholds(),
    [asset]: amountMinorUnits,
  });
}

export function removeApprovalThreshold(asset: string): void {
  const thresholds = getApprovalThresholds();
  delete thresholds[asset];
  writeJson(THRESHOLDS_KEY, thresholds);
}

export function getApprovalRequests(): ApprovalRequest[] {
  const requests = readJson<ApprovalRequest[]>(REQUESTS_KEY, []);
  if (
    !Array.isArray(requests) ||
    requests.some(
      (request) =>
        !request ||
        typeof request.id !== "string" ||
        typeof request.paymentId !== "string" ||
        !Array.isArray(request.history),
    )
  ) {
    throw new Error("Stored approval requests are invalid.");
  }
  return requests;
}

function saveApprovalRequests(requests: ApprovalRequest[]): void {
  writeJson(REQUESTS_KEY, requests);
}

/**
 * Call this immediately before broadcasting a send-payment or payroll-batch
 * transaction. If an approval is returned, pause the broadcast and resume it
 * only after the request reaches `approved`. No matching threshold returns
 * null; all payment amounts and thresholds are integer minor units.
 */
export function requestApprovalIfNeeded(
  payment: ApprovalPayment,
): ApprovalRequest | null {
  if (
    !payment.id.trim() ||
    !payment.requesterId.trim() ||
    !payment.requesterName.trim()
  ) {
    throw new Error("Payment and requester details are required.");
  }
  if (!/^[A-Z0-9._-]{2,12}$/.test(payment.asset)) {
    throw new Error("Asset must be a valid uppercase asset code.");
  }
  if (
    !Number.isSafeInteger(payment.amountMinorUnits) ||
    payment.amountMinorUnits <= 0
  ) {
    throw new Error(
      "Payment amount must be a positive integer in minor units.",
    );
  }
  const thresholds = getApprovalThresholds();
  const threshold = thresholds[payment.asset];
  if (threshold === undefined || payment.amountMinorUnits <= threshold) {
    return null;
  }

  const existing = getApprovalRequests().find(
    (request) => request.paymentId === payment.id,
  );
  if (existing) {
    if (existing.status === "pending") return existing;
    throw new Error(
      `Payment "${payment.id}" already has a ${existing.status} approval request.`,
    );
  }

  const now = new Date();
  const request = createApprovalRequest(payment, {
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
  });
  saveApprovalRequests([...getApprovalRequests(), request]);
  return request;
}

export function decideApprovalRequest(
  requestId: string,
  action: ApprovalAction,
): ApprovalRequest {
  const requests = getApprovalRequests();
  const index = requests.findIndex((request) => request.id === requestId);
  if (index < 0)
    throw new Error(`Approval request "${requestId}" was not found.`);

  const updated = transitionApprovalRequest(requests[index], action);
  requests[index] = updated;
  saveApprovalRequests(requests);
  return updated;
}
