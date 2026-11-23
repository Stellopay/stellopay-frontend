import { describe, expect, it } from "vitest";
import {
  ApprovalStateError,
  createApprovalRequest,
  transitionApprovalRequest,
} from "./approvals-state";
import type { ApprovalPayment } from "@/types/approval";

const payment: ApprovalPayment = {
  id: "pay-1",
  asset: "USDC",
  amountMinorUnits: 12500,
  requesterId: "requester",
  requesterName: "Riley Requester",
  approverIds: ["approver-1", "approver-2", "approver-3"],
  requiredApprovals: 2,
};

const createRequest = () =>
  createApprovalRequest(payment, {
    id: "approval-1",
    createdAt: "2026-01-01T10:00:00.000Z",
    expiresAt: "2026-01-08T10:00:00.000Z",
  });

const approve = (id: string, at = "2026-01-02T10:00:00.000Z") => ({
  type: "approve" as const,
  actor: { id, name: id },
  at,
});

describe("approval state machine", () => {
  it("creates a pending request and validates the N-of-M policy", () => {
    expect(createRequest()).toMatchObject({
      status: "pending",
      requiredApprovals: 2,
      approverIds: payment.approverIds,
      history: [],
    });
    expect(() =>
      createApprovalRequest(
        { ...payment, requiredApprovals: 4 },
        { id: "bad", createdAt: "2026-01-01T00:00:00.000Z" },
      ),
    ).toThrow(ApprovalStateError);
  });

  it("remains pending until N approvers approve, then becomes approved", () => {
    const first = transitionApprovalRequest(
      createRequest(),
      approve("approver-1"),
    );
    expect(first.status).toBe("pending");
    expect(first.history).toHaveLength(1);

    const second = transitionApprovalRequest(first, approve("approver-2"));
    expect(second.status).toBe("approved");
    expect(second.history.map((entry) => entry.actorId)).toEqual([
      "approver-1",
      "approver-2",
    ]);
  });

  it("refuses requester self-approval", () => {
    const request = createApprovalRequest(
      {
        ...payment,
        approverIds: ["requester", "approver-1", "approver-2"],
      },
      {
        id: "approval-with-requester-in-list",
        createdAt: "2026-01-01T10:00:00.000Z",
        expiresAt: "2026-01-08T10:00:00.000Z",
      },
    );
    expect(() =>
      transitionApprovalRequest(request, approve("requester")),
    ).toThrow(/requester cannot approve or reject/i);
  });

  it("rejects a request immediately with a decision trail", () => {
    const rejected = transitionApprovalRequest(createRequest(), {
      type: "reject",
      actor: { id: "approver-1", name: "Alex Approver" },
      at: "2026-01-02T10:00:00.000Z",
      comment: "Needs review",
    });
    expect(rejected.status).toBe("rejected");
    expect(rejected.history[0]).toMatchObject({
      decision: "rejected",
      actorName: "Alex Approver",
      comment: "Needs review",
    });
  });

  it("expires at the deadline and does not allow an approval after expiry", () => {
    const expired = transitionApprovalRequest(createRequest(), {
      type: "expire",
      at: "2026-01-08T10:00:00.000Z",
    });
    expect(expired.status).toBe("expired");
    expect(expired.history[0].actorId).toBe("system");

    const lateDecision = transitionApprovalRequest(
      createRequest(),
      approve("approver-1", "2026-01-08T10:00:00.000Z"),
    );
    expect(lateDecision.status).toBe("expired");
    expect(lateDecision.history[0].decision).toBe("expired");
  });

  it("refuses early expiration and duplicate or unauthorized approvers", () => {
    expect(() =>
      transitionApprovalRequest(createRequest(), {
        type: "expire",
        at: "2026-01-07T10:00:00.000Z",
      }),
    ).toThrow(/cannot expire before/i);
    const afterOneApproval = transitionApprovalRequest(
      createRequest(),
      approve("approver-1"),
    );
    expect(() =>
      transitionApprovalRequest(afterOneApproval, approve("approver-1")),
    ).toThrow(/only decide once/i);
    expect(() =>
      transitionApprovalRequest(createRequest(), approve("stranger")),
    ).toThrow(/not an authorized approver/i);
  });

  it("allows only the requester to cancel and makes the request terminal", () => {
    expect(() =>
      transitionApprovalRequest(createRequest(), {
        type: "cancel",
        actor: { id: "approver-1", name: "Alex" },
        at: "2026-01-02T10:00:00.000Z",
      }),
    ).toThrow(/only the requester/i);

    const cancelled = transitionApprovalRequest(createRequest(), {
      type: "cancel",
      actor: { id: "requester", name: "Riley Requester" },
      at: "2026-01-02T10:00:00.000Z",
      comment: "Payment withdrawn",
    });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.history[0].decision).toBe("cancelled");
    expect(() =>
      transitionApprovalRequest(cancelled, approve("approver-1")),
    ).toThrow(/cannot change this cancelled/i);
  });

  it.each(["approved", "rejected", "expired", "cancelled"] as const)(
    "does not allow a second transition after %s",
    (status) => {
      const request = createRequest();
      const terminal =
        status === "approved"
          ? transitionApprovalRequest(
              transitionApprovalRequest(request, approve("approver-1")),
              approve("approver-2"),
            )
          : status === "rejected"
            ? transitionApprovalRequest(request, {
                type: "reject",
                actor: { id: "approver-1", name: "Alex" },
                at: "2026-01-02T10:00:00.000Z",
              })
            : status === "expired"
              ? transitionApprovalRequest(request, {
                  type: "expire",
                  at: "2026-01-08T10:00:00.000Z",
                })
              : transitionApprovalRequest(request, {
                  type: "cancel",
                  actor: { id: "requester", name: "Riley Requester" },
                  at: "2026-01-02T10:00:00.000Z",
                });
      expect(terminal.status).toBe(status);
      expect(() =>
        transitionApprovalRequest(terminal, approve("approver-3")),
      ).toThrow(/cannot change/i);
    },
  );
});
