import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test.describe("Auth", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Log in to Spotify");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });
    await expect(page).toHaveURL("/");
  });

  test("login with bad credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', "definitely-not-the-password");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=/invalid credentials/i")).toBeVisible({ timeout: 8000 });
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /sign up for spotify/i })).toBeVisible();
  });
});
