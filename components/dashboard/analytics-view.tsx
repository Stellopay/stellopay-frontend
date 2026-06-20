'use client'

import Image from "next/image";
import PaymentHistory from "./payment-history";
import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

const amounts = [
  { amount: 92 },
  { amount: 48 },
  { amount: 24}, 
  { amount: 12},  
  { amount: 0}
];

const years = [
   {year: "Jan", value: 75}, {year: "Feb", value: 45},
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
  
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };
  
  return (
    <div className='max-w-full min-h-[332px] flex flex-col md:flex-row gap-6'>
        <div className='w-full md:w-2/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl gap-4 p-6 bg-white dark:bg-[#111111] transition-colors'>
            <div className='w-full flex justify-between items-center mb-6'>
              <div className='flex align-middle items-center gap-4'>
                <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex justify-center items-center">
                  <Image src='/chart-up.png' alt="" width={20} height={20} className="object-contain w-5 h-5 dark:invert-[0.9]"/>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Analytics View</h2>
              </div>
                <div className="relative">
                  <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-10 px-4 flex items-center gap-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedYear}</span>
                    {isDropdownOpen ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-12 right-0 w-32 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 overflow-hidden">
                      {yearOptions.map((year, index) => (
                        <div
                          key={index}
                          onClick={() => handleYearSelect(year)}
                          className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>

              <div className="w-full h-56 mt-4 border border-zinc-100 dark:border-zinc-800/50 p-6 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20">
                <div className="w-full h-full flex justify-between items-end">
                   <div className="h-full flex flex-col justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider pb-6">
                     {amounts.map((amount, index) => (
                       <div key={`${amount.amount}-${index}`}>
                         {amount.amount}K
                       </div>
                      ))}
                   </div>
                   
                      <div className="flex-1 flex justify-around items-end ml-8">
                        {years.map((year, index) => (
                          <div key={`${year.year}-${index}`} className="flex flex-col items-center group">
                            <div className="relative flex flex-col items-center">
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                  {year.value}K
                                </div>
                                {/* Bar chart */}
                                <div 
                                  className="w-4 sm:w-6 bg-blue-500/80 dark:bg-blue-500/60 group-hover:bg-blue-500 rounded-t-sm transition-all duration-300"
                                  style={{
                                    height: `${(year.value / maxValue) * 140}px`,
                                    minHeight: '4px'
                                  }}
                                ></div>
                            </div>
                            {/* Year label */}
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-3 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                              {year.year}
                            </div>
                          </div>
                        ))}
                      </div>
                </div>
              </div>
        </div>

        <div className='w-full md:w-1/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#111111] flex flex-col gap-6 transition-colors'>
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                 <Image src='/notification-02.png' alt="Notification" width={24} height={24} className="w-6 h-6 object-contain dark:invert-[0.9]"/>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Notifications
              </h2>
            </div>

             <div className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">View All</span> 
                <ChevronRight className="text-zinc-400" />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <PaymentHistory />
          </div>
        </div>

    </div>
  )
}
