/**
 * Pagination utility functions
 */

const MIN_PAGE = 1;
const MIN_ITEMS_PER_PAGE = 1;

const normalizePage = (page: number): number => {
  return Number.isFinite(page) ? Math.max(MIN_PAGE, Math.floor(page)) : MIN_PAGE;
};

const normalizeItemsPerPage = (itemsPerPage: number): number => {
  return Number.isFinite(itemsPerPage)
    ? Math.max(MIN_ITEMS_PER_PAGE, Math.floor(itemsPerPage))
    : MIN_ITEMS_PER_PAGE;
};

/**
 * Calculates the start index for pagination.
 * Guarantees a non-negative finite index by clamping page and page size inputs.
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
 * Guarantees a positive finite index by clamping page and page size inputs.
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
 * Guarantees a finite page count; invalid page sizes fall back to 1 item per page.
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @returns Total number of pages
 */
export const getTotalPages = (
  totalItems: number,
  itemsPerPage: number,
): number => {
  const safeTotalItems = Number.isFinite(totalItems)
    ? Math.max(0, Math.floor(totalItems))
    : 0;
  const safeItemsPerPage = normalizeItemsPerPage(itemsPerPage);

  return Math.ceil(safeTotalItems / safeItemsPerPage);
};

/**
 * Gets a slice of items for the current page.
 * Clamps invalid page and page-size inputs before slicing.
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
 * Checks if a page number is valid.
 * @param page - Page number to check
 * @param totalPages - Total number of pages
 * @returns True if page is valid, false otherwise
 */
export const isValidPage = (page: number, totalPages: number): boolean => {
  return Number.isFinite(page) && page >= MIN_PAGE && page <= totalPages;
};
