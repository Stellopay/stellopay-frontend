import { describe, expect, it } from "vitest";

import {
  MAX_ITEMS_PER_PAGE,
  MIN_ITEMS_PER_PAGE,
  MIN_PAGE,
  getEndIndex,
  getPageItems,
  getStartIndex,
  getTotalPages,
  isValidPage,
  normalizeItemsPerPage,
  normalizePage,
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

    it("returns an empty list for a NaN page", () => {
      expect(getPageItems(items, NaN, itemsPerPage)).toEqual([]);
    });

    it("falls back to a minimum items-per-page instead of an empty slice when itemsPerPage is zero", () => {
      expect(getPageItems(items, 1, 0)).toEqual(["alpha"]);
    });

    it("falls back to a minimum items-per-page when itemsPerPage is negative", () => {
      expect(getPageItems(items, 1, -5)).toEqual(["alpha"]);
    });

    it("caps an absurdly large itemsPerPage instead of returning an unbounded slice", () => {
      expect(getPageItems(items, 1, Number.MAX_SAFE_INTEGER)).toEqual(items);
    });

    it("falls back to a minimum items-per-page for a non-finite itemsPerPage", () => {
      expect(getPageItems(items, 1, Infinity)).toEqual(["alpha"]);
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

    it("returns zero pages for negative totalItems instead of a negative count", () => {
      expect(getTotalPages(-10, 4)).toBe(0);
    });

    it("never returns Infinity when itemsPerPage is zero", () => {
      const result = getTotalPages(10, 0);
      expect(result).toBe(10);
      expect(Number.isFinite(result)).toBe(true);
    });

    it("never returns Infinity when itemsPerPage is negative", () => {
      const result = getTotalPages(10, -4);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it("never returns NaN for non-finite or NaN inputs", () => {
      expect(Number.isNaN(getTotalPages(NaN, 4))).toBe(false);
      expect(Number.isNaN(getTotalPages(10, NaN))).toBe(false);
      expect(getTotalPages(NaN, 4)).toBe(0);
    });

    it("caps an absurdly large itemsPerPage to a single page instead of a tiny fraction", () => {
      expect(getTotalPages(10, Number.MAX_SAFE_INTEGER)).toBe(1);
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

    it("clamps a negative page to MIN_PAGE instead of producing a negative index", () => {
      expect(getStartIndex(-3, 10)).toBe(0);
      expect(getEndIndex(-3, 10)).toBe(10);
    });

    it("clamps a zero page to MIN_PAGE", () => {
      expect(getStartIndex(0, 10)).toBe(0);
      expect(getEndIndex(0, 10)).toBe(10);
    });

    it("normalizes a zero or negative itemsPerPage to the safe minimum", () => {
      expect(getStartIndex(2, 0)).toBe(1);
      expect(getEndIndex(2, 0)).toBe(2);
      expect(getStartIndex(2, -10)).toBe(1);
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

    it("rejects a NaN page", () => {
      expect(isValidPage(NaN, 5)).toBe(false);
    });
  });

  describe("normalizeItemsPerPage", () => {
    it("returns the value unchanged when already within range", () => {
      expect(normalizeItemsPerPage(25)).toBe(25);
    });

    it("falls back to MIN_ITEMS_PER_PAGE for zero, negative, NaN, or Infinity", () => {
      expect(normalizeItemsPerPage(0)).toBe(MIN_ITEMS_PER_PAGE);
      expect(normalizeItemsPerPage(-5)).toBe(MIN_ITEMS_PER_PAGE);
      expect(normalizeItemsPerPage(NaN)).toBe(MIN_ITEMS_PER_PAGE);
      expect(normalizeItemsPerPage(Infinity)).toBe(MIN_ITEMS_PER_PAGE);
    });

    it("caps large finite values above MAX_ITEMS_PER_PAGE", () => {
      expect(normalizeItemsPerPage(999_999_999)).toBe(MAX_ITEMS_PER_PAGE);
      expect(normalizeItemsPerPage(Number.MAX_SAFE_INTEGER)).toBe(
        MAX_ITEMS_PER_PAGE,
      );
    });

    it("truncates fractional values to an integer", () => {
      expect(normalizeItemsPerPage(10.9)).toBe(10);
    });
  });

  describe("normalizePage", () => {
    it("returns the value unchanged when already valid", () => {
      expect(normalizePage(3)).toBe(3);
    });

    it("falls back to MIN_PAGE for zero, negative, or non-finite values", () => {
      expect(normalizePage(0)).toBe(MIN_PAGE);
      expect(normalizePage(-7)).toBe(MIN_PAGE);
      expect(normalizePage(NaN)).toBe(MIN_PAGE);
      expect(normalizePage(Infinity)).toBe(MIN_PAGE);
    });

    it("truncates fractional values to an integer", () => {
      expect(normalizePage(2.7)).toBe(2);
    });
  });

  describe("boundary cases", () => {
    describe("zero total items", () => {
      it("returns 0 pages when totalItems is 0", () => {
        expect(getTotalPages(0, 10)).toBe(0);
      });

      it("returns 0 pages when totalItems is 0 with perPage of 1", () => {
        expect(getTotalPages(0, 1)).toBe(0);
      });

      it("returns an empty array from getPageItems when items array is empty", () => {
        expect(getPageItems([], 1, 10)).toEqual([]);
      });

      it("returns an empty array from getPageItems for page 1 with empty items", () => {
        expect(getPageItems([], 1, 5)).toEqual([]);
      });

      it("reports page 1 as invalid when totalPages is 0", () => {
        expect(isValidPage(1, 0)).toBe(false);
      });
    });

    describe("page size exceeds total items", () => {
      it("returns 1 page when itemsPerPage is larger than totalItems", () => {
        expect(getTotalPages(3, 10)).toBe(1);
      });

      it("returns 1 page when itemsPerPage equals totalItems", () => {
        expect(getTotalPages(7, 7)).toBe(1);
      });

      it("returns all items on page 1 when itemsPerPage exceeds item count", () => {
        expect(getPageItems(items, 1, 100)).toEqual(items);
      });

      it("returns start index 0 when itemsPerPage exceeds item count", () => {
        expect(getStartIndex(1, 100)).toBe(0);
      });

      it("returns end index equal to itemsPerPage when it exceeds item count", () => {
        expect(getEndIndex(1, 100)).toBe(100);
      });
    });

    describe("requested page beyond last page", () => {
      it("returns an empty array for a page number far beyond the last page", () => {
        expect(getPageItems(items, 100, 3)).toEqual([]);
      });

      it("returns an empty array for page 2 when there is only 1 page", () => {
        expect(getPageItems(items, 2, 100)).toEqual([]);
      });

      it("reports an out-of-range page as invalid", () => {
        expect(isValidPage(4, 3)).toBe(false);
      });

      it("reports page 100 as invalid when totalPages is 3", () => {
        expect(isValidPage(100, 3)).toBe(false);
      });

      it("returns indices beyond array bounds for an out-of-range page in index helpers", () => {
        expect(getStartIndex(100, 3)).toBe(297);
        expect(getEndIndex(100, 3)).toBe(300);
      });
    });
  });
});
