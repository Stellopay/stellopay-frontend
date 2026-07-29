import React, { useEffect } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { toast } from "sonner";
import {
  WalletProvider,
  useWallet,
  SUPPORTED_NETWORKS,
} from "@/context/wallet-context";
import { ThemeProvider } from "@/context/theme-context";
import { Toaster } from "@/components/ui/toaster";
import NetworkSwitcher from "./network-switcher";
import type { Network } from "@/types/wallet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders `NetworkSwitcher` inside a real `WalletProvider` + `ThemeProvider`,
 * with the app's `Toaster` mounted alongside it (matching how it is wired in
 * `app/layout.tsx`) so `toast.success` / `toast.error` calls render into the
 * DOM and are assertable.
 */
function renderDefault() {
  return render(
    <ThemeProvider>
      <WalletProvider>
        <NetworkSwitcher />
      </WalletProvider>
      <Toaster />
    </ThemeProvider>,
  );
}

/**
 * Renders `NetworkSwitcher` inside a `WalletProvider` that immediately
 * switches to an unsupported network via `setNetwork` in an effect.
 */
function renderUnsupported() {
  function Harness() {
    const { setNetwork } = useWallet();
    useEffect(() => {
      setNetwork({ id: "unsupported", name: "Unsupported Chain" });
    }, [setNetwork]);
    return <NetworkSwitcher />;
  }
  return render(
    <ThemeProvider>
      <WalletProvider>
        <Harness />
      </WalletProvider>
      <Toaster />
    </ThemeProvider>,
  );
}


