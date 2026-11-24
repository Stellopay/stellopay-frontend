import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvoiceDraft } from "@/types/invoice";
import {
  createInvoice,
  deleteInvoice,
  getInvoicesStorageKey,
  getNextInvoiceNumber,
  INVOICES_STORAGE_VERSION,
  loadInvoices,
  saveInvoices,
  setInvoiceStatus,
  updateDraftInvoice,
  InvoiceStoreError,
  type InvoiceStoreErrorCode,
} from "./invoices-store";
import { safeStorage } from "@/utils/safeStorage";

const ACCOUNT = "stellar:GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const OTHER_ACCOUNT =
  "testnet:GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function draft(overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    currency: "USD",
    issueDate: "2026-01-01",
    dueDate: "2026-01-31",
    status: "draft",
    taxRate: "7.5",
    notes: "Thank you.",
    lineItems: [
      {
        id: "line-1",
        description: "Consulting",
        quantity: 2,
        unitPrice: "19.99",
      },
    ],
    ...overrides,
  };
}

function expectStoreError(
  code: InvoiceStoreErrorCode,
  fn: () => unknown,
): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvoiceStoreError);
    expect((error as InvoiceStoreError).code).toBe(code);
    return;
  }
  throw new Error(`Expected InvoiceStoreError with code ${code}`);
}

describe("invoice storage keys and envelope", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("scopes keys by account and keeps a default scope", () => {
    expect(getInvoicesStorageKey(ACCOUNT)).toBe(
      `stellopay.invoices.${ACCOUNT}`,
    );
    expect(getInvoicesStorageKey(OTHER_ACCOUNT)).not.toBe(
      getInvoicesStorageKey(ACCOUNT),
    );
    expect(getInvoicesStorageKey(null)).toBe("stellopay.invoices.default");
  });

  it("writes a versioned envelope that can be read back", () => {
    const invoice = createInvoice(ACCOUNT, draft());

    const raw = window.localStorage.getItem(getInvoicesStorageKey(ACCOUNT));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({
      version: INVOICES_STORAGE_VERSION,
      invoices: [invoice],
    });
    expect(loadInvoices(ACCOUNT)).toEqual([invoice]);
  });

  it("keeps accounts isolated", () => {
    const invoice = createInvoice(ACCOUNT, draft());
    expect(loadInvoices(OTHER_ACCOUNT)).toEqual([]);
    expect(loadInvoices(ACCOUNT)).toEqual([invoice]);
  });

  it("ignores corrupt, unversioned and invalid payloads", () => {
    const key = getInvoicesStorageKey(ACCOUNT);
    window.localStorage.setItem(key, "not json");
    expect(loadInvoices(ACCOUNT)).toEqual([]);

    window.localStorage.setItem(
      key,
      JSON.stringify({ version: 99, invoices: [] }),
    );
    expect(loadInvoices(ACCOUNT)).toEqual([]);

    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: INVOICES_STORAGE_VERSION,
        invoices: [{ id: 1 }],
      }),
    );
    expect(loadInvoices(ACCOUNT)).toEqual([]);
  });

  it("reports a refused write", () => {
    const spy = vi.spyOn(safeStorage, "setItem").mockReturnValue(false);
    expect(saveInvoices(ACCOUNT, [])).toBe(false);
    expectStoreError("STORAGE_WRITE_FAILED", () =>
      createInvoice(ACCOUNT, draft()),
    );
    spy.mockRestore();
  });
});

describe("invoice numbering", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts at INV-0001 and increments sequentially", () => {
    expect(getNextInvoiceNumber([])).toBe("INV-0001");

    const first = createInvoice(ACCOUNT, draft());
    expect(first.number).toBe("INV-0001");

    const second = createInvoice(ACCOUNT, draft({ customerName: "Grace" }));
    expect(second.number).toBe("INV-0002");
  });

  it("ignores malformed numbers and uses the highest suffix", () => {
    const invoices = [
      { number: "INV-0042" },
      { number: "random" },
      { number: "INV-9" },
    ] as ReturnType<typeof loadInvoices>;
    expect(getNextInvoiceNumber(invoices)).toBe("INV-0043");
  });

  it("does not reuse a number after deletion", () => {
    const first = createInvoice(ACCOUNT, draft());
    const second = createInvoice(ACCOUNT, draft());
    deleteInvoice(ACCOUNT, first.id);
    expect(createInvoice(ACCOUNT, draft()).number).not.toBe(second.number);
  });
});

describe("invoice lifecycle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rejects invalid drafts without writing", () => {
    expectStoreError("INVALID_INVOICE", () =>
      createInvoice(ACCOUNT, draft({ customerEmail: "not-an-email" })),
    );
    expect(loadInvoices(ACCOUNT)).toEqual([]);
  });

  it("edits a draft and persists the change", () => {
    const invoice = createInvoice(ACCOUNT, draft());
    const updated = updateDraftInvoice(
      ACCOUNT,
      invoice.id,
      draft({
        customerName: "Ada Byron",
        lineItems: [
          {
            id: "line-1",
            description: "Consulting",
            quantity: 1,
            unitPrice: "20.00",
          },
        ],
      }),
    );

    expect(updated.customerName).toBe("Ada Byron");
    expect(updated.number).toBe(invoice.number);
    expect(loadInvoices(ACCOUNT)[0]).toEqual(updated);
  });

  it("refuses to edit a sent or paid invoice", () => {
    const invoice = createInvoice(ACCOUNT, draft({ status: "sent" }));
    expectStoreError("INVALID_STATE", () =>
      updateDraftInvoice(ACCOUNT, invoice.id, draft()),
    );
  });

  it("marks invoices as sent and paid", () => {
    const invoice = createInvoice(ACCOUNT, draft());
    expect(setInvoiceStatus(ACCOUNT, invoice.id, "sent").status).toBe("sent");
    expect(setInvoiceStatus(ACCOUNT, invoice.id, "paid").status).toBe("paid");
    expect(loadInvoices(ACCOUNT)[0].status).toBe("paid");
  });

  it("deletes an invoice and reports unknown ids", () => {
    const invoice = createInvoice(ACCOUNT, draft());
    deleteInvoice(ACCOUNT, invoice.id);
    expect(loadInvoices(ACCOUNT)).toEqual([]);
    expectStoreError("NOT_FOUND", () => deleteInvoice(ACCOUNT, invoice.id));
    expectStoreError("NOT_FOUND", () =>
      setInvoiceStatus(ACCOUNT, "missing", "paid"),
    );
  });
});
