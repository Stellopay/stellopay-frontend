"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type TransactionType = 
  | "AgreementCreated"
  | "AgreementActivated"
  | "AgreementPaused"
  | "AgreementResumed"
  | "AgreementCancelled"
  | "AgreementCompleted"
  | "AgreementStatusChange"
  | "EmployeeAdded"
  | "MilestoneAdded"
  | "MilestoneApproved"
  | "MilestoneClaimed"
  | "PayrollClaimed"
  | "DisputeRaised"
  | "DisputeResolved"
  | "PaymentSent"
  | "PaymentReceived"
  | "Funded"
  | "Released"
  | "Refunded";

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  AgreementCreated: "Agreement Created",
  AgreementActivated: "Agreement Activated",
  AgreementPaused: "Agreement Paused",
  AgreementResumed: "Agreement Resumed",
  AgreementCancelled: "Agreement Cancelled",
  AgreementCompleted: "Agreement Completed",
  AgreementStatusChange: "Agreement Status Changed",
  EmployeeAdded: "Employee Added",
  MilestoneAdded: "Milestone Added",
  MilestoneApproved: "Milestone Approved",
  MilestoneClaimed: "Milestone Claimed",
  PayrollClaimed: "Payroll Claimed",
  DisputeRaised: "Dispute Raised",
  DisputeResolved: "Dispute Resolved",
  PaymentSent: "Payment Sent",
  PaymentReceived: "Payment Received",
  Funded: "Funded",
  Released: "Released",
  Refunded: "Refunded",
};

interface TransactionTypeFilterProps {
  selectedTypes: TransactionType[];
  onTypesChange: (types: TransactionType[]) => void;
}

export function TransactionTypeFilter({
  selectedTypes,
  onTypesChange,
}: TransactionTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<TransactionType[]>(selectedTypes);

  useEffect(() => {
    setLocalSelected(selectedTypes);
  }, [selectedTypes]);

  const allTypes: TransactionType[] = Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[];

  const handleToggle = (type: TransactionType) => {
    const newSelected = localSelected.includes(type)
      ? localSelected.filter(t => t !== type)
      : [...localSelected, type];
    setLocalSelected(newSelected);
  };

  const handleSelectAll = () => {
    setLocalSelected(allTypes);
  };

  const handleClearAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onTypesChange(localSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalSelected(allTypes);
    onTypesChange(allTypes);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center rounded-[6.25rem] px-3 py-1 border border-[#2E2E2E] bg-[#121212] cursor-pointer hover:bg-[#1A1A1A] transition-colors h-9">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-600 mr-2"
          >
            <path
              d="M2 4H14M4 8H12M6 12H10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-[13px] sm:text-[14px] text-gray-400">Transaction Types</span>
            {selectedTypes.length < allTypes.length && selectedTypes.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-[#2E2E2E] rounded text-white">
              {selectedTypes.length}
            </span>
          )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] bg-[#1a0c1d] border-[#2E2E2E] text-[#E5E5E5]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-lg text-white">Filter Transaction Types</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7 text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#2E2E2E]"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7 text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#2E2E2E]"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {allTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={localSelected.includes(type)}
                  onCheckedChange={() => handleToggle(type)}
                  className="border-[#2E2E2E] data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black"
                />
                <Label
                  htmlFor={type}
                  className="text-sm font-normal cursor-pointer flex-1 text-white"
                >
                  {TRANSACTION_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-[#2E2E2E]">
            <Button
              onClick={handleApply}
              className="flex-1 bg-white hover:bg-white/80 text-black border-0"
            >
              Apply
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-[#2E2E2E] bg-transparent text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#2E2E2E]"
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


