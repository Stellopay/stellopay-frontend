"use client";
import Link from "next/link";
import { HiMiniMagnifyingGlass } from "react-icons/hi2";
import { useEffect, useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { apiGet } from "@/lib/backend";

export default function SideBar() {
  const { address } = useWallet();
  const [transactionCount, setTransactionCount] = useState<number>(0);

  // Fetch transaction count
  useEffect(() => {
    if (!address) {
      setTransactionCount(0);
      return;
    }

    const fetchTransactionCount = async () => {
      try {
        const result = await apiGet<{ transactions: unknown[] }>(
          `/transactions/${address}?limit=100`
        );
        setTransactionCount(result.transactions?.length || 0);
      } catch (e) {
        console.error("[sidebar-section] Failed to fetch transaction count:", e);
        setTransactionCount(0);
      }
    };

    void fetchTransactionCount();
  }, [address]);

  return (
        <div className='w-[12.25rem] xl:w-[16.25rem] h-[1342px] gap-7 border-r border-r-[#1A1A1A] bg-[#101010] hidden lg:flex'>
            <div className='w-[12.25rem] xl:w-[16.25rem] h-[373px] gap-8'>
              <div className='w-[12.25rem] xl:w-[16.25rem] h-20 gap-1 rounded-[4px] py-2 px-6 border-b border-[#1A1A1A] flex items-center'>
                 <h1 className='w-[109px] h-[29px] font-semibold text-2xl font-[Inter] text-[#E5E5E5]'>Stellopay</h1>
             </div>

              <div className='w-[12.25rem] xl:w-[16.25rem] h-9 rounded-[4px]   mt-6'>
                <div className="w-[85%] xl:w-[228px] h-9 px-4 border border-[#2D333E] rounded-[6px] flex items-center mx-auto">
                   <HiMiniMagnifyingGlass className="w-5 h-5"/>
                   <input type="text" name='' placeholder='Search' className='outline-none pl-1.5 w-16 xl:w-32'/>
                </div>
                
                  
              </div>
                 {/* Siderbar menu */}
              <div className='w-full h-[201px] mt-7'>
                <div className='w-[10.25rem] xl:w-[14.25rem] h-0 border border-[#191919] mx-auto'></div>
                <div className='w-[13.25rem] xl:w-[14.25rem] h-[188px] mt-3 mx-auto flex flex-col justify-between'>
                  <Link href='/'>
                     <div className='w-[96%] xl:w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex items-center align-middle'>
                         <svg width="20" height="20" className="ml-3" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.33325 9.58333C2.18266 9.58333 1.24992 8.65059 1.24992 7.5L1.24992 3.33333C1.24992 2.18274 2.18266 1.25 3.33325 1.25H7.49992C8.65051 1.25 9.58325 2.18274 9.58325 3.33333V7.5C9.58325 8.65059 8.65051 9.58333 7.49992 9.58333H3.33325ZM2.91659 7.5C2.91659 7.73012 3.10313 7.91667 3.33325 7.91667L7.49992 7.91667C7.73004 7.91667 7.91658 7.73012 7.91658 7.5V3.33333C7.91658 3.10322 7.73004 2.91667 7.49992 2.91667L3.33325 2.91667C3.10313 2.91667 2.91658 3.10322 2.91658 3.33333L2.91659 7.5Z"/>
                              <path d="M6.39662 10.9952C5.62524 10.2238 4.3746 10.2238 3.60322 10.9952L1.41178 13.1866C0.640408 13.958 0.640408 15.2087 1.41178 15.98L3.60322 18.1715C4.3746 18.9428 5.62524 18.9428 6.39662 18.1715L8.58805 15.98C9.35943 15.2087 9.35943 13.958 8.58805 13.1866L6.39662 10.9952ZM4.78173 12.1737C4.90223 12.0532 5.0976 12.0532 5.2181 12.1737L7.40954 14.3651C7.53004 14.4856 7.53004 14.681 7.40954 14.8015L5.2181 16.993C5.0976 17.1135 4.90223 17.1135 4.78173 16.993L2.59029 14.8015C2.46979 14.681 2.46979 14.4856 2.59029 14.3651L4.78173 12.1737Z"/>
                              <path d="M10.4166 16.6667C10.4166 17.8173 11.3493 18.75 12.4999 18.75H16.6666C17.8172 18.75 18.7499 17.8173 18.7499 16.6667V12.5C18.7499 11.3494 17.8172 10.4167 16.6666 10.4167H12.4999C11.3493 10.4167 10.4166 11.3494 10.4166 12.5V16.6667ZM12.4999 17.0833C12.2698 17.0833 12.0833 16.8968 12.0833 16.6667V12.5C12.0833 12.2699 12.2698 12.0833 12.4999 12.0833H16.6666C16.8967 12.0833 17.0833 12.2699 17.0833 12.5V16.6667C17.0833 16.8968 16.8967 17.0833 16.6666 17.0833H12.4999Z"/>
                              <path d="M10.4166 5.41667C10.4166 7.71785 12.2821 9.58333 14.5833 9.58333C16.8844 9.58333 18.7499 7.71785 18.7499 5.41667C18.7499 3.11548 16.8844 1.25 14.5833 1.25C12.2821 1.25 10.4166 3.11548 10.4166 5.41667ZM14.5833 2.91667C15.964 2.91667 17.0833 4.03595 17.0833 5.41667C17.0833 6.79738 15.964 7.91667 14.5833 7.91667C13.2025 7.91667 12.0833 6.79738 12.0833 5.41667C12.0833 4.03596 13.2025 2.91667 14.5833 2.91667Z"/>
                          </svg>
                          <h2 className="font-[Inter] font-medium text-sm pl-2.5">Dasboard</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[96%] xl:w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] history transition-all duration-200 inline-flex items-center align-middle'>
                         <svg width="20" height="20" className="ml-3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.8333 8.75V8.3333C15.8333 5.19064 15.8332 3.61926 14.857 2.64296C13.8806 1.66667 12.3093 1.66667 9.16662 1.66667C6.02403 1.66667 4.45267 1.66672 3.47636 2.643C2.50008 3.6193 2.50006 5.1906 2.50003 8.33324L2.5 12.0833C2.49998 14.8228 2.49997 16.1927 3.25657 17.1146C3.3951 17.2834 3.54988 17.4382 3.71869 17.5768C4.64064 18.3333 6.01041 18.3333 8.74995 18.3333" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5.83325 5.83333H12.4999M5.83325 9.16666H9.16659" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15 15.4167L13.75 14.9583V12.9167M10 14.5833C10 16.6544 11.6789 18.3333 13.75 18.3333C15.8211 18.3333 17.5 16.6544 17.5 14.5833C17.5 12.5122 15.8211 10.8333 13.75 10.8333C11.6789 10.8333 10 12.5122 10 14.5833Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                        <h2 className="font-[Inter] font-medium text-sm pl-2.5">Transactions {transactionCount > 0 && <span className="w-fit h-[17px] px-2 rounded-[10px] bg-[#191919] font-medium font-[Inter] text-center ml-6 xl:ml-12 hover:text-white">{transactionCount}</span>}</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[96%] xl:w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex items-center align-middle'>
                        <svg width="20" height="20" className="ml-3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6024 18.3334 9.99999C18.3334 5.39762 14.6025 1.66666 10.0001 1.66666C5.39771 1.66666 1.66675 5.39762 1.66675 9.99999C1.66675 14.6024 5.39771 18.3333 10.0001 18.3333Z" stroke="currentColor" strokeWidth="1.25"/>
                          <path d="M8.33325 7.50001C8.33325 6.57954 9.07942 5.83334 9.99992 5.83334C10.9204 5.83334 11.6666 6.57954 11.6666 7.50001C11.6666 7.8318 11.5697 8.14095 11.4025 8.40068C10.9044 9.17476 9.99992 9.91284 9.99992 10.8333V11.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          <path d="M9.99316 14.1667H10.0007" stroke="currentColor" strokeWidth={1.66667} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>

                        <h2 className="font-[Inter] font-medium text-sm pl-2.5">Help/Support</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[96%] xl:w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex items-center align-middle'>
                        <svg width="20" height="20" className="ml-3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.7645 5.95117L17.3532 5.23734C17.0421 4.69748 16.8866 4.42755 16.6219 4.31991C16.3572 4.21228 16.0579 4.29721 15.4593 4.46708L14.4425 4.7535C14.0603 4.84163 13.6593 4.79163 13.3104 4.61234L13.0297 4.45036C12.7304 4.2587 12.5003 3.97612 12.3728 
                          3.64396L12.0946 2.81281C11.9116 2.2628 11.8201 1.98779 11.6023 1.83049C11.3845 1.67319 11.0952 1.67319 10.5165 1.67319H9.5875C9.00892 1.67319 8.71958 1.67319 8.50175 1.83049C8.28396 1.98779 8.19247 2.2628 8.00949 2.81281L7.73119 3.64396C7.60379 3.97612 7.37363
                           4.2587 7.07439 4.45036L6.79366 4.61234C6.4447 4.79163 6.04374 4.84163 5.66157 4.7535L4.64471 4.46708C4.04609 4.29721 3.74679 4.21228 3.48214 4.31991C3.21749 4.42755 3.06196 4.69748 2.75088 5.23734L2.33956 5.95117C2.04797 6.45721 1.90217 6.71024 1.93047 6.97959C1.95876 
                           7.24894 2.15394 7.466 2.5443 7.90011L3.4035 8.86068C3.6135 9.12651 3.76259 9.58984 3.76259 10.0064C3.76259 10.4232 3.61355 10.8863 3.40353 11.1523L2.5443 12.1128C2.15394 12.547 1.95877 12.764 1.93047 13.0334C1.90217 13.3028 2.04797 13.5558 2.33956 14.0618L2.75087 14.7756C3.06194 
                           15.3154 3.21749 15.5854 3.48214 15.693C3.74679 15.8007 4.0461 15.7158 4.64473 15.5458L5.66153 15.2594C6.04378 15.1713 6.44481 15.2213 6.79381 15.4007L7.0745 15.5627C7.37368 15.7543 7.60378 16.0368 7.73117 16.369L8.00949 17.2003C8.19247 17.7503 8.28396 18.0253 8.50175 18.1826C8.71958 18.3398
                            9.00892 18.3398 9.5875 18.3398H10.5165C11.0952 18.3398 11.3845 18.3398 11.6023 18.1826C11.8201 18.0253 11.9116 17.7503 12.0946 17.2003L12.3729 16.369C12.5003 16.0368 12.7303 15.7543 13.0296 15.5627L13.3103 15.4007C13.6593 15.2213 14.0603 15.1713 14.4425 15.2594L15.4593 15.5458C16.0579 15.7158 
                            16.3572 15.8007 16.6219 15.693C16.8866 15.5854 17.0421 15.3154 17.3532 14.7756L17.7645 14.0618C18.0561 13.5558 18.2018 13.3028 18.1736 13.0334C18.1452 12.764 17.9501 12.547 17.5598 12.1128L16.7005 11.1523C16.4905 10.8863 16.3414 10.4232 16.3414 10.0064C16.3414 9.58984 16.4906 9.12651 16.7005 8.86068L17.5598
                             7.90011C17.9501 7.466 18.1452 7.24894 18.1736 6.97959C18.2018 6.71024 18.0561 6.45721 17.7645 5.95117Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          <path d="M12.9329 10C12.9329 11.6108 11.6271 12.9167 10.0163 12.9167C8.40542 12.9167 7.09961 11.6108 7.09961 10C7.09961 8.38918 8.40542 7.08334 10.0163 7.08334C11.6271 7.08334 12.9329 8.38918 12.9329 10Z" stroke="currentColor" strokeWidth="1.25"/>
                        </svg> 
                        <h2 className="font-[Inter] font-medium text-sm pl-2.5 w-[164px] h-5">Settings</h2>
                     </div>
                  </Link>
                </div>
              </div>
           </div>
        </div>
  )
}
