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

interface DestructiveActionDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  impactItems: string[];
  confirmationToken: string;
  confirmationLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function DestructiveActionDialog({
  triggerLabel,
  title,
  description,
  impactItems,
  confirmationToken,
  confirmationLabel,
  confirmLabel,
  onConfirm,
}: DestructiveActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const inputId = `confirmation-${confirmationToken.toLowerCase()}`;

  const isConfirmed = confirmationText.trim() === confirmationToken;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setConfirmationText("");
    }
  };

  const handleConfirm = () => {
    if (!isConfirmed) {
      return;
    }

    onConfirm();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent className="border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Before you continue
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {impactItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-zinc-900 dark:text-white"
            >
              {confirmationLabel}
            </label>
            <Input
              id={inputId}
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder={confirmationToken}
              className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
