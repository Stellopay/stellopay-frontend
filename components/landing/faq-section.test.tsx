import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FAQSection from "./faq-section";

describe("FAQSection", () => {
  it("uses Stellar-accurate wallet, asset, and fee copy", () => {
    render(<FAQSection />);

    expect(
      screen.getByText(/Freighter, Albedo, and xBull/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /What are the supported currencies/i,
      }),
    );
    expect(screen.getByText(/XLM and USDC on Stellar/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /StelloPay charges lower fees than traditional services/i,
      }),
    );
    expect(
      screen.getByText(
        /Stellar network fees are typically fractions of a cent/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/MetaMask|Trust Wallet|Coinbase Wallet/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\bETH\b/i)).not.toBeInTheDocument();
  });

  it("preserves accordion open and close behavior", () => {
    render(<FAQSection />);

    const walletQuestion = screen.getByRole("button", {
      name: /Do I need a crypto wallet/i,
    });
    const currenciesQuestion = screen.getByRole("button", {
      name: /What are the supported currencies/i,
    });

    expect(walletQuestion).toHaveAttribute("aria-expanded", "true");
    expect(currenciesQuestion).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(walletQuestion);
    expect(walletQuestion).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(currenciesQuestion);
    expect(currenciesQuestion).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/XLM and USDC on Stellar/i)).toBeInTheDocument();
  });
});
