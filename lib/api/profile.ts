/**
 * @fileoverview Profile API layer — currently backed by mock data.
 * Swap the body for a fetch() when the backend is ready.
 */

import type { ProfileData } from '@/app/settings/preferences/components/account-section';

/**
 * Persist the profile to the server.
 *
 * Currently a mock that simulates network latency so the optimistic-update
 * UI (spinner, badge transitions) is visible during development.
 *
 * Exported as a separate module so tests can mock it cleanly with vi.mock.
 */
export async function saveProfile(_profile: ProfileData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
