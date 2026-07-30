import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";



const TAB_LIMIT = 30;

const RATE_LIMIT_MS = 3100;

async function tab(page: Page) {
  await page.keyboard.press("Tab");
}

async function shiftTab(page: Page) {
  await page.keyboard.press("Shift+Tab");
}

async function focusedLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "none";
    const tag = el.tagName.toLowerCase();
    const aria = el.getAttribute("aria-label") ?? "";
    const text = (el as HTMLElement).innerText?.slice(0, 40) ?? "";
    const placeholder = (el as HTMLInputElement).placeholder ?? "";
    const name = aria || text || placeholder || "";
    return `${tag}${name ? ` "${name}"` : ""}`;
  });
}

async function submitAfterGuard(page: Page) {
  await page.waitForTimeout(RATE_LIMIT_MS);
  await page.keyboard.press("Enter");
}

async function fillFormKeyboard(page: Page) {
  await page.getByLabel(/full name/i).focus();
  await page.keyboard.type("Jane Doe");
  await tab(page);
  await page.keyboard.type("success@example.com");
  await tab(page);
  await page.keyboard.type("StrongPass1!");
  await tab(page);
  await tab(page);
  await page.keyboard.type("StrongPass1!");
  await tab(page);
  await tab(page);
  await page.keyboard.press("Space");
  await tab(page);
  await tab(page);
  await tab(page);
}

test.describe("Sign-up form \u2013 keyboard navigation", () => {
  test("every interactive element is reachable via Tab", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const visited: string[] = [];

    for (let i = 0; i < TAB_LIMIT; i++) {
      await tab(page);
      visited.push(await focusedLabel(page));
    }

    const joined = visited.join(" ");
    expect(joined).toMatch(/name/i);
    expect(joined).toMatch(/email/i);
    expect(joined).toMatch(/password/i);
    expect(joined).toMatch(/confirm/i);
    expect(joined).toMatch(/agree|terms/i);
    expect(joined).toMatch(/create account/i);
  });

  test("Shift+Tab navigates backwards through the form", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.getByRole("button", { name: /create account/i }).focus();
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeFocused();

    const backwardLabels: string[] = [];
    for (let i = 0; i < 8; i++) {
      await shiftTab(page);
      backwardLabels.push(await focusedLabel(page));
    }
    const joined = backwardLabels.join(" ");
    expect(joined).toMatch(/agree|terms|checkbox/i);
    expect(joined).toMatch(/confirm/i);
  });

  test("focus never becomes trapped", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.keyboard.press("Tab");

    let lastFocused = await focusedLabel(page);
    let stableCount = 0;

    for (let tabStops = 1; tabStops < 50; tabStops++) {
      await tab(page);
      const current = await focusedLabel(page);

      if (current === lastFocused) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      lastFocused = current;

      if (stableCount >= 3) break;
    }

    expect(stableCount).toBeLessThan(3);
  });
});

test.describe("Sign-up form \u2013 password visibility toggle (keyboard)", () => {
  test("password toggle is reachable and activatable with Enter", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    const passwordInput = page
      .locator('input[autocomplete="new-password"]')
      .first();
    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();

    await tab(page);

    const focused = await focusedLabel(page);
    expect(focused).toMatch(/show password/i);

    await page.keyboard.press("Enter");
    await expect(passwordInput).toHaveAttribute("type", "text");

    const toggleAfterShow = page.locator('button[aria-label="Hide password"]');
    await expect(toggleAfterShow).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Enter");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleAfterHide = page
      .locator('button[aria-label="Show password"]')
      .first();
    await expect(toggleAfterHide).toHaveAttribute("aria-pressed", "false");
  });

  test("password toggle is activatable with Space", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const passwordInput = page
      .locator('input[autocomplete="new-password"]')
      .first();
    await passwordInput.focus();
    await tab(page);

    await page.keyboard.press("Space");
    await expect(passwordInput).toHaveAttribute("type", "text");

    const toggleShown = page.locator('button[aria-label="Hide password"]');
    await expect(toggleShown).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Space");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleHidden = page
      .locator('button[aria-label="Show password"]')
      .first();
    await expect(toggleHidden).toHaveAttribute("aria-pressed", "false");
  });

  test("confirm-password toggle works with keyboard", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const confirmInput = page
      .locator('input[autocomplete="new-password"]')
      .last();
    await confirmInput.focus();
    await tab(page);

    const focused = await focusedLabel(page);
    expect(focused).toMatch(/show password/i);

    await page.keyboard.press("Space");
    await expect(confirmInput).toHaveAttribute("type", "text");

    const toggles = page.getByRole("button", {
      name: /(show|hide) password/i,
    });
    await expect(toggles.last()).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Space");
    await expect(confirmInput).toHaveAttribute("type", "password");
  });
});

test.describe("Sign-up form \u2013 full keyboard completion", () => {
  test("can complete entire form and submit with keyboard only", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    await fillFormKeyboard(page);
    await submitAfterGuard(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible();
    await expect(dialog).toContainText("success@example.com");
  });

  test("submit button is activatable with Space", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await fillFormKeyboard(page);
    await page.waitForTimeout(RATE_LIMIT_MS);
    await page.keyboard.press("Space");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });
});

