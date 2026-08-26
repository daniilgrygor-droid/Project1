import { test, expect } from "@playwright/test";

test.describe("SEO and metadata", () => {
  test("has meta description", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toBeAttached();
    const content = await meta.getAttribute("content");
    expect(content?.length).toBeGreaterThan(0);
  });

  test("has Open Graph tags", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:title"]')).toBeAttached();
    await expect(page.locator('meta[property="og:description"]')).toBeAttached();
  });

  test("has canonical URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toBeAttached();
  });

  test("has JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd.first()).toBeAttached();
    const all = await jsonLd.allTextContents();
    expect(all.join("\n")).toContain("WebApplication");
  });

  test("emits FAQPage structured data", async ({ page }) => {
    await page.goto("/");
    const faqLd = page.locator('script[type="application/ld+json"]');
    await expect(faqLd).toHaveCount(2);
    const all = await faqLd.allTextContents();
    expect(all.join("\n")).toContain("FAQPage");
  });

  test("has viewport meta tag", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="viewport"]')).toBeAttached();
  });

  test("has favicon", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="icon"]').first()).toBeAttached();
  });
});
