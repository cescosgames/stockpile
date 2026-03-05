# Stockpile

An open source, offline-first farm management app for small family farms. Track livestock health, manage feed inventory, and run daily feeding checklists — all from a browser or installed as a PWA on any device.

Built to be simple enough to use in a barn and hackable enough to adapt to your own farm's needs.

---

## Features

- **Animals** — Individual animal records with health status, sex, birthday (age auto-calculated), notes, and vaccine history. Grouped by type.
- **Feed Inventory** — Track stock in kg or lbs with per-item scoop sizes. Low-stock warnings and days-remaining estimates based on daily task usage.
- **Feeding Checklist** — AM and PM task lists. Checking a feed task automatically deducts from inventory. Resets at midnight in your timezone.
- **Dashboard** — At-a-glance overview of animal health, feed levels, and today's task progress.
- **Settings** — Farm name and timezone. Checklist midnight reset respects your local time.
- **Offline-first** — Everything runs in the browser. No account, no server, no internet required.
- **PWA** — Install to home screen on any device (iOS, Android, desktop).

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (utility classes, custom `@theme`) |
| Date/time | Luxon (timezone-aware) |
| Persistence | localStorage via `useStore` hook |
| PWA | vite-plugin-pwa (Workbox, generateSW) |

---

## Roadmap

- [x] React web app — localStorage, single device
- [x] PWA — installable on any device
- [ ] Electron wrapper — desktop packaging with `electron-store`
- [ ] PocketBase backend — self-hosted sync (Raspberry Pi or local server)
- [ ] Multi-device PWA — once PocketBase is live, PWA installs become genuinely useful across the farm

---

## Getting Started

```bash
git clone https://github.com/your-username/farm-app.git
cd farm-app
npm install
npm run dev
```

Open `http://localhost:5173`. The app seeds with example data on first load.

### Build for production

```bash
npm run build
npm run preview
```

The `dist/` folder is a fully self-contained static site — serve it from any web server or open `index.html` directly.

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

All persistence is isolated to `useStore.ts`. When migrating to Electron or PocketBase, only that file changes.

---

## Project Structure

```
src/
  components/       # One file per component (AnimalCard, Checklist, etc.)
  hooks/            # useStore.ts — all persistence goes through here
  types/            # index.ts — all shared TypeScript types
  App.tsx           # Tab routing and top-level state
  index.css         # Tailwind @theme + base resets
```

---

## Contributing

Pull requests welcome. Please keep components under ~150 lines, run `npm run lint` before submitting, and read `CLAUDE.md` for full conventions and architecture notes.

---

## License

MIT
