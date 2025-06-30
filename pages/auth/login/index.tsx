import "@/app/globals.css";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Field } from "../components/field";
import { Eye, EyeClosed, Info, Mail } from "lucide-react";
import Dash from "@/public/Dashboard.png";

const FormAuth = () => {
  return (
    <div className="w-full mt-8 flex gap-4 mb-4">
      <button
        onClick={() => signIn("google")}
        className="w-full h-12 border rounded-lg px-4 flex items-center justify-center gap-2 transition-all hover:bg-[#7f5f83] hover:text-black"
      >
        <Image src="/google.svg" alt="google logo" width={24} height={24} />
        <span className="text-sm">Continue with Google</span>
      </button>
      <button
        onClick={() => signIn("apple")}
        className="w-full h-12 border rounded-lg px-4 flex items-center justify-center gap-2 transition-all hover:bg-[#7f5f83] hover:text-black"
      >
        <Image src="/apple.svg" alt="apple logo" width={24} height={24} />
        <span className="text-sm">Continue with Apple</span>
      </button>
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({
    email: "",
    password: "",
  });
  const isDisabled =
    !email || !password || error.email !== "" || error.password !== "";

  const validateForm = () => {
    let validField = true;
    const newErrors = {
      email: "",
      password: "",
    };

    if (!email) {
      newErrors.email = "Email is required";
      validField = false;
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
      validField = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      validField = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      validField = false;
    }

    setError(newErrors);
    return validField;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("form submitted successfully");
    }
  };

  const handleInputChange = (
    field: keyof typeof error,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (field === "email") {
      setEmail(e.target.value);
    } else if (field === "password") {
      setPassword(e.target.value);
    }

    if (error[field]) {
      setError({ ...error, [field]: "" });
    }
  };

  return (
    <div className="max-h-screen grid grid-cols-2 grid-rows-1 gap-4 p-8">
      <div className="bg-[#35183A] w-full h-full flex flex-col justify-between gap-4 rounded-2xl pl-14 pt-16">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-medium text-[#B596B9]">
            StelloPay streamlines global payroll with fast, secure blockchain
            payments.
          </h3>
          <span className="font-light text-gray-200">
            Enter your credentials to access your account
          </span>
        </div>
        <Image
          src={Dash}
          alt={"dashboard image"}
          className="w-full h-4/5 object-cover ml-auto shadow-[-8px_-8px_6px_0px_rgba(147,_51,_234,_0.5)]"
        />
      </div>
      <div className="px-8 flex flex-col justify-center max-w-lg w-full mx-auto">
        <span className="text-lg font-medium text-gray-200 tracking-widest">
          Stellopay
        </span>
        <h1 className="mt-4 mb-2 text-2xl font-semibold text-[#B596B9]">
          Welcome Back
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          Already have an account?{" "}
          <Link
            href="#"
            className="text-white underline hover:text-[#B596B9] transition-colors"
          >
            Sign Up
          </Link>
        </p>
        <FormAuth />
        <div className="flex items-center gap-4 my-4">
          <hr className="flex-grow border-t border-gray-600" />
          <span className="text-sm text-gray-400">Or</span>
          <hr className="flex-grow border-t border-gray-600" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            type="email"
            label="Email/Username"
            value={email}
            onChange={(e) => {
              handleInputChange("email", e);
            }}
            icon={<Mail size={18} className="text-gray-400" />}
          />
          {error.email && (
            <p className="text-red-500 text-sm flex items-center gap-1 transition-all duration-200 -mt-3">
              <Info size={14} /> {error.email}
            </p>
          )}
          <Field
            type={showPassword ? "text" : "password"}
            label="Password"
            value={password}
            onChange={(e) => {
              handleInputChange("password", e);
            }}
            icon={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {error.password && (
            <p className="text-red-500 text-sm flex items-center gap-1 transition-all duration-200 -mt-3">
              <Info size={14} /> {error.password}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                id="keep-login"
                className="accent-[#722f7e] w-4 h-4"
              />
              Remember me
            </label>
            <Link
              href="/signup"
              className="text-white underline hover:text-[#B596B9]"
            >
              Forgot Password
            </Link>
          </div>
          <Button
            type="submit"
            disabled={isDisabled}
            variant={isDisabled ? "outline" : "default"}
            className={`h-12 text-black transition-colors ${
              isDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-white hover:bg-[#B596B9]"
            }`}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
