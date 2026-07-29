import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "./transactions-config";
import { TransactionsTable } from "./transactions-table";
import type { TransactionFilters } from "@/types/transaction";

const navigationMock = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
  },
  pathname: "/transactions",
  searchParams: new URLSearchParams(),
}));

// next/image is not available in jsdom — swap it for a plain <img>.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => navigationMock.router,
  useSearchParams: () => navigationMock.searchParams,
}));

vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

// ---------------------------------------------------------------------------
// transactions-config
// ---------------------------------------------------------------------------

describe("TRANSACTIONS_PAGE_SIZE", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(TRANSACTIONS_PAGE_SIZE)).toBe(true);
    expect(TRANSACTIONS_PAGE_SIZE).toBeGreaterThan(0);
  });
});

describe("getDefaultDateRange", () => {
  it("returns ISO date strings in YYYY-MM-DD format", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    expect(fromDate).toMatch(isoDate);
    expect(toDate).toMatch(isoDate);
  });

  it("toDate equals today", () => {
    const today = new Date().toISOString().split("T")[0];
    const { toDate } = getDefaultDateRange();
    expect(toDate).toBe(today);
  });

  it("fromDate is exactly 30 days before toDate", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    const diffMs = new Date(toDate).getTime() - new Date(fromDate).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });

  it("fromDate is strictly before toDate", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    expect(new Date(fromDate).getTime()).toBeLessThan(
      new Date(toDate).getTime(),
    );
  });

  it("does not return the stale 2023 hardcoded dates", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    expect(fromDate).not.toBe("2023-03-26");
    expect(toDate).not.toBe("2023-04-15");
  });

  it("returns a fresh range on each call (not a frozen module-load snapshot)", () => {
    // Two calls on the same day should return identical dates.
    const first = getDefaultDateRange();
    const second = getDefaultDateRange();
    expect(first.fromDate).toBe(second.fromDate);
    expect(first.toDate).toBe(second.toDate);
  });
});

// ---------------------------------------------------------------------------
// TransactionsContent URL-state helpers
// ---------------------------------------------------------------------------

import {
  buildTransactionsQueryString,
  createDefaultTransactionFilters,
  parseSortConfigs,
  parseTransactionsUrlState,
  serializeSortConfigs,
} from "./transactions-content";

function makeDeterministicDefaults(): TransactionFilters {
  return {
    ...createDefaultTransactionFilters(),
    fromDate: "2024-01-01",
    toDate: "2024-01-31",
    sortConfigs: [{ field: "date", direction: "desc" }],
  };
}

describe("TransactionsContent URL query-string helpers", () => {
  it("parses filter, sort, and page state from URL parameters", () => {
    const defaults = makeDeterministicDefaults();
    const params = new URLSearchParams(
      "q=stellar&filter=sent&from=2024-02-01&to=2024-02-29&sort=amount.asc,status.desc&page=3",
    );

    const result = parseTransactionsUrlState(params, defaults);

    expect(result.page).toBe(3);
    expect(result.filters).toMatchObject({
      searchQuery: "stellar",
      selectedFilter: "Payment Sent",
      fromDate: "2024-02-01",
      toDate: "2024-02-29",
    });
    expect(result.filters.sortConfigs).toEqual([
      { field: "amount", direction: "asc" },
      { field: "status", direction: "desc" },
    ]);
  });

  it("falls back to safe defaults for invalid URL values", () => {
    const defaults = makeDeterministicDefaults();
    const params = new URLSearchParams(
      "filter=unknown&from=2024-99-99&to=not-a-date&sort=hacked.up&page=-2",
    );

    const result = parseTransactionsUrlState(params, defaults);

    expect(result.page).toBe(1);
    expect(result.filters.selectedFilter).toBe("All Transactions");
    expect(result.filters.fromDate).toBe(defaults.fromDate);
    expect(result.filters.toDate).toBe(defaults.toDate);
    expect(result.filters.sortConfigs).toEqual(defaults.sortConfigs);
  });

  it("serializes non-default state while preserving unrelated query parameters", () => {
    const defaults = makeDeterministicDefaults();
    const filters: TransactionFilters = {
      ...defaults,
      searchQuery: "USDC payroll",
      selectedFilter: "Payment Received",
      fromDate: "2024-02-01",
      toDate: "2024-02-29",
      sortConfigs: [
        { field: "amount", direction: "asc" },
        { field: "date", direction: "desc" },
      ],
    };

    const queryString = buildTransactionsQueryString(
      new URLSearchParams("tab=ledger&page=7&q=old"),
      { filters, page: 3 },
      defaults,
    );
    const nextParams = new URLSearchParams(queryString);

    expect(nextParams.get("tab")).toBe("ledger");
    expect(nextParams.get("q")).toBe("USDC payroll");
    expect(nextParams.get("filter")).toBe("received");
    expect(nextParams.get("from")).toBe("2024-02-01");
    expect(nextParams.get("to")).toBe("2024-02-29");
    expect(nextParams.get("sort")).toBe("amount.asc,date.desc");
    expect(nextParams.get("page")).toBe("3");
  });

  it("omits controlled URL parameters when state equals the defaults", () => {
    const defaults = makeDeterministicDefaults();
    const queryString = buildTransactionsQueryString(
      new URLSearchParams("tab=ledger&q=old&page=5"),
      { filters: defaults, page: 1 },
      defaults,
    );

    expect(queryString).toBe("tab=ledger");
  });

  it("normalizes sort configs to the supported fields and directions", () => {
    expect(
      parseSortConfigs("date:asc,amount.desc,amount.asc,bad.desc"),
    ).toEqual([
      { field: "date", direction: "asc" },
      { field: "amount", direction: "desc" },
    ]);
    expect(serializeSortConfigs([{ field: "status", direction: "desc" }])).toBe(
      "status.desc",
    );
  });
});

