import { test, expect } from "@playwright/test";

/** Direct to FastAPI (same as Next rewrites target in dev). */
const API = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:8080";

test.describe("Tool server (/step contract)", () => {
  test("GET /health returns healthy", async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { status?: string };
    expect(j.status).toBe("healthy");
  });

  test("GET /tools lists tool descriptors", async ({ request }) => {
    const res = await request.get(`${API}/tools`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { tools: { name: string }[] };
    const names = body.tools.map((t) => t.name);
    expect(names).toContain("login");
    expect(names).toContain("create_playlist");
    expect(names).toContain("search_songs");
  });

  test("POST /step search_songs returns observation", async ({ request }) => {
    const res = await request.post(`${API}/step`, {
      data: {
        action: {
          tool_name: "search_songs",
          parameters: { query: "a", limit: 2 },
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      observation: { is_error: boolean; structured_content?: { count?: number } };
    };
    expect(body.observation.is_error).toBe(false);
    expect(body.observation.structured_content?.count).toBeDefined();
  });
});

test.describe("data-testid — logged-in shell", () => {
  test("top bar search and browse after cookie login", async ({ page }) => {
    const r = await page.request.post("/api/auth/login", {
      data: { email: process.env.DEMO_EMAIL ?? "demo@demo.com", password: process.env.DEMO_PASSWORD ?? "demo123" },
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok()) test.skip();
    const { access_token } = (await r.json()) as { access_token: string };
    await page.context().addCookies([
      { name: "spotify_token", value: access_token, domain: "localhost", path: "/", sameSite: "Lax", httpOnly: false, secure: false },
    ]);
    await page.goto("/");
    await expect(page.getByTestId("topbar-search")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("topbar-home")).toBeVisible();
    await expect(page.getByTestId("topbar-browse")).toBeVisible();
  });
});
