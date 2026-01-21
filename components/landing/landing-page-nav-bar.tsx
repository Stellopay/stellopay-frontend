"use client";
import React, { useState } from "react";
import Link from "next/link";

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
    <nav className="w-full h-[75px] px-4 md:px-8 absolute top-0 left-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 md:py-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-[500] text-xl md:text-2xl"
          style={{ fontFamily: "Clash Display, sans-serif", color: "#598EFF" }}
        >
          StelloPay
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-white text-base font-normal hover:text-[#598EFF] transition-colors duration-200"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button className="px-6 py-3.5 rounded-full border border-[#598EFF] text-[#EEF4FF] bg-transparent font-medium transition-colors duration-200 hover:bg-[#598EFF] hover:text-white cursor-pointer">
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
              <button className="border border-[#598EFF] text-[#FFFFFF] hover:bg-[#23213a] font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
