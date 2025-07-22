import React from 'react';
import Image from "next/image";
import Link from 'next/link';
// import DashboardPayment from "@/components/dashboard/dashboard-header";
import { IoNotifications} from "react-icons/io5";
import { TbSettings } from "react-icons/tb";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { PiPaperPlaneTilt } from "react-icons/pi";

export default function dashboard() {
  return (
    <div className='w-full h-dvh flex'>
        <div className='w-2/12 border-2 border-white h-dvh'>
        dashboard-page
        </div>
            <div className='w-10/12'>
                <div className='w-full h-20 gap-2.5 pt-4 px-10 border-b border-[#1E222A]'>
                    <div className='max-w-[1100px] h-10 flex justify-between'>
                        <div className='w-[400px] h-10 py-1.5 px-4 rounded-[6px] border border-[#242428]'>
                            <input type="text" placeholder='Search here...' className='outline-none text-[#E5E5E5] text-[14px] leading-[145%] align-middle font-[Inter] font-normal'/>
                        </div>
                        <div className='w-[228] h-10 flex justify-between'>
                            <Link href="/" className='w-9 h-9 gap-2.5 rounded-[40px] p-1.5 relative'>
                                <div className='w-2.5 h-2.5 bg-[#EB6945] top-[1.71px] right-[3.43px] absolute rounded-full'></div>
                                <IoNotifications className='text-[#333333] w-6 h-6' />
                            </Link>

                            <Link href='/' className='w-9 h-9 gap-2.5 rounded-[40px] p-1.5'>
                                <TbSettings className='text-[#707070] w-6 h-6'/>
                            </Link>

                            <Link href='/' className='w-9 h-9 gap-2.5 rounded-[40px] p-1.5'>
                                <RxQuestionMarkCircled className='text-[#707070] w-6 h-6'/>
                            </Link>

                            <div className='w-0 h-8 border border-[#1E222A]'></div>

                            <Link href='/' className='relative'>
                                <Image src='/avatar.jpg' alt='profile-image' width={40} height={40} className="object-cover w-10 h-10 rounded-full border-[1.5px] border-[#F26EB2] bg-[#4C2900]"/>
                                <div className='w-2.5 h-2.5 bg-[#059836] left-[30px] top-7 absolute border-[1px] border-[#F26EB2] rounded-full'></div>
                            </Link>
                        </div> 
                    </div>
                </div>

                <div className='max-w-[1400px] h-[1250px] border-2 border-purple-600 py-6 px-10'>
                    <div className="w-full px-4 md:px-6">
                       <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           <h1 className="text-white text-2xl font-semibold pl-4"></h1>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                <button className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md border border-[#2c2c2c] hover:bg-[#111] transition w-full sm:w-auto">
                                    <span><PiPaperPlaneTilt /></span> Send Payment
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border hover:bg-[#f3f3f3] transition w-full sm:w-auto">
                                   <span>⬇️</span> Request Payment
                                </button>     
                            </div>    
                        </div> 
                    </div>     
                </div>
            </div> 
    </div>              
  )
}
