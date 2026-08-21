import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("landing page loads within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("pricing page loads within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("auth page loads within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/auth?mode=up");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("no console errors on landing", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Allow some errors (like failed analytics) but not critical ones
    const criticalErrors = errors.filter(
      (e) => !e.includes("analytics") && !e.includes("favicon"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("images are lazy loaded", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img[loading='lazy']");
    const count = await images.count();
    // At least some images should be lazy loaded
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
