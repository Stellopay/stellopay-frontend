import React, { useEffect } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  WalletProvider,
  useWallet,
  SUPPORTED_NETWORKS,
} from "@/context/wallet-context";
import NetworkSwitcher from "./network-switcher";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders `NetworkSwitcher` inside a default `WalletProvider`. */
function renderDefault() {
  return render(
    <WalletProvider>
      <NetworkSwitcher />
    </WalletProvider>,
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
    <WalletProvider>
      <Harness />
    </WalletProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
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
      <WalletProvider>
        <Harness />
      </WalletProvider>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
