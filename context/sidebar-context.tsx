"use client";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { safeStorage } from "@/utils/safeStorage";
import type {
  SidebarContextProps,
  SidebarProviderProps,
} from "@/types/sidebar";

const SidebarContext = createContext<SidebarContextProps | null>(null);
const SIDEBAR_OPEN_STORAGE_KEY = "sidebarOpen";

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
  // Initialize with a default; hydrate from localStorage on the client.
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(true);
  const [hasHydratedSidebarState, setHasHydratedSidebarState] = useState(false);

  // Hydrate sidebar open state from localStorage on the client.
  useEffect(() => {
    const savedState = safeStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
    if (savedState === "true" || savedState === "false") {
      setIsSidebarOpenState(savedState === "true");
    }
    setHasHydratedSidebarState(true);
  }, []);

  // Screen size tracking
  const [screenSize, setScreenSize] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      const width = window.innerWidth;
      setScreenSize(width);
      setIsMobile(width < 768); // Standard md breakpoint
    }

    // Set size at the first client-side load
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Do not overwrite a saved preference with the SSR-safe default before hydration.
  useEffect(() => {
    if (!hasHydratedSidebarState) return;

    safeStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, isSidebarOpen.toString());
  }, [hasHydratedSidebarState, isSidebarOpen]);

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpenState(open);
  };

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, setSidebarOpen, isMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export default useSidebar;
