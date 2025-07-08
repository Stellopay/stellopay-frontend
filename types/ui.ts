// UI component prop types
export interface ButtonProps {
  text: string | React.ReactNode;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  width?: string;
  height?: string;
  fill?: boolean;
  type?: "button" | "submit" | "reset";
}

export interface TextInputProps {
  label?: string;
  value: string;
  icon?: React.ReactNode;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}

export interface TextareaInputProps {
  label?: string;
  value: string;
  icon?: React.ReactNode;
  placeholder?: string;
  onChange: (value: string) => void;
  rows?: number;
}

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
}

export interface FaqCardProps {
  title: string;
  subtitle: string;
  link?: string;
}

export interface SupportTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children?: React.ReactNode;
}

export interface ToggleCardProps {
  // ...copy from components/common/ToggleCard.tsx
}

export interface NotificationProps {
  // ...copy from components/common/NotificationPanel.tsx
}

export interface AppLayoutProps {
  children: React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface TransactionsPaginationProps {
  totalItems: number;
  currentPage?: number;
  itemsPerPage?: number;
} 