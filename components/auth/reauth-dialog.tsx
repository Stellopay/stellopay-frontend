"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthRecovery } from "@/context/auth-recovery-context";
import { login } from "@/lib/api/auth";
import { Lock, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface ReauthDialogProps {
  onSuccess?: () => void;
}

export function ReauthDialog({ onSuccess }: ReauthDialogProps) {
  const { isReauthDialogOpen, completeReauth, restoreSessionState } = useAuthRecovery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionState = restoreSessionState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password, rememberMe: true });
      completeReauth({ accessToken: "fresh-reauth-access-token", csrfToken: "fresh-reauth-csrf-token" });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReauthDialogOpen) return null;

  return (
    <Dialog open={isReauthDialogOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <DialogHeader className="gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold">
            <ShieldAlert className="size-5 shrink-0" />
            <span>Session Expired</span>
          </div>
          <DialogTitle className="text-xl font-bold mt-1">Sign in to continue</DialogTitle>
          <DialogDescription>
            Your authorization or security token has expired. Re-authenticate below to safely continue your action.
          </DialogDescription>
        </DialogHeader>

        {sessionState && (
          <div className="bg-muted/60 dark:bg-muted/30 p-3 rounded-md text-xs space-y-1 border border-border/50">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Safe State Preserved</span>
            </div>
            <p className="text-muted-foreground">
              Return route: <code className="bg-background px-1 py-0.5 rounded border">{sessionState.route}</code>
            </p>
            {sessionState.formState && (
              <p className="text-muted-foreground">
                Draft form progress saved safely in memory.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reauth-email">Email Address</Label>
            <Input
              id="reauth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2 sm:justify-end">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto gap-2">
              <Lock className="size-4" />
              {isLoading ? "Signing in..." : "Re-authenticate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
