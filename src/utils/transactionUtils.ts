import type { TransactionStatus } from '@/types/transaction';

// Define a centralized, typed color palette for transaction statuses
export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'bg-[#FFA500] text-[#000000]',
  confirmed: 'bg-[#4CAF50] text-[#FFFFFF]',
  failed: 'bg-[#F44336] text-[#FFFFFF]',
  refunded: 'bg-[#2196F3] text-[#FFFFFF]',
  settled: 'bg-[#9C27B0] text-[#FFFFFF]',
  // Default/unknown status with a distinct neutral tone
  unknown: 'bg-[#616161] text-[#FFFFFF]',
};

export function getStatusColor(status: TransactionStatus): string {
  return TRANSACTION_STATUS_COLORS[status] ?? TRANSACTION_STATUS_COLORS.unknown;
}