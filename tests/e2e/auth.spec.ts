import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test.describe("Auth", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Log in to Spotify");
    await expect(page.getByTestId("login-email")).toBeVisible();
    await expect(page.getByTestId("login-password")).toBeVisible();
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill(DEMO_EMAIL);
    await page.getByTestId("login-password").fill(DEMO_PASSWORD);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("/", { timeout: 15000 });
    await expect(page).toHaveURL("/");
  });

  test("login with bad credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill(DEMO_EMAIL);
    await page.getByTestId("login-password").fill("definitely-not-the-password");
    await page.getByTestId("login-submit").click();
    await expect(page.locator("text=/invalid credentials/i")).toBeVisible({ timeout: 8000 });
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /sign up for spotify/i })).toBeVisible();
  });
});
