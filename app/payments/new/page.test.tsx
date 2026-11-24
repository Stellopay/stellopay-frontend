import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { WalletProvider } from "@/context/wallet-context";
import type { WalletCapabilities } from "@/types/wallet";
import type { AccountAssetBalance } from "@/lib/api/payments";
import NewPaymentPage, { type NewPaymentPageProps } from "./page";

const CONNECTED_SENDER =
  "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const VALID_RECIPIENT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const TEST_BALANCES: readonly AccountAssetBalance[] = [
  {
    code: "USDC",
    name: "USD Coin",
    issuer: "centre.io",
    balance: "500.00",
    minReserve: "0",
  },
  {
    code: "XLM",
    name: "Stellar Lumens",
    issuer: "native",
    balance: "10.0000000",
    minReserve: "1",
  },
];

function renderWizard(
  props: NewPaymentPageProps = {},
  walletOptions: {
    initialAddress?: string | null;
    providerCapabilities?: Partial<WalletCapabilities>;
  } = {},
) {
  const {
    initialAddress = CONNECTED_SENDER,
    providerCapabilities = {
      canSignTransaction: true,
      canSignMessage: true,
      canSwitchNetwork: true,
    },
  } = walletOptions;

  return render(
    <WalletProvider
      initialAddress={initialAddress}
      providerCapabilities={providerCapabilities}
    >
      <NewPaymentPage balances={TEST_BALANCES} {...props} />
    </WalletProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NewPaymentPage (/payments/new) — 4-step wizard", () => {
  it("completes the 4-step payment flow end-to-end and links to /transactions", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Step 1: Recipient
    expect(
      screen.getByText(/Step 1: Recipient Details/i),
    ).toBeInTheDocument();

    const recipientInput = screen.getByLabelText(/Recipient Stellar Address/i);
    fireEvent.change(recipientInput, { target: { value: VALID_RECIPIENT } });

    const memoInput = screen.getByLabelText(/Memo \(Optional\)/i);
    await user.type(memoInput, "Payroll Q4");

    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );

    // Step 2: Amount
    expect(await screen.findByText(/Step 2: Asset & Amount/i)).toBeInTheDocument();
    const amountInput = screen.getByLabelText(/Amount \(USDC\)/i);
    await user.type(amountInput, "125.50");

    expect(screen.getByTestId("fee-preview-value")).toHaveTextContent(
      "0.00001 XLM",
    );
    expect(screen.getByTestId("remaining-balance-preview")).toHaveTextContent(
      "374.5 USDC",
    );

    await user.click(screen.getByRole("button", { name: /Review Payment/i }));

    // Step 3: Review
    expect(
      await screen.findByText(/Step 3: Review & Sign Transaction/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("review-recipient")).toHaveTextContent(
      VALID_RECIPIENT,
    );
    expect(screen.getByTestId("review-amount")).toHaveTextContent("125.5 USDC");
    expect(screen.getByTestId("review-fee")).toHaveTextContent("0.00001 XLM");
    expect(screen.getByTestId("review-memo")).toHaveTextContent("Payroll Q4");

    const signButton = screen.getByRole("button", {
      name: /Sign & Send Payment/i,
    });
    expect(signButton).toBeEnabled();
    await user.click(signButton);

    // Step 4: Result
    expect(
      await screen.findByText(/Payment Sent Successfully/i),
    ).toBeInTheDocument();
    const txLink = screen.getByTestId("view-transaction-link");
    expect(txLink).toHaveAttribute("href", "/transactions");
  });

  it("links to /transactions/[id] when hasTransactionDetailRoute is true", async () => {
    const user = userEvent.setup();
    renderWizard({ hasTransactionDetailRoute: true });

    fireEvent.change(
      screen.getByLabelText(/Recipient Stellar Address/i),
      { target: { value: VALID_RECIPIENT } },
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );

    await user.type(await screen.findByLabelText(/Amount \(USDC\)/i), "50");
    await user.click(screen.getByRole("button", { name: /Review Payment/i }));

    await user.click(
      await screen.findByRole("button", { name: /Sign & Send Payment/i }),
    );

    const txLink = await screen.findByTestId("view-transaction-link");
    expect(txLink.getAttribute("href")).toMatch(/^\/transactions\/pay-/);
  });

  it("blocks invalid and self-addressed recipients inline on Step 1", async () => {
    const user = userEvent.setup();
    renderWizard();

    const recipientInput = screen.getByLabelText(/Recipient Stellar Address/i);

    // Invalid address
    await user.type(recipientInput, "GNOTAVALIDADDRESS123");
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );

    expect(
      await screen.findByText(/Enter a valid Stellar address/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Step 2: Asset & Amount/i),
    ).not.toBeInTheDocument();

    // Self-addressed payment (matches connected wallet address)
    fireEvent.change(recipientInput, { target: { value: CONNECTED_SENDER } });

    expect(
      await screen.findByText(
        /cannot send a payment to your own connected wallet address/i,
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );
    expect(
      screen.queryByText(/Step 2: Asset & Amount/i),
    ).not.toBeInTheDocument();
  });

  it("blocks over-balance and minimum-reserve-breaching amounts on Step 2", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Select a recent recipient via keyboard/click
    await user.click(
      screen.getByRole("button", { name: /Acme Design Studio/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );

    const amountInput = await screen.findByLabelText(/Amount \(USDC\)/i);

    // Over-balance USDC (balance is 500.00)
    await user.type(amountInput, "600");
    expect(
      await screen.findByText(/exceeds your available USDC balance/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Review Payment/i }));
    expect(
      screen.queryByText(/Step 3: Review & Sign Transaction/i),
    ).not.toBeInTheDocument();

    // Switch to native XLM (balance 10 XLM, min reserve 1 XLM, fee 0.00001 XLM)
    const assetSelect = screen.getByLabelText(/Asset/i);
    await user.selectOptions(assetSelect, "XLM");

    await user.clear(amountInput);
    await user.type(amountInput, "9.5");

    expect(
      await screen.findByText(/minimum network reserve/i),
    ).toBeInTheDocument();

    // Clicking "Use Max" populates the exact max spendable amount (8.99999 XLM)
    await user.click(screen.getByRole("button", { name: /Use Max/i }));
    await waitFor(() => {
      expect(amountInput).toHaveValue("8.99999");
    });

    await user.click(screen.getByRole("button", { name: /Review Payment/i }));
    expect(
      await screen.findByText(/Step 3: Review & Sign Transaction/i),
    ).toBeInTheDocument();
  });

  it("disables submit button and explains why when wallet signing is unavailable", async () => {
    const user = userEvent.setup();
    renderWizard(
      {},
      {
        initialAddress: CONNECTED_SENDER,
        providerCapabilities: {
          canSignTransaction: false,
        },
      },
    );

    await user.click(
      screen.getByRole("button", { name: /Acme Design Studio/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );

    await user.type(await screen.findByLabelText(/Amount \(USDC\)/i), "25");
    await user.click(screen.getByRole("button", { name: /Review Payment/i }));

    const notice = await screen.findByTestId("signing-unavailable-notice");
    expect(notice).toHaveTextContent(
      /This wallet does not currently support sign transactions/i,
    );

    const signButton = screen.getByRole("button", {
      name: /Sign & Send Payment/i,
    });
    expect(signButton).toBeDisabled();
  });

  it("prevents double-submission on rapid double-click via usePendingAction", async () => {
    const user = userEvent.setup();
    let resolveSubmit!: (value: any) => void;
    const submitSpy = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    renderWizard({ onSubmitPayment: submitSpy });

    await user.click(
      screen.getByRole("button", { name: /Acme Design Studio/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );
    await user.type(await screen.findByLabelText(/Amount \(USDC\)/i), "40");
    await user.click(screen.getByRole("button", { name: /Review Payment/i }));

    const signButton = await screen.findByRole("button", {
      name: /Sign & Send Payment/i,
    });

    // Rapidly fire multiple clicks before the first promise settles
    fireEvent.click(signButton);
    fireEvent.click(signButton);
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    resolveSubmit({
      id: "pay-400000",
      txHash: "TXN-USDC-400000",
      recipient: VALID_RECIPIENT,
      senderAddress: CONNECTED_SENDER,
      assetCode: "USDC",
      amount: "40",
      feeXlm: "0.00001",
      networkId: "stellar",
      createdAt: new Date().toISOString(),
      status: "Completed",
    });

    expect(
      await screen.findByText(/Payment Sent Successfully/i),
    ).toBeInTheDocument();
  });

  it("displays ErrorState when payment submission fails and allows retry", async () => {
    const user = userEvent.setup();
    const submitSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error("Horizon network timeout"))
      .mockResolvedValueOnce({
        id: "pay-150000",
        txHash: "TXN-USDC-150000",
        recipient: VALID_RECIPIENT,
        senderAddress: CONNECTED_SENDER,
        assetCode: "USDC",
        amount: "15",
        feeXlm: "0.00001",
        networkId: "stellar",
        createdAt: new Date().toISOString(),
        status: "Completed",
      });

    renderWizard({ onSubmitPayment: submitSpy });

    await user.click(
      screen.getByRole("button", { name: /Acme Design Studio/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );
    await user.type(await screen.findByLabelText(/Amount \(USDC\)/i), "15");
    await user.click(screen.getByRole("button", { name: /Review Payment/i }));

    await user.click(
      await screen.findByRole("button", { name: /Sign & Send Payment/i }),
    );

    expect(await screen.findByText("Payment Failed")).toBeInTheDocument();
    expect(screen.getByText(/Horizon network timeout/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    await user.click(retryBtn);

    expect(
      await screen.findByText(/Payment Sent Successfully/i),
    ).toBeInTheDocument();
    expect(submitSpy).toHaveBeenCalledTimes(2);
  });

  it("guards unsaved changes when navigating away while form is dirty", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWizard();

    fireEvent.change(
      screen.getByLabelText(/Recipient Stellar Address/i),
      { target: { value: VALID_RECIPIENT } },
    );

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    fireEvent.click(dashboardLink);

    expect(confirmSpy).toHaveBeenCalled();
  });

  it("passes axe accessibility checks across wizard steps", async () => {
    const user = userEvent.setup();
    const { container } = renderWizard();

    // Step 1 axe scan
    const step1Results = await axe(container);
    expect(step1Results.violations).toHaveLength(0);

    // Move to Step 2 and run axe scan
    await user.click(
      screen.getByRole("button", { name: /Acme Design Studio/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Continue to Amount/i }),
    );
    await screen.findByText(/Step 2: Asset & Amount/i);

    const step2Results = await axe(container);
    expect(step2Results.violations).toHaveLength(0);

    // Move to Step 3 and run axe scan
    await user.type(screen.getByLabelText(/Amount \(USDC\)/i), "20");
    await user.click(screen.getByRole("button", { name: /Review Payment/i }));
    await screen.findByText(/Step 3: Review & Sign Transaction/i);

    const step3Results = await axe(container);
    expect(step3Results.violations).toHaveLength(0);
  });
});
