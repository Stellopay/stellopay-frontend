import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatCard } from "./stat-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("StatCard Primitive", () => {
  describe("Compact / Dashboard Scale (size='sm')", () => {
    it("renders title, subtitle, icon, value, and trend change correctly", () => {
      render(
        <StatCard
          size="sm"
          title="Total Revenue"
          subtitle="All accounts"
          value="$124,500.00"
          valueTestId="stat-value"
          icon={<span data-testid="stat-icon">Icon</span>}
          iconBgColor="bg-blue-100"
          change="+15.4% vs last month"
          isPositive={true}
        />
      );

      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("All accounts")).toBeInTheDocument();
      expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
      expect(screen.getByTestId("stat-value")).toHaveTextContent("$124,500.00");
      expect(screen.getByText("+15.4%")).toBeInTheDocument();
      expect(screen.getByText("vs last month")).toBeInTheDocument();
    });

    it("renders negative trend change correctly", () => {
      const { container } = render(
        <StatCard
          size="sm"
          title="Active Volume"
          value="$50,000"
          change="-4.2% vs last week"
          isPositive={false}
        />
      );

      expect(screen.getByText("-4.2%")).toBeInTheDocument();
      expect(screen.getByText("vs last week")).toBeInTheDocument();
      expect(container.querySelector(".text-rose-700")).toBeInTheDocument();
    });

    it("renders chartSlot when provided", () => {
      render(
        <StatCard
          size="sm"
          title="Volume"
          value="$100k"
          chartSlot={<div data-testid="custom-chart">Chart</div>}
        />
      );

      expect(screen.getByTestId("custom-chart")).toBeInTheDocument();
    });

    it("renders custom trendSlot when provided", () => {
      render(
        <StatCard
          size="sm"
          value="$10,000"
          trendSlot={<span data-testid="custom-trend">Custom Trend</span>}
        />
      );

      expect(screen.getByTestId("custom-trend")).toBeInTheDocument();
    });

    it("renders as interactive link when href is provided", () => {
      render(
        <StatCard
          size="sm"
          title="Transactions"
          value="1,200"
          href="/transactions"
          ariaLabel="View transaction history"
          testId="stat-card-link"
        />
      );

      const link = screen.getByTestId("stat-card-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/transactions");
      expect(link).toHaveAttribute("aria-label", "View transaction history");
    });
  });

  describe("Large / Landing Scale (size='lg')", () => {
    it("renders centered large scale stat card with value and title", () => {
      render(
        <StatCard
          size="lg"
          value="$2.5B+"
          title="Transaction Volume"
          valueTestId="landing-stat-value"
        />
      );

      expect(screen.getByTestId("landing-stat-value")).toHaveTextContent("$2.5B+");
      expect(screen.getByText("Transaction Volume")).toBeInTheDocument();
    });
  });
});
