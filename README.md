<p align="center">
  <img src="public/pwa-512.png" alt="Stockpile" width="120" />
</p>

<h1 align="center">Stockpile</h1>

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-yellow?style=flat-square" alt="In Development" />
</p>

<p align="center">
  An open source, offline-first farm management app for small family farms.<br/>
  Track livestock health, manage feed inventory, and run daily feeding checklists —<br/>
  from a browser, installed as a PWA, or synced in real time across the whole farm via a Raspberry Pi.
</p>

---

---

## Features

- **Animals** — Individual records with health status, sex, birthday (age auto-calculated), notes, health history, and vaccine log. Grouped by type in collapsible sections. Health status changes are logged automatically with optional notes.
- **Feed Inventory** — Track stock in any unit (kg, lbs, bales, bottles, etc.) with configurable serving labels (scoop, handful, dose, etc.), optional storage location, low-stock thresholds, and target levels. Stock bars, days-remaining estimates, and inline restocking. Checks for rot/spills reminder.
- **Feeding Checklist** — AM and PM task lists with a Weekly section for recurring chores. Communal tasks or per-animal (e.g. each dairy cow checked individually). Checking a feed task automatically deducts from inventory. Check-all button for per-animal tasks. Full inline edit — change label, session, feed association, or scoops without deleting and recreating. Resets at midnight in your timezone; weekly tasks reset Monday at midnight.
- **Contacts** — Quick-reference directory for key personnel: vet, owner, manager, farmhands, or anyone else. Stores name, role, phone, email, and notes. Tap a phone number or email to dial/compose directly. Sorted by role then name.
- **Dashboard** — Stat cards for animal count, low stock, and AM/PM task progress. Animal health summary, feed inventory bars, and a Farm Notes section for freeform dated entries.
- **Settings** — Farm name and timezone. Export/import animal records as JSON for backup. Wipe all data option. Sync mode toggle (Local only / Local network) with Pi URL configuration.
- **Real-time sync** — Optional self-hosted PocketBase backend running on a Raspberry Pi. All devices on the farm network stay in sync instantly via SSE. No cloud, no subscription.
- **Offline-first** — Works without a Pi. With a Pi, falls back to a local read-only cache if the Pi is unreachable, with an Offline banner and auto-reconnect when it comes back.
- **PWA** — Install to home screen on any device (iOS, Android, desktop). Zoom locked, safe-area insets applied, oversized touch targets on action buttons, and a responsive header date (compact on mobile, full on desktop) — feels native rather than web.
- **Desktop app** — Installable as a native desktop app via Electron, with data stored in a local JSON file.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (utility classes, custom `@theme`) |
| Date/time | Luxon (timezone-aware) |
| Persistence | localStorage (PWA) / electron-store (desktop) / PocketBase (sync) via `useStore` hook |
| Sync | PocketBase v0.36.6 — self-hosted SQLite + SSE real-time subscriptions |
| PWA | vite-plugin-pwa (Workbox, generateSW) |
| Desktop | Electron + electron-builder |

---

## Roadmap

- [x] React web app — localStorage, single device
- [x] PWA — installable on any device
- [x] Electron wrapper — desktop packaging with `electron-store`
- [x] PocketBase backend — self-hosted on a Raspberry Pi, real-time sync across all farm devices
- [ ] Multi-device PWA — Pi is live, PWA installs on phones and tablets stay in sync

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

### With PocketBase Sync (optional)

For real-time multi-device sync, run a PocketBase server on your local network (a Raspberry Pi works great). See **[docs/pocketbase-setup.md](docs/pocketbase-setup.md)** for full Pi setup instructions and a local dev guide.

In short — for local dev testing:

```bash
# Drop the pocketbase binary in the project root, then:
./pocketbase serve
```

Import `docs/pb_schema.json` via the Admin UI at `http://127.0.0.1:8090/_/`, then in the Stockpile app go to **Settings → Sync → Local network** and enter `http://127.0.0.1:8090`.

### Testing on iPhone / Mobile

Vite's default `localhost` is unreachable from a phone, and service workers require HTTPS on non-localhost origins. Use `mkcert` to generate a trusted local cert so Safari on iPhone can reach your dev server and install the PWA.

See **[docs/pwa-setup.md — Local dev environment](docs/pwa-setup.md)** for the full step-by-step.

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

### Desktop (.dmg / .exe)

**macOS** — run locally:

```bash
npm run electron:build
```

Output: `dist-electron/Stockpile-<version>.dmg`. The packaged app stores data in `~/Library/Application Support/Stockpile/` (macOS) or `%APPDATA%\Stockpile\` (Windows).

**Windows** — electron-builder cannot cross-compile `.exe` from macOS. Build on a Windows machine:

```bash
npm install && npm run electron:build
# Output: dist-electron/Stockpile Setup <version>.exe
```

> Note: builds are unsigned by default. macOS will warn "unidentified developer" — right-click → Open to bypass for personal use, or run `xattr -cr /Applications/Stockpile.app`. Public distribution requires an Apple Developer certificate + notarization (macOS) and a code-signing certificate (Windows).

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
| `public/pwa-192.png` / `public/pwa-512.png` | PWA icons — replace with your own artwork |
| `public/pwa-512.icns` / `public/icon.ico` | Desktop icons (macOS / Windows) — regenerate from your PNG via `iconutil` |

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

> **Note:** This project is still maturing as an open source repository. Standard community files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, issue templates, changelog) are on the to-do list.

---

## License

MIT
