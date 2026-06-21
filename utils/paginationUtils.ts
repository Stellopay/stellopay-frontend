/**
 * Pagination utility functions
 */

const MIN_PAGE = 1;
const MIN_ITEMS_PER_PAGE = 1;

const normalizePage = (currentPage: number): number => {
  if (!Number.isFinite(currentPage)) return MIN_PAGE;
  return Math.max(MIN_PAGE, Math.floor(currentPage));
};

const normalizeItemsPerPage = (itemsPerPage: number): number => {
  if (!Number.isFinite(itemsPerPage)) return MIN_ITEMS_PER_PAGE;
  return Math.max(MIN_ITEMS_PER_PAGE, Math.floor(itemsPerPage));
};

/**
 * Calculates the start index for pagination.
 * Guarantees a non-negative finite index by clamping page to at least 1
 * and itemsPerPage to at least 1.
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns Start index for the current page
 */
export const getStartIndex = (
  currentPage: number,
  itemsPerPage: number,
): number => {
  const safePage = normalizePage(currentPage);
  const safeItemsPerPage = normalizeItemsPerPage(itemsPerPage);
  return (safePage - 1) * safeItemsPerPage;
};

/**
 * Calculates the end index for pagination.
 * Guarantees a positive finite index by clamping page to at least 1
 * and itemsPerPage to at least 1.
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns End index for the current page
 */
export const getEndIndex = (
  currentPage: number,
  itemsPerPage: number,
): number => {
  const safePage = normalizePage(currentPage);
  const safeItemsPerPage = normalizeItemsPerPage(itemsPerPage);
  return safePage * safeItemsPerPage;
};

/**
 * Calculates the total number of pages.
 * Returns a finite integer and treats invalid or non-positive page sizes as 1.
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @returns Total number of pages
 */
export const getTotalPages = (
  totalItems: number,
  itemsPerPage: number,
): number => {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 0;
  return Math.ceil(totalItems / normalizeItemsPerPage(itemsPerPage));
};

/**
 * Gets a slice of items for the current page.
 * Negative and non-finite page values are clamped to page 1; invalid page
 * sizes are clamped to 1 so slices never use Infinity or negative offsets.
 * @param items - Array of all items
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns Array of items for the current page
 */
export const getPageItems = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number,
): T[] => {
  const startIndex = getStartIndex(currentPage, itemsPerPage);
  const endIndex = getEndIndex(currentPage, itemsPerPage);
  return items.slice(startIndex, endIndex);
};

/**
 * Checks if a page number is valid
 * @param page - Page number to check
 * @param totalPages - Total number of pages
 * @returns True if page is valid, false otherwise
 */
export const isValidPage = (page: number, totalPages: number): boolean => {
  return page >= 1 && page <= totalPages;
};
