"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { OAuthCallbackError } from "@/lib/api/auth";

type Provider = "google" | "apple";

export function AuthSocialButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [errorState, setErrorState] = useState<{ 
    message: string; 
    code: string; 
    retry: () => void; 
    useEmailInstead: () => void; 
  } | null>(null);

  const isLoading = loadingProvider !== null;

  const handleLogin = async (provider: Provider) => {
    // Guard: ignore clicks while any provider flow is already in-flight.
    if (isLoading) return;

    setLoadingProvider(provider);
    setErrorState(null); // Clear any existing error state

    try {
      if (provider === "google") {
        // TODO: integrate Google authentication.
        await simulateOAuth(provider);
      } else if (provider === "apple") {
        // TODO: integrate Apple authentication.
        await simulateOAuth(provider);
      }
    } catch (error) {
      if (error instanceof OAuthCallbackError) {
        // Handle specific OAuth error states
        const errorMessage = error.message;
        const errorCode = error.code;
        
        // Show appropriate error UI with retry and alternative actions
        setErrorState({
          message: errorMessage,
          code: errorCode,
          retry: () => handleLogin(provider),
          useEmailInstead: () => {
            // Clean up error state and redirect to email login
            setErrorState(null);
            // Navigate to email login - implementation depends on routing
            window.location.href = "/login";
          }
        });
      } else {
        // Unexpected error - fallback to generic handling
        setErrorState(null);
        setLoadingProvider(null);
      }
    } finally {
      // Re-enable buttons once the flow settles, whether it succeeded,
      // failed, or (as with the TODO stubs today) did nothing at all.
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex md:flex-row flex-col justify-center items-center gap-3 mt-10">
      {errorState ? (
        <div className="p-4 bg-error-100 border-error border-error-300 rounded-lg text-error-800">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium">{errorState.message}</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={errorState.retry}
                className="inline-flex justify-center w-full rounded-md border border-primary-500 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                disabled={isLoading}
                aria-disabled={isLoading}
              >
                Retry
              </button>
              <button
                type="button"
                onClick={errorState.useEmailInstead}
                className="inline-flex justify-center w-full rounded-md border border-primary-500 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                disabled={isLoading}
                aria-disabled={isLoading}
              >
                Use Email Instead
              </button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              {errorState.code === "access_denied" && "User has denied permission"}
              {errorState.code === "provider_unavailable" && "Authentication provider is temporarily unavailable"}
              {errorState.code === "account_exists_different_method" && "Email already exists with password"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex md:flex-row flex-col justify-center items-center gap-3">
          <Button
            variant={"outline"}
            onClick={() => handleLogin("google")}
            disabled={isLoading}
            aria-busy={loadingProvider === "google"}
            className="border-muted-foreground cursor-pointer w-full md:w-auto"
          >
            {loadingProvider === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Image
                src={"/google-logo.svg"}
                alt="Google logo"
                width={20}
                height={20}
              />
            )}
            <span className="whitespace-nowrap">Continue With Google</span>
          </Button>
          <Button
            variant={"outline"}
            onClick={() => handleLogin("apple")}
            disabled={isLoading}
            aria-busy={loadingProvider === "apple"}
            className="border-muted-foreground cursor-pointer w-full md:w-auto"
          >
            {loadingProvider === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Image
                src={"/apple-logo.svg"}
                alt="Apple logo"
                width={20}
                height={20}
              />
            )}
            <span className="whitespace-nowrap">Continue With Apple</span>
          </Button>
        </div>
      )}
    </div>
  );
}