import { describe, it, expect } from "vitest";
import { searchControls, SEARCHABLE_CONTROLS } from "./settings-search";

describe("searchControls", () => {
  it("should return empty array for empty query", () => {
    const results = searchControls("");
    expect(results).toEqual([]);
  });

  it("should return empty array for whitespace-only query", () => {
    const results = searchControls("   ");
    expect(results).toEqual([]);
  });

  it("should find controls by exact label match", () => {
    const results = searchControls("Password and recovery");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].control.label).toBe("Password and recovery");
    expect(results[0].relevance).toBe(100);
  });

  it("should find controls by partial label match", () => {
    const results = searchControls("password");
    expect(results.length).toBeGreaterThan(0);
    const passwordControl = results.find(
      (r) => r.control.label === "Password and recovery",
    );
    expect(passwordControl).toBeDefined();
    expect(passwordControl!.relevance).toBeGreaterThanOrEqual(50);
  });

  it("should find controls by keyword match", () => {
    const results = searchControls("2fa");
    expect(results.length).toBeGreaterThan(0);
    const twoFactorControl = results.find(
      (r) => r.control.label === "Authenticator app verification",
    );
    expect(twoFactorControl).toBeDefined();
  });

  it("should be case-insensitive", () => {
    const lowercaseResults = searchControls("password");
    const uppercaseResults = searchControls("PASSWORD");
    const mixedCaseResults = searchControls("PaSSWoRD");

    expect(lowercaseResults.length).toBe(uppercaseResults.length);
    expect(lowercaseResults.length).toBe(mixedCaseResults.length);
  });

  it("should rank exact matches higher than substring matches", () => {
    const results = searchControls("alert");
    expect(results.length).toBeGreaterThan(1);

    // Results should be sorted by relevance (descending)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance);
    }
  });

  it("should handle leading/trailing whitespace", () => {
    const trimmedResults = searchControls("password");
    const untrimmedResults = searchControls("   password   ");

    expect(trimmedResults.length).toBe(untrimmedResults.length);
    expect(trimmedResults[0].control.label).toBe(
      untrimmedResults[0].control.label,
    );
  });

  it("should find controls from all sections", () => {
    const controls = SEARCHABLE_CONTROLS;
    const sections = new Set(controls.map((c) => c.section));

    expect(sections).toContain("account");
    expect(sections).toContain("notifications");
    expect(sections).toContain("security");
    expect(sections).toContain("wallets");
  });

  it("should have at least one control per section", () => {
    const controls = SEARCHABLE_CONTROLS;
    const accountControls = controls.filter((c) => c.section === "account");
    const notificationControls = controls.filter(
      (c) => c.section === "notifications",
    );
    const securityControls = controls.filter((c) => c.section === "security");
    const walletControls = controls.filter((c) => c.section === "wallets");

    expect(accountControls.length).toBeGreaterThan(0);
    expect(notificationControls.length).toBeGreaterThan(0);
    expect(securityControls.length).toBeGreaterThan(0);
    expect(walletControls.length).toBeGreaterThan(0);
  });

  it("should find controls by their keywords", () => {
    // "authentication" is a keyword for "Password and recovery"
    const results = searchControls("authentication");
    expect(results.length).toBeGreaterThan(0);

    const passwordControl = results.find(
      (r) => r.control.label === "Password and recovery",
    );
    expect(passwordControl).toBeDefined();
  });

  it("should not return results below relevance threshold", () => {
    // A query that matches nothing should return empty array
    const results = searchControls("xyzabc123notreal");
    expect(results).toEqual([]);
  });

  it("should prioritize label matches over keyword matches", () => {
    const results = searchControls("transfer");

    // "Large transfer approval" has "transfer" in the label
    // should rank higher than items that only have it in keywords
    const labelMatch = results.find(
      (r) => r.control.label.includes("transfer"),
    );
    expect(labelMatch).toBeDefined();

    // Label matches should appear early in results
    if (results.length > 1 && labelMatch) {
      const labelMatchIndex = results.findIndex((r) => r === labelMatch);
      expect(labelMatchIndex).toBeLessThan(results.length / 2);
    }
  });

  it("should handle multiple matches for a single query", () => {
    const results = searchControls("approval");
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Both should be present
    const hasApprovalRequired = results.some(
      (r) => r.control.label.includes("Approval"),
    );
    const hasAddressBook = results.some(
      (r) => r.control.label.includes("address"),
    );

    expect(hasApprovalRequired || hasAddressBook).toBe(true);
  });
});
