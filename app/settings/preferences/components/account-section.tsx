'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DestructiveActionDialog } from "./destructive-action-dialog";
import { OAuthCallbackError } from "@/lib/api/auth";

interface DeletionFlowState {
  reason: string | null;
  dataExported: boolean;
  isDeleting: boolean;
  countdown: number;
}

const DEFAULT_DELETION_FLOW: DeletionFlowState = {
  reason: null,
  dataExported: false,
  isDeleting: false,
  countdown: 14
};

interface AccountSectionProps {
  profile: any;
  onProfileChange: (profile: any) => void;
}

interface DeletionDialogProps {
  title: string;
  description: string;
  impactItems: string[];
  confirmationToken: string;
  confirmationLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const getConfirmationError = (value: string, token: string): string | null => {
  if (value === token) return null;
  if (value.trim() === token) return 'Remove extra spaces — type exactly "${token}"';
  if (value.toLowerCase() === token.toLowerCase()) return 'Check capitalization — type exactly "${token}"';
  return 'The text doesn
