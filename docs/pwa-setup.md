# PWA Setup — Stockpile

## What's already done

- `vite-plugin-pwa` configured — `generateSW`, standalone display, portrait orientation, Workbox SW
- Icons in place: `pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`, favicon suite
- Apple web app meta tags in `index.html` (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
- PocketBase sync — multi-device is functional via SSE subscriptions

---

## Installing on a device

**iOS (Safari)**
1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down → **Add to Home Screen**
4. Confirm the name → **Add**

**Android (Chrome)**
1. Open the app URL in Chrome
2. Tap ⋮ → **Add to Home Screen** or **Install App**
3. Confirm

**Desktop (Chrome / Edge)**
1. Open the app URL
2. Click the install icon in the address bar (right side)
3. Confirm install

> **Note:** The service worker only registers over HTTPS. `localhost` works fine for development. For production, the app must be served over HTTPS (e.g. via a reverse proxy with a self-signed cert, or Tailscale HTTPS).

---

## Local dev environment (iPhone testing)

**The problem:** Vite binds to `localhost` by default — your iPhone can't reach it. Service workers also require HTTPS on non-localhost origins, so a plain HTTP local IP won't work.

**Solution: `mkcert` (no new npm dependencies)**
`mkcert` is a Homebrew system tool that creates a trusted local CA and signs certs for local IPs. Once the root CA is trusted on your iPhone, the cert is fully trusted — no warnings, service workers register fine.

**Prerequisites:** Be on a trusted local network (not public WiFi).

**One-time setup:**

```bash
# 1. Find your Mac's local IP
ipconfig getifaddr en0
# → e.g. 192.168.1.42

# 2. Install mkcert and create local CA (Mac only)
brew install mkcert
mkcert -install

# 3. Generate cert for your local IP + localhost
mkdir -p .certs && cd .certs
mkcert 192.168.1.42 localhost 127.0.0.1
mv "192.168.1.42+2.pem" local.pem
mv "192.168.1.42+2-key.pem" local-key.pem
cd ..
```

Add `.certs/` to `.gitignore`.

**Update `vite.config.ts`** — add `fs` import and conditional `server` block:

```ts
import fs from 'node:fs'

const certPath = '.certs/local.pem'
const keyPath  = '.certs/local-key.pem'
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  base: process.env.VITE_ELECTRON ? "./" : "/",
  server: {
    host: true,
    ...(hasLocalCert && {
      https: { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    }),
  },
  plugins: [ /* unchanged */ ]
})
```

The `hasLocalCert` guard means it falls back to plain HTTP if certs are absent (CI, Electron builds, other devs).

**Trust the CA on your iPhone:**

```bash
mkcert -CAROOT
# → prints path to rootCA.pem, e.g.:
# /Users/yourname/Library/Application Support/mkcert
```

AirDrop `rootCA.pem` to your iPhone:
1. Safari downloads it → Settings > General > VPN & Device Management → install profile
2. Settings > General > About > Certificate Trust Settings → enable full trust for the mkcert CA

**Running:**

```bash
npm run dev
# ➜  Network: https://192.168.1.42:5173/
```

Open `https://192.168.1.42:5173` in iPhone Safari — no cert warning, green lock, SW registers. Install via Share → Add to Home Screen.

In Stockpile Settings on the iPhone, set sync to Local Network and enter `http://192.168.1.42:8090` for PocketBase.

---

## What needs to be implemented (mobile polish checklist)

### `index.html`

- [x] Add `viewport-fit=cover` to the viewport meta tag for notch support:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```
- [x] Add the Apple title meta tag:
  ```html
  <meta name="apple-mobile-web-app-title" content="Stockpile" />
  ```
- [x] Change status bar style to `black-translucent` for a more immersive feel:
  ```html
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  ```

### `index.css`

- [x] Add `env(safe-area-inset-*)` padding so content clears the notch and home indicator:
  ```css
  body {
    padding-top: env(safe-area-inset-top);
  }

  footer {
    padding-bottom: env(safe-area-inset-bottom);
  }
  ```
- [x] Add `touch-action: manipulation` on buttons to remove the 300ms tap delay:
  ```css
  button {
    touch-action: manipulation;
  }
  ```

### `Layout.tsx`

- [x] Tab bar: hide text labels on small screens, show icons only (responsive Tailwind classes — e.g. `hidden sm:inline` on label spans)
- [x] Header: consider hiding the clock or farm name on very small screens (`hidden sm:block`) to prevent overflow on 375px devices

---

## Testing checklist

- [ ] Install on iOS Safari — launches standalone (no browser chrome)
- [ ] Install on Android Chrome — icon on home screen, splash screen appears
- [ ] Tab bar fits without overflow on iPhone SE (375px)
- [ ] No content hidden under notch (iPhone 14 Pro / Dynamic Island)
- [ ] No content hidden under home indicator (bottom safe area)
- [ ] Offline: disconnect from Pi → offline banner appears, reads work, writes blocked
- [ ] Reconnect: Pi back online → banner clears, sync resumes automatically (no refresh)
- [ ] Two devices: check off a task on one → appears checked on the other in real time

---

## Production deployment notes

- The app must be served over **HTTPS** for the service worker to register on real devices. Options:
  - Nginx reverse proxy with a self-signed cert (add cert to device trust store)
  - Tailscale — provides HTTPS automatically for any device on the tailnet
- Set the Pi to a **static local IP** (or configure a local DNS entry) so the phone PWA always resolves the PocketBase URL — dynamic DHCP leases will break sync silently
- The service worker uses `skipWaiting: true` — app shell updates automatically on next load; no manual cache clearing needed
