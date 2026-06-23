import { describe, expect, it } from "vitest";

import {
  isValidStellarAddress,
  stellarAddressSchema,
} from "@/utils/stellarAddress";

// Fixtures with correct CRC16 checksums. They were produced by Stellar's strkey
// algorithm (base32 + CRC16-XModem) and cross-checked against the canonical
// all-zero Ed25519 public key `GAAA...WHF`, whose `WHF` checksum suffix is the
// well-known Stellar value — confirming our encoder/decoder matches the SDK.
const VALID_G = "GAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB7JZX";
const VALID_G_ALL_ZERO =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const VALID_M =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5IG";

// Same charset/length/prefix as a valid `G...` but a corrupted body byte.
const BAD_CHECKSUM_G =
  "GAAACAQDAQAQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB7JZX";
// `G`-prefixed, valid length/charset, but version byte resolves to 0x31, not 0x30.
const BAD_VERSION_G =
  "GEAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB7JZX";
// Valid `M...` body but the final char flips the single unused (non-canonical) bit.
const NON_CANONICAL_M =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5IH";
// A real secret seed (`S...`) — must always be rejected.
const SECRET_SEED = "SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI";

describe("isValidStellarAddress", () => {
  it("accepts valid Ed25519 public keys (G...) and muxed accounts (M...)", () => {
    expect(isValidStellarAddress(VALID_G)).toBe(true);
    expect(isValidStellarAddress(VALID_G_ALL_ZERO)).toBe(true);
    expect(isValidStellarAddress(VALID_M)).toBe(true);
  });

  it("trims surrounding whitespace and normalizes lowercase before validating", () => {
    expect(isValidStellarAddress(`  ${VALID_G.toLowerCase()}  `)).toBe(true);
    expect(isValidStellarAddress(VALID_M.toLowerCase())).toBe(true);
  });

  it("rejects secret seeds (S...) regardless of case", () => {
    expect(isValidStellarAddress(SECRET_SEED)).toBe(false);
    expect(isValidStellarAddress(SECRET_SEED.toLowerCase())).toBe(false);
  });

  it("rejects an unknown prefix", () => {
    expect(isValidStellarAddress(`A${VALID_G.slice(1)}`)).toBe(false);
    expect(isValidStellarAddress("")).toBe(false);
  });

  it("rejects wrong lengths for G and M", () => {
    expect(isValidStellarAddress(VALID_G.slice(0, 55))).toBe(false);
    expect(isValidStellarAddress(`${VALID_G}A`)).toBe(false);
    expect(isValidStellarAddress(VALID_M.slice(0, 68))).toBe(false);
  });

  it("rejects characters outside the base32 alphabet", () => {
    const withBadChar = `${VALID_G.slice(0, 10)}0${VALID_G.slice(11)}`;
    expect(withBadChar).toHaveLength(56);
    expect(isValidStellarAddress(withBadChar)).toBe(false);
  });

  it("rejects a wrong version byte even with a valid shape", () => {
    expect(isValidStellarAddress(BAD_VERSION_G)).toBe(false);
  });

  it("rejects a corrupted checksum", () => {
    expect(isValidStellarAddress(BAD_CHECKSUM_G)).toBe(false);
  });

  it("rejects a non-canonical encoding (non-zero trailing bits)", () => {
    expect(isValidStellarAddress(NON_CANONICAL_M)).toBe(false);
  });

  it("rejects non-string input defensively", () => {
    expect(isValidStellarAddress(undefined as unknown as string)).toBe(false);
    expect(isValidStellarAddress(123 as unknown as string)).toBe(false);
  });
});

describe("stellarAddressSchema", () => {
  it("parses and normalizes a valid address to its canonical upper form", () => {
    const result = stellarAddressSchema.safeParse(
      `  ${VALID_G.toLowerCase()}  `,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VALID_G);
    }
  });

  it("fails with a user-facing message for invalid input", () => {
    const result = stellarAddressSchema.safeParse("not-an-address");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/valid Stellar address/i);
    }
  });

  it("rejects secret seeds through the schema", () => {
    expect(stellarAddressSchema.safeParse(SECRET_SEED).success).toBe(false);
  });
});
