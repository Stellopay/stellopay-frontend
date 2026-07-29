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

    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("account-overview-address"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your Stellar wallet to view balances and send payments.",
      ),
    ).toBeInTheDocument();

    // Cards load asynchronously — wait for the skeleton to be replaced.
    await waitFor(() => {
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("Paid This Month")).toBeInTheDocument();
      expect(screen.getByText("To Be Paid")).toBeInTheDocument();
    });
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

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));

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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-cards-grid")).toBeInTheDocument();
    });
  });

  it("removes the skeleton after data resolves", async () => {
    render(
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-error")).toBeInTheDocument();
    });
  });

  it("error state uses role='alert'", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
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
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-error")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("status", { name: /loading account summary/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show card data in the error state", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-error")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("summary-cards-grid")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
  });

  it("shows a Retry button in the error state", async () => {
    forceLoadError();

    render(
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument();
    });
  });

  it("clicking Retry re-triggers the load and shows success on recovery", async () => {
    // First call throws, second call succeeds.
    const spy = vi
      .spyOn(summaryDataModule, "summaryCardsData", "get")
      .mockImplementationOnce(() => {
        throw new Error("transient error");
      })
      .mockReturnValue(summaryDataModule.summaryCardsData);

    render(
      <WalletProvider initialAddress={null}>
        <AccountOverview />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("summary-error")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("summary-cards-grid")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("summary-error")).not.toBeInTheDocument();
  });
});
