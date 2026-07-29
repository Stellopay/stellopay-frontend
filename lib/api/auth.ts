import { LoginFormValues } from "@/types/auth";

/**
 * Custom error class for authentication failures.
 */
export type AuthErrorKind = "invalid_credentials" | "network";

export class AuthError extends Error {
  kind: AuthErrorKind;
  constructor(message: string, kind: AuthErrorKind = "invalid_credentials") {
    super(message);
    this.name = "AuthError";
    this.kind = kind;
  }
}

/**
 * Custom error class for email verification failures.
 * The `code` property distinguishes expired/invalid tokens from other errors.
 */
export class VerifyEmailError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "VerifyEmailError";
  }
}

/**
 * Custom error class for OAuth callback failures.
 * The `code` property distinguishes different OAuth error types:
 * - ACCESS_DENIED: User denied provider permission
 * - PROVIDER_UNAVAILABLE: OAuth provider is unreachable
 * - ACCOUNT_EXISTS_DIFFERENT_METHOD: Email already exists with password
 */
export class OAuthCallbackError extends Error {
  constructor(
    message: string,
    public readonly code: "access_denied" | "provider_unavailable" | "account_exists_different_method",
  ) {
    super(message);
    this.name = "OAuthCallbackError";
  }
}

/**
 * Authenticates a user with their email and password.
 *
 * @param credentials - The user's login credentials including email, password, and rememberMe flag.
 * @returns A promise that resolves when login is successful.
 * @throws {AuthError} If authentication fails or a network error occurs.
 *
 * @security Credentials are never logged. Error messages are sanitized before being thrown
 * to prevent leaking server detail.
 */
export async function login(credentials: LoginFormValues): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      }),
    });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new AuthError(
          "We're having trouble reaching our servers. Please try again.",
          "network"
        );
      }
      // Intentionally not exposing server response details
      throw new AuthError("Invalid email or password. Please try again.");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    // Generic error for network issues (fetch throws TypeError on network failure), etc.
    throw new AuthError(
      "Unable to connect. Please check your internet connection and try again.",
      "network"
    );
  }
}

/**
 * Verifies an email address using a token from a verification link.
 * 
 * @param token - The verification token from the URL query parameter.
 * @throws {VerifyEmailError} With code TOKEN_EXPIRED, TOKEN_INVALID, or VERIFICATION_FAILED.
 * @throws {Error} For network or other unexpected failures.
 */
export async function verifyEmailToken(token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

  try {
    const response = await fetch(`${baseUrl}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (response.ok) return;

    const body = await response.json().catch(() => ({}));

    if (body?.code === "TOKEN_EXPIRED") {
      throw new VerifyEmailError(
        "This verification link has expired.",
        "TOKEN_EXPIRED",
      );
    }

    if (body?.code === "TOKEN_INVALID") {
      throw new VerifyEmailError(
        "This verification link is invalid.",
        "TOKEN_INVALID",
      );
    }

    throw new VerifyEmailError(
      "Verification failed. Please try again.",
      "VERIFICATION_FAILED",
    );
  } catch (error) {
    if (error instanceof VerifyEmailError) throw error;
    throw new Error("An error occurred during verification. Please try again later.");
  }
}

/**
 * Resends a verification email to the given address.
 * 
 * @param email - The email address to send the verification to.
 * @throws {Error} If the request fails.
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

  try {
    const response = await fetch(`${baseUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to resend verification email. Please try again.");
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("An error occurred. Please try again later.");
  }
}

/**
 * Simulates an OAuth flow that may reject with known error codes.
 * This is a temporary implementation until real OAuth integration is added.
 * 
 * @param provider - The OAuth provider to simulate.
 * @throws {OAuthCallbackError} With appropriate error code for testing.
 */
export async function simulateOAuth(provider: "google" | "apple"): Promise<void> {
  // Simulate random error for demonstration purposes
  const errorCodes: Array<OAuthCallbackError["code"]> = [
    "access_denied",
    "provider_unavailable", 
    "account_exists_different_method"
  ];
  
  const randomError = errorCodes[Math.floor(Math.random() * errorCodes.length)];
  
  // Log the error for support diagnostics (without exposing provider internals)
  console.error(`[OAuth Callback Error] Provider: ${provider}, Code: ${randomError}`);
  
  throw new OAuthCallbackError(
    getErrorMessage(randomError),
    randomError
  );
}

/**
 * Returns user-friendly error message for OAuth callback errors.
 * 
 * @param code - The OAuth error code.
 * @returns User-friendly error message.
 */
function getErrorMessage(code: OAuthCallbackError["code"]): string {
  switch (code) {
    case "access_denied":
      return "You've denied permission to use this account. Please try again or use your password to sign in.";
    case "provider_unavailable":
      return "The authentication provider is temporarily unavailable. Please try again later or use your password to sign in.";
    case "account_exists_different_method":
      return "This email is already registered with a password. Please sign in with your email and password instead.";
    default:
      return "Authentication failed. Please try again or use your password to sign in.";
  }
}

/**
 * Sends a passwordless magic-link sign-in email to the given address.
 *
 * The email contains a one-time sign-in link that authenticates the user
 * without requiring a password. This reduces friction and password-reset
 * support load.
 *
 * @param email - The email address to send the magic link to.
 * @throws {AuthError} If the request fails, with a sanitized message.
 */
export async function sendMagicLink(email: string): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

  try {
    const response = await fetch(`${baseUrl}/auth/magic-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      // Intentionally not exposing server response details
      throw new AuthError(
        "Could not send login link. Please check the email address and try again.",
      );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      "An error occurred. Please try again later.",
    );
  }
}