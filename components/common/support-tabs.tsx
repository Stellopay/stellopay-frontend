"use client";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import EmailInput from "@/components/common/email-input";
import TextareaInput from "@/components/common/text-area-input";
import TextInput from "@/components/common/text-input";
import Button from "@/components/common/button";
import { Clock3, ContactRound, Mail, Phone } from "lucide-react";
import React, { useState } from "react";
import { SupportTabsProps } from "@/types/ui";
import { z } from "zod";

// Define the route mappings for breadcrumbs
const routeMappings = {
  "/help/support/accountManagement": "Account Management",
  "/help/support/transactionIssues": "Transaction Issues",
  "/help/support/securityPrivacy": "Security & Privacy",
  "/help/support/paymentTransfers": "Payment & Transfers",
};

/**
 * Zod validation schema for the Contact Support form.
 * Ensures name fields are bounded and non-empty, email format is valid,
 * and the message is length-capped to prevent abuse.
 */
const contactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  textarea: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message cannot exceed 1000 characters"),
});

export default function SupportTabs({
  activeTab,
  setActiveTab,
  children,
}: SupportTabsProps) {
  const pathname = usePathname();

  // Contact Support form state
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [textarea, setTextarea] = useState<string>("");
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);

  // Form submission and error states
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    textarea?: string;
  }>({});

  React.useEffect(() => {
    setIsButtonDisabled(!(email && firstName && lastName && textarea) || status === "loading");
  }, [firstName, email, lastName, textarea, status]);

  /**
   * Handles changes to the first name field.
   * Clears the corresponding inline error when updated.
   *
   * @param value - The new value of the first name field
   */
  const handleFirstNameChange = (value: string): void => {
    setFirstName(value);
    if (errors.firstName) {
      setErrors((prev) => ({ ...prev, firstName: undefined }));
    }
  };

  /**
   * Handles changes to the last name field.
   * Clears the corresponding inline error when updated.
   *
   * @param value - The new value of the last name field
   */
  const handleLastNameChange = (value: string): void => {
    setLastName(value);
    if (errors.lastName) {
      setErrors((prev) => ({ ...prev, lastName: undefined }));
    }
  };

  /**
   * Handles changes to the email field.
   * Clears the corresponding inline error when updated.
   *
   * @param value - The new value of the email field
   */
  const handleEmailChange = (value: string): void => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  /**
   * Handles changes to the support message text area.
   * Clears the corresponding inline error when updated.
   *
   * @param value - The new value of the text area
   */
  const handleTextareaChange = (value: string): void => {
    setTextarea(value);
    if (errors.textarea) {
      setErrors((prev) => ({ ...prev, textarea: undefined }));
    }
  };

  /**
   * Form submission handler.
   * Validates values against the zod schema, sets validation errors,
   * manages loading/success/error feedback, and makes the API call.
   *
   * @param event - The React form submit event
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isButtonDisabled || status === "loading") return;

    // Reset feedback states
    setErrors({});
    setStatus("idle");
    setStatusMessage("");

    const data = {
      firstName,
      lastName,
      email,
      textarea,
    };

    // Validate inputs using Zod
    const validationResult = contactSchema.safeParse(data);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus("loading");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      if (baseUrl) {
        const response = await fetch(`${baseUrl}/api/support`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validationResult.data),
        });
        if (!response.ok) {
          throw new Error("Failed to submit support request");
        }
      } else {
        // Mock successful submission delay
        if (process.env.NODE_ENV !== "test") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setStatusMessage("Your support request has been submitted successfully!");
      setStatus("success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setTextarea("");
    } catch (_error) {
      setStatus("error");
      setStatusMessage("Failed to submit support request. Please try again later.");
    }
  };

  // Check if we're on a sub-page that should show breadcrumb
  const isSubPage = pathname !== "/help/support";
  const currentPageTitle =
    routeMappings[pathname as keyof typeof routeMappings];

  return (
    <div className="space-y-4">
      {/* Dynamic Breadcrumb - show when on sub-pages */}
      {isSubPage && currentPageTitle && (
        <div className="flex items-center text-2xl font-semibold  gap-2 ">
          <Link
            href="/help/support"
            className="text-[#707070] hover:text-white transition-colors"
          >
            Help/Support
          </Link>
          <ChevronRight className="text-[#E5E5E5]" />
          <span className="text-[#E5E5E5]">{currentPageTitle}</span>
        </div>
      )}

      {/* Title - only show when on main help/support page */}
      {!isSubPage && (
        <h1 className="text-white text-2xl font-semibold">Help/Support</h1>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
        {["Client FAQ", "Contact Support"].map((tab, index, array) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-5 py-2 sm:py-3 border border-[#2d2d2d] cursor-pointer text-sm sm:text-sm font-medium transition ${
              index === 0 ? "rounded-l-lg" : ""
            } ${index === array.length - 1 ? "rounded-r-lg" : ""} ${
              activeTab === tab
                ? "bg-white text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Client FAQ" && children}

      {activeTab === "Contact Support" && (
        <div className="flex flex-col lg:flex-row justify-between w-full bg-[#0D0D0D80] border border-[#2D2D2D] p-6 md:p-10 rounded-[0.875rem] gap-y-10 lg:space-y-0 lg:gap-x-10">
          {/* Left div */}
          <div className="w-full lg:max-w-xs">
            <div className="flex flex-col justify-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
                    <ContactRound color="#E5E5E5" />
                  </div>
                  <h3 className="text-base font-normal text-[#E5E5E5]">
                    Contact Info & FAQ Details
                  </h3>
                </div>
                <p className="text-sm font-normal text-[#707070]">
                  Need help? Find answers to common questions or reach out to
                  our support team for assistance.
                </p>
              </div>

              <div className="bg-[#707070] w-full h-[0.0625rem]"></div>

              {/* Support Email */}
              <div className="space-y-2">
                <h3 className="font-semibold text-base text-[#FFFFFF]">
                  Support Email:
                </h3>
                <div className="flex gap-1 items-center">
                  <Mail size={14} />
                  <p className="text-sm font-normal text-[#707070]">
                    support@stellopay.com
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Phone Number:
                </h3>
                <div className="flex gap-1 items-center">
                  <Phone size={14} />
                  <p className="text-[0.875rem] font-normal text-[#707070]">
                    +234 800 123 4567
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="space-y-2">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Working Hours:
                </h3>
                <div className="flex gap-1 items-center">
                  <Clock3 size={14} />
                  <p className="text-[0.875rem] font-normal text-[#707070]">
                    Monday - Friday: 8 AM - 6 PM (WAT)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right div */}
          <form
            onSubmit={handleSubmit}
            className="w-full lg:max-w-xl space-y-5"
          >
            {/* Hidden live region for status announcements */}
            <div aria-live="polite" className="sr-only" role="status">
                  {status !== "idle" && statusMessage}
                </div>

            <div className="w-full flex flex-col md:flex-row gap-5">
              <TextInput
                placeholder="Maya"
                label="First Name"
                onChange={handleFirstNameChange}
                value={firstName}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
              <TextInput
                placeholder="Sullivan"
                label="Last Name"
                onChange={handleLastNameChange}
                value={lastName}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </div>

            <EmailInput
              onChange={handleEmailChange}
              value={email}
              error={!!errors.email}
              helperText={errors.email}
            />

            <TextareaInput
              label="We would like to hear from you"
              placeholder="Describe your issue in detail"
              onChange={handleTextareaChange}
              value={textarea}
              error={!!errors.textarea}
              helperText={errors.textarea}
            />

            {/* Submission feedback messages */}
            {status === "success" && (
              <p className="text-green-500 text-sm font-medium" role="alert">
                {statusMessage}
              </p>
            )}
            {status === "error" && (
              <p className="text-destructive text-sm font-medium" role="alert">
                {statusMessage}
              </p>
            )}

            <Button
              text="Send Message"
              fill={true}
              disabled={isButtonDisabled}
              loading={status === "loading"}
            />
          </form>
        </div>
      )}
    </div>
  );
}
