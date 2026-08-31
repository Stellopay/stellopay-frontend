"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Wallet,
  Zap,
  BarChart3,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { safeStorage, STORAGE_KEYS } from "@/utils/safeStorage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/utils/commonUtils";

interface TourStep {
  id: string;
  targetRef: React.RefObject<HTMLElement | null>;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface DashboardTourProps {
  accountSummaryRef?: React.RefObject<HTMLElement | null>;
  quickActionsRef?: React.RefObject<HTMLElement | null>;
  analyticsInsightsRef?: React.RefObject<HTMLElement | null>;
  clientAnalyticsRef?: React.RefObject<HTMLElement | null>;
}

const ANIMATION_DURATION = 300;

export function DashboardTour({
  accountSummaryRef,
  quickActionsRef,
  analyticsInsightsRef,
  clientAnalyticsRef,
}: DashboardTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const steps: TourStep[] = React.useMemo(
    () => [
      {
        id: "welcome",
        targetRef: { current: null },
        title: "Welcome to Stellopay",
        description:
          "Your dashboard gives you a quick overview of your finances. Let's walk through the key sections.",
        icon: <Sparkles className="w-5 h-5" aria-hidden="true" />,
      },
      {
        id: "account-summary",
        targetRef: accountSummaryRef ?? { current: null },
        title: "Account Summary",
        description:
          "View your balance, paid this month, and upcoming payments at a glance.",
        icon: <Wallet className="w-5 h-5" aria-hidden="true" />,
      },
      {
        id: "quick-actions",
        targetRef: quickActionsRef ?? { current: null },
        title: "Quick Actions",
        description:
          "Send and request payments, or explore analytics — all from one place.",
        icon: <Zap className="w-5 h-5" aria-hidden="true" />,
      },
      {
        id: "analytics-insights",
        targetRef: analyticsInsightsRef ?? { current: null },
        title: "Analytics & Insights",
        description:
          "Track your transaction volume, success rates, and wallet activity over time.",
        icon: <BarChart3 className="w-5 h-5" aria-hidden="true" />,
      },
      {
        id: "client-analytics",
        targetRef: clientAnalyticsRef ?? { current: null },
        title: "Detailed Analytics",
        description:
          "Dive deeper into charts and trends to understand your payment patterns.",
        icon: <TrendingUp className="w-5 h-5" aria-hidden="true" />,
      },
    ],
    [accountSummaryRef, quickActionsRef, analyticsInsightsRef, clientAnalyticsRef],
  );


  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const isTourCompleted = safeStorage.getItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED) === "true";

  const finishTour = useCallback(() => {
    setIsOpen(false);
    safeStorage.setItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED, "true");
  }, []);

  const dismissTour = useCallback(() => {
    setIsOpen(false);
    safeStorage.setItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED, "true");
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
    },
    [totalSteps],
  );

  const goNext = useCallback(() => {
    if (isLastStep) {
      finishTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, finishTour]);

  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissTour();
        return;
      }
      if (e.key === "Tab" && tooltipRef.current) {
        const focusable =
          tooltipRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [dismissTour],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () =>
      document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) return;
    const tip = tooltipRef.current;
    if (!tip) return;
    const focusable =
      tip.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    const el = step.targetRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    const updatePosition = (): void => {
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        setTooltipPosition({
          top: Math.min(rect.bottom + 12, window.innerHeight - 340),
          left: rect.left + rect.width / 2,
        });
      } else {
        setTargetRect(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 80,
          left: window.innerWidth / 2,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, currentStep, steps, prefersReducedMotion]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const stored = safeStorage.getItem(STORAGE_KEYS.DASHBOARD_TOUR_COMPLETED);
    if (stored !== "true") {
      const timer = setTimeout(
        () => {
          setIsOpen(true);
        },
        process.env.NODE_ENV === "test" ? 10 : 800,
      );
      return () => clearTimeout(timer);
    }
  }, []);


  if (typeof document === "undefined" || isTourCompleted || !isOpen) {
    return null;
  }

  const step = steps[currentStep];

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`tour-title-${step.id}`}
      aria-describedby={`tour-description-${step.id}`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {targetRect && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
          }}
          aria-hidden="true"
        />
      )}

      {targetRect && (
        <div
          className="absolute rounded-2xl border-2 border-blue-500 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: `0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 24px rgba(59, 130, 246, 0.3)`,
            transition: prefersReducedMotion
              ? "none"
              : `all ${ANIMATION_DURATION}ms ease`,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[101] w-[calc(100%-2rem)] max-w-md rounded-2xl border bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-2xl p-6",
          "transition-all duration-300",
        )}
        style={
          tooltipPosition
            ? {
                top: Math.max(16, Math.min(tooltipPosition.top, window.innerHeight - 320)),
                left: `calc(${tooltipPosition.left}px - 50%)`,
              }
            : { top: "40%", left: "50%", transform: "translate(-50%, -50%)" }
        }
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={dismissTour}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            {step.icon}
          </div>
          <div>
            <h2
              id={`tour-title-${step.id}`}
              className="text-lg font-bold text-zinc-900 dark:text-white"
            >
              {step.title}
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
        </div>

        <p
          id={`tour-description-${step.id}`}
          className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6"
        >
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <div
            className="flex gap-1.5"
            role="group"
            aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
          >
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                className={cn(
                  "h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900",
                  i === currentStep
                    ? "w-6 bg-blue-500"
                    : i < currentStep
                      ? "w-2 bg-blue-300 dark:bg-blue-700"
                      : "w-2 bg-zinc-200 dark:bg-zinc-700",
                )}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                aria-current={i === currentStep ? "step" : undefined}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}