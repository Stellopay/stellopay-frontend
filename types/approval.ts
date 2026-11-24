export type ApprovalStatus =
  "pending" | "approved" | "rejected" | "expired" | "cancelled";

export type ApprovalDecisionType =
  "approved" | "rejected" | "expired" | "cancelled";

export interface ApprovalDecision {
  decision: ApprovalDecisionType;
  actorId: string;
  actorName: string;
  at: string;
  comment?: string;
}

export interface ApprovalRequest {
  id: string;
  paymentId: string;
  asset: string;
  amountMinorUnits: number;
  requesterId: string;
  requesterName: string;
  approverIds: string[];
  requiredApprovals: number;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  history: ApprovalDecision[];
}

export interface ApprovalPayment {
  id: string;
  asset: string;
  amountMinorUnits: number;
  requesterId: string;
  requesterName: string;
  approverIds: string[];
  requiredApprovals: number;
  expiresAt?: string;
}

export interface ApprovalActor {
  id: string;
  name: string;
}
