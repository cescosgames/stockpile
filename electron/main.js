import { app, BrowserWindow, ipcMain, Menu, session } from "electron";
import Store from "electron-store";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const store = new Store();

// app.isPackaged is false during development (running `electron .`)
// and true once the app has been built and packaged by electron-builder
const isDev = !app.isPackaged;

// Minimal menu — keeps system-level Edit commands (Cut/Copy/Paste/Select All)
// which are required for text inputs to work on macOS, but strips out all the
// Electron dev defaults (Reload, Toggle DevTools, etc.)
function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Stockpile",
    // macOS uses the PNG; Windows uses the ICO (electron-builder handles this
    // at package time, but setting it here covers the dev window too)
    icon: path.join(__dirname, "../public/pwa-512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    // Open DevTools automatically in dev so you can inspect/debug without
    // hunting through menus — closed in production builds
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  // Set Content-Security-Policy on all responses.
  // Dev allows unsafe-eval (required by Vite HMR/sourcemaps) and localhost
  // connections. Production is strict — no eval, no external origins.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? [
          "default-src 'self' http://localhost:5173",
          "script-src 'self' 'unsafe-eval' http://localhost:5173",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self' ws://localhost:5173 http://localhost:5173",
        ].join("; ")
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self'",
        ].join("; ");
    callback({
      responseHeaders: { ...details.responseHeaders, "Content-Security-Policy": [csp] },
    });
  });

  if (process.platform === "darwin") {
    app.dock.setIcon(path.join(__dirname, "../public/pwa-512.png"));
  }
  buildMenu();
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("store:get", (_event, key) => store.get(key));
ipcMain.handle("store:set", (_event, key, value) => store.set(key, value));
