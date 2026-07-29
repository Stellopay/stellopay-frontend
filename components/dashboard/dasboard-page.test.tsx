import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicStub = () => (
      <section data-testid="analytics-insights">Analytics insights</section>
    );
    return DynamicStub;
  },
}));

vi.mock("@/components/dashboard/dashboard-navbar", () => ({
  default: () => <nav aria-label="Dashboard navbar">Dashboard navbar</nav>,
}));

vi.mock("@/components/dashboard/account-overview", () => ({
  default: () => (
    <section data-testid="account-overview">Account overview</section>
  ),
}));

vi.mock("@/components/dashboard/quick-actions", () => ({
  QuickActions: () => (
    <section data-testid="quick-actions">Quick actions</section>
  ),
}));

vi.mock("@/components/analytics/client-analytics-view", () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    <section data-testid="client-analytics-view" data-loading={isLoading}>
      Client analytics view
    </section>
  ),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

import Dashboard, {
  MAX_RECENT_ACTIVITY_LIMIT,
  RecentActivityFeed,
  type RecentActivityEvent,
  createTransactionActivityEvent,
  formatActivityTimestamp,
  getTransactionTimestamp,
  mergeRecentActivityEvents,
} from "./dashboard-page";
import { useTransactions } from "@/hooks/useTransactions";

const mockUseTransactions = vi.mocked(useTransactions);

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx-1",
  type: "Payment Sent",
  txId: "#TXNT2345",
  address: "GABCDE...XYZ67890",
  date: "2023-04-12",
  time: "09:32AM",
  token: "USDC",
  amount: -607.87,
  status: "Completed",
  statusColor: "success",
  ...overrides,
});

const activity = (
  id: string,
  type: RecentActivityEvent["type"],
  timestamp: string,
  title = id,
): RecentActivityEvent => ({
  id,
  type,
  title,
  description: `${title} description`,
  timestamp,
  metadata: type === "transaction" ? "#TXN" : "Account",
});

