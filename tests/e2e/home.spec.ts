import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Home", () => {
  test("renders playlists after login", async ({ page }) => {
    await login(page);
    await expect(page.locator("text=Liked Songs")).toBeVisible({ timeout: 10000 });
  });

  test("filter chips are visible", async ({ page }) => {
    await login(page);
    await expect(page.locator("button:has-text('All')")).toBeVisible();
    await expect(page.locator("button:has-text('Music')")).toBeVisible();
    await expect(page.locator("button:has-text('Podcasts')")).toBeVisible();
  });

  test("filter chips are clickable", async ({ page }) => {
    await login(page);
    const musicChip = page.locator("button:has-text('Music')");
    await musicChip.click();
    await expect(musicChip).toHaveClass(/bg-white/);
  });
});
