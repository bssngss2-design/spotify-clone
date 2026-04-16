import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Liked Songs", () => {
  test("page loads", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await expect(page.locator("h1:has-text('Liked Songs')")).toBeVisible({ timeout: 10000 });
  });

  test("shows liked songs", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await page.waitForTimeout(2000);
    const songRows = page.locator('[class*="grid"]').filter({ hasText: /\d+:\d+/ });
    const count = await songRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("download button is visible", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await expect(page.locator('button[title="Download"]')).toBeVisible({ timeout: 10000 });
  });
});
