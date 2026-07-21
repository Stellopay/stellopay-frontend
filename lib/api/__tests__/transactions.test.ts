import {
  MAX_TRANSACTION_PAGE_SIZE,
  MIN_TRANSACTION_PAGE_SIZE,
  getTransactions,
  getAccountSummary,
  getPaymentHistory,
} from "../transactions";

beforeAll(() => {
  vi.stubEnv("NODE_ENV", "test");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("getTransactions", () => {
  it("returns first page with default params", async () => {
    const result = await getTransactions();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(6);
    expect(result.data.length).toBeLessThanOrEqual(6);
    expect(result.total).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("paginates correctly", async () => {
    const page1 = await getTransactions({ page: 1, pageSize: 2 });
    const page2 = await getTransactions({ page: 2, pageSize: 2 });
    expect(page1.data.length).toBe(2);
    expect(page2.data[0]?.id).not.toBe(page1.data[0]?.id);
  });

  it("clamps page to valid range", async () => {
    const result = await getTransactions({ page: 9999, pageSize: 6 });
    expect(result.page).toBe(result.totalPages);
  });

  it("clamps negative page to the first page", async () => {
    const result = await getTransactions({ page: -4, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.data).toHaveLength(2);
  });

  it("clamps zero and negative pageSize to the minimum", async () => {
    const zeroPageSize = await getTransactions({ pageSize: 0 });
    const negativePageSize = await getTransactions({ pageSize: -10 });

    expect(zeroPageSize.pageSize).toBe(MIN_TRANSACTION_PAGE_SIZE);
    expect(zeroPageSize.totalPages).toBe(zeroPageSize.total);
    expect(zeroPageSize.data).toHaveLength(MIN_TRANSACTION_PAGE_SIZE);
    expect(negativePageSize.pageSize).toBe(MIN_TRANSACTION_PAGE_SIZE);
    expect(negativePageSize.data).toHaveLength(MIN_TRANSACTION_PAGE_SIZE);
  });

  it("clamps pageSize to the maximum", async () => {
    const result = await getTransactions({ pageSize: 10_000 });

    expect(result.pageSize).toBe(MAX_TRANSACTION_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(result.total);
  });

  it("falls back to the default pageSize for non-finite values", async () => {
    const result = await getTransactions({ pageSize: Number.NaN });

    expect(result.pageSize).toBe(6);
    expect(Number.isFinite(result.totalPages)).toBe(true);
  });

  it("rejects invalid fromDate and toDate filters", async () => {
    await expect(
      getTransactions({ filters: { fromDate: "not-a-date" } }),
    ).rejects.toThrow("Invalid fromDate");
    await expect(
      getTransactions({ filters: { toDate: "also-not-a-date" } }),
    ).rejects.toThrow("Invalid toDate");
  });

  it("treats empty date filters as unset", async () => {
    const result = await getTransactions({
      filters: { fromDate: "", toDate: "   " },
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("filters by searchQuery USDC", async () => {
    const result = await getTransactions({
      filters: { searchQuery: "USDC" },
      pageSize: 100,
    });
    result.data.forEach((t) => expect(t.token).toBe("USDC"));
  });

  it("filters by selectedFilter Payment Sent", async () => {
    const result = await getTransactions({
      filters: { selectedFilter: "Payment Sent" },
      pageSize: 100,
    });
    result.data.forEach((t) => expect(t.type).toBe("Payment Sent"));
  });

  it("sorts by absolute amount ascending", async () => {
    const result = await getTransactions({
      filters: { sortField: "amount", sortDirection: "asc" },
      pageSize: 100,
    });
    const amounts = result.data.map((t) => Math.abs(t.amount));
    const sorted = [...amounts].sort((a, b) => a - b);
    expect(amounts).toEqual(sorted);
  });

  it("sorts by absolute amount descending", async () => {
    const result = await getTransactions({
      filters: { sortField: "amount", sortDirection: "desc" },
      pageSize: 100,
    });
    const amounts = result.data.map((t) => Math.abs(t.amount));
    const sorted = [...amounts].sort((a, b) => b - a);
    expect(amounts).toEqual(sorted);
  });

  it("returns empty when no match", async () => {
    const result = await getTransactions({
      filters: { searchQuery: "DOESNOTEXIST_XYZ" },
    });
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("filters by plain-text transaction filter query across status and address", async () => {
    const failed = await getTransactions({
      filters: { filterQuery: "failed" },
      pageSize: 100,
    });
    expect(failed.total).toBeGreaterThan(0);
    failed.data.forEach((t) =>
      expect(t.status.toLowerCase()).toContain("failed"),
    );

    const address = failed.data[0]?.address.slice(0, 8);
    expect(address).toBeTruthy();

    const byAddress = await getTransactions({
      filters: { filterQuery: address },
      pageSize: 100,
    });
    expect(byAddress.total).toBeGreaterThan(0);
    byAddress.data.forEach((t) =>
      expect(t.address.toLowerCase()).toContain(address!.toLowerCase()),
    );
  });

  it("each transaction has required fields", async () => {
    const result = await getTransactions({ pageSize: 100 });
    result.data.forEach((t) => {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("type");
      expect(t).toHaveProperty("address");
      expect(t).toHaveProperty("date");
      expect(t).toHaveProperty("token");
      expect(typeof t.amount).toBe("number");
      expect(["Completed", "Pending", "Failed"]).toContain(t.status);
    });
  });
});

// ─── AbortSignal / AbortController support ────────────────────────────────────
//
// getTransactions accepts an optional AbortSignal.  A cancelled request must
// throw a DOMException named "AbortError" so callers (e.g. useTransactions)
// can distinguish intentional cancellations from real errors and avoid
// committing stale state.

describe("AbortSignal support", () => {
  it("rejects with AbortError when signal is already aborted before the call", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      getTransactions({}, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("resolves normally when a non-aborted signal is passed", async () => {
    const controller = new AbortController();
    const result = await getTransactions({ pageSize: 2 }, controller.signal);
    expect(result.data).toHaveLength(2);
  });

  it("resolves normally when no signal is passed", async () => {
    const result = await getTransactions({ pageSize: 2 });
    expect(result.data).toHaveLength(2);
  });
});

// The data layer applies an artificial delay only in development so the demo
// UI exercises its loading states. These tests drive that branch with fake
// timers to keep the suite fast while still covering the dev-only path.
describe("dev-only demo delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore the suite-wide default set in the top-level beforeAll.
    vi.stubEnv("NODE_ENV", "test");
  });

  it("delays getTransactions in development", async () => {
    const pending = getTransactions({ pageSize: 2 });
    await vi.advanceTimersByTimeAsync(400);
    const result = await pending;
    expect(result.data).toHaveLength(2);
  });

  it("delays getAccountSummary in development", async () => {
    const pending = getAccountSummary();
    await vi.advanceTimersByTimeAsync(400);
    const summary = await pending;
    expect(summary).toHaveProperty("walletAddress");
  });

  it("delays getPaymentHistory in development", async () => {
    const pending = getPaymentHistory();
    await vi.advanceTimersByTimeAsync(400);
    const items = await pending;
    expect(items.length).toBeGreaterThan(0);
  });

  it("rejects with AbortError when signal is aborted before the dev delay resolves", async () => {
    const controller = new AbortController();

    const pending = getTransactions({ pageSize: 2 }, controller.signal);

    // Abort mid-delay, before the 400 ms timeout fires.
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects with AbortError when signal is already aborted at call time (dev path)", async () => {
    const controller = new AbortController();
    controller.abort();

    const pending = getTransactions({ pageSize: 2 }, controller.signal);
    // No need to advance timers — the pre-abort check fires immediately.
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("getAccountSummary", () => {
  it("returns summary with required fields", async () => {
    const summary = await getAccountSummary();
    expect(summary).toHaveProperty("balance");
    expect(summary).toHaveProperty("balanceRaw");
    expect(summary).toHaveProperty("paidThisMonth");
    expect(summary).toHaveProperty("toBePaid");
    expect(summary).toHaveProperty("walletAddress");
    expect(typeof summary.balanceRaw).toBe("number");
  });
});

describe("getPaymentHistory", () => {
  it("returns array of payment history items", async () => {
    const items = await getPaymentHistory();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("paymentDescription");
      expect(item).toHaveProperty("paymentId");
      expect(item).toHaveProperty("history");
    });
  });
});
