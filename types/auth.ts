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

/**
 * Shared password policy: minimum 8 characters, one uppercase letter, one
 * special character. Reused by {@link signUpSchema} and
 * {@link changePasswordSchema} so both flows enforce identical rules.
 */
export const passwordPolicySchema = z
  .string()
  .min(8, {
    message: "Password must be at least 8 characters.",
  })
  .regex(/[A-Z]/, {
    message: "Password must include at least one uppercase letter.",
  })
  .regex(/[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: "Password must include at least one special character.",
  });

/**
 * Validates signup form values: full name, valid email, an 8+ character
 * password with uppercase and special characters, matching confirmation, and
 * terms acceptance.
 */
export const signUpSchema = z
  .object({
    fullName: z.string().min(2, {
      message: "Full name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: passwordPolicySchema,
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
 * Validates login form values: valid email, an 8+ character password, and
 * remember-me preference.
 */
export const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  rememberMe: z.boolean(),
});

/**
 * Validates the change-password form in SecurityTab.
 *
 * The new password must satisfy {@link passwordPolicySchema} (minimum 8
 * characters, one uppercase, one special character) and the confirmation must
 * match exactly. Neither field value is ever logged or persisted beyond the
 * form state.
 */
export const changePasswordSchema = z
  .object({
    newPassword: passwordPolicySchema,
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
