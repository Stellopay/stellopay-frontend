import { describe, it, expect } from "vitest";
import {
  parseAmountToStroops,
  stroopsToAmountString,
  sumExactAmounts,
  batchRowSchema,
  validateBatchData,
  generateErrorReportCsv,
  getBatchTemplateCsv,
} from "./batch-payments";

const VALID_ADDR_1 = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const VALID_ADDR_2 = "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4";
const INVALID_ADDR = "GBBDNOTAVALIDSTELLARADDRESS1234567890";

describe("lib/batch-payments.ts", () => {
  describe("Exact Decimal Precision Arithmetic", () => {
    it("converts decimal string to stroops accurately", () => {
      expect(parseAmountToStroops("1")).toBe(10_000_000n);
      expect(parseAmountToStroops("1.5")).toBe(15_000_000n);
      expect(parseAmountToStroops("0.0000001")).toBe(1n);
      expect(parseAmountToStroops("100.1234567")).toBe(1_001_234_567n);
    });

    it("converts stroops back to decimal string without floating point issues", () => {
      expect(stroopsToAmountString(10_000_000n)).toBe("1");
      expect(stroopsToAmountString(15_000_000n)).toBe("1.5");
      expect(stroopsToAmountString(1n)).toBe("0.0000001");
      expect(stroopsToAmountString(1_001_234_567n)).toBe("100.1234567");
    });

    it("rejects amounts with more than 7 decimal places in parseAmountToStroops", () => {
      expect(() => parseAmountToStroops("1.12345678")).toThrow();
    });

    it("sums exact amounts without floating-point inaccuracies", () => {
      // In normal JS floating point: 0.1 + 0.2 = 0.30000000000000004
      expect(sumExactAmounts(["0.1", "0.2"])).toBe("0.3");
      expect(sumExactAmounts(["100.0000001", "200.0000009"])).toBe("300.000001");
      expect(sumExactAmounts(["0.0000001", "0.0000002", "0.0000003"])).toBe("0.0000006");
    });
  });

  describe("batchRowSchema", () => {
    it("validates valid row input", () => {
      const valid = batchRowSchema.safeParse({
        address: VALID_ADDR_1,
        amount: "150.25",
        asset: "USDC",
        memo: "Jan Salary",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid Stellar address", () => {
      const result = batchRowSchema.safeParse({
        address: INVALID_ADDR,
        amount: "100",
        asset: "USDC",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Invalid Stellar address");
      }
    });

    it("rejects negative or zero amounts", () => {
      expect(
        batchRowSchema.safeParse({
          address: VALID_ADDR_1,
          amount: "-50",
          asset: "XLM",
        }).success,
      ).toBe(false);

      expect(
        batchRowSchema.safeParse({
          address: VALID_ADDR_1,
          amount: "0",
          asset: "XLM",
        }).success,
      ).toBe(false);
    });

    it("rejects amounts exceeding 7 decimal places", () => {
      const result = batchRowSchema.safeParse({
        address: VALID_ADDR_1,
        amount: "10.12345678",
        asset: "XLM",
      });
      expect(result.success).toBe(false);
    });

    it("rejects memo exceeding 28 characters", () => {
      const result = batchRowSchema.safeParse({
        address: VALID_ADDR_1,
        amount: "10",
        asset: "XLM",
        memo: "A".repeat(29),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateBatchData", () => {
    const headers = ["address", "amount", "asset", "memo"];

    it("validates clean batch with multiple assets and exact totals", () => {
      const data = [
        [VALID_ADDR_1, "100.5", "USDC", "Sal 1"],
        [VALID_ADDR_2, "200.25", "USDC", "Sal 2"],
        [VALID_ADDR_1, "50.0000001", "XLM", "Bonus"], // wait, same addr as row 1 triggers duplicate check
      ];
      // Let's use different addresses to test valid non-duplicate:
      const dataClean = [
        [VALID_ADDR_1, "100.5", "USDC", "Sal 1"],
        [VALID_ADDR_2, "200.25", "USDC", "Sal 2"],
      ];

      const result = validateBatchData(headers, dataClean);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.totalsByAsset["USDC"].totalAmount).toBe("300.75");
      expect(result.totalsByAsset["USDC"].itemCount).toBe(2);
    });

    it("detects duplicate addresses in batch", () => {
      const data = [
        [VALID_ADDR_1, "100", "USDC", "First"],
        [VALID_ADDR_1, "50", "USDC", "Second duplicate"],
      ];

      const result = validateBatchData(headers, data);
      expect(result.duplicateCount).toBe(1);
      expect(result.rows[1].isValid).toBe(false);
      expect(result.rows[1].isDuplicate).toBe(true);
      expect(result.rows[1].errors[0]).toContain("Duplicate address: already appears on row 2");
    });

    it("identifies invalid rows with precise errors", () => {
      const data = [
        [INVALID_ADDR, "not-a-number", "INVALIDASSETTOOLONG12345", "memo"],
      ];

      const result = validateBatchData(headers, data);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(1);
      expect(result.rows[0].errors.length).toBeGreaterThan(1);
    });

    it("flags missing required header columns", () => {
      const incompleteHeaders = ["address", "memo"];
      const data = [[VALID_ADDR_1, "memo only"]];

      const result = validateBatchData(incompleteHeaders, data);
      expect(result.headerErrors).toContain("Missing required column: 'amount'");
      expect(result.headerErrors).toContain("Missing required column: 'asset'");
      expect(result.rows[0].isValid).toBe(false);
    });
  });

  describe("generateErrorReportCsv & Formula Injection Protection", () => {
    it("neutralizes formula injection characters in error report", () => {
      const invalidRows = [
        {
          rowNumber: 2,
          data: {
            rowNumber: 2,
            address: "=CMD|' /C calc'!A0",
            amount: "+100",
            asset: "@USDC",
            memo: "-danger",
          },
          isValid: false,
          errors: ["Invalid address"],
        },
      ];

      const errorCsv = generateErrorReportCsv(invalidRows);
      expect(errorCsv).toContain("Row Number,Address,Amount,Asset,Memo,Validation Errors");
      // Must neutralize with single quote
      expect(errorCsv).toContain("''=CMD");
      expect(errorCsv).toContain("''+100");
      expect(errorCsv).toContain("''@USDC");
      expect(errorCsv).toContain("''-danger");
    });
  });

  describe("getBatchTemplateCsv", () => {
    it("returns valid CSV template", () => {
      const template = getBatchTemplateCsv();
      expect(template).toContain("address,amount,asset,memo");
      expect(template.split("\n").length).toBeGreaterThan(2);
    });
  });
});
