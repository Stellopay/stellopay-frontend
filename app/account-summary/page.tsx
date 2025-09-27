"use client";

import { useState } from "react";
import { Copy, Home, PiggyBank } from "lucide-react";
import Image from "next/image";
import Icon from "@/public/Icon.png";
import Piggy from "@/public/piggy-bank.png";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";

export default function AccountSummary() {
  const [copied, setCopied] = useState(false);
  const address = "0x8dE1243U45...67800UZ";

  const handleCopy = () => {
    copyToClipboardWithTimeout(address, setCopied);
  };
  return (
    <div className="bg-[#140D13] p-4 rounded-xl border border-[#2D2D2D] shadow-lg text-white ">
      <div className="flex items-center mb-6 space-x-2">
        <Image src={Icon} alt="Icon" />
        <h2 className="text-lg font-semibold">Account Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account Balance Card */}
        <div className="bg-[#121212] border border-[#2E2E2E] p-5 rounded-lg flex flex-col justify-between">
          <div className="flex gap-2 items-center mb-2">
            <span className="text-sm text-gray-400">Your Account Balance</span>
            <Image src={Piggy} alt="Piggy Bank Icon" />
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
        <div className="bg-[#121212] border border-[#2E2E2E] p-5 rounded-lg flex flex-col justify-between">
          <div className="flex gap-2 items-center mb-2">
            <span className="text-sm text-gray-400">Paid This Month</span>
            <span className="text-green-400 text-xl">$</span>
          </div>
          <div className="text-3xl font-bold mb-2">$0</div>
          <div className="text-xs text-gray-400">ITEMS: 0</div>
        </div>

        {/* To Be Paid Card */}
        <div className="bg-[#121212] border border-[#2E2E2E] p-5 rounded-lg flex flex-col justify-between">
          <div className="flex gap-2 items-center mb-2">
            <span className="text-sm text-gray-400">To Be Paid</span>
            <span className="text-orange-400 text-xl">$</span>
          </div>
          <div className="text-3xl font-bold mb-2">$0</div>
          <div className="text-xs text-gray-400">ITEMS: 0</div>
        </div>
      </div>
    </div>
  );
}
