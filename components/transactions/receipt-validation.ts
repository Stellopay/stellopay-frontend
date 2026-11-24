import { z, type ZodError } from "zod";

/** Bounds the text sent to PDF layout, filenames and the verification QR code. */
export const RECEIPT_FIELD_LIMITS = {
  id: 256,
  hash: 256,
  amount: 128,
  counterparty: 512,
  timestamp: 64,
} as const;

function receiptText(limit: number) {
  return z
    .string()
    .max(limit, `Use at most ${limit} characters.`)
    .refine((value) => value.trim().length > 0, "Provide a non-empty string.");
}

const receiptSchema = z.object({
  id: receiptText(RECEIPT_FIELD_LIMITS.id),
  hash: receiptText(RECEIPT_FIELD_LIMITS.hash),
  amount: receiptText(RECEIPT_FIELD_LIMITS.amount),
  counterparty: receiptText(RECEIPT_FIELD_LIMITS.counterparty),
  // The table supplies a display date/time; retain every format Date supports.
  timestamp: receiptText(RECEIPT_FIELD_LIMITS.timestamp).refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Provide a valid date and time.",
  ),
});

export class ReceiptValidationError extends Error {
  readonly code = "INVALID_RECEIPT_INPUT" as const;
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(error: ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join(".") || "transaction",
      message: issue.message,
    }));
    super(
      `Invalid receipt input: ${issues.map(({ path, message }) => `${path}: ${message}`).join("; ")}`,
    );
    this.name = "ReceiptValidationError";
    this.issues = issues;
  }
}

/** Validate without state writes, coercion, or normalization of valid input. */
export function getReceiptValidationError(
  input: unknown,
): ReceiptValidationError | null {
  const result = receiptSchema.safeParse(input);
  return result.success ? null : new ReceiptValidationError(result.error);
}
