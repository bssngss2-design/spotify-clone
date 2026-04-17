import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Sidebar", () => {
  test("sidebar shows Your Library", async ({ page }) => {
    await login(page);
    await expect(visible(page, "text=Your Library")).toBeVisible();
  });

  test("sidebar shows Liked Songs", async ({ page }) => {
    await login(page);
    await expect(visible(page, "text=Liked Songs")).toBeVisible();
  });

  test("right-click on playlist shows context menu", async ({ page }) => {
    await login(page);
    const playlistLink = visible(page, 'a[href^="/playlist/"]');
    if (await playlistLink.count()) {
      await playlistLink.click({ button: "right" });
      await expect(visible(page, "text=Add to queue")).toBeVisible({ timeout: 5000 });
      await expect(visible(page, "text=Delete")).toBeVisible();
    }
  });

  test("collapse and expand sidebar", async ({ page }) => {
    await login(page);
    const collapseBtn = visible(page, 'button[title="Show more"]');
    if (await collapseBtn.count()) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      await expect(visible(page, 'button[title="Expand Your Library"]')).toBeVisible({ timeout: 3000 });
    }
  });
});
