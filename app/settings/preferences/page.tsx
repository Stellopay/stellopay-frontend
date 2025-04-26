'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Preferences');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(true);

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
            className={`px-5 py-3 border border-[#180c17] cursor-pointer rounded-r-lg text-sm md:text-base font-medium transition ${
              activeTab === tab
                ? 'bg-white text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#180c17] border border-[#261925] rounded-2xl p-6 md:p-10 shadow-lg">
   
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
                <ToggleCard 
                  label="Email, SMS, and Push Notifications" 
                  enabled={emailNotifications} 
                  setEnabled={setEmailNotifications} 
                />
                <ToggleCard 
                  label="Transaction Alerts" 
                  enabled={transactionAlerts} 
                  setEnabled={setTransactionAlerts} 
                />
                <ToggleCard 
                  label="Promotional Offers" 
                  enabled={promotionalOffers} 
                  setEnabled={setPromotionalOffers} 
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ToggleCard({
  label,
  enabled,
  setEnabled,
}: {
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-[#161015] border border-[#180c17] p-4 rounded-xl shadow-sm">
      <span className="text-base md:text-lg">{label}</span>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-7 flex items-center rounded-full p-1 duration-300 ${
          enabled 
            ? 'bg-[#622f62]'
            : 'bg-gray-500'
        }`}
      >
        <div
          className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${
            enabled ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
