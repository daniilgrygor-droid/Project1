import { test, expect } from "@playwright/test";

test.describe("Pricing page", () => {
  test("loads and shows pricing tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".pricing")).toBeVisible();
    await expect(page.locator(".pricing-card")).toHaveCount(2);
  });

  test("shows free tier", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=quiet journal").first()).toBeVisible();
    await expect(page.locator("text=$0").first()).toBeVisible();
  });

  test("shows private tier", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=Private").first()).toBeVisible();
    await expect(page.locator("text=$48").first()).toBeVisible();
  });

  test("shows comparison table", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".compare")).toBeVisible();
    await expect(page.locator("th")).toHaveCount(3);
  });

  test("shows FAQ section", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".pricing-faq")).toBeVisible();
    await expect(page.locator(".pricing-faq-item")).toHaveCount(4);
  });

  test("FAQ items expand on click", async ({ page }) => {
    await page.goto("/pricing");
    const firstFaq = page.locator(".pricing-faq-item summary").first();
    await firstFaq.click();
    await expect(page.locator(".pricing-faq-item p").first()).toBeVisible();
  });

  test("shows guarantee badges", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".pricing-guarantee")).toBeVisible();
    await expect(page.locator(".pricing-guarantee span")).toHaveCount(4);
  });

  test("shows trust notes on cards", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".pricing-card-trust")).toHaveCount(2);
  });
});
