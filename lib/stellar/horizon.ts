/**
 * @fileoverview Minimal Horizon client for the connected wallet's account.
 *
 * Every HTTP response is validated at the boundary (see `parseHorizonAccount`)
 * and amounts stay decimal strings. All arithmetic is performed in stroops
 * (1 XLM = 10,000,000 stroops) with BigInt, so no floating point rounding can
 * leak into a balance.
 */

import type { Network } from "@/types/wallet";
import {
  ApiResponseValidationError,
  parseHorizonAccount,
  type RawHorizonAccount,
} from "@/lib/api/response-validation";
import type { AccountBalance } from "@/lib/api/transactions";

export type HorizonNetworkId = "stellar" | "testnet" | "futurenet";

/** Public Horizon hosts, keyed by the wallet context network id. */
export const HORIZON_BASE_URLS: Record<HorizonNetworkId, string> = {
  stellar: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
  futurenet: "https://horizon-futurenet.stellar.org",
};

export const HORIZON_REQUEST_TIMEOUT_MS = 10_000;
export const HORIZON_MAX_RETRIES = 2;
export const HORIZON_RETRY_DELAY_MS = 300;

const STROOPS_PER_XLM = 10_000_000n;
const BASE_RESERVE_UNITS = 2;
const SUBENTRY_RESERVE_STROOPS = 5_000_000n;

export class HorizonApiError extends Error {
  readonly code: "network" | "http" | "timeout" | "invalid_response" | "config";
  readonly status?: number;

  constructor(
    message: string,
    code: HorizonApiError["code"],
    status?: number,
  ) {
    super(message);
    this.name = "HorizonApiError";
    this.code = code;
    this.status = status;
  }
}

/** A 404 from `/accounts/:id` is an expected, first-class UI state. */
export class HorizonAccountNotFoundError extends Error {
  readonly code = "ACCOUNT_NOT_FOUND" as const;

  constructor(address: string) {
    super("This account has not been funded on the Stellar network yet.");
    this.name = "HorizonAccountNotFoundError";
    this.message = `${this.message} (${address})`;
  }
}

export function isHorizonNetworkId(id: string): id is HorizonNetworkId {
  return Object.prototype.hasOwnProperty.call(HORIZON_BASE_URLS, id);
}

function normalizeBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HorizonApiError(
      "NEXT_PUBLIC_HORIZON_URL is not a valid URL.",
      "config",
    );
  }

  const isLoopback =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !(isLoopback && url.protocol === "http:")) ||
    url.username ||
    url.password
  ) {
    throw new HorizonApiError(
      "NEXT_PUBLIC_HORIZON_URL must be an https origin (http is allowed for localhost only).",
      "config",
    );
  }

  return url.toString().replace(/\/+$/, "");
}

/** Reads the override live so `vi.stubEnv` works and deployments need no rebuild of this module. */
export function getHorizonBaseUrl(network: Network): string {
  const override = process.env.NEXT_PUBLIC_HORIZON_URL?.trim();
  if (override) return normalizeBaseUrl(override);
  if (!isHorizonNetworkId(network.id)) {
    throw new HorizonApiError(
      `No Horizon endpoint is configured for network "${network.id}".`,
      "config",
    );
  }
  return HORIZON_BASE_URLS[network.id];
}

function toStroops(amount: string): bigint {
  if (!/^\d+(?:\.\d{1,7})?$/.test(amount)) {
    throw new RangeError(`Invalid Horizon amount: ${amount}`);
  }
  const [whole, fraction = ""] = amount.split(".");
  return (
    BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(7, "0") || "0")
  );
}

