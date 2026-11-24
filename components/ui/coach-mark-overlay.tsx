"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface CoachMarkStep {
  targetSelector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

export type CoachMarkValidationErrorCode =
  | "EMPTY_STEPS"
  | "TOO_MANY_STEPS"
  | "INVALID_STEP"
  | "EMPTY_TARGET_SELECTOR"
  | "INVALID_TARGET_SELECTOR"
  | "OVERSIZED_TARGET_SELECTOR"
  | "EMPTY_TITLE"
  | "OVERSIZED_TITLE"
  | "EMPTY_DESCRIPTION"
  | "OVERSIZED_DESCRIPTION"
  | "INVALID_POSITION"
  | "INVALID_CURRENT_STEP"
  | "INVALID_CALLBACK";

export class CoachMarkValidationError extends Error {
  readonly code: CoachMarkValidationErrorCode;
  readonly field?: string;
  readonly stepIndex?: number;

  constructor(
    code: CoachMarkValidationErrorCode,
    message: string,
    options?: { field?: string; stepIndex?: number },
  ) {
    super(message);
    this.name = "CoachMarkValidationError";
    this.code = code;
    this.field = options?.field;
    this.stepIndex = options?.stepIndex;
    // Maintain proper prototype chain when transpiled to ES2.
    Object.setPrototypeOf(this, CoachMarkValidationError.prototype);
  }
}

export const MAX_STEPS = 100;
export const MAX_TARGET_SELECTOR_LENGTH = 512;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

