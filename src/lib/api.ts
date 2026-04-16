/**
 * Empty string = same-origin (Next rewrites `/api` → BACKEND_URL). Set `NEXT_PUBLIC_API_URL`
 * only if the browser must call another host (no proxy).
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("spotify_token");
}

function setToken(token: string) {
  localStorage.setItem("spotify_token", token);
  document.cookie = `spotify_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

function clearToken() {
  localStorage.removeItem("spotify_token");
  document.cookie = "spotify_token=; path=/; max-age=0";
}

const AUTH_NO_BEARER = new Set(["/api/auth/login", "/api/auth/register"]);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token && !AUTH_NO_BEARER.has(path)) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const errBody = await res.json().catch(() => null);
    const detail =
      errBody && typeof errBody === "object" && "detail" in errBody
        ? (errBody as { detail: unknown }).detail
        : null;
    const detailMsg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ")
          : null;

    const isCredentialLogin = path === "/api/auth/login" || path === "/api/auth/register";

    if (isCredentialLogin) {
      clearToken();
      throw new Error(detailMsg || "Invalid credentials");
    }

    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error(detailMsg || "Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ")
        : res.statusText;
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),

  setToken,
  getToken,
  clearToken,
};

export type { Song, Playlist, PlaylistSong, LikedSong } from "./supabase";
