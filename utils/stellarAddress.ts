import { z } from "zod";

const STELLAR_PUBLIC_KEY_LENGTH = 56;
const STELLAR_MUXED_ADDRESS_LENGTH = 69;
const STELLAR_BASE32 = /^[A-Z2-7]+$/;

/**
 * Validates public Stellar recipient addresses only.
 * G-addresses are Ed25519 public keys; M-addresses are muxed public accounts.
 * Secret seeds start with S and must never be accepted in wallet address forms.
 */
export const stellarAddressSchema = z
  .string()
  .trim()
  .transform((address) => address.toUpperCase())
  .superRefine((address, ctx) => {
    if (address.startsWith("S")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a public Stellar address, not a secret seed.",
      });
      return;
    }

    const hasPublicPrefix = address.startsWith("G") || address.startsWith("M");
    if (!hasPublicPrefix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address must start with G or M.",
      });
      return;
    }

    const expectedLength = address.startsWith("G")
      ? STELLAR_PUBLIC_KEY_LENGTH
      : STELLAR_MUXED_ADDRESS_LENGTH;

    if (address.length !== expectedLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Address must be ${expectedLength} characters long.`,
      });
      return;
    }

    if (!STELLAR_BASE32.test(address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address may only contain uppercase base32 characters A-Z and 2-7.",
      });
    }
  });

export const parseStellarAddress = (address: string): string =>
  stellarAddressSchema.parse(address);

export const isStellarAddress = (address: string): boolean =>
  stellarAddressSchema.safeParse(address).success;
