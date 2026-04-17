import type { Page, Locator } from "@playwright/test";

export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@demo.com";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo123";

export async function login(page: Page) {
  // Grab a token directly from the API and seed the cookie the Next middleware reads
  // + the localStorage the api wrapper reads. Doing it before any navigation avoids
  // the race where the UI's router.push("/") raced ahead of the cookie propagation.
  const response = await page.request.post("/api/auth/login", {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok()) {
    throw new Error(`Demo login failed (${response.status()}): seed the demo user first`);
  }
  const { access_token } = (await response.json()) as { access_token: string };

  await page.context().addCookies([
    {
      name: "spotify_token",
      value: access_token,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
      httpOnly: false,
      secure: false,
    },
  ]);

  await page.addInitScript((token) => {
    try {
      window.localStorage.setItem("spotify_token", token);
    } catch {
      // localStorage may be locked down on some about: pages -- safe to ignore
    }
  }, access_token);

  await page.goto("/");
}

/** Full UI login flow -- kept for the auth.spec.ts that exercises the form itself. */
export async function uiLogin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 20000 });
}

/**
 * MainLayout renders the sidebar twice (mobile drawer off-screen + desktop). `.first()`
 * tends to grab the hidden mobile one, so tests always need the visible copy.
 */
export function visible(page: Page, selector: string): Locator {
  return page.locator(selector).filter({ visible: true }).first();
}

/** Play the first song we can click so the player bar has a currentSong. */
export async function playAnySong(page: Page) {
  await page.goto("/liked");
  const playButton = visible(page, 'button[title="Play"]');
  if (await playButton.count()) {
    await playButton.first().click().catch(() => {});
    return;
  }
  await page.locator('[class*="grid"]').filter({ hasText: /\d+:\d+/ }).first().dblclick().catch(() => {});
}
