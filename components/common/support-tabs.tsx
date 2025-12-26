"use client";
import { usePathname } from "next/navigation";
import { ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import EmailInput from "@/components/common/email-input";
import TextareaInput from "@/components/common/text-area-input";
import TextInput from "@/components/common/text-input";
import Button from "@/components/common/button";
import { Clock3, ContactRound, Mail } from "lucide-react";
import React, { useState } from "react";
import { SupportTabsProps } from "@/types/ui";
import { useToast } from "@/components/ui/toast";

// Define the route mappings for breadcrumbs
const routeMappings = {
  "/help/support/accountManagement": "Account Management",
  "/help/support/transactionIssues": "Transaction Issues",
  "/help/support/securityPrivacy": "Security & Privacy",
  "/help/support/paymentTransfers": "Payment & Transfers",
};

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    setIsButtonDisabled(!(email && firstName && lastName && textarea));
  }, [firstName, email, lastName, textarea]);

  const handleFirstNameChange = (value: string): void => setFirstName(value);
  const handleLastNameChange = (value: string): void => setLastName(value);
  const handleEmailChange = (value: string): void => setEmail(value);
  const handleTextareaChange = (value: string): void => setTextarea(value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isButtonDisabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use mailto: link - simplest solution, no backend or email service needed
      const subject = encodeURIComponent(`Contact Form Submission from ${firstName} ${lastName}`);
      const body = encodeURIComponent(
        `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${textarea}`
      );
      
      // Open email client with pre-filled message
      window.location.href = `mailto:jagadeesh26062002@gmail.com?subject=${subject}&body=${body}`;
      
      // Show success message and reset form
      setTimeout(() => {
        showToast("Email client opened", "Please send the email from your email client.", "success");
        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setTextarea("");
        setIsSubmitting(false);
      }, 500);
    } catch (error: any) {
      console.error("Failed to open email client:", error);
      showToast(
        "Failed to open email client",
        "Please send an email directly to jagadeesh26062002@gmail.com",
        "error"
      );
      setIsSubmitting(false);
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
                  <a 
                    href="mailto:jagadeesh26062002@gmail.com"
                    className="text-sm font-normal text-[#707070] hover:text-[#E5E5E5] transition-colors"
                  >
                    jagadeesh26062002@gmail.com
                  </a>
                </div>
              </div>

              {/* Telegram */}
              <div className="space-y-2">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Telegram:
                </h3>
                <div className="flex gap-1 items-center">
                  <Send size={14} />
                  <a 
                    href="https://t.me/+H1S4w4HOmZdkZjA1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.875rem] font-normal text-[#707070] hover:text-[#E5E5E5] transition-colors"
                  >
                    Join our Telegram group
                  </a>
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
            <div className="w-full flex flex-col md:flex-row gap-5">
              <TextInput
                placeholder="Maya"
                label="First Name"
                onChange={handleFirstNameChange}
                value={firstName}
              />
              <TextInput
                placeholder="Sullivan"
                label="Last Name"
                onChange={handleLastNameChange}
                value={lastName}
              />
            </div>

            <EmailInput onChange={handleEmailChange} value={email} />

            <TextareaInput
              label="We would like to hear from you"
              placeholder="Describe your issue in detail"
              onChange={handleTextareaChange}
              value={textarea}
            />

            <Button
              text={isSubmitting ? "Sending..." : "Send Message"}
              fill={true}
              disabled={isButtonDisabled || isSubmitting}
            />
          </form>
        </div>
      )}
    </div>
  );
}
