# Stockpile — Claude Code Context

## Project
**Stockpile** — open source, offline-first farm management app for small family farms.
Tracks livestock, feed inventory, and daily feeding checklists.

**Roadmap:**
1. React (Vite) web app — localStorage, single device ✓
2. PWA — installable on any device, still single-device/localStorage ✓
3. Electron wrapper — swap localStorage for electron-store IPC (desktop packaging) ✓
4. PocketBase backend — self-hosted on Raspberry Pi, real-time multi-device sync (in progress → branch: feature/pocketbase-sync)
5. Multi-device PWA — once PocketBase is live, PWA installs on phones/tablets become genuinely useful across the farm

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS (utility classes only)
- Luxon — timezone-aware date/time
- vite-plugin-pwa — service worker + installability
- Electron + electron-store — desktop wrapper (done)
- `useStore` hook — dual-backend: localStorage (PWA) or electron-store IPC (Electron), detected via `window.electronAPI`

## Project Structure
```
src/
  components/
    Layout.tsx          # App shell — header (Stockpile wordmark, farm name, clock, gear), tab nav
    Dashboard.tsx       # Overview: stat cards, animal health, feed inventory bars, farm notes
    AnimalList.tsx      # Animals tab — collapsible groups by type, CRUD
    AnimalCard.tsx      # Individual animal — expandable (sex, age, birthday, notes, health log, vaccine log)
    AnimalForm.tsx      # Add/edit animal modal; health status change triggers optional note
    Checklist.tsx       # AM/PM/Weekly task lists — per-animal or communal, checking deducts feed
    FeedList.tsx        # Feed inventory tab — stock bars, days remaining, inline restock, tooltip
    FeedForm.tsx        # Add/edit feed item modal
    ConfirmModal.tsx    # Shared confirmation modal (replaces native confirm())
    SettingsModal.tsx   # Farm name + timezone (IANA), export/import/wipe animal data
  hooks/
    useStore.ts         # ALL persistence — dual-backend (localStorage / electron-store IPC),
                        # seed data, store versioning, checkedState pruning, debounced Electron saves
  types/
    index.ts            # All shared TypeScript types + window.electronAPI global declaration
  App.tsx               # Tab state, settings modal; all tabs stay mounted (hidden class) to preserve local state
  index.css             # Tailwind @theme (farm palette) + base resets + .themed-scroll
electron/
  main.js               # Main process — BrowserWindow, IPC handlers (store:get/store:set), menu, DevTools in dev
  preload.cjs           # Context bridge — exposes window.electronAPI.get/set to renderer
```

## Key Conventions
- All data reads/writes go through `src/hooks/useStore.ts` — never call localStorage directly elsewhere
- Component files: PascalCase (`AnimalCard.tsx`)
- Types file: keep all shared interfaces in `src/types/index.ts`
- No component should exceed ~150 lines; split if larger
- Prefer `type` over `interface` for data shapes

## PWA Notes
- Configured via `vite-plugin-pwa` in `vite.config.ts`
- Service worker uses `generateSW` with `clientsClaim` + `skipWaiting` for instant updates
- Caches app shell; localStorage data is unaffected by SW (persists independently)
- Icons: `public/pwa-192.png` and `public/pwa-512.png` — replace with proper artwork before distribution
- Theme colour: `#3f8a30` (green-500)

## Data Models
```ts
type HealthStatus = "Good" | "Fair" | "Poor";
type Sex = "Male" | "Female" | "Unknown";

type Animal = {
  id: string;
  name: string;
  type: string;        // free text, normalized to title case on save
  health: HealthStatus;
  sex: Sex;
  birthday: string;    // ISO date — age calculated via Luxon
  notes: string;
  healthLog: { date: string; status: HealthStatus; note: string }[];
  vaccineLog: { id: string; date: string; vaccine: string; note: string }[];
};

type FeedItem = {
  id: string;
  name: string;
  unit: "kg" | "lbs";
  qty: number;
  minQty: number;      // triggers low-stock warning
  maxQty: number;      // target/full stock — sets bar length
  scoopSize: number;   // weight per scoop in unit
};

type Session = "AM" | "PM";

type FeedingTask = {
  id: string;
  label: string;
  session: Session;
  feedItemId?: string; // optional — non-feed tasks leave blank
  scoops?: number;     // checking deducts scoops × scoopSize from inventory
  perAnimal?: boolean; // if true, renders one checkbox per animal of animalType
  animalType?: string; // case-insensitive match against Animal.type
};

type WeeklyTask = {
  id: string;
  label: string;       // simple label — no feed/session/per-animal
};

type MonthlyTask = {
  id: string;
  label: string;       // resets midnight 1st of each month
};

type OneOffTask = {
  id: string;
  label: string;
  done: boolean;       // persists until deleted
};

type Note = {
  id: string;
  date: string;        // ISO date
  text: string;
  author?: string;     // optional farm hand attribution
};

// CheckedState keys:
//   daily communal:   `${date}-${session}-${taskId}`
//   daily per-animal: `${date}-${session}-${taskId}-${animalId}`
//   weekly:           `${mondayDate}-week-${taskId}`
//   monthly:          `${firstOfMonthDate}-month-${taskId}`
type CheckedState = Record<string, boolean>;

type Settings = {
  farmName: string;
  timezone: string;    // IANA timezone string
};
```

