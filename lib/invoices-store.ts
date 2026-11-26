import type { Invoice, InvoiceDraft } from "@/types/invoice";
import { invoiceSchema } from "@/types/invoice";
import { safeStorage } from "@/utils/safeStorage";

export const INVOICES_STORAGE_KEY_PREFIX = "stellopay.invoices";
export const INVOICES_STORAGE_VERSION = 1;

export type InvoiceStoreErrorCode =
  "INVALID_INVOICE" | "NOT_FOUND" | "INVALID_STATE" | "STORAGE_WRITE_FAILED";

export class InvoiceStoreError extends Error {
  readonly code: InvoiceStoreErrorCode;

  constructor(code: InvoiceStoreErrorCode, message: string) {
    super(message);
    this.name = "InvoiceStoreError";
    this.code = code;
  }
}

interface InvoiceEnvelope {
  version: number;
  invoices: Invoice[];
}

export function getInvoicesStorageKey(
  account: string | null | undefined,
): string {
  const scope = typeof account === "string" ? account.trim() : "";
  return scope
    ? `${INVOICES_STORAGE_KEY_PREFIX}.${scope}`
    : `${INVOICES_STORAGE_KEY_PREFIX}.default`;
}

function parseInvoices(value: unknown): Invoice[] {
  const candidate = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "invoices" in value
      ? (value as { invoices: unknown }).invoices
      : null;
  if (!Array.isArray(candidate)) return [];

  const result = invoiceSchema.array().safeParse(candidate);
  return result.success ? [...result.data] : [];
}

export function loadInvoices(account: string | null | undefined): Invoice[] {
  const raw = safeStorage.getItem(getInvoicesStorageKey(account));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parseInvoices(parsed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as InvoiceEnvelope).version !== INVOICES_STORAGE_VERSION
    ) {
      return [];
    }
    return parseInvoices(parsed);
  } catch {
    return [];
  }
}

export function saveInvoices(
  account: string | null | undefined,
  invoices: readonly Invoice[],
): boolean {
  const envelope: InvoiceEnvelope = {
    version: INVOICES_STORAGE_VERSION,
    invoices: [...invoices],
  };
  return safeStorage.setItem(
    getInvoicesStorageKey(account),
    JSON.stringify(envelope),
  );
}

export function getNextInvoiceNumber(invoices: readonly Invoice[]): string {
  let highest = 0;
  for (const invoice of invoices) {
    const match = /^INV-(\d+)$/.exec(invoice.number);
    if (match) {
      const value = Number(match[1]);
      if (Number.isSafeInteger(value) && value > highest) highest = value;
    }
  }
  return `INV-${String(highest + 1).padStart(4, "0")}`;
}

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `invoice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseOrThrow(candidate: unknown): Invoice {
  const result = invoiceSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "invoice";
    throw new InvoiceStoreError(
      "INVALID_INVOICE",
      `Invalid invoice (${path}): ${first?.message ?? "unknown error"}`,
    );
  }
  return result.data;
}

function persist(
  account: string | null | undefined,
  invoices: readonly Invoice[],
): void {
  if (!saveInvoices(account, invoices)) {
    throw new InvoiceStoreError(
      "STORAGE_WRITE_FAILED",
      "Invoice could not be saved to this browser.",
    );
  }
}

export function createInvoice(
  account: string | null | undefined,
  draft: InvoiceDraft,
  now: Date = new Date(),
): Invoice {
  const existing = loadInvoices(account);
  const timestamp = now.toISOString();
  const invoice = parseOrThrow({
    ...draft,
    id: makeId(),
    number: getNextInvoiceNumber(existing),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  persist(account, [...existing, invoice]);
  return invoice;
}

function update(
  account: string | null | undefined,
  id: string,
  change: (invoice: Invoice, now: Date) => Invoice,
  now: Date,
): Invoice {
  const invoices = loadInvoices(account);
  const index = invoices.findIndex((invoice) => invoice.id === id);
  if (index < 0) {
    throw new InvoiceStoreError("NOT_FOUND", "Invoice not found.");
  }
  const updated = parseOrThrow(change(invoices[index], now));
  const next = [...invoices];
  next[index] = updated;
  persist(account, next);
  return updated;
}

export function updateDraftInvoice(
  account: string | null | undefined,
  id: string,
  values: InvoiceDraft,
  now: Date = new Date(),
): Invoice {
  return update(
    account,
    id,
    (invoice, current) => {
      if (invoice.status !== "draft") {
        throw new InvoiceStoreError(
          "INVALID_STATE",
          "Only draft invoices can be edited.",
        );
      }
      return { ...invoice, ...values, updatedAt: current.toISOString() };
    },
    now,
  );
}

export function setInvoiceStatus(
  account: string | null | undefined,
  id: string,
  status: "sent" | "paid",
  now: Date = new Date(),
): Invoice {
  return update(
    account,
    id,
    (invoice, current) => ({
      ...invoice,
      status,
      updatedAt: current.toISOString(),
    }),
    now,
  );
}

export function deleteInvoice(
  account: string | null | undefined,
  id: string,
): void {
  const invoices = loadInvoices(account);
  const next = invoices.filter((invoice) => invoice.id !== id);
  if (next.length === invoices.length) {
    throw new InvoiceStoreError("NOT_FOUND", "Invoice not found.");
  }
  persist(account, next);
}
