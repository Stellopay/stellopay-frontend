import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
const shared = vi.hoisted(() => ({
  account: "stellar:GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  success: vi.fn(),
  error: vi.fn(),
  downloadPdf: vi.fn(),
}));
const ACCOUNT = shared.account;

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    title?: string;
  }) => (
    <a
      href={props.href}
      className={props.className}
      aria-label={props["aria-label"]}
      title={props.title}
    >
      {props.children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: shared.success, error: shared.error },
}));

vi.mock("@/context/wallet-context", () => ({
  useWallet: () => ({
    address: shared.account.split(":")[1],
    network: { id: "stellar" },
  }),
}));

vi.mock("@/components/invoices/invoice-pdf", () => ({
  generateInvoicePdf: shared.downloadPdf,
}));

import InvoicesPage from "./page";
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
      { id: "line-1", description: "Work", quantity: 2, unitPrice: "10.00" },
    ],
    ...overrides,
  };
}

describe("InvoicesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    shared.success.mockClear();
    shared.error.mockClear();
    shared.downloadPdf.mockReset();
  });

  it("renders an empty state and a link to the new invoice form", () => {
    render(<InvoicesPage />);
    expect(screen.getByText("No invoices found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New invoice" })).toHaveAttribute(
      "href",
      "/invoices/new",
    );
  });

  it("lists invoices with derived overdue status and exact totals", () => {
    createInvoice(ACCOUNT, draft({ customerName: "Grace Hopper" }));
    const sent = createInvoice(
      ACCOUNT,
      draft({ status: "sent", customerName: "Alan Turing" }),
    );
    window.localStorage.setItem(
      "stellopay.invoices." + ACCOUNT,
      JSON.stringify({
        version: 1,
        invoices: loadInvoices(ACCOUNT).map((item) =>
          item.id === sent.id
            ? {
                ...item,
                issueDate: "2019-12-01",
                dueDate: "2020-01-01",
                status: "sent",
              }
            : item,
        ),
      }),
    );

    render(<InvoicesPage />);

    expect(screen.getByText("INV-0001")).toBeInTheDocument();
    expect(screen.getByText("INV-0002")).toBeInTheDocument();
    expect(screen.getAllByText("overdue").length).toBeGreaterThan(0);
    expect(screen.getAllByText("USD 20.00")).toHaveLength(2);
  });

  it("filters by status and searches by customer", async () => {
    createInvoice(ACCOUNT, draft({ customerName: "Grace Hopper" }));
    createInvoice(
      ACCOUNT,
      draft({ customerName: "Alan Turing", status: "paid" }),
    );

    render(<InvoicesPage />);

    await userEvent.click(screen.getByRole("button", { name: /^paid \(1\)$/ }));
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Edit draft invoice INV-0002" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^all \(2\)$/ }));
    fireEvent.change(screen.getByLabelText("Search invoices"), {
      target: { value: "grace" },
    });
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.queryByText("Alan Turing")).not.toBeInTheDocument();
  });

  it("downloads a PDF and marks invoices as paid and deletes them", async () => {
    const invoice = createInvoice(ACCOUNT, draft());
    shared.downloadPdf.mockResolvedValue(undefined);

    render(<InvoicesPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download PDF for invoice INV-0001" }),
    );
    await waitFor(() =>
      expect(shared.downloadPdf).toHaveBeenCalledWith(invoice),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Mark invoice INV-0001 as paid" }),
    );
    expect(loadInvoices(ACCOUNT)[0].status).toBe("paid");

    await userEvent.click(
      screen.getByRole("button", { name: "Delete invoice INV-0001" }),
    );
    expect(loadInvoices(ACCOUNT)).toEqual([]);
  });

  it("has no detectable accessibility violations", async () => {
    createInvoice(ACCOUNT, draft());
    const { container } = render(<InvoicesPage />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
