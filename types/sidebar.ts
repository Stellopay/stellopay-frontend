export interface SidebarContextProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
} 