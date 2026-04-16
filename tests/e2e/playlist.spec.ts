import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Playlist", () => {
  test("create playlist via sidebar +", async ({ page }) => {
    await login(page);
    const plusBtn = page.locator('button[title="Create playlist or folder"]');
    await plusBtn.click();
    await expect(page.locator("text=Create a playlist")).toBeVisible();
    await page.locator("text=Playlist").first().click();
    await page.waitForURL(/\/playlist\//, { timeout: 10000 });
  });

  test("navigate to playlist", async ({ page }) => {
    await login(page);
    const playlistLink = page.locator('a[href^="/playlist/"]').first();
    if (await playlistLink.isVisible()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("click name to open edit modal", async ({ page }) => {
    await login(page);
    const playlistLink = page.locator('a[href^="/playlist/"]').first();
    if (await playlistLink.isVisible()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });
      await page.locator("h1").click();
      await expect(page.locator("text=Edit details")).toBeVisible({ timeout: 5000 });
    }
  });
});
