"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FaEthereum } from "react-icons/fa";
import { HiChevronDown } from "react-icons/hi";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Support", href: "/support" },
];

export default function LandingPageNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full h-[80px] px-4 md:px-8 absolute top-0 left-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full py-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-clash text-xl md:text-[24px] font-medium tracking-tight flex-1"
          style={{ color: "#598EFF" }}
        >
          StelloPay
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 justify-center flex-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-white text-lg font-normal hover:text-[#598EFF] transition-colors duration-200"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* ETH Selector */}
          <div className="flex items-center gap-2 backdrop-blur-md rounded-full px-4 py-2 text-white cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center p-1">
              <FaEthereum className="text-[#221c27] text-xl" />
            </div>
            <span className="text-sm font-medium">ETH</span>
            <HiChevronDown className="text-white text-lg" />
          </div>

          <button className="px-6 py-2.5 rounded-full border border-[#598EFF] text-white bg-transparent font-[400] transition-all duration-200 hover:bg-[#598EFF] hover:border-[#598EFF] cursor-pointer">
            Connect Wallet
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col items-center justify-center p-2 rounded focus:outline-none"
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="block w-6 h-0.5 bg-[#598EFF] mb-1"></span>
          <span className="block w-6 h-0.5 bg-[#598EFF] mb-1"></span>
          <span className="block w-6 h-0.5 bg-[#598EFF]"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-[56px] left-0 w-full bg-[#0a0a0a]/95 shadow-lg z-[100] animate-fade-in">
          <div className="flex flex-col items-center gap-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white text-lg font-normal hover:text-[#598EFF] transition-colors duration-200"
                style={{ fontFamily: "General Sans, sans-serif" }}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 w-full px-6">
              <button className="px-6 py-3.5 rounded-full border border-[#598EFF] text-[#EEF4FF] bg-transparent font-medium transition-colors duration-200 hover:bg-[#598EFF] hover:text-white cursor-pointer text-center">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
