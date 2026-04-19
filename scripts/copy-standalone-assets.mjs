/**
 * Next.js `output: 'standalone'` expects `public` and `.next/static` beside the server.
 * @see https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
 */
import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const standalone = join(root, ".next", "standalone", "server.js");

if (!existsSync(standalone)) {
  console.warn(
    "[copy-standalone] skipped — no .next/standalone/server.js (build with output: standalone first).",
  );
  process.exit(0);
}

const standaloneRoot = join(root, ".next", "standalone");
const pub = join(root, "public");
const staticDir = join(root, ".next", "static");

if (existsSync(pub)) {
  cpSync(pub, join(standaloneRoot, "public"), { recursive: true });
}
if (existsSync(staticDir)) {
  mkdirSync(join(standaloneRoot, ".next"), { recursive: true });
  cpSync(staticDir, join(standaloneRoot, ".next", "static"), { recursive: true });
}
console.log("[copy-standalone] copied public + .next/static → .next/standalone");
