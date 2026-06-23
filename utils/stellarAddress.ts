import { z } from "zod";

/**
 * Stellar address (strkey) validation utilities.
 *
 * A Stellar "strkey" is a base32-encoded byte string with the following layout:
 *
 *   [ 1 version byte ][ N-byte payload ][ 2-byte CRC16 checksum ]
 *
 * The whole thing is encoded with the RFC 4648 base32 alphabet (no padding).
 * Two public address forms are accepted here:
 *
 *   - Ed25519 public keys (`G...`): version byte `0x30` (6 << 3), 32-byte key,
 *     2-byte checksum → 35 bytes → 56 base32 characters.
 *   - Muxed accounts (`M...`): version byte `0x60` (12 << 3), 32-byte key +
 *     8-byte id, 2-byte checksum → 43 bytes → 69 base32 characters.
 *
 * Secret seeds (`S...`, version byte `0x90`) are NEVER accepted: a wallet
 * address field must not store private key material.
 *
 * Validation is performed without any external Stellar SDK: the input is
 * base32-decoded and the trailing CRC16-XModem checksum is recomputed and
 * compared, so addresses with a valid charset but a corrupted body are
 * rejected (not just a shape/length regex check).
 *
 * Security note: callers must never log entered addresses in full.
 */

/** RFC 4648 base32 alphabet used by Stellar strkeys (charset `[A-Z2-7]`). */
const STELLAR_BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** strkey version byte for an Ed25519 public key (`G...`). */
const VERSION_BYTE_ED25519_PUBLIC_KEY = 0x30; // 6 << 3
/** strkey version byte for a muxed account (`M...`). */
const VERSION_BYTE_MUXED_ACCOUNT = 0x60; // 12 << 3

/** Canonical base32 length of a `G...` public key. */
const ED25519_PUBLIC_KEY_LENGTH = 56;
/** Canonical base32 length of an `M...` muxed account. */
const MUXED_ACCOUNT_LENGTH = 69;

/**
 * Decodes an unpadded base32 (RFC 4648) string into bytes.
 *
 * Returns `null` if the string contains a character outside the Stellar base32
 * alphabet, or if the trailing (unused) bits are non-zero — i.e. the input is
 * not a canonical encoding.
 */
function decodeBase32(input: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of input) {
    const index = STELLAR_BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      return null;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }

  // Any leftover bits that did not form a full byte must be zero for the
  // encoding to be canonical; reject malleable non-canonical variants.
  if ((value & ((1 << bits) - 1)) !== 0) {
    return null;
  }

  return Uint8Array.from(output);
}

/**
 * Computes the CRC16-XModem checksum (polynomial `0x1021`, initial value `0`)
 * used by Stellar strkeys.
 */
function crc16xmodem(bytes: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc & 0xffff;
}

/**
 * Returns `true` when `value` is a valid Stellar public address.
 *
 * Accepts Ed25519 public keys (`G...`) and muxed accounts (`M...`). The input
 * is trimmed and upper-cased before validation, so surrounding whitespace and
 * lowercase input are normalized. Secret seeds (`S...`) are explicitly
 * rejected. The trailing CRC16 checksum must match, so charset-valid but
 * corrupted addresses are rejected.
 *
 * @param value - The candidate address (raw user input is fine).
 * @returns Whether the normalized value is a valid `G...`/`M...` address.
 */
export function isValidStellarAddress(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toUpperCase();

  // Defense in depth: never accept anything that looks like a secret seed.
  if (normalized.startsWith("S")) {
    return false;
  }

  let expectedVersion: number;
  if (normalized.startsWith("G")) {
    if (normalized.length !== ED25519_PUBLIC_KEY_LENGTH) {
      return false;
    }
    expectedVersion = VERSION_BYTE_ED25519_PUBLIC_KEY;
  } else if (normalized.startsWith("M")) {
    if (normalized.length !== MUXED_ACCOUNT_LENGTH) {
      return false;
    }
    expectedVersion = VERSION_BYTE_MUXED_ACCOUNT;
  } else {
    return false;
  }

  const decoded = decodeBase32(normalized);
  if (decoded === null) {
    return false;
  }

  if (decoded[0] !== expectedVersion) {
    return false;
  }

  const dataLength = decoded.length - 2;
  const checksum = decoded[dataLength] | (decoded[dataLength + 1] << 8);
  const expectedChecksum = crc16xmodem(decoded.subarray(0, dataLength));

  return checksum === expectedChecksum;
}

/**
 * Zod schema for a Stellar public address.
 *
 * Trims and upper-cases the input, then validates it as a `G...` (Ed25519
 * public key) or `M...` (muxed) strkey, rejecting secret seeds and addresses
 * with an invalid prefix, length, charset, or checksum. The parsed output is
 * the normalized (trimmed, upper-cased) address, suitable for storage and
 * duplicate detection.
 */
export const stellarAddressSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .refine(isValidStellarAddress, {
    message:
      "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.",
  });

/** A validated, normalized Stellar public address. */
export type StellarAddress = z.infer<typeof stellarAddressSchema>;
