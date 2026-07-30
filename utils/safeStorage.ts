/**
 * Safe localStorage wrapper that handles SSR, unavailable storage, and quota-related write failures.
 * Never stores secrets in localStorage.
 * Reads remain safe even if a write fails because the browser refuses the update.
 */
export const STORAGE_KEYS = {
  DASHBOARD_TOUR_COMPLETED: "stellopay_dashboard_tour_completed",
} as const;

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
   * Returns true when the write succeeds and false when the browser refuses it.
   * This includes storage-unavailable scenarios and quota-exceeded writes, which are distinct
   * from the read path and should not surface as uncaught exceptions.
   * @param key - The key of the item to set.
   * @param value - The value to store.
   */
  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Safely removes an item from localStorage.
   * @param key - The key of the item to remove.
   */
  removeItem: (key: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Helper to check if the dashboard first-login tour has been completed.
   */
  isDashboardTourCompleted: (): boolean => {
    return safeStorage.getItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED) === "true";
  },

  /**
   * Helper to mark the dashboard first-login tour as completed.
   */
  setDashboardTourCompleted: (): boolean => {
    return safeStorage.setItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED, "true");
  },
};