function mockTransactions(transactions: Transaction[]) {
  mockUseTransactions.mockReturnValue({
    data: {
      data: transactions,
      total: transactions.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe("recent activity event helpers", () => {
  it("normalizes transaction timestamps and formats the display time without timezone drift", () => {
    expect(getTransactionTimestamp("2023-04-12", "12:05AM")).toBe(
      "2023-04-12T00:05:00.000Z",
    );
    expect(getTransactionTimestamp("2023-04-12", "12:05PM")).toBe(
      "2023-04-12T12:05:00.000Z",
    );
    expect(formatActivityTimestamp("2023-04-12T09:32:00.000Z")).toBe(
      "Apr 12, 2023 • 9:32 AM",
    );
  });

  it("creates transaction events with accessible summary text", () => {
    const event = createTransactionActivityEvent(transaction());

    expect(event).toMatchObject({
      id: "transaction-tx-1",
      type: "transaction",
      title: "Payment Sent",
      timestamp: "2023-04-12T09:32:00.000Z",
      metadata: "#TXNT2345",
    });
    expect(event.description).toContain(
      "Completed 607.87 USDC sent to GABCDE...XYZ67890.",
    );
  });

  it("merges transactions, wallet events, and settings changes by timestamp and caps at 15", () => {
    const transactions = Array.from({ length: 18 }, (_, index) =>
      activity(
        `transaction-${index}`,
        "transaction",
        `2023-04-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`,
      ),
    );
    const newestWalletEvent = activity(
      "wallet-newest",
      "wallet",
      "2023-05-01T09:00:00.000Z",
    );
    const settingsEvent = activity(
      "settings-change",
      "settings",
      "2023-04-15T12:00:00.000Z",
    );

    const merged = mergeRecentActivityEvents(
      {
        transactions,
        wallet: [newestWalletEvent],
        settings: [settingsEvent],
      },
      20,
    );

    expect(merged).toHaveLength(MAX_RECENT_ACTIVITY_LIMIT);
    expect(merged[0].id).toBe("wallet-newest");
    expect(merged.map((event) => event.timestamp)).toEqual(
      [...merged.map((event) => event.timestamp)].sort().reverse(),
    );
    expect(merged.some((event) => event.type === "settings")).toBe(true);
  });
});

describe("RecentActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactions([transaction()]);
  });

  it("renders a unified feed sorted across transaction, wallet, security, and settings events", () => {
    render(
      <RecentActivityFeed
        walletEvents={[
          activity(
            "wallet-connected",
            "wallet",
            "2023-04-12T10:45:00.000Z",
            "Primary wallet connected",
          ),
        ]}
        settingsEvents={[
          activity(
            "security-password-changed",
            "security",
            "2023-04-12T11:00:00.000Z",
            "Password changed",
          ),
          activity(
            "settings-profile-updated",
            "settings",
            "2023-04-12T08:30:00.000Z",
            "Profile settings updated",
          ),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /recent activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/latest transactions, wallet connections/i),
    ).toBeInTheDocument();

    const viewAllLink = screen.getByRole("link", {
      name: /view all account activity/i,
    });
    expect(viewAllLink).toHaveAttribute("href", "/transactions");

    const list = screen.getByRole("list", {
      name: /4 recent account activity events/i,
    });
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Password changed");
    expect(items[1]).toHaveTextContent("Primary wallet connected");
    expect(items[2]).toHaveTextContent("Payment Sent");
    expect(items[3]).toHaveTextContent("Profile settings updated");

    expect(within(list).getByText("Security")).toBeInTheDocument();
    expect(within(list).getByText("Wallet")).toBeInTheDocument();
    expect(within(list).getByText("Transaction")).toBeInTheDocument();
    expect(within(list).getByText("Settings")).toBeInTheDocument();
  });

  it("uses distinct decorative icon slots for each event type while keeping text labels visible", () => {
    const { container } = render(
      <RecentActivityFeed
        walletEvents={[
          activity(
            "wallet-connected",
            "wallet",
            "2023-04-12T10:45:00.000Z",
            "Primary wallet connected",
          ),
        ]}
        settingsEvents={[
          activity(
            "security-password-changed",
            "security",
            "2023-04-12T11:00:00.000Z",
            "Password changed",
          ),
          activity(
            "settings-profile-updated",
            "settings",
            "2023-04-12T08:30:00.000Z",
            "Profile settings updated",
          ),
        ]}
      />,
    );

    for (const type of ["transaction", "wallet", "security", "settings"]) {
      const icon = container.querySelector(
        `[data-activity-icon="${type}"] svg`,
      );
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("announces loading state with aria-busy", () => {
    mockUseTransactions.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<RecentActivityFeed />);

    const status = screen.getByRole("status", {
      name: /loading recent account activity/i,
    });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("shows an actionable error state when transactions fail to load", () => {
    const refetch = vi.fn();
    mockUseTransactions.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Network unavailable",
      refetch,
    });

    render(<RecentActivityFeed />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Recent activity unavailable",
    );

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when every activity source is empty", () => {
    mockTransactions([]);

    render(<RecentActivityFeed walletEvents={[]} settingsEvents={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("No recent activity");
    expect(status).toHaveTextContent(
      "Transactions, wallet connections, security events, and settings changes will appear here.",
    );
  });

  it("has no automated accessibility violations in the loaded state", async () => {
    const { container } = render(
      <RecentActivityFeed
        walletEvents={[
          activity(
            "wallet-connected",
            "wallet",
            "2023-04-12T10:45:00.000Z",
            "Primary wallet connected",
          ),
        ]}
        settingsEvents={[
          activity(
            "security-password-changed",
            "security",
            "2023-04-12T11:00:00.000Z",
            "Password changed",
          ),
          activity(
            "settings-profile-updated",
            "settings",
            "2023-04-12T08:30:00.000Z",
            "Profile settings updated",
          ),
        ]}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactions([transaction()]);
  });

  it("places the recent activity widget in the dashboard flow", () => {
    render(<Dashboard />);

    expect(screen.getByTestId("account-overview")).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent activity/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("analytics-insights")).toBeInTheDocument();
  });
});
