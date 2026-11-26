import type {
  Contract,
  ContractAction,
  ContractStatus,
} from "@/types/contract";

export const CONTRACT_TRANSITIONS: Record<
  ContractStatus,
  readonly ContractAction[]
> = {
  draft: ["activate", "cancel"],
  active: ["complete", "cancel"],
  completed: [],
  cancelled: [],
};

export const CONTRACT_ACTION_STATUS: Record<ContractAction, ContractStatus> = {
  activate: "active",
  complete: "completed",
  cancel: "cancelled",
};

export class ContractStateError extends Error {
  readonly code = "INVALID_TRANSITION";

  constructor(status: ContractStatus, action: ContractAction) {
    super(`Cannot ${action} a ${status} contract.`);
    this.name = "ContractStateError";
  }
}

export function getContractActions(
  status: ContractStatus,
): readonly ContractAction[] {
  return CONTRACT_TRANSITIONS[status];
}

export function canTransitionContract(
  status: ContractStatus,
  action: ContractAction,
): boolean {
  return CONTRACT_TRANSITIONS[status].includes(action);
}

export function transitionContractStatus(
  contract: Contract,
  action: ContractAction,
  now: Date = new Date(),
): Contract {
  if (!canTransitionContract(contract.status, action)) {
    throw new ContractStateError(contract.status, action);
  }
  return {
    ...contract,
    status: CONTRACT_ACTION_STATUS[action],
    updatedAt: now.toISOString(),
  };
}
