"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";

export default function SecurityTab() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleSaveChanges = () => {
    // Handle save changes logic here
    console.log("Saving password changes");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Password Update Section */}
      <div className="bg-[#0D0D0D80] p-6 border border-[#2d2d2d] rounded-lg">
        <div className="flex items-center mb-6">
          <div className="mr-2 bg-[#2d2d2d] p-2 rounded-lg">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12105 13.2453 4 14.3624 4 15.5C4 16.6376 4.12105 17.7547 4.26781 18.8447Z"
                stroke="#E5E5E5"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9"
                stroke="#E5E5E5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 15.49V15.5"
                stroke="#E5E5E5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 15.49V15.5"
                stroke="#E5E5E5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 15.49V15.5"
                stroke="#E5E5E5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Update Account Password</h2>
        </div>

        <div className="border-t border-[#2d2d2d] pt-4">
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-[#2d2d2d] rounded-lg bg-[#0D0D0D] text-white"
              />
              <button
                className="absolute right-3 top-3 text-gray-400"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-300">
              Re-Enter Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-[#2d2d2d] rounded-lg bg-[#0D0D0D] text-white"
              />
              <button
                className="absolute right-3 top-3 text-gray-400"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveChanges}
            className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* 2-Step Verification Section */}
      <div className="bg-[#0D0D0D80] p-6 border border-[#2d2d2d] rounded-lg flex flex-col ">
        <div className="flex items-center mb-6">
          <div className="mr-2 bg-[#2d2d2d] p-2 rounded-lg">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5582 14.5613C9.96836 15.1511 9.02509 15.1432 8.4425 14.5607C7.85991 13.9781 7.84704 13.0298 8.43687 12.44C9.02671 11.8502 9.98123 11.8567 10.5638 12.4393C11.1464 13.0219 11.148 13.9715 10.5582 14.5613Z"
                stroke="#E5E5E5"
                strokeWidth="1.5"
              />
              <path
                d="M11 12L13 10M13 10L15 8L17 10M13 10L14.5 11.5"
                stroke="#E5E5E5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 11.1833V8.28029C21 6.64029 21 5.82028 20.5959 5.28529C20.1918 4.75029 19.2781 4.49056 17.4507 3.9711C16.2022 3.6162 15.1016 3.18863 14.2223 2.79829C13.0234 2.2661 12.424 2 12 2C11.576 2 10.9766 2.2661 9.77771 2.79829C8.89839 3.18863 7.79784 3.61619 6.54933 3.9711C4.72193 4.49056 3.80822 4.75029 3.40411 5.28529C3 5.82028 3 6.64029 3 8.28029V11.1833C3 16.8085 8.06277 20.1835 10.594 21.5194C11.2011 21.8398 11.5046 22 12 22C12.4954 22 12.7989 21.8398 13.406 21.5194C15.9372 20.1835 21 16.8085 21 11.1833Z"
                stroke="#E5E5E5"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Set 2-Step verification</h2>
        </div>

        <div className="border-t border-[#2d2d2d] pt-4">
          <div className="flex items-center justify-between p-4 bg-[#0D0D0D80] border border-[#2d2d2d] rounded-lg text-white">
            <div>
              <span className="block text-base font-medium">
                2-Step verification
              </span>
              <span className="block text-sm text-gray-400">
                Enable 2-step authentication
              </span>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                twoFactorEnabled ? "bg-purple-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
