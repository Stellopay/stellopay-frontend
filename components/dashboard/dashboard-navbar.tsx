'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Moon, Search, Settings, Sun } from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { StellarIcon, StellOpayLogo } from '@/public/svg/svg';

export default function DashboardNavbar() {
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="w-full h-20 px-6 lg:px-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#0D0D0D] transition-colors duration-200 sticky top-0 z-50">
            <div className="flex items-center gap-8 flex-1">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-zinc-900 dark:text-white transition-colors duration-200"
                >
                    <StellOpayLogo />
                </Link>

                <div className="relative max-w-md w-full hidden md:block">
                    <Search
                        size={20}
                        strokeWidth={2}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                        type="text"
                        placeholder="Search transactions, contracts..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                    <div className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        <StellarIcon />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Stellar</span>
                    <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
                    >
                        <path
                            d="M1 1L5 5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <button className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                    <Bell size={20} strokeWidth={2} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0D0D0D]" />
                </button>

                <button className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:block cursor-pointer">
                    <Settings size={20} strokeWidth={2} />
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                    {theme === 'dark' ? (
                        <Sun size={20} strokeWidth={2} />
                    ) : (
                        <Moon size={20} strokeWidth={2} />
                    )}
                </button>

                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer">
                    <div className="w-5 h-5 rounded-md bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center">
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium tracking-tight">0xGABC...F123</span>
                </button>
            </div>
        </nav>
    );
}