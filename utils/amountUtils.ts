/**
 * Stellar amount & stroop decimal math utilities.
 *
 * Stellar represents all asset amounts with up to 7 decimal places (1 unit =
 * 10^7 stroops = 10,000,000 stroops). Floating-point numbers (`Number`,
 * `parseFloat`) suffer from binary rounding errors (e.g. `0.1 + 0.2 !== 0.3`),
 * so every parsing, comparison, reserve check, and arithmetic operation in this
 * module operates on canonical decimal strings and exact `bigint` stroop counts.
 */

/** Maximum decimal places supported by Stellar (10^-7 = 1 stroop). */
export const STELLAR_DECIMALS = 7;

/** Number of stroops in 1 whole asset unit (10^7). */
export const STROOPS_PER_UNIT = BigInt(10_000_000);

/** Default Stellar network base fee in stroops (100 stroops = 0.00001 XLM). */
export const DEFAULT_BASE_FEE_STROOPS = BigInt(100);

/** Default Stellar base fee formatted in XLM. */
export const DEFAULT_BASE_FEE_XLM = "0.00001";

/** Default minimum XLM reserve required to keep a Stellar account active (1 XLM). */
export const DEFAULT_MIN_XLM_RESERVE = "1";

export type AmountParseErrorCode =
  | "empty"
  | "invalid_format"
  | "negative"
  | "too_many_decimals"
  | "non_positive"
  | "overflow";

export type AmountParseResult =
  | {
      ok: true;
      /** Canonical decimal string without superfluous leading/trailing zeros. */
      normalized: string;
      /** Exact integer amount in stroops (10^-7 units). */
      stroops: bigint;
    }
  | {
      ok: false;
      code: AmountParseErrorCode;
      message: string;
    };

/** Maximum int64 stroop limit supported by the Stellar protocol ((2^63 - 1) stroops). */
export const MAX_INT64_STROOPS = BigInt("9223372036854775807");

/**
 * Parses a user-entered or API-supplied decimal string into exact stroops
 * (`bigint`) using pure string/integer manipulation (never floating-point).
 *
 * Options:
 * - `allowZero`: when `true`, `"0"` / `"0.0"` is accepted (`0n` stroops).
 *   Defaults to `false` for payment amounts (which must be strictly > 0).
 */
export function parseAmountToStroops(
  rawInput: string,
  options: { allowZero?: boolean } = {},
): AmountParseResult {
  const { allowZero = false } = options;

  if (typeof rawInput !== "string") {
    return {
      ok: false,
      code: "invalid_format",
      message: "Enter a valid numeric amount.",
    };
  }

  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      code: "empty",
      message: "Amount is required.",
    };
  }

  if (trimmed.startsWith("-")) {
    return {
      ok: false,
      code: "negative",
      message: "Amount must be greater than zero.",
    };
  }

  // Reject scientific notation, multiple dots, commas, or non-digit characters
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    // Check specifically if they typed more than 7 decimals vs general invalid format
    return {
      ok: false,
      code: "invalid_format",
      message: "Enter a valid decimal amount (digits and optional decimal point only).",
    };
  }

  const [wholePartRaw, fracPartRaw = ""] = trimmed.split(".");

  if (fracPartRaw.length > STELLAR_DECIMALS) {
    return {
      ok: false,
      code: "too_many_decimals",
      message: `Amount can have at most ${STELLAR_DECIMALS} decimal places.`,
    };
  }

  const wholeStripped = wholePartRaw.replace(/^0+(?=\d)/, "");
  const paddedFrac = fracPartRaw.padEnd(STELLAR_DECIMALS, "0");

  const stroops =
    BigInt(wholeStripped) * STROOPS_PER_UNIT + BigInt(paddedFrac);

  if (stroops > MAX_INT64_STROOPS) {
    return {
      ok: false,
      code: "overflow",
      message: "Amount exceeds the maximum Stellar asset limit.",
    };
  }

  if (!allowZero && stroops <= BigInt(0)) {
    return {
      ok: false,
      code: "non_positive",
      message: "Amount must be greater than zero.",
    };
  }

  return {
    ok: true,
    normalized: formatStroopsToAmount(stroops),
    stroops,
  };
}

/**
 * Converts an exact stroop count (`bigint`) back into a canonical decimal string
 * with up to 7 decimal places (trailing fractional zeros trimmed).
 */
