"use client";
import React, { useState } from "react";
import { MoreVertical, X } from "lucide-react";

interface DashboardHeaderProps {
  primaryAction?: React.ReactNode;
  secondaryControls?: React.ReactNode[];
  title?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  primaryAction,
  secondaryControls = [],
  title = "Dashboard",
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 relative">
      {/* Left: Title (always visible) */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-2">
        {/* Primary action always visible */}
        {primaryAction && (
          <div data-testid="primary-action">{primaryAction}</div>
        )}

        {/* Secondary controls visible on md+ screens */}
        {secondaryControls.length > 0 && (
          <>
            <div
              className="hidden md:flex items-center space-x-2"
              data-testid="secondary-controls-desktop"
            >
              {secondaryControls.map((control, index) => (
                <div key={index}>{control}</div>
              ))}
            </div>

            {/* Kebab menu for mobile */}
            <div className="md:hidden">
              <button
                aria-label="More options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                data-testid="kebab-menu-button"
              >
                {menuOpen ? (
                  <X size={20} strokeWidth={2} />
                ) : (
                  <MoreVertical size={20} strokeWidth={2} />
                )}
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  data-testid="kebab-menu"
                  className="absolute right-4 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                >
                  {secondaryControls.map((control, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      {control}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};