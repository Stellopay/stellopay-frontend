"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";

type Provider = "google" | "apple";

/**
 * AuthSocialButtons – renders social OAuth login buttons.
 *
 * Loading/disabled behaviour:
 * - Once any provider button is clicked, ALL buttons are disabled to prevent
 *   duplicate OAuth flows or concurrent provider redirects.
 * - Only the clicked button shows a spinner; the other stays visually idle.
 * - If the OAuth flow is cancelled or throws, all buttons are re-enabled.
 */
export function AuthSocialButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const isLoading = loadingProvider !== null;

  const handleLogin = async (provider: Provider) => {
    // Guard: ignore clicks while any provider flow is already in-flight.
    if (isLoading) return;

    setLoadingProvider(provider);
    try {
      if (provider === "google") {
        // TODO: integrate Google authentication.
      } else if (provider === "apple") {
        // TODO: integrate Apple authentication.
      }
    } catch {
      // Re-enable buttons on failure so the user can retry.
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex md:flex-row flex-col justify-center items-center gap-3 mt-10">
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
        Continue With Google
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
        Continue With Apple
      </Button>
    </div>
  );
}
