"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/commonUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvancedFilterValues {
  minAmount: string;
  maxAmount: string;
  counterparty: string;
  status: string;
  fromDate: string;
  toDate: string;
}

export interface AdvancedFilterPanelProps {
  /** Whether the panel is currently open. */
  open: boolean;
  /** Called to toggle panel open/close. */
  onOpenChange: (open: boolean) => void;
  /** Current filter values shown in the panel inputs. */
  currentValues: AdvancedFilterValues;
  /** Called when the user changes a filter value within the panel. */
  onValuesChange: (values: AdvancedFilterValues) => void;
  /** Called when the user clicks Apply. */
  onApply: () => void;
  /** Called when the user clicks Clear All. */
  onClearAll: () => void;
  /** Whether the panel is visually disabled (e.g. during loading). */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "All Transactions", label: "All Transactions" },
  { value: "Payment Sent", label: "Payment Sent" },
  { value: "Payment Received", label: "Payment Received" },
] as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdvancedFilterPanel = ({
  open,
  onOpenChange,
  currentValues,
  onValuesChange,
  onApply,
  onClearAll,
  disabled = false,
}: AdvancedFilterPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when opening
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the first focusable element inside the panel after animation
      const timer = setTimeout(() => {
        const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );
        firstFocusable?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Focus trap: keep focus within the panel
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusableElements =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0]!;
      const last = focusableElements[focusableElements.length - 1]!;

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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const updateValue = useCallback(
    (field: keyof AdvancedFilterValues, value: string) => {
      onValuesChange({ ...currentValues, [field]: value });
    },
    [currentValues, onValuesChange],
  );

  return (
    <>
      {/* Backdrop overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sliding panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Advanced transaction filters"
        aria-hidden={!open}
        className={cn(
          "fixed z-50 bg-[#160f17] border-[#2D2D2D] shadow-2xl",
          "flex flex-col overflow-y-auto",
          // Desktop: slide from right
          "right-0 top-0 h-full w-full sm:w-[420px] lg:w-[480px]",
          "border-l",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D] shrink-0">
          <div className="flex items-center gap-3">
            <SlidersHorizontal
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="text-gray-300"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-white">
              Advanced Filters
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close advanced filters"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-[#1a0c1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
          {/* Status filter */}
          <fieldset className="space-y-3" disabled={disabled}>
            <legend className="text-sm font-medium text-gray-300 mb-2">
              Transaction Status
            </legend>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                    "focus-within:ring-2 focus-within:ring-gray-500",
                    currentValues.status === option.value
                      ? "border-[#04842E] bg-[#04842E]/10 text-white"
                      : "border-[#2D2D2D] text-gray-400 hover:border-gray-500 hover:text-white",
                  )}
                >
                  <input
                    type="radio"
                    name="advanced-filter-status"
                    value={option.value}
                    checked={currentValues.status === option.value}
                    onChange={(e) => updateValue("status", e.target.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      currentValues.status === option.value
                        ? "border-[#04842E] bg-[#04842E]"
                        : "border-gray-500",
                    )}
                  >
                    {currentValues.status === option.value && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Amount range filter */}
          <fieldset className="space-y-3" disabled={disabled}>
            <legend className="text-sm font-medium text-gray-300 mb-2">
              Amount Range (USD)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="adv-min-amount"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Min
                </label>
                <Input
                  id="adv-min-amount"
                  type="number"
                  placeholder="0"
                  aria-label="Minimum amount"
                  value={currentValues.minAmount}
                  onChange={(e) => updateValue("minAmount", e.target.value)}
                  className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-500 focus:border-gray-600 h-10"
                />
              </div>
              <div>
                <label
                  htmlFor="adv-max-amount"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Max
                </label>
                <Input
                  id="adv-max-amount"
                  type="number"
                  placeholder="999999"
                  aria-label="Maximum amount"
                  value={currentValues.maxAmount}
                  onChange={(e) => updateValue("maxAmount", e.target.value)}
                  className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-500 focus:border-gray-600 h-10"
                />
              </div>
            </div>
            {currentValues.minAmount &&
              currentValues.maxAmount &&
              parseFloat(currentValues.minAmount) >
                parseFloat(currentValues.maxAmount) && (
                <p
                  className="text-red-400 text-xs mt-1"
                  role="alert"
                  aria-live="polite"
                >
                  Minimum amount cannot exceed maximum amount
                </p>
              )}
          </fieldset>

          {/* Counterparty filter */}
          <div className="space-y-3">
            <label
              htmlFor="adv-counterparty"
              className="block text-sm font-medium text-gray-300"
            >
              Counterparty Address
            </label>
            <Input
              id="adv-counterparty"
              type="text"
              placeholder="e.g. GABCDE... or 0xA1B2..."
              aria-label="Counterparty address"
              disabled={disabled}
              value={currentValues.counterparty}
              onChange={(e) => updateValue("counterparty", e.target.value)}
              className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-500 focus:border-gray-600 h-10"
            />
            <p className="text-xs text-gray-500">
              Filter by wallet address (partial match supported)
            </p>
          </div>

          {/* Date range filter */}
          <fieldset className="space-y-3" disabled={disabled}>
            <legend className="text-sm font-medium text-gray-300 mb-2">
              Date Range
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="adv-from-date"
                  className="block text-xs text-gray-500 mb-1"
                >
                  From
                </label>
                <Input
                  id="adv-from-date"
                  type="date"
                  aria-label="From date"
                  value={currentValues.fromDate}
                  onChange={(e) => updateValue("fromDate", e.target.value)}
                  className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-500 focus:border-gray-600 h-10 [color-scheme:dark]"
                />
              </div>
              <div>
                <label
                  htmlFor="adv-to-date"
                  className="block text-xs text-gray-500 mb-1"
                >
                  To
                </label>
                <Input
                  id="adv-to-date"
                  type="date"
                  aria-label="To date"
                  value={currentValues.toDate}
                  onChange={(e) => updateValue("toDate", e.target.value)}
                  className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-500 focus:border-gray-600 h-10 [color-scheme:dark]"
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#2D2D2D] shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClearAll}
            disabled={disabled}
            className="flex-1 text-gray-400 hover:text-white hover:bg-[#1a0c1d] gap-2"
          >
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
            Clear All
          </Button>
          <Button
            type="button"
            onClick={onApply}
            disabled={disabled}
            className="flex-1 bg-[#04842E] hover:bg-[#04842E]/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilterPanel;
