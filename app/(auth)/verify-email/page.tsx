'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
    if (value.length <= 6) setCode(value);
  };

  const handleResend = () => {
    // Placeholder for resend logic
    alert('Verification code resent.');
  };

  const handleContinue = () => {
    // Placeholder for continue logic
    alert(`Submitted code: ${code}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Close icon */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 right-6 text-white cursor-pointer"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Modal Card */}
      <div className="border-[#2D2D2D] border rounded-[24px] px-7 sm:px-11 py-9 w-full max-w-[480px] space-y-4 text-center shadow-lg">
        <h1 className="text-[#F8D2FE] text-2xl sm:text-[32px] font-medium mb-2">Check your email</h1>
        <p className="text-sm text-[#ACB4B5] mb-6">
          Didn&apos;t get code?{' '}
          <button onClick={handleResend} className="text-white font-semibold underline cursor-pointer">
            Resend
          </button>
        </p>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={handleInputChange}
          className="w-full text-left py-3 px-4 rounded-[8px] border border-[#2D2D2D] bg-transparent text-white mb-4 outline-none  mt-5"
          placeholder="- - - - - - - -"
        />

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={code.length !== 6}
          className={`w-full  py-3 px-4 rounded-[8px]  bg-[#FFFFFF] text-black font-medium transition  mt-2 ${
            code.length > 1 ? 'cursor-pointer' : 'opacity-80 cursor-not-allowed'
          }`}
        >
          Continue
        </button>

        {/* Go Back */}
        <button
          onClick={() => router.back()}
          className=" text-[13px] text-[#FFFFFF] underline font-semibold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
