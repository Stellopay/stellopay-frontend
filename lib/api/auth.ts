import { LoginFormValues } from "@/types/auth";

/**
 * Custom error class for authentication failures.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
  
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
      // Intentionally not exposing server response details
      throw new AuthError("Invalid email or password. Please try again.");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    // Generic error for network issues, etc.
    throw new AuthError("An error occurred during login. Please try again later.");
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
