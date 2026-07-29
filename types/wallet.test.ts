import { describe, expect, it } from "vitest";

import type { Network, WalletConnectionResult } from "./wallet";
import {
  isNetwork,
  isWalletAddress,
  isWalletConnectionResult,
} from "./wallet";
import {
  INVALID_SECRET_SEED,
  VALID_WALLET_ADDRESS,
  VALID_WALLET_CONNECTION_PAYLOAD,
  VALID_WALLET_NETWORK,
} from "./wallet.fixtures";

describe("wallet runtime guards", () => {
  describe("isWalletAddress", () => {
    it.each([
      ["valid Stellar public address", VALID_WALLET_ADDRESS],
      ["valid address with surrounding whitespace", ` ${VALID_WALLET_ADDRESS} `],
    ])("accepts %s", (_label, payload) => {
      expect(isWalletAddress(payload)).toBe(true);
    });

    it.each([
      ["secret seed", INVALID_SECRET_SEED],
      ["empty string", ""],
      ["wrong prefix", `M${VALID_WALLET_ADDRESS.slice(1)}`],
      ["too short", VALID_WALLET_ADDRESS.slice(0, -1)],
      ["non-base32 character", `${VALID_WALLET_ADDRESS.slice(0, -1)}1`],
      ["number", 123],
      ["null", null],
      ["object", { address: VALID_WALLET_ADDRESS }],
    ])("rejects %s", (_label, payload) => {
      expect(isWalletAddress(payload)).toBe(false);
    });
  });

  describe("isNetwork", () => {
    it.each([
      ["minimal network", { id: "stellar", name: "Stellar" }],
      ["network with passphrase", VALID_WALLET_NETWORK],
    ])("accepts %s", (_label, payload) => {
      expect(isNetwork(payload)).toBe(true);
    });

    it.each([
      ["null", null],
      ["array", [{ id: "stellar", name: "Stellar" }]],
      ["missing id", { name: "Stellar" }],
      ["missing name", { id: "stellar" }],
      ["empty id", { id: " ", name: "Stellar" }],
      ["empty name", { id: "stellar", name: "" }],
      ["numeric id", { id: 1, name: "Stellar" }],
      ["numeric name", { id: "stellar", name: 1 }],
      [
        "non-string passphrase",
        { id: "stellar", name: "Stellar", passphrase: false },
      ],
    ])("rejects %s", (_label, payload) => {
      expect(isNetwork(payload)).toBe(false);
    });
  });

  describe("isWalletConnectionResult", () => {
    it.each([
      ["address-only payload", { address: VALID_WALLET_ADDRESS }],
      ["address and network payload", VALID_WALLET_CONNECTION_PAYLOAD],
    ])("accepts %s", (_label, payload) => {
      expect(isWalletConnectionResult(payload)).toBe(true);
    });

    it.each([
      ["null", null],
      ["array", [VALID_WALLET_CONNECTION_PAYLOAD]],
      ["missing address", { network: VALID_WALLET_NETWORK }],
      ["secret address", { address: INVALID_SECRET_SEED }],
      ["invalid address", { address: "not-a-wallet" }],
      [
        "invalid network",
        { address: VALID_WALLET_ADDRESS, network: { id: "", name: "Stellar" } },
      ],
    ])("rejects %s", (_label, payload) => {
      expect(isWalletConnectionResult(payload)).toBe(false);
    });
  });

  it("narrows wallet connection payloads in representative usage", () => {
    function networkLabel(network: Network): string {
      return network.name;
    }

    function summarizeConnectPayload(payload: unknown): string {
      if (!isWalletConnectionResult(payload)) {
        return "invalid";
      }

      const connection: WalletConnectionResult = payload;
      const address: string = connection.address;
      const label = connection.network
        ? networkLabel(connection.network)
        : "current network";

      return `${address.slice(0, 4)}:${label}`;
    }

    expect(summarizeConnectPayload(VALID_WALLET_CONNECTION_PAYLOAD)).toBe(
      "GAAQ:Stellar",
    );
    expect(summarizeConnectPayload({ address: "not-a-wallet" })).toBe(
      "invalid",
    );
  });
});
