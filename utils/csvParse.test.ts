import { describe, it, expect } from "vitest";
import { parseCsv, parseCsvChunked, neutralizeFormula } from "./csvParse";

describe("utils/csvParse.ts", () => {
  describe("neutralizeFormula", () => {
    it("neutralizes values starting with =", () => {
      expect(neutralizeFormula("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    });

    it("neutralizes values starting with +", () => {
      expect(neutralizeFormula("+12345")).toBe("'+12345");
    });

    it("neutralizes values starting with -", () => {
      expect(neutralizeFormula("-cmd|' /C calc'!A0")).toBe("'-cmd|' /C calc'!A0");
    });

    it("neutralizes values starting with @", () => {
      expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    });

    it("leaves regular strings unchanged", () => {
      expect(neutralizeFormula("Hello World")).toBe("Hello World");
      expect(neutralizeFormula("123.45")).toBe("123.45");
      expect(neutralizeFormula("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF")).toBe(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      );
    });
  });

  describe("parseCsv", () => {
    it("parses basic CSV content", () => {
      const csv = "address,amount,asset\nGBBD,100,USDC\nGAAQ,200,XLM";
      const result = parseCsv(csv);

      expect(result.headers).toEqual(["address", "amount", "asset"]);
      expect(result.rows).toEqual([
        ["GBBD", "100", "USDC"],
        ["GAAQ", "200", "XLM"],
      ]);
      expect(result.totalRows).toBe(2);
    });

    it("strips UTF-8 BOM if present", () => {
      const csvWithBom = "\uFEFFaddress,amount,asset\nGBBD,100,USDC";
      const result = parseCsv(csvWithBom);

      expect(result.headers).toEqual(["address", "amount", "asset"]);
      expect(result.rows[0]).toEqual(["GBBD", "100", "USDC"]);
    });

    it("handles CRLF line endings", () => {
      const csv = "address,amount,asset\r\nGBBD,100,USDC\r\nGAAQ,200,XLM\r\n";
      const result = parseCsv(csv);

      expect(result.headers).toEqual(["address", "amount", "asset"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["GBBD", "100", "USDC"]);
      expect(result.rows[1]).toEqual(["GAAQ", "200", "XLM"]);
    });

    it("parses quoted fields with embedded commas", () => {
      const csv = 'address,amount,asset,memo\nGBBD,100,USDC,"Payroll, January 2026"';
      const result = parseCsv(csv);

      expect(result.rows[0][3]).toBe("Payroll, January 2026");
    });

    it("parses escaped quotes inside quotes", () => {
      const csv = 'name,memo\nAlice,"Contract for ""Project X"""';
      const result = parseCsv(csv);

      expect(result.rows[0][1]).toBe('Contract for "Project X"');
    });

    it("parses quoted fields with embedded newlines", () => {
      const csv = 'address,notes\nGBBD,"Line 1\nLine 2"';
      const result = parseCsv(csv);

      expect(result.rows[0][1]).toBe("Line 1\nLine 2");
    });

    it("neutralizes formulas when sanitizeFormulas option is true", () => {
      const csv = "address,amount,memo\nGBBD,100,=HYPERLINK('malicious')";
      const result = parseCsv(csv, { sanitizeFormulas: true });

      expect(result.rows[0][2]).toBe("'=HYPERLINK('malicious')");
    });

    it("respects maxRows option", () => {
      const csv = "a,b\n1,2\n3,4\n5,6\n7,8";
      const result = parseCsv(csv, { maxRows: 2 });

      expect(result.rows).toHaveLength(2);
    });

    it("handles empty or whitespace-only input", () => {
      expect(parseCsv("").rows).toEqual([]);
      expect(parseCsv("   \n\n").rows).toEqual([]);
    });
  });

  describe("parseCsvChunked", () => {
    it("asynchronously parses CSV and tracks progress", async () => {
      const lines = ["address,amount,asset"];
      for (let i = 0; i < 20; i++) {
        lines.push(`GBBD_${i},${i * 10},USDC`);
      }
      const csv = lines.join("\n");

      let progressCalled = false;
      const result = await parseCsvChunked(csv, {
        chunkSize: 5,
        onProgress: (p) => {
          progressCalled = true;
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(100);
        },
      });

      expect(progressCalled).toBe(true);
      expect(result.rows).toHaveLength(20);
      expect(result.totalRows).toBe(20);
    });
  });
});
