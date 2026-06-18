import {
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
