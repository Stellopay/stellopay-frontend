import { describe, expect, it } from "vitest";
import { fuzzyMatch, fuzzySearch } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("prefers contiguous matches over subsequence matches", () => {
    expect(fuzzyMatch("dash", "Dashboard")).toBeGreaterThan(
      fuzzyMatch("dsh", "Dashboard") ?? 0,
    );
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(fuzzyMatch("  TRANS  ", "Transactions")).not.toBeNull();
  });

  it("returns null when the query cannot be matched in order", () => {
    expect(fuzzyMatch("xyz", "Dashboard")).toBeNull();
  });

  it("returns results in descending relevance order", () => {
    const results = fuzzySearch(
      "trans",
      ["Settings", "Transactions", "Transfer"],
      (item) => item,
    );
    expect(results.map(({ item }) => item)).toEqual([
      "Transfer",
      "Transactions",
    ]);
  });
});
