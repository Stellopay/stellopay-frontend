export type NotificationCategory =
  | "payment"
  | "payroll"
  | "security"
  | "system"
  | "general";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  timestamp: string; // ISO date string
}