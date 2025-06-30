"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Check, X, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
      // Handle successful form submission
    }
  };

  return (
    <div className="min-h-screen bg-[#201322] flex">
      {/* Left Side - Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[#E5E5E5] text-[16px] font-bold mb-6">
              Stellopay
            </h1>
            <h2 className="text-[#F8D2FE] text-[32px] font-bold mb-2">
              Get Started Now
            </h2>
            <p className="text-[#ACB4B5] text-[13px]">
              Already have an account?
              <Link
                href="/login"
                className="text-white text-[13px] underline ml-1 hover:no-underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-between mb-6">
            <Button
              variant="outline"
              className="bg-transparent md:w-[220px] w-full border-[#2D2D2D] text-white hover:bg-gray-800 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue With Google
            </Button>

            <Button
              variant="outline"
              className="bg-transparent md:w-[220px] w-full border-[#2D2D2D] text-white hover:bg-gray-800 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Continue With Apple
            </Button>
          </div>

          <div className="text-center text-white text-[14px] mb-6">Or</div>

          {/* Sign Up Form */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              {/* <Label htmlFor="fullName" className="text-gray-300 text-sm">
                Full Name
              </Label> */}
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`mt-1 bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 ${
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
              {/* <Label htmlFor="email" className="text-gray-300 text-sm">
                Email Address
              </Label> */}
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="Email Address"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    className="text-red-400 text-sm mt-1"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}

                <Mail
                  size={20}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              {/* <Label htmlFor="password" className="text-gray-300 text-sm">
                Password
              </Label> */}
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070]focus:border-purple-400 pr-10 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
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
              {/* <Label
                htmlFor="confirmPassword"
                className="text-gray-300 text-sm"
              > */}
              {/* Confirm Password */}
              {/* </Label> */}
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`mt-1 bg-transparent border-[#2D2D2D] text-[#707070] placeholder-[#707070] focus:border-purple-400 pr-10 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : ""
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
              {/* <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={handleCheckboxChange}
                className="border-[#2D2D2D] data-[state=checked]:bg-[#201322] data-[state=checked]:border-[#2D2D2D]"
              /> */}
              <div className="text-[#CBD2EB] text-[12px]">
                By selecting Agree and continue, I agree to Stellopay's
                <Link
                  href="/terms"
                  className="text-[#92569D] text-[12px] ml-1 underline hover:no-underline"
                >
                  Terms of Service
                </Link>
                , and acknowledge the
                <Link
                  href="/privacy"
                  className="text-[#92569D] text-[12px] ml-1 underline hover:no-underline"
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
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="bg-[#35183A] relative text-left w-full h-full rounded-2xl p-10">
          <h2 className="text-[#F8D2FE] text-[24px] font-bold mb-4">
            StelloPay streamlines global payroll with fast, secure blockchain
            payments.
          </h2>
          <p className="text-[#E5E5E5] text-[16px] mb-8">
            Enter your credentials to access your account
          </p>

          {/* Mock Dashboard Preview */}
          <div className="absolute right-0 bottom-0 rounded-lg border border-gray-700">
            <Image
              src="/mock.png"
              alt="Dashboard mock-up"
              width={400}
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
