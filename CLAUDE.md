# Stockpile — Claude Code Context

## Project
**Stockpile** — open source, offline-first farm management app for small family farms.
Tracks livestock, feed inventory, and daily feeding checklists.

**Roadmap:**
1. React (Vite) web app — localStorage, single device ✓
2. PWA — installable on any device, still single-device/localStorage ✓
3. Electron wrapper — swap localStorage for electron-store IPC (desktop packaging) ✓
4. *(Stretch)* PocketBase backend — self-hosted, enables true multi-device sync
5. *(Stretch)* PWA goes multi-device — once PocketBase is live, PWA installs on phones/tablets become genuinely useful

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
    Dashboard.tsx       # Overview: stat cards, animal health, feed inventory bars
    AnimalList.tsx      # Animals tab — grouped by type, CRUD
    AnimalCard.tsx      # Individual animal — expandable (sex, age, birthday, notes, vaccine log)
    AnimalForm.tsx      # Add/edit animal modal
    Checklist.tsx       # AM/PM task lists — checking deducts feed inventory
    FeedList.tsx        # Feed inventory tab — stock bars, days remaining, inline restock
    FeedForm.tsx        # Add/edit feed item modal
    SettingsModal.tsx   # Farm name + timezone (IANA), live clock preview
  hooks/
    useStore.ts         # ALL persistence — dual-backend (localStorage / electron-store IPC),
                        # seed data, store versioning, checkedState pruning, debounced Electron saves
  types/
    index.ts            # All shared TypeScript types + window.electronAPI global declaration
  App.tsx               # Tab state, settings modal state, wires store → components
  index.css             # Tailwind @theme (farm palette) + base resets
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
  type: string;        // "Cow" | "Chicken" | "Pig" | free text
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
  scoopSize: number;   // weight per scoop in unit
};

type Session = "AM" | "PM";

type FeedingTask = {
  id: string;
  label: string;
  session: Session;
  feedItemId?: string; // optional — non-feed tasks leave blank
  scoops?: number;     // checking this task deducts scoops × scoopSize from inventory
};

type CheckedState = Record<string, boolean>; // key: `${date}-${session}-${taskId}`

type Settings = {
  farmName: string;
  timezone: string;    // IANA timezone string
};
```

## Store Versioning
`STORE_VERSION` constant in `useStore.ts` (currently `"v7"`). Bump it whenever the data shape changes — on load it clears all localStorage keys and reseeds. `checkedState` is also pruned to 90 days on every load to keep storage lean.

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

## Things to NOT do
- Do not call localStorage directly — use useStore hook
- Do not install new dependencies without asking first
- Do not add a router; this is a single-page app with tab-based navigation
- Do not use any UI component library (shadcn, MUI, etc.) — custom styled components only

## PocketBase Migration Notes (next milestone)

Self-hosted PocketBase instance on local network (Raspberry Pi or similar).
`src/hooks/useStore.ts` is again the only file that changes — replace electron-store IPC with PocketBase SDK calls.
PocketBase provides real-time subscriptions (SSE) — use these instead of polling.
Auth: PocketBase built-in auth; SDK handles token storage automatically.
Offline resilience: keep a local cache in `useStore.ts` so the app degrades gracefully when off-network.
Both PWA and Electron clients point at the same PocketBase instance — same data, real-time sync across devices.

## Reference Files
- `@docs/architecture.md` — overall app structure and migration plan (create as needed)