// ---------------------------------------------------------------------------
// Unsupported-network banner (existing tests — keep passing)
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – unsupported-network banner", () => {
  it("does not show the banner when on a supported network", () => {
    renderDefault();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the banner when the wallet is on an unsupported network", async () => {
    renderUnsupported();
    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/unsupported network detected/i);
  });

  it("includes a CTA button that names the first supported network", async () => {
    renderUnsupported();
    const cta = await screen.findByTestId("switch-to-supported");
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveTextContent(`Switch to ${SUPPORTED_NETWORKS[0].name}`);
  });

  it("switching via CTA dismisses the banner and clears the unsupported flag", async () => {
    renderUnsupported();

    const cta = await screen.findByTestId("switch-to-supported");
    fireEvent.click(cta);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("can be dismissed with the close button", async () => {
    renderUnsupported();

    const dismiss = await screen.findByRole("button", {
      name: /dismiss unsupported network warning/i,
    });
    fireEvent.click(dismiss);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("reappears on remount (dismissal is not persisted)", () => {
    const { unmount } = renderUnsupported();

    // Dismiss
    const dismiss = screen.getByRole("button", {
      name: /dismiss unsupported network warning/i,
    });
    fireEvent.click(dismiss);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Unmount
    unmount();

    // Re-mount – banner should be back
    renderUnsupported();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Controlled mode (existing tests — keep passing)
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – controlled mode (props)", () => {
  it("still shows unsupported banner when context is unsupported", async () => {
    function Harness() {
      const { setNetwork } = useWallet();
      useEffect(() => {
        setNetwork({ id: "unsupported", name: "Unsupported Chain" });
      }, [setNetwork]);
      return (
        <NetworkSwitcher
          networks={SUPPORTED_NETWORKS}
          selectedNetwork={SUPPORTED_NETWORKS[0]}
          onNetworkChange={() => {}}
        />
      );
    }
    render(
      <ThemeProvider>
        <WalletProvider>
          <Harness />
        </WalletProvider>
        <Toaster />
      </ThemeProvider>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Toast feedback – network-switch via confirmation dialog
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – toast feedback on network switch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toast.dismiss();
  });

  const TESTNET: Network = { id: "testnet", name: "Testnet" };
  const TWO_NETWORKS = [SUPPORTED_NETWORKS[0], TESTNET];

  /**
   * Harness that pre-selects Testnet as the *pending* network so the
   * confirmation dialog opens immediately, bypassing the Radix
   * DropdownMenu portal which is unreliable in jsdom.
   *
   * We pass `selectedNetwork={SUPPORTED_NETWORKS[0]}` (controlled mode) so
   * `pendingNetwork` drives the dialog. We simulate the "user clicked Testnet
   * in the dropdown" state by injecting a Harness that fires `onNetworkChange`
   * with the target right away — but the real path we want to test is:
   *   open dialog → click confirm → toast fires.
   *
   * The cleanest jsdom-safe approach is to render with a pre-pending network
   * via a Harness component that calls handleNetworkSelect via a data-testid
   * button, then clicks confirm.
   */
  function renderDialogReadyHarness(opts?: {
    onNetworkChange?: (n: Network) => void;
  }) {
    /**
     * Renders the NetworkSwitcher with two networks and a hidden button that
     * programmatically triggers the dropdown item click path by directly
     * interacting with the trigger + menu without relying on Radix portal
     * rendering. Instead, we expose the pending-network state via a custom
     * wrapper that simulates what would happen after the dropdown interaction.
     *
     * Since we cannot reliably open Radix dropdown in jsdom, we skip the
     * dropdown step and instead render the component in a state where the
     * dialog is already open by using a thin wrapper that calls
     * handleNetworkSelect via a data-testid escape hatch.
     *
     * NOTE: The component does not expose `handleNetworkSelect` externally.
     * The practical alternative is to use userEvent to open the Radix menu.
     */
    const user = userEvent.setup();
    const onNetworkChange = opts?.onNetworkChange;

    const { container } = render(
      <ThemeProvider>
        <WalletProvider>
          <NetworkSwitcher
            networks={TWO_NETWORKS}
            onNetworkChange={onNetworkChange}
          />
        </WalletProvider>
        <Toaster />
      </ThemeProvider>,
    );
    return { user, container };
  }

  it("shows a success toast after confirming a network switch", async () => {
    const { user } = renderDialogReadyHarness();

    // Open the dropdown with userEvent (pointer events)
    await user.click(screen.getByRole("button", { name: /current network/i }));

    // The dropdown items should be in the DOM now (Radix renders into body portal)
    const testnetItem = await screen.findByText("Testnet");
    await user.click(testnetItem);

    // Confirmation dialog should now be open
    await screen.findByTestId("confirm-network-switch");
    await user.click(screen.getByTestId("confirm-network-switch"));

    await waitFor(
      () =>
        expect(screen.getByText(/switched to testnet/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("announces the switch toast to assistive tech via an aria-live region", async () => {
    const { user } = renderDialogReadyHarness();

    await user.click(screen.getByRole("button", { name: /current network/i }));
    const testnetItem = await screen.findByText("Testnet");
    await user.click(testnetItem);
    await screen.findByTestId("confirm-network-switch");
    await user.click(screen.getByTestId("confirm-network-switch"));

    await waitFor(
      () =>
        expect(screen.getByText(/switched to testnet/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent?.toLowerCase()).toContain(
      "switched to testnet",
    );
  });

  it("shows an error toast when onNetworkChange throws", async () => {
    // When `onNetworkChange` throws we can't rely on setNetwork (which is on
    // the context mock), so we pass a throwing prop-level callback instead.
    // This covers the catch branch in confirmSwitch.
    const throwingChange = vi.fn().mockImplementation(() => {
      throw new Error("RPC unavailable");
    });
    const { user } = renderDialogReadyHarness({ onNetworkChange: throwingChange });

    await user.click(screen.getByRole("button", { name: /current network/i }));
    const testnetItem = await screen.findByText("Testnet");
    await user.click(testnetItem);
    await screen.findByTestId("confirm-network-switch");
    await user.click(screen.getByTestId("confirm-network-switch"));

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to switch to testnet/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("does not show a toast when the user cancels the dialog", async () => {
    const { user } = renderDialogReadyHarness();

    await user.click(screen.getByRole("button", { name: /current network/i }));
    const testnetItem = await screen.findByText("Testnet");
    await user.click(testnetItem);
    await screen.findByTestId("confirm-network-switch");

    // Cancel instead of confirming
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Give Sonner time to render a toast if it were going to
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    expect(screen.queryByText(/switched to/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed to switch/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Toast feedback – switch-to-supported CTA on the unsupported-network banner
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – toast feedback on switch-to-supported CTA", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toast.dismiss();
  });

  it("shows a success toast after clicking the switch-to-supported CTA", async () => {
    renderUnsupported();

    const cta = await screen.findByTestId("switch-to-supported");
    fireEvent.click(cta);

    await waitFor(
      () =>
        expect(
          screen.getByText(
            new RegExp(`switched to ${SUPPORTED_NETWORKS[0].name}`, "i"),
          ),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("announces the CTA toast to assistive tech via an aria-live region", async () => {
    renderUnsupported();

    const cta = await screen.findByTestId("switch-to-supported");
    fireEvent.click(cta);

    await waitFor(
      () =>
        expect(
          screen.getByText(
            new RegExp(`switched to ${SUPPORTED_NETWORKS[0].name}`, "i"),
          ),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent?.toLowerCase()).toContain(
      `switched to ${SUPPORTED_NETWORKS[0].name.toLowerCase()}`,
    );
  });

  it("shows an error toast when setNetwork throws during CTA click", async () => {
    // Strategy: get the banner visible first using renderUnsupported(), then
    // unmount and re-render with a controlled `onNetworkChange` that throws.
    // Since the banner visibility is driven by `wallet.isUnsupportedNetwork`,
    // we instead render the component directly with a prop-controlled harness
    // that forces `isUnsupportedNetwork` via the WalletProvider's setNetwork,
    // then passes a throwing `onNetworkChange` so the error path is exercised.
    //
    // The cleanest approach: render with a custom WalletProvider-harness that
    // sets the network to unsupported (so the banner appears), then have
    // `handleSwitchToSupported` throw because `onNetworkChange` throws while
    // `selectedNetwork` is undefined (so wallet.setNetwork runs first, then
    // onNetworkChange throws). We verify the error toast appears even though
    // wallet.setNetwork already succeeded — the component catches any throw in
    // the try block.
    //
    // Even simpler: render with selectedNetwork prop set (controlled mode) so
    // wallet.setNetwork is NOT called, and onNetworkChange throws. This cleanly
    // tests the error path without needing to spy on context internals.
    function UnsupportedControlledHarness() {
      const wallet = useWallet();
      useEffect(() => {
        wallet.setNetwork({ id: "unsupported", name: "Bad Chain" });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return (
        <NetworkSwitcher
          networks={SUPPORTED_NETWORKS}
          selectedNetwork={SUPPORTED_NETWORKS[0]}
          onNetworkChange={() => {
            throw new Error("Network endpoint unreachable");
          }}
        />
      );
    }

    render(
      <ThemeProvider>
        <WalletProvider>
          <UnsupportedControlledHarness />
        </WalletProvider>
        <Toaster />
      </ThemeProvider>,
    );

    const cta = await screen.findByTestId("switch-to-supported");
    fireEvent.click(cta);

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to switch network/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("does not show a toast when the close button only dismisses the banner", async () => {
    renderUnsupported();

    const dismiss = await screen.findByRole("button", {
      name: /dismiss unsupported network warning/i,
    });
    fireEvent.click(dismiss);

    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText(/switched to/i)).not.toBeInTheDocument();
  });
});