export function formatStroopsToAmount(
  stroops: bigint,
  options: { minDecimals?: number } = {},
): string {
  const { minDecimals = 0 } = options;
  const isNegative = stroops < BigInt(0);
  const abs = isNegative ? -stroops : stroops;

  const whole = abs / STROOPS_PER_UNIT;
  const frac = abs % STROOPS_PER_UNIT;

  const fracPadded = frac.toString().padStart(STELLAR_DECIMALS, "0");
  const trimmedFrac = fracPadded.replace(/0+$/, "");

  const finalFrac =
    trimmedFrac.length < minDecimals
      ? trimmedFrac.padEnd(minDecimals, "0")
      : trimmedFrac;

  const sign = isNegative ? "-" : "";
  return finalFrac.length > 0
    ? `${sign}${whole.toString()}.${finalFrac}`
    : `${sign}${whole.toString()}`;
}

/**
 * Returns `true` if `value` is a valid positive Stellar amount with up to 7
 * decimal places.
 */
export function isValidStellarAmount(
  value: string,
  options: { allowZero?: boolean } = {},
): boolean {
  return parseAmountToStroops(value, options).ok;
}

/**
 * Compares two decimal amount strings using exact stroop integer math.
 * Returns `-1` if `a < b`, `0` if `a === b`, and `1` if `a > b`.
 *
 * @throws {Error} If either string is not a valid non-negative Stellar decimal.
 */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 {
  const parsedA = parseAmountToStroops(a, { allowZero: true });
  const parsedB = parseAmountToStroops(b, { allowZero: true });

  if (!parsedA.ok) {
    throw new Error(`Invalid amount "${a}": ${parsedA.message}`);
  }
  if (!parsedB.ok) {
    throw new Error(`Invalid amount "${b}": ${parsedB.message}`);
  }

  if (parsedA.stroops < parsedB.stroops) return -1;
  if (parsedA.stroops > parsedB.stroops) return 1;
  return 0;
}

/**
 * Adds two decimal amount strings with exact stroop arithmetic and returns the
 * normalized decimal string.
 */
export function addAmounts(a: string, b: string): string {
  const parsedA = parseAmountToStroops(a, { allowZero: true });
  const parsedB = parseAmountToStroops(b, { allowZero: true });

  if (!parsedA.ok) {
    throw new Error(`Invalid amount "${a}": ${parsedA.message}`);
  }
  if (!parsedB.ok) {
    throw new Error(`Invalid amount "${b}": ${parsedB.message}`);
  }

  return formatStroopsToAmount(parsedA.stroops + parsedB.stroops);
}

/**
 * Subtracts decimal amount `b` from `a` with exact stroop arithmetic and
 * returns the normalized decimal string.
 */
export function subtractAmounts(a: string, b: string): string {
  const parsedA = parseAmountToStroops(a, { allowZero: true });
  const parsedB = parseAmountToStroops(b, { allowZero: true });

  if (!parsedA.ok) {
    throw new Error(`Invalid amount "${a}": ${parsedA.message}`);
  }
  if (!parsedB.ok) {
    throw new Error(`Invalid amount "${b}": ${parsedB.message}`);
  }

  return formatStroopsToAmount(parsedA.stroops - parsedB.stroops);
}

export interface SpendableCheckParams {
  /** User-entered amount to send (decimal string). */
  amount: string;
  /** Current balance of the selected asset (decimal string). */
  balance: string;
  /** Asset code, e.g. `"XLM"` or `"USDC"`. */
  assetCode: string;
  /** Network fee in XLM (decimal string, defaults to `"0.00001"`). */
  feeXlm?: string;
  /**
   * Minimum XLM reserve required when sending native XLM (decimal string,
   * defaults to `"1"` XLM). Ignored for non-native tokens unless `isNative`
   * is true.
   */
  minReserveXlm?: string;
}

export type SpendableViolation =
  | "none"
  | "invalid_amount"
  | "exceeds_balance"
  | "breaches_minimum_reserve";

export interface SpendableCheckResult {
  allowed: boolean;
  violation: SpendableViolation;
  message: string | null;
  /** Maximum spendable amount for this asset formatted as a decimal string. */
  maxSpendable: string;
  /** Remaining balance after the payment (and fee if XLM), or `"0"` if invalid. */
  remainingBalance: string;
}

/**
 * Computes the maximum spendable amount for an asset using exact stroop math.
 * For native XLM, `maxSpendable = max(0, balance - minReserveXlm - feeXlm)`.
 * For issued assets (e.g. USDC), `maxSpendable = balance`.
 */
