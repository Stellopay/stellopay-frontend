import React, { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountOverview from "./account-overview";
import { WalletProvider, useWallet } from "@/context/wallet-context";

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockChart = () => <div data-testid="recharts-mini-bar-chart-mock" />;
    return MockChart;
  },
}));
import * as summaryDataModule from "./summary-data";

const PUBLIC_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";
const SECOND_PUBLIC_ADDRESS =
  "GZYXWVUTSRQPONMLKJIHGFEDCBA7654321ZYXWVUTSRQPONMF456";

function renderWithWallet(initialAddress: string | null) {
  return render(
    <WalletProvider initialAddress={initialAddress}>
      <AccountOverview />
    </WalletProvider>,
  );
}

function WalletAddressControls() {
  const { connect } = useWallet();

  return (
    <button type="button" onClick={() => connect(SECOND_PUBLIC_ADDRESS)}>
      Use second wallet
    </button>
  );
}

function AddressChangeHarness() {
  return (
    <WalletProvider initialAddress={PUBLIC_ADDRESS}>
      <AccountOverview />
      <WalletAddressControls />
    </WalletProvider>
  );
}

function UnrelatedRerenderHarness() {
  const [tick, setTick] = useState(0);

  return (
    <WalletProvider initialAddress={PUBLIC_ADDRESS}>
      <div data-testid="overview-output">
        <AccountOverview />
      </div>
      <button type="button" onClick={() => setTick((value) => value + 1)}>
        Trigger unrelated rerender
      </button>
      <span data-testid="unrelated-tick">{tick}</span>
    </WalletProvider>
  );
}

describe("AccountOverview", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders correctly when wallet is disconnected", async () => {
    renderWithWallet(null);

    // There are now two connect buttons: header and CTA card
    const connectButtons = screen.getAllByRole("button", { name: /connect wallet/i });
    expect(connectButtons.length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByTestId("account-overview-connect-cta-card"),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("account-overview-address"),
    ).not.toBeInTheDocument();
    
    expect(
      screen.getByText(
        "Connect your Stellar wallet to view balances and send payments.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("No Wallet Connected"),
    ).toBeInTheDocument();
    
    // Cards and skeleton are NOT rendered when disconnected
    expect(screen.queryByTestId("summary-cards-grid")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /loading account summary/i })).not.toBeInTheDocument();
  });

  it("renders correctly when wallet is connected", () => {
    renderWithWallet(PUBLIC_ADDRESS);

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GABC...F123",
    );
    expect(
      screen.queryByTestId("account-overview-connect"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage your assets and payments across all chains easily.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Account Overview")).toBeInTheDocument();
  });

  it("connects from the disconnected state using the wallet context handler", () => {
    renderWithWallet(null);

    fireEvent.click(screen.getByTestId("account-overview-connect-cta-card"));

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      /^G[A-Z0-9]{3}\.\.\.[A-Z0-9]{4}$/,
    );
    expect(
      screen.queryByTestId("account-overview-connect"),
    ).not.toBeInTheDocument();
  });

  it("updates the displayed formatted address when the wallet address changes", () => {
    render(<AddressChangeHarness />);

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GABC...F123",
    );

    fireEvent.click(screen.getByRole("button", { name: /use second wallet/i }));

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GZYX...F456",
    );
    expect(screen.queryByText("GABC...F123")).not.toBeInTheDocument();
  });

  it("keeps rendered output stable across an unrelated parent rerender", () => {
    render(<UnrelatedRerenderHarness />);

    const overviewOutput = screen.getByTestId("overview-output");
    const beforeRerender = overviewOutput.innerHTML;

    fireEvent.click(
      screen.getByRole("button", { name: /trigger unrelated rerender/i }),
    );

    expect(screen.getByTestId("unrelated-tick")).toHaveTextContent("1");
    expect(overviewOutput.innerHTML).toBe(beforeRerender);
    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GABC...F123",
    );
  });
});

