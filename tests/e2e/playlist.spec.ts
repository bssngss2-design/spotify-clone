import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Playlist", () => {
  test.describe.configure({ mode: "serial" });
  test("create playlist via sidebar +", async ({ page }) => {
    test.setTimeout(45_000);
    await login(page);
    const desk = page.getByTestId("sidebar-desktop");
    await desk.getByTestId("sidebar-create-menu").click();
    await expect(desk.getByTestId("sidebar-create-playlist")).toBeVisible();
    await desk.getByTestId("sidebar-create-playlist").click();
    await page.waitForURL(/\/playlist\//, { timeout: 30_000 });
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