const VALID_POSITIONS: ReadonlySet<CoachMarkStep["position"]> = new Set([
  "top",
  "bottom",
  "left",
  "right",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateStep(step: unknown, index: number): void {
  if (!isPlainObject(step)) {
    throw new CoachMarkValidationError(
      "INVALID_STEP",
      `Step at index ${index} must be an object`,
      { stepIndex: index },
    );
  }

  const { targetSelector, title, description, position } = step as {
    targetSelector?: unknown;
    title?: unknown;
    description?: unknown;
    position?: unknown;
  };

  if (typeof targetSelector !== "string") {
    throw new CoachMarkValidationError(
      "INVALID_TARGET_SELECTOR",
      `Step at index ${index} has a non-string targetSelector`,
      { field: "targetSelector", stepIndex: index },
    );
  }
  if (targetSelector.trim().length === 0) {
    throw new CoachMarkValidationError(
      "EMPTY_TARGET_SELECTOR",
      `Step at index ${index} has an empty targetSelector`,
      { field: "targetSelector", stepIndex: index },
    );
  }
  if (targetSelector.length > MAX_TARGET_SELECTOR_LENGTH) {
    throw new CoachMarkValidationError(
      "OVERSIZED_TARGET_SELECTOR",
      `Step at index ${index} has a targetSelector exceeding ${MAX_TARGET_SELECTOR_LENGTH} characters`,
      { field: "targetSelector", stepIndex: index },
    );
  }

  if (typeof title !== "string") {
    throw new CoachMarkValidationError(
      "INVALID_STEP",
      `Step at index ${index} has a non-string title`,
      { field: "title", stepIndex: index },
    );
  }
  if (title.trim().length === 0) {
    throw new CoachMarkValidationError(
      "EMPTY_TITLE",
      `Step at index ${index} has an empty title`,
      { field: "title", stepIndex: index },
    );
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new CoachMarkValidationError(
      "OVERSIZED_TITLE",
      `Step at index ${index} has a title exceeding ${MAX_TITLE_LENGTH} characters`,
      { field: "title", stepIndex: index },
    );
  }

  if (typeof description !== "string") {
    throw new CoachMarkValidationError(
      "INVALID_STEP",
      `Step at index ${index} has a non-string description`,
      { field: "description", stepIndex: index },
    );
  }
  if (description.trim().length === 0) {
    throw new CoachMarkValidationError(
      "EMPTY_DESCRIPTION",
      `Step at index ${index} has an empty description`,
      { field: "description", stepIndex: index },
    );
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new CoachMarkValidationError(
      "OVERSIZED_DESCRIPTION",
      `Step at index ${index} has a description exceeding ${MAX_DESCRIPTION_LENGTH} characters`,
      { field: "description", stepIndex: index },
    );
  }

  if (
    typeof position !== "string" ||
    !VALID_POSITIONS.has(position as CoachMarkStep["position"])
  ) {
    throw new CoachMarkValidationError(
      "INVALID_POSITION",
      `Step at index ${index} has an invalid position (expected top|bottom|left|right)`,
      { field: "position", stepIndex: index },
    );
  }
}

/**
 * Validates the inputs to CoachMarkOverlay. Throws a typed CoachMarkValidationError
 * on the first problem found. This is pure (no side effects) so it can be called
 * before any state is written.
 */
export function validateCoachMarkInputs({
  steps,
  currentStep,
  onNext,
  onPrev,
  onDismiss,
}: {
  steps: unknown;
  currentStep: unknown;
  onNext: unknown;
  onPrev: unknown;
  onDismiss: unknown;
}): void {
  if (!Array.isArray(steps)) {
    throw new CoachMarkValidationError(
      "EMPTY_STEPS",
      "steps must be an array of coach-mark steps",
      { field: "steps" },
    );
  }
  if (steps.length === 0) {
    throw new CoachMarkValidationError(
      "EMPTY_STEPS",
      "steps must contain at least one step",
      { field: "steps" },
    );
  }
  if (steps.length > MAX_STEPS) {
    throw new CoachMarkValidationError(
      "TOO_MANY_STEPS",
      `steps must contain at most ${MAX_STEPS} steps (received ${steps.length})`,
      { field: "steps" },
    );
  }

  for (let i = 0; i < steps.length; i++) {
    validateStep(steps[i], i);
  }

  if (
    typeof currentStep !== "number" ||
    !Number.isInteger(currentStep) ||
    currentStep < 0 ||
    currentStep >= steps.length
  ) {
    throw new CoachMarkValidationError(
      "INVALID_CURRENT_STEP",
      `currentStep must be an integer between 0 and ${steps.length - 1}`,
      { field: "currentStep" },
    );
  }

  if (typeof onNext !== "function") {
    throw new CoachMarkValidationError(
      "INVALID_CALLBACK",
      "onNext must be a function",
      { field: "onNext" },
    );
  }
  if (typeof onPrev !== "function") {
    throw new CoachMarkValidationError(
      "INVALID_CALLBACK",
      "onPrev must be a function",
      { field: "onPrev" },
    );
  }
  if (typeof onDismiss !== "function") {
    throw new CoachMarkValidationError(
      "INVALID_CALLBACK",
      "onDismiss must be a function",
      { field: "onDismiss" },
    );
  }
}

interface CoachMarkOverlayProps {
  steps: CoachMarkStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  "aria-label"?: string;
  onValidationError?: (error: CoachMarkValidationError) => void;
}

/**
 * CoachMarkOverlay — A lightweight, accessible coach-mark overlay for
 * first-visit walkthroughs.
 *
 * Features:
 * - Highlights the target element with a cutout overlay
 * - Shows step indicator (e.g., "1 of 3")
 * - Fully keyboard-dismissible (Escape, Tab through buttons)
 * - Persists dismissal state via safeStorage (handled by parent)
 * - WCAG 2.1 AA compliant (focus management, ARIA labels)
 *
 * Inputs are validated before any state is written. Invalid inputs are reported
 * to the caller via `onValidationError` and the overlay renders nothing.
 *
 * @example
 * <CoachMarkOverlay
 *   steps={steps}
 *   currentStep={0}
 *   onNext={handleNext}
 *   onPrev={handlePrev}
 *   onDismiss={handleDismiss}
 * />
 */
export default function CoachMarkOverlay({
  steps,
  currentStep,
  onNext,
  onPrev,
  onDismiss,
  onValidationError,
  ...props
}: CoachMarkOverlayProps) {
  // Validate synchronously before any state is written. This runs on every render,
  // but is pure and cheap relative to rendering the overlay.
  let validationError: CoachMarkValidationError | null = null;
  try {
    validateCoachMarkInputs({ steps, currentStep, onNext, onPrev, onDismiss });
  } catch (err) {
    if (err instanceof CoachMarkValidationError) {
      validationError = err;
    } else {
      throw err;
    }
  }

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = validationError ? undefined : steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [step]);

  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updateTargetRect]);

  // Report validation failures to the caller without writing state.
  useEffect(() => {
    if (validationError && onValidationError) {
      onValidationError(validationError);
    }
  }, [validationError, onValidationError]);

  // Handle keyboard dismissal
  useEffect(() => {
    if (validationError) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss, validationError]);

  if (validationError || !step || !targetRect) return null;

  const stepPosition = step.position;
  const tooltipOffset = 12; // gap between target and tooltip in px

  // Tooltip position logic based on step.position
  let tooltipStyle: React.CSSProperties = {};
  switch (stepPosition) {
    case "top":
      tooltipStyle = {
        bottom: window.innerHeight - targetRect.top + tooltipOffset,
        left: targetRect.left + targetRect.width / 2,
        transform: "translateX(-50%)",
      };
      break;
    case "bottom":
      tooltipStyle = {
        top: targetRect.bottom + tooltipOffset,
        left: targetRect.left + targetRect.width / 2,
        transform: "translateX(-50%)",
      };
      break;
    case "left":
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2,
        right: window.innerWidth - targetRect.left + tooltipOffset,
        transform: "translateY(-50%)",
      };
      break;
    case "right":
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + tooltipOffset,
        transform: "translateY(-50%)",
      };
      break;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        role="presentation"
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Highlight cutout — positioned over the target element */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
        }}
      />

      {/* Tooltip */}
      <div
        role="dialog"
        aria-label={props["aria-label"] || "Guide"}
        aria-describedby="coach-mark-description"
        className="fixed z-50 w-80 max-w-[calc(100vw-32px)] bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-5 shadow-2xl"
        style={tooltipStyle}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="text-[#60A5FA] mb-3">{step.icon}</div>

        {/* Title */}
        <h3 className="text-white font-semibold text-base mb-2">
          {step.title}
        </h3>

        {/* Description */}
        <p
          id="coach-mark-description"
          className="text-zinc-400 text-sm leading-relaxed mb-5"
        >
          {step.description}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Step indicator */}
          <span className="text-xs text-zinc-500">
            {currentStep + 1} of {steps.length}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors rounded-lg hover:bg-[#2D2D2D]"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors rounded-lg"
              aria-label={currentStep < steps.length - 1 ? "Next step" : "Finish"}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Got it!"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
