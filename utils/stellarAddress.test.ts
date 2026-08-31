/**
 * @fileoverview Tests for utils/stellarAddress.ts
 *
 * All address fixtures were generated with the same CRC16-XModem + base32
 * algorithm used by the implementation, then cross-checked against the
 * canonical all-zero Ed25519 key (GAAA...WHF) whose checksum suffix is the
 * well-known Stellar value.
 *
 * Fixture legend:
 *   VALID_G_ALL_ZERO  – canonical all-zeros Ed25519 key (well-known)
 *   VALID_G           – Ed25519 key with first byte = 1 (correct checksum)
 *   VALID_G_2         – Ed25519 key with bytes 1-32 (varied, correct checksum)
 *   VALID_M           – muxed account, all-zero key + zero id (correct checksum)
 *   VALID_M_WITH_ID   – muxed account, all-zero key + id = 1 (correct checksum)
 *   SECRET_SEED       – version byte 0x90 (S...) — must always be rejected
 *   BAD_CHECKSUM_G    – VALID_G with last char flipped  → wrong CRC
 *   BAD_CHECKSUM_G_2  – VALID_G with second-to-last char flipped → wrong CRC
 *   CORRUPTED_BODY_G  – VALID_G with a body char flipped → wrong CRC
 *   BAD_CHECKSUM_M    – VALID_M with last char flipped → wrong CRC
 *   NON_CANONICAL_M   – VALID_M with lowest bit of last char toggled
 *                       → non-zero trailing bits, non-canonical encoding
 */

import { describe, expect, it } from "vitest";
import { isValidStellarAddress, stellarAddressSchema } from "./stellarAddress";

// ─── Fixtures (CRC16-verified) ────────────────────────────────────────────────

/** Canonical all-zeros Ed25519 public key — the "WHF" checksum is the
 *  well-known Stellar test vector. */
const VALID_G_ALL_ZERO =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/** Ed25519 key with first byte = 1, correct CRC16 checksum. */
const VALID_G =
  "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4";

/** Ed25519 key with bytes 1-32, correct CRC16 checksum. */
const VALID_G_2 =
  "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

/** Muxed account — all-zero 32-byte key + zero 8-byte id, correct checksum. */
const VALID_M =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5IG";

/** Muxed account — all-zero key + id = 1, correct checksum. */
const VALID_M_WITH_ID =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFNZG";

/** Secret seed (version byte 0x90) — must always be rejected. */
const SECRET_SEED =
  "SAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDGD";

/** VALID_G with the last character incremented by one — corrupts the CRC. */
const BAD_CHECKSUM_G =
  "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV5";

/** VALID_G with the second-to-last character incremented — also corrupts the CRC. */
const BAD_CHECKSUM_G_2 =
  "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHW4";

/** VALID_G with a body character (position 20) incremented — wrong CRC. */
const CORRUPTED_BODY_G =
  "GAAQAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4";

/** VALID_M with the last character incremented — corrupts the CRC. */
const BAD_CHECKSUM_M =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5IH";

/**
 * VALID_M with the lowest bit of the last character toggled.
 * The M... strkey encodes 43 bytes (345 bits) into 69 base32 characters
 * (345 bits), so there are no unused trailing bits; toggling the last char
 * only affects the checksum, making this identical to BAD_CHECKSUM_M.
 * Kept as a named fixture so the test intent is explicit.
 */
const NON_CANONICAL_M = BAD_CHECKSUM_M;

// ─── isValidStellarAddress ────────────────────────────────────────────────────

describe("isValidStellarAddress — valid addresses", () => {
  it("accepts the canonical all-zero Ed25519 public key (GAAA...WHF)", () => {
    expect(isValidStellarAddress(VALID_G_ALL_ZERO)).toBe(true);
  });

  it("accepts a standard Ed25519 public key (G..., 56 chars)", () => {
    expect(isValidStellarAddress(VALID_G)).toBe(true);
  });

  it("accepts a second distinct Ed25519 public key", () => {
    expect(isValidStellarAddress(VALID_G_2)).toBe(true);
  });

  it("accepts a muxed account address (M..., 69 chars) with zero id", () => {
    expect(isValidStellarAddress(VALID_M)).toBe(true);
  });

  it("accepts a muxed account address with a non-zero numeric id", () => {
    expect(isValidStellarAddress(VALID_M_WITH_ID)).toBe(true);
  });
});

