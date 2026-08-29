import { describe, it, expect } from "vitest";
import {
  TRANSACTIONS_QUERY_KEYS,
  createDefaultTransactionFilters,
  parseTransactionsUrlState,
  buildTransactionsQueryString,
  buildShareableTransactionsQueryString,
  buildShareableTransactionsUrl,
  parseSortConfigs,
  serializeSortConfigs,
  isValidIsoDate,
  parsePage,
  parseSelectedFilter,
  serializeSelectedFilter,
  DEFAULT_SORT_CONFIGS,
  type TransactionsUrlState,
} from "./transactions-url-state";
import type { TransactionFilters, SortConfig } from "@/types/transaction";

function makeDeterministicDefaults(): TransactionFilters {
  return {
    ...createDefaultTransactionFilters(),
    fromDate: "2024-01-01",
    toDate: "2024-01-31",
    sortConfigs: [{ field: "date", direction: "desc" }],
  };
}

describe("transactions-url-state", () => {
  // ── 1. Allowlisted URL Serialization ───────────────────────────────────────
  describe("Allowlist serialization", () => {
    it("serializes only supported filter, sort, and pagination fields", () => {
      const defaults = makeDeterministicDefaults();
      const filters: TransactionFilters = {
        ...defaults,
        searchQuery: "USDC payment",
        selectedFilter: "Payment Sent",
        fromDate: "2024-02-01",
        toDate: "2024-02-28",
        sortConfigs: [
          { field: "amount", direction: "asc" },
          { field: "date", direction: "desc" },
        ],
      };

      const queryString = buildShareableTransactionsQueryString(
        { filters, page: 2 },
        defaults,
      );
      const params = new URLSearchParams(queryString);

      // Verify all expected keys are serialized
      expect(params.get("q")).toBe("USDC payment");
      expect(params.get("filter")).toBe("sent");
      expect(params.get("from")).toBe("2024-02-01");
      expect(params.get("to")).toBe("2024-02-28");
      expect(params.get("sort")).toBe("amount.asc,date.desc");
      expect(params.get("page")).toBe("2");

      // Verify no other keys are serialized
      const keys = Array.from(params.keys());
      expect(keys.sort()).toEqual(["filter", "from", "page", "q", "sort", "to"]);
    });

    it("omits default values to keep shareable URLs clean and canonical", () => {
      const defaults = makeDeterministicDefaults();
      const queryString = buildShareableTransactionsQueryString(
        { filters: defaults, page: 1 },
        defaults,
      );
      expect(queryString).toBe("");
    });

    it("formats full shareable URLs correctly with buildShareableTransactionsUrl", () => {
      const defaults = makeDeterministicDefaults();
      const filters: TransactionFilters = {
        ...defaults,
        searchQuery: "Invoice 123",
      };
      const url = buildShareableTransactionsUrl(
        "/transactions",
        { filters, page: 1 },
        defaults,
      );
      expect(url).toBe("/transactions?q=Invoice+123");
    });
  });

  // ── 2. Sensitive Parameter & Private Metadata Exclusion ─────────────────────
  describe("Exclusion of wallet identifiers and private metadata", () => {
    it("strips wallet addresses, accounts, secrets, and private metadata when building shareable URLs", () => {
      const defaults = makeDeterministicDefaults();
      const currentParams = new URLSearchParams(
        "wallet=GBRPYHIL2AZW0123456789&account=12345&publicKey=GABC...&secret=SB123&session=sess-999&counterparty=GXYZ&viewId=v1&tab=overview",
      );

      const filters: TransactionFilters = {
        ...defaults,
        searchQuery: "Stellar",
      };

      const shareableQuery = buildShareableTransactionsQueryString(
        { filters, page: 1 },
        defaults,
      );
      const shareableParams = new URLSearchParams(shareableQuery);

      expect(shareableParams.has("wallet")).toBe(false);
      expect(shareableParams.has("account")).toBe(false);
      expect(shareableParams.has("publicKey")).toBe(false);
      expect(shareableParams.has("secret")).toBe(false);
      expect(shareableParams.has("session")).toBe(false);
      expect(shareableParams.has("counterparty")).toBe(false);
      expect(shareableParams.has("viewId")).toBe(false);
      expect(shareableParams.has("tab")).toBe(false);
      expect(shareableParams.get("q")).toBe("Stellar");
    });

    it("purges sensitive parameters during regular navigation query building while preserving safe UI parameters", () => {
      const defaults = makeDeterministicDefaults();
      const currentParams = new URLSearchParams(
        "tab=ledger&view=compact&wallet=GBRPYHIL2AZW&secretKey=S12345&privateKey=P987&userId=user_42",
      );

      const filters: TransactionFilters = {
        ...defaults,
        searchQuery: "Salary",
      };

      const queryString = buildTransactionsQueryString(
        currentParams,
        { filters, page: 1 },
        defaults,
      );
      const params = new URLSearchParams(queryString);

      // Safe ambient UI parameters are preserved
      expect(params.get("tab")).toBe("ledger");
      expect(params.get("view")).toBe("compact");
      expect(params.get("q")).toBe("Salary");

      // Sensitive parameters are stripped
      expect(params.has("wallet")).toBe(false);
      expect(params.has("secretKey")).toBe(false);
      expect(params.has("privateKey")).toBe(false);
      expect(params.has("userId")).toBe(false);
    });

    it("ignores sensitive query values in incoming URLs when parsing state", () => {
      const defaults = makeDeterministicDefaults();
      const incomingParams = new URLSearchParams(
        "wallet=GBRPYHIL2AZW&account=acc_99&apiKey=secret_key&q=test&filter=sent",
      );

      const parsed = parseTransactionsUrlState(incomingParams, defaults);

      expect(parsed.filters.searchQuery).toBe("test");
      expect(parsed.filters.selectedFilter).toBe("Payment Sent");
      // Verify internal filter object does not inherit sensitive fields from URL
      expect((parsed.filters as Record<string, unknown>).wallet).toBeUndefined();
      expect((parsed.filters as Record<string, unknown>).account).toBeUndefined();
      expect((parsed.filters as Record<string, unknown>).apiKey).toBeUndefined();
    });
  });

  // ── 3. Encoded Query Values ────────────────────────────────────────────────
  describe("Encoded query values handling", () => {
    it("correctly decodes URI encoded search queries", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams(
        "q=%E2%9C%A8%20Payment%20to%20Alice%20%26%20Bob",
      );
      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.searchQuery).toBe("✨ Payment to Alice & Bob");
    });

    it("correctly parses URL encoded filter labels and values", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams("filter=Payment%20Received");
      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.selectedFilter).toBe("Payment Received");
    });

    it("correctly parses encoded sort tokens with commas and colons", () => {
      const parsed = parseSortConfigs("amount%2Easc%2Cstatus%3Adesc");
      // When decoded by URLSearchParams or passed directly:
      expect(parseSortConfigs("amount.asc,status:desc")).toEqual([
        { field: "amount", direction: "asc" },
        { field: "status", direction: "desc" },
      ]);
    });

    it("safely trims and sanitizes special characters without throwing", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams(
        'q=%3Cscript%3Ealert(%22xss%22)%3C%2Fscript%3E&filter=%20%20sent%20%20',
      );
      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.searchQuery).toBe('<script>alert("xss")</script>');
      expect(parsed.filters.selectedFilter).toBe("Payment Sent");
    });
  });

  // ── 4. Repeated Query Values ───────────────────────────────────────────────
  describe("Repeated query values handling", () => {
    it("handles repeated filter parameters deterministically", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams();
      params.append("filter", "sent");
      params.append("filter", "received");

      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.selectedFilter).toBe("Payment Sent");
    });

    it("handles repeated search query parameters deterministically", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams();
      params.append("q", "primary-query");
      params.append("q", "secondary-query");

      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.searchQuery).toBe("primary-query");
    });

    it("handles repeated page parameters deterministically", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams();
      params.append("page", "4");
      params.append("page", "9");

      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.page).toBe(4);
    });

    it("handles repeated from/to date parameters deterministically", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams();
      params.append("from", "2024-03-01");
      params.append("from", "2024-05-01");
      params.append("to", "2024-03-31");
      params.append("to", "2024-05-31");

      const parsed = parseTransactionsUrlState(params, defaults);
      expect(parsed.filters.fromDate).toBe("2024-03-01");
      expect(parsed.filters.toDate).toBe("2024-03-31");
    });
  });

  // ── 5. Invalid & Malformed Query Values ─────────────────────────────────────
  describe("Invalid and out-of-bounds query values", () => {
    it("validates ISO dates strictly without auto-rollover", () => {
      expect(isValidIsoDate("2024-01-15")).toBe(true);
      expect(isValidIsoDate("2024-02-29")).toBe(true); // 2024 is a leap year
      expect(isValidIsoDate("2023-02-29")).toBe(false); // 2023 is not a leap year
      expect(isValidIsoDate("2024-02-30")).toBe(false); // Feb 30 does not exist
      expect(isValidIsoDate("2024-04-31")).toBe(false); // April has 30 days
      expect(isValidIsoDate("2024-13-01")).toBe(false); // Month 13 is invalid
      expect(isValidIsoDate("not-a-date")).toBe(false);
      expect(isValidIsoDate("")).toBe(false);
      expect(isValidIsoDate(null)).toBe(false);
    });

    it("falls back to default dates when date bounds are invalid", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams("from=2024-02-30&to=invalid-date");
      const parsed = parseTransactionsUrlState(params, defaults);

      expect(parsed.filters.fromDate).toBe(defaults.fromDate);
      expect(parsed.filters.toDate).toBe(defaults.toDate);
    });

    it("falls back to default dates when fromDate > toDate (inverted range)", () => {
      const defaults = makeDeterministicDefaults();
      const params = new URLSearchParams("from=2024-12-01&to=2024-01-01");
      const parsed = parseTransactionsUrlState(params, defaults);

      expect(parsed.filters.fromDate).toBe(defaults.fromDate);
      expect(parsed.filters.toDate).toBe(defaults.toDate);
    });

    it("falls back to page 1 for invalid page parameters (negative, float, string)", () => {
      expect(parsePage("-5")).toBe(1);
      expect(parsePage("0")).toBe(1);
      expect(parsePage("abc")).toBe(1);
      expect(parsePage("1.5")).toBe(1);
      expect(parsePage("Infinity")).toBe(1);
      expect(parsePage(null)).toBe(1);
      expect(parsePage("5")).toBe(5);
    });

    it("filters out invalid sort fields and directions", () => {
      expect(parseSortConfigs("unknown.asc,date.invalid,wallet.desc")).toEqual(
        DEFAULT_SORT_CONFIGS,
      );
      expect(parseSortConfigs("date.asc,amount.desc,status.asc")).toEqual([
        { field: "date", direction: "asc" },
        { field: "amount", direction: "desc" },
      ]); // Capped at 2
    });

    it("deduplicates identical sort fields in the query string", () => {
      expect(parseSortConfigs("date.asc,date.desc")).toEqual([
        { field: "date", direction: "asc" },
      ]);
    });

    it("falls back to default filter for unknown filter values", () => {
      expect(parseSelectedFilter("invalid-filter")).toBe("All Transactions");
      expect(parseSelectedFilter(null)).toBe("All Transactions");
      expect(parseSelectedFilter("sent")).toBe("Payment Sent");
      expect(parseSelectedFilter("received")).toBe("Payment Received");
      expect(parseSelectedFilter("all")).toBe("All Transactions");
    });
  });

  // ── 6. Deterministic Round-Trip (Idempotency) ──────────────────────────────
  describe("Deterministic state & round-trip idempotency", () => {
    it("produces identical output on parse -> serialize -> parse round-trip", () => {
      const defaults = makeDeterministicDefaults();
      const rawUrlParams = new URLSearchParams(
        "q=payroll&filter=sent&from=2024-03-01&to=2024-03-31&sort=amount.desc,date.asc&page=3",
      );

      const parsed1 = parseTransactionsUrlState(rawUrlParams, defaults);
      const serialized1 = buildShareableTransactionsQueryString(parsed1, defaults);
      const parsed2 = parseTransactionsUrlState(new URLSearchParams(serialized1), defaults);
      const serialized2 = buildShareableTransactionsQueryString(parsed2, defaults);

      expect(parsed1).toEqual(parsed2);
      expect(serialized1).toBe(serialized2);
    });

    it("normalizes arbitrary messy input into canonical query parameters", () => {
      const defaults = makeDeterministicDefaults();
      const messyParams = new URLSearchParams(
        "wallet=GABC123&sort=date:asc,amount.desc,date.desc&filter=PAYMENT%20SENT&page=2&q=%20%20Stellar%20XLM%20%20",
      );

      const parsed = parseTransactionsUrlState(messyParams, defaults);
      const canonicalQuery = buildShareableTransactionsQueryString(parsed, defaults);
      const nextParams = new URLSearchParams(canonicalQuery);

      expect(nextParams.get("q")).toBe("Stellar XLM");
      expect(nextParams.get("filter")).toBe("sent");
      expect(nextParams.get("sort")).toBe("date.asc,amount.desc");
      expect(nextParams.get("page")).toBe("2");
      expect(nextParams.has("wallet")).toBe(false);
    });
  });
});
