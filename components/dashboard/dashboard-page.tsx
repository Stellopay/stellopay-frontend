'user client'
import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import AccountSummary from '@/components/dashboard/account-summary';
import SidebarSection from '@/components/dashboard/sidebar-section';
import AnalyticsView from '@/components/dashboard/analytics-view';
import TransactionHistory from './transaction-history';
import { TbSettings, TbDownload } from "react-icons/tb";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { PiPaperPlaneTilt } from "react-icons/pi";



export default function dashboard() {
  return (
    <div className='max-w-[1440px] h-[1342px] flex max-md:flex-col'>
        <SidebarSection />
        
            <div className='w-full h-[1338px] overflow-hidden'>
                <div className='w-full h-20 gap-2.5 pt-4 px-10 border-b border-[#1E222A]'>
                    <div className='w-full h-10 flex justify-between'>
                        <div className='w-[400px] h-10 py-1.5 px-4 rounded-[6px] border border-[#242428]'>
                            <input type="text" placeholder='Search here...' className='outline-none text-[#E5E5E5] text-[14px] leading-[145%] align-middle font-[Inter] font-normal'/>
                        </div>
                        <div className='w-[228px] h-10 flex justify-between'>
                            <Link href="/" className='w-9 h-9 p-1.5 gap-2.5'>
                            <div className='w-6 h-6 relative'>
                                <div className='w-[12.9px] h-[12.9px] bg-[#EB6945] top-[-1.71px] right-[-3.43px] absolute rounded-[34.29px]'></div>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.0002 3C13.0002 2.44771 12.5525 2 12.0002 2C11.4479 2 11.0002 2.44771 11.0002 3V4.5C11.0002 4.52773 11.0013 4.5552 11.0035 4.58236C8.16418 5.05688 6.0002 7.52474 6.0002 10.4989V14.5C6.0002 15.0002 5.59009 15.8676 5.14129 16.6671C4.50977 17.7921 4.62542 19.1484 5.8311 19.6075C7.04372 20.0692 8.98346 20.5 12.0002 20.5C15.0169 20.5 16.9567 20.0692 18.1693 19.6075C19.375 19.1484 19.4906 17.7921 18.8591 16.6671C18.4103 15.8676 18.0002 15.0002 18.0002 14.5V10.4994C18.0002 7.52521 15.8362 5.05697 12.9969 4.58238C12.9991 4.55521 13.0002 4.52773 13.0002 4.5V3Z" fill="#333333"/>
                                    <path d="M8.9203 21.3246C8.95763 21.3571 9.00271 21.3952 9.05521 21.4372C9.2055 21.5574 9.42021 21.7132 9.69158 21.8683C10.2301 22.176 11.0264 22.5 12.0002 22.5C12.974 22.5 13.7703 22.176 14.3089 21.8683C14.5802 21.7132 14.7949 21.5574 14.9452 21.4372C14.9977 21.3952 15.0428 21.3571 15.0801 21.3246C14.2058 21.4335 13.1862 21.5 12.0002 21.5C10.8142 21.5 9.79465 21.4335 8.9203 21.3246Z" fill="#333333"/>
                                </svg>
                            </div>
                            </Link>

                            <Link href='/' className='w-9 h-9 gap-2.5 rounded-[40px] p-1.5'>
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9994 6.00002C8.68567 6.00002 5.99938 8.68632 5.99938 12C5.99938 15.3137 8.68567 18 11.9994 18C15.3131 18 17.9994 15.3137 17.9994 12C17.9994 8.68632 15.3131 6.00002 11.9994 6.00002ZM7.99938 12C7.99938 9.79088 9.79024 8.00002 11.9994 8.00002C14.2085 8.00002 15.9994 9.79088 15.9994 12C15.9994 14.2092 14.2085 16 11.9994 16C9.79024 16 7.99938 14.2092 7.99938 12Z" fill="#707070"/>
                                <path d="M14.5012 2.02893C13.1063 0.679478 10.8925 0.679478 9.49757 2.02893C9.14327 2.37168 8.65062 2.53175 8.16252 2.46271C6.24082 2.1909 4.44984 3.49212 4.11451 5.40376C4.02934 5.88931 3.72487 6.30838 3.2894 6.53942C1.57495 7.44907 0.890854 9.5545 1.7432 11.2981C1.95969 11.741 1.95969 12.259 1.7432 12.7019C0.890854 14.4456 1.57495 16.551 3.2894 17.4606C3.72487 17.6917 4.02934 18.1107 4.11451 18.5963C4.44984 20.5079 6.24083 21.8092 8.16252 21.5373C8.65062 21.4683 9.14327 21.6284 9.49757 21.9711C10.8925 23.3206 13.1063 23.3206 14.5012 21.9711C14.8555 21.6284 15.3481 21.4683 15.8362 21.5373C17.7579 21.8092 19.5489 20.5079 19.8843 18.5963C19.9694 18.1107 20.2739 17.6917 20.7094 17.4606C22.4238 16.551 23.1079 14.4456 22.2556 12.7019C22.0391 12.259 22.0391 11.741 22.2556 11.2981C23.1079 9.5545 22.4238 7.44907 20.7094 6.53942C20.2739 6.30838 19.9694 5.88931 19.8843 5.40376C19.5489 3.49212 17.7579 2.1909 15.8362 2.46271C15.3481 2.53175 14.8555 2.37168 14.5012 2.02893ZM10.8882 3.46637C11.5077 2.867 12.491 2.867 13.1106 3.46637C13.9083 4.23805 15.0174 4.59843 16.1163 4.443C16.9699 4.32227 17.7654 4.90023 17.9143 5.74931C18.1061 6.84247 18.7916 7.78597 19.772 8.30615C20.5335 8.71018 20.8373 9.64534 20.4587 10.4198C19.9713 11.4169 19.9713 12.5831 20.4587 13.5802C20.8373 14.3547 20.5335 15.2899 19.772 15.6939C18.7916 16.2141 18.1061 17.1576 17.9143 18.2507C17.7654 19.0998 16.9699 19.6778 16.1163 19.5571C15.0174 19.4016 13.9083 19.762 13.1106 20.5337C12.491 21.1331 11.5077 21.1331 10.8882 20.5337C10.0905 19.762 8.98134 19.4016 7.88242 19.5571C7.02887 19.6778 6.23337 19.0998 6.08443 18.2507C5.89268 17.1576 5.20718 16.2141 4.22678 15.6939C3.46528 15.2899 3.16143 14.3547 3.54001 13.5802C4.02742 12.5831 4.02742 11.4169 3.54001 10.4198C3.16143 9.64534 3.46528 8.71018 4.22678 8.30615C5.20718 7.78597 5.89268 6.84247 6.08443 5.74931C6.23337 4.90023 7.02887 4.32227 7.88242 4.443C8.98134 4.59843 10.0905 4.23805 10.8882 3.46637Z" fill="#707070"/>
                             </svg>    
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

                <div className='w-full h-[78.125rem] pt-6 px-10'>
                    <div className="w-full">
                       <div className="w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           <h1 className="text-white text-2xl font-semibold ml-0">Dashboard</h1>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                <Link href='/' className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md border border-[#2c2c2c] hover:bg-[#111] transition w-full sm:w-auto">
                                    <span><PiPaperPlaneTilt /></span>Send Payment
                                </Link>
                                <Link href='/' className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border hover:bg-[#f3f3f3] transition w-full sm:w-auto">
                                   <span><TbDownload /></span> Request Payment
                                </Link>     
                            </div>    
                        </div> 
                    </div>  
                    <AccountSummary />
                    <AnalyticsView />
                    <TransactionHistory />
                </div>
            </div> 
    </div>              
  )
}
