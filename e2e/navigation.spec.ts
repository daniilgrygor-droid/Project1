import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("can navigate to pricing from landing", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/pricing"]');
    await expect(page).toHaveURL(/pricing/);
  });

  test("can navigate to privacy from landing", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/privacy"]');
    await expect(page).toHaveURL(/privacy/);
  });

  test("can navigate to terms from landing", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/terms"]');
    await expect(page).toHaveURL(/terms/);
  });

  test("can navigate to auth from landing", async ({ page }) => {
    await page.goto("/");
    const authLink = page.locator('a[href*="auth"]').first();
    if (await authLink.isVisible()) {
      await authLink.click();
      await expect(page).toHaveURL(/auth/);
    }
  });

  test("back button works from pricing", async ({ page }) => {
    await page.goto("/pricing");
    await page.click('a[href="/"]');
    await expect(page).toHaveURL("/");
  });
});
