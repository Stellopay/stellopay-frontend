import { passwordRuleValidators } from "@/types/auth";

/**
 * Authentication utility functions
 */

export interface PasswordRequirements {
  minLength: boolean;
  uppercase: boolean;
  specialChar: boolean;
}

/**
 * JWT payload structure with standard claims
 */
export interface JWTPayload {
  sub?: string; // Subject (user ID)
  exp?: number; // Expiration time (Unix timestamp in seconds)
  iat?: number; // Issued at (Unix timestamp in seconds)
  iss?: string; // Issuer
  [key: string]: unknown; // Allow additional claims
}

/**
 * Token parsing result
 */
export interface TokenParseResult {
  payload: JWTPayload | null;
  error: string | null;
}

/**
 * Session validity check result
 */
export interface SessionValidityResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates password requirements and returns the validation status
 * @param password - The password to validate
 * @returns Object containing validation results for each requirement
 */
export const checkPasswordRequirements = (
  password: string,
): PasswordRequirements => {
  return {
    minLength: passwordRuleValidators.minLength(password),
    uppercase: passwordRuleValidators.uppercase(password),
    specialChar: passwordRuleValidators.specialChar(password),
  };
};

/**
 * Checks if all password requirements are met
 * @param password - The password to validate
 * @returns True if all requirements are met, false otherwise
 */
export const isPasswordStrong = (password: string): boolean => {
  const requirements = checkPasswordRequirements(password);
  return Object.values(requirements).every((req) => req);
};

/**
 * Password strength levels for the strength meter
 */
export type PasswordStrength = "weak" | "fair" | "strong";

/**
 * Password strength result with level and score
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string;
}

/**
 * Calculates password strength based on multiple criteria
 * @param password - The password to evaluate
 * @returns Password strength result with level, score, and feedback
 */
export const calculatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password || password.length === 0) {
    return {
      strength: "weak",
      score: 0,
      feedback: "Enter a password",
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring (0-40 points)
  if (password.length >= 8) {
    score += 15;
  } else {
    feedback.push("Use at least 8 characters");
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (password.length >= 16) {
    score += 15;
  }

  // Character variety scoring (0-60 points)
  const requirements = checkPasswordRequirements(password);
  
  // Uppercase letters (15 points)
  if (requirements.uppercase) {
    score += 15;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Lowercase letters (15 points)
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Numbers (15 points)
  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add numbers");
  }

  // Special characters (15 points)
  if (requirements.specialChar) {
    score += 15;
  } else {
    feedback.push("Add special characters");
  }

  // Bonus criteria (0-20 points)
  
  // No repeated characters bonus (5 points)
  if (!/(.)\1{2,}/.test(password)) {
    score += 5;
  }

  // No common patterns bonus (5 points)
  const commonPatterns = [
    /123/,
    /abc/,
    /qwe/,
    /password/i,
    /admin/i,
    /login/i,
  ];
  if (!commonPatterns.some(pattern => pattern.test(password))) {
    score += 5;
  }

  // Mixed case bonus (5 points) - beyond just having uppercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && 
      password !== password.toLowerCase() && 
      password !== password.toUpperCase()) {
    score += 5;
  }

  // Character diversity bonus (5 points) - has all 4 types
  if (requirements.uppercase && /[a-z]/.test(password) && 
      /[0-9]/.test(password) && requirements.specialChar) {
    score += 5;
  }

  // Determine strength level and feedback message
  let strength: PasswordStrength;
  let feedbackMessage: string;

  if (score >= 80) {
    strength = "strong";
    feedbackMessage = "Strong password";
  } else if (score >= 50) {
    strength = "fair";
    if (feedback.length > 0) {
      feedbackMessage = `Good start! ${feedback[0]}`;
    } else {
      feedbackMessage = "Fair password - consider making it longer";
    }
  } else {
    strength = "weak";
    if (feedback.length > 0) {
      feedbackMessage = feedback.slice(0, 2).join(", ");
    } else {
      feedbackMessage = "Weak password";
    }
  }

  return {
    strength,
    score,
    feedback: feedbackMessage,
  };
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns True if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Parses a JWT token and extracts its payload
 * Handles malformed tokens gracefully by returning null payload with error message
 * @param token - The JWT token to parse (expected format: header.payload.signature)
 * @returns Object with parsed payload and error (if any)
 */
export const parseToken = (token: unknown): TokenParseResult => {
  // Handle null/undefined input
  if (token === null || token === undefined) {
    return {
      payload: null,
      error: "Token is null or undefined",
    };
  }

  // Handle non-string input
  if (typeof token !== "string") {
    return {
      payload: null,
      error: "Token must be a string",
    };
  }

  // Check for empty string
  if (token.length === 0) {
    return {
      payload: null,
      error: "Token is empty",
    };
  }

  // Split token into parts (should be header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      payload: null,
      error: `Invalid token format: expected 3 parts, got ${parts.length}`,
    };
  }

  const [, payloadPart] = parts;

  // Validate payload part is not empty
  if (!payloadPart || payloadPart.length === 0) {
    return {
      payload: null,
      error: "Token payload is empty",
    };
  }

  try {
    // Decode base64url (standard Base64 with - and _ replacing + and /)
    const decoded = Buffer.from(payloadPart, "base64").toString("utf-8");
    const payload = JSON.parse(decoded) as JWTPayload;
    return {
      payload,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      payload: null,
      error: `Failed to parse token payload: ${errorMessage}`,
    };
  }
};

