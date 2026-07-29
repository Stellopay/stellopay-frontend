"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

// Social Media Icons as SVG components
const TwitterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const EmailIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

// Footer link data
const footerLinks = {
  Product: [
    { label: "Features", href: "#KeyFeatures" },
    { label: "Pricing", href: "#Pricing" },
    { label: "Security", href: "#Security" },
    { label: "API", href: "#API" },
    { label: "Integrations", href: "#Integrations" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Partners", href: "/partners" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Help Center", href: "/help" },
    { label: "Tutorials", href: "/tutorials" },
    { label: "Community", href: "/community" },
    { label: "Error Pages", href: "/errors" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Licenses", href: "/licenses" },
  ],
};

const socialLinks = [
  {
    icon: TwitterIcon,
    href: "https://twitter.com/stellopay",
    label: "Twitter",
  },
  {
    icon: LinkedInIcon,
    href: "https://linkedin.com/company/stellopay",
    label: "LinkedIn",
  },
  { icon: GitHubIcon, href: "https://github.com/stellopay", label: "GitHub" },
  { icon: EmailIcon, href: "mailto:contact@stellopay.com", label: "Email" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <footer className="w-full bg-[#FAFAFA] dark:bg-[#09090B] border-t border-gray-100 dark:border-[#1a1a1a]">
      {/* Main Footer Content */}
      <div className="max-w-[1200px] mx-auto">
        <div className="px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
            {/* Logo and Description Section */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/stellopay-icon.svg"
                  alt="StelloPay Logo"
                  width={32}
                  height={32}
                />
                <span
                  className="text-[#1a1a1a] dark:text-white text-xl font-semibold tracking-tight"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  StelloPay
                </span>
              </Link>
              <p
                className="text-[#666666] dark:text-[#a1a1aa] text-sm leading-relaxed mb-6 max-w-[280px]"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                Simplifying crypto payments for businesses. Built on the Stellar
                blockchain for instant, secure, and affordable global
                transactions.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#27272a] dark:bg-[#18181b] flex items-center justify-center text-[#666666] dark:text-[#a1a1aa] hover:text-[#7C3AED] hover:border-[#7C3AED] dark:hover:text-[#a78bfa] dark:hover:border-[#a78bfa] transition-all duration-200"
                    aria-label={social.label}
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-[#1a1a1a] dark:text-white font-semibold text-sm mb-4 tracking-wide"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                        style={{ fontFamily: "General Sans, sans-serif" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Section */}
          <div className="mt-16 pt-12">
            <div className="max-w-[600px] mx-auto text-center">
              <h3
                className="text-[#1a1a1a] dark:text-white text-2xl font-semibold mb-3"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                Stay updated with StelloPay
              </h3>
              <p
                className="text-[#666666] dark:text-[#a1a1aa] text-sm mb-6"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                Get the latest news, updates, and tips delivered straight to
                your inbox.
              </p>

              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full sm:w-[320px] h-12 px-4 rounded-lg border border-gray-200 dark:border-[#27272a] bg-transparent dark:bg-[#18181b] text-[#1a1a1a] dark:text-white text-sm placeholder:text-[#999999] dark:placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:focus:ring-[#a78bfa]/20 focus:border-[#7C3AED] dark:focus:border-[#a78bfa] transition-all duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 px-8 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6]"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-[#1a1a1a]">
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p
                className="text-[#666666] dark:text-[#a1a1aa] text-sm"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                © 2026 StelloPay. All rights reserved.
              </p>

              <div className="flex items-center gap-6">
                <Link
                  href="/privacy"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
