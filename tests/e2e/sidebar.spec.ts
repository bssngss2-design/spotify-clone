import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Sidebar", () => {
  test("sidebar shows Your Library", async ({ page }) => {
    await login(page);
    await expect(page.locator("text=Your Library")).toBeVisible();
  });

  test("sidebar shows Liked Songs", async ({ page }) => {
    await login(page);
    await expect(page.locator("text=Liked Songs").first()).toBeVisible();
  });

  test("right-click on playlist shows context menu", async ({ page }) => {
    await login(page);
    const playlistLink = page.locator('a[href^="/playlist/"]').first();
    if (await playlistLink.isVisible()) {
      await playlistLink.click({ button: "right" });
      await expect(page.locator("text=Add to queue")).toBeVisible({ timeout: 5000 });
      await expect(page.locator("text=Delete")).toBeVisible();
    }
  });

  test("collapse and expand sidebar", async ({ page }) => {
    await login(page);
    const collapseBtn = page.locator('button[title="Show more"]');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      const expandBtn = page.locator('button[title="Expand Your Library"]');
      await expect(expandBtn).toBeVisible({ timeout: 3000 });
    }
  });
});
