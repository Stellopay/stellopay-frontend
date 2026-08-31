import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/image to render standard img tag with attributes intact
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

// Framer motion mock
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag, rest, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => true,
}));

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
  default: () => true,
}));

// Mock clipboard and hooks
vi.mock("@/utils/clipboardUtils", () => ({
  copyToClipboardWithTimeout: vi.fn(),
  copyToClipboardWithFeedback: vi.fn(),
}));

import Hero from "@/components/landing/hero";
import EnterpriseSolutionSection from "@/components/landing/enterprise-section";
import BenefitsSection from "@/components/landing/benefits";
import TestimonialsSection from "@/components/landing/testimonials-section";
import HowItWorks from "@/components/landing/how-it-works";
import { FeatureCard } from "@/components/landing/feature-card";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import AccountSummary from "@/components/dashboard/account-summary";
import PaymentHistory from "@/components/dashboard/payment-history";
import TransactionHistory from "@/components/dashboard/transaction-history";
import TokenIcon from "@/components/transactions/token-icon";
import Footer from "@/components/common/footer";

vi.mock("@/hooks/useAccountSummary", () => ({
  useAccountSummary: () => ({
    data: {
      balance: "$2,432.00",
      walletAddress: "GD6X...W74Z",
      paidThisMonth: "$12,400.00",
      paidThisMonthCount: 24,
      toBePaid: "$3,100.00",
      toBePaidCount: 5,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => ({
    data: [
      {
        id: "1",
        paymentDescription: "July Salary Disbursement",
        paymentId: "PAY-90412",
        history: "Processed via Stellar network",
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({
    data: {
      data: [
        {
          id: "tx-1",
          type: "Payout",
          txId: "0x123...abc",
          address: "GD6X...W74Z",
          date: "2026-08-30",
          time: "14:20",
          token: "USDC",
          amount: 500,
          status: "Completed",
          statusColor: "success" as const,
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("Image Accessibility and Layout Budget Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Landing & Marketing Imagery", () => {
    it("Hero: above-the-fold network logos have explicit dimensions and informative alt text", () => {
      render(<Hero />);
      const stellarImg = screen.getByAltText("Stellar network");
      const starknetImg = screen.getByAltText("Starknet network");

      expect(stellarImg).toBeInTheDocument();
      expect(stellarImg).toHaveAttribute("width", "24");
      expect(stellarImg).toHaveAttribute("height", "20");

      expect(starknetImg).toBeInTheDocument();
      expect(starknetImg).toHaveAttribute("width", "24");
      expect(starknetImg).toHaveAttribute("height", "20");
    });

    it("Enterprise Section: decorative checkmarks are hidden from AT with alt=\"\" and aria-hidden", () => {
      const { container } = render(<EnterpriseSolutionSection />);
      const images = container.querySelectorAll("img");

      expect(images.length).toBeGreaterThanOrEqual(4);
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt", "");
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(img).toHaveAttribute("width");
        expect(img).toHaveAttribute("height");
      });
    });

    it("Benefits: decorative illustrations have alt=\"\" and aria-hidden with reserved dimensions", () => {
      const { container } = render(<BenefitsSection />);
      const images = container.querySelectorAll("img");

      expect(images.length).toBeGreaterThanOrEqual(2);
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt", "");
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(img).toHaveAttribute("width", "120");
        expect(img).toHaveAttribute("height", "120");
      });
    });

    it("How It Works: step illustrations are decorative with alt=\"\" and aria-hidden", () => {
      const { container } = render(<HowItWorks />);
      const images = container.querySelectorAll("img");

      expect(images.length).toBe(3);
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt", "");
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(img).toHaveAttribute("width", "140");
        expect(img).toHaveAttribute("height", "140");
      });
    });

    it("Feature Card: uses descriptive alt text and explicit dimensions", () => {
      render(
        <FeatureCard
          imageSrc="/feature1.svg"
          title="Instant Payments"
          description="Send payments instantly with zero delay."
        />,
      );

      const img = screen.getByAltText(/Instant Payments feature illustration/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "400");
      expect(img).toHaveAttribute("height", "200");
    });

    it("Testimonials: user avatars have descriptive alt text and explicit sizing", () => {
      render(<TestimonialsSection />);
      const avatarImages = screen.queryAllByRole("img");
      avatarImages.forEach((img) => {
        expect(img.getAttribute("alt")).toMatch(/profile picture/i);
        expect(img).toHaveAttribute("width", "40");
        expect(img).toHaveAttribute("height", "40");
      });
    });

    it("Footer: brand logo is decorative when paired with visible brand name", () => {
      const { container } = render(<Footer />);
      const brandLogo = container.querySelector("footer img[src*='stellopay-icon.svg']");
      expect(brandLogo).toBeInTheDocument();
      expect(brandLogo).toHaveAttribute("alt", "");
      expect(brandLogo).toHaveAttribute("aria-hidden", "true");
      expect(brandLogo).toHaveAttribute("width", "32");
      expect(brandLogo).toHaveAttribute("height", "32");
    });
  });

  describe("Authentication Imagery", () => {
    it("Auth Showcase: preview image has descriptive alt text and explicit dimensions", () => {
      render(
        <AuthShowcase
          title="Empower your workforce"
          description="Manage multi-chain payroll seamlessly."
          imagePosition="right"
        />,
      );

      const img = screen.getByAltText("Empower your workforce showcase preview");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "500");
      expect(img).toHaveAttribute("height", "500");
    });

    it("Auth Social Buttons: provider logos have informative alt text", () => {
      render(<AuthSocialButtons />);
      expect(screen.getByAltText("Google logo")).toBeInTheDocument();
      expect(screen.getByAltText("Apple logo")).toBeInTheDocument();
    });
  });

  describe("Dashboard & Transaction Imagery", () => {
    it("Account Summary: decorative bank and currency icons have alt=\"\" and aria-hidden", () => {
      const { container } = render(<AccountSummary />);
      const images = container.querySelectorAll("img");

      expect(images.length).toBeGreaterThan(0);
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt", "");
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(img).toHaveAttribute("width");
        expect(img).toHaveAttribute("height");
      });
    });

    it("Payment History: notification bell icon is decorative with alt=\"\" and aria-hidden", () => {
      const { container } = render(<PaymentHistory />);
      const images = container.querySelectorAll("img");

      expect(images.length).toBeGreaterThan(0);
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt", "");
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(img).toHaveAttribute("width", "16");
        expect(img).toHaveAttribute("height", "16");
      });
    });

    it("Transaction History: token logo has informative alt and explicit dimensions", () => {
      render(<TransactionHistory />);
      const tokenLogo = screen.getByAltText("USDC icon");
      expect(tokenLogo).toBeInTheDocument();
      expect(tokenLogo).toHaveAttribute("width", "16");
      expect(tokenLogo).toHaveAttribute("height", "16");
    });

    it("TokenIcon: provides accessible token symbol description", () => {
      render(<TokenIcon token="USDC" size={24} />);
      const icon = screen.getByAltText("USDC token icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("width", "24");
      expect(icon).toHaveAttribute("height", "24");
    });
  });
});
