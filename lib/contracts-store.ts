import type { Contract, ContractDraft } from "@/types/contract";
import { contractDraftSchema, contractSchema } from "@/types/contract";
import { safeStorage } from "@/utils/safeStorage";
import {
  ContractStateError,
  transitionContractStatus,
} from "@/lib/contracts-state";
import type { ContractAction } from "@/types/contract";

export const CONTRACTS_STORAGE_KEY_PREFIX = "stellopay.contracts";
export const CONTRACTS_STORAGE_VERSION = 1;

export type ContractsStoreErrorCode =
  | "INVALID_CONTRACT"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "STORAGE_WRITE_FAILED";

export class ContractsStoreError extends Error {
  readonly code: ContractsStoreErrorCode;

  constructor(code: ContractsStoreErrorCode, message: string) {
    super(message);
    this.name = "ContractsStoreError";
    this.code = code;
  }
}

interface ContractsEnvelope {
  version: number;
  contracts: Contract[];
}

export function getContractsStorageKey(
  account: string | null | undefined,
): string {
  const scope = typeof account === "string" ? account.trim() : "";
  return scope
    ? `${CONTRACTS_STORAGE_KEY_PREFIX}.${scope}`
    : `${CONTRACTS_STORAGE_KEY_PREFIX}.default`;
}

function parseContracts(value: unknown): Contract[] {
  const candidate = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "contracts" in value
      ? (value as { contracts: unknown }).contracts
      : null;
  if (!Array.isArray(candidate)) return [];
  const result = contractSchema.array().safeParse(candidate);
  return result.success ? [...result.data] : [];
}

export function loadContracts(account: string | null | undefined): Contract[] {
  const raw = safeStorage.getItem(getContractsStorageKey(account));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parseContracts(parsed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as ContractsEnvelope).version !== CONTRACTS_STORAGE_VERSION
    ) {
      return [];
    }
    return parseContracts(parsed);
  } catch {
    return [];
  }
}

export function saveContracts(
  account: string | null | undefined,
  contracts: readonly Contract[],
): boolean {
  const envelope: ContractsEnvelope = {
    version: CONTRACTS_STORAGE_VERSION,
    contracts: [...contracts],
  };
  return safeStorage.setItem(
    getContractsStorageKey(account),
    JSON.stringify(envelope),
  );
}

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `contract-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseOrThrow(candidate: unknown): Contract {
  const result = contractSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "contract";
    throw new ContractsStoreError(
      "INVALID_CONTRACT",
      `Invalid contract (${path}): ${first?.message ?? "unknown error"}`,
    );
  }
  return result.data;
}

function persist(
  account: string | null | undefined,
  contracts: readonly Contract[],
): void {
  if (!saveContracts(account, contracts)) {
    throw new ContractsStoreError(
      "STORAGE_WRITE_FAILED",
      "Contract could not be saved to this browser.",
    );
  }
}

export function createContract(
  account: string | null | undefined,
  draft: ContractDraft,
  now: Date = new Date(),
): Contract {
  const parsedDraft = contractDraftSchema.safeParse(draft);
  if (!parsedDraft.success) {
    const first = parsedDraft.error.issues[0];
    const path = first?.path.join(".") || "contract";
    throw new ContractsStoreError(
      "INVALID_CONTRACT",
      `Invalid contract draft (${path}): ${first?.message ?? "unknown error"}`,
    );
  }
  const timestamp = now.toISOString();
  const contract = parseOrThrow({
    ...parsedDraft.data,
    id: makeId(),
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  persist(account, [...loadContracts(account), contract]);
  return contract;
}

export function transitionContract(
  account: string | null | undefined,
  id: string,
  action: ContractAction,
  now: Date = new Date(),
): Contract {
  const contracts = loadContracts(account);
  const index = contracts.findIndex((contract) => contract.id === id);
  if (index < 0) {
    throw new ContractsStoreError("NOT_FOUND", "Contract not found.");
  }
  let updated: Contract;
  try {
    updated = transitionContractStatus(contracts[index], action, now);
  } catch (error) {
    if (error instanceof ContractStateError) {
      throw new ContractsStoreError("INVALID_STATE", error.message);
    }
    throw error;
  }
  const next = [...contracts];
  next[index] = parseOrThrow(updated);
  persist(account, next);
  return next[index];
}
