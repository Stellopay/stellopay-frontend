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
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        message: "Password must include at least one uppercase letter.",
      })
      .regex(/[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
        message: "Password must include at least one special character.",
      }),
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
 * Validates settings password-change values with the same complexity policy
 * used by sign-up. Password values must never be logged or echoed back.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Current password must be at least 8 characters.",
    }),
    newPassword: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        message: "Password must include at least one uppercase letter.",
      })
      .regex(/[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
        message: "Password must include at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
