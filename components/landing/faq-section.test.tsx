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

  describe("keyboard navigation", () => {
    it("ArrowDown moves focus to the next header, wrapping from last to first", () => {
      render(<FAQSection />);

      const buttons = screen.getAllByRole("button", { name: /\?|wallet|currencies|questions|fees/i });
      // get all 4 accordion header buttons by their questions
      const [btn0, btn1, btn2, btn3] = [
        screen.getByRole("button", { name: /Do I need a crypto wallet/i }),
        screen.getByRole("button", { name: /What are the supported currencies/i }),
        screen.getByRole("button", { name: /Have any questions/i }),
        screen.getByRole("button", { name: /StelloPay charges lower fees/i }),
      ];

      btn0.focus();
      fireEvent.keyDown(btn0, { key: "ArrowDown" });
      expect(document.activeElement).toBe(btn1);

      fireEvent.keyDown(btn1, { key: "ArrowDown" });
      expect(document.activeElement).toBe(btn2);

      fireEvent.keyDown(btn2, { key: "ArrowDown" });
      expect(document.activeElement).toBe(btn3);

      // wrap from last to first
      fireEvent.keyDown(btn3, { key: "ArrowDown" });
      expect(document.activeElement).toBe(btn0);
    });

    it("ArrowUp moves focus to the previous header, wrapping from first to last", () => {
      render(<FAQSection />);

      const btn0 = screen.getByRole("button", { name: /Do I need a crypto wallet/i });
      const btn1 = screen.getByRole("button", { name: /What are the supported currencies/i });
      const btn3 = screen.getByRole("button", { name: /StelloPay charges lower fees/i });

      btn1.focus();
      fireEvent.keyDown(btn1, { key: "ArrowUp" });
      expect(document.activeElement).toBe(btn0);

      // wrap from first to last
      fireEvent.keyDown(btn0, { key: "ArrowUp" });
      expect(document.activeElement).toBe(btn3);
    });

    it("Home moves focus to the first header", () => {
      render(<FAQSection />);

      const btn0 = screen.getByRole("button", { name: /Do I need a crypto wallet/i });
      const btn3 = screen.getByRole("button", { name: /StelloPay charges lower fees/i });

      btn3.focus();
      fireEvent.keyDown(btn3, { key: "Home" });
      expect(document.activeElement).toBe(btn0);
    });

    it("End moves focus to the last header", () => {
      render(<FAQSection />);

      const btn0 = screen.getByRole("button", { name: /Do I need a crypto wallet/i });
      const btn3 = screen.getByRole("button", { name: /StelloPay charges lower fees/i });

      btn0.focus();
      fireEvent.keyDown(btn0, { key: "End" });
      expect(document.activeElement).toBe(btn3);
    });

    it("arrow keys do not toggle the accordion open/close state", () => {
      render(<FAQSection />);

      const btn0 = screen.getByRole("button", { name: /Do I need a crypto wallet/i });

      // first item starts open
      expect(btn0).toHaveAttribute("aria-expanded", "true");

      btn0.focus();
      fireEvent.keyDown(btn0, { key: "ArrowDown" });

      // still open — arrow key only moves focus, not toggle
      expect(btn0).toHaveAttribute("aria-expanded", "true");
    });
  });
});
