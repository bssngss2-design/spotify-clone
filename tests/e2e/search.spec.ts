import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Search", () => {
  test("search bar is visible", async ({ page }) => {
    await login(page);
    await expect(page.locator('input[placeholder="What do you want to play?"]')).toBeVisible();
  });

  test("type query and navigate to search page", async ({ page }) => {
    await login(page);
    await page.fill('input[placeholder="What do you want to play?"]', "love");
    await page.waitForURL(/\/search\?q=love/, { timeout: 10000 });
    await expect(page.locator("text=Your Library")).toBeVisible();
  });
});
