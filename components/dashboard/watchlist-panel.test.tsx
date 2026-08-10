import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { WatchlistPanel } from "./watchlist-panel";
import { WalletProvider } from "@/context/wallet-context";

const TEST_ADDRESS = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const STORAGE_KEY = `stellopay.watchlist.${TEST_ADDRESS}`;

function renderWithWallet(ui: React.ReactElement) {
  return render(
    <WalletProvider initialAddress={TEST_ADDRESS}>{ui}</WalletProvider>,
  );
}

// Utility to open the add form and type into it
function openAddForm() {
  fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));
  return {
    input: screen.getByRole("textbox", {
      name: /address or asset code/i,
    }),
    submit: screen.getByRole("button", { name: /pin/i }),
    counterpartyRadio: screen.getByRole("radio", { name: /counterparty/i }),
    assetRadio: screen.getByRole("radio", { name: /asset/i }),
  };
}

describe("WatchlistPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the watchlist heading", () => {
    renderWithWallet(<WatchlistPanel />);
    expect(
      screen.getByRole("heading", { name: /watchlist/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when no items are pinned", () => {
    renderWithWallet(<WatchlistPanel />);
    expect(screen.getByText(/no pinned items/i)).toBeInTheDocument();
  });

  it("shows the add form when the Add button is clicked", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input } = openAddForm();

    expect(input).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pin/i }),
    ).toBeInTheDocument();
  });

  it("adds a counterparty to the watchlist", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    // Use a short label that won't be reformatted
    fireEvent.change(input, { target: { value: "My Counterparty" } });
    fireEvent.click(submit);

    expect(screen.getByText("My Counterparty")).toBeInTheDocument();
    // The item is rendered inside a list item
    expect(
      screen.getByText("My Counterparty").closest("li"),
    ).toBeInTheDocument();
  });

  it("adds a counterparty with a long G-address", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    // Long G-address gets formatted to short form (GABC...XYZ)
    const longAddress = "GABCXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd";
    fireEvent.change(input, { target: { value: longAddress } });
    fireEvent.click(submit);

    // Should display the formatted short form
    expect(screen.getByText("GABC...abcd")).toBeInTheDocument();
  });

  it("adds an asset to the watchlist", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit, assetRadio } = openAddForm();

    // Switch to asset type
    fireEvent.click(assetRadio);

    fireEvent.change(input, { target: { value: "USDC" } });
    fireEvent.click(submit);

    expect(screen.getByText("USDC")).toBeInTheDocument();
    // The badge text "Asset" appears alongside the list item
    expect(screen.getByText("USDC").closest("li")).toBeInTheDocument();
  });

  it("prevents duplicate items", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    fireEvent.change(input, { target: { value: "USDC" } });
    fireEvent.click(submit);

    // Try adding the same item again
    const { input: input2, submit: submit2 } = openAddForm();
    fireEvent.change(input2, { target: { value: "USDC" } });
    fireEvent.click(submit2);

    // Should still only have one USDC item
    const items = screen.getAllByText("USDC");
    expect(items.length).toBe(1);
  });

  it("removes an item from the watchlist", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    // Add an item
    fireEvent.change(input, { target: { value: "XLM" } });
    fireEvent.click(submit);

    // Remove it
    const removeButton = screen.getByRole("button", {
      name: /remove xlm from watchlist/i,
    });
    fireEvent.click(removeButton);

    // Should go back to empty state
    expect(screen.getByText(/no pinned items/i)).toBeInTheDocument();
  });

  it("persists items to localStorage", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    fireEvent.change(input, { target: { value: "USDC" } });
    fireEvent.click(submit);

    // Check localStorage
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("USDC");
    expect(stored[0].type).toBe("counterparty");
  });

  it("loads persisted items from localStorage on mount", () => {
    // Pre-populate localStorage with items that have short display labels.
    // Note: a long G-address label would be reformatted to GABC...XYZ, so
    // use a plain counterparty name to assert exact text.
    const items = [
      {
        id: "GABC12345XYZ",
        type: "counterparty" as const,
        label: "Alice",
        pinnedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "USDC",
        type: "asset" as const,
        label: "USDC",
        pinnedAt: "2026-01-02T00:00:00.000Z",
      },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    renderWithWallet(<WatchlistPanel />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("disables the Pin button when the input is empty", () => {
    renderWithWallet(<WatchlistPanel />);
    const { input, submit } = openAddForm();

    expect(submit).toBeDisabled();

    // Type something -> enabled
    fireEvent.change(input, { target: { value: "USDC" } });
    expect(submit).toBeEnabled();
  });

  it("uses addressOverride when provided", () => {
    const overrideKey = "stellopay.watchlist.override-test-address";
    const items = [
      {
        id: "XLM",
        type: "asset" as const,
        label: "XLM",
        pinnedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    window.localStorage.setItem(overrideKey, JSON.stringify(items));

    render(
      <WalletProvider initialAddress={TEST_ADDRESS}>
        <WatchlistPanel addressOverride="override-test-address" />
      </WalletProvider>,
    );
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });
});