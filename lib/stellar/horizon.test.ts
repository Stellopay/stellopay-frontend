import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Network } from "@/types/wallet";
import { ApiResponseValidationError } from "@/lib/api/response-validation";
import {
  calculateSpendableBalance,
  formatXlmAmount,
  getAccount,
  getHorizonBaseUrl,
  HORIZON_BASE_URLS,
  HORIZON_MAX_RETRIES,
  HORIZON_REQUEST_TIMEOUT_MS,
  HORIZON_RETRY_DELAY_MS,
  HorizonAccountNotFoundError,
  HorizonApiError,
  isHorizonNetworkId,
} from "./horizon";

const address = "GABC";
const mainnet: Network = { id: "stellar", name: "Stellar" };
const testnet: Network = { id: "testnet", name: "Testnet" };
const futurenet: Network = { id: "futurenet", name: "Futurenet" };

const rawAccount = {
  id: address,
  account_id: address,
  subentry_count: 1,
  balances: [
    {
      asset_type: "native",
      balance: "72.8563792",
      buying_liabilities: "0.0000000",
      selling_liabilities: "1.0000000",
    },
    {
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "GISSUER",
      balance: "3.0000000",
      limit: "922337203685.4775807",
      is_authorized: true,
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function hangingFetch(): void {
  vi.mocked(fetch).mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
  );
}

describe("Horizon configuration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("selects the base URL for every supported network", () => {
    expect(getHorizonBaseUrl(mainnet)).toBe("https://horizon.stellar.org");
    expect(getHorizonBaseUrl(testnet)).toBe(
      "https://horizon-testnet.stellar.org",
    );
    expect(getHorizonBaseUrl(futurenet)).toBe(
      "https://horizon-futurenet.stellar.org",
    );
    expect(isHorizonNetworkId("testnet")).toBe(true);
    expect(isHorizonNetworkId("unknown")).toBe(false);
    expect(Object.keys(HORIZON_BASE_URLS)).toHaveLength(3);
  });

  it("uses the NEXT_PUBLIC_HORIZON_URL override for any network", () => {
    vi.stubEnv("NEXT_PUBLIC_HORIZON_URL", "https://horizon.example.com/");
    expect(getHorizonBaseUrl(mainnet)).toBe("https://horizon.example.com");
    expect(getHorizonBaseUrl(testnet)).toBe("https://horizon.example.com");
  });

  it("rejects unsafe or missing endpoints", () => {
    vi.stubEnv("NEXT_PUBLIC_HORIZON_URL", "http://horizon.example.com");
    expect(() => getHorizonBaseUrl(mainnet)).toThrow(HorizonApiError);
    vi.stubEnv("NEXT_PUBLIC_HORIZON_URL", "not a url");
    expect(() => getHorizonBaseUrl(mainnet)).toThrow(HorizonApiError);
    vi.stubEnv("NEXT_PUBLIC_HORIZON_URL", "");
    expect(() => getHorizonBaseUrl({ id: "unknown", name: "Unknown" })).toThrow(
      HorizonApiError,
    );
  });
});

describe("spendable balance (pure)", () => {
  it("subtracts the base reserve and one reserve per subentry", () => {
    expect(calculateSpendableBalance("10.0000000", 0)).toBe("9");
    expect(calculateSpendableBalance("10.0000000", 2)).toBe("8");
  });

  it("subtracts native selling liabilities", () => {
    expect(calculateSpendableBalance("72.8563792", 1, "1.0000000")).toBe(
      "70.3563792",
    );
  });

  it("preserves stroop precision and floors at zero", () => {
    expect(calculateSpendableBalance("1.0000003", 0)).toBe("0.0000003");
    expect(calculateSpendableBalance("1.0000000", 5, "0.5000000")).toBe("0");
  });

  it("rejects malformed amounts and subentry counts", () => {
    expect(() => calculateSpendableBalance("1e7", 0)).toThrow(RangeError);
    expect(() => calculateSpendableBalance("1.0000000", -1)).toThrow(
      RangeError,
    );
    expect(() => calculateSpendableBalance("1.0000000", 1.5)).toThrow(
      RangeError,
    );
  });

  it("groups thousands without touching fractional digits", () => {
    expect(formatXlmAmount("70.3563792")).toBe("70.3563792");
    expect(formatXlmAmount("1234567.5")).toBe("1,234,567.5");
  });
});

