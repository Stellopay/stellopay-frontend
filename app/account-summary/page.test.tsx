import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

import Page from "./page";
import { WalletProvider } from "@/context/wallet-context";

// copyToClipboardWithTimeout is a side-effectful utility; stub it so tests
// don't touch the clipboard API.
vi.mock("@/utils/clipboardUtils", () => ({
  copyToClipboardWithTimeout: vi.fn(),
}));

// next/image requires a DOM environment that jsdom approximates well enough,
// but it emits warnings about the host config. Silence those for tests.
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const PUBLIC_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

function renderWithWallet(initialAddress: string | null) {
  return render(
    <WalletProvider initialAddress={initialAddress}>
      <Page />
    </WalletProvider>,
  );
}

describe("AccountSummaryPage — connected wallet", () => {
  it("shows the truncated Stellar address", () => {
    renderWithWallet(PUBLIC_ADDRESS);
    // formatAddress produces "GABC...F123" for a 56-char address
    expect(screen.getByText("GABC...F123")).toBeInTheDocument();
  });

  it("shows the copy affordance when connected", () => {
    renderWithWallet(PUBLIC_ADDRESS);
    expect(screen.getByText("Copy Address:")).toBeInTheDocument();
  });

  it("does not show the no-wallet message when connected", () => {
    renderWithWallet(PUBLIC_ADDRESS);
    expect(screen.queryByTestId("no-wallet-message")).not.toBeInTheDocument();
  });
});

describe("AccountSummaryPage — disconnected wallet", () => {
  it("shows the no-wallet message", () => {
    renderWithWallet(null);
    expect(screen.getByTestId("no-wallet-message")).toHaveTextContent(
      "No wallet connected",
    );
  });

  it("does not show the copy affordance when disconnected", () => {
    renderWithWallet(null);
    expect(screen.queryByText("Copy Address:")).not.toBeInTheDocument();
  });
});
