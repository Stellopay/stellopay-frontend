import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WalletsSection, WalletItem } from "./wallets-section";

const mockWallets: WalletItem[] = [
  { id: "1", nickname: "Test Wallet 1", address: "GABC...1234" },
  { id: "2", nickname: "Test Wallet 2", address: "GDEF...5678" },
];

describe("WalletsSection", () => {
  it("renders the list of connected wallets", () => {
    render(<WalletsSection wallets={mockWallets} />);
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
    expect(screen.getByText("GABC...1234")).toBeInTheDocument();
    expect(screen.getByText("Test Wallet 2")).toBeInTheDocument();
  });

  it("opens confirmation dialog with nickname and address when remove button is clicked", () => {
    render(<WalletsSection wallets={mockWallets} />);
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Remove Connected Wallet")).toBeInTheDocument();
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
  });

  it("cancels wallet removal when cancel button is clicked", () => {
    render(<WalletsSection wallets={mockWallets} />);
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Test Wallet 1")).toBeInTheDocument();
  });

  it("removes wallet and calls onRemoveWallet callback when removal is confirmed", () => {
    const handleRemove = vi.fn();
    render(<WalletsSection wallets={mockWallets} onRemoveWallet={handleRemove} />);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    const confirmButton = screen.getByRole("button", { name: /^remove wallet$/i });
    fireEvent.click(confirmButton);

    expect(handleRemove).toHaveBeenCalledWith("1");
    expect(screen.queryByText("Test Wallet 1")).not.toBeInTheDocument();
  });
});
