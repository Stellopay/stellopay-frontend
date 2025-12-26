"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ConnectWalletButton from "@/components/wallet/connect-wallet-button";

const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, name: string, href: string, router: any, pathname: string | null) => {
  e.preventDefault();
  
  const currentPath = pathname || "/";
  
  if (name === "Features") {
    if (currentPath === "/") {
      const featuresSection = document.getElementById("KeyFeatures");
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/#KeyFeatures");
    }
  } else if (name === "How it works") {
    if (currentPath === "/") {
      const benefitsSection = document.getElementById("Benefits");
      if (benefitsSection) {
        benefitsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/#Benefits");
    }
  } else if (name === "Pricing") {
    router.push("/pricing");
  } else if (name === "Support") {
    router.push("/help/support");
  } else {
    router.push(href);
  }
};

export default function LandingPageNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#KeyFeatures" },
    { name: "How it works", href: "/#Benefits" },
    { name: "Pricing", href: "/pricing" },
    { name: "Support", href: "/help/support" },
  ];

  return (
    <nav className="w-full h-[75px] px-4 md:px-8 absolute top-0 left-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 md:py-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-light text-xl md:text-2xl"
          style={{ fontFamily: "Clash Display, sans-serif", color: "#598EFF" }}
        >
          StelloPay
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.name, link.href, router, pathname)}
              className="text-white text-base font-normal hover:text-[#598EFF] transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ConnectWalletButton
            variant="button"
            className="px-6 py-4 rounded-full bg-[#598EFF] text-white font-medium transition-colors duration-200 hover:bg-[#4A7CE8] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col items-center justify-center p-2 rounded focus:outline-none cursor-pointer"
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
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  handleNavClick(e, link.name, link.href, router, pathname);
                  setMenuOpen(false);
                }}
                className="text-white text-lg font-normal hover:text-[#598EFF] transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 w-full px-6">
              <ConnectWalletButton
                variant="button"
                className="px-6 py-2 rounded-full bg-[#598EFF] text-white font-medium transition-colors duration-200 hover:bg-[#4A7CE8] text-center disabled:opacity-60 disabled:cursor-not-allowed"
                onConnected={() => setMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