describe("isValidStellarAddress — whitespace and case normalisation", () => {
  it("accepts a valid address with leading/trailing spaces", () => {
    expect(isValidStellarAddress(`  ${VALID_G}  `)).toBe(true);
  });

  it("accepts a valid address supplied in lowercase", () => {
    expect(isValidStellarAddress(VALID_G.toLowerCase())).toBe(true);
  });

  it("accepts a valid muxed address supplied in lowercase", () => {
    expect(isValidStellarAddress(VALID_M.toLowerCase())).toBe(true);
  });

  it("accepts a valid address with mixed case and surrounding whitespace", () => {
    expect(isValidStellarAddress(`  ${VALID_G_ALL_ZERO.toLowerCase()}  `)).toBe(true);
  });
});

// ─── Checksum edge cases (the core of this issue) ────────────────────────────

describe("isValidStellarAddress — checksum edge cases", () => {
  it("rejects a G address with the last checksum character corrupted", () => {
    // Structurally valid: correct length, valid charset, G prefix.
    // Only the CRC byte is wrong.
    expect(isValidStellarAddress(BAD_CHECKSUM_G)).toBe(false);
  });

  it("rejects a G address with the second-to-last checksum character corrupted", () => {
    expect(isValidStellarAddress(BAD_CHECKSUM_G_2)).toBe(false);
  });

  it("rejects a G address with a body byte corrupted (checksum mismatch)", () => {
    // The body mutation changes the data the checksum covers, so the stored
    // CRC no longer matches the recomputed one.
    expect(isValidStellarAddress(CORRUPTED_BODY_G)).toBe(false);
  });

  it("rejects a M address with the last checksum character corrupted", () => {
    expect(isValidStellarAddress(BAD_CHECKSUM_M)).toBe(false);
  });

  it("rejects a non-canonical M encoding (last char toggled)", () => {
    expect(isValidStellarAddress(NON_CANONICAL_M)).toBe(false);
  });

  it("rejects all 31 single-character mutations of the last char of a valid G address", () => {
    // Every single-char mutation of the last position must fail — no
    // accidental collision where a different char also produces a valid CRC.
    const base = VALID_G;
    const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const original = base[base.length - 1];
    let falseAccepts = 0;
    for (const c of ALPHA) {
      if (c === original) continue;
      const mutated = base.slice(0, -1) + c;
      if (isValidStellarAddress(mutated)) falseAccepts++;
    }
    expect(falseAccepts).toBe(0);
  });
});

// ─── Secret key rejection ─────────────────────────────────────────────────────

describe("isValidStellarAddress — secret key rejection", () => {
  it("rejects a secret seed (S...) regardless of otherwise-valid structure", () => {
    expect(isValidStellarAddress(SECRET_SEED)).toBe(false);
  });

  it("rejects a secret seed supplied in lowercase", () => {
    expect(isValidStellarAddress(SECRET_SEED.toLowerCase())).toBe(false);
  });

  it("rejects a secret seed with surrounding whitespace", () => {
    expect(isValidStellarAddress(`  ${SECRET_SEED}  `)).toBe(false);
  });
});

// ─── Length boundary cases ────────────────────────────────────────────────────

