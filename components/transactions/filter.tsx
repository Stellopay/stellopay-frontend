"use client";

import React, { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { ListFilter, X } from "lucide-react";

interface FilterProps {
  /** Current committed transaction filter text. Treated as plain text only. */
  value: string;
  /** Receives debounced filter text changes, or an immediate empty string on clear. */
  onChange: (value: string) => void;
  /** Current committed min amount */
  minAmount?: number;
  /** Receives debounced min amount changes */
  onMinAmountChange?: (value: number | undefined) => void;
  /** Current committed max amount */
  maxAmount?: number;
  /** Receives debounced max amount changes */
  onMaxAmountChange?: (value: number | undefined) => void;
  /** Debounce delay in milliseconds before `onChange` fires. Defaults to 300ms. */
  debounceMs?: number;
}

const Filter = ({
  value,
  onChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  debounceMs = 300,
}: FilterProps) => {
  const [draftValue, setDraftValue] = useState(value);
  const [draftMin, setDraftMin] = useState<string>(minAmount !== undefined ? String(minAmount) : "");
  const [draftMax, setDraftMax] = useState<string>(maxAmount !== undefined ? String(maxAmount) : "");
  const [error, setError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  const onMinChangeRef = useRef(onMinAmountChange);
  const onMaxChangeRef = useRef(onMaxAmountChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onMinChangeRef.current = onMinAmountChange;
  }, [onMinAmountChange]);
  useEffect(() => {
    onMaxChangeRef.current = onMaxAmountChange;
  }, [onMaxAmountChange]);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);
  useEffect(() => {
    setDraftMin(minAmount !== undefined ? String(minAmount) : "");
  }, [minAmount]);
  useEffect(() => {
    setDraftMax(maxAmount !== undefined ? String(maxAmount) : "");
  }, [maxAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Validate range
      let minParsed = draftMin !== "" ? parseFloat(draftMin) : undefined;
      let maxParsed = draftMax !== "" ? parseFloat(draftMax) : undefined;
      minParsed = minParsed !== undefined && !isNaN(minParsed) ? minParsed : undefined;
      maxParsed = maxParsed !== undefined && !isNaN(maxParsed) ? maxParsed : undefined;

      if (minParsed !== undefined && maxParsed !== undefined && minParsed > maxParsed) {
        setError("Min > Max");
        // Don't apply invalid filters to parent
      } else {
        setError(null);
        if (draftValue !== value) onChangeRef.current(draftValue);
        // Only trigger updates if valid and changed
        if (onMinChangeRef.current && minParsed !== minAmount) {
          onMinChangeRef.current(minParsed);
        }
        if (onMaxChangeRef.current && maxParsed !== maxAmount) {
          onMaxChangeRef.current(maxParsed);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [draftValue, draftMin, draftMax, debounceMs, value, minAmount, maxAmount]);

  const clearFilter = () => {
    setDraftValue("");
    setDraftMin("");
    setDraftMax("");
    onChangeRef.current("");
    if (onMinChangeRef.current) onMinChangeRef.current(undefined);
    if (onMaxChangeRef.current) onMaxChangeRef.current(undefined);
  };

  return (
    <div className="relative flex items-center bg-transparent rounded-[6.25rem]">
      <ListFilter
        aria-hidden="true"
        data-testid="transactions-filter-icon"
        className="text-gray-600 w-5 h-5 ml-1"
      />
      <Input
        type="text"
        placeholder="Filter"
        aria-label="Filter transactions"
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
      
      <div className="flex items-center space-x-1 border-l border-gray-600 pl-2 ml-1">
        <Input
          type="number"
          placeholder="Min $"
          aria-label="Min amount"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px] w-16 px-1"
        />
        <span className="text-gray-400">-</span>
        <Input
          type="number"
          placeholder="Max $"
          aria-label="Max amount"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px] w-16 px-1"
        />
      </div>

      {(draftValue || draftMin || draftMax) && (
        <button
          type="button"
          aria-label="Clear transaction filter"
          onClick={clearFilter}
          className="rounded-full p-1 ml-1 text-gray-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}

      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap">
          <span className="text-red-500 text-[11px] font-medium px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20">
            {error}
          </span>
        </div>
      )}
    </div>
  );
};

export default Filter;
