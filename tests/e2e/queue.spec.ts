import { test, expect } from "@playwright/test";
import { login, visible, playAnySong } from "./helpers";

test.describe("Queue", () => {
  test("queue button exists after starting playback", async ({ page }) => {
    await login(page);
    await playAnySong(page);
    await expect(visible(page, 'button[title="Queue"]')).toBeVisible({ timeout: 10000 });
  });

  test("open queue panel", async ({ page }) => {
    await login(page);
    await playAnySong(page);
    await visible(page, 'button[title="Queue"]').click();
    await expect(visible(page, "text=Queue")).toBeVisible({ timeout: 5000 });
  });
});
