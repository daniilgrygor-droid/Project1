import { test, expect } from "@playwright/test";

test.describe("Auth flows", () => {
  test("sign-up page loads", async ({ page }) => {
    await page.goto("/auth?mode=up");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/auth?mode=in");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("sign-up form has required fields", async ({ page }) => {
    await page.goto("/auth?mode=up");
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("sign-in form has required fields", async ({ page }) => {
    await page.goto("/auth?mode=in");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("toggle between sign-up and sign-in", async ({ page }) => {
    await page.goto("/auth?mode=up");
    const toggleLink = page.locator("text=/Already have|Don't have|Sign in|Sign up/i").first();
    if (await toggleLink.isVisible()) {
      await toggleLink.click();
      await expect(page).toHaveURL(/auth/);
    }
  });
});
