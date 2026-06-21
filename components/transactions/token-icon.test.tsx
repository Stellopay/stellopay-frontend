import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TokenIcon from "./token-icon";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} src={String(src)} {...props} />
  ),
}));

describe("TokenIcon", () => {
  it("keeps the USDC image branch unchanged", () => {
    render(<TokenIcon token="USDC" />);

    const icon = screen.getByAltText("USDC");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", "/usdc-logo.png");
  });

  it("keeps the XLM image branch unchanged", () => {
    render(<TokenIcon token="XLM" />);

    const icon = screen.getByAltText("XLM");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", "/stellar-xlm-logo.png");
  });

  it("renders a labeled fallback badge for an unsupported token", () => {
    render(<TokenIcon token="EURC" />);

    const fallback = screen.getByLabelText("EURC token icon");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("EUR");
    expect(fallback).toHaveClass("w-5", "h-5", "rounded-full");
  });

  it("renders a safe unknown-token fallback for an empty token", () => {
    render(<TokenIcon token="  " />);

    const fallback = screen.getByLabelText("Unknown token token icon");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("?");
  });

  it("normalizes lowercase unsupported token initials", () => {
    render(<TokenIcon token="brl" />);

    expect(screen.getByLabelText("brl token icon")).toHaveTextContent("BRL");
  });
});