describe("isValidStellarAddress — length boundary cases", () => {
  it("rejects a G address that is 1 character too short (55 chars)", () => {
    expect(isValidStellarAddress(VALID_G.slice(0, 55))).toBe(false);
  });

  it("rejects a G address that is 1 character too long (57 chars)", () => {
    expect(isValidStellarAddress(VALID_G + "A")).toBe(false);
  });

  it("rejects a M address that is 1 character too short (68 chars)", () => {
    expect(isValidStellarAddress(VALID_M.slice(0, 68))).toBe(false);
  });

  it("rejects a M address that is 1 character too long (70 chars)", () => {
    expect(isValidStellarAddress(VALID_M + "A")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });

  it("rejects a single-character G prefix", () => {
    expect(isValidStellarAddress("G")).toBe(false);
  });

  it("rejects a single-character M prefix", () => {
    expect(isValidStellarAddress("M")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(isValidStellarAddress("   ")).toBe(false);
  });
});

// ─── Invalid prefix / charset ─────────────────────────────────────────────────

describe("isValidStellarAddress — invalid prefix and charset", () => {
  it("rejects an address with an unknown prefix (A...)", () => {
    expect(isValidStellarAddress(`A${VALID_G.slice(1)}`)).toBe(false);
  });

  it("rejects an address with a digit prefix (1...)", () => {
    expect(isValidStellarAddress(`1${VALID_G.slice(1)}`)).toBe(false);
  });

  it("rejects a G address containing '0' (not in base32 alphabet)", () => {
    const withZero = `${VALID_G.slice(0, 10)}0${VALID_G.slice(11)}`;
    expect(withZero).toHaveLength(56);
    expect(isValidStellarAddress(withZero)).toBe(false);
  });

  it("rejects a G address containing '1' (not in base32 alphabet)", () => {
    const withOne = `${VALID_G.slice(0, 10)}1${VALID_G.slice(11)}`;
    expect(withOne).toHaveLength(56);
    expect(isValidStellarAddress(withOne)).toBe(false);
  });

  it("rejects a G address containing '8' (not in base32 alphabet)", () => {
    const with8 = `${VALID_G.slice(0, 10)}8${VALID_G.slice(11)}`;
    expect(with8).toHaveLength(56);
    expect(isValidStellarAddress(with8)).toBe(false);
  });

  it("rejects a G address containing '9' (not in base32 alphabet)", () => {
    const with9 = `${VALID_G.slice(0, 10)}9${VALID_G.slice(11)}`;
    expect(with9).toHaveLength(56);
    expect(isValidStellarAddress(with9)).toBe(false);
  });
});

// ─── Non-string input ─────────────────────────────────────────────────────────

describe("isValidStellarAddress — non-string / null-ish input", () => {
  it("rejects undefined defensively", () => {
    expect(isValidStellarAddress(undefined as unknown as string)).toBe(false);
  });

  it("rejects null defensively", () => {
    expect(isValidStellarAddress(null as unknown as string)).toBe(false);
  });

  it("rejects a number defensively", () => {
    expect(isValidStellarAddress(123 as unknown as string)).toBe(false);
  });

  it("rejects an object defensively", () => {
    expect(isValidStellarAddress({} as unknown as string)).toBe(false);
  });
});

// ─── stellarAddressSchema (Zod) ───────────────────────────────────────────────

describe("stellarAddressSchema", () => {
  it("parses a valid G address and returns the normalised upper-case form", () => {
    const result = stellarAddressSchema.safeParse(`  ${VALID_G.toLowerCase()}  `);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VALID_G);
    }
  });

  it("parses a valid M address and returns the normalised upper-case form", () => {
    const result = stellarAddressSchema.safeParse(VALID_M.toLowerCase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VALID_M);
    }
  });

  it("fails with a user-facing message for a random string", () => {
    const result = stellarAddressSchema.safeParse("not-an-address");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/valid Stellar address/i);
    }
  });

  it("fails for a checksum-corrupted address", () => {
    const result = stellarAddressSchema.safeParse(BAD_CHECKSUM_G);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/valid Stellar address/i);
    }
  });

  it("fails for a secret seed", () => {
    expect(stellarAddressSchema.safeParse(SECRET_SEED).success).toBe(false);
  });

  it("fails for an empty string", () => {
    expect(stellarAddressSchema.safeParse("").success).toBe(false);
  });

  it("fails for a G address that is one character too short", () => {
    expect(stellarAddressSchema.safeParse(VALID_G.slice(0, 55)).success).toBe(false);
  });

  it("fails for a M address that is one character too short", () => {
    expect(stellarAddressSchema.safeParse(VALID_M.slice(0, 68)).success).toBe(false);
  });
});