// ---------------------------------------------------------------------------
// skeleton count parity: TRANSACTIONS_PAGE_SIZE ↔ TransactionsTable rows
// ---------------------------------------------------------------------------

describe("TransactionsTable skeleton count parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders exactly TRANSACTIONS_PAGE_SIZE skeleton rows in the table body when loading", () => {
    render(<TransactionsTable transactions={[]} isLoading={true} />);
    const tbody = document.querySelector("tbody");
    const skeletonRows = tbody?.querySelectorAll("tr") ?? [];
    expect(skeletonRows.length).toBe(TRANSACTIONS_PAGE_SIZE);
  });

  it("renders no skeleton rows and shows the empty-state when not loading with zero transactions", () => {
    render(<TransactionsTable transactions={[]} isLoading={false} />);
    const tbody = document.querySelector("tbody");
    // One colspan row for the empty-state message
    expect(tbody?.querySelectorAll("tr").length).toBe(1);
    expect(
      screen.getAllByText("No transactions found. Try adjusting your filters."),
    ).toHaveLength(2); // desktop + mobile
  });

  it("renders exactly TRANSACTIONS_PAGE_SIZE data rows when provided that many transactions", () => {
    const transactions = Array.from(
      { length: TRANSACTIONS_PAGE_SIZE },
      (_, i) => ({
        id: `tx-${i}`,
        type: "Payment",
        txId: `#TXN${i}`,
        address: `GAddress${i}`,
        date: "2024-01-01",
        time: "12:00",
        token: "USDC",
        amount: `+$${(i + 1) * 10}.00`,
        status: "Completed" as const,
        tokenIcon: "/usdc-logo.png",
      }),
    );

    render(<TransactionsTable transactions={transactions} isLoading={false} />);
    const tbody = document.querySelector("tbody");
    const dataRows = tbody?.querySelectorAll("tr") ?? [];
    expect(dataRows.length).toBe(TRANSACTIONS_PAGE_SIZE);
  });
});

// ---------------------------------------------------------------------------
// TransactionsContent: error, empty, and URL state
// ---------------------------------------------------------------------------

import { useTransactions } from "@/hooks/useTransactions";
import TransactionsContent from "./transactions-content";

function mockTransactionsSuccess(total = 0) {
  vi.mocked(useTransactions).mockReturnValue({
    data: {
      data: [],
      total,
      page: 1,
      pageSize: TRANSACTIONS_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE)),
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe("TransactionsContent states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMock.router.replace.mockClear();
    navigationMock.pathname = "/transactions";
    navigationMock.searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders ErrorState with retry when fetch fails", () => {
    const mockRefetch = vi.fn();
    vi.mocked(useTransactions).mockReturnValue({
      data: null,
      isLoading: false,
      error: "Network timeout",
      refetch: mockRefetch,
    });

    render(<TransactionsContent />);

    // Should see error state
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();

    // Retry action is wired
    screen.getByRole("button", { name: "Try Again" }).click();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("renders empty state table when fetch succeeds but returns empty array", () => {
    mockTransactionsSuccess();

    render(<TransactionsContent />);

    // No error state
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Table empty state
    expect(
      screen.getAllByText(
        "No transactions found. Try adjusting your filters.",
      )[0],
    ).toBeInTheDocument();
  });

  it("initializes filter, sort, and pagination state from the URL", () => {
    navigationMock.searchParams = new URLSearchParams(
      "q=stellar&filter=sent&from=2024-02-01&to=2024-02-29&sort=amount.asc,status.desc&page=3",
    );
    mockTransactionsSuccess(42);

    render(<TransactionsContent />);

    const firstHookOptions = vi.mocked(useTransactions).mock.calls[0][0];

    expect(firstHookOptions.page).toBe(3);
    expect(firstHookOptions.pageSize).toBe(TRANSACTIONS_PAGE_SIZE);
    expect(firstHookOptions.filters).toMatchObject({
      searchQuery: "stellar",
      selectedFilter: "Payment Sent",
      fromDate: "2024-02-01",
      toDate: "2024-02-29",
    });
    expect(firstHookOptions.filters?.sortConfigs).toEqual([
      { field: "amount", direction: "asc" },
      { field: "status", direction: "desc" },
    ]);
    expect(screen.getByLabelText("Search transactions")).toHaveValue("stellar");
  });

  it("replaces the current history entry when search state changes", async () => {
    navigationMock.searchParams = new URLSearchParams("page=4");
    mockTransactionsSuccess(42);

    render(<TransactionsContent />);
    navigationMock.router.replace.mockClear();

    fireEvent.change(screen.getByLabelText("Search transactions"), {
      target: { value: "USDC" },
    });

    await waitFor(() => {
      expect(navigationMock.router.replace).toHaveBeenCalledWith(
        "/transactions?q=USDC",
        { scroll: false },
      );
    });
  });

  it("replaces the current history entry when pagination changes", async () => {
    navigationMock.searchParams = new URLSearchParams("q=USDC");
    mockTransactionsSuccess(42);

    render(<TransactionsContent />);
    navigationMock.router.replace.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    await waitFor(() => {
      expect(navigationMock.router.replace).toHaveBeenCalledWith(
        "/transactions?q=USDC&page=2",
        { scroll: false },
      );
    });
  });
});
