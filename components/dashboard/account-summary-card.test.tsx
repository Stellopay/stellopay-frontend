import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountSummaryCard from './account-summary-card';
import { AccountSummaryCardProps } from './summary-data';

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

const defaultProps: AccountSummaryCardProps = {
  title: "Total Balance",
  subtitle: "Across all chains",
  value: "$847,500.00",
  change: "+12.5% vs last month",
  isPositive: true,
  icon: <span data-testid="card-icon">Icon</span>,
  iconBgColor: "bg-blue-500/10",
  chartColor: "bg-blue-500",
  chartData: [{ value: 40 }, { value: 70 }],
};

describe('AccountSummaryCard', () => {
  it('renders title, subtitle, icon, and standard pre-formatted string balance correctly', () => {
    render(<AccountSummaryCard {...defaultProps} />);

    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Across all chains")).toBeInTheDocument();
    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
    expect(screen.getByTestId("account-summary-card-value")).toHaveTextContent("$847,500.00");
  });

  describe('Drill-down navigation', () => {
    it('renders as a link when filterQuery is provided', () => {
      render(
        <AccountSummaryCard {...defaultProps} filterQuery="Payment Sent" />,
      );

      const link = screen.getByTestId("account-summary-card-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `/transactions?filter=${encodeURIComponent("Payment Sent")}`,
      );
      expect(link).toHaveAttribute(
        "aria-label",
        "View Total Balance transactions",
      );
    });

    it('renders as a plain div (no link) when filterQuery is undefined', () => {
      render(<AccountSummaryCard {...defaultProps} />);

      expect(
        screen.queryByTestId("account-summary-card-link"),
      ).not.toBeInTheDocument();
      // the value is still rendered
      expect(
        screen.getByTestId("account-summary-card-value"),
      ).toBeInTheDocument();
    });

    it('navigates with empty filterQuery when value is empty string', () => {
      render(<AccountSummaryCard {...defaultProps} filterQuery="" />);

      const link = screen.getByTestId("account-summary-card-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/transactions?filter=");
    });
  });

  describe('Currency Formatting Edge Cases', () => {
    it('renders zero balance correctly when passed as a number or string', () => {
      // Numeric zero balance using default formatCurrency
      const { rerender } = render(
        <AccountSummaryCard {...defaultProps} value={0} />
      );

      const valueElement = screen.getByTestId("account-summary-card-value");
      expect(valueElement).toHaveTextContent("+$0.00");

      // Formatted zero string
      rerender(<AccountSummaryCard {...defaultProps} value="$0.00" />);
      expect(valueElement).toHaveTextContent("$0.00");
    });

    it('renders a very large balance correctly without breaking layout overflow constraints', () => {
      const largeNumber = 1234567890123.45;
      render(
        <AccountSummaryCard
          {...defaultProps}
          value={largeNumber}
        />
      );

      const valueElement = screen.getByTestId("account-summary-card-value");
      expect(valueElement).toHaveTextContent("+$1234567890123.45");

      // Verify layout overflow & truncation protection classes are applied
      expect(valueElement).toHaveClass("truncate");
      expect(valueElement).toHaveClass("max-w-full");
      expect(valueElement).toHaveClass("min-w-0");

      // Verify title attribute is set for tooltip accessibility on truncated text
      expect(valueElement).toHaveAttribute("title", "+$1234567890123.45");
    });

    it('renders high-precision balance with specified decimal places', () => {
      const highPrecision = 0.00001234;
      render(
        <AccountSummaryCard
          {...defaultProps}
          value={highPrecision}
          decimals={8}
          currency="USDC "
        />
      );

      const valueElement = screen.getByTestId("account-summary-card-value");
      expect(valueElement).toHaveTextContent("+USDC 0.00001234");
      expect(valueElement).toHaveAttribute("title", "+USDC 0.00001234");
    });

    it('formats negative balance numbers correctly', () => {
      render(
        <AccountSummaryCard
          {...defaultProps}
          value={-9876.54}
          isPositive={false}
          change="-5.2% vs last month"
        />
      );

      const valueElement = screen.getByTestId("account-summary-card-value");
      expect(valueElement).toHaveTextContent("-$9876.54");
    });
  });

  describe('Trend Indicator & Badges', () => {
    it('renders positive trend badge with TrendingUp icon', () => {
      const { container } = render(
        <AccountSummaryCard {...defaultProps} isPositive={true} change="+8.2% vs last month" />
      );

      expect(screen.getByText("+8.2%")).toBeInTheDocument();
      expect(screen.getByText("vs last month")).toBeInTheDocument();
      expect(container.querySelector('.text-emerald-700')).toBeInTheDocument();
    });

    it('renders negative trend badge with TrendingDown icon', () => {
      const { container } = render(
        <AccountSummaryCard {...defaultProps} isPositive={false} change="-3.1% vs last month" />
      );

      expect(screen.getByText("-3.1%")).toBeInTheDocument();
      expect(screen.getByText("vs last month")).toBeInTheDocument();
      expect(container.querySelector('.text-rose-700')).toBeInTheDocument();
    });
  });
});
