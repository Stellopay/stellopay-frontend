import speakeasy from "speakeasy";

export interface TotpSecret {
  base32: string;
  otpauthUrl: string;
}

export function generateTotpSecret(issuer: string, label: string): TotpSecret {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${label})`,
    issuer,
    label,
  });
  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

export function verifyTotpCode(
  secret: string,
  token: string,
  window = 1,
): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window,
  });
}
