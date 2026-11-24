import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideApprovalRequest,
  getApprovalRequests,
  getApprovalThresholds,
  removeApprovalThreshold,
  requestApprovalIfNeeded,
  setApprovalThreshold,
} from "./approvals-store";
import type { ApprovalPayment } from "@/types/approval";

const payment: ApprovalPayment = {
  id: "pay-store-1",
  asset: "USDC",
  amountMinorUnits: 12500,
  requesterId: "requester",
  requesterName: "Riley Requester",
  approverIds: ["approver-1", "approver-2"],
  requiredApprovals: 2,
};

describe("approval store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: () => "approval-store-1" });
  });

  it("persists validated integer thresholds per asset", () => {
    setApprovalThreshold("USDC", 10000);
    setApprovalThreshold("XLM", 500);
    expect(getApprovalThresholds()).toEqual({ USDC: 10000, XLM: 500 });
    expect(() => setApprovalThreshold("USDC", 1.5)).toThrow(
      /positive integer/i,
    );
    expect(() => setApprovalThreshold("usdC", 100)).toThrow(/asset/i);
    removeApprovalThreshold("XLM");
    expect(getApprovalThresholds()).toEqual({ USDC: 10000 });
  });

  it("creates only above-threshold requests and compares minor units exactly", () => {
    setApprovalThreshold("USDC", 12500);
    expect(requestApprovalIfNeeded(payment)).toBeNull();
    expect(() =>
      requestApprovalIfNeeded({ ...payment, amountMinorUnits: -1 }),
    ).toThrow(/positive integer/i);
    expect(
      requestApprovalIfNeeded({ ...payment, amountMinorUnits: 12501 }),
    ).toMatchObject({
      id: "approval-store-1",
      paymentId: "pay-store-1",
      status: "pending",
    });
    expect(getApprovalRequests()).toHaveLength(1);
  });

  it("returns an existing pending request rather than creating duplicate entries", () => {
    setApprovalThreshold("USDC", 10000);
    const first = requestApprovalIfNeeded(payment);
    const second = requestApprovalIfNeeded(payment);
    expect(second).toEqual(first);
    expect(getApprovalRequests()).toHaveLength(1);
  });

  it("persists state-machine decisions and rejects duplicate payment histories", () => {
    setApprovalThreshold("USDC", 10000);
    requestApprovalIfNeeded(payment);
    const firstApproval = decideApprovalRequest("approval-store-1", {
      type: "approve",
      actor: { id: "approver-1", name: "Alex" },
      at: new Date().toISOString(),
    });
    expect(firstApproval.status).toBe("pending");
    const secondApproval = decideApprovalRequest("approval-store-1", {
      type: "approve",
      actor: { id: "approver-2", name: "Sam" },
      at: new Date().toISOString(),
    });
    expect(secondApproval.status).toBe("approved");
    expect(getApprovalRequests()[0].history).toHaveLength(2);
    expect(() => requestApprovalIfNeeded(payment)).toThrow(
      /already has a approved/i,
    );
  });

  it("surfaces corrupted persisted data", () => {
    localStorage.setItem("stellopay.approval-thresholds", "{");
    expect(() => getApprovalThresholds()).toThrow(/invalid json/i);
  });
});
