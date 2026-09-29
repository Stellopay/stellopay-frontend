"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getProfile } from "@/lib/api/profile";
import type { ProfileData, ProfileResult } from "@/types/profile";

export type UseProfileResult =
  | {
      status: "loading";
      profile: null;
      source: null;
      placeholderReason: null;
      error: null;
      retry: () => void;
    }
  | {
      status: "success";
      profile: ProfileData;
      source: ProfileResult["source"];
      placeholderReason: ProfileResult extends { reason: infer R } ? R : never;
      error: null;
      retry: () => void;
    }
  | {
      status: "error";
      profile: null;
      source: null;
      placeholderReason: null;
      error: Error;
      retry: () => void;
    };

/**
 * Loads the signed-in user's profile and exposes the full request lifecycle.
 *
 * This is the single place a component should call to obtain profile data:
 * it delegates to `getProfile`, which issues a real request and validates the
 * payload at the boundary. The hook never collapses a failure into "no data" —
 * `status` distinguishes `loading`, `success`, and `error`, and a successful
 * load carries `source` so a caller can tell real data from seeded placeholder
 * data and label it as such.
 *
 * The in-flight request is aborted on unmount and whenever `retry()` is
 * called, so a late response can never overwrite fresher state.
 *
 * @example
 * ```tsx
 * const { status, profile, source, error, retry } = useProfile();
 *
 * if (status === "loading") return <ProfileSkeleton />;
 * if (status === "error")   return <ErrorState title="…" description={error.message} onRetry={retry} />;
 * return <ProfileForm profile={profile} isPlaceholder={source === "placeholder"} />;
 * ```
 */
export function useProfile(): UseProfileResult {
  const [state, setState] = useState<{
    status: UseProfileResult["status"];
    profile: ProfileData | null;
    source: ProfileResult["source"] | null;
    placeholderReason: "api_base_url_missing" | null;
    error: Error | null;
  }>({
    status: "loading",
    profile: null,
    source: null,
    placeholderReason: null,
    error: null,
  });

  const [requestTick, setRequestTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const retry = useCallback(() => {
    setRequestTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState((previous) => ({
      ...previous,
      status: "loading",
      error: null,
    }));

    getProfile(controller.signal)
      .then((result) => {
        if (!mountedRef.current || controller.signal.aborted) return;

        setState({
          status: "success",
          profile: result.profile,
          source: result.source,
          placeholderReason:
            result.source === "placeholder" ? result.reason : null,
          error: null,
        });
      })
      .catch((error: unknown) => {
        // An abort is a normal cancellation (unmount or retry), not a failure
        // to report to the user.
        if (!mountedRef.current || controller.signal.aborted) return;

        setState({
          status: "error",
          profile: null,
          source: null,
          placeholderReason: null,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to load profile."),
        });
      });

    return () => controller.abort();
  }, [requestTick]);

  return { ...state, retry } as UseProfileResult;
}
