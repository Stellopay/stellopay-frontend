"use client";

import Link from "next/link";
import Image from "next/image";
import { messages } from "@/messages";

// TODO: Replace direct import of messages with next-intl useTranslations() hook once i18n is enabled.
import { useState, useEffect } from "react";
import { safeStorage } from "@/utils/safeStorage";
import { X } from "lucide-react";

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
  [messages.footer.categories.product]: [
    { label: messages.footer.links.features, href: "#KeyFeatures" },
    { label: messages.footer.links.pricing, href: "#Pricing" },
    { label: messages.footer.links.security, href: "#Security" },
    { label: messages.footer.links.api, href: "#API" },
    { label: messages.footer.links.integrations, href: "#Integrations" },
  ],
  [messages.footer.categories.company]: [
    { label: messages.footer.links.about, href: "/about" },
    { label: messages.footer.links.blog, href: "/blog" },
    { label: messages.footer.links.careers, href: "/careers" },
    { label: messages.footer.links.press, href: "/press" },
    { label: messages.footer.links.partners, href: "/partners" },
  ],
  [messages.footer.categories.resources]: [
    { label: messages.footer.links.documentation, href: "/docs" },
    { label: messages.footer.links.helpCenter, href: "/help" },
    { label: messages.footer.links.tutorials, href: "/tutorials" },
    { label: messages.footer.links.community, href: "/community" },
    { label: messages.footer.links.errorPages, href: "/errors" },
  ],
  [messages.footer.categories.legal]: [
    { label: messages.footer.links.privacy, href: "/privacy" },
    { label: messages.footer.links.terms, href: "/terms" },
    { label: messages.footer.links.cookiePolicy, href: "/cookies" },
    { label: messages.footer.links.licenses, href: "/licenses" },
  ],
};

const socialLinks = [
  {
    icon: TwitterIcon,
    href: "https://twitter.com/stellopay",
    label: messages.footer.socialLinks.twitter,
  },
  {
    icon: LinkedInIcon,
    href: "https://linkedin.com/company/stellopay",
    label: messages.footer.socialLinks.linkedIn,
  },
  {
    icon: GitHubIcon,
    href: "https://github.com/stellopay",
    label: messages.footer.socialLinks.gitHub,
  },
  {
    icon: EmailIcon,
    href: "mailto:contact@stellopay.com",
    label: messages.footer.socialLinks.email,
  },
];

const CONSENT_STORAGE_KEY = "stellopay.cookie-consent";

function persistConsent(value: boolean): void {
  safeStorage.setItem(
    CONSENT_STORAGE_KEY,
    value ? "accepted" : "rejected",
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const stored = safeStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === null) {
      setBannerVisible(true);
    } else {
      setBannerVisible(false);
    }
  }, []);

  const handleAccept = () => {
    persistConsent(true);
    setBannerVisible(false);
  };

  const handleReject = () => {
    persistConsent(false);
    setBannerVisible(false);
  };

  const handleClose = () => {
    setBannerVisible(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <footer className="w-full bg-[#FAFAFA] dark:bg-[#09090B] border-t border-gray-100 dark:border-[#1a1a1a]">
      {/* Cookie Consent Banner */}
      {bannerVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#18181b] border-t border-gray-200 dark:border-[#27272a] shadow-lg"
          data-testid="cookie-consent-banner"
        >
          <div className="relative max-w-[1200px] mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pr-10 sm:pr-12">
            <div className="flex-1 min-w-0">
              <p
                className="text-sm text-[#1a1a1a] dark:text-[#a1a1aa]"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                We use cookies to improve your experience. By continuing to use
                our site, you agree to our{" "}
                <Link
                  href="/cookies"
                  className="text-[#7C3AED] dark:text-[#a78bfa] underline hover:text-[#6d28d9] dark:hover:text-[#8b5cf6] transition-colors"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-[#666666] dark:text-[#a1a1aa] rounded-lg border border-gray-200 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:focus:ring-[#a78bfa]/20"
                data-testid="cookie-consent-reject"
                aria-label="Reject all cookies"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6] hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 dark:focus:ring-[#a78bfa]/40"
                data-testid="cookie-consent-accept"
                aria-label="Accept all cookies"
              >
                Accept
              </button>
            </div>
            {/* Positioned relative to the inner container so the button sits
                at the top-right corner without escaping the max-width constraint. */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-[#666666] dark:text-[#a1a1aa] hover:text-[#1a1a1a] dark:hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:focus:ring-[#a78bfa]/20"
              aria-label="Dismiss cookie consent banner"
              data-testid="cookie-consent-close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="max-w-[1200px] mx-auto pb-20">
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
                {messages.footer.description}
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
                {messages.footer.newsletter.heading}
              </h3>
              <p
                className="text-[#666666] dark:text-[#a1a1aa] text-sm mb-6"
                style={{ fontFamily: "General Sans, sans-serif" }}
              >
                {messages.footer.newsletter.description}
              </p>

              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={messages.footer.newsletter.placeholder}
                  className="w-full sm:w-[320px] h-12 px-4 rounded-lg border border-gray-200 dark:border-[#27272a] bg-transparent dark:bg-[#18181b] text-[#1a1a1a] dark:text-white text-sm placeholder:text-[#999999] dark:placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:focus:ring-[#a78bfa]/20 focus:border-[#7C3AED] dark:focus:border-[#a78bfa] transition-all duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 px-8 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6]"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {isSubmitting
                    ? messages.footer.newsletter.subscribing
                    : messages.footer.newsletter.subscribe}
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
                {messages.footer.bottomBar.copyright}
              </p>

              <div className="flex items-center gap-6">
                <Link
                  href="/privacy"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {messages.footer.bottomBar.privacyPolicy}
                </Link>
                <Link
                  href="/terms"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {messages.footer.bottomBar.termsOfService}
                </Link>
                <Link
                  href="/cookies"
                  className="text-[#666666] dark:text-[#a1a1aa] text-sm hover:text-[#7C3AED] dark:hover:text-[#a78bfa] transition-colors duration-200"
                  style={{ fontFamily: "General Sans, sans-serif" }}
                >
                  {messages.footer.bottomBar.cookiePolicy}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
