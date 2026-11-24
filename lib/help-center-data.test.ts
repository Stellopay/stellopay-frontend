import { describe, expect, it } from "vitest";

import { filterTopics, HELP_TOPICS, type HelpTopic } from "@/lib/help-center-data";

describe("help-center-data", () => {
  describe("HELP_TOPICS", () => {
    it("exports all help topics with expected structure", () => {
      expect(HELP_TOPICS).toHaveLength(6);

      for (const topic of HELP_TOPICS) {
        expect(topic).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          subtitle: expect.any(String),
          link: expect.any(String),
          keywords: expect.arrayContaining([]),
          hasSubPage: expect.any(Boolean),
        });
        expect(Array.isArray(topic.keywords)).toBe(true);
        expect(topic.keywords.length).toBeGreaterThan(0);
        expect(topic.id.length).toBeGreaterThan(0);
        expect(topic.title.length).toBeGreaterThan(0);
        expect(topic.subtitle.length).toBeGreaterThan(0);
        expect(topic.link.length).toBeGreaterThan(0);
      }
    });

    it("contains expected topic entries", () => {
      const ids = HELP_TOPICS.map((t) => t.id);
      expect(ids).toEqual([
        "account-management",
        "transaction-issues",
        "security-privacy",
        "payment-transfers",
        "billing-invoices",
        "notifications-alerts",
      ]);
    });

    it("has correct properties for account-management", () => {
      const topic = HELP_TOPICS.find((t) => t.id === "account-management");
      expect(topic).toBeDefined();
      expect(topic?.title).toBe("Account Management");
      expect(topic?.hasSubPage).toBe(true);
      expect(topic?.keywords).toContain("password");
      expect(topic?.keywords).toContain("settings");
    });

    it("has correct properties for transaction-issues", () => {
      const topic = HELP_TOPICS.find((t) => t.id === "transaction-issues");
      expect(topic).toBeDefined();
      expect(topic?.hasSubPage).toBe(false);
      expect(topic?.keywords).toContain("payment");
      expect(topic?.keywords).toContain("failed");
    });
  });

  describe("filterTopics", () => {
    it("returns all topics when query is empty", () => {
      expect(filterTopics("")).toEqual(HELP_TOPICS);
    });

    it("returns all topics when query is only whitespace", () => {
      expect(filterTopics("   ")).toEqual(HELP_TOPICS);
      expect(filterTopics("\t")).toEqual(HELP_TOPICS);
      expect(filterTopics("\n")).toEqual(HELP_TOPICS);
    });

    it("filters by title (case insensitive)", () => {
      const result = filterTopics("account");
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((t) => t.id === "account-management")).toBe(true);
      expect(result.some((t) => t.id === "notifications-alerts")).toBe(true);

      const resultUpper = filterTopics("ACCOUNT");
      expect(resultUpper.length).toBe(result.length);
    });

    it("filters by subtitle (case insensitive)", () => {
      const result = filterTopics("password");
      expect(result.some((t) => t.id === "account-management")).toBe(true);

      const resultMixed = filterTopics("PaSsWoRd");
      expect(resultMixed.some((t) => t.id === "account-management")).toBe(true);
    });

    it("filters by keywords (case insensitive)", () => {
      const result = filterTopics("2fa");
      expect(result.some((t) => t.id === "security-privacy")).toBe(true);

      const resultFraud = filterTopics("fraud");
      expect(resultFraud.some((t) => t.id === "security-privacy")).toBe(true);

      const resultUpper = filterTopics("REFUND");
      expect(resultUpper.some((t) => t.id === "transaction-issues")).toBe(true);
    });

    it("returns empty array for non-matching query", () => {
      const result = filterTopics("nonexistentquery12345");
      expect(result).toEqual([]);
    });

    it("returns topics matching any of title, subtitle, or keywords", () => {
      const result = filterTopics("payment");
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some((t) =>
          ["transaction-issues", "payment-transfers", "billing-invoices"].includes(
            t.id,
          ),
        ),
      ).toBe(true);
    });

    it("handles boundary inputs", () => {
      // Zero-length after trim
      expect(filterTopics("")).toEqual(HELP_TOPICS);

      // Maximum-like long string
      const longQuery = "a".repeat(1000);
      expect(filterTopics(longQuery)).toEqual([]);

      // Single character
      const singleChar = filterTopics("p");
      expect(Array.isArray(singleChar)).toBe(true);
    });

    it("does not mutate original HELP_TOPICS", () => {
      const originalLength = HELP_TOPICS.length;
      const originalIds = HELP_TOPICS.map((t) => t.id);
      filterTopics("account");
      expect(HELP_TOPICS.length).toBe(originalLength);
      expect(HELP_TOPICS.map((t) => t.id)).toEqual(originalIds);
    });
  });
});
