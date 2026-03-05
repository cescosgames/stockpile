# Stockpile — Claude Code Context

## Project
**Stockpile** — open source, offline-first farm management app for small family farms.
Tracks livestock, feed inventory, and daily feeding checklists.

**Roadmap:**
1. React (Vite) web app — localStorage, single device ✓
2. PWA — installable on any device, still single-device/localStorage ✓
3. Electron wrapper — swap localStorage for electron-store IPC (desktop packaging)
4. *(Stretch)* PocketBase backend — self-hosted, enables true multi-device sync
5. *(Stretch)* PWA goes multi-device — once PocketBase is live, PWA installs on phones/tablets become genuinely useful

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS (utility classes only)
- Luxon — timezone-aware date/time
- vite-plugin-pwa — service worker + installability
- localStorage via a `useStore` hook (will swap to electron-store IPC at Electron migration)

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
    useStore.ts         # ALL persistence — localStorage, seed data, store versioning, checkedState pruning
  types/
    index.ts            # All shared TypeScript types
  App.tsx               # Tab state, settings modal state, wires store → components
  index.css             # Tailwind @theme (farm palette) + base resets
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
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## Things to NOT do
- Do not call localStorage directly — use useStore hook
- Do not install new dependencies without asking first
- Do not add a router; this is a single-page app with tab-based navigation
- Do not use any UI component library (shadcn, MUI, etc.) — custom styled components only

## Electron Migration Notes (future)
When migrating, the only file that changes is `src/hooks/useStore.ts`.
Replace localStorage calls with `window.electronAPI.*` IPC calls.
Do not scatter any persistence logic outside of that hook.

## PocketBase Migration Notes (stretch goal)
Self-hosted PocketBase instance on local network (Raspberry Pi or similar).
When migrating from Electron, `src/hooks/useStore.ts` is again the only file that changes.
Replace electron-store IPC calls with PocketBase SDK calls (`pb.collection(...).getList/create/update/delete`).
PocketBase provides real-time subscriptions — use these to replace any polling.
Auth: use PocketBase's built-in auth; store the auth token via the SDK (it handles it automatically).
Offline resilience: keep a local cache layer in `useStore.ts` so the app degrades gracefully when off-network.

## Reference Files
- `@docs/architecture.md` — overall app structure and migration plan (create as needed)
