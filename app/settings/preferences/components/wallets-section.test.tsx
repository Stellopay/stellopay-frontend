import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WalletsSection, WalletItem } from "./wallets-section";

const mockWallets: WalletItem[] = [
  { id: "1", nickname: "Test Wallet 1", address: "GABC...1234" },
  { id: "2", nickname: "Test Wallet 2", address: "GDEF...5678" },
];

describe("WalletsSection", () => {
  // ── existing behaviour ────────────────────────────────────────────

  it("renders the list of connected wallets", () => {
    render(<WalletsSection wallets={mockWallets} />);
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
    expect(screen.getByText("GABC...1234")).toBeInTheDocument();
    expect(screen.getByText("Test Wallet 2")).toBeInTheDocument();
  });

  it("renders empty state when wallet list is empty", () => {
    render(<WalletsSection wallets={[]} />);
    expect(screen.getByText(/no connected wallets found/i)).toBeInTheDocument();
  });

  it("opens confirmation dialog when remove button is clicked", () => {
    render(<WalletsSection wallets={mockWallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Remove Connected Wallet")).toBeInTheDocument();
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
  });

  it("cancels wallet removal when cancel button is clicked", () => {
    render(<WalletsSection wallets={mockWallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
  });

  it("removes wallet and calls onRemoveWallet when confirmed", () => {
    const handleRemove = vi.fn();
    render(<WalletsSection wallets={mockWallets} onRemoveWallet={handleRemove} />);

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /^remove wallet$/i }));

    expect(handleRemove).toHaveBeenCalledWith("1");
    expect(screen.queryByText("Test Wallet 1")).not.toBeInTheDocument();
  });

  // ── nickname editing ──────────────────────────────────────────────

  it("renders an edit-nickname button for each wallet", () => {
    render(<WalletsSection wallets={mockWallets} />);
    expect(
      screen.getAllByRole("button", { name: /edit nickname/i }),
    ).toHaveLength(2);
  });

  it("enters edit mode with the current nickname pre-filled", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );

    const input = screen.getByRole("textbox", { name: /nickname for wallet gabc/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Test Wallet 1");
  });

  it("saves the new nickname when Save button is clicked", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.type(input, "My Main Wallet");
    await user.click(screen.getByRole("button", { name: /save nickname/i }));

    expect(screen.getByText("My Main Wallet")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("saves the nickname when Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.type(input, "Savings{Enter}");

    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("discards changes when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.type(input, "Discarded Name");
    await user.click(screen.getByRole("button", { name: /cancel editing/i }));

    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
    expect(screen.queryByText("Discarded Name")).not.toBeInTheDocument();
  });

  it("discards changes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.type(input, "Discarded{Escape}");

    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("falls back to truncated address when nickname is saved empty", async () => {
    const user = userEvent.setup();
    // Address long enough that truncateStellarAddress produces "GABCDE...234567"
    const wallets: WalletItem[] = [
      { id: "1", nickname: "My Wallet", address: "GABCDE1234567890ABCDE1234567890AB" },
    ];
    render(<WalletsSection wallets={wallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for my wallet/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: /save nickname/i }));

    expect(screen.queryByText("My Wallet")).not.toBeInTheDocument();
    // The display should now show the truncated address, not an empty string
    const nameCell = screen.getByRole("button", { name: /edit nickname for/i });
    expect(nameCell).toHaveTextContent(/GABCDE/);
  });

  it("calls onUpdateNickname callback with the new value", async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    render(<WalletsSection wallets={mockWallets} onUpdateNickname={handleUpdate} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );
    const input = screen.getByRole("textbox", { name: /nickname for wallet/i });
    await user.clear(input);
    await user.type(input, "New Name{Enter}");

    expect(handleUpdate).toHaveBeenCalledWith("1", "New Name");
  });

  it("enforces the 40-character max length", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );

    expect(
      screen.getByRole("textbox", { name: /nickname for wallet/i }),
    ).toHaveAttribute("maxlength", "40");
  });

  it("only one wallet is in edit mode at a time", async () => {
    const user = userEvent.setup();
    render(<WalletsSection wallets={mockWallets} />);

    await user.click(
      screen.getByRole("button", { name: /edit nickname for test wallet 1/i }),
    );

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });
});
