import {
  ApiResponseValidationError,
  parseAccountSummary,
  parseNotifications,
  parsePaginatedTransactions,
  parseStreamPayload,
} from "./response-validation";

const transaction = {
  id: "tx-1", type: "Payment Sent", txId: "stellar-1", address: "GABC",
  date: "2026-01-01", time: "10:00", token: "USDC", amount: 12.5,
  status: "Completed", statusColor: "success",
};
const summary = {
  balance: "$ 12.50 USDC", balanceRaw: 12.5, paidThisMonth: "$ 1 USDC",
  paidThisMonthCount: 1, toBePaid: "$ 0", toBePaidCount: 0, walletAddress: "GABC",
};
const notification = {
  id: "notice-1", title: "Payment received", message: "Your payment arrived", read: false,
  timestamp: "2026-01-01T10:00:00.000Z",
};

describe("API response validation", () => {
  it("accepts valid payloads and drops unknown fields", () => {
    const page = parsePaginatedTransactions({
      data: [{ ...transaction, serverOnly: "ignored" }], total: 1, page: 1, pageSize: 10, totalPages: 1,
      deploymentMetadata: { version: "next" },
    });
    expect(page.data[0]).toEqual(transaction);
    expect(page).not.toHaveProperty("deploymentMetadata");
    expect(parseAccountSummary({ ...summary, addedLater: true })).toEqual(summary);
    expect(parseNotifications([{ ...notification, extra: 42 }])).toEqual([notification]);
  });

  it.each([
    ["missing transaction identity", () => parsePaginatedTransactions({ data: [{ ...transaction, id: undefined }], total: 1, page: 1, pageSize: 1, totalPages: 1 })],
    ["wrong money type", () => parseAccountSummary({ ...summary, balanceRaw: "12.5" })],
    ["invalid notification field", () => parseNotifications([{ ...notification, read: "false" }])],
    ["invalid stream payload", () => parseStreamPayload({ type: "transaction", payload: { ...transaction, amount: Number.NaN } })],
  ])("returns a typed recoverable error for %s", (_label, parse) => {
    expect(parse).toThrow(ApiResponseValidationError);
    try { parse(); } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_API_RESPONSE" });
    }
  });

  it("validates stream payloads before exposing them", () => {
    expect(parseStreamPayload({ type: "notification", payload: notification })).toEqual({
      type: "notification", payload: notification,
    });
  });
});
