import { describe, expect, it } from "vitest";

import {
  getEndIndex,
  getPageItems,
  getStartIndex,
  getTotalPages,
  isValidPage,
} from "@/utils/paginationUtils";

const items = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf"];
const itemsPerPage = 3;

describe("paginationUtils", () => {
  describe("getPageItems", () => {
    it("returns an empty list for an empty source list", () => {
      expect(getPageItems([], 1, itemsPerPage)).toEqual([]);
    });

    it("returns the first page slice", () => {
      expect(getPageItems(items, 1, itemsPerPage)).toEqual([
        "alpha",
        "bravo",
        "charlie",
      ]);
    });

    it("returns a middle page slice", () => {
      expect(getPageItems(items, 2, itemsPerPage)).toEqual([
        "delta",
        "echo",
        "foxtrot",
      ]);
    });

    it("returns the remaining items for a partial last page", () => {
      expect(getPageItems(items, 3, itemsPerPage)).toEqual(["golf"]);
    });

    it("returns an empty list for a page beyond the available range", () => {
      expect(getPageItems(items, 4, itemsPerPage)).toEqual([]);
    });

    it("does not clamp page zero to the first page", () => {
      expect(getPageItems(items, 0, itemsPerPage)).toEqual([]);
    });

    it("returns an empty list for a negative page instead of slicing from the end", () => {
      expect(getPageItems(items, -1, itemsPerPage)).toEqual([]);
    });
  });

  describe("getTotalPages", () => {
    it("returns an exact page count when items divide evenly", () => {
      expect(getTotalPages(12, 4)).toBe(3);
    });

    it("rounds up when the last page is partial", () => {
      expect(getTotalPages(13, 4)).toBe(4);
    });

    it("returns zero pages when there are no items", () => {
      expect(getTotalPages(0, 4)).toBe(0);
    });
  });

  describe("index helpers", () => {
    it("returns start and end indexes for page 1", () => {
      expect(getStartIndex(1, 10)).toBe(0);
      expect(getEndIndex(1, 10)).toBe(10);
    });

    it("returns start and end indexes for page 2", () => {
      expect(getStartIndex(2, 10)).toBe(10);
      expect(getEndIndex(2, 10)).toBe(20);
    });
  });

  describe("isValidPage", () => {
    it("accepts the first and last page", () => {
      expect(isValidPage(1, 5)).toBe(true);
      expect(isValidPage(5, 5)).toBe(true);
    });

    it("rejects zero, negative, and greater-than-total pages", () => {
      expect(isValidPage(0, 5)).toBe(false);
      expect(isValidPage(-1, 5)).toBe(false);
      expect(isValidPage(6, 5)).toBe(false);
    });
  });
});
