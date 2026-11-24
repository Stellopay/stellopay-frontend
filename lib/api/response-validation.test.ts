import {
  ApiResponseValidationError,
  parseAccountSummary,
  parseHorizonAccount,
  parseNotifications,
  parsePaginatedTransactions,
  parseStreamPayload,
} from "./response-validation";

const transaction = {
  id: "tx-1", type: "Payment Sent", txId: "stellar-1", address: "GABC",
  date: "2026-01-01", time: "10:00", token: "USDC", amount: 12.5,
  status: "Completed", statusColor: "success",
};
const accountBalance = {
  assetCode: "XLM", assetType: "native", assetIssuer: null, balance: "12.5000000",
  limit: null, isAuthorized: null, buyingLiabilities: "0", sellingLiabilities: "0",
};
const summary = {
  balance: "$ 12.50 USDC", balanceRaw: 12.5, paidThisMonth: "$ 1 USDC",
  paidThisMonthCount: 1, toBePaid: "$ 0", toBePaidCount: 0, walletAddress: "GABC",
  source: "mock", network: "stellar", nativeBalance: "12.5000000",
  spendableBalance: "11.5000000", isUnfunded: false,
  balances: [accountBalance], trustlines: [],
};
const horizonAccount = {
  id: "GABC", account_id: "GABC", subentry_count: 1,
  balances: [
    { asset_type: "native", balance: "72.8563792", buying_liabilities: "0.0000000", selling_liabilities: "1.0000000" },
    { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: "GISSUER", balance: "3.0000000", limit: "922337203685.4775807", is_authorized: true },
  ],
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

  it("validates a Horizon account while preserving amount strings", () => {
    expect(parseHorizonAccount(horizonAccount)).toEqual({
      ...horizonAccount,
      balances: [
        {
          ...horizonAccount.balances[0],
          buying_liabilities: "0.0000000",
          selling_liabilities: "1.0000000",
        },
        horizonAccount.balances[1],
      ],
    });
  });

  it.each([
    ["a scientific-notation balance", { ...horizonAccount, balances: [{ asset_type: "native", balance: "1e7" }] }],
    ["a negative balance", { ...horizonAccount, balances: [{ asset_type: "native", balance: "-1.0000000" }] }],
    ["a missing subentry count", { ...horizonAccount, subentry_count: undefined }],
  ])("rejects Horizon payloads with %s", (_label, payload) => {
    expect(() => parseHorizonAccount(payload)).toThrow(ApiResponseValidationError);
  it("validates optional transaction detail fields", () => {
    const details = {
      ...transaction,
      counterparty: "GDESTINATION",
      fee: "0.01 XLM",
      hash: "stellar-hash",
      tags: ["Payroll"],
    };

    expect(parsePaginatedTransactions({
      data: [details], total: 1, page: 1, pageSize: 1, totalPages: 1,
    }).data[0]).toMatchObject(details);
    expect(() => parsePaginatedTransactions({
      data: [{ ...details, tags: [42] }],
      total: 1, page: 1, pageSize: 1, totalPages: 1,
    })).toThrow(ApiResponseValidationError);
  });
});
