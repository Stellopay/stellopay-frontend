import { z } from "zod";

// Auth component props
export interface SignUpEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onGoBack: () => void;
  email?: string;
}

export interface AuthShowcaseProps {
  title: string;
  description: string;
  imagePosition: "left" | "right";
  imageSrc?: string;
}

// Form schemas and types
const specialCharacterPattern = /[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * Shared password policy text used by auth forms and the account security UI.
 */
export const passwordPolicy = {
  title: "Password must contain:",
  rules: [
    {
      id: "minLength",
      label: "At least 8 characters",
      message: "Password must be at least 8 characters.",
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      message: "Password must include at least one uppercase letter.",
    },
    {
      id: "specialChar",
      label: "One special character",
      message: "Password must include at least one special character.",
    },
  ],
} as const;

export const passwordRuleValidators = {
  minLength: (password: string) => password.length >= 8,
  uppercase: (password: string) => /[A-Z]/.test(password),
  specialChar: (password: string) => specialCharacterPattern.test(password),
} as const;

/**
 * Shared password schema for auth flows with the same rules and messages
 * across sign-up, login, and account security updates.
 */
export const passwordSchema = z
  .string()
  .min(8, {
    message: passwordPolicy.rules[0].message,
  })
  .regex(/[A-Z]/, {
    message: passwordPolicy.rules[1].message,
  })
  .regex(specialCharacterPattern, {
    message: passwordPolicy.rules[2].message,
  });

/**
 * Validates signup form values: full name, valid email, a strong password,
 * matching confirmation, and terms acceptance.
 */
export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, {
      message: "Full name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Validates login form values: valid email, a strong password, and
 * remember-me preference.
 */
export const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: passwordSchema,
  rememberMe: z.boolean(),
});

/**
 * Alias of {@link passwordSchema} kept for backward compatibility.
 * Prefer `passwordSchema` in new code; `passwordPolicySchema` is retained
 * so existing tests and call sites that reference it continue to compile.
 */
export const passwordPolicySchema = passwordSchema;

/**
 * Validates the change-password form in SecurityTab.
 *
 * The new password must satisfy {@link passwordSchema} (minimum 8
 * characters, one uppercase, one special character) and the confirmation must
 * match exactly. Neither field value is ever logged or persisted beyond the
 * form state.
 */
export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
/** Inferred type for the change-password form. */
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
