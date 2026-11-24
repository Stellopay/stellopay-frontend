import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ApprovalThresholdsSection from "./approval-thresholds-section";

describe("approval threshold settings", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("validates and persists per-asset integer minor-unit thresholds", async () => {
    render(<ApprovalThresholdsSection />);
    const assetInput = await screen.findByPlaceholderText("USDC");
    const amountInput = screen.getByPlaceholderText("10000");
    fireEvent.change(assetInput, { target: { value: "usdc" } });
    fireEvent.change(amountInput, { target: { value: "12500.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save threshold" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /positive whole number/i,
    );
    expect(localStorage.getItem("stellopay.approval-thresholds")).toBeNull();

    fireEvent.change(amountInput, { target: { value: "12500" } });
    fireEvent.click(screen.getByRole("button", { name: "Save threshold" }));
    expect(await screen.findByText("12,500 minor units")).toBeInTheDocument();
    expect(localStorage.getItem("stellopay.approval-thresholds")).toBe(
      JSON.stringify({ USDC: 12500 }),
    );
  });

  it("removes a configured threshold", async () => {
    localStorage.setItem(
      "stellopay.approval-thresholds",
      JSON.stringify({ USDC: 12500 }),
    );
    render(<ApprovalThresholdsSection />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Remove USDC threshold" }),
    );
    expect(localStorage.getItem("stellopay.approval-thresholds")).toBe("{}");
  });
});