/**
 * Checks if a token is expired based on its exp claim
 * Uses the provided current time for deterministic testing
 * @param token - The JWT token to check
 * @param currentTimeMs - Current time in milliseconds (defaults to Date.now())
 * @returns Object with expiration status and reason
 */
export const isTokenExpired = (
  token: unknown,
  currentTimeMs: number = Date.now(),
): SessionValidityResult => {
  const parseResult = parseToken(token);

  if (parseResult.error) {
    return {
      isValid: false,
      reason: `Cannot check expiration: ${parseResult.error}`,
    };
  }

  if (!parseResult.payload) {
    return {
      isValid: false,
      reason: "Token payload is missing",
    };
  }

  // If no exp claim, consider token as non-expiring (valid)
  if (parseResult.payload.exp === undefined) {
    return {
      isValid: true,
      reason: "No expiration claim (token does not expire)",
    };
  }

  // Convert exp (seconds) to milliseconds for comparison
  const expirationTimeMs = parseResult.payload.exp * 1000;
  const isExpired = currentTimeMs > expirationTimeMs;

  if (isExpired) {
    return {
      isValid: false,
      reason: "Token has expired",
    };
  }

  return {
    isValid: true,
    reason: "Token has not expired",
  };
};

/**
 * Checks overall session validity (token not expired and properly formatted)
 * @param token - The JWT token to validate
 * @param currentTimeMs - Current time in milliseconds (defaults to Date.now())
 * @returns Object with validity status and reason
 */
export const isSessionValid = (
  token: unknown,
  currentTimeMs: number = Date.now(),
): SessionValidityResult => {
  const parseResult = parseToken(token);

  if (parseResult.error) {
    return {
      isValid: false,
      reason: `Invalid token: ${parseResult.error}`,
    };
  }

  if (!parseResult.payload) {
    return {
      isValid: false,
      reason: "Token payload could not be extracted",
    };
  }

  // Check if token is expired
  const expirationCheck = isTokenExpired(token, currentTimeMs);
  if (!expirationCheck.isValid) {
    return {
      isValid: false,
      reason: expirationCheck.reason,
    };
  }

  return {
    isValid: true,
    reason: "Session is valid",
  };
};

/**
 * Extracts a specific claim from a token
 * @param token - The JWT token
 * @param claimName - The claim key to extract
 * @returns The claim value or null if not found or token is invalid
 */
export const getTokenClaim = (
  token: unknown,
  claimName: string,
): unknown => {
  const parseResult = parseToken(token);

  if (parseResult.error || !parseResult.payload) {
    return null;
  }

  return parseResult.payload[claimName] ?? null;
};
