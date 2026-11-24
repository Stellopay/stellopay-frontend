/**
 * @fileoverview Typed async data-access layer for Stellar payments and account
 * asset balances. Includes a mock adapter with AbortSignal cancellation support
 * and strict runtime validation.
 */

import { isValidStellarAddress } from "@/utils/stellarAddress";
import {
  checkSpendableBalance,
  DEFAULT_BASE_FEE_XLM,
  DEFAULT_MIN_XLM_RESERVE,
  parseAmountToStroops,
} from "@/utils/amountUtils";

export interface AccountAssetBalance {
  /** Asset code, e.g. `"USDC"` or `"XLM"`. */
  code: string;
  /** Human-readable asset name. */
  name: string;
  /** Issuer display label or `"native"` for XLM. */
  issuer: string;
  /** Exact decimal string balance (up to 7 decimal places). */
  balance: string;
  /** Minimum reserve required for this asset (`"1"` for native XLM, `"0"` otherwise). */
  minReserve: string;
}

export interface RecentRecipient {
  address: string;
  label: string;
}

export interface CreatePaymentInput {
  /** Sender's connected Stellar public address (`G...`). */
  senderAddress: string;
  /** Recipient's Stellar public or muxed address (`G...` or `M...`). */
  recipient: string;
  /** Asset code (`"XLM"`, `"USDC"`, etc.). */
  assetCode: string;
  /** Canonical decimal amount string (up to 7 decimal places). */
  amount: string;
  /** Optional transaction memo (up to 28 characters for Stellar text memo). */
  memo?: string;
  /** Active Stellar network identifier (e.g. `"stellar"`, `"testnet"`). */
  networkId: string;
}

export interface CreatePaymentResult {
  /** Newly created internal transaction record ID. */
  id: string;
  /** Stellar transaction hash / display identifier. */
  txHash: string;
  /** Normalized recipient Stellar address. */
  recipient: string;
  /** Normalized sender Stellar address. */
  senderAddress: string;
  /** Asset code sent. */
  assetCode: string;
  /** Normalized decimal amount string. */
  amount: string;
  /** Network fee in XLM. */
  feeXlm: string;
  /** Optional memo attached to the payment. */
  memo?: string;
  /** Active network id. */
  networkId: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Settlement status. */
  status: "Completed" | "Pending";
}

/** Seeded account balances used by the mock adapter. */
export const DEFAULT_ACCOUNT_BALANCES: readonly AccountAssetBalance[] = [
  {
    code: "USDC",
    name: "USD Coin",
    issuer: "centre.io",
    balance: "2432.00",
    minReserve: "0",
  },
  {
    code: "XLM",
    name: "Stellar Lumens",
    issuer: "native",
    balance: "1250.5000000",
    minReserve: DEFAULT_MIN_XLM_RESERVE,
  },
  {
    code: "EURC",
    name: "Euro Coin",
    issuer: "circle.com",
    balance: "540.25",
    minReserve: "0",
  },
] as const;

/** Seeded recent recipients with valid CRC16-verified Stellar strkeys. */
export const DEFAULT_RECENT_RECIPIENTS: readonly RecentRecipient[] = [
  {
    label: "Acme Design Studio",
    address: "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4",
  },
  {
    label: "Nova Cloud Services",
    address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  },
  {
    label: "Treasury Muxed Vault",
    address:
      "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFNZG",
  },
] as const;

export type PaymentErrorCode =
  | "validation"
  | "self_payment"
  | "insufficient_balance"
  | "reserve_breach"
  | "network";

export class PaymentApiError extends Error {
  readonly code: PaymentErrorCode;

  constructor(message: string, code: PaymentErrorCode) {
    super(message);
    this.name = "PaymentApiError";
    this.code = code;
  }
}

/**
 * Helper that resolves after `ms` or rejects with `DOMException("Aborted", "AbortError")`
 * when `signal` is aborted before or during the wait.
 */
function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Fetches the account's asset balances for the payment form.
 */
