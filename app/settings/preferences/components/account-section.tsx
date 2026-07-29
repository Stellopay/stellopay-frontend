'use client';

import React, { useState, useEffect } from 'react';

export const AccountSection: React.FC = () => {
  const [analytics, setAnalytics] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('stellopay_cookie_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setAnalytics(!!parsed.analytics);
        setMarketing(!!parsed.marketing);
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  const handleSave = () => {
    const preferences = { essential: true, analytics, marketing };
    localStorage.setItem('stellopay_cookie_preferences', JSON.stringify(preferences));
  };

  return (
    <section className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Cookie Preferences</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
        Manage your granular cookie categories and tracking choices.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Essential Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Required for the website to function properly.</p>
          </div>
          <input type="checkbox" checked disabled className="cursor-not-allowed opacity-75" aria-label="Essential cookies locked on" />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Analytics Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Help us improve our website by collecting usage data.</p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            aria-label="Analytics cookies toggle"
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Marketing Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Used to deliver relevant advertisements and tracking.</p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            aria-label="Marketing cookies toggle"
            className="cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-md hover:opacity-95 transition"
      >
        Save Preferences
      </button>
    </section>
  );
};
