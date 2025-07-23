'use client';
import Image from "next/image";
export default function AccountSummary() {
  return (
    <div className="max-w-[68.75rem] p-4 rounded-xl h-[12.75rem] my-6 border-[1px]  border-[#2D2D2D] bg-[#0D0D0D80]">
        <div className="w-full h-8 gap-3 mb-4  flex items-center">
            <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
                <Image src='/bank.png' alt="" width={24} height={24} className="w-6 h-6 top left"/>
            </div>
            <h1 className="font-[Inter] text-base leading-[145%] align-middle">Account Summary</h1>
        </div>

            <div className="max-w-[66.75rem] h-[7.5rem] gap-4 flex justify-between">
                <div className="max-w-[21.59rem] h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
                    <div className="w-[18.59rem] h-6 gap-2.5 flex">
                         <h1 className="text-sm align-middle font-[Inter]">Your Account Balance</h1>
                         <Image src="/piggy-bank.png" alt="deposit" width={24} height={24} className="rounded-[6px] bg-[#191919]"/>
                    </div>

                    <div className="w-[18.59rem] h-[2.19rem]">
                        <h1 className="font-semibold text-2xl align-middle font-[Inter]">$ 2,432 USDC</h1>
                    </div>

                    <div className="max-w-[16.4375rem] h-[17px] gap-1 inline-flex">
                        <p className="font-medium text-xs align-middle font-[Inter] text-[#3B3B3B]">Copy Address :                          <span className="text-[#D8D8D8] cursor-pointer">BaDE1b23U45...67890UzZ</span>
                        </p>
                        <Image src="/copy-01.png" alt="copy" width={14} height={14} className="w-3.5 h-3.5 cursor-pointer"/>
                    </div>
                      
                </div>

               <div className="w-[21.59rem] h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl"></div>
                <div className="w-[21.59rem] h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl"></div>
            </div>
    </div>      
  )
}
