'user client'

import Image from "next/image";
import Link from "next/link";
import PaymentHistory from "./payment-history";

const amounts = [
  { amount: 92 },
  { amount: 48 },
  { amount: 24}, 
  { amount: 12},  
  { amount: 0}
];

const years = [
   {year: "Jan"}, {year: "Feb"},
   {year: "Mar"}, {year: "Apr"},
  {year: "May"},  {year: "Jun"},
  {year: "Jul"}, {year: "Aug"},
  {year: "Sept"}, {year: "Oct"},
  {year: "Nov"},  {year: "Dec"}
  
]

export default function AnalyticsView() {
  return (
    <div className='max-w-[1100px] h-[332px] flex max-md:flex-col gap-6'>
        <div className='w-[42.25rem] h-[20.75rem] border border-[#2D2D2D] rounded-md gap-4 p-4'>
            <div className='w-[40.25rem] h-9 flex justify-between mx-auto'>
              <div className='w-[368px] flex align-middle items-center'>
                <div className="w-8 h-8 border border-[#2E2E2E] rounded-[8px] bg-[#121212] flex justify-center items-center">
                  <Image src='/chart-up.png' alt="" width={20} height={20} className="object-contain w-5 h-5"/>
                </div>
                <h1 className="pl-4">Analytics views</h1>
              </div>
                <div className="w-24 h-9 gap-1 border border-[#2E2E2E] rounded-[8px] p-2 bg-[#121212]">
                   {/* <input type="text" value='date' placeholder="This Year"/> */}
                   This Year
                </div>
            </div>

              <div className="w-[644px] h-[248px] mt-3.5 border border-[#2D2D2D] p-4 rounded-md">
                <div className="w-[612px] h-[198px] mt-2 flex justify-between">
                   <div className="w-[35.25px] h-[194px] flex flex-col gap-6 text-xs text-center text-[Plus Jakarta Sans]">
                     {amounts.map((amount, index) => (
                       <div key={`${amount.amount}-${index}`}>
                         {amount.amount}K
                       </div>
                      ))}
                   </div>

                   
                     {years.map((year, index) => (
                       <div key={`${year.year}-${index}`}>
                        <div className="w-[35.25px] h-[194px] font-[Jakarta Sans] text-xs text-center border border-amber-400 flex flex-col justify-end">
                             {year.year}

                        </div>   
                       </div>
                      ))}
                </div>
              </div>
        </div>

        <div className='w-[400px] h-[332px] border border-[#2D2D2D] rounded-md p-4'>
          <div className="w-[36ppx] h-9 gap-3 flex justify-between">
            <div className="flex align-middle justify-center items-center">
              <div className="w-8 h-8 border border-[#2E2E2E] rounded-[8px] bg-[#121212] flex items-center justify-center">
                 <Image src='/notification-02.png' alt="Notification" width={24} height={24} className="w-6 h-6 object-contain"/>
              </div>
              <h1 className="font-[Inter] text-base align-middle text-[#E5E5E5] pl-3">
                Notifications
              </h1>
            </div>

             <div className="w-[87px] h-9 gap-1 rounded-[8px] border border-[#2E2E2E] bg-[#121212] p-2 flex justify-center items-center">
                <h1 className="font-[Inter] align-middle text-sm text-[#E5E5E5]">View All</h1>
                <Image src='/arrow-right-01.png' alt="arrow-right" width={14} height={14} className="w-35. h-3.5 object-contain"/>
             </div>
          </div>
            <PaymentHistory />
        </div>

    </div>
  )
}
