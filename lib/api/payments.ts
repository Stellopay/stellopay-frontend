/**
 * Payments API client with batch submission mock.
 */

export interface BatchPaymentItem {
  address: string;
  amount: string;
  asset: string;
  memo?: string;
}

export interface SubmitBatchPayload {
  items: BatchPaymentItem[];
  batchName?: string;
}

export interface SubmitBatchResponse {
  success: boolean;
  batchId: string;
  totalPayments: number;
  submittedAt: string;
  message: string;
}

/**
 * Submits a batch payment for processing.
 *
 * Simulates network transmission and queues the batch on the mock backend.
 *
 * @param payload - Batch items and optional batch description.
 * @returns Details of the queued batch.
 */
export async function submitBatch(payload: SubmitBatchPayload): Promise<SubmitBatchResponse> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!payload.items || payload.items.length === 0) {
    throw new Error("Cannot submit an empty payment batch.");
  }

  const batchId = "batch_" + Math.random().toString(36).substring(2, 10);
  const submittedAt = new Date().toISOString();

  return {
    success: true,
    batchId,
    totalPayments: payload.items.length,
    submittedAt,
    message: `Batch ${batchId} with ${payload.items.length} payments queued successfully.`,
  };
}
