import type { TransactionStatus } from '@/types/transaction';

// Define a centralized, typed color palette for transaction statuses
export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'bg-[#FFA500] text-[#000000]',
  confirmed: 'bg-[#4CAF50] text-[#FFFFFF]',
  failed: 'bg-[#F44336] text-[#FFFFFF]',
  completed: 'bg-[#2196F3] text-[#FFFFFF]',
  cancelled: 'bg-[#795548] text-[#FFFFFF]',
  unknown: 'bg-[#9E9E9E] text-[#FFFFFF]', // Visually distinct for unknown status
};

export function getStatusColor(status: TransactionStatus): string {
  return TRANSACTION_STATUS_COLORS[status] || TRANSACTION_STATUS_COLORS.unknown;
}