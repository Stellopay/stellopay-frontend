import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import RecipientsPage from "./page";
import { SidebarProvider } from "@/context/sidebar-context";
import { safeStorage } from "@/utils/safeStorage";
import { getRecipientsStorageKey, addRecipient } from "@/lib/recipients-store";

const ADDR_1 = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const ADDR_2 = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

function renderWithProviders(ui: React.ReactElement) {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
}

describe("RecipientsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders empty state initially", () => {
    renderWithProviders(<RecipientsPage />);
    expect(screen.getByRole("heading", { name: "Recipients" })).toBeInTheDocument();
    expect(screen.getByText("No saved recipients yet")).toBeInTheDocument();
  });

  it("handles corrupt storage without crashing", () => {
    const key = getRecipientsStorageKey(null);
    safeStorage.setItem(key, "corrupt-json{{{");

    renderWithProviders(<RecipientsPage />);
    expect(screen.getByText("No saved recipients yet")).toBeInTheDocument();
  });

  it("adds a new recipient and displays it in the table", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipientsPage />);

    // Click Add Recipient
    const addButtons = screen.getAllByRole("button", { name: /Add Recipient/i });
    await user.click(addButtons[0]);

    // Fill form
    const nameInput = screen.getByLabelText(/Name/i);
    const addressInput = screen.getByLabelText(/Stellar Address/i);
    const memoInput = screen.getByLabelText(/Memo/i);

    await user.type(nameInput, "Alice Trader");
    await user.type(addressInput, ADDR_1);
    await user.type(memoInput, "Test Memo");

    // Submit
    const submitBtn = screen.getByRole("button", { name: "Save Recipient" });
    await user.click(submitBtn);

    // Verify row appears
    await waitFor(() => {
      expect(screen.getByText("Alice Trader")).toBeInTheDocument();
      expect(screen.getByText(/Memo: Test Memo/)).toBeInTheDocument();
    });
  });

  it("validates invalid Stellar address inline", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipientsPage />);

    const addButtons = screen.getAllByRole("button", { name: /Add Recipient/i });
    await user.click(addButtons[0]);

    await user.type(screen.getByLabelText(/Name/i), "Bad Address Payee");
    await user.type(screen.getByLabelText(/Stellar Address/i), "GNOTVALID");

    await user.click(screen.getByRole("button", { name: "Save Recipient" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Enter a valid Stellar address/i),
      ).toBeInTheDocument();
    });
  });

  it("rejects duplicate Stellar addresses inline", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipientsPage />);

    // Add first
    const addButtons = screen.getAllByRole("button", { name: /Add Recipient/i });
    await user.click(addButtons[0]);
    await user.type(screen.getByLabelText(/Name/i), "First Payee");
    await user.type(screen.getByLabelText(/Stellar Address/i), ADDR_1);
    await user.click(screen.getByRole("button", { name: "Save Recipient" }));

    await waitFor(() => {
      expect(screen.getByText("First Payee")).toBeInTheDocument();
    });

    // Try to add second with duplicate address
    await user.click(screen.getByRole("button", { name: /Add Recipient/i }));
    await user.type(screen.getByLabelText(/Name/i), "Duplicate Payee");
    await user.type(screen.getByLabelText(/Stellar Address/i), ADDR_1.toLowerCase());
    await user.click(screen.getByRole("button", { name: "Save Recipient" }));

    await waitFor(() => {
      expect(
        screen.getByText(/A recipient with this Stellar address already exists/i),
      ).toBeInTheDocument();
    });
  });

  it("edits an existing recipient", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipientsPage />);

    // Add recipient
    const addButtons = screen.getAllByRole("button", { name: /Add Recipient/i });
    await user.click(addButtons[0]);
    await user.type(screen.getByLabelText(/Name/i), "Bob Original");
    await user.type(screen.getByLabelText(/Stellar Address/i), ADDR_2);
    await user.click(screen.getByRole("button", { name: "Save Recipient" }));

    await waitFor(() => {
      expect(screen.getByText("Bob Original")).toBeInTheDocument();
    });

    // Click edit
    const editBtn = screen.getByLabelText("Edit Bob Original");
    await user.click(editBtn);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Bob Modified");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Bob Modified")).toBeInTheDocument();
      expect(screen.queryByText("Bob Original")).not.toBeInTheDocument();
    });
  });

  it("deletes a recipient after typed confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipientsPage />);

    // Add recipient
    const addButtons = screen.getAllByRole("button", { name: /Add Recipient/i });
    await user.click(addButtons[0]);
    await user.type(screen.getByLabelText(/Name/i), "Charlie Deletable");
    await user.type(screen.getByLabelText(/Stellar Address/i), ADDR_1);
    await user.click(screen.getByRole("button", { name: "Save Recipient" }));

    await waitFor(() => {
      expect(screen.getByText("Charlie Deletable")).toBeInTheDocument();
    });

    // Click delete
    const deleteBtn = screen.getByLabelText("Delete Charlie Deletable");
    await user.click(deleteBtn);

    // Confirm dialog appears
    expect(screen.getByRole("heading", { name: "Delete Recipient" })).toBeInTheDocument();

    // Confirm button is disabled until typed
    const confirmDeleteBtn = screen.getByRole("button", { name: "Delete Recipient" });
    expect(confirmDeleteBtn).toBeDisabled();

    // Type matching name
    const confirmInput = screen.getByPlaceholderText("Charlie Deletable");
    await user.type(confirmInput, "Charlie Deletable");

    expect(confirmDeleteBtn).not.toBeDisabled();
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Charlie Deletable")).not.toBeInTheDocument();
    });
  });

  it("filters recipients by search query", async () => {
    const user = userEvent.setup();
    addRecipient(null, {
      name: "Alpha Payee",
      address: ADDR_1,
      tags: ["finance"],
    });
    addRecipient(null, {
      name: "Beta Supplier",
      address: ADDR_2,
      tags: ["vendor"],
    });

    renderWithProviders(<RecipientsPage />);

    expect(screen.getByText("Alpha Payee")).toBeInTheDocument();
    expect(screen.getByText("Beta Supplier")).toBeInTheDocument();

    // Search for "Beta"
    const searchInput = screen.getByRole("textbox", { name: /Search recipients/i });
    await user.type(searchInput, "Beta");

    await waitFor(() => {
      expect(screen.getByText("Beta Supplier")).toBeInTheDocument();
      expect(screen.queryByText("Alpha Payee")).not.toBeInTheDocument();
    });
  }, 15000);
});
