import { expect, test } from "@playwright/test";

/**
 * Smoke test for the App-Router landing route.
 *
 * After removing the legacy Pages Router (#290), `/` is served entirely by
 * `app/page.tsx`, which renders the landing composition from
 * `components/landing/landing-page.tsx`. This test guards that the hero still
 * renders at `/` without runtime errors.
 *
 * Selectors are intentionally structural (the labelled hero landmark and its
 * level-1 heading) rather than tied to marketing copy, so wording changes do
 * not make the test brittle.
 */
test.describe("Landing — App Router", () => {
  test("/ renders the hero without page errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");

    // The hero is a labelled landmark: <section aria-label="Hero — …"> ⇒ role=region.
    const hero = page.getByRole("region", { name: /hero/i });
    await expect(hero).toBeVisible();

    // The hero owns the page's primary (h1) heading.
    await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
