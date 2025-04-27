"use client";

import { useState } from "react";
import { Copy, Home, PiggyBank } from "lucide-react";

export default function AccountSummary() {
  const [copied, setCopied] = useState(false);
  const address = "0x8dE1243U45...67800UZ";

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    });
  };
  return (
    <div className="p-2 bg-[#1b0d22] max-w-5xl mx-auto mt-10">
      <div className="bg-[#2D2D2D] p-4 rounded-xl shadow-lg text-white ">
        <div className="flex items-center mb-6 space-x-2">
          <Home size={20} />
          <h2 className="text-lg font-semibold">Account Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account Balance Card */}
          <div className="bg-[#242424] p-5 rounded-lg flex flex-col justify-between">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-sm text-gray-400">
                Your Account Balance
              </span>
              <PiggyBank size={20} />
            </div>
            <div className="text-3xl font-bold mb-2">
              $2,432 <span className="text-base">USDC</span>
            </div>
            <div className="flex items-center text-xs text-gray-400 space-x-2">
              <span>Copy Address:</span>
              <span className="truncate text-white">{address}</span>
              <Copy size={14} className="cursor-pointer" onClick={handleCopy} />
              {copied && <span className="text-green-400 ml-2">Copied!</span>}
            </div>
          </div>

          {/* Paid This Month Card */}
          <div className="bg-[#242424] p-5 rounded-lg flex flex-col justify-between">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-sm text-gray-400">Paid This Month</span>
              <span className="text-green-400 text-xl">$</span>
            </div>
            <div className="text-3xl font-bold mb-2">$0</div>
            <div className="text-xs text-gray-400">ITEMS: 0</div>
          </div>

          {/* To Be Paid Card */}
          <div className="bg-[#242424] p-5 rounded-lg flex flex-col justify-between">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-sm text-gray-400">To Be Paid</span>
              <span className="text-orange-400 text-xl">$</span>
            </div>
            <div className="text-3xl font-bold mb-2">$0</div>
            <div className="text-xs text-gray-400">ITEMS: 0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
