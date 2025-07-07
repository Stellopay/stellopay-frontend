"use client";

import { useState } from "react";
import ToggleCard from "@/app/components/ToggleCard";
import SecurityTab from "./components/SecurityTab";
import Image from "next/image";
import { Camera } from "lucide-react";
import SettingsHeader from "@/components/SettingsHeader";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile"); // Default tab

  return (
    <div className="min-h-screen  text-white flex flex-col ">
      {/* Title */}
      <SettingsHeader pageTitle="Settings" />

     <div className="p-8">
       {/* Tabs */}
       <div className="flex mb-8 ">
        {["Profile", "Security", "Preferences"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border border-[#2d2d2d] cursor-pointer text-sm md:text-base font-medium transition ${
              activeTab === tab
                ? "bg-white text-black shadow"
                : "text-gray-400 hover:text-white"
            } ${
              tab === "Profile" ? "rounded-l-lg" : "" // Round left for Profile
            } ${
              tab === "Preferences" ? "rounded-r-lg" : "" // Round right for Preferences
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className={`rounded-2xl shadow-lg ${
          activeTab !== "Security"
            ? "bg-[#0D0D0D80] h-[480px] md:h-[] border border-[#2d2d2d] p-6 md:p-10"
            : "" // No container styles for Security tab
        }`}
      >
        {activeTab === "Profile" && (
          <div className="">
            <div className="px-4 md:px-0">
              <div className="flex flex-col md:flex-row items-center border-b border-[#3A2A3D] pl-4 md:pl-20 pb-8 mb-8">
                <div className="relative">
                  <div className="">
                    <Image
                      src="/Image.png"
                      alt="Profile photo"
                      width={128}
                      height={128}
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="absolute bottom-0 right-3 w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full border-4 border-pink-500"></div>
                </div>
                <div className="ml-0 md:ml-20 mt-4 md:mt-0 text-center md:text-left w-full md:w-auto">
                  <h2 className="text-lg font-medium text-white mb-1">
                    Profile photo
                  </h2>
                  <p className="text-gray-400 mb-4">
                    This image will be displayed <br /> on your profile
                  </p>
                  <button className="flex items-center justify-center px-4 py-2 text-black bg-[#ffffff] rounded-lg hover:bg-[#4A3A4D] hover:text-white transition">
                    <Camera className="w-5 h-5 mr-2" />
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-around pl-4 md:pl-20 pb-8 mb-8">
                <div className="mb-6 md:mb-0">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-white">
                      Personal Information
                    </h2>
                    <p className="text-gray-400">
                      Update your personal details here.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 text-black bg-[#ffffff] hover:bg-[#4A3A4D] hover:text-white rounded-lg font-medium transition"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="mt-6 md:mt-0 md:pl-6 lg:pl-20 w-50%">
                  <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          First name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Maya"
                          className="w-full  border border-[#4A3A4D] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Last name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Sullivan"
                          className="w-full border border-[#4A3A4D] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-medium mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Mayasullivan@rmail.com"
                        className="w-full border border-[#4A3A4D] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "Security" && <SecurityTab />}

        {activeTab === "Preferences" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-md md:text-xl font-semibold mb-2">
                Notification Preferences
              </h2>
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
    </div>
  );
}
