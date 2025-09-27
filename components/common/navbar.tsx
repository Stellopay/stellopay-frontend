// components/Navbar.tsx
import { Bell, Settings, HelpCircle } from "lucide-react";

export default function Navbar() {
  return (
    <>
      <nav className="w-full h-[75px] border-b border-[#1A1A1A] px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto h-full flex items-center justify-between gap-4 flex-wrap px-8">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search here..."
            className="bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md w-full sm:w-1/3 md:w-[400px] placeholder:text-[#E5E5E5] outline-none focus-within:ring-1"
          />

          {/* Icons and Avatar */}
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <div className="p-2 rounded-md">
              <Bell className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            <div className="p-2 rounded-md">
              <Settings className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            <div className="p-2 rounded-md">
              <HelpCircle className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-pink-500 relative">
              <img
                src="/avatar.jpg"
                alt="User"
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a0c1d]"></span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
