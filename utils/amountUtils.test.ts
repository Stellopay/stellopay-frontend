import { describe, expect, it } from "vitest";
import {
  addAmounts,
  checkSpendableBalance,
  compareAmounts,
  DEFAULT_BASE_FEE_XLM,
  DEFAULT_MIN_XLM_RESERVE,
  formatStroopsToAmount,
  getMaxSpendableAmount,
  isValidStellarAmount,
  MAX_INT64_STROOPS,
  parseAmountToStroops,
  STROOPS_PER_UNIT,
  subtractAmounts,
} from "./amountUtils";

describe("parseAmountToStroops", () => {
  it("parses whole numbers and decimals up to 7 decimal places accurately", () => {
    const whole = parseAmountToStroops("42");
    expect(whole).toEqual({
      ok: true,
      normalized: "42",
      stroops: BigInt(42) * STROOPS_PER_UNIT,
    });

    const singleStroop = parseAmountToStroops("0.0000001");
    expect(singleStroop).toEqual({
      ok: true,
      normalized: "0.0000001",
      stroops: BigInt(1),
    });

    const trimmedZeros = parseAmountToStroops("  0012.3450000  ");
    expect(trimmedZeros).toEqual({
      ok: true,
      normalized: "12.345",
      stroops: BigInt(123_450_000),
    });
  });

  it("avoids IEEE-754 floating-point drift (0.1 + 0.2 === 0.3)", () => {
    expect(addAmounts("0.1", "0.2")).toBe("0.3");
    expect(subtractAmounts("0.3", "0.1")).toBe("0.2");
    expect(addAmounts("100.0000001", "0.0000002")).toBe("100.0000003");
  });

  it("rejects empty, non-numeric, negative, and zero values by default", () => {
    expect(parseAmountToStroops("")).toMatchObject({
      ok: false,
      code: "empty",
    });
    expect(parseAmountToStroops("   ")).toMatchObject({
      ok: false,
      code: "empty",
    });
    expect(parseAmountToStroops("-5.25")).toMatchObject({
      ok: false,
      code: "negative",
    });
    expect(parseAmountToStroops("0")).toMatchObject({
      ok: false,
      code: "non_positive",
    });
    expect(parseAmountToStroops("0.0000000")).toMatchObject({
      ok: false,
      code: "non_positive",
    });
    expect(parseAmountToStroops("12.3.4")).toMatchObject({
      ok: false,
      code: "invalid_format",
    });
    expect(parseAmountToStroops("1e5")).toMatchObject({
      ok: false,
      code: "invalid_format",
    });
    expect(parseAmountToStroops("abc")).toMatchObject({
      ok: false,
      code: "invalid_format",
    });
  });

  it("accepts zero when allowZero is true", () => {
    const res = parseAmountToStroops("0.00", { allowZero: true });
    expect(res).toEqual({
      ok: true,
      normalized: "0",
      stroops: BigInt(0),
    });
  });

  it("rejects amounts with more than 7 decimal places", () => {
    const res = parseAmountToStroops("1.12345678");
    expect(res).toEqual({
      ok: false,
      code: "too_many_decimals",
      message: "Amount can have at most 7 decimal places.",
    });
  });

  it("rejects amounts exceeding Stellar int64 stroop maximum", () => {
    const res = parseAmountToStroops("9999999999999.9999999");
    expect(res).toMatchObject({
      ok: false,
      code: "overflow",
    });
  });
});

describe("formatStroopsToAmount & isValidStellarAmount", () => {
  it("formats stroops to canonical decimal string", () => {
    expect(formatStroopsToAmount(BigInt(0))).toBe("0");
    expect(formatStroopsToAmount(BigInt(10_000_000))).toBe("1");
    expect(formatStroopsToAmount(BigInt(10_500_000))).toBe("1.05");
    expect(formatStroopsToAmount(BigInt(10_500_000), { minDecimals: 4 })).toBe(
      "1.0500",
    );
    expect(formatStroopsToAmount(MAX_INT64_STROOPS)).toBe(
      "922337203685.4775807",
    );
  });

  it("validates Stellar amount strings", () => {
    expect(isValidStellarAmount("25.1234567")).toBe(true);
    expect(isValidStellarAmount("0")).toBe(false);
    expect(isValidStellarAmount("0", { allowZero: true })).toBe(true);
    expect(isValidStellarAmount("1.12345678")).toBe(false);
  });
});

describe("compareAmounts", () => {
  it("compares decimal amounts without floating point loss", () => {
    expect(compareAmounts("10.0000001", "10.0000002")).toBe(-1);
    expect(compareAmounts("10.50", "10.5000000")).toBe(0);
    expect(compareAmounts("100", "99.9999999")).toBe(1);
  });
});

describe("checkSpendableBalance & getMaxSpendableAmount", () => {
  it("allows full balance spend on non-native assets (USDC)", () => {
    expect(
      getMaxSpendableAmount({
        balance: "2432.00",
        assetCode: "USDC",
      }),
    ).toBe("2432");

    const check = checkSpendableBalance({
      amount: "2432.00",
      balance: "2432.00",
      assetCode: "USDC",
    });
    expect(check.allowed).toBe(true);
    expect(check.violation).toBe("none");
    expect(check.remainingBalance).toBe("0");
  });

  it("blocks over-balance payments on non-native assets", () => {
    const check = checkSpendableBalance({
      amount: "2432.0000001",
      balance: "2432.00",
      assetCode: "USDC",
    });
    expect(check.allowed).toBe(false);
    expect(check.violation).toBe("exceeds_balance");
    expect(check.message).toMatch(/exceeds your available USDC balance/i);
  });

  it("enforces minimum XLM reserve and network fee on native XLM payments", () => {
    // Balance: 10 XLM, Reserve: 1 XLM, Fee: 0.00001 XLM -> Max spendable: 8.99999 XLM
    const max = getMaxSpendableAmount({
      balance: "10",
      assetCode: "XLM",
      feeXlm: DEFAULT_BASE_FEE_XLM,
      minReserveXlm: DEFAULT_MIN_XLM_RESERVE,
    });
    expect(max).toBe("8.99999");

    // Spending 8.99999 XLM leaves exactly 1 XLM reserve
    const allowedCheck = checkSpendableBalance({
      amount: "8.99999",
      balance: "10",
      assetCode: "XLM",
    });
    expect(allowedCheck.allowed).toBe(true);
    expect(allowedCheck.remainingBalance).toBe("1");

    // Spending 9 XLM leaves 0.99999 XLM (< 1 XLM reserve) -> blocked
    const reserveBreach = checkSpendableBalance({
      amount: "9",
      balance: "10",
      assetCode: "XLM",
    });
    expect(reserveBreach.allowed).toBe(false);
    expect(reserveBreach.violation).toBe("breaches_minimum_reserve");
    expect(reserveBreach.message).toMatch(/minimum network reserve/i);
  });
});
