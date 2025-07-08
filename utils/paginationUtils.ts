/**
 * Pagination utility functions
 */

/**
 * Calculates the start index for pagination
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns Start index for the current page
 */
export const getStartIndex = (currentPage: number, itemsPerPage: number): number => {
  return (currentPage - 1) * itemsPerPage;
};

/**
 * Calculates the end index for pagination
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns End index for the current page
 */
export const getEndIndex = (currentPage: number, itemsPerPage: number): number => {
  return currentPage * itemsPerPage;
};

/**
 * Calculates the total number of pages
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @returns Total number of pages
 */
export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage);
};

/**
 * Gets a slice of items for the current page
 * @param items - Array of all items
 * @param currentPage - Current page number (1-based)
 * @param itemsPerPage - Number of items per page
 * @returns Array of items for the current page
 */
export const getPageItems = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
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