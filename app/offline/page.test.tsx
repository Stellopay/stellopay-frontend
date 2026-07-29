import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [k: string]: unknown;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        { ...props },
      );
    }
    return <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
  },
}));

import OfflinePage from "@/app/offline/page";

describe("OfflinePage", () => {
  it("renders the branded offline heading", () => {
    render(<OfflinePage />);
    // The heading uses &rsquo; which renders as the curly apostrophe '\u2019'.
    expect(
      screen.getByRole("heading", { level: 1, name: /you.re offline/i }),
    ).toBeInTheDocument();
  });

  it("renders the StelloPay brand label", () => {
    render(<OfflinePage />);
    expect(screen.getByText("StelloPay")).toBeInTheDocument();
  });

  it("explains the connectivity issue to the user", () => {
    render(<OfflinePage />);
    expect(
      screen.getByText(/lost your internet connection/i),
    ).toBeInTheDocument();
  });

  it("has a main landmark with the skip-link target id", () => {
    render(<OfflinePage />);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("links users back to home with Try again CTA", () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole("link", { name: "Try again" }),
    ).toHaveAttribute("href", "/");
  });

  it("provides an Open dashboard escape hatch", () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole("link", { name: "Open dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
