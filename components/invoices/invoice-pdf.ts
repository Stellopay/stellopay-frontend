import { z, type ZodError } from "zod";
import type { Invoice } from "@/types/invoice";
import { INVOICE_FIELD_LIMITS } from "@/types/invoice";
import {
  calculateInvoiceTotals,
  formatMinorUnits,
  formatTaxRate,
  parseMoneyToMinorUnits,
  parseTaxRateToBps,
} from "@/utils/moneyUtils";

export const INVOICE_PDF_FIELD_LIMITS = {
  ...INVOICE_FIELD_LIMITS,
  status: 16,
} as const;

const pdfText = (limit: number) =>
  z
    .string()
    .max(limit, `Use at most ${limit} characters.`)
    .refine((value) => value.trim().length > 0, "Provide a non-empty string.");

const invoicePdfSchema = z.object({
  number: pdfText(INVOICE_PDF_FIELD_LIMITS.number),
  customerName: pdfText(INVOICE_PDF_FIELD_LIMITS.customerName),
  customerEmail: pdfText(INVOICE_PDF_FIELD_LIMITS.customerEmail),
  currency: pdfText(INVOICE_PDF_FIELD_LIMITS.currency),
  issueDate: pdfText(32),
  dueDate: pdfText(32),
  taxRate: z.string().refine((value) => parseTaxRateToBps(value) !== null, {
    message: "Enter a valid tax rate.",
  }),
  notes: z.string().max(INVOICE_PDF_FIELD_LIMITS.notes),
  lineItems: z
    .array(
      z.object({
        description: pdfText(INVOICE_PDF_FIELD_LIMITS.description),
        quantity: z.number().int().positive().max(100_000),
        unitPrice: z
          .string()
          .refine(
            (value) => parseMoneyToMinorUnits(value) !== null,
            "Enter a valid unit price.",
          ),
      }),
    )
    .min(1)
    .max(100),
});

export class InvoicePdfValidationError extends Error {
  readonly code = "INVALID_INVOICE_PDF_INPUT" as const;
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(error: ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join(".") || "invoice",
      message: issue.message,
    }));
    super(
      `Invalid invoice PDF input: ${issues
        .map(({ path, message }) => `${path}: ${message}`)
        .join("; ")}`,
    );
    this.name = "InvoicePdfValidationError";
    this.issues = issues;
  }
}

export function getInvoicePdfValidationError(
  input: unknown,
): InvoicePdfValidationError | null {
  const result = invoicePdfSchema.safeParse(input);
  return result.success ? null : new InvoicePdfValidationError(result.error);
}

export function sanitizeInvoiceFileName(number: string): string {
  return (
    number
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, INVOICE_PDF_FIELD_LIMITS.number) || "invoice"
  );
}

export async function generateInvoicePdf(invoice: Invoice): Promise<void> {
  const validationError = getInvoicePdfValidationError(invoice);
  if (validationError) throw validationError;

  const taxRateBps = parseTaxRateToBps(invoice.taxRate);
  if (taxRateBps === null) {
    throw new InvoicePdfValidationError(
      new z.ZodError([
        {
          code: "custom",
          path: ["taxRate"],
          message: "Enter a valid tax rate.",
        },
      ]),
    );
  }

  const totals = calculateInvoiceTotals(
    invoice.lineItems.map((item) => ({
      quantity: item.quantity,
      unitPriceMinorUnits: parseMoneyToMinorUnits(item.unitPrice) ?? 0,
    })),
    taxRateBps,
  );

  const jsPdfModule = await import("jspdf");
  const JsPDF =
    jsPdfModule.jsPDF ??
    (jsPdfModule as unknown as { default: typeof jsPdfModule.jsPDF }).default;
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text("Invoice", 40, 60);
  doc.setFontSize(12);
  doc.text(invoice.number, pageWidth - 40, 60, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(90);
  const details: Array<[string, string]> = [
    ["Bill to", invoice.customerName],
    ["Email", invoice.customerEmail],
    ["Issue date", invoice.issueDate],
    ["Due date", invoice.dueDate],
    ["Status", invoice.status],
  ];
  let y = 100;
  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 150, y);
    y += 18;
  }

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Description", 40, y);
  doc.text("Qty", 330, y, { align: "right" });
  doc.text("Unit price", 420, y, { align: "right" });
  doc.text("Amount", pageWidth - 40, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 20;

  for (const item of invoice.lineItems) {
    const unitPriceMinorUnits = parseMoneyToMinorUnits(item.unitPrice) ?? 0;
    const amount = calculateInvoiceTotals(
      [{ quantity: item.quantity, unitPriceMinorUnits }],
      0,
    ).totalMinorUnits;
    doc.text(item.description, 40, y);
    doc.text(String(item.quantity), 330, y, { align: "right" });
    doc.text(
      `${invoice.currency} ${formatMinorUnits(unitPriceMinorUnits)}`,
      420,
      y,
      { align: "right" },
    );
    doc.text(
      `${invoice.currency} ${formatMinorUnits(amount)}`,
      pageWidth - 40,
      y,
      {
        align: "right",
      },
    );
    y += 18;
  }

  y += 12;
  const totalsRows: Array<[string, string]> = [
    [
      "Subtotal",
      `${invoice.currency} ${formatMinorUnits(totals.subtotalMinorUnits)}`,
    ],
    [
      `Tax (${formatTaxRate(taxRateBps)}%)`,
      `${invoice.currency} ${formatMinorUnits(totals.taxMinorUnits)}`,
    ],
  ];
  for (const [label, value] of totalsRows) {
    doc.text(label, 400, y, { align: "right" });
    doc.text(value, pageWidth - 40, y, { align: "right" });
    y += 18;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Total", 400, y, { align: "right" });
  doc.text(
    `${invoice.currency} ${formatMinorUnits(totals.totalMinorUnits)}`,
    pageWidth - 40,
    y,
    { align: "right" },
  );

  if (invoice.notes.trim()) {
    y += 30;
    doc.setFont("helvetica", "normal");
    doc.text("Notes", 40, y);
    doc.text(invoice.notes, 40, y + 16, { maxWidth: pageWidth - 80 });
  }

  doc.save(`invoice-${sanitizeInvoiceFileName(invoice.number)}.pdf`);
}
