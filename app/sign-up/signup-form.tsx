"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Check, X, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import EmailVerificationModal from "./components/email-verification-modal";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface PasswordRequirements {
  minLength: boolean;
  uppercase: boolean;
  specialChar: boolean;
}

export default function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] =
    useState<PasswordRequirements>({
      minLength: false,
      uppercase: false,
      specialChar: false,
    });

  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check password requirements
  const checkPasswordRequirements = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      specialChar: /[@!#%$^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    setPasswordRequirements(requirements);
    const allMet = Object.values(requirements).every((req) => req);
    setIsPasswordStrong(allMet);
    return allMet;
  };

  // Validate individual fields
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case "fullName":
        if (!value.trim()) {
          newErrors.fullName = "First Name is Required";
        } else {
          delete newErrors.fullName;
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Enter your email to continue";
        } else if (!isValidEmail(value)) {
          newErrors.email = "Enter your email to continue";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password doesn't meet the required format";
        } else if (!checkPasswordRequirements(value)) {
          newErrors.password = "Password doesn't meet the required format";
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword =
            "Passwords do not match. Please try again.";
        } else if (value !== formData.password) {
          newErrors.confirmPassword =
            "Passwords do not match. Please try again.";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Show password requirements when user starts typing password
    if (name === "password" && value.length > 0) {
      setShowPasswordRequirements(true);
    } else if (name === "password" && value.length === 0) {
      setShowPasswordRequirements(false);
    }

    // Validate field on change
    validateField(name, value);

    // Also validate confirm password if password changes
    if (name === "password" && formData.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }));
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.fullName.trim() &&
      formData.email.trim() &&
      isValidEmail(formData.email) &&
      formData.password &&
      isPasswordStrong &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.agreeToTerms &&
      Object.keys(errors).length === 0
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate all fields
    Object.keys(formData).forEach((key) => {
      if (key !== "agreeToTerms") {
        validateField(key, formData[key as keyof typeof formData] as string);
      }
    });

    if (isFormValid()) {
      console.log("Form submitted:", formData);
      setSubmittedEmail(formData.email);
      setShowEmailModal(true);
    }
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
  };

  const handleEmailModalContinue = () => {
    // Handle email verification continuation
    console.log("Continuing with email verification");
    setShowEmailModal(false);
    // Redirect to dashboard or next step
  };

  const handleEmailModalGoBack = () => {
    setShowEmailModal(false);
  };

  const handleEmailResend = async () => {
    // Handle resending verification email
    console.log("Resending verification email to:", submittedEmail);
    // Add your resend logic here
  };

  return (
    <div className="min-h-screen bg-[#201322] flex flex-col-reverse lg:flex-row">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md pt-8 lg:pt-16">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-[#E5E5E5] text-sm sm:text-base font-bold mb-4 lg:mb-6">
              Stellopay
            </h1>
            <h2 className="text-[#F8D2FE] text-2xl sm:text-3xl lg:text-[32px] font-bold mb-2">
              Get Started Now
            </h2>
            <p className="text-[#ACB4B5] text-xs sm:text-[13px]">
              Already have an account?
              <Link
                href="/login"
                className="text-white text-xs sm:text-[13px] underline ml-1 hover:no-underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mb-6">
            <Button
              variant="outline"
              className="bg-transparent w-full sm:flex-1 border-[#2D2D2D] text-white hover:bg-[#35183A] hover:text-white flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} />
              <span className="hidden sm:inline">Continue With Google</span>
              <span className="sm:hidden">Google</span>
            </Button>
            <Button
              variant="outline"
              className="bg-transparent w-full sm:flex-1 border-[#2D2D2D] text-white hover:bg-[#35183A] hover:text-white flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <Image src="/apple.svg" alt="Apple" width={20} height={20} />
              <span className="hidden sm:inline">Continue With Apple</span>
              <span className="sm:hidden">Apple</span>
            </Button>
          </div>

          <div className="text-center text-white text-sm mb-6">Or</div>

          {/* Sign Up Form */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 ${
                  errors.fullName ? "border-red-500 focus:border-red-500" : ""
                }`}
                placeholder="Full Name"
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 pr-10 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="Email Address"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                />
                <Mail
                  size={20}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 pr-10 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-[#04802E]"
                  }`}
                  placeholder="Password"
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : showPasswordRequirements
                        ? "password-requirements"
                        : undefined
                  }
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Requirements */}
              {showPasswordRequirements && (
                <div
                  id="password-requirements"
                  className="mt-2 p-3 bg-gray-800/50 rounded-md"
                >
                  <p className="text-gray-300 text-sm mb-2">
                    Password must contain:
                  </p>
                  <ul className="space-y-1">
                    <li className="flex items-center text-sm">
                      {passwordRequirements.minLength ? (
                        <Check size={16} className="text-green-400 mr-2" />
                      ) : (
                        <X size={16} className="text-red-400 mr-2" />
                      )}
                      <span
                        className={
                          passwordRequirements.minLength
                            ? "text-green-400"
                            : "text-gray-300"
                        }
                      >
                        Minimum of 8 characters
                      </span>
                    </li>
                    <li className="flex items-center text-sm">
                      {passwordRequirements.uppercase ? (
                        <Check size={16} className="text-green-400 mr-2" />
                      ) : (
                        <X size={16} className="text-red-400 mr-2" />
                      )}
                      <span
                        className={
                          passwordRequirements.uppercase
                            ? "text-green-400"
                            : "text-gray-300"
                        }
                      >
                        One UPPERCASE character
                      </span>
                    </li>
                    <li className="flex items-center text-sm">
                      {passwordRequirements.specialChar ? (
                        <Check size={16} className="text-green-400 mr-2" />
                      ) : (
                        <X size={16} className="text-red-400 mr-2" />
                      )}
                      <span
                        className={
                          passwordRequirements.specialChar
                            ? "text-green-400"
                            : "text-gray-300"
                        }
                      >
                        One unique character (e.g., @!#%$^&*)
                      </span>
                    </li>
                  </ul>
                  {isPasswordStrong && (
                    <p className="text-green-400 text-sm mt-2 font-medium">
                      Password is strong and secure.
                    </p>
                  )}
                </div>
              )}

              {errors.password && (
                <p
                  id="password-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 pr-10 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-[#04802E]"
                  }`}
                  placeholder="Confirm Password"
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={handleCheckboxChange}
                className="border-[#2D2D2D] data-[state=checked]:bg-[#201322] data-[state=checked]:border-[#2D2D2D] mt-0.5"
              />
              <div className="text-[#CBD2EB] text-xs leading-relaxed">
                By selecting Agree and continue, I agree to Stellopay's
                <Link
                  href="/terms"
                  className="text-[#92569D] ml-1 underline hover:no-underline"
                >
                  Terms of Service
                </Link>
                , and acknowledge the
                <Link
                  href="/privacy"
                  className="text-[#92569D] ml-1 underline hover:no-underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`w-full mt-6 ${
                isFormValid()
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-[#35183A] h-auto lg:h-[700px] relative text-left w-full rounded-2xl p-6 sm:p-8 lg:p-10 lg:pt-16">
          <div className="md:pl-16 pl-0">
            <h2 className="text-[#F8D2FE] text-lg sm:text-xl lg:text-[22px] font-bold mb-4">
              StelloPay streamlines global payroll with fast, secure blockchain
              payments.
            </h2>
            <p className="text-[#E5E5E5] text-sm sm:text-base mb-6 lg:mb-8">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="w-full lg:w-[500px] lg:absolute lg:right-0 lg:bottom-0 flex justify-center lg:justify-end items-end rounded-lg overflow-hidden">
            <Image
              src="/mock.png"
              alt="Dashboard mock-up"
              width={500}
              height={300}
              className="w-full max-w-md lg:max-w-none object-contain"
            />
          </div>
        </div>
      </div>
      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailModal}
        onClose={handleEmailModalClose}
        onContinue={handleEmailModalContinue}
        onGoBack={handleEmailModalGoBack}
        onResend={handleEmailResend}
        email={submittedEmail}
      />
    </div>
  );
}
