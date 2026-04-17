import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Playlist", () => {
  test("create playlist via sidebar +", async ({ page }) => {
    await login(page);
    const plusBtn = visible(page, 'button[title="Create playlist or folder"]');
    await plusBtn.click();
    await expect(visible(page, "text=Create a playlist")).toBeVisible();
    // The dropdown item's subtitle is unique enough; grab its parent button.
    await page
      .locator('button', { hasText: "Create a playlist with songs or episodes" })
      .first()
      .click();
    await page.waitForURL(/\/playlist\//, { timeout: 15000 });
  });

  test("navigate to playlist", async ({ page }) => {
    await login(page);
    const playlistLink = visible(page, 'a[href^="/playlist/"]');
    if (await playlistLink.count()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 15000 });
      await expect(visible(page, "h1")).toBeVisible();
    }
  });

  test("click name to open edit modal", async ({ page }) => {
    await login(page);
    const playlistLink = visible(page, 'a[href^="/playlist/"]');
    if (await playlistLink.count()) {
      await playlistLink.click();
      await page.waitForURL(/\/playlist\//, { timeout: 15000 });
      await visible(page, "h1").click();
      await expect(visible(page, "text=Edit details")).toBeVisible({ timeout: 8000 });
    }
  });
});
