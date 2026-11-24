import { notFound } from "next/navigation";

import { TransactionDetailView } from "@/components/transactions/transaction-detail-view";
import { getTransactionById, TransactionNotFoundError } from "@/lib/api";
import type { Transaction } from "@/types/transaction";

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let transaction: Transaction;

  try {
    transaction = await getTransactionById(id);
  } catch (error) {
    if (error instanceof TransactionNotFoundError) notFound();
    throw error;
  }

  return <TransactionDetailView transaction={transaction} />;
}
