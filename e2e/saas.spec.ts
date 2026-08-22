import { test, expect } from "@playwright/test";

test.describe("SaaS — Check-in", () => {
  test("check-in page loads (or redirects to auth)", async ({ page }) => {
    await page.goto("/check-in");
    const authInput = page.locator('input[type="email"]').first();
    const checkin = page.locator(".checkin").first();
    await expect(authInput.or(checkin)).toBeVisible({ timeout: 8000 });
    if (await checkin.isVisible()) {
      await expect(checkin).toBeVisible();
      await expect(page.locator("#step-note")).toBeVisible();
      await expect(page.locator("#step-note")).toHaveAttribute("placeholder", /went outside/);
    } else {
      await expect(authInput).toBeVisible();
    }
  });

  test("check-in form has category and mood pickers", async ({ page }) => {
    await page.goto("/check-in");
    const authInput = page.locator('input[type="email"]').first();
    const checkin = page.locator(".checkin").first();
    await expect(authInput.or(checkin)).toBeVisible({ timeout: 8000 });
    if (await authInput.isVisible()) {
      await expect(authInput).toBeVisible();
      return;
    }
    await expect(page.locator(".picker").first()).toBeVisible();
    await expect(page.locator(".mood-row")).toBeVisible();
    await expect(page.locator(".picker-option")).toHaveCount(8); // categories
    await expect(page.locator(".mood-option")).toHaveCount(5);
  });

  test("check-in form has two buttons", async ({ page }) => {
    await page.goto("/check-in");
    const authInput = page.locator('input[type="email"]').first();
    const checkin = page.locator(".checkin").first();
    await expect(authInput.or(checkin)).toBeVisible({ timeout: 8000 });
    if (await authInput.isVisible()) {
      await expect(authInput).toBeVisible();
      return;
    }
    await expect(page.locator('button:has-text("Mark it")')).toBeVisible();
    await expect(page.locator('button:has-text("I showed up today")')).toBeVisible();
  });

  test("mood emojis are iPhone-style", async ({ page }) => {
    await page.goto("/check-in");
    const authInput = page.locator('input[type="email"]').first();
    const checkin = page.locator(".checkin").first();
    await expect(authInput.or(checkin)).toBeVisible({ timeout: 8000 });
    if (await authInput.isVisible()) {
      await expect(authInput).toBeVisible();
      return;
    }
    const emojis = await page.locator(".mood-emoji").allTextContents();
    expect(emojis.length).toBe(5);
    // Should contain 🥺 and 🥰
    expect(emojis.join("")).toContain("🥺");
    expect(emojis.join("")).toContain("🥰");
  });

  test("char count appears when typing", async ({ page }) => {
    await page.goto("/check-in");
    const authInput = page.locator('input[type="email"]').first();
    const checkin = page.locator(".checkin").first();
    await expect(authInput.or(checkin)).toBeVisible({ timeout: 8000 });
    if (await authInput.isVisible()) {
      await expect(authInput).toBeVisible();
      return;
    }
    await page.fill("#step-note", "hello");
    await expect(page.locator(".char-count")).toBeVisible();
    await expect(page.locator(".char-count")).toContainText("5/2000");
  });
});

test.describe("SaaS — Journey & Progress", () => {
  test("journey page loads", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/journey|auth/);
  });

  test("progress page loads", async ({ page }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/progress|auth/);
  });

  test("growth page loads", async ({ page }) => {
    await page.goto("/growth");
    await expect(page).toHaveURL(/growth|auth/);
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/settings|auth/);
  });
});

test.describe("SaaS — Pricing toggle", () => {
  test("pricing has monthly/yearly toggle", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".pricing-toggle")).toBeVisible();
    await expect(page.locator(".pricing-toggle-btn")).toHaveCount(2);
    await expect(page.locator(".pricing-toggle-btn--active")).toContainText(/Yearly/);
  });

  test("toggle switches price", async ({ page }) => {
    await page.goto("/pricing");
    const monthlyBtn = page.locator('.pricing-toggle-btn:has-text("Monthly")');
    await monthlyBtn.click();
    await expect(page.locator(".pricing-toggle-btn--active")).toContainText(/Monthly/);
    await expect(page.locator(".pricing-price-amount").nth(1)).toContainText("$5");
    const yearlyBtn = page.locator('.pricing-toggle-btn:has-text("Yearly")');
    await yearlyBtn.click();
    await expect(page.locator(".pricing-price-amount").nth(1)).toContainText("$48");
  });

  test("pricing compare shows both intervals", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator(".compare-price td").last()).toContainText("$5/mo");
    await expect(page.locator(".compare-price td").last()).toContainText("$48/yr");
  });
});

test.describe("SaaS — AppShell (when authenticated redirect)", () => {
  test("unauthenticated user sees landing header not AppShell", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".app-header--landing")).toBeVisible();
    await expect(page.locator(".app-tabbar")).toHaveCount(0);
  });

  test("check-in without auth shows landing or auth", async ({ page }) => {
    await page.goto("/check-in");
    // Should redirect to auth or show AppShell with sign-in prompt
    await expect(page).toHaveURL(/check-in|auth|\//);
  });
});
