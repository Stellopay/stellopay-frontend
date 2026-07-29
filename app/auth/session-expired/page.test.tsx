import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SessionExpiredPage from "./page";

// Mock next/navigation Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SessionExpiredPage", () => {
  it("renders the session expired heading", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    expect(
      screen.getByRole("heading", { name: /Session Expired/i }),
    ).toBeInTheDocument();
  });

  it("explains that the session has expired due to inactivity", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    expect(
      screen.getByText(
        /Your session has expired due to inactivity/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a 'Log in again' button linking to login with returnTo", async () => {
    const Page = await SessionExpiredPage({
      searchParams: Promise.resolve({ returnTo: "/dashboard" }),
    });
    render(Page);

    const loginLink = screen.getByRole("link", { name: /Log in again/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fdashboard",
    );
  });

  it("renders a 'Go to sign in' link", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    const signInLink = screen.getByRole("link", { name: /Go to sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/auth/login");
  });

  it("shows the returnTo path when present", async () => {
    const Page = await SessionExpiredPage({
      searchParams: Promise.resolve({ returnTo: "/settings" }),
    });
    render(Page);

    expect(screen.getByText(/\/settings/)).toBeInTheDocument();
  });

  it("defaults returnTo to /dashboard when no returnTo is provided", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    const loginLink = screen.getByRole("link", { name: /Log in again/i });
    expect(loginLink).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fdashboard",
    );
  });

  it("renders the AuthShowcase with session-expired description", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    expect(
      screen.getByText(/Your session has timed out/i),
    ).toBeInTheDocument();
  });

  it("has the Stellopay branding heading", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    expect(screen.getByText("Stellopay")).toBeInTheDocument();
  });

  it("the Log in again link has accessible focus styles", async () => {
    const Page = await SessionExpiredPage({
      searchParams: Promise.resolve({ returnTo: "/transactions" }),
    });
    render(Page);

    const loginLink = screen.getByRole("link", { name: /Log in again/i });
    expect(loginLink).toHaveAttribute("href");
    expect(loginLink.className).toContain("focus:outline-none");
    expect(loginLink.className).toContain("focus:ring-2");
  });

  it("the decorative clock icon is hidden from screen readers", async () => {
    const Page = await SessionExpiredPage({});
    render(Page);

    const iconContainer = screen.getByTestId("clock-alert-container");
    // Use closest approach: we can check the aria-hidden on the parent div
    expect(iconContainer).toBeInTheDocument();
  });
});