export async function getAccountBalances(
  signal?: AbortSignal,
): Promise<AccountAssetBalance[]> {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (process.env.NODE_ENV === "development") {
    await abortableDelay(200, signal);
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return DEFAULT_ACCOUNT_BALANCES.map((asset) => ({ ...asset }));
}

export interface CreatePaymentOptions {
  /** Optional `AbortSignal` to cancel an in-flight payment submission. */
  signal?: AbortSignal;
  /**
   * Optional simulated latency in milliseconds (defaults to 150ms in dev, 20ms in test)
   * so tests can exercise AbortSignal cancellation and pending locks deterministically.
   */
  latencyMs?: number;
  /**
   * Optional override balances used to validate spendable limits at the API boundary.
   */
  balances?: readonly AccountAssetBalance[];
}

/**
 * Submits a signed Stellar payment via the mock adapter (or configured backend).
 *
 * - Supports `AbortSignal` (either as 2nd parameter `AbortSignal` or via options object).
 * - Validates sender and recipient Stellar addresses, self-payment restrictions,
 *   stroop precision, and asset balance / minimum reserve rules before committing.
 */
export async function createPayment(
  input: CreatePaymentInput,
  signalOrOptions?: AbortSignal | CreatePaymentOptions,
): Promise<CreatePaymentResult> {
  const options: CreatePaymentOptions =
    signalOrOptions && "aborted" in signalOrOptions
      ? { signal: signalOrOptions }
      : (signalOrOptions ?? {});

  const {
    signal,
    latencyMs = process.env.NODE_ENV === "test" ? 15 : 250,
    balances = DEFAULT_ACCOUNT_BALANCES,
  } = options;

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const normalizedSender = input.senderAddress?.trim().toUpperCase() ?? "";
  const normalizedRecipient = input.recipient?.trim().toUpperCase() ?? "";

  if (!isValidStellarAddress(normalizedSender)) {
    throw new PaymentApiError(
      "A valid connected sender wallet address is required.",
      "validation",
    );
  }

  if (!isValidStellarAddress(normalizedRecipient)) {
    throw new PaymentApiError(
      "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.",
      "validation",
    );
  }

  if (normalizedSender === normalizedRecipient) {
    throw new PaymentApiError(
      "You cannot send a payment to your own connected wallet address.",
      "self_payment",
    );
  }

  const parsedAmount = parseAmountToStroops(input.amount, { allowZero: false });
  if (!parsedAmount.ok) {
    throw new PaymentApiError(parsedAmount.message, "validation");
  }

  const normalizedAssetCode = input.assetCode?.trim().toUpperCase() ?? "";
  const matchedAsset = balances.find(
    (b) => b.code.toUpperCase() === normalizedAssetCode,
  );

  if (!matchedAsset) {
    throw new PaymentApiError(
      `Unsupported or unavailable asset: ${input.assetCode}.`,
      "validation",
    );
  }

  const spendCheck = checkSpendableBalance({
    amount: parsedAmount.normalized,
    balance: matchedAsset.balance,
    assetCode: matchedAsset.code,
    feeXlm: DEFAULT_BASE_FEE_XLM,
    minReserveXlm: matchedAsset.minReserve,
  });

  if (!spendCheck.allowed) {
    throw new PaymentApiError(
      spendCheck.message ?? "Insufficient balance for this payment.",
      spendCheck.violation === "breaches_minimum_reserve"
        ? "reserve_breach"
        : "insufficient_balance",
    );
  }

  if (input.memo && input.memo.length > 28) {
    throw new PaymentApiError(
      "Memo cannot exceed 28 characters.",
      "validation",
    );
  }

  if (latencyMs > 0) {
    await abortableDelay(latencyMs, signal);
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const deterministicSuffix = parsedAmount.stroops.toString().slice(0, 6).padEnd(6, "0");
  const id = `pay-${deterministicSuffix}`;
  const txHash = `TXN-${normalizedAssetCode}-${deterministicSuffix}`;

  return {
    id,
    txHash,
    recipient: normalizedRecipient,
    senderAddress: normalizedSender,
    assetCode: matchedAsset.code,
    amount: parsedAmount.normalized,
    feeXlm: DEFAULT_BASE_FEE_XLM,
    ...(input.memo?.trim() ? { memo: input.memo.trim() } : {}),
    networkId: input.networkId || "stellar",
    createdAt: new Date().toISOString(),
    status: "Completed",
  };
}
