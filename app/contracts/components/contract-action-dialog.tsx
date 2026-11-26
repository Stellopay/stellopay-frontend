"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { canTransitionContract } from "@/lib/contracts-state";
import type { Contract, ContractAction } from "@/types/contract";

const CANCEL_TOKEN = "CANCEL";

const ACTION_COPY: Record<
  ContractAction,
  {
    trigger: string;
    title: string;
    description: string;
    confirm: string;
    dismiss: string;
    destructive: boolean;
  }
> = {
  activate: {
    trigger: "Activate",
    title: "Activate this contract?",
    description:
      "The contract will move to Active and no longer be editable as a draft.",
    confirm: "Activate contract",
    dismiss: "Keep draft",
    destructive: false,
  },
  complete: {
    trigger: "Complete",
    title: "Mark this contract complete?",
    description:
      "All milestones are treated as released and the contract becomes read-only.",
    confirm: "Complete contract",
    dismiss: "Keep active",
    destructive: false,
  },
  cancel: {
    trigger: "Cancel contract",
    title: "Cancel this contract?",
    description:
      "Cancellation is permanent. The contract will no longer be available for activation or completion.",
    confirm: "Cancel contract",
    dismiss: "Keep contract",
    destructive: true,
  },
};

interface ContractActionDialogProps {
  contract: Contract;
  action: ContractAction;
  onConfirm: () => void;
}

export function ContractActionDialog({
  contract,
  action,
  onConfirm,
}: ContractActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const copy = ACTION_COPY[action];

  if (!canTransitionContract(contract.status, action)) return null;

  const isConfirmed = action !== "cancel" || confirmation === CANCEL_TOKEN;
  const inputId = `cancel-contract-${contract.id}`;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setConfirmation("");
  };

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={copy.destructive ? "destructive" : "outline"} size="sm">
          {copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            {copy.destructive && (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
            )}
            <div className="space-y-1">
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                {copy.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {action === "cancel" && (
          <div className="space-y-2">
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-zinc-900 dark:text-white"
            >
              Type {CANCEL_TOKEN} exactly to confirm
            </label>
            <Input
              id={inputId}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-required
              aria-invalid={confirmation.length > 0 && !isConfirmed}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {copy.dismiss}
          </Button>
          <Button
            variant={copy.destructive ? "destructive" : "default"}
            disabled={!isConfirmed}
            onClick={handleConfirm}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
