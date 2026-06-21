import { z } from "zod";
import { checkPasswordRequirements } from "@/utils/authUtils";

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
    password: z.string().superRefine((password, context) => {
      const requirements = checkPasswordRequirements(password);

      if (!requirements.minLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 8 characters.",
        });
      }

      if (!requirements.uppercase) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must include at least one uppercase letter.",
        });
      }

      if (!requirements.specialChar) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must include at least one special character.",
        });
      }
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
 * remember-me preference. Login intentionally keeps a length-only password
 * check because existing credentials may predate the current signup policy.
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

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
