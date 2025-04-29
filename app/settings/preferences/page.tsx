'use client';

import { useState } from 'react';
import ToggleCard from '@/app/components/ToggleCard';
import SecurityTab from './components/SecurityTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Preferences');

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#230d22] text-white flex flex-col gap-8">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex mb-8 ">
        {['Profile', 'Security', 'Preferences'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border border-[#2d2d2d] cursor-pointer text-sm md:text-base font-medium transition ${
              activeTab === tab
                ? 'bg-white text-black shadow'
                : 'text-gray-400 hover:text-white'
            } ${
              tab === 'Profile' ? 'rounded-l-lg' : '' // Round left for Profile
            } ${
              tab === 'Preferences' ? 'rounded-r-lg' : '' // Round right for Preferences
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className={`rounded-2xl shadow-lg ${
          activeTab !== 'Security'
            ? 'bg-[#0D0D0D80] h-[480px] border border-[#2d2d2d] p-6 md:p-10'
            : '' // No container styles for Security tab
        }`}
      >
        {activeTab === 'Profile' && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Profile Settings</h2>
            <p className="text-sm text-gray-400">
              Update your profile information here.
            </p>
          </div>
        )}

        {activeTab === 'Security' && <SecurityTab />}

        {activeTab === 'Preferences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-md md:text-xl font-semibold mb-2">Notification Preferences</h2>
              <p className="text-xs max-w-64 md:text-base text-gray-400">
                Enable or disable your notification preferences below.
              </p>
            </div>
            <div className="space-y-6">
              <ToggleCard title="Email, SMS, and Push Notifications" />
              <ToggleCard title="Transaction Alerts" />
              <ToggleCard title="Promotional Offers" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