export function getMaxSpendableAmount(params: {
  balance: string;
  assetCode: string;
  feeXlm?: string;
  minReserveXlm?: string;
}): string {
  const {
    balance,
    assetCode,
    feeXlm = DEFAULT_BASE_FEE_XLM,
    minReserveXlm = DEFAULT_MIN_XLM_RESERVE,
  } = params;

  const balanceParsed = parseAmountToStroops(balance, { allowZero: true });
  if (!balanceParsed.ok) return "0";

  if (assetCode.trim().toUpperCase() !== "XLM") {
    return formatStroopsToAmount(balanceParsed.stroops);
  }

  const feeParsed = parseAmountToStroops(feeXlm, { allowZero: true });
  const reserveParsed = parseAmountToStroops(minReserveXlm, { allowZero: true });

  const feeStroops = feeParsed.ok ? feeParsed.stroops : DEFAULT_BASE_FEE_STROOPS;
  const reserveStroops = reserveParsed.ok ? reserveParsed.stroops : STROOPS_PER_UNIT;

  const available = balanceParsed.stroops - reserveStroops - feeStroops;
  return available > BigInt(0) ? formatStroopsToAmount(available) : "0";
}

/**
 * Validates whether a payment amount can be spent from the given asset balance
 * without exceeding the balance or breaching the Stellar minimum XLM reserve.
 */
export function checkSpendableBalance(
  params: SpendableCheckParams,
): SpendableCheckResult {
  const {
    amount,
    balance,
    assetCode,
    feeXlm = DEFAULT_BASE_FEE_XLM,
    minReserveXlm = DEFAULT_MIN_XLM_RESERVE,
  } = params;

  const maxSpendable = getMaxSpendableAmount({
    balance,
    assetCode,
    feeXlm,
    minReserveXlm,
  });

  const amountParsed = parseAmountToStroops(amount, { allowZero: false });
  if (!amountParsed.ok) {
    return {
      allowed: false,
      violation: "invalid_amount",
      message: amountParsed.message,
      maxSpendable,
      remainingBalance: balance,
    };
  }

  const balanceParsed = parseAmountToStroops(balance, { allowZero: true });
  if (!balanceParsed.ok) {
    return {
      allowed: false,
      violation: "exceeds_balance",
      message: "Account balance is unavailable.",
      maxSpendable: "0",
      remainingBalance: "0",
    };
  }

  const isNativeXlm = assetCode.trim().toUpperCase() === "XLM";
  const feeParsed = parseAmountToStroops(feeXlm, { allowZero: true });
  const reserveParsed = parseAmountToStroops(minReserveXlm, { allowZero: true });
  const feeStroops = feeParsed.ok ? feeParsed.stroops : DEFAULT_BASE_FEE_STROOPS;
  const reserveStroops = reserveParsed.ok ? reserveParsed.stroops : STROOPS_PER_UNIT;

  if (amountParsed.stroops > balanceParsed.stroops) {
    return {
      allowed: false,
      violation: "exceeds_balance",
      message: `Amount exceeds your available ${assetCode} balance of ${formatStroopsToAmount(balanceParsed.stroops)} ${assetCode}.`,
      maxSpendable,
      remainingBalance: "0",
    };
  }

  if (isNativeXlm) {
    const totalDeduction = amountParsed.stroops + feeStroops;
    if (totalDeduction > balanceParsed.stroops) {
      return {
        allowed: false,
        violation: "exceeds_balance",
        message: `Amount plus network fee (${formatStroopsToAmount(feeStroops)} XLM) exceeds your ${assetCode} balance.`,
        maxSpendable,
        remainingBalance: "0",
      };
    }

    const remainingAfterTx = balanceParsed.stroops - totalDeduction;
    if (remainingAfterTx < reserveStroops) {
      return {
        allowed: false,
        violation: "breaches_minimum_reserve",
        message: `This payment would leave less than the required ${formatStroopsToAmount(reserveStroops)} XLM minimum network reserve ( plus ${formatStroopsToAmount(feeStroops)} XLM fee). Maximum spendable is ${maxSpendable} XLM.`,
        maxSpendable,
        remainingBalance: formatStroopsToAmount(remainingAfterTx),
      };
    }

    return {
      allowed: true,
      violation: "none",
      message: null,
      maxSpendable,
      remainingBalance: formatStroopsToAmount(remainingAfterTx),
    };
  }

  const remaining = balanceParsed.stroops - amountParsed.stroops;
  return {
    allowed: true,
    violation: "none",
    message: null,
    maxSpendable,
    remainingBalance: formatStroopsToAmount(remaining),
  };
}
