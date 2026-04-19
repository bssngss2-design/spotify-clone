/**
 * Spotify clone — Electron shell.
 *
 * Development: `npm run desktop-dev` (Next dev on :3000, this window only loads the URL).
 * Production: `npm run desktop` bundles `.next/standalone` and starts it with
 * `ELECTRON_RUN_AS_NODE=1` so the Electron binary acts as Node (no system `node` on PATH).
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");

const PORT = Number(process.env.PORT || 3000);
const isDev = process.env.ELECTRON_DEV === "1";
const START_URL = process.env.ELECTRON_START_URL || `http://127.0.0.1:${PORT}`;

let mainWindow;
let serverProcess;

function waitForPort(host, port, timeoutMs = 90_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function tryOnce() {
      const socket = net.connect(port, host, () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`timeout waiting for ${host}:${port}`));
        } else {
          setTimeout(tryOnce, 250);
        }
      });
    }
    tryOnce();
  });
}

function standaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone");
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function startNextStandalone() {
  const dir = standaloneDir();
  const serverJs = path.join(dir, "server.js");
  if (!fs.existsSync(serverJs)) {
    return Promise.reject(new Error(`Missing ${serverJs} — run npm run build && node scripts/copy-standalone-assets.mjs`));
  }

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
  };

  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: dir,
    env,
    stdio: "inherit",
  });

  serverProcess.on("error", (err) => {
    console.error("[electron] failed to spawn Next server:", err);
  });

  return waitForPort("127.0.0.1", PORT);
}

async function createWindow() {
  if (!isDev) {
    try {
      await startNextStandalone();
    } catch (e) {
      console.error("[electron]", e);
      // Still open window so the user sees the connection error instead of a blank quit.
    }
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
    backgroundColor: "#121212",
  });

  await mainWindow.loadURL(START_URL);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
