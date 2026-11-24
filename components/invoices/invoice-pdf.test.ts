import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invoice } from "@/types/invoice";

const { saveMock, textCalls } = vi.hoisted(() => ({
  saveMock: vi.fn(),
  textCalls: [] as string[],
}));

vi.mock("jspdf", () => {
  class JsPDFMock {
    internal = { pageSize: { getWidth: () => 595 } };
    setFontSize() {}
    setTextColor() {}
    setFont() {}
    text(value: string) {
      textCalls.push(value);
    }
    save(name: string) {
      saveMock(name);
    }
  }
  return { jsPDF: JsPDFMock, default: JsPDFMock };
});

import {
  generateInvoicePdf,
  getInvoicePdfValidationError,
  sanitizeInvoiceFileName,
} from "./invoice-pdf";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "invoice-1",
    number: "INV-0001",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    currency: "USD",
    issueDate: "2026-01-01",
    dueDate: "2026-01-31",
    status: "sent",
    taxRate: "7.5",
    notes: "Payment due in 30 days.",
    lineItems: [
      {
        id: "line-1",
        description: "Consulting services",
        quantity: 2,
        unitPrice: "19.99",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("invoice PDF validation", () => {
  it("accepts a valid invoice", () => {
    expect(getInvoicePdfValidationError(invoice())).toBeNull();
  });

  it("rejects over-long free text before it reaches the PDF", () => {
    const error = getInvoicePdfValidationError(
      invoice({ customerName: "a".repeat(121) }),
    );
    expect(error?.code).toBe("INVALID_INVOICE_PDF_INPUT");
    expect(error?.issues.some((issue) => issue.path === "customerName")).toBe(
      true,
    );
  });

  it("rejects empty descriptions", () => {
    const value = invoice();
    const error = getInvoicePdfValidationError({
      ...value,
      lineItems: [{ ...value.lineItems[0], description: "   " }],
    });
    expect(error).not.toBeNull();
  });

  it("sanitizes download filenames", () => {
    expect(sanitizeInvoiceFileName("INV-0001")).toBe("INV-0001");
    expect(sanitizeInvoiceFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeInvoiceFileName("///")).toBe("invoice");
  });
});

describe("generateInvoicePdf", () => {
  beforeEach(() => {
    saveMock.mockClear();
    textCalls.length = 0;
  });

  it("does not load jsPDF or save when input is invalid", async () => {
    const value = invoice({ customerEmail: "".padEnd(300, "a") });
    await expect(generateInvoicePdf(value)).rejects.toMatchObject({
      code: "INVALID_INVOICE_PDF_INPUT",
    });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("writes the number, line items, tax, total and due date", async () => {
    await generateInvoicePdf(invoice());

    const text = textCalls.join("\n");
    expect(text).toContain("INV-0001");
    expect(text).toContain("Consulting services");
    expect(text).toContain("2026-01-31");
    expect(text).toContain("Tax (7.5%)");
    expect(text).toContain("USD 3.00");
    expect(text).toContain("USD 42.98");
    expect(saveMock).toHaveBeenCalledWith("invoice-INV-0001.pdf");
  });
});
