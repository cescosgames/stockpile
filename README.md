# Stockpile: Locally Hosted / Offline Small Farm Management App

An open source, offline-first farm management app for small family farms. Track livestock health, manage feed inventory, and run daily feeding checklists, all from a browser or installed as a PWA on any device.

Built to be simple enough to use in a barn and hackable enough to adapt to your own farm's needs.

---

## Features

- **Animals** — Individual records with health status, sex, birthday (age auto-calculated), notes, health history, and vaccine log. Grouped by type in collapsible sections. Health status changes are logged automatically with optional notes.
- **Feed Inventory** — Track stock in kg or lbs with scoop sizes, low-stock thresholds, and target levels. Stock bars, days-remaining estimates, and inline restocking. Checks for rot/spills reminder.
- **Feeding Checklist** — AM and PM task lists with a Weekly section for recurring chores. Communal tasks or per-animal (e.g. each dairy cow checked individually). Checking a feed task automatically deducts from inventory. Check-all button for per-animal tasks. Resets at midnight in your timezone; weekly tasks reset Monday at midnight.
- **Dashboard** — Stat cards for animal count, low stock, and AM/PM task progress. Animal health summary, feed inventory bars, and a Farm Notes section for freeform dated entries.
- **Settings** — Farm name and timezone. Export/import animal records as JSON for backup. Wipe all data option.
- **Offline-first** — Everything runs locally. No account, no server, no internet required.
- **PWA** — Install to home screen on any device (iOS, Android, desktop).
- **Desktop app** — Installable as a native desktop app via Electron, with data stored in a local JSON file.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (utility classes, custom `@theme`) |
| Date/time | Luxon (timezone-aware) |
| Persistence | localStorage (PWA) / electron-store (desktop) via `useStore` hook |
| PWA | vite-plugin-pwa (Workbox, generateSW) |
| Desktop | Electron + electron-builder |

---

## Roadmap

- [x] React web app — localStorage, single device
- [x] PWA — installable on any device
- [x] Electron wrapper — desktop packaging with `electron-store`
- [ ] PocketBase backend — self-hosted on a Raspberry Pi, real-time sync across all farm devices
- [ ] Multi-device PWA — once PocketBase is live, PWA installs on phones and tablets stay in sync

---

## Getting Started

### Browser / PWA

```bash
git clone https://github.com/your-username/farm-app.git
cd farm-app
npm install
npm run dev
```

Open `http://localhost:5173`. The app seeds with example data on first load.

### Desktop (Electron)

With the Vite dev server already running (`npm run dev`), open a second terminal:

```bash
npm run electron:dev
```

This opens the app in an Electron window. Data is stored separately from the browser version in `~/Library/Application Support/Electron/config.json` (macOS) or `%APPDATA%\Electron\config.json` (Windows) during development.

---

## Building for Production

### PWA

```bash
npm run build
npm run preview
```

The `dist/` folder is a fully self-contained static site — serve it from any web server.

### Desktop (.dmg / installer)

```bash
npm run electron:build
```

Output goes to `dist-electron/`. On macOS this produces a `.dmg` installer. On Windows it produces a `.exe` installer. The packaged app stores data in `~/Library/Application Support/Stockpile/` (macOS) or `%APPDATA%\Stockpile\` (Windows).

> Note: macOS builds are unsigned by default. To distribute publicly, you'll need an Apple Developer certificate and to configure notarization in `electron-builder`.

---

## Architecture

All three clients share the same React source. The only difference between them is the storage backend in `useStore.ts`:

```
PWA:        React → useStore → localStorage
Electron:   React → useStore → window.electronAPI (IPC) → electron-store → config.json
PocketBase: React → useStore → PocketBase SDK → Raspberry Pi (local network)
```

The PocketBase layer adds real-time sync via SSE subscriptions — when one device updates an animal or checks off a task, every other connected device reflects the change instantly.

**Offline resilience:** When the Pi is unreachable, the app falls back to a local cache and shows an "Offline" banner. Reads work; writes are disabled until the connection is restored.

---

## Adapting to Your Farm

The app is designed to be forked and modified. Key files:

| File | What to change |
|---|---|
| `src/hooks/useStore.ts` | Seed data, storage backend, data pruning |
| `src/types/index.ts` | Data shapes — add fields your farm needs |
| `src/index.css` | Colour palette (`@theme` block) |
| `vite.config.ts` | PWA manifest name, icons, theme colour |
| `public/pwa-192.png` / `public/pwa-512.png` | App icons — replace with your own artwork |

---

## Project Structure

```
src/
  components/       # One file per component (AnimalCard, Checklist, etc.)
  hooks/            # useStore.ts - all persistence goes through here
  types/            # index.ts - all shared TypeScript types
  App.tsx           # Tab routing and top-level state
  index.css         # Tailwind @theme + base resets
electron/
  main.js           # Electron main process — window, IPC handlers, electron-store
  preload.cjs       # Context bridge — exposes window.electronAPI to React
```

---

## Contributing

Pull requests welcome. Please keep components under ~150 lines, run `npm run lint` before submitting, and read `CLAUDE.md` for full conventions and architecture notes.

---

## License

MIT
