/**
 * Navigation utility functions
 */

/**
 * Checks if a route is currently active based on the current pathname
 * @param route - The route to check
 * @param pathname - The current pathname
 * @returns True if the route is active, false otherwise
 */
export const isLinkActive = (route: string, pathname: string): boolean => {
  if (route === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(route);
};

/**
 * Determines if the sidebar should be expanded based on mobile state and sidebar state
 * @param isMobile - Whether the device is mobile
 * @param isSidebarOpen - Whether the sidebar is open
 * @returns True if sidebar should be expanded, false otherwise
 */
export const shouldExpandSidebar = (
  isMobile: boolean,
  isSidebarOpen: boolean,
): boolean => {
  return isMobile || (isSidebarOpen && !isMobile);
};

/**
 * Gets the appropriate layout ID for active link animation based on device type
 * @param isMobile - Whether the device is mobile
 * @param isExpanded - Whether the sidebar is expanded
 * @returns Layout ID string for animation
 */
export const getActiveLinkLayoutId = (
  isMobile: boolean,
  isExpanded: boolean,
): string => {
  if (isMobile) {
    return "activeLink-mobile";
  }
  return isExpanded ? "activeLink-desktop" : "activeLink-collapsed";
};
