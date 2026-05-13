'use client';

import React, { useState, useEffect } from 'react';
import DashboardNavbar from '@/components/dashboard/dashboard-navbar';
import AccountOverview from '@/components/dashboard/account-overview';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AnalyticsInsights } from '@/components/dashboard/analytics-insights';

export default function Dashboard() {
  const [, setIsLoading] = useState(true);

  // Simulate loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='w-full min-h-screen bg-white dark:bg-[#0D0D0D] transition-colors duration-200'>
      <DashboardNavbar />

      <main className='flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-10'>
        <AccountOverview />
        
        <QuickActions />
        

        <AnalyticsInsights />

        {/* <AnalyticsView /> */}
        
        {/* <TransactionHistory /> */}
      </main>
    </div>              
  )
}
