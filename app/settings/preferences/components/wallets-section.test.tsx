import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import WalletsSection from "@/app/settings/preferences/components/wallets-section";
import {
  DEFAULT_NETWORK,
  WalletProvider,
} from "@/context/wallet-context";

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img alt={alt} src={String(src)} {...props} />
  ),
}));

function renderWithWallet(address: string | null) {
  return render(
    <WalletProvider initialAddress={address} initialNetwork={DEFAULT_NETWORK}>
      <WalletsSection />
    </WalletProvider>,
  );
}

describe("WalletsSection", () => {
  it("renders the active wallet from WalletProvider with a truncated public address", () => {
    renderWithWallet("GABCDEFGHIJKLMNOPQRSTUVWXYZF123");

    expect(screen.getByText("Live Context")).toBeInTheDocument();
    expect(screen.getByText("Connected wallet")).toBeInTheDocument();
    expect(screen.getByText("Stellar")).toBeInTheDocument();
    expect(screen.getByText(/Address: GABC\.\.\.F123/)).toBeInTheDocument();
    expect(
      screen.queryByText("GABCDEFGHIJKLMNOPQRSTUVWXYZF123"),
    ).not.toBeInTheDocument();
  });

  it("falls back to clearly labelled demo wallets when disconnected", () => {
    renderWithWallet(null);

    expect(screen.getByText("Demo Fallback")).toBeInTheDocument();
    expect(screen.getByText("Primary Treasury")).toBeInTheDocument();
    expect(
      screen.getAllByText(/demo wallet shown because no wallet is currently connected/i),
    ).toHaveLength(2);
  });

  it("disconnects the active wallet through WalletProvider", async () => {
    renderWithWallet("GABCDEFGHIJKLMNOPQRSTUVWXYZF123");

    fireEvent.click(screen.getByRole("button", { name: "Disconnect wallet" }));

    const dialog = screen.getByRole("dialog", {
      name: /disconnect the active wallet/i,
    });
    fireEvent.change(within(dialog).getByLabelText(/type "disconnect"/i), {
      target: { value: "DISCONNECT" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Disconnect wallet" }),
    );

    expect(
      await screen.findByText(/wallet disconnected/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Demo Fallback")).toBeInTheDocument();
  });
});
