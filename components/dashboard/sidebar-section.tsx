'user client'

import Link from "next/link";
import Image from "next/image";
import { HiMiniMagnifyingGlass } from "react-icons/hi2";
import { TbSettings } from "react-icons/tb";
import { RxQuestionMarkCircled } from "react-icons/rx";



export default function SideBar() {
  return (
        <div className='w-[16.25rem] h-[1342px] gap-7 border-r border-r-[#1A1A1A] bg-[#101010]'>
            <div className='w-[16.25rem] h-[373px] gap-8'>
              <div className='w-[16.25rem] h-20 gap-1 rounded-[4px] py-2 px-6 border-b border-[#1A1A1A] flex items-center'>
                 <h1 className='w-[109px] h-[29px] font-semibold text-2xl font-[Inter] text-[#E5E5E5]'>Stellopay</h1>
             </div>

              <div className='w-[16.25rem] h-9 rounded-[4px]   mt-6'>
                <div className="w-[228px] h-9 px-4 border border-[#2D333E] rounded-[6px] flex items-center mx-auto">
                   <HiMiniMagnifyingGlass className="w-5 h-5"/>
                   <input type="text" name='' placeholder='Search' className='outline-none pl-1.5 w-32'/>
                </div>
                
                  
              </div>
                 {/* Siderbar menu */}
              <div className='w-full h-[201px] mt-7'>
                <div className='w-[14.25rem] h-0 border border-[#191919] mx-auto'></div>

                <div className='w-[14.25rem] h-[188px] mt-3 mx-auto flex flex-col justify-between'>
                  <Link href='/'>
                     <div className='w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex align-middle'>
                          <Image src='/icon.png' alt="settings" width={20}  height={20} className="w-5 h-5 object-contain text-[white]"/>
                          <h2 className="font-[Inter] font-medium text-sm pl-2.5">Dasboard</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] history transition-all duration-200 inline-flex items-center align-middle'>
                       <Image src='/transaction-history.svg' alt="settings" width={20}  height={20} className="w-5 h-5 object-contain"/>
                         {/* <RxQuestionMarkCircled className='w-5 h-5 object-contain '/> */}
                        <h2 className="font-[Inter] font-medium text-sm pl-2.5">Transactions</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex items-center align-middle'>
                      <RxQuestionMarkCircled className='w-5 h-5 object-contain'/>
                        <h2 className="font-[Inter] font-medium text-sm pl-2.5">Help/Support</h2>
                     </div>
                  </Link>

                   <Link href='/'>
                     <div className='w-[228px] h-11 rounded-[8px] text-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#0D0D0D] transition-all duration-200 inline-flex items-center align-middle'>
                       <TbSettings className='w-5 h-5 object-contain'/>
                        <h2 className="font-[Inter] font-medium text-sm pl-2.5">Settings</h2>
                     </div>
                  </Link>
                  
                </div>
              </div>
           </div>
        </div>
  )
}