test.describe("Sign-up form \u2013 keyboard validation & errors", () => {
  test("empty submission triggers validation errors", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.getByRole("button", { name: /create account/i }).focus();
    await page.keyboard.press("Enter");

    await expect(
      page.getByText(/full name must be at least 2 characters/i),
    ).toBeVisible();
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    await expect(
      page.getByText(/password must be at least 8 characters/i),
    ).toBeVisible();
  });

  test("mismatched passwords show error via keyboard-only interaction", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel(/full name/i).focus();
    await page.keyboard.type("Jane Doe");
    await tab(page);
    await page.keyboard.type("test@example.com");
    await tab(page);
    await page.keyboard.type("StrongPass1!");
    await tab(page);
    await tab(page);
    await page.keyboard.type("DifferentPass2@");
    await tab(page);
    await tab(page);
    await page.keyboard.press("Space");
    await tab(page);
    await tab(page);
    await tab(page);

    await submitAfterGuard(page);

    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("terms checkbox required error via keyboard", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel(/full name/i).focus();
    await page.keyboard.type("Jane Doe");
    await tab(page);
    await page.keyboard.type("test@example.com");
    await tab(page);
    await page.keyboard.type("StrongPass1!");
    await tab(page);
    await tab(page);
    await page.keyboard.type("StrongPass1!");
    await tab(page);
    await tab(page);
    await tab(page);
    await tab(page);
    await tab(page);

    await submitAfterGuard(page);

    await expect(page.getByText(/you must agree to the terms/i)).toBeVisible();
  });

  test("error messages are visible and form remains operable after validation failure", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    await page.getByRole("button", { name: /create account/i }).focus();
    await page.keyboard.press("Enter");

    const nameError = page.getByText(/full name must be at least 2/i);
    await expect(nameError).toBeVisible();

    await page.getByLabel(/full name/i).focus();
    await expect(page.getByLabel(/full name/i)).toBeFocused();
  });
});

test.describe("Sign-up form \u2013 keyboard edge cases", () => {
  test("long input values are handled via keyboard", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const longName = "A".repeat(200);
    await page.getByLabel(/full name/i).focus();
    await page.keyboard.type(longName);

    await expect(page.getByLabel(/full name/i)).toHaveValue(longName);

    await tab(page);
    await expect(page.getByLabel(/email address/i)).toBeFocused();
  });

  test("honeypot field is not focusable via keyboard", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const honeypot = page.locator("#honeypot-field");
    await expect(honeypot).toHaveAttribute("tabIndex", "-1");

    for (let i = 0; i < TAB_LIMIT; i++) {
      await tab(page);
      const label = await focusedLabel(page);
      expect(label).not.toMatch(/website/i);
    }
  });

  test("password requirements region is announced via keyboard interaction", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel(/^password$/i).focus();
    await page.keyboard.type("a");

    const reqBox = page.getByRole("region", {
      name: /password requirements/i,
    });
    await expect(reqBox).toBeVisible();
    await expect(reqBox).toHaveAttribute("aria-live", "polite");
  });
});

const BREAKPOINTS = [
  { name: "sm", width: 640, height: 900 },
  { name: "md", width: 768, height: 1024 },
  { name: "lg", width: 1024, height: 768 },
  { name: "xl", width: 1280, height: 800 },
] as const;

test.describe("Sign-up form \u2013 keyboard at responsive breakpoints", () => {
  for (const bp of BREAKPOINTS) {
    test(`full keyboard completion at ${bp.name} (${bp.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/auth/sign-up");

      await expect(
        page.getByRole("button", { name: /create account/i }),
      ).toBeVisible();

      await fillFormKeyboard(page);
      await submitAfterGuard(page);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("heading", { name: /check your email/i }),
      ).toBeVisible();
    });
  }
});

test.describe("Sign-up form \u2013 keyboard in dark mode", () => {
  test("full keyboard completion in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark");
    });
    await page.goto("/auth/sign-up");

    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    await fillFormKeyboard(page);
    await submitAfterGuard(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("password toggle in dark mode via keyboard", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark");
    });
    await page.goto("/auth/sign-up");

    const passwordInput = page
      .locator('input[autocomplete="new-password"]')
      .first();
    await passwordInput.focus();
    await tab(page);

    await page.keyboard.press("Space");
    await expect(passwordInput).toHaveAttribute("type", "text");

    const toggle = page.locator('button[aria-label="Hide password"]');
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Space");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});

test.describe("Sign-up form \u2013 accessibility gate", () => {
  test("sign-up page passes WCAG 2.1 AA keyboard and ARIA checks", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel(/^password$/i).focus();
    await page.keyboard.type("TestPass1!");

    await expectNoSeriousA11yViolations(page);
  });

  test("keyboard focus order follows a logical visual flow", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    const order: string[] = [];
    for (let i = 0; i < TAB_LIMIT; i++) {
      await tab(page);
      order.push(await focusedLabel(page));
    }

    const nameIdx = order.findIndex((s) => /name/i.test(s));
    const emailIdx = order.findIndex(
      (s) => /email/i.test(s) && !/name/i.test(s),
    );
    const passwordIdx = order.findIndex(
      (s) => /password/i.test(s) && !/confirm/i.test(s),
    );
    const confirmIdx = order.findIndex((s) => /confirm/i.test(s));
    const checkboxIdx = order.findIndex((s) => /agree|terms/i.test(s));
    const submitIdx = order.findIndex((s) => /create account/i.test(s));

    expect(nameIdx).toBeGreaterThan(-1);
    expect(emailIdx).toBeGreaterThan(nameIdx);
    expect(passwordIdx).toBeGreaterThan(emailIdx);
    expect(confirmIdx).toBeGreaterThan(passwordIdx);
    expect(checkboxIdx).toBeGreaterThan(confirmIdx);
    expect(submitIdx).toBeGreaterThan(checkboxIdx);
  });
});
