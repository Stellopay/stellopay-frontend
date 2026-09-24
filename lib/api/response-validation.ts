/** Runtime validation for data received from API and realtime transports. */
import { z, ZodError } from "zod";

import type {
  AccountSummary,
  CursorPaginatedTransactions,
  PaginatedTransactions,
} from "./transactions";
import type { Transaction } from "@/types/transaction";
import type { NotificationItem } from "@/types/notification-item";

/** A recoverable error: callers may show an error state and safely retry. */
export class ApiResponseValidationError extends Error {
  readonly code = "INVALID_API_RESPONSE" as const;
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(resource: string, error: ZodError) {
    super(`Received an invalid ${resource} response. Please try again.`);
    this.name = "ApiResponseValidationError";
    this.issues = error.issues.map((issue) => ({
      path: issue.path.join(".") || "response",
      message: issue.message,
    }));
  }
}

const nonEmptyString = z.string().trim().min(1);
const finiteNumber = z.number().refine(Number.isFinite, "Expected a finite number");
const isoDateTime = nonEmptyString.refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Expected an ISO date-time string",
);

// z.object strips unknown keys by default. This lets a partially deployed API
// add fields without making the UI depend on them.
const transactionSchema = z.object({
  id: nonEmptyString, type: nonEmptyString, txId: nonEmptyString,
  address: nonEmptyString, date: nonEmptyString, time: nonEmptyString,
  token: nonEmptyString, amount: finiteNumber, status: nonEmptyString,
  statusColor: z.enum(["success", "warning", "destructive"]), memo: z.string().optional(),
});
const paginatedTransactionsSchema = z.object({
  data: z.array(transactionSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), pageSize: z.number().int().positive(),
  totalPages: z.number().int().positive(),
});
const cursorPaginatedTransactionsSchema = z.object({
  data: z.array(transactionSchema), total: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(), hasMore: z.boolean(),
});
const accountSummarySchema = z.object({
  balance: nonEmptyString, balanceRaw: finiteNumber, paidThisMonth: nonEmptyString,
  paidThisMonthCount: z.number().int().nonnegative(), toBePaid: nonEmptyString,
  toBePaidCount: z.number().int().nonnegative(), walletAddress: nonEmptyString,
});
const notificationSchema = z.object({
  id: nonEmptyString, title: nonEmptyString, message: nonEmptyString, read: z.boolean(),
  timestamp: isoDateTime.optional(), category: z.string().optional(), readAt: isoDateTime.optional(),
});

function parse<T>(schema: z.ZodType<T>, input: unknown, resource: string): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiResponseValidationError(resource, result.error);
  return result.data;
}

export const parseTransaction = (input: unknown): Transaction => parse(transactionSchema, input, "transaction");
export const parsePaginatedTransactions = (input: unknown): PaginatedTransactions => parse(paginatedTransactionsSchema, input, "transactions");
export const parseCursorPaginatedTransactions = (input: unknown): CursorPaginatedTransactions => parse(cursorPaginatedTransactionsSchema, input, "transactions");
export const parseAccountSummary = (input: unknown): AccountSummary => parse(accountSummarySchema, input, "account summary");
export const parseNotifications = (input: unknown): NotificationItem[] => parse(z.array(notificationSchema), input, "notifications");
export const parseNotification = (input: unknown): NotificationItem => parse(notificationSchema, input, "notification");

const streamEnvelopeSchema = z.object({ type: z.enum(["transaction", "account-summary", "notification"]), payload: z.unknown() });
export type ValidatedStreamPayload =
  | { type: "transaction"; payload: Transaction }
  | { type: "account-summary"; payload: AccountSummary }
  | { type: "notification"; payload: NotificationItem };

/** Validate a realtime envelope before a subscriber is allowed to update state. */
export function parseStreamPayload(input: unknown): ValidatedStreamPayload {
  const envelope = parse(streamEnvelopeSchema, input, "stream");
  switch (envelope.type) {
    case "transaction": return { type: envelope.type, payload: parseTransaction(envelope.payload) };
    case "account-summary": return { type: envelope.type, payload: parseAccountSummary(envelope.payload) };
    case "notification": return { type: envelope.type, payload: parseNotification(envelope.payload) };
  }
}
