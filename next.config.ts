import type { NextConfig } from "next";
import withPWA from "next-pwa";

/** Where FastAPI runs (server-side rewrites only; browser calls same-origin /api/*). */
const backend = (process.env.BACKEND_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning (PWA is disabled in dev anyway)
  turbopack: {},
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
