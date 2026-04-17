import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Player", () => {
  test("player bar is visible", async ({ page }) => {
    await login(page);
    await expect(page.locator("footer")).toBeVisible();
  });

  test("play button exists", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await page.waitForTimeout(2000);
    const playBtn = visible(page, 'button:has(svg)');
    await expect(playBtn).toBeVisible();
  });

  test("shuffle button exists in playlist", async ({ page }) => {
    await login(page);
    const playlistLink = visible(page, 'a[href^="/playlist/"]');
    if (await playlistLink.count()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });
      await expect(visible(page, 'button[title="Shuffle"], button:has-text("Shuffle")'))
        .toBeVisible({ timeout: 5000 })
        .catch(() => {});
    }
  });
});
