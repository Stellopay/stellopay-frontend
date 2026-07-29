import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ThemeProvider } from "@/context/theme-context";
import { WalletProvider } from "@/context/wallet-context";
import { DEMO_WALLETS } from "@/lib/demo-data";
import { Toaster } from "@/components/ui/toaster";
import WalletsSection from "./wallets-section";

// ---------------------------------------------------------------------------
// Clipboard API helpers
// ---------------------------------------------------------------------------

function mockClipboardSuccess() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return writeText;
}

function mockClipboardFailure() {
  const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  // Also make the execCommand fallback fail so the error path is exercised.
  vi.spyOn(document, "execCommand").mockReturnValue(false);
  return writeText;
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

/**
 * Render WalletsSection inside a real WalletProvider, with the app's
 * Toaster mounted alongside it (as it is in `app/layout.tsx`) so
 * `toast.success`/`toast.error` calls actually render into the DOM.
 */
function renderWithWallet(initialAddress: string | null = null) {
  return render(
    <ThemeProvider>
      <WalletProvider initialAddress={initialAddress}>
        <WalletsSection />
      </WalletProvider>
      <Toaster />
    </ThemeProvider>,
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
      fireEvent.click(screen.getByRole("button", { name: /^remove wallet$/i }));
    });
  }

  it("shows a success toast after removal", async () => {
    renderWithWallet(LIVE_ADDRESS);
    await triggerRemove();
    await waitFor(() =>
      expect(
        screen.getByText(/wallet removal request captured/i),
      ).toBeInTheDocument(),
    );
  });

  it("announces the removal toast to assistive tech via an aria-live region", async () => {
    renderWithWallet(LIVE_ADDRESS);
    await triggerRemove();
    await waitFor(() =>
      expect(
        screen.getByText(/wallet removal request captured/i),
      ).toBeInTheDocument(),
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(
      liveRegion?.textContent?.toLowerCase(),
    ).toContain("wallet removal request captured");
  });

  it("lets keyboard users dismiss the removal toast via the close button", async () => {
    renderWithWallet(LIVE_ADDRESS);
    await triggerRemove();
    await waitFor(() =>
      expect(
        screen.getByText(/wallet removal request captured/i),
      ).toBeInTheDocument(),
    );

    const closeButton = screen.getByRole("button", { name: /close toast/i });
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(
        screen.queryByText(/wallet removal request captured/i),
      ).not.toBeInTheDocument(),
    );
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

// ---------------------------------------------------------------------------
// Copy-to-clipboard — demo wallet cards
// ---------------------------------------------------------------------------
describe("WalletsSection – copy button on demo wallet cards", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a copy button for every demo wallet card", () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const cards = screen.getAllByTestId("demo-wallet-card");
    for (const card of cards) {
      expect(
        within(card).getByRole("button", { name: /copy wallet address/i }),
      ).toBeInTheDocument();
    }
  });

  it("copy button has type='button' so it never submits a form", () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const cards = screen.getAllByTestId("demo-wallet-card");
    for (const card of cards) {
      const btn = within(card).getByRole("button", {
        name: /copy wallet address/i,
      });
      expect(btn).toHaveAttribute("type", "button");
    }
  });

  it("calls clipboard.writeText with the full demo address on click", async () => {
    const writeText = mockClipboardSuccess();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    const copyBtn = within(firstCard).getByRole("button", {
      name: /copy wallet address/i,
    });

    await userEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith(DEMO_WALLETS[0].address);
  });

  it("shows 'Copied' feedback after a successful copy", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    const copyBtn = within(firstCard).getByRole("button", {
      name: /copy wallet address/i,
    });

    await userEvent.click(copyBtn);

    expect(within(firstCard).getByText("Copied")).toBeInTheDocument();
  });

  it("updates aria-label to 'Address copied' after success", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    const copyBtn = within(firstCard).getByRole("button", {
      name: /copy wallet address/i,
    });

    await userEvent.click(copyBtn);

    expect(
      within(firstCard).getByRole("button", { name: /address copied/i }),
    ).toBeInTheDocument();
  });

  it("resets feedback back to idle after 2 seconds", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    await userEvent.click(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    );

    expect(within(firstCard).getByText("Copied")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(within(firstCard).queryByText("Copied")).not.toBeInTheDocument();
    expect(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Failed' feedback when the clipboard write fails", async () => {
    mockClipboardFailure();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    await userEvent.click(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    );

    await waitFor(() => {
      expect(within(firstCard).getByText("Failed")).toBeInTheDocument();
    });
  });

  it("updates aria-label to 'Copy failed' on failure", async () => {
    mockClipboardFailure();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    await userEvent.click(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    );

    await waitFor(() => {
      expect(
        within(firstCard).getByRole("button", { name: /copy failed/i }),
      ).toBeInTheDocument();
    });
  });

  it("resets failure feedback back to idle after 3 seconds", async () => {
    mockClipboardFailure();
    renderWithWallet(null);

    const firstCard = screen.getAllByTestId("demo-wallet-card")[0];
    await userEvent.click(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    );

    await waitFor(() =>
      expect(within(firstCard).getByText("Failed")).toBeInTheDocument(),
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(within(firstCard).queryByText("Failed")).not.toBeInTheDocument();
    expect(
      within(firstCard).getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("copy buttons for different demo wallets operate independently", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    const cards = screen.getAllByTestId("demo-wallet-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);

    // Click only the second card's copy button.
    await userEvent.click(
      within(cards[1]).getByRole("button", { name: /copy wallet address/i }),
    );

    // Second card shows success; first card is still idle.
    expect(within(cards[1]).getByText("Copied")).toBeInTheDocument();
    expect(within(cards[0]).queryByText("Copied")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Copy-to-clipboard — live wallet card
// ---------------------------------------------------------------------------
describe("WalletsSection – copy button on live wallet card", () => {
  const LIVE_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a copy button on the live wallet card", () => {
    mockClipboardSuccess();
    renderWithWallet(LIVE_ADDRESS);

    const liveCard = screen.getByTestId("live-wallet-card");
    expect(
      within(liveCard).getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("copies the full (non-truncated) live address to the clipboard", async () => {
    const writeText = mockClipboardSuccess();
    renderWithWallet(LIVE_ADDRESS);

    const liveCard = screen.getByTestId("live-wallet-card");
    await userEvent.click(
      within(liveCard).getByRole("button", { name: /copy wallet address/i }),
    );

    expect(writeText).toHaveBeenCalledWith(LIVE_ADDRESS);
  });

  it("shows 'Copied' feedback after a successful copy on the live card", async () => {
    mockClipboardSuccess();
    renderWithWallet(LIVE_ADDRESS);

    const liveCard = screen.getByTestId("live-wallet-card");
    await userEvent.click(
      within(liveCard).getByRole("button", { name: /copy wallet address/i }),
    );

    expect(within(liveCard).getByText("Copied")).toBeInTheDocument();
  });

  it("resets live card feedback back to idle after 2 seconds", async () => {
    mockClipboardSuccess();
    renderWithWallet(LIVE_ADDRESS);

    const liveCard = screen.getByTestId("live-wallet-card");
    await userEvent.click(
      within(liveCard).getByRole("button", { name: /copy wallet address/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(within(liveCard).queryByText("Copied")).not.toBeInTheDocument();
  });

  it("shows 'Failed' feedback when the clipboard write fails on the live card", async () => {
    mockClipboardFailure();
    renderWithWallet(LIVE_ADDRESS);

    const liveCard = screen.getByTestId("live-wallet-card");
    await userEvent.click(
      within(liveCard).getByRole("button", { name: /copy wallet address/i }),
    );

    await waitFor(() => {
      expect(within(liveCard).getByText("Failed")).toBeInTheDocument();
    });
  });

  it("full address is never rendered in the DOM (only truncated form shown)", () => {
    mockClipboardSuccess();
    renderWithWallet(LIVE_ADDRESS);

    expect(screen.queryByText(LIVE_ADDRESS)).not.toBeInTheDocument();
    // The truncated form is present.
    expect(screen.getByText(/GABC\.\.\.F123/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Copy-to-clipboard — added wallet rows
// ---------------------------------------------------------------------------
describe("WalletsSection – copy button on added wallet rows", () => {
  const VALID_ADDRESS =
    "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPGZIXUNYL67X5TVLZN7CI6S2W";

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Add a wallet via the "Add wallet" form. */
  async function addWallet(address: string) {
    const input = screen.getByPlaceholderText(/G… or M…/i);
    await userEvent.clear(input);
    await userEvent.type(input, address);
    await userEvent.click(screen.getByRole("button", { name: /add wallet/i }));
  }

  it("renders a copy button on a newly added wallet row", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    await addWallet(VALID_ADDRESS);

    const row = screen.getByTestId("added-wallet");
    expect(
      within(row).getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("copies the full address (not the truncated display) on click", async () => {
    const writeText = mockClipboardSuccess();
    renderWithWallet(null);

    await addWallet(VALID_ADDRESS);

    const row = screen.getByTestId("added-wallet");
    await userEvent.click(
      within(row).getByRole("button", { name: /copy wallet address/i }),
    );

    expect(writeText).toHaveBeenCalledWith(VALID_ADDRESS);
  });

  it("shows 'Copied' feedback after a successful copy", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    await addWallet(VALID_ADDRESS);

    const row = screen.getByTestId("added-wallet");
    await userEvent.click(
      within(row).getByRole("button", { name: /copy wallet address/i }),
    );

    expect(within(row).getByText("Copied")).toBeInTheDocument();
  });

  it("resets feedback back to idle after 2 seconds", async () => {
    mockClipboardSuccess();
    renderWithWallet(null);

    await addWallet(VALID_ADDRESS);

    const row = screen.getByTestId("added-wallet");
    await userEvent.click(
      within(row).getByRole("button", { name: /copy wallet address/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(within(row).queryByText("Copied")).not.toBeInTheDocument();
  });

  it("shows 'Failed' feedback when the clipboard write fails", async () => {
    mockClipboardFailure();
    renderWithWallet(null);

    await addWallet(VALID_ADDRESS);

    const row = screen.getByTestId("added-wallet");
    await userEvent.click(
      within(row).getByRole("button", { name: /copy wallet address/i }),
    );

    await waitFor(() => {
      expect(within(row).getByText("Failed")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Save wallet settings — Sonner toast feedback
// ---------------------------------------------------------------------------
describe("WalletsSection – save wallet settings toasts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Real timers throughout this block: sonner dispatches toast updates via
  // requestAnimationFrame, which vi.useFakeTimers() does not advance, so the
  // handleSave() 1500ms delay is awaited for real via waitFor() instead.

  it("shows a success toast when saving resolves", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    renderWithWallet(null);

    await userEvent.click(
      screen.getByRole("button", { name: /save wallet settings/i }),
    );

    await waitFor(
      () =>
        expect(
          screen.getByText(/wallet safeguards updated/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows an error toast when saving rejects", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    renderWithWallet(null);

    await userEvent.click(
      screen.getByRole("button", { name: /save wallet settings/i }),
    );

    await waitFor(
      () =>
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("re-enables the save button once saving resolves", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    renderWithWallet(null);

    const button = screen.getByRole("button", {
      name: /save wallet settings/i,
    });
    await userEvent.click(button);
    expect(button).toBeDisabled();

    await waitFor(() => expect(button).not.toBeDisabled(), {
      timeout: 3000,
    });
  });
});
