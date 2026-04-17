import { test, expect } from "@playwright/test";
import { login, visible } from "./helpers";

test.describe("Search", () => {
  test("search bar is visible", async ({ page }) => {
    await login(page);
    await expect(visible(page, 'input[placeholder="What do you want to play?"]')).toBeVisible();
  });

  test("type query and navigate to search page", async ({ page }) => {
    await login(page);
    await visible(page, 'input[placeholder="What do you want to play?"]').fill("library");
    await page.waitForURL(/\/search\?q=/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/search\?q=library/);
  });

  test("browse all tiles render", async ({ page }) => {
    await login(page);
    await page.goto("/search");
    await expect(visible(page, "text=Browse all")).toBeVisible({ timeout: 15000 });
    await expect(visible(page, "text=Pop")).toBeVisible();
  });
});
