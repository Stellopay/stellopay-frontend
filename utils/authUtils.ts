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
export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    specialChar: /[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
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
 * Validates email format
 * @param email - The email to validate
 * @returns True if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 