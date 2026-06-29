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
