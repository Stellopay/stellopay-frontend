import { describe, expect, it } from "vitest";

import {
  isStellarAddress,
  parseStellarAddress,
  stellarAddressSchema,
} from "./stellarAddress";

const validG = `G${"A".repeat(55)}`;
const validM = `M${"B".repeat(68)}`;

describe("stellarAddressSchema", () => {
  it("accepts uppercase G public keys", () => {
    expect(parseStellarAddress(validG)).toBe(validG);
    expect(isStellarAddress(validG)).toBe(true);
  });

  it("accepts muxed M addresses", () => {
    expect(parseStellarAddress(validM)).toBe(validM);
  });

  it("trims whitespace and normalizes lowercase input", () => {
    expect(parseStellarAddress(`  ${validG.toLowerCase()}  `)).toBe(validG);
  });

  it("rejects Stellar secret seeds", () => {
    const result = stellarAddressSchema.safeParse(`S${"A".repeat(55)}`);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/secret seed/i);
  });

  it("rejects wrong prefixes", () => {
    expect(isStellarAddress(`T${"A".repeat(55)}`)).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isStellarAddress(`G${"A".repeat(54)}`)).toBe(false);
    expect(isStellarAddress(`M${"A".repeat(67)}`)).toBe(false);
  });

  it("rejects non-base32 characters", () => {
    expect(isStellarAddress(`G${"A".repeat(54)}0`)).toBe(false);
  });
});
