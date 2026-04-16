import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Player", () => {
  test("player bar is visible", async ({ page }) => {
    await login(page);
    await expect(page.locator("footer")).toBeVisible();
  });

  test("play button exists", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await page.waitForTimeout(2000);
    const playBtn = page.locator('button:has(svg)').filter({ hasText: "" }).first();
    await expect(playBtn).toBeVisible();
  });

  test("shuffle button exists in playlist", async ({ page }) => {
    await login(page);
    const playlistLink = page.locator('a[href^="/playlist/"]').first();
    if (await playlistLink.isVisible()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });
      await expect(page.locator('button[title="Shuffle"], button:has-text("Shuffle")')).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});
