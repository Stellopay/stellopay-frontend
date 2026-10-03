/**
 * OAuth provider configuration detection.
 *
 * Social sign-in buttons must not be presented to users when the provider
 * has no client credentials configured. This module exposes a single
 * source of truth for "is this provider ready?" so the UI can gate
 * rendering accordingly.
 */

export type OAuthProvider = "google" | "apple";

/**
 * Returns the list of OAuth providers that have client credentials
 * configured via environment variables.
 *
 * - Google requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
 * - Apple requires `NEXT_PUBLIC_APPLE_CLIENT_ID`
 *
 * In the absence of either variable the provider is considered
 * unconfigured and must not be offered in the UI.
 */
export function getConfiguredOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];

  if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    providers.push("google");
  }

  if (process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
    providers.push("apple");
  }

  return providers;
}

/**
 * Returns true when the given provider has credentials configured.
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  return getConfiguredOAuthProviders().includes(provider);
}
