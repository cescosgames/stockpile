# Farm App — Claude Code Context

## Project
Offline-capable inventory and feeding checklist app for a small family farm.

**Roadmap:**
1. React (Vite) web app — localStorage, single device
2. Electron wrapper — swap localStorage for electron-store IPC
3. *(Stretch)* PocketBase backend — self-hosted on local network (e.g. Raspberry Pi), multi-user/multi-device sync via REST/realtime API

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS (utility classes only)
- localStorage via a `useStore` hook (will swap to electron-store IPC at Electron migration)

## Project Structure
```
src/
  components/       # One file per component
  hooks/            # useStore.ts — ALL persistence goes through here
  types/            # Shared TypeScript interfaces (Animal, FeedItem, etc.)
  App.tsx
```

## Key Conventions
- All data reads/writes go through `src/hooks/useStore.ts` — never call localStorage directly elsewhere
- Component files: PascalCase (`AnimalCard.tsx`)
- Types file: keep all shared interfaces in `src/types/index.ts`
- No component should exceed ~150 lines; split if larger
- Prefer `type` over `interface` for data shapes

## Data Models
```ts
type HealthStatus = "Good" | "Fair" | "Poor";

type Animal = {
  id: string;
  name: string;
  type: string;        // "Cow" | "Chicken" | "Pig" | free text
  count: number;
  health: HealthStatus;
  notes: string;
  healthLog: { date: string; status: HealthStatus; note: string }[];
};

type FeedItem = {
  id: string;
  name: string;
  unit: string;
  qty: number;
  minQty: number;     // triggers low-stock warning
};

type Session = "AM" | "PM";

type FeedingTask = {
  id: string;
  label: string;
  session: Session;
};

type CheckedState = Record<string, boolean>; // key: `${date}-${session}-${taskId}`
```

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
