/**
 * Starts FastAPI for Playwright e2e (same port as Next rewrites: 8080).
 * Picks backend/venv/bin/python when present, else python3 / python.
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const backend = path.join(root, "backend");
const win = process.platform === "win32";
const venvPy = win
  ? path.join(backend, "venv", "Scripts", "python.exe")
  : path.join(backend, "venv", "bin", "python");

const cmd = fs.existsSync(venvPy) ? venvPy : win ? "python" : "python3";

const proc = spawn(
  cmd,
  ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8080"],
  {
    cwd: backend,
    stdio: "inherit",
    env: { ...process.env, PYTHONPATH: backend },
  },
);

proc.on("exit", (code) => process.exit(code ?? 0));

function shutdown() {
  if (proc && !proc.killed) proc.kill("SIGTERM");
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
