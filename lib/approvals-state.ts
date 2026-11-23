import type {
  ApprovalActor,
  ApprovalDecision,
  ApprovalPayment,
  ApprovalRequest,
} from "@/types/approval";

export type ApprovalAction =
  | { type: "approve"; actor: ApprovalActor; at: string; comment?: string }
  | { type: "reject"; actor: ApprovalActor; at: string; comment?: string }
  | { type: "expire"; at: string }
  | { type: "cancel"; actor: ApprovalActor; at: string; comment?: string };

export class ApprovalStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalStateError";
  }
}

const isValidDate = (value: string): boolean =>
  Number.isFinite(Date.parse(value));

export function createApprovalRequest(
  payment: ApprovalPayment,
  options: { id: string; createdAt: string; expiresAt?: string },
): ApprovalRequest {
  if (!options.id.trim()) {
    throw new ApprovalStateError("Approval request ID is required.");
  }
  if (
    !payment.id.trim() ||
    !payment.requesterId.trim() ||
    !payment.requesterName.trim()
  ) {
    throw new ApprovalStateError("Payment and requester details are required.");
  }
  if (!/^[A-Z0-9._-]{2,12}$/.test(payment.asset)) {
    throw new ApprovalStateError("Asset must be a valid uppercase asset code.");
  }
  if (
    !Number.isSafeInteger(payment.amountMinorUnits) ||
    payment.amountMinorUnits <= 0
  ) {
    throw new ApprovalStateError(
      "Payment amount must be a positive integer in minor units.",
    );
  }
  if (
    payment.approverIds.some((id) => !id.trim()) ||
    new Set(payment.approverIds).size !== payment.approverIds.length
  ) {
    throw new ApprovalStateError("Approver IDs must be non-empty and unique.");
  }
  const eligibleApproverCount = payment.approverIds.filter(
    (id) => id !== payment.requesterId,
  ).length;
  if (
    !Number.isInteger(payment.requiredApprovals) ||
    payment.requiredApprovals < 1 ||
    payment.requiredApprovals > eligibleApproverCount
  ) {
    throw new ApprovalStateError(
      "Required approvals must be between 1 and the number of eligible approvers other than the requester.",
    );
  }

  const createdAt = options.createdAt;
  if (!isValidDate(createdAt)) {
    throw new ApprovalStateError(
      "Approval request creation date must be valid.",
    );
  }
  const expiresAt =
    options.expiresAt ??
    payment.expiresAt ??
    new Date(Date.parse(createdAt) + 7 * 24 * 60 * 60 * 1000).toISOString();
  if (
    !isValidDate(expiresAt) ||
    Date.parse(expiresAt) <= Date.parse(createdAt)
  ) {
    throw new ApprovalStateError(
      "Approval request dates must be valid and expiration must be in the future.",
    );
  }

  return {
    id: options.id,
    paymentId: payment.id,
    asset: payment.asset,
    amountMinorUnits: payment.amountMinorUnits,
    requesterId: payment.requesterId,
    requesterName: payment.requesterName,
    approverIds: [...payment.approverIds],
    requiredApprovals: payment.requiredApprovals,
    status: "pending",
    createdAt,
    expiresAt,
    history: [],
  };
}

export function transitionApprovalRequest(
  request: ApprovalRequest,
  action: ApprovalAction,
): ApprovalRequest {
  if (request.status !== "pending") {
    throw new ApprovalStateError(
      `Cannot change this ${request.status} approval request.`,
    );
  }

  if (action.type === "expire") {
    if (
      !isValidDate(action.at) ||
      !isValidDate(request.expiresAt) ||
      Date.parse(action.at) < Date.parse(request.expiresAt)
    ) {
      throw new ApprovalStateError(
        "Approval request cannot expire before its expiration time.",
      );
    }
    return {
      ...request,
      status: "expired",
      history: [...request.history, systemDecision("expired", action.at)],
    };
  }

  if (!isValidDate(action.at)) {
    throw new ApprovalStateError("Decision time must be a valid date.");
  }

  if (!isValidDate(request.expiresAt)) {
    throw new ApprovalStateError(
      "Approval request expiration date is invalid.",
    );
  }
  if (Date.parse(action.at) >= Date.parse(request.expiresAt)) {
    return {
      ...request,
      status: "expired",
      history: [...request.history, systemDecision("expired", action.at)],
    };
  }

  if (action.type === "cancel") {
    if (action.actor.id !== request.requesterId) {
      throw new ApprovalStateError(
        "Only the requester can cancel this approval request.",
      );
    }
    return {
      ...request,
      status: "cancelled",
      history: [...request.history, actorDecision("cancelled", action)],
    };
  }

  if (action.actor.id === request.requesterId) {
    throw new ApprovalStateError(
      "The requester cannot approve or reject their own request.",
    );
  }
  if (!request.approverIds.includes(action.actor.id)) {
    throw new ApprovalStateError("This user is not an authorized approver.");
  }
  if (request.history.some((entry) => entry.actorId === action.actor.id)) {
    throw new ApprovalStateError(
      "An approver may only decide once on a request.",
    );
  }

  const decision = actorDecision(
    action.type === "approve" ? "approved" : "rejected",
    action,
  );
  if (action.type === "reject") {
    return {
      ...request,
      status: "rejected",
      history: [...request.history, decision],
    };
  }

  const history = [...request.history, decision];
  const approvals = history.filter(
    (entry) => entry.decision === "approved",
  ).length;
  return {
    ...request,
    status: approvals >= request.requiredApprovals ? "approved" : "pending",
    history,
  };
}

function actorDecision(
  decision: ApprovalDecision["decision"],
  action: Extract<ApprovalAction, { actor: ApprovalActor }>,
): ApprovalDecision {
  if (!action.actor.id.trim() || !action.actor.name.trim()) {
    throw new ApprovalStateError("Decision actor details are required.");
  }
  return {
    decision,
    actorId: action.actor.id,
    actorName: action.actor.name,
    at: action.at,
    ...(action.comment?.trim() ? { comment: action.comment.trim() } : {}),
  };
}

function systemDecision(
  decision: ApprovalDecision["decision"],
  at: string,
): ApprovalDecision {
  return { decision, actorId: "system", actorName: "System", at };
}