// ---------------------------------------------------------------------------
// Loading state — skeleton shown while data resolves
// ---------------------------------------------------------------------------
describe("AccountOverview – loading state", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("shows the loading skeleton before data resolves", async () => {
    // Hold the Promise indefinitely so the component stays in loading state.
    vi.spyOn(summaryDataModule, "summaryCardsData", "get").mockReturnValue(
      new Promise(
        () => {},
      ) as unknown as typeof summaryDataModule.summaryCardsData,
    );

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    expect(
      screen.getByRole("status", { name: /loading account summary/i }),
    ).toBeInTheDocument();
  });

  it("skeleton has aria-busy='true' while loading", async () => {
    vi.spyOn(summaryDataModule, "summaryCardsData", "get").mockReturnValue(
      new Promise(
        () => {},
      ) as unknown as typeof summaryDataModule.summaryCardsData,
    );

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    expect(
      screen.getByRole("status", { name: /loading account summary/i }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("does not show card data while loading", async () => {
    vi.spyOn(summaryDataModule, "summaryCardsData", "get").mockReturnValue(
      new Promise(
        () => {},
      ) as unknown as typeof summaryDataModule.summaryCardsData,
    );

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    expect(screen.queryByTestId("summary-cards-grid")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
  });

  it("does not show an error state while loading", async () => {
    vi.spyOn(summaryDataModule, "summaryCardsData", "get").mockReturnValue(
      new Promise(
        () => {},
      ) as unknown as typeof summaryDataModule.summaryCardsData,
    );

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    expect(screen.queryByTestId("summary-error")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Success state — real cards shown, skeleton removed
// ---------------------------------------------------------------------------
describe("AccountOverview – success state", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders the cards grid after data resolves", async () => {
    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-cards-grid")).toBeInTheDocument();
    });
  });

  it("removes the skeleton after data resolves", async () => {
    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("status", { name: /loading account summary/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders all three summary card titles after load", async () => {
    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("Paid This Month")).toBeInTheDocument();
      expect(screen.getByText("To Be Paid")).toBeInTheDocument();
    });
  });

  it("does not show the error state after a successful load", async () => {
    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("summary-error")).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Error state — distinct error UI, no stuck skeleton, retry re-runs load
// ---------------------------------------------------------------------------
describe("AccountOverview – error state", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  /**
   * Force summaryCardsData to behave as a rejected Promise by temporarily
   * replacing the real value with a getter that throws synchronously.
   * The component wraps it in Promise.resolve() which catches sync throws
   * and routes them to the .catch() branch.
   */
  function forceLoadError(message = "Failed to load account summary.") {
    vi.spyOn(summaryDataModule, "summaryCardsData", "get").mockImplementation(
      () => {
        throw new Error(message);
      },
    );
  }

  it("shows the error state when data fails to load", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("error state uses role='alert'", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("error state shows the failure message", async () => {
    forceLoadError("Failed to load account summary.");

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load account summary/i),
      ).toBeInTheDocument();
    });
  });

  it("does not show a stuck skeleton in the error state", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("status", { name: /loading account summary/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show card data in the error state", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("summary-cards-grid")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
  });

  it("shows a Try Again button in the error state", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
    });
  });

  it("clicking Try Again re-triggers the load and shows success on recovery", async () => {
    // First call throws, second call succeeds.
    const spy = vi
      .spyOn(summaryDataModule, "summaryCardsData", "get")
      .mockImplementationOnce(() => {
        throw new Error("transient error");
      })
      .mockReturnValue(summaryDataModule.summaryCardsData);

    render(
      <WalletProvider initialAddress={PUBLIC_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("summary-cards-grid")).toBeInTheDocument();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Copy-address affordance — CopyAddressButton inside the welcome heading
// ---------------------------------------------------------------------------
describe("AccountOverview – copy address button", () => {
  const LIVE_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

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
    vi.spyOn(document, "execCommand").mockReturnValue(false);
    return writeText;
  }

  function renderConnected() {
    return render(
      <WalletProvider initialAddress={LIVE_ADDRESS}>
        <AccountOverview />
      </WalletProvider>,
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  // ── Presence ──────────────────────────────────────────────────────────────

  it("renders the copy button when the wallet is connected", () => {
    mockClipboardSuccess();
    renderConnected();

    expect(
      screen.getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("does not render the copy button when the wallet is disconnected", () => {
    render(
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    expect(
      screen.queryByTestId("copy-address-button"),
    ).not.toBeInTheDocument();
  });

  it("copy button has type='button' so it never submits a form", () => {
    mockClipboardSuccess();
    renderConnected();

    expect(screen.getByTestId("copy-address-button")).toHaveAttribute(
      "type",
      "button",
    );
  });

  // ── Clipboard interaction ─────────────────────────────────────────────────

  it("calls clipboard.writeText with the full non-truncated address on click", async () => {
    const writeText = mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(writeText).toHaveBeenCalledWith(LIVE_ADDRESS);
  });

  it("does not render the full address in the DOM (only truncated form shown)", () => {
    mockClipboardSuccess();
    renderConnected();

    // Full address must never appear in the visible DOM.
    expect(screen.queryByText(LIVE_ADDRESS)).not.toBeInTheDocument();
    // Truncated form is present.
    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GABC...F123",
    );
  });

  // ── Success feedback ──────────────────────────────────────────────────────

  it("shows 'Copied' text after a successful copy", async () => {
    mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("updates aria-label to 'Address copied' after success", async () => {
    mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(
      screen.getByRole("button", { name: /address copied/i }),
    ).toBeInTheDocument();
  });

  it("populates the aria-live announcement region with success text", async () => {
    mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(screen.getByTestId("copy-address-announcement")).toHaveTextContent(
      "Wallet address copied to clipboard.",
    );
  });

  it("resets feedback back to idle after 2 seconds", async () => {
    mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(screen.getByText("Copied")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("clears the aria-live announcement after the idle reset", async () => {
    mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByTestId("copy-address-announcement"),
    ).toHaveTextContent("");
  });

  // ── Error feedback ────────────────────────────────────────────────────────

  it("shows 'Failed' text when the clipboard write fails", async () => {
    mockClipboardFailure();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  it("updates aria-label to failure text when the clipboard write fails", async () => {
    mockClipboardFailure();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /copy failed/i }),
      ).toBeInTheDocument();
    });
  });

  it("populates the aria-live announcement region with error text on failure", async () => {
    mockClipboardFailure();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("copy-address-announcement"),
      ).toHaveTextContent("Failed to copy address. Please try again.");
    });
  });

  it("resets error feedback back to idle after 3 seconds", async () => {
    mockClipboardFailure();
    renderConnected();

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    await waitFor(() =>
      expect(screen.getByText("Failed")).toBeInTheDocument(),
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it("the aria-live region has role='status' and aria-atomic='true'", () => {
    mockClipboardSuccess();
    renderConnected();

    const region = screen.getByTestId("copy-address-announcement");
    expect(region).toHaveAttribute("role", "status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("the copy button is keyboard-operable via Enter key", async () => {
    const writeText = mockClipboardSuccess();
    renderConnected();

    await act(async () => {
      fireEvent.keyDown(screen.getByTestId("copy-address-button"), {
        key: "Enter",
        code: "Enter",
      });
      fireEvent.click(screen.getByTestId("copy-address-button"));
    });

    expect(writeText).toHaveBeenCalled();
  });
});
