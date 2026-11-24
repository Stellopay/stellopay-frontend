import { describe, expect, it } from "vitest";
import {
  createPayment,
  DEFAULT_ACCOUNT_BALANCES,
  getAccountBalances,
  PaymentApiError,
} from "./payments";

const SENDER_ADDRESS =
  "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const RECIPIENT_ADDRESS =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("lib/api/payments", () => {
  it("returns account balances", async () => {
    const balances = await getAccountBalances();
    expect(balances.length).toBeGreaterThanOrEqual(2);
    expect(balances[0]?.code).toBe("USDC");
  });

  it("creates a valid payment and normalizes addresses and amounts", async () => {
    const result = await createPayment(
      {
        senderAddress: SENDER_ADDRESS,
        recipient: `  ${RECIPIENT_ADDRESS.toLowerCase()}  `,
        assetCode: "USDC",
        amount: "125.5000000",
        memo: "Invoice #901",
        networkId: "stellar",
      },
      { latencyMs: 0 },
    );

    expect(result.recipient).toBe(RECIPIENT_ADDRESS);
    expect(result.senderAddress).toBe(SENDER_ADDRESS);
    expect(result.amount).toBe("125.5");
    expect(result.assetCode).toBe("USDC");
    expect(result.feeXlm).toBe("0.00001");
    expect(result.memo).toBe("Invoice #901");
    expect(result.status).toBe("Completed");
    expect(result.id).toMatch(/^pay-/);
  });

  it("rejects self-addressed payments", async () => {
    await expect(
      createPayment(
        {
          senderAddress: SENDER_ADDRESS,
          recipient: SENDER_ADDRESS,
          assetCode: "USDC",
          amount: "10",
          networkId: "stellar",
        },
        { latencyMs: 0 },
      ),
    ).rejects.toThrowError(/cannot send a payment to your own connected wallet/i);
  });

  it("rejects invalid recipient addresses and secret keys", async () => {
    await expect(
      createPayment(
        {
          senderAddress: SENDER_ADDRESS,
          recipient: "SAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDGD",
          assetCode: "USDC",
          amount: "10",
          networkId: "stellar",
        },
        { latencyMs: 0 },
      ),
    ).rejects.toThrow(PaymentApiError);
  });

  it("rejects over-balance and minimum-reserve-breaching payments", async () => {
    await expect(
      createPayment(
        {
          senderAddress: SENDER_ADDRESS,
          recipient: RECIPIENT_ADDRESS,
          assetCode: "USDC",
          amount: "999999",
          networkId: "stellar",
        },
        { latencyMs: 0, balances: DEFAULT_ACCOUNT_BALANCES },
      ),
    ).rejects.toMatchObject({
      code: "insufficient_balance",
    });

    // XLM balance is 1250.5, min reserve is 1 XLM, fee is 0.00001 XLM
    await expect(
      createPayment(
        {
          senderAddress: SENDER_ADDRESS,
          recipient: RECIPIENT_ADDRESS,
          assetCode: "XLM",
          amount: "1250",
          networkId: "stellar",
        },
        { latencyMs: 0, balances: DEFAULT_ACCOUNT_BALANCES },
      ),
    ).rejects.toMatchObject({
      code: "reserve_breach",
    });
  });

  it("supports AbortSignal cancellation before and during flight", async () => {
    const preAborted = new AbortController();
    preAborted.abort();

    await expect(
      createPayment(
        {
          senderAddress: SENDER_ADDRESS,
          recipient: RECIPIENT_ADDRESS,
          assetCode: "USDC",
          amount: "10",
          networkId: "stellar",
        },
        preAborted.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });

    const inFlightController = new AbortController();
    const promise = createPayment(
      {
        senderAddress: SENDER_ADDRESS,
        recipient: RECIPIENT_ADDRESS,
        assetCode: "USDC",
        amount: "10",
        networkId: "stellar",
      },
      { signal: inFlightController.signal, latencyMs: 200 },
    );

    setTimeout(() => inFlightController.abort(), 10);
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });
});
