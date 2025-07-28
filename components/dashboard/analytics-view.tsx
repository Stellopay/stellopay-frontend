'use client'

import Image from "next/image";
import Link from "next/link";
import PaymentHistory from "./payment-history";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp, IoIosArrowForward } from "react-icons/io";

const amounts = [
  { amount: 92 },
  { amount: 48 },
  { amount: 24}, 
  { amount: 12},  
  { amount: 0}
];

const years = [
   {year: "Jan", value: 75}, {year: "Feb", value: 45},
   {year: "Mar", value: 80}, {year: "Apr", value: 30},
  {year: "May", value: 65},  {year: "Jun", value: 90},
  {year: "Jul", value: 55}, {year: "Aug", value: 70},
  {year: "Sept", value: 40}, {year: "Oct", value: 85},
  {year: "Nov", value: 35},  {year: "Dec", value: 60}
];

export default function AnalyticsView() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("This Year");
  
  const yearOptions = [
    "This Year",
    "2024",
    "2023", 
    "2022",
    "2021",
    "2020"
  ];
  
  const maxValue = Math.max(...years.map(y => y.value));
  
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };
  
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
                <div className="relative">
                  <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-24 h-9 flex items-center justify-between text-sm border border-[#2E2E2E] rounded-[8px] p-2 bg-[#121212] cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                  >
                    <h1 className="font-[Inter] text-sm text-[#E5E5E5]">{selectedYear}</h1>
                    {isDropdownOpen ? <IoIosArrowUp className="text-[#E5E5E5]" /> : <IoIosArrowDown className="text-[#E5E5E5]" />}
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-10 left-0 w-24 bg-[#121212] border border-[#2E2E2E] rounded-[8px] shadow-lg z-10">
                      {yearOptions.map((year, index) => (
                        <div
                          key={index}
                          onClick={() => handleYearSelect(year)}
                          className="px-2 py-2 text-sm font-[Inter] text-[#E5E5E5] hover:bg-[#1A1A1A] cursor-pointer first:rounded-t-[8px] last:rounded-b-[8px] transition-colors"
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>

              <div className="w-[644px] h-[248px] mt-3.5 border border-[#2D2D2D] p-4 rounded-md">
                <div className="w-[612px] h-[198px] mt-2 flex justify-between">
                   <div className="w-[35.25px] h-[194px] flex flex-col gap-6 text-xs text-center text-[Inter]">
                     {amounts.map((amount, index) => (
                       <div key={`${amount.amount}-${index}`}>
                         {amount.amount}K
                       </div>
                      ))}
                   </div>
                   
                     {years.map((year, index) => (
                       <div key={`${year.year}-${index}`} className="flex flex-col items-center">
                        <div className="w-[35.25px] h-[194px] font-[Jakarta Sans] text-xs text-center flex flex-col justify-end items-center relative">
                             {/* Bar chart */}
                             <div 
                               className="w-6 bg-[#2E2E2E] rounded-sm mb-1"
                               style={{
                                 height: `${(year.value / maxValue) * 160}px`,
                                 minHeight: '4px'
                               }}
                             ></div>
                             
                             {/* Year label */}
                             <div className="text-[#E5E5E5] mt-2">
                               {year.year}
                             </div>
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

             <div className="w-[87px] h-9 rounded-[8px] border border-[#2E2E2E] bg-[#121212] p-2 flex justify-center items-center">
                <h1 className="font-[Inter] align-middle text-sm text-[#E5E5E5]">View All</h1> 
                <IoIosArrowForward />
             </div>
          </div>
            <PaymentHistory />
        </div>

    </div>
  )
}



// import Image from "next/image";
// import Link from "next/link";
// import PaymentHistory from "./payment-history";
// import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";

// const amounts = [
//   { amount: 92 },
//   { amount: 48 },
//   { amount: 24}, 
//   { amount: 12},  
//   { amount: 0}
// ];

// const years = [
//    {year: "Jan", value: 75}, {year: "Feb", value: 45},
//    {year: "Mar", value: 80}, {year: "Apr", value: 30},
//   {year: "May", value: 65},  {year: "Jun", value: 90},
//   {year: "Jul", value: 55}, {year: "Aug", value: 70},
//   {year: "Sept", value: 40}, {year: "Oct", value: 85},
//   {year: "Nov", value: 35},  {year: "Dec", value: 60}
// ];

// export default function AnalyticsView() {
//   const maxValue = Math.max(...years.map(y => y.value));
  
//   return (
//     <div className='max-w-[1100px] h-[332px] flex max-md:flex-col gap-6'>
//         <div className='w-[42.25rem] h-[20.75rem] border border-[#2D2D2D] rounded-md gap-4 p-4'>
//             <div className='w-[40.25rem] h-9 flex justify-between mx-auto'>
//               <div className='w-[368px] flex align-middle items-center'>
//                 <div className="w-8 h-8 border border-[#2E2E2E] rounded-[8px] bg-[#121212] flex justify-center items-center">
//                   <Image src='/chart-up.png' alt="" width={20} height={20} className="object-contain w-5 h-5"/>
//                 </div>
//                 <h1 className="pl-4">Analytics views</h1>
//               </div>
//                 <Link href='/' className="w-24 h-9 flex items-center text-sm border border-[#2E2E2E] rounded-[8px] p-2 bg-[#121212]">
//                    <h1 className="font-[Inter] text-sm">This Year</h1>
//                    <IoIosArrowDown />
//                 </Link>
//             </div>

//               <div className="w-[644px] h-[248px] mt-3.5 border border-[#2D2D2D] p-4 rounded-md">
//                 <div className="w-[612px] h-[198px] mt-2 flex justify-between">
//                    <div className="w-[35.25px] h-[194px] flex flex-col gap-6 text-xs text-center text-[Plus Jakarta Sans]">
//                      {amounts.map((amount, index) => (
//                        <div key={`${amount.amount}-${index}`}>
//                          {amount.amount}K
//                        </div>
//                       ))}
//                    </div>
                   
//                      {years.map((year, index) => (
//                        <div key={`${year.year}-${index}`} className="flex flex-col items-center">
//                         <div className="w-[35.25px] h-[194px] font-[Jakarta Sans] text-xs text-center flex flex-col justify-end items-center relative">
//                              {/* Bar chart */}
//                              <div 
//                                className="w-6 bg-[#2E2E2E] rounded-sm mb-1 transition-all duration-300 hover:from-blue-400 hover:to-blue-200"
//                                style={{
//                                  height: `${(year.value / maxValue) * 160}px`,
//                                  minHeight: '4px'
//                                }}
//                              ></div>
                             
//                              {/* Year label */}
//                              <div className="text-[#E5E5E5] mt-2">
//                                {year.year}
//                              </div>
//                         </div>   
//                        </div>
//                       ))}
//                 </div>
//               </div>
//         </div>

//         <div className='w-[400px] h-[332px] border border-[#2D2D2D] rounded-md p-4'>
//           <div className="w-[36ppx] h-9 gap-3 flex justify-between">
//             <div className="flex align-middle justify-center items-center">
//               <div className="w-8 h-8 border border-[#2E2E2E] rounded-[8px] bg-[#121212] flex items-center justify-center">
//                  <Image src='/notification-02.png' alt="Notification" width={24} height={24} className="w-6 h-6 object-contain"/>
//               </div>
//               <h1 className="font-[Inter] text-base align-middle text-[#E5E5E5] pl-3">
//                 Notifications
//               </h1>
//             </div>

//              <Link href='/' className="w-[87px] h-9 rounded-[8px] border border-[#2E2E2E] bg-[#121212] p-2 flex justify-center items-center">
//                 
//                 
//              </Link>
//           </div>
//             <PaymentHistory />
//         </div>
//     </div>
//   )
// }





