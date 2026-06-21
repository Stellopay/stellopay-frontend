export interface NotificationPreferences {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  marketing: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
  smsChannel: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  transactionAlerts: true,
  securityAlerts: true,
  productUpdates: true,
  marketing: false,
  emailChannel: true,
  pushChannel: true,
  smsChannel: false,
};

const STORAGE_KEY = "stellopay-notification-preferences";
const FAIL_NEXT_SAVE_KEY = "stellopay-notification-preferences-fail-next-save";

/**
 * Reads notification preferences from the current mock data source.
 *
 * The localStorage-backed branch keeps the UI functional while the backend API
 * is not wired yet. When `NEXT_PUBLIC_API_BASE_URL` is present, this becomes a
 * fetch-ready adapter without changing component state logic.
 */
export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/notification-preferences`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Unable to load notification preferences");
    }

    return validateNotificationPrefs(await response.json());
  }

  return readStoredPrefs();
}

/**
 * Persists notification preferences through the current data source.
 */
export async function saveNotificationPrefs(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const validatedPreferences = validateNotificationPrefs(preferences);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/notification-preferences`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedPreferences),
    });

    if (!response.ok) {
      throw new Error("Unable to save notification preferences");
    }

    return validateNotificationPrefs(await response.json());
  }

  if (shouldFailNextMockSave()) {
    throw new Error("Unable to save notification preferences");
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedPreferences));
  return validatedPreferences;
}

function readStoredPrefs() {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  try {
    return validateNotificationPrefs(JSON.parse(storedValue));
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

function shouldFailNextMockSave() {
  if (typeof window === "undefined") {
    return false;
  }

  const shouldFail =
    window.localStorage.getItem(FAIL_NEXT_SAVE_KEY) === "true";
  if (shouldFail) {
    window.localStorage.removeItem(FAIL_NEXT_SAVE_KEY);
  }
  return shouldFail;
}

function validateNotificationPrefs(
  value: unknown,
): NotificationPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  const candidate = value as Record<keyof NotificationPreferences, unknown>;
  return {
    transactionAlerts: candidate.transactionAlerts === true,
    securityAlerts: candidate.securityAlerts === true,
    productUpdates: candidate.productUpdates === true,
    marketing: candidate.marketing === true,
    emailChannel: candidate.emailChannel === true,
    pushChannel: candidate.pushChannel === true,
    smsChannel: candidate.smsChannel === true,
  };
}
