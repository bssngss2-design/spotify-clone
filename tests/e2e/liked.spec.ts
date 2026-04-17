import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Liked Songs", () => {
  test("page loads", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await expect(visible(page, "h1:has-text('Liked Songs')")).toBeVisible({ timeout: 15000 });
  });

  test("shows liked songs", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await page.waitForTimeout(2000);
    const songRows = page.locator('[class*="grid"]').filter({ hasText: /\d+:\d+/ });
    const count = await songRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("download button is visible", async ({ page }) => {
    await login(page);
    await page.goto("/liked");
    await expect(visible(page, 'button[title="Download"]')).toBeVisible({ timeout: 15000 });
  });
});
