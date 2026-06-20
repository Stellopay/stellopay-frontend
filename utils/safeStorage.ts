/**
 * Safe localStorage wrapper that handles SSR and quota errors.
 * Never stores secrets in localStorage.
 * Swallows storage exceptions without leaking errors.
 */
export const safeStorage = {
  /**
   * Safely retrieves an item from localStorage.
   * @param key - The key of the item to retrieve.
   * @returns The value of the item, or null if the key does not exist or an error occurs.
   */
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null; // Swallow errors (e.g. privacy mode)
    }
  },
  
  /**
   * Safely sets an item in localStorage.
   * @param key - The key of the item to set.
   * @param value - The value to store.
   */
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Swallow errors (e.g. quota exceeded)
    }
  },
  
  /**
   * Safely removes an item from localStorage.
   * @param key - The key of the item to remove.
   */
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Swallow errors
    }
  }
};
