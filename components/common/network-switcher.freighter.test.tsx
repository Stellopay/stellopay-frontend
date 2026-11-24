/**
 * components/common/network-switcher.freighter.test.tsx
 *
 * Tests for the Freighter-specific banners in NetworkSwitcher:
 * - not-installed (freighterStatus === 'not_installed')
 * - rejected (freighterStatus === 'rejected')
 *
 * The @/lib/stellar/freighter adapter is mocked at the top level so tests can
 * control what connectFreighter() resolves to per describe block.
 */

import React, { useEffect } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  WalletProvider,
  useWallet,
} from "@/context/wallet-context";
import { ThemeProvider } from "@/context/theme-context";
import { Toaster } from "@/components/ui/toaster";
import NetworkSwitcher from "./network-switcher";
import {
  FreighterNotInstalledError,
  FreighterUserRejectedError,
} from "@/lib/stellar/freighter";

// ---------------------------------------------------------------------------
// Top-level mock — required by Vitest's hoisting rules.
// ---------------------------------------------------------------------------
vi.mock("@/lib/stellar/freighter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/freighter")>();
  return {
    ...actual,
    isFreighterInstalled: vi.fn().mockResolvedValue(false),
    requestFreighterAccess: vi.fn().mockRejectedValue(new actual.FreighterNotInstalledError()),
    watchFreighterChanges: vi.fn().mockReturnValue(() => {}),
  };
});

import {
  isFreighterInstalled,
  requestFreighterAccess,
  watchFreighterChanges,
} from "@/lib/stellar/freighter";

const mockIsFreighterInstalled = isFreighterInstalled as ReturnType<typeof vi.fn>;
const mockRequestFreighterAccess = requestFreighterAccess as ReturnType<typeof vi.fn>;
const mockWatchFreighterChanges = watchFreighterChanges as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders NetworkSwitcher inside a WalletProvider that immediately calls
 * connectFreighter() in a mount effect. The mock controls what happens.
 */
function renderWithFreighterConnect() {
  function Harness() {
    const { connectFreighter } = useWallet();
    useEffect(() => {
      connectFreighter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
// Freighter not-installed banner
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – Freighter not-installed banner", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(false);
    mockRequestFreighterAccess.mockRejectedValue(new FreighterNotInstalledError());
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the banner when freighterStatus is not_installed", async () => {
    renderWithFreighterConnect();
    const banner = await screen.findByTestId("freighter-not-installed-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/freighter wallet is not installed/i);
  });

  it("includes an install link pointing to freighter.app", async () => {
    renderWithFreighterConnect();
    const link = await screen.findByTestId("freighter-install-link");
    expect(link).toHaveAttribute("href", "https://freighter.app");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("can be dismissed with the close button without throwing", async () => {
    renderWithFreighterConnect();
    await screen.findByTestId("freighter-not-installed-banner");

    const dismissBtn = screen.getByRole("button", {
      name: /dismiss freighter not installed/i,
    });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(
        screen.queryByTestId("freighter-not-installed-banner"),
      ).not.toBeInTheDocument();
    });
  });

  it("does not show the unsupported-network banner (amber) alongside the not-installed banner", async () => {
    renderWithFreighterConnect();
    await screen.findByTestId("freighter-not-installed-banner");
    // The unsupported-network banner has data-testid="switch-to-supported" on its CTA.
    // It should not appear when only the Freighter not-installed state is active.
    expect(screen.queryByTestId("switch-to-supported")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Freighter rejected banner
// ---------------------------------------------------------------------------

describe("NetworkSwitcher – Freighter rejected banner", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockRejectedValue(new FreighterUserRejectedError());
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the rejected banner when freighterStatus is rejected", async () => {
    renderWithFreighterConnect();
    const banner = await screen.findByTestId("freighter-rejected-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/connection cancelled/i);
  });

  it("can be dismissed with the close button", async () => {
    renderWithFreighterConnect();
    await screen.findByTestId("freighter-rejected-banner");

    const dismissBtn = screen.getByRole("button", {
      name: /dismiss connection cancelled/i,
    });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(
        screen.queryByTestId("freighter-rejected-banner"),
      ).not.toBeInTheDocument();
    });
  });

  it("does not throw when the user cancels the connection", async () => {
    await expect(
      act(async () => {
        renderWithFreighterConnect();
        await new Promise((r) => setTimeout(r, 50));
      }),
    ).resolves.not.toThrow();
  });
});
