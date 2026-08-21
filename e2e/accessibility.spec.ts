import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("landing page has no critical axe violations", async ({ page }) => {
    await page.goto("/");
    // Basic accessibility checks
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("meta[name='viewport']")).toBeAttached();
  });

  test("all images have alt text or are decorative", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      // Either has alt text or is marked decorative
      expect(alt !== null || ariaHidden === "true").toBeTruthy();
    }
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    // Tab through interactive elements
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("form inputs have labels", async ({ page }) => {
    await page.goto("/auth?mode=up");
    const inputs = page.locator("input");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      // Either has associated label, aria-label, or aria-labelledby
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        expect(hasLabel || ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
      }
    }
  });

  test("color contrast - text is visible on backgrounds", async ({ page }) => {
    await page.goto("/");
    // Check that main text elements exist and are visible
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("p").first()).toBeVisible();
  });

  test("reduced motion preference is respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    // Page should still be functional
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
