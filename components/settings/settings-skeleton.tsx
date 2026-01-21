"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for the Settings page tabs
 */
export function SettingsTabsSkeleton() {
  return (
    <div className="flex mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-11 w-28 ${
            i === 0 ? "rounded-l-lg" : i === 2 ? "rounded-r-lg" : ""
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loading state for the Profile tab content
 */
export function ProfileTabSkeleton() {
  return (
    <div className="rounded-2xl shadow-lg bg-[#0D0D0D80] h-[480px] border border-[#2d2d2d] p-6 md:p-10">
      {/* Profile Photo Section */}
      <div className="flex flex-col md:flex-row items-center border-b border-[#3A2A3D] pl-4 md:pl-20 pb-8 mb-8">
        {/* Profile Image */}
        <div className="relative">
          <Skeleton className="w-32 h-32 rounded-lg" />
          <Skeleton className="absolute bottom-0 right-3 w-8 h-8 rounded-full" />
        </div>

        {/* Profile Photo Info */}
        <div className="ml-0 md:ml-20 mt-4 md:mt-0 text-center md:text-left w-full md:w-auto space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-36 rounded-lg mt-4" />
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="flex flex-col md:flex-row justify-around pl-4 md:pl-20 pb-8 mb-8">
        {/* Left column */}
        <div className="mb-6 md:mb-0 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>

        {/* Right column - Form fields */}
        <div className="mt-6 md:mt-0 md:pl-6 lg:pl-20 w-50%">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-2 mb-8">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for the Security tab content
 */
export function SecurityTabSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Password Update Section */}
      <div className="bg-[#0D0D0D80] p-6 border border-[#2d2d2d] rounded-lg">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Skeleton className="w-10 h-10 rounded-lg mr-2" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="border-t border-[#2d2d2d] pt-4 space-y-4">
          {/* Password fields */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-lg mt-4" />
        </div>
      </div>

      {/* 2-Step Verification Section */}
      <div className="bg-[#0D0D0D80] px-6 pt-6 pb-4 border border-[#2d2d2d] rounded-lg">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Skeleton className="w-10 h-10 rounded-lg mr-2" />
          <Skeleton className="h-6 w-44" />
        </div>

        <div className="border-t border-[#2d2d2d] pt-4">
          <div className="flex items-center justify-between p-4 bg-[#0D0D0D80] border border-[#2d2d2d] rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" shade="light" />
            </div>
            <Skeleton className="w-12 h-7 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for the Preferences tab content
 */
export function PreferencesTabSkeleton() {
  return (
    <div className="rounded-2xl shadow-lg bg-[#0D0D0D80] h-[480px] border border-[#2d2d2d] p-6 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left column */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Right column - Toggle cards */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border border-[#2d2d2d] rounded-lg"
            >
              <Skeleton className="h-5 w-52" />
              <Skeleton className="w-12 h-7 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Settings page skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* Header skeleton */}
      <div className="p-8 pb-0">
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="p-8">
        <SettingsTabsSkeleton />
        <ProfileTabSkeleton />
      </div>
    </div>
  );
}

export default SettingsPageSkeleton;
