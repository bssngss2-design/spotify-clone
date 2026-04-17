import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Home", () => {
  test("renders playlists after login", async ({ page }) => {
    await login(page);
    await expect(visible(page, "text=Liked Songs")).toBeVisible({ timeout: 15000 });
  });

  test("filter chips are visible", async ({ page }) => {
    await login(page);
    await expect(visible(page, "button:has-text('All')")).toBeVisible();
    await expect(visible(page, "button:has-text('Music')")).toBeVisible();
    await expect(visible(page, "button:has-text('Podcasts')")).toBeVisible();
  });

  test("filter chips are clickable", async ({ page }) => {
    await login(page);
    const musicChip = visible(page, "button:has-text('Music')");
    await musicChip.click();
    await expect(musicChip).toHaveClass(/bg-white/);
  });
});
