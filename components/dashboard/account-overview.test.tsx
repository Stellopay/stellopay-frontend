import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import AccountOverview from "./account-overview";
import { WalletProvider, useWallet } from "@/context/wallet-context";

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

  it("renders correctly when wallet is disconnected", () => {
    renderWithWallet(null);

    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("account-overview-address")).not.toBeInTheDocument();
    expect(
      screen.getByText("Connect your Stellar wallet to view balances and send payments."),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Paid This Month")).toBeInTheDocument();
    expect(screen.getByText("To Be Paid")).toBeInTheDocument();
  });

  it("renders correctly when wallet is connected", () => {
    renderWithWallet(PUBLIC_ADDRESS);

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      "GABC...F123",
    );
    expect(screen.queryByTestId("account-overview-connect")).not.toBeInTheDocument();
    expect(
      screen.getByText("Manage your assets and payments across all chains easily."),
    ).toBeInTheDocument();
    expect(screen.getByText("Account Overview")).toBeInTheDocument();
  });

  it("connects from the disconnected state using the wallet context handler", () => {
    renderWithWallet(null);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));

    expect(screen.getByTestId("account-overview-address")).toHaveTextContent(
      /^G[A-Z0-9]{3}\.\.\.[A-Z0-9]{4}$/,
    );
    expect(screen.queryByTestId("account-overview-connect")).not.toBeInTheDocument();
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
