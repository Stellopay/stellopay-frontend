"use client";

import * as React from "react";
import { z } from "zod";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Camera,
  X,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Report Bug", icon: Bug, description: "Something isn't working as expected" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest an idea for improvement" },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const feedbackSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(100, "Subject cannot exceed 100 characters"),
  description: z.string().trim().min(10, "Please provide at least 10 characters").max(2000, "Description cannot exceed 2000 characters"),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

// ── Floating Button ──────────────────────────────────────────────────────────

function FloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Open feedback form"
      aria-haspopup="dialog"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex items-center gap-2",
        "rounded-full px-4 py-3 shadow-lg",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "transition-colors duration-200",
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline text-sm font-medium">Feedback</span>
    </motion.button>
  );
}

// ── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

// ── Screenshot Upload ────────────────────────────────────────────────────────

function ScreenshotUpload({ file, onFileChange, onRemove }: { file: File | null; onFileChange: (file: File | null) => void; onRemove: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) { setPreview(null); return; }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); };
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (selected) {
      if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
        setError("Please select a PNG, JPEG, WebP, or GIF image.");
        onFileChange(null); return;
      }
      if (selected.size > MAX_FILE_SIZE) {
        setError("File size must be less than 10 MB.");
        onFileChange(null); return;
      }
      onFileChange(selected);
    }
    if (inputRef.current) { inputRef.current.value = ""; }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Screenshot (optional)</Label>
      {file && preview ? (
        <div className="relative inline-block rounded-md overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Screenshot preview" className="max-h-32 w-auto object-contain bg-muted" />
          <button type="button" onClick={onRemove} className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-background transition-colors" aria-label="Remove screenshot">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="upload-screenshot-trigger"
          onClick={() => inputRef.current?.click()}
          className={cn("flex items-center gap-2 rounded-md border border-input px-3 py-2", "text-sm text-muted-foreground hover:text-foreground", "hover:bg-accent transition-colors", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
          aria-label="Upload screenshot"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          <span>Attach screenshot</span>
        </button>
      )}
      <input ref={inputRef} type="file" data-testid="screenshot-file-input" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={handleFileSelect} className="hidden" aria-hidden="true" tabIndex={-1} />
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ── Feedback Widget (inline modal, no portal) ────────────────────────────────

interface FeedbackWidgetProps { onSubmitSuccess?: () => void; }

export default function FeedbackWidget({ onSubmitSuccess }: FeedbackWidgetProps = {}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>("bug");
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<{ subject?: string; description?: string }>({});
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => {
        setSubject(""); setDescription(""); setScreenshot(null);
        setErrors({}); setSubmitStatus("idle"); setSubmitMessage("");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitStatus === "loading") return;
    setErrors({}); setSubmitStatus("idle"); setSubmitMessage("");

    const data: FeedbackFormValues = { subject: subject.trim(), description: description.trim() };
    const validationResult = feedbackSchema.safeParse(data);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitStatus("loading");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      let screenshotBase64: string | null = null;
      if (screenshot) screenshotBase64 = await fileToBase64(screenshot);
      const payload = { ...validationResult.data, type: feedbackType, screenshot: screenshotBase64 };

      if (baseUrl) {
        const response = await fetch(`${baseUrl}/api/support`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to submit feedback");
      } else {
        if (process.env.NODE_ENV !== "test") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setSubmitStatus("success");
      setSubmitMessage("Thank you! Your feedback has been submitted successfully.");
      onSubmitSuccess?.();
      setTimeout(() => setIsOpen(false), 2000);
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("Something went wrong. Please try again later.");
    }
  };

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => { if (submitStatus !== "loading") setIsOpen(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && submitStatus !== "loading") {
      setIsOpen(false);
    }
  };
  const titleId = "feedback-dialog-title";
  const descriptionId = "feedback-dialog-description";

  return (
    <>
      <AnimatePresence>{!isOpen && <FloatingButton onClick={handleOpen} />}</AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onKeyDown={handleKeyDown}
        >
          <Overlay onClick={handleClose} />

          <div
            className={cn(
              "relative z-10 w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto",
              "rounded-lg border bg-background p-6 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-200",
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  Send Feedback
                </h2>
                <p id={descriptionId} className="text-sm text-muted-foreground mt-1">
                  Help us improve StelloPay by reporting a bug or suggesting a feature.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Feedback type selector */}
            <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Feedback type">
              {FEEDBACK_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = feedbackType === type.value;
                return (
                  <button key={type.value} type="button" role="radio" aria-checked={isActive}
                    onClick={() => setFeedbackType(type.value)}
                    className={cn("flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors",
                      isActive ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:text-foreground hover:bg-accent")}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Success message */}
            {submitStatus === "success" && (
              <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success mb-4" role="alert">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitMessage}</span>
              </div>
            )}

            {/* Error message */}
            {submitStatus === "error" && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4" role="alert">
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitMessage}</span>
              </div>
            )}

            {/* Form */}
            {submitStatus !== "success" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback-subject" className="text-sm font-medium">Subject</Label>
                  <Input id="feedback-subject"
                    placeholder={feedbackType === "bug" ? "Briefly describe the issue..." : "Briefly describe your idea..."}
                    value={subject} onChange={(e) => handleSubjectChange(e.target.value)}
                    error={!!errors.subject} disabled={submitStatus === "loading"} autoFocus />
                  {errors.subject && <p className="text-xs text-destructive" role="alert">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-description" className="text-sm font-medium">Description</Label>
                  <Textarea id="feedback-description"
                    placeholder={feedbackType === "bug" ? "Please include steps to reproduce, expected behavior, and actual behavior..." : "Describe your idea and how it would benefit StelloPay users..."}
                    rows={5} value={description} onChange={(e) => handleDescriptionChange(e.target.value)}
                    error={!!errors.description} disabled={submitStatus === "loading"} />
                  {errors.description && <p className="text-xs text-destructive" role="alert">{errors.description}</p>}
                </div>

                <ScreenshotUpload file={screenshot} onFileChange={setScreenshot} onRemove={() => setScreenshot(null)} />

                <Button type="submit" disabled={submitStatus === "loading"} className="w-full">
                  {submitStatus === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" aria-hidden="true" /> Send Feedback</>
                  )}
                </Button>
              </form>
            )}


          </div>
        </div>
      )}
    </>
  );
}

function fileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
