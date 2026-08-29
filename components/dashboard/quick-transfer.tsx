"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { isValidStellarAddress } from "@/utils/stellarAddress";
import { useDirtyGuard } from "@/hooks/useDirtyGuard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * Schema for the quick-transfer form.
 */
const quickTransferSchema = z.object({
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .refine(isValidStellarAddress, {
      message:
        "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.",
    }),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than zero",
    })
    .refine(
      (val) => /^\d+(\.\d{1,7})?$/.test(val),
      {
        message: "Amount can have up to 7 decimal places",
      },
    ),
});

type QuickTransferValues = z.infer<typeof quickTransferSchema>;

export interface QuickTransferProps {
  recentRecipients: Array<{ address: string; label?: string }>;
  onSend?: (values: QuickTransferValues) => Promise<void> | void;
  maxAmount?: number;
  token?: string;
}

function QuickTransfer({
  recentRecipients = [],
  onSend,
  maxAmount = 1_000_000,
  token = "XLM",
}: QuickTransferProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [filteredRecipients, setFilteredRecipients] = useState<typeof recentRecipients>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [formError, setFormError] = useState<string | null>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QuickTransferValues>({
    resolver: zodResolver(quickTransferSchema),
    mode: "onBlur",
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const watchRecipient = form.watch("recipient");
  const watchAmount = form.watch("amount");
  useDirtyGuard(form.formState.isDirty && !isSubmitting);
  const recipientError = form.formState.errors.recipient?.message;
  const amountError = form.formState.errors.amount?.message;

  const isFormValid = useMemo(() => {
    if (!watchRecipient || !watchAmount) return false;
    if (recipientError || amountError) return false;
    if (!isValidStellarAddress(watchRecipient)) return false;
    const numericAmount = Number(watchAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) return false;
    if (numericAmount > maxAmount) return false;
    return true;
  }, [watchRecipient, watchAmount, recipientError, amountError, maxAmount]);

  useEffect(() => {
    setRecipientInput(watchRecipient);
  }, [watchRecipient]);

  useEffect(() => {
    if (!showSuggestions) {
      setFilteredRecipients([]);
      setActiveSuggestionIndex(-1);
      return;
    }

    const trimmed = recipientInput.trim().toUpperCase();
    if (trimmed.length === 0) {
      setFilteredRecipients(recentRecipients.slice(0, 5));
      setActiveSuggestionIndex(-1);
      return;
    }

    const filtered = recentRecipients
      .filter((r) => {
        const addr = r.address.toUpperCase();
        const label = (r.label || "").toUpperCase();
        return addr.includes(trimmed) || label.includes(trimmed);
      })
      .slice(0, 5);

    setFilteredRecipients(filtered);
    setActiveSuggestionIndex(-1);
  }, [recipientInput, recentRecipients, showSuggestions]);

  const handleRecipientChange = (value: string) => {
    form.setValue("recipient", value, { shouldValidate: true });
    setRecipientInput(value);
    setShowSuggestions(true);
    setFormError(null);
  };

  const selectSuggestion = (address: string) => {
    form.setValue("recipient", address, { shouldValidate: true });
    setRecipientInput(address);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleRecipientKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredRecipients.length === 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => {
        const next = prev < filteredRecipients.length - 1 ? prev + 1 : 0;
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredRecipients.length - 1;
        return next;
      });
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredRecipients.length) {
        e.preventDefault();
        selectSuggestion(filteredRecipients[activeSuggestionIndex].address);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    if (activeSuggestionIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll("[role='option']");
      const item = items[activeSuggestionIndex];
      if (item && typeof item.scrollIntoView === "function") {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeSuggestionIndex]);

  const handleSubmit = () => {
    const values = form.getValues();
    if (!isFormValid) return;

    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const values = form.getValues();
      await onSend?.(values);
      form.reset();
      setRecipientInput("");
      setIsDialogOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Transfer failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormError(null);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 sm:p-6 transition-all bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-elevation-1",
      )}
      aria-labelledby="quick-transfer-heading"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2
          id="quick-transfer-heading"
          className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white"
        >
          Quick Transfer
        </h2>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
          Send {token}
        </span>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="quick-transfer-recipient">
                  Recipient
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      ref={inputRef}
                      id="quick-transfer-recipient"
                      type="text"
                      placeholder="G... or M..."
                      autoComplete="off"
                      error={!!recipientError}
                      aria-describedby={
                          recipientError
                            ? "qt-recipient-error"
                            : "qt-recipient-hint"
                        }
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions(false);
                          setActiveSuggestionIndex(-1);
                        }, 150);
                      }}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                      onKeyDown={handleRecipientKeyDown}
                      aria-autocomplete="list"
                      aria-controls="qt-recipient-listbox"
                      aria-expanded={showSuggestions && filteredRecipients.length > 0}
                      aria-activedescendant={
                        activeSuggestionIndex >= 0
                          ? `qt-recipient-option-${activeSuggestionIndex}`
                          : undefined
                      }
                      role="combobox"
                    />
                    {showSuggestions && filteredRecipients.length > 0 && (
                      <ul
                        id="qt-recipient-listbox"
                        ref={listboxRef}
                        role="listbox"
                        aria-label="Recent recipients"
                        className={cn(
                          "absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#111111] shadow-lg",
                        )}
                      >
                        {filteredRecipients.map((recipient, index) => (
                          <li
                            key={recipient.address}
                            id={`qt-recipient-option-${index}`}
                            role="option"
                            aria-selected={index === activeSuggestionIndex}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(recipient.address);
                            }}
                            className={cn(
                              "cursor-pointer px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100",
                              index === activeSuggestionIndex &&
                                "bg-zinc-100 dark:bg-zinc-800",
                            )}
                          >
                            <span className="block truncate">
                              {recipient.label || recipient.address}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </FormControl>
                <p
                  id="qt-recipient-hint"
                  className="text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Start typing or select a recent recipient
                </p>
                <FormMessage id="qt-recipient-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="quick-transfer-amount">
                  Amount ({token})
                </FormLabel>
                <FormControl>
              <Input
                {...field}
                id="quick-transfer-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                error={!!amountError}
                aria-describedby={amountError ? "qt-amount-error" : undefined}
                onChange={(e) => field.onChange(e.target.value)}
              />
                </FormControl>
                <FormMessage id="qt-amount-error" />
              </FormItem>
            )}
          />

          {formError && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4" aria-hidden />
            Review Transfer
          </Button>
        </form>
      </Form>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent
          onEscapeKeyDown={handleCloseDialog}
          aria-describedby="quick-transfer-dialog-desc"
        >
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription id="quick-transfer-dialog-desc">
              Review the details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 p-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                To
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white break-all text-right max-w-[70%]">
                {form.getValues("recipient") || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 p-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                Amount
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {form.getValues("amount") ? `${form.getValues("amount")} ${token}` : "—"}
              </span>
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { type QuickTransferProps };
export default QuickTransfer;
