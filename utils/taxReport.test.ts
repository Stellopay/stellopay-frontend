import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Transaction } from "@/types/transaction";
import {
  TAX_STATEMENT_DISCLAIMER,
  getZonedCalendarParts,
  parseTransactionToDate,
  deriveTaxPeriods,
  buildTaxReportData,
  generateTaxReportCsv,
  generateTaxReportPdfBlob,
  triggerBlobDownload,
} from "./taxReport";

const makeTx = (overrides: Partial<Transaction>): Transaction => ({
  id: "tx-1",
  type: "Payment",
  txId: "hash-123",
  address: "0x1234...5678",
  date: "2025-06-15",
  time: "10:00AM",
  token: "USDC",
  amount: 100,
  status: "Completed",
  statusColor: "success",
  ...overrides,
});

describe("taxReport", () => {
  describe("getZonedCalendarParts & timezone year boundaries", () => {
    it("assigns 2025-12-31T23:59:00.000Z to 2025 Q4 in America/New_York and 2026 Q1 in Asia/Tokyo", () => {
      const boundaryDate = new Date("2025-12-31T23:59:00.000Z");

      // New York is UTC-5 -> Dec 31, 2025 18:59
      const ny = getZonedCalendarParts(boundaryDate, "America/New_York");
      expect(ny.year).toBe(2025);
      expect(ny.month).toBe(12);
      expect(ny.day).toBe(31);
      expect(ny.quarter).toBe(4);

      // Tokyo is UTC+9 -> Jan 1, 2026 08:59
      const tokyo = getZonedCalendarParts(boundaryDate, "Asia/Tokyo");
      expect(tokyo.year).toBe(2026);
      expect(tokyo.month).toBe(1);
      expect(tokyo.day).toBe(1);
      expect(tokyo.quarter).toBe(1);
    });

    it("assigns 2026-01-01T02:00:00.000Z to 2025 Q4 in America/New_York and 2026 Q1 in UTC", () => {
      const boundaryDate = new Date("2026-01-01T02:00:00.000Z");

      // In New York (UTC-5), it is Dec 31, 2025 21:00
      const ny = getZonedCalendarParts(boundaryDate, "America/New_York");
      expect(ny.year).toBe(2025);
      expect(ny.quarter).toBe(4);

      // In UTC, it is Jan 1, 2026
      const utc = getZonedCalendarParts(boundaryDate, "UTC");
      expect(utc.year).toBe(2026);
      expect(utc.quarter).toBe(1);
    });
  });

  describe("parseTransactionToDate", () => {
    it("parses full ISO strings", () => {
      const d = parseTransactionToDate("2025-10-15T12:00:00.000Z");
      expect(d).not.toBeNull();
      expect(d?.getUTCFullYear()).toBe(2025);
    });

    it("parses YYYY-MM-DD and time", () => {
      const d = parseTransactionToDate("2025-04-12", "09:30AM");
      expect(d).not.toBeNull();
      expect(d?.toISOString()).toBe("2025-04-12T09:30:00.000Z");
    });

    it("returns null for empty date strings", () => {
      expect(parseTransactionToDate("")).toBeNull();
    });
  });

  describe("deriveTaxPeriods", () => {
    it("derives sorted annual and quarterly periods for transactions with activity", () => {
      const txs: Transaction[] = [
        makeTx({ date: "2026-04-10T10:00:00.000Z" }), // 2026 Q2
        makeTx({ date: "2026-01-15T10:00:00.000Z" }), // 2026 Q1
        makeTx({ date: "2025-11-20T10:00:00.000Z" }), // 2025 Q4
      ];

      const periods = deriveTaxPeriods(txs, "UTC");
      expect(periods).toHaveLength(5);
      expect(periods.map((p) => p.id)).toEqual([
        "tax-2026",
        "stmt-2026-q2",
        "stmt-2026-q1",
        "tax-2025",
        "stmt-2025-q4",
      ]);
      expect(periods[0].type).toBe("Tax summary");
      expect(periods[1].type).toBe("Transaction statement");
    });

    it("returns empty array when transactions list is empty", () => {
      expect(deriveTaxPeriods([], "UTC")).toEqual([]);
    });
  });

  describe("buildTaxReportData & integer minor units", () => {
    it("calculates exact totals without floating point precision issues", () => {
      // 0.1 + 0.2 in floating point is 0.30000000000000004
      const txs: Transaction[] = [
        makeTx({
          date: "2025-05-01T10:00:00.000Z",
          token: "USDC",
          amount: 0.1,
          fee: 0.05 as unknown as number,
        }),
        makeTx({
          date: "2025-05-02T10:00:00.000Z",
          token: "USDC",
          amount: 0.2,
          fee: 0.05 as unknown as number,
        }),
        makeTx({
          date: "2025-05-03T10:00:00.000Z",
          token: "USDC",
          amount: -0.15,
        }),
        makeTx({
          date: "2025-05-04T10:00:00.000Z",
          token: "XLM",
          amount: 50.0,
        }),
      ];

      const period = {
        id: "stmt-2025-q2",
        period: "Q2 2025",
        dateRange: "Apr 1 - Jun 30, 2025",
        type: "Transaction statement" as const,
        periodType: "quarter" as const,
        year: 2025,
        quarter: 2 as const,
      };

      const report = buildTaxReportData(txs, period, "UTC");
      expect(report.assetSummaries).toHaveLength(2);

      const usdc = report.assetSummaries.find((a) => a.asset === "USDC");
      expect(usdc).toBeDefined();
      expect(usdc?.totalIncome).toBe(0.3); // exact, no 0.30000000000000004
      expect(usdc?.totalOutgoing).toBe(0.15);
      expect(usdc?.netTotal).toBe(0.15);
      expect(usdc?.totalFees).toBe(0.1);
      expect(usdc?.transactionCount).toBe(3);

      const xlm = report.assetSummaries.find((a) => a.asset === "XLM");
      expect(xlm?.totalIncome).toBe(50);
      expect(xlm?.totalOutgoing).toBe(0);
      expect(xlm?.netTotal).toBe(50);
      expect(xlm?.transactionCount).toBe(1);

      expect(report.disclaimer).toBe(TAX_STATEMENT_DISCLAIMER);
    });

    it("respects timezone boundaries when filtering transactions for a period", () => {
      // 2025-12-31T23:50:00.000Z is 2025 Q4 in America/New_York, but 2026 Q1 in Asia/Tokyo
      const boundaryTx = makeTx({
        id: "tx-ny-boundary",
        date: "2025-12-31T23:50:00.000Z",
        amount: 500,
        token: "USDC",
      });

      const q4_2025 = {
        id: "stmt-2025-q4",
        period: "Q4 2025",
        dateRange: "Oct 1 - Dec 31, 2025",
        type: "Transaction statement" as const,
        periodType: "quarter" as const,
        year: 2025,
        quarter: 4 as const,
      };

      const q1_2026 = {
        id: "stmt-2026-q1",
        period: "Q1 2026",
        dateRange: "Jan 1 - Mar 31, 2026",
        type: "Transaction statement" as const,
        periodType: "quarter" as const,
        year: 2026,
        quarter: 1 as const,
      };

      // In New York, boundaryTx is in Q4 2025
      const nyReportQ4 = buildTaxReportData(
        [boundaryTx],
        q4_2025,
        "America/New_York",
      );
      expect(nyReportQ4.transactions).toHaveLength(1);
      const nyReportQ1 = buildTaxReportData(
        [boundaryTx],
        q1_2026,
        "America/New_York",
      );
      expect(nyReportQ1.transactions).toHaveLength(0);

      // In Tokyo, boundaryTx is in Q1 2026
      const tokyoReportQ4 = buildTaxReportData(
        [boundaryTx],
        q4_2025,
        "Asia/Tokyo",
      );
      expect(tokyoReportQ4.transactions).toHaveLength(0);
      const tokyoReportQ1 = buildTaxReportData(
        [boundaryTx],
        q1_2026,
        "Asia/Tokyo",
      );
      expect(tokyoReportQ1.transactions).toHaveLength(1);
    });
  });

  describe("generateTaxReportCsv", () => {
    it("generates CSV with required headers, disclaimer, asset summary and transaction rows", () => {
      const txs: Transaction[] = [
        makeTx({
          txId: "HASH-101",
          date: "2026-02-10T12:00:00.000Z",
          token: "USDC",
          amount: 250,
          fee: 1.5 as unknown as number,
          memo: 'Payment "services"',
        }),
      ];

      const period = {
        id: "stmt-2026-q1",
        period: "Q1 2026",
        dateRange: "Jan 1 - Mar 31, 2026",
        type: "Transaction statement" as const,
        periodType: "quarter" as const,
        year: 2026,
        quarter: 1 as const,
      };

      const report = buildTaxReportData(txs, period, "UTC");
      const csv = generateTaxReportCsv(report);

      expect(csv).toContain("Stellopay Statement - Q1 2026");
      expect(csv).toContain("Disclaimer:");
      expect(csv).toContain("Summary by Asset");
      expect(csv).toContain('"USDC",250.00,0.00,250.00,1.50,1');
      expect(csv).toContain("Transactions");
      expect(csv).toContain('"HASH-101"');
      expect(csv).toContain('Payment ""services""');
    });
  });

  describe("generateTaxReportPdfBlob & triggerBlobDownload", () => {
    it("generates a PDF Blob with dynamically loaded jsPDF", async () => {
      const txs: Transaction[] = [
        makeTx({
          date: "2026-03-01T10:00:00.000Z",
          token: "USDC",
          amount: 120,
        }),
      ];

      const period = {
        id: "tax-2026",
        period: "Tax year 2026",
        dateRange: "Jan 1 - Dec 31, 2026",
        type: "Tax summary" as const,
        periodType: "year" as const,
        year: 2026,
      };

      const report = buildTaxReportData(txs, period, "UTC");
      const blob = await generateTaxReportPdfBlob(report);

      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(0);
    });

    it("triggers ephemeral blob download and revokes Object URL", () => {
      const mockCreateObjectURL = vi
        .fn()
        .mockReturnValue("blob:http://localhost/test-uuid");
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      vi.useFakeTimers();
      const blob = new Blob(["dummy content"], { type: "text/plain" });
      triggerBlobDownload(blob, "statement.csv");

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      vi.advanceTimersByTime(200);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(
        "blob:http://localhost/test-uuid",
      );
      vi.useRealTimers();
    });
  });
});
