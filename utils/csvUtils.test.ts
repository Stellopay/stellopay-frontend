/**
 * Tests for CSV utility functions including column-aware transaction export.
 *
 * Covers:
 * - escapeCsvField: null/undefined, CSV injection prevention, special characters, quote escaping
 * - generateTransactionsCsv: column selection, empty data, all columns, subset of columns
 * - TRANSACTION_CSV_COLUMNS: has expected keys
 * - downloadCsv: basic smoke test (creates and removes a link element)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  escapeCsvField,
  generateTransactionsCsv,
  downloadCsv,
  downloadCsvContent,
  TRANSACTION_CSV_COLUMNS,
} from "./csvUtils";
import type { TransactionProps } from "@/types/transaction";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTransaction(overrides: Partial<TransactionProps> = {}): TransactionProps {
  return {
    id: "1",
    type: "Payment",
    address: "GABC123",
    date: "2024-01-15",
    time: "10:30",
    token: "XLM",
    amount: "+100.00 XLM",
    status: "Completed",
    tokenIcon: "/xlm.svg",
    ...overrides,
  };
}

// ── escapeCsvField ────────────────────────────────────────────────────────────

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns the field as-is for simple values", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("prefixes fields starting with = to prevent CSV injection", () => {
    expect(escapeCsvField("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
  });

  it("prefixes fields starting with + to prevent CSV injection", () => {
    expect(escapeCsvField("+100")).toBe("'+100");
  });

  it("prefixes fields starting with - to prevent CSV injection", () => {
    expect(escapeCsvField("-100")).toBe("'-100");
  });

  it("prefixes fields starting with @ to prevent CSV injection", () => {
    expect(escapeCsvField("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
  });

  it("wraps fields containing commas in double quotes", () => {
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
  });

  it("wraps fields containing newlines in double quotes", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it("handles fields with both commas and quotes", () => {
    expect(escapeCsvField('a,"b",c')).toBe('"a,""b"",c"');
  });
});

// ── TRANSACTION_CSV_COLUMNS ───────────────────────────────────────────────────

describe("TRANSACTION_CSV_COLUMNS", () => {
  it("has exactly 6 columns", () => {
    expect(TRANSACTION_CSV_COLUMNS).toHaveLength(6);
  });

  it("includes all expected column keys", () => {
    const keys = TRANSACTION_CSV_COLUMNS.map((c) => c.key);
    expect(keys).toEqual(["type", "address", "date", "token", "amount", "status"]);
  });

  it("each column has a non-empty header", () => {
    for (const col of TRANSACTION_CSV_COLUMNS) {
      expect(col.header).toBeTruthy();
    }
  });
});

// ── generateTransactionsCsv ───────────────────────────────────────────────────

describe("generateTransactionsCsv", () => {
  it("generates CSV header row only when data is empty", () => {
    const csv = generateTransactionsCsv([], ["type", "status"]);
    expect(csv).toBe("Transaction Type,Status");
  });

  it("generates CSV for all columns", () => {
    const rows = [makeTransaction(), makeTransaction({ id: "2", type: "Deposit" })];
    const csv = generateTransactionsCsv(rows, TRANSACTION_CSV_COLUMNS.map((c) => c.key));
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Transaction Type,Address,Date,Token,Amount,Status");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Payment");
    expect(lines[2]).toContain("Deposit");
  });

  it("generates CSV for a subset of columns", () => {
    const rows = [makeTransaction()];
    const csv = generateTransactionsCsv(rows, ["type", "amount"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Transaction Type,Amount");
    expect(lines[1]).toContain("Payment");
    expect(lines[1]).toContain("+100.00 XLM");
  });

  it("generates CSV for a single column", () => {
    const rows = [makeTransaction()];
    const csv = generateTransactionsCsv(rows, ["status"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Status");
    expect(lines[1]).toBe("Completed");
  });

  it("returns only the header row when no columns are selected", () => {
    const rows = [makeTransaction()];
    const csv = generateTransactionsCsv(rows, []);
    expect(csv).toBe("");
  });

  it("handles special characters in transaction data", () => {
    const rows = [
      makeTransaction({ address: 'GABC,123', amount: "-50.00 XLM" }),
    ];
    const csv = generateTransactionsCsv(rows, ["address", "amount"]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"GABC,123"');
    expect(lines[1]).toContain("'-50.00 XLM");
  });
});

// ── downloadCsv / downloadCsvContent ──────────────────────────────────────────

describe("downloadCsv", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a download link, clicks it, and cleans up", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    } as unknown as HTMLAnchorElement;

    createElementSpy.mockReturnValue(mockLink);

    downloadCsv("test.csv", ["Name", "Age"], [["Alice", "30"]]);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test.csv");
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    expect(revokeSpy).toHaveBeenCalled();
  });
});

describe("downloadCsvContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads pre-built CSV content as a file", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    } as unknown as HTMLAnchorElement;

    createElementSpy.mockReturnValue(mockLink);

    downloadCsvContent("export.csv", "col1,col2\nval1,val2");

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "export.csv");
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });
});
