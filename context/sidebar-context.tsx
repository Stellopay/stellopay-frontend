"use client";
import {
  createContext,
  FC,
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

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
  // Initialize with a default; hydrate from localStorage on the client.
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(true);

  // Hydrate sidebar open state from localStorage on the client.
  useEffect(() => {
    const savedState = safeStorage.getItem("sidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpenState(savedState === "true");
    }
  }, []);

  // Screen size tracking (value is only used to drive the isMobile flag below)
  const [, setScreenSize] = useState<number | undefined>(undefined);
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

  // Persist sidebar state to localStorage when it changes
  useEffect(() => {
    safeStorage.setItem("sidebarOpen", isSidebarOpen.toString());
  }, [isSidebarOpen]);

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
