import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

const nav = vi.hoisted(() => ({
  account: "stellar:GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  push: vi.fn(),
  editId: null as string | null,
}));
const ACCOUNT = nav.account;
const toasts = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => ({
    get: (key: string) => (key === "edit" ? nav.editId : null),
  }),
}));

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: toasts.success, error: toasts.error },
}));

vi.mock("@/context/wallet-context", () => ({
  useWallet: () => ({
    address: nav.account.split(":")[1],
    network: { id: "stellar" },
  }),
}));

import NewInvoicePage from "./page";
import { createInvoice, loadInvoices } from "@/lib/invoices-store";
import type { InvoiceDraft } from "@/types/invoice";

function draft(overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    currency: "USD",
    issueDate: "2026-01-01",
    dueDate: "2026-01-31",
    status: "draft",
    taxRate: "0",
    notes: "",
    lineItems: [
      {
        id: "line-1",
        description: "Consulting",
        quantity: 2,
        unitPrice: "10.00",
      },
    ],
    ...overrides,
  };
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Customer name"), {
    target: { value: "Ada Lovelace" },
  });
  fireEvent.change(screen.getByLabelText("Customer email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Consulting services" },
  });
  fireEvent.change(screen.getByLabelText("Unit price"), {
    target: { value: "19.99" },
  });
  fireEvent.change(screen.getByLabelText("Tax rate (%)"), {
    target: { value: "7.5" },
  });
}

describe("NewInvoicePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    nav.editId = null;
    nav.push.mockClear();
    toasts.success.mockClear();
    toasts.error.mockClear();
  });

  it("computes exact live totals from decimal inputs", () => {
    render(<NewInvoicePage />);
    fillRequiredFields();

    expect(screen.getByTestId("invoice-subtotal")).toHaveTextContent("19.99");
    expect(screen.getByTestId("invoice-tax")).toHaveTextContent("1.50");
    expect(screen.getByTestId("invoice-total")).toHaveTextContent("21.49");
  });

  it("adds and removes dynamic line items", async () => {
    render(<NewInvoicePage />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add line item" }),
    );
    expect(screen.getAllByLabelText("Description")).toHaveLength(2);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove line item 2" }),
    );
    expect(screen.getAllByLabelText("Description")).toHaveLength(1);
  });

  it("saves a draft with sequential numbering", async () => {
    render(<NewInvoicePage />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/invoices"));
    const invoices = loadInvoices(ACCOUNT);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({
      number: "INV-0001",
      status: "draft",
      customerName: "Ada Lovelace",
      taxRate: "7.5",
    });
    expect(invoices[0].lineItems[0]).toMatchObject({
      description: "Consulting services",
      quantity: 1,
      unitPrice: "19.99",
    });
  });

  it("saves and sends an invoice", async () => {
    render(<NewInvoicePage />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Save & send" }));

    await waitFor(() => expect(loadInvoices(ACCOUNT)[0]?.status).toBe("sent"));
  });

  it("shows validation errors instead of saving invalid input", async () => {
    render(<NewInvoicePage />);
    fireEvent.change(screen.getByLabelText("Customer email"), {
      target: { value: "broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
    );
    expect(loadInvoices(ACCOUNT)).toEqual([]);
  });

  it("pre-fills a draft for editing and persists changes", async () => {
    const invoice = createInvoice(ACCOUNT, draft());
    nav.editId = invoice.id;

    render(<NewInvoicePage />);

    await waitFor(() =>
      expect(screen.getByLabelText("Customer name")).toHaveValue(
        "Ada Lovelace",
      ),
    );
    fireEvent.change(screen.getByLabelText("Customer name"), {
      target: { value: "Ada Byron" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() =>
      expect(loadInvoices(ACCOUNT)[0].customerName).toBe("Ada Byron"),
    );
  });

  it("refuses to edit a paid invoice", async () => {
    const invoice = createInvoice(ACCOUNT, draft({ status: "paid" }));
    nav.editId = invoice.id;

    render(<NewInvoicePage />);

    expect(
      await screen.findByText("Only draft invoices can be edited."),
    ).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<NewInvoicePage />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
