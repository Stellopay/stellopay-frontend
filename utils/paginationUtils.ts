/**
 * Pagination utility functions
 *
 * Guaranteed invariants:
 * - `itemsPerPage` is always normalized to a finite integer in the range
 *   `[MIN_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE]`. Values that are missing, `NaN`,
 *   non-finite, or `<= 0` fall back to `MIN_ITEMS_PER_PAGE`; values above
 *   `MAX_ITEMS_PER_PAGE` are capped. This also protects callers that source
 *   `itemsPerPage` from an untrusted URL query parameter from triggering a
 *   resource-exhaustion DoS via an absurdly large page size.
 * - `currentPage` passed to {@link getStartIndex} / {@link getEndIndex} is
 *   always normalized to a finite integer of at least `MIN_PAGE`.
 * - {@link getTotalPages} never returns `Infinity` or `NaN`; it returns `0`
 *   when there are no items.
 */

/** Smallest allowed items-per-page value. Non-positive or invalid inputs fall back to this. */
export const MIN_ITEMS_PER_PAGE = 1;

/**
 * Largest allowed items-per-page value. Guards against resource-exhaustion
 * when `itemsPerPage` originates from an untrusted source (e.g. a URL query
 * parameter such as `?itemsPerPage=999999999`).
 */
export const MAX_ITEMS_PER_PAGE = 1000;

/** Smallest allowed page number. */
export const MIN_PAGE = 1;

/**
 * Normalizes a raw items-per-page value into a safe, finite integer within
 * `[MIN_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE]`. Use this to sanitize values
 * sourced from untrusted input (e.g. URL query parameters) before they reach
 * pagination math or data-fetching code.
 * @param itemsPerPage - Raw items-per-page value, possibly untrusted
 * @returns A finite integer clamped to the safe range
 */
export const normalizeItemsPerPage = (itemsPerPage: number): number => {
  if (!Number.isFinite(itemsPerPage)) {
    return MIN_ITEMS_PER_PAGE;
  }
  const truncated = Math.trunc(itemsPerPage);
  return Math.min(Math.max(truncated, MIN_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
};

/**
 * Normalizes a raw page number into a finite integer no smaller than
 * `MIN_PAGE`. Use this to sanitize values sourced from untrusted input
 * (e.g. URL query parameters).
 * @param page - Raw page value, possibly untrusted
 * @returns A finite integer clamped to at least `MIN_PAGE`
 */
export const normalizePage = (page: number): number => {
  if (!Number.isFinite(page)) {
    return MIN_PAGE;
  }
  return Math.max(Math.trunc(page), MIN_PAGE);
};

/**
 * Calculates the start index for pagination.
 * `currentPage` is clamped to at least `MIN_PAGE` and `itemsPerPage` is
 * normalized via {@link normalizeItemsPerPage}, so this never produces a
 * negative index.
 * @param currentPage - Current page number (1-based); negative/zero/non-finite values are clamped to `MIN_PAGE`
 * @param itemsPerPage - Number of items per page; values `<= 0` or out of range are normalized
 * @returns Start index for the current page (always `>= 0`)
 */
export const getStartIndex = (
  currentPage: number,
  itemsPerPage: number,
): number => {
  const page = normalizePage(currentPage);
  const perPage = normalizeItemsPerPage(itemsPerPage);
  return (page - 1) * perPage;
};

/**
 * Calculates the end index for pagination.
 * `currentPage` is clamped to at least `MIN_PAGE` and `itemsPerPage` is
 * normalized via {@link normalizeItemsPerPage}, so this never produces a
 * negative or non-finite index.
 * @param currentPage - Current page number (1-based); negative/zero/non-finite values are clamped to `MIN_PAGE`
 * @param itemsPerPage - Number of items per page; values `<= 0` or out of range are normalized
 * @returns End index (exclusive) for the current page (always `>= itemsPerPage`)
 */
export const getEndIndex = (
  currentPage: number,
  itemsPerPage: number,
): number => {
  const page = normalizePage(currentPage);
  const perPage = normalizeItemsPerPage(itemsPerPage);
  return page * perPage;
};

/**
 * Calculates the total number of pages.
 * Guaranteed to never return `Infinity` or `NaN`: an `itemsPerPage <= 0` (or
 * non-finite) is normalized to a safe minimum instead of dividing by zero,
 * and a non-positive or non-finite `totalItems` yields `0` pages.
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page; values `<= 0` or out of range are normalized
 * @returns Total number of pages (always a finite, non-negative integer)
 */
export const getTotalPages = (
  totalItems: number,
  itemsPerPage: number,
): number => {
  if (!Number.isFinite(totalItems) || totalItems <= 0) {
    return 0;
  }
  const perPage = normalizeItemsPerPage(itemsPerPage);
  return Math.ceil(totalItems / perPage);
};

/**
 * Gets a slice of items for the current page.
 * Pages `<= 0` return an empty array rather than being clamped to page 1, so
 * callers can distinguish "no page selected" from "first page". `itemsPerPage`
 * is normalized via {@link normalizeItemsPerPage}, so this never throws or
 * returns an unbounded slice even for huge or invalid inputs.
 * @param items - Array of all items
 * @param currentPage - Current page number (1-based); pages `<= 0` yield an empty array
 * @param itemsPerPage - Number of items per page; values `<= 0` or out of range are normalized
 * @returns Array of items for the current page
 */
export const getPageItems = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number,
): T[] => {
  if (!Number.isFinite(currentPage) || currentPage <= 0) {
    return [];
  }
  const startIndex = getStartIndex(currentPage, itemsPerPage);
  const endIndex = getEndIndex(currentPage, itemsPerPage);
  return items.slice(startIndex, endIndex);
};

/**
 * Checks if a page number is valid.
 * @param page - Page number to check
 * @param totalPages - Total number of pages
 * @returns True if page is a finite integer within `[1, totalPages]`, false otherwise
 */
export const isValidPage = (page: number, totalPages: number): boolean => {
  return Number.isFinite(page) && page >= 1 && page <= totalPages;
};
