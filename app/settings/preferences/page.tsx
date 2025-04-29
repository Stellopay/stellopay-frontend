'use client';

import { useState } from 'react';
import ToggleCard from '@/app/components/ToggleCard';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Preferences');

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#230d22] text-white flex flex-col gap-8">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex mb-8">
        {['Profile', 'Security', 'Preferences'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border border-[#2d2d2d] cursor-pointer text-sm md:text-base font-medium transition ${
              activeTab === tab
                ? 'bg-white rounded-r-lg text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#0D0D0D80] h-[480px] border border-[#2d2d2d] rounded-2xl p-6 md:p-10 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left side: Title and description */}
          <div>
            <h2 className="text-md md:text-xl font-semibold mb-2">Notification Preferences</h2>
            <p className="text-xs max-w-64 md:text-base text-gray-400">
              Enable or disable your notification preferences below.
            </p>
          </div>

          {/* Right side: Content based on active tab */}
          <div className="space-y-6">
            {activeTab === 'Profile' && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Profile Settings</h2>
                <p className="text-sm text-gray-400">
                  Update your profile information here.
                </p>
              </div>
            )}

            {activeTab === 'Security' && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Security Settings</h2>
                <p className="text-sm text-gray-400">
                  Manage your password and authentication settings.
                </p>
              </div>
            )}

            {activeTab === 'Preferences' && (
              <div className="space-y-6">
                <ToggleCard title="Email, SMS, and Push Notifications" />
                <ToggleCard title="Transaction Alerts" />
                <ToggleCard title="Promotional Offers" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
