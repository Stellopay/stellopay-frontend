import type { TransactionStatus } from '@/types/transaction';

// Define a centralized, typed color palette for transaction statuses
export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'bg-[#FFA500] text-[#000000]',
  processing: 'bg-[#4CAF50] text-[#FFFFFF]',
  completed: 'bg-[#2196F3] text-[#FFFFFF]',
  failed: 'bg-[#F44336] text-[#FFFFFF]',
  cancelled: 'bg-[#795548] text-[#FFFFFF]',
  refunded: 'bg-[#9C27B0] text-[#FFFFFF]',
  // Default/unknown status with a distinct visual style
  unknown: 'bg-[#607D8B] text-[#FFFFFF]',
};

export function getStatusColor(status: TransactionStatus): string {
  return TRANSACTION_STATUS_COLORS[status] ?? TRANSACTION_STATUS_COLORS.unknown;
}