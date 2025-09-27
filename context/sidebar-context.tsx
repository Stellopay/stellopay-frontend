"use client";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import type {
  SidebarContextProps,
  SidebarProviderProps,
} from "@/types/sidebar";

const SidebarContext = createContext<SidebarContextProps | null>(null);

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
  // Initialize with localStorage value if available, default to true otherwise
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebarOpen");
      return savedState !== null ? savedState === "true" : true;
    }
    return true;
  });

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

  // Persist sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", isSidebarOpen.toString());
    }
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
