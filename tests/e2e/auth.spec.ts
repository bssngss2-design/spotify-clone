import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Log in to Spotify");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@spotify.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page).toHaveURL("/");
  });

  test("login with bad credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@spotify.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 5000 });
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText("Sign up for Spotify");
  });
});