function fromStroops(stroops: bigint): string {
  const sign = stroops < 0n ? "-" : "";
  const absolute = stroops < 0n ? -stroops : stroops;
  const whole = absolute / STROOPS_PER_XLM;
  const fraction = (absolute % STROOPS_PER_XLM)
    .toString()
    .padStart(7, "0")
    .replace(/0+$/, "");
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

/**
 * Spendable native balance in XLM, returned as a decimal string.
 *
 * Reserve = (2 + subentries) * 0.5 XLM; selling amounts locked in open offers
 * are also unavailable. A negative result is floored at zero because an
 * account can never spend below its obligations.
 */
export function calculateSpendableBalance(
  nativeBalance: string,
  subentryCount: number,
  sellingLiabilities = "0",
): string {
  if (!Number.isInteger(subentryCount) || subentryCount < 0) {
    throw new RangeError("subentryCount must be a non-negative integer");
  }
  const reserve =
    BigInt(BASE_RESERVE_UNITS + subentryCount) * SUBENTRY_RESERVE_STROOPS;
  const spendable =
    toStroops(nativeBalance) - reserve - toStroops(sellingLiabilities);
  return fromStroops(spendable > 0n ? spendable : 0n);
}

/** Groups the integer part without ever touching the fractional digits. */
export function formatXlmAmount(amount: string): string {
  const [whole, fraction] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export interface HorizonAccount {
  id: string;
  accountId: string;
  subentryCount: number;
  balances: AccountBalance[];
  trustlines: AccountBalance[];
  nativeBalance: string;
  nativeSellingLiabilities: string;
  spendableBalance: string;
}

function toHorizonAccount(raw: RawHorizonAccount): HorizonAccount {
  const balances: AccountBalance[] = raw.balances.map((balance) => ({
    assetCode:
      balance.asset_code ??
      (balance.asset_type === "native"
        ? "XLM"
        : (balance.liquidity_pool_id ?? "POOL")),
    assetType: balance.asset_type,
    assetIssuer: balance.asset_issuer ?? null,
    balance: balance.balance,
    limit: balance.limit ?? null,
    isAuthorized: balance.is_authorized ?? null,
    buyingLiabilities: balance.buying_liabilities ?? "0",
    sellingLiabilities: balance.selling_liabilities ?? "0",
  }));
  const native = balances.find((balance) => balance.assetType === "native");

  return {
    id: raw.id,
    accountId: raw.account_id,
    subentryCount: raw.subentry_count,
    balances,
    trustlines: balances.filter((balance) => balance.assetType !== "native"),
    nativeBalance: native?.balance ?? "0",
    nativeSellingLiabilities: native?.sellingLiabilities ?? "0",
    spendableBalance: calculateSpendableBalance(
      native?.balance ?? "0",
      raw.subentry_count,
      native?.sellingLiabilities ?? "0",
    ),
  };
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

/** Resolves after `ms`, rejecting early when the caller aborts. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isRetryable(error: unknown): boolean {
  if (
    error instanceof HorizonAccountNotFoundError ||
    error instanceof ApiResponseValidationError
  ) {
    return false;
  }
  if (error instanceof HorizonApiError) {
    return (
      error.code === "network" ||
      error.code === "timeout" ||
      error.status === 429 ||
      (error.status !== undefined && error.status >= 500)
    );
  }
  // A raw fetch rejection is a transport failure and is safe to retry.
  return true;
}

async function fetchAccountBody(
  url: string,
  address: string,
  signal?: AbortSignal,
): Promise<unknown> {
  for (let attempt = 0; attempt <= HORIZON_MAX_RETRIES; attempt += 1) {
    if (signal?.aborted) throw abortError();

    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, HORIZON_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new HorizonAccountNotFoundError(address);
      }
      if (response.status === 429 || response.status >= 500) {
        throw new HorizonApiError(
          `Horizon is temporarily unavailable (${response.status}).`,
          "http",
          response.status,
        );
      }
      if (!response.ok) {
        throw new HorizonApiError(
          `Horizon request failed (${response.status}).`,
          "http",
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new HorizonApiError(
          "Horizon returned invalid JSON.",
          "invalid_response",
        );
      }
    } catch (error) {
      if (signal?.aborted) throw abortError();
      const failure =
        timedOut && isRetryable(error)
          ? new HorizonApiError("Horizon request timed out.", "timeout")
          : error instanceof Error
            ? error
            : new HorizonApiError("Horizon request failed.", "network");
      if (!isRetryable(failure) || attempt === HORIZON_MAX_RETRIES) {
        throw failure;
      }
      await delay(HORIZON_RETRY_DELAY_MS * 2 ** attempt, signal);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  throw new HorizonApiError("Horizon request failed.", "network");
}

/**
 * Fetches and validates one Horizon account. Errors are typed so the data
 * layer can turn 404 into an unfunded state and let all other failures reach
 * the hook's existing error/retry state.
 */
export async function getAccount(
  address: string,
  network: Network,
  signal?: AbortSignal,
): Promise<HorizonAccount> {
  const baseUrl = getHorizonBaseUrl(network);
  const body = await fetchAccountBody(
    `${baseUrl}/accounts/${encodeURIComponent(address)}`,
    address,
    signal,
  );
  return toHorizonAccount(parseHorizonAccount(body));
}
