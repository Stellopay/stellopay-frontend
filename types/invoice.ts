import { z } from "zod";
import { parseMoneyToMinorUnits, parseTaxRateToBps } from "@/utils/moneyUtils";

export const INVOICE_FIELD_LIMITS = {
  number: 64,
  customerName: 120,
  customerEmail: 254,
  description: 200,
  notes: 1000,
  currency: 8,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(limit: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(limit, `Use at most ${limit} characters.`);
}

function dateString(label: string) {
  return z
    .string()
    .regex(DATE_PATTERN, `${label} must be a date in YYYY-MM-DD format.`)
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      `Enter a valid ${label.toLowerCase()}.`,
    );
}

const lineItemSchema = z.object({
  id: z.string().max(64),
  description: requiredText(
    INVOICE_FIELD_LIMITS.description,
    "Item description",
  ),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than zero.")
    .max(100_000, "Quantity is too large."),
  unitPrice: z
    .string()
    .refine((value) => parseMoneyToMinorUnits(value) !== null, {
      message: "Enter a non-negative price with at most two decimals.",
    }),
});

const invoiceBaseSchema = z.object({
  id: requiredText(64, "Invoice id"),
  number: requiredText(INVOICE_FIELD_LIMITS.number, "Invoice number"),
  customerName: requiredText(
    INVOICE_FIELD_LIMITS.customerName,
    "Customer name",
  ),
  customerEmail: requiredText(
    INVOICE_FIELD_LIMITS.customerEmail,
    "Customer email",
  ).refine(
    (value) => EMAIL_PATTERN.test(value),
    "Enter a valid email address.",
  ),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a three-letter code.")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase (e.g. USD)."),
  issueDate: dateString("Issue date"),
  dueDate: dateString("Due date"),
  status: z.enum(["draft", "sent", "paid"]),
  taxRate: z.string().refine((value) => parseTaxRateToBps(value) !== null, {
    message: "Enter a tax rate between 0 and 99.99.",
  }),
  notes: z
    .string()
    .trim()
    .max(
      INVOICE_FIELD_LIMITS.notes,
      `Use at most ${INVOICE_FIELD_LIMITS.notes} characters.`,
    ),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "Add at least one line item.")
    .max(100, "An invoice can have at most 100 line items."),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const invoiceSchema = invoiceBaseSchema.refine(
  (value) => value.dueDate >= value.issueDate,
  {
    message: "Due date cannot be before the issue date.",
    path: ["dueDate"],
  },
);

export const invoiceFormSchema = invoiceBaseSchema
  .pick({
    customerName: true,
    customerEmail: true,
    currency: true,
    issueDate: true,
    dueDate: true,
    taxRate: true,
    notes: true,
    lineItems: true,
  })
  .refine((value) => value.dueDate >= value.issueDate, {
    message: "Due date cannot be before the issue date.",
    path: ["dueDate"],
  });

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = Invoice["status"];
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";
export type InvoiceLineItem = Invoice["lineItems"][number];
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceDraft = Omit<
  Invoice,
  "id" | "number" | "createdAt" | "updatedAt"
>;

export function getInvoiceStatus(
  invoice: Pick<Invoice, "status" | "dueDate">,
  now: Date = new Date(),
): InvoiceDisplayStatus {
  if (invoice.status !== "sent") return invoice.status;
  const dueAt = new Date(`${invoice.dueDate.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(dueAt.getTime())) return invoice.status;
  return dueAt.getTime() < now.getTime() ? "overdue" : "sent";
}
