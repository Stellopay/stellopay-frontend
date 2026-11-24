/**
 * @fileoverview Unit tests for SEP-0007 URI builder and parser.
 */

import { describe, it, expect } from "vitest";
import { buildSep7Uri, parseSep7Uri, isValidSep7Uri } from "./sep7";

describe("buildSep7Uri", () => {
  const validDestination = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

  it("builds a minimal URI with only destination", () => {
    const uri = buildSep7Uri({ destination: validDestination });
    expect(uri).toBe(`web+stellar:pay?destination=${validDestination}`);
  });

  it("builds a URI with amount", () => {
    const uri = buildSep7Uri({ destination: validDestination, amount: "10.50" });
    expect(uri).toContain("destination=" + validDestination);
    expect(uri).toContain("amount=10.5");
  });

  it("caps amount precision at 7 decimal places", () => {
    const uri = buildSep7Uri({ destination: validDestination, amount: "10.123456789" });
    expect(uri).toContain("amount=10.1234568");
  });

  it("builds a URI with asset code", () => {
    const uri = buildSep7Uri({ destination: validDestination, assetCode: "USDC" });
    expect(uri).toContain("asset_code=USDC");
  });

  it("builds a URI with asset issuer", () => {
    const issuer = "GD5JF5GQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ";
    const uri = buildSep7Uri({ destination: validDestination, assetCode: "USDC", assetIssuer: issuer });
    expect(uri).toContain("asset_issuer=" + issuer);
  });

  it("percent-encodes memo", () => {
    const uri = buildSep7Uri({ destination: validDestination, memo: "Invoice #123" });
    expect(uri).toContain("memo=Invoice%20%23123");
  });

  it("percent-encodes message", () => {
    const uri = buildSep7Uri({ destination: validDestination, message: "Payment for services" });
    expect(uri).toContain("msg=Payment%20for%20services");
  });

  it("includes memo type when memo is provided", () => {
    const uri = buildSep7Uri({ destination: validDestination, memo: "123", memoType: "id" });
    expect(uri).toContain("memo=123");
    expect(uri).toContain("memo_type=id");
  });

  it("rejects invalid destination address", () => {
    expect(() => buildSep7Uri({ destination: "invalid" })).toThrow("Invalid destination address");
  });

  it("rejects negative amounts", () => {
    expect(() => buildSep7Uri({ destination: validDestination, amount: "-10" })).toThrow("Invalid amount");
  });

  it("rejects non-numeric amounts", () => {
    expect(() => buildSep7Uri({ destination: validDestination, amount: "abc" })).toThrow("Invalid amount");
  });

  it("rejects amounts with more than 7 decimal places", () => {
    expect(() => buildSep7Uri({ destination: validDestination, amount: "10.12345678" })).toThrow(
      "Invalid amount",
    );
  });

  it("rejects invalid asset issuer address", () => {
    expect(() =>
      buildSep7Uri({ destination: validDestination, assetCode: "USDC", assetIssuer: "invalid" }),
    ).toThrow("Invalid asset issuer address");
  });
});

describe("parseSep7Uri", () => {
  const validDestination = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

  it("parses a minimal URI with only destination", () => {
    const uri = `web+stellar:pay?destination=${validDestination}`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.destination).toBe(validDestination);
    expect(parsed.amount).toBeUndefined();
  });

  it("parses a URI with amount", () => {
    const uri = `web+stellar:pay?destination=${validDestination}&amount=10.5`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.amount).toBe("10.5");
  });

  it("parses a URI with asset code", () => {
    const uri = `web+stellar:pay?destination=${validDestination}&asset_code=USDC`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.assetCode).toBe("USDC");
  });

  it("parses a URI with asset issuer", () => {
    const issuer = "GD5JF5GQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ";
    const uri = `web+stellar:pay?destination=${validDestination}&asset_code=USDC&asset_issuer=${issuer}`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.assetIssuer).toBe(issuer);
  });

  it("decodes percent-encoded memo", () => {
    const uri = `web+stellar:pay?destination=${validDestination}&memo=Invoice%20%23123&memo_type=text`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.memo).toBe("Invoice #123");
    expect(parsed.memoType).toBe("text");
  });

  it("decodes percent-encoded message", () => {
    const uri = `web+stellar:pay?destination=${validDestination}&msg=Payment%20for%20services`;
    const parsed = parseSep7Uri(uri);
    expect(parsed.message).toBe("Payment for services");
  });

  it("rejects URIs with unknown scheme", () => {
    expect(() => parseSep7Uri("http://example.com")).toThrow("Invalid URI scheme");
  });

  it("rejects URIs without destination", () => {
    expect(() => parseSep7Uri("web+stellar:pay?amount=10")).toThrow("Missing required parameter");
  });

  it("rejects URIs with invalid destination", () => {
    expect(() => parseSep7Uri("web+stellar:pay?destination=invalid")).toThrow("Invalid destination address");
  });

  it("rejects URIs with invalid amount", () => {
    expect(() =>
      parseSep7Uri(`web+stellar:pay?destination=${validDestination}&amount=-10`),
    ).toThrow("Invalid amount");
  });

  it("rejects URIs with invalid asset issuer", () => {
    expect(() =>
      parseSep7Uri(`web+stellar:pay?destination=${validDestination}&asset_issuer=invalid`),
    ).toThrow("Invalid asset issuer address");
  });
});

describe("round-trip tests", () => {
  const validDestination = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
  const validIssuer = "GD5JF5GQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ7KQ";

  it("round-trips a simple URI", () => {
    const original = { destination: validDestination };
    const uri = buildSep7Uri(original);
    const parsed = parseSep7Uri(uri);
    expect(parsed.destination).toBe(original.destination);
  });

  it("round-trips a URI with all parameters", () => {
    const original = {
      destination: validDestination,
      amount: "10.50",
      assetCode: "USDC",
      assetIssuer: validIssuer,
      memo: "Invoice #123",
      memoType: "text" as const,
      message: "Payment for services",
    };
    const uri = buildSep7Uri(original);
    const parsed = parseSep7Uri(uri);
    expect(parsed.destination).toBe(original.destination);
    expect(parsed.amount).toBe("10.5");
    expect(parsed.assetCode).toBe(original.assetCode);
    expect(parsed.assetIssuer).toBe(original.assetIssuer);
    expect(parsed.memo).toBe(original.memo);
    expect(parsed.memoType).toBe(original.memoType);
    expect(parsed.message).toBe(original.message);
  });

  it("round-trips a URI with special characters in memo", () => {
    const original = {
      destination: validDestination,
      memo: "Hello & goodbye! @user #tag",
      memoType: "text" as const,
    };
    const uri = buildSep7Uri(original);
    const parsed = parseSep7Uri(uri);
    expect(parsed.memo).toBe(original.memo);
  });
});

describe("isValidSep7Uri", () => {
  const validDestination = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

  it("returns true for valid URIs", () => {
    const uri = `web+stellar:pay?destination=${validDestination}`;
    expect(isValidSep7Uri(uri)).toBe(true);
  });

  it("returns false for URIs with invalid scheme", () => {
    expect(isValidSep7Uri("http://example.com")).toBe(false);
  });

  it("returns false for URIs with invalid destination", () => {
    expect(isValidSep7Uri("web+stellar:pay?destination=invalid")).toBe(false);
  });

  it("returns false for URIs with invalid amount", () => {
    expect(isValidSep7Uri(`web+stellar:pay?destination=${validDestination}&amount=-10`)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidSep7Uri("")).toBe(false);
  });
});
