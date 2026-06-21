import type { TransactionStatus } from '@/types/transaction';

const STATUS_COLOR_PALETTE: Record<TransactionStatus, string> = {
  pending: 'bg-[#FFA500] text-[#FFFFFF]',
  processing: 'bg-[#4CAF50] text-[#FFFFFF]',
  completed: 'bg-[#2196F3] text-[#FFFFFF]',
  failed: 'bg-[#F44336] text-[#FFFFFF]',
  cancelled: 'bg-[#795548] text-[#FFFFFF]',
  refunded: 'bg-[#9C27B0] text-[#FFFFFF]',
  unknown: 'bg-[#666666] text-[#FFFFFF]', // Visually distinct default
};

export function getStatusColor(status: TransactionStatus): string {
  return STATUS_COLOR_PALETTE[status] ?? STATUS_COLOR_PALETTE.unknown;
}