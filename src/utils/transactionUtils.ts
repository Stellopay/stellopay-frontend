import type { TransactionStatus } from '@/types/transaction';

const STATUS_COLOR_PALETTE: Record<TransactionStatus, string> = {
  pending: 'bg-[#FFA500] text-[#000000]',
  confirmed: 'bg-[#4CAF50] text-[#FFFFFF]',
  failed: 'bg-[#F44336] text-[#FFFFFF]',
  refunded: 'bg-[#2196F3] text-[#FFFFFF]',
  cancelled: 'bg-[#795548] text-[#FFFFFF]',
  unknown: 'bg-[#9E9E9E] text-[#FFFFFF]', // Visually distinct default
};

export function getStatusColor(status: TransactionStatus) {
  return STATUS_COLOR_PALETTE[status] ?? STATUS_COLOR_PALETTE.unknown;
}