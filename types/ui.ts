import React from "react";

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
  title: string;
}

export interface NotificationProps {
  className?: string;
  notifications: import("./notification-item").NotificationItem[];
}

export interface AppLayoutProps {
  children: React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number
  onPageChange: (page: number) => void;
}

export interface TransactionsPaginationProps {
  totalItems: number;
  currentPage?: number;
  itemsPerPage?: number;
}

// UI library component types
export type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof import("@/components/ui/button").Button>, "size"> &
  React.ComponentProps<"a">;

export type FormItemContextValue = {
  id: string;
}; 