import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@spotify.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Queue", () => {
  test("queue button exists in player bar", async ({ page }) => {
    await login(page);
    await expect(page.locator('button[title="Queue"]')).toBeVisible();
  });

  test("open queue panel", async ({ page }) => {
    await login(page);
    await page.locator('button[title="Queue"]').click();
    await expect(page.locator("text=Queue")).toBeVisible({ timeout: 5000 });
  });
});
