'use client';

import React, { useState, useEffect } from 'react';
import DashboardNavbar from '@/components/dashboard/dashboard-navbar';
import AccountOverview from '@/components/dashboard/account-overview';
import { QuickActions } from '@/components/dashboard/quick-actions';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/skeleton';
import ClientAnalyticsView from '@/components/analytics/client-analytics-view';

const AnalyticsInsights = dynamic(() => import('@/components/dashboard/analytics-insights').then(mod => mod.AnalyticsInsights), {
  loading: () => (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-[#111111] space-y-6" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading analytics insights...</span>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" shade="dark" />
          <Skeleton className="h-4 w-64" shade="dark" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" shade="dark" />
          <Skeleton className="h-10 w-24 rounded-xl" shade="dark" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-2xl" shade="dark" />
        <Skeleton className="h-32 rounded-2xl" shade="dark" />
        <Skeleton className="h-32 rounded-2xl" shade="dark" />
        <Skeleton className="h-32 rounded-2xl" shade="dark" />
      </div>
    </div>
  ),
  ssr: true,
});

/**
 * Dashboard component displaying the main user analytics, quick actions,
 * and account overview. Dynamically imports AnalyticsInsights below-the-fold
 * to speed up initial route execution and loading metrics.
 */
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

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

      <div className='flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-10'>
        <AccountOverview />

        <QuickActions />


        <AnalyticsInsights />

        <ClientAnalyticsView
          isLoading={isLoading}
          showNotifications={true}
          showDropdown={true}
        />

        {/* <TransactionHistory /> */}
      </div>
    </div>              
  )
}