## Store Versioning
`STORE_VERSION` constant in `useStore.ts` (currently `"v19"`). Bump it whenever the data shape changes — on load it clears all localStorage keys and reseeds. `checkedState` is also pruned to 90 days on every load to keep storage lean.

## Dev Commands
- `npm run dev` — start Vite dev server (browser / PWA)
- `npm run build` — production PWA build
- `npm run lint` — ESLint
- `npm run electron:dev` — launch Electron (requires `npm run dev` running first)
- `npm run electron:build` — production Electron build → `dist-electron/Stockpile-*.dmg`

## Electron Notes
- `electron/main.js` — ESM. Uses `import.meta.url` for `__dirname`. `app.isPackaged` = false in dev, true when built.
- `electron/preload.cjs` — must be CommonJS (`.cjs`); preload scripts don't support ESM.
- `window.electronAPI` present only in Electron renderer; `useStore.ts` detects this to switch backends.
- IPC channels: `store:get` and `store:set` (handled in main.js via electron-store).
- Electron saves are debounced 400ms to avoid per-keystroke IPC writes.
- Dev data location (macOS): `~/Library/Application Support/Electron/config.json`
- Prod data location (macOS): `~/Library/Application Support/Stockpile/config.json`
- Build is unsigned — fine for personal use; needs Apple Developer cert + notarization for public distribution.
- Remaining nice-to-haves: custom app icon, window state persistence, auto-updater.

## Stretch Goals / Known Limitations
- Per-animal task `animalType` matching is case-insensitive string comparison. Robust solution would be a strict dropdown of existing animal types in the task form — deferred because it requires a managed custom-types system (users need to add/rename types, not just pick from a fixed list).
- Tab state is preserved across switches by keeping all tab components mounted with `hidden` CSS class (not conditional rendering). This preserves collapsed state, scroll position, and open forms.
- Weekly tasks reset at midnight Monday (Luxon `startOf("week")` = ISO week = Monday). The checked key prefix is the Monday ISO date, so the existing 90-day pruning handles cleanup automatically.

## Things to NOT do
- Do not call localStorage directly — use useStore hook
- Do not install new dependencies without asking first
- Do not add a router; this is a single-page app with tab-based navigation
- Do not use any UI component library (shadcn, MUI, etc.) — custom styled components only

## PocketBase Plan (branch: feature/pocketbase-sync)

**Infrastructure:**
- Raspberry Pi on the farm's local network running PocketBase as a single binary
- No cloud, no subscription — Pi sits on the network, auto-starts PocketBase on boot via systemd
- All farm devices (phones, tablets, Electron desktop) connect to `http://[pi-ip]:8090`
- PocketBase stores data in SQLite on the Pi's SD card

**Auth:** None — open local network, all farmhands can read and write freely

**What syncs:** Everything — animals, feedItems, feedingTasks, checkedState, settings

**Real-time:** PocketBase SSE subscriptions — when one device checks off a task or updates an animal, all other connected devices update instantly without polling

**Sync mode selection — Settings UI (not a build-time env var):**
- `SettingsModal.tsx` gets a "Sync" section with a toggle: **Local only** (default) / **Local network**
- When "Local network" is selected, a URL field appears for the Pi's address (e.g. `http://192.168.1.42:8090`)
- Preference + URL are stored as part of `settings` in `useStore` — no `.env.local` needed, survives app restarts
- `VITE_PB_URL` is NOT used — mode is entirely runtime-controlled
- The offline banner ("Pi unreachable — changes won't be saved") only shows when the user has explicitly chosen Local Network mode; Local only users never see it
- Mode switching note: switching from Local Network → Local only or vice versa should prompt the user to export first, as data is not automatically merged between backends

**Offline resilience strategy (read-only fallback — Local Network mode only):**
- On load, `useStore.ts` attempts to connect to PocketBase using the stored URL
- If reachable: full live sync via SSE subscriptions
- If unreachable: app loads from a local cache (last known state), shows a persistent "Offline — changes won't be saved" banner, disables all writes
- No conflict resolution needed — writes are simply blocked when offline
- When Pi comes back online, user refreshes and live sync resumes
- Local cache is written to localStorage (or electron-store) as a mirror after every successful sync

**Files that change:**
- `useStore.ts` — adds PocketBase backend path, reads `settings.pbUrl` + `settings.syncMode` to decide which backend to use
- `SettingsModal.tsx` — adds Sync section (toggle + URL field)
- `src/types/index.ts` — adds `syncMode` and `pbUrl` fields to the `Settings` type

**Pi setup steps (for when hardware arrives):**
1. Flash Raspberry Pi OS Lite to SD card
2. Enable SSH, connect to farm network
3. Download PocketBase v0.36.6 ARM binary, make executable
4. Import `docs/pb_schema.json` via PocketBase Admin UI (Settings → Import collections)
5. Create systemd service to auto-start PocketBase on boot
6. Note the Pi's local IP — set as static in router if possible
7. In Stockpile Settings → Sync, choose "Local network" and enter `http://[pi-ip]:8090`

**New dep:** `pocketbase` v0.36.6 JS SDK — already installed