describe("getAccount", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("fetches the testnet account and maps balances and trustlines", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(rawAccount));

    const account = await getAccount(address, testnet);

    expect(fetch).toHaveBeenCalledWith(
      "https://horizon-testnet.stellar.org/accounts/GABC",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(account.accountId).toBe(address);
    expect(account.balances).toHaveLength(2);
    expect(account.trustlines).toEqual([
      expect.objectContaining({ assetCode: "USDC", assetIssuer: "GISSUER" }),
    ]);
    expect(account.nativeBalance).toBe("72.8563792");
    expect(account.nativeSellingLiabilities).toBe("1.0000000");
    expect(account.spendableBalance).toBe("70.3563792");
  });

  it("treats a 404 as an unfunded account without retrying", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ status: 404 }, 404));

    await expect(getAccount(address, mainnet)).rejects.toBeInstanceOf(
      HorizonAccountNotFoundError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries transient 5xx responses and succeeds", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse(rawAccount));

    const pending = getAccount(address, mainnet);
    await vi.advanceTimersByTimeAsync(HORIZON_RETRY_DELAY_MS);
    const account = await pending;

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(account.spendableBalance).toBe("70.3563792");
  });

  it("gives up after the configured number of retries", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 500));

    const pending = getAccount(address, mainnet);
    const assertion = expect(pending).rejects.toMatchObject({
      code: "http",
      status: 500,
    });
    for (let attempt = 0; attempt < HORIZON_MAX_RETRIES; attempt += 1) {
      await vi.advanceTimersByTimeAsync(
        HORIZON_RETRY_DELAY_MS * 2 ** attempt,
      );
    }
    await assertion;

    expect(fetch).toHaveBeenCalledTimes(HORIZON_MAX_RETRIES + 1);
  });

  it("does not retry a client error", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 400));

    await expect(getAccount(address, mainnet)).rejects.toMatchObject({
      code: "http",
      status: 400,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries transport failures", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError("Network down"))
      .mockResolvedValueOnce(jsonResponse(rawAccount));

    const pending = getAccount(address, mainnet);
    await vi.advanceTimersByTimeAsync(HORIZON_RETRY_DELAY_MS);
    await pending;

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid response shapes and invalid JSON without retrying", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: address }));
    await expect(getAccount(address, mainnet)).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError("bad json")),
    } as unknown as Response);
    await expect(getAccount(address, mainnet)).rejects.toMatchObject({
      code: "invalid_response",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("times out, retries, and finally surfaces a typed timeout error", async () => {
    vi.useFakeTimers();
    hangingFetch();

    const pending = getAccount(address, mainnet);
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(HORIZON_REQUEST_TIMEOUT_MS);
    for (let attempt = 0; attempt <= HORIZON_MAX_RETRIES; attempt += 1) {
      if (attempt > 0) {
        await vi.advanceTimersByTimeAsync(
          HORIZON_RETRY_DELAY_MS * 2 ** (attempt - 1),
        );
      }
      await vi.advanceTimersByTimeAsync(HORIZON_REQUEST_TIMEOUT_MS);
    }
    await assertion;

    expect(fetch).toHaveBeenCalledTimes(HORIZON_MAX_RETRIES + 1);
  });

  it("aborts immediately when the caller aborts", async () => {
    hangingFetch();
    const controller = new AbortController();

    const pending = getAccount(address, mainnet, controller.signal);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not call fetch for an already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const pending = getAccount(address, mainnet, controller.signal);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
