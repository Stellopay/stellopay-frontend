import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TokenIcon from "./token-icon";

describe("TokenIcon Component", () => {
  it("renders USDC token with image", () => {
    render(<TokenIcon token="USDC" />);
    const img = screen.getByAltText("USDC");
    expect(img).toBeInTheDocument();
    // next/image optimizes the URL in JSDOM, so we check it contains the filename
    expect(img).toHaveAttribute("src");
    expect((img as HTMLImageElement).src).toContain("usdc-logo.png");
  });

  it("renders XLM token with image", () => {
    render(<TokenIcon token="XLM" />);
    const img = screen.getByAltText("XLM");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
    expect((img as HTMLImageElement).src).toContain("stellar-xlm-logo.png");
  });

  it("renders fallback badge for unknown token", () => {
    render(<TokenIcon token="ETH" />);
    const badge = screen.getByTitle("ETH");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("ET");
    expect(badge).toHaveClass("rounded-full");
  });

  it("renders fallback badge with correct initials (first 2 chars)", () => {
    render(<TokenIcon token="BTC" />);
    const badge = screen.getByTitle("BTC");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("BT");
  });

  it("renders fallback badge with uppercase initials for lowercase input", () => {
    render(<TokenIcon token="sol" />);
    const badge = screen.getByTitle("sol");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("SO");
  });

  it("renders fallback badge for empty token string", () => {
    render(<TokenIcon token="" />);
    // Empty string yields no initials — getInitials("") returns ""
    const container = screen.getByTitle("");
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent("");
  });

  it("renders fallback badge with title attribute set to full token name", () => {
    render(<TokenIcon token="YIELD" />);
    const badge = screen.getByTitle("YIELD");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("YI");
  });

  it("renders a container div with the correct class structure for known tokens", () => {
    const { container } = render(<TokenIcon token="USDC" />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("rounded-full");
    expect(outerDiv.className).toContain("overflow-hidden");
  });

  it("renders a container div with the correct class structure for fallback tokens", () => {
    const { container } = render(<TokenIcon token="SHIB" />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("rounded-full");
    expect(outerDiv.className).toContain("bg-gray-200");
  });
});
