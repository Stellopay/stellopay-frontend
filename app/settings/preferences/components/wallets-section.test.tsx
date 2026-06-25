import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { WalletProvider } from "@/context/wallet-context";
import { DEMO_WALLETS } from "@/lib/demo-data";
import WalletsSection from "./wallets-section";

/** Render WalletsSection inside a real WalletProvider. */
function renderWithWallet(initialAddress: string | null = null) {
  return render(
    <WalletProvider initialAddress={initialAddress}>
      <WalletsSection />
    </WalletProvider>,
  );
}

// ---------------------------------------------------------------------------
// Disconnected state — DEMO_WALLETS fallback
// ---------------------------------------------------------------------------
describe("WalletsSection – disconnected (demo fallback)", () => {
  it("shows the Demo Data badge when no wallet is connected", () => {
    renderWithWallet(null);
    expect(screen.getByText("Demo Data")).toBeInTheDocument();
  });

  it("renders a card for each DEMO_WALLETS entry", () => {
    renderWithWallet(null);
    expect(screen.getAllByTestId("demo-wallet-card")).toHaveLength(
      DEMO_WALLETS.length,
    );
  });

  it("displays each demo wallet name", () => {
    renderWithWallet(null);
    for (const w of DEMO_WALLETS) {
      expect(screen.getByText(w.name)).toBeInTheDocument();
    }
  });

  it("does not render the live wallet card", () => {
    renderWithWallet(null);
    expect(screen.queryByTestId("live-wallet-card")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Connected state — live address from context
// ---------------------------------------------------------------------------
describe("WalletsSection – connected (live context)", () => {
  const LIVE_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

  it("hides the Demo Data badge when connected", () => {
    renderWithWallet(LIVE_ADDRESS);
    expect(screen.queryByText("Demo Data")).not.toBeInTheDocument();
  });

  it("shows the live wallet card", () => {
    renderWithWallet(LIVE_ADDRESS);
    expect(screen.getByTestId("live-wallet-card")).toBeInTheDocument();
  });

  it("does not render any demo wallet cards", () => {
    renderWithWallet(LIVE_ADDRESS);
    expect(screen.queryAllByTestId("demo-wallet-card")).toHaveLength(0);
  });

  it("renders the truncated public address — never the full key", () => {
    renderWithWallet(LIVE_ADDRESS);
    // formatAddress produces GABC...F123 for this address.
    expect(screen.getByText(/GABC\.\.\.F123/)).toBeInTheDocument();
    // The full address string must not appear verbatim.
    expect(screen.queryByText(LIVE_ADDRESS)).not.toBeInTheDocument();
  });

  it("shows the active network name (default: Stellar)", () => {
    renderWithWallet(LIVE_ADDRESS);
    expect(screen.getByText("Stellar")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disconnect flow — routes through context
// ---------------------------------------------------------------------------
describe("WalletsSection – disconnect via danger zone", () => {
  const LIVE_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

  /** Open the danger-zone dialog, type REMOVE, and click confirm. */
  async function triggerRemove() {
    fireEvent.click(
      screen.getByRole("button", { name: /remove primary wallet/i }),
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "REMOVE" },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^remove wallet$/i }),
      );
    });
  }

  it("shows the success status message after removal", async () => {
    renderWithWallet(LIVE_ADDRESS);
    await triggerRemove();
    expect(
      screen.getByText(/wallet removal request captured/i),
    ).toBeInTheDocument();
  });

  it("switches to demo cards after disconnect", async () => {
    renderWithWallet(LIVE_ADDRESS);
    expect(screen.getByTestId("live-wallet-card")).toBeInTheDocument();

    await triggerRemove();

    expect(screen.queryByTestId("live-wallet-card")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("demo-wallet-card")).toHaveLength(
      DEMO_WALLETS.length,
    );
  });
});
