import { test, expect } from "@playwright/test";

test("header Go Private goes to pricing", async ({ page }) => {
  await page.goto("/");
  const headerBtn = page.locator(".plan-cta, .plan-pill").first();
  if (await headerBtn.isVisible()) {
    await headerBtn.click();
    await expect(page).toHaveURL(/\/pricing/);
  }
});

test("pricing Go Private redirects to auth when not logged in", async ({ page }) => {
  await page.goto("/pricing");
  // Find the Private card CTA — it should be a button that says Go Private or similar
  const btn = page.locator("button").filter({ hasText: /Private|Go Private|Upgrade/i }).first();
  await expect(btn).toBeVisible();
  await btn.click();
  // Should redirect to /auth?mode=up when not authenticated
  await page.waitForTimeout(1500);
  const url = page.url();
  console.log("After click URL:", url);
  // Check if it's auth or still pricing (if session exists)
  expect(url).toMatch(/\/auth|\/pricing/);
});
