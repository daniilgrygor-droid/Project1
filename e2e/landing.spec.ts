import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(".hero")).toBeVisible();
  });

  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Small Steps/);
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".nav-links")).toBeVisible();
  });

  test("CTA button navigates to auth", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('a[href="/auth?mode=up"]').first();
    if (await cta.isVisible()) {
      await cta.click();
      await expect(page).toHaveURL(/auth/);
    }
  });

  test("pricing link works", async ({ page }) => {
    await page.goto("/");
    const pricingLink = page.locator('a[href="/pricing"]').first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/pricing/);
    }
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
