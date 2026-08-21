import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  test("landing page looks good on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(".app-header")).toBeVisible();
  });

  test("landing page looks good on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("landing page looks good on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("pricing page responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");
    await expect(page.locator(".pricing")).toBeVisible();
    await expect(page.locator(".pricing-card")).toHaveCount(2);
  });

  test("auth page responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth?mode=up");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
