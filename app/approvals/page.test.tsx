import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { axe } from "vitest-axe";
import ApprovalsPage, { buildApprovalHistoryCsv } from "./page";
import {
  setApprovalThreshold,
  requestApprovalIfNeeded,
} from "@/lib/approvals-store";

const payment = {
  id: "pay-page-1",
  asset: "USDC",
  amountMinorUnits: 12500,
  requesterId: "requester",
  requesterName: "Riley Requester",
  approverIds: ["approver-1", "approver-2"],
  requiredApprovals: 1,
};

describe("approvals page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: () => "approval-page-1" });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the queue accessibly and announces an empty state", async () => {
    const { container } = render(<ApprovalsPage />);
    expect(
      await screen.findByText(/no approval requests/i),
    ).toBeInTheDocument();
    const accessibilityResults = await axe(container);
    expect(accessibilityResults.violations).toHaveLength(0);
  });

  it("filters requests, opens keyboard-accessible details, and updates after approval", async () => {
    setApprovalThreshold("USDC", 10000);
    requestApprovalIfNeeded(payment);
    render(<ApprovalsPage />);

    const row = await screen.findByRole("row", { name: /pay-page-1/i });
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(
      screen.getByRole("dialog", { name: /pay-page-1/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Reviewer ID"), {
      target: { value: "approver-1" },
    });
    fireEvent.change(screen.getByLabelText("Reviewer name"), {
      target: { value: "Alex Approver" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.getByText("approved by Alex Approver")).toBeInTheDocument();
    });
    expect(
      within(screen.getByRole("dialog")).getByText("Decision history"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "approved" },
    });
    expect(
      screen.getByRole("row", { name: /pay-page-1/i }),
    ).toBeInTheDocument();
  });

  it("exports the recorded decision trail in escaped CSV", () => {
    const csv = buildApprovalHistoryCsv([
      {
        id: "approval",
        paymentId: "pay-1",
        asset: "USDC",
        amountMinorUnits: 101,
        requesterId: "requester",
        requesterName: 'Riley "R" Requester',
        approverIds: ["approver"],
        requiredApprovals: 1,
        status: "approved",
        createdAt: "2026-01-01",
        expiresAt: "2026-01-08",
        history: [
          {
            decision: "approved",
            actorId: "approver",
            actorName: "Alex",
            at: "2026-01-02T00:00:00.000Z",
            comment: '=HYPERLINK("https://example.invalid")',
          },
        ],
      },
    ]);
    expect(csv).toContain('"Riley ""R"" Requester"');
    expect(csv).toContain(`"'=HYPERLINK(""https://example.invalid"")"`);
  });
});
