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
