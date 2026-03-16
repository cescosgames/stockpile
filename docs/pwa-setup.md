# PWA Setup — Stockpile

## What's already done

- `vite-plugin-pwa` configured — `generateSW`, standalone display, portrait orientation, Workbox SW
- Icons in place: `pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`, favicon suite
- Apple web app meta tags in `index.html` (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`)
- `viewport-fit=cover` in viewport meta tag for notch support
- Status bar style set to `black-translucent` for immersive feel on iOS
- `env(safe-area-inset-*)` padding in `index.css` — content clears notch and home indicator
- `touch-action: manipulation` on buttons — removes 300ms tap delay
- Tab bar: text labels hidden on small screens, icons only
- Header: farm name and clock hidden on very small screens to prevent overflow on 375px devices
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

**Solution: `mkcert`**
`mkcert` is a system tool that creates a trusted local CA and signs certs for local IPs. Once the root CA is trusted on your iPhone, the cert is fully trusted — no warnings, service workers register fine.

**Prerequisites:** Be on a trusted local network (not public WiFi).

**One-time setup:**

**Step 1 — Find your machine's local IP**

macOS:
```bash
ipconfig getifaddr en0
```

Windows:
```bash
ipconfig
# Look for "IPv4 Address" under your active adapter
```

Linux:
```bash
hostname -I | awk '{print $1}'
```

Example result: `192.168.1.42`

**Step 2 — Install mkcert**

macOS:
```bash
brew install mkcert
mkcert -install
```

Windows (winget):
```bash
winget install FiloSottile.mkcert
mkcert -install
```

Linux (see [mkcert releases](https://github.com/FiloSottile/mkcert/releases) for your distro):
```bash
mkcert -install
```

**Step 3 — Generate a cert for your local IP**

```bash
mkdir -p .certs && cd .certs
mkcert 192.168.1.42 localhost 127.0.0.1
mv "192.168.1.42+2.pem" local.pem
mv "192.168.1.42+2-key.pem" local-key.pem
cd ..
```

Replace `192.168.1.42` with your actual local IP. Add `.certs/` to `.gitignore`.

**Step 4 — Update `vite.config.ts`**

Add `fs` import and a conditional `server` block:

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

**Step 5 — Trust the CA on your iPhone**

Find the root CA file:
```bash
mkcert -CAROOT
# prints the path, e.g. /Users/yourname/Library/Application Support/mkcert/rootCA.pem
```

Transfer `rootCA.pem` to your iPhone:
- **macOS:** AirDrop it
- **Windows/Linux:** Email it to yourself, share via a local file server, or copy to a USB drive

On iPhone:
1. Open the file in Safari → Settings → General → VPN & Device Management → install profile
2. Settings → General → About → Certificate Trust Settings → enable full trust for the mkcert CA

**Running:**

```bash
npm run dev
# ➜  Network: https://192.168.1.42:5173/
```

Open `https://192.168.1.42:5173` in iPhone Safari — no cert warning, green lock, SW registers. Install via Share → Add to Home Screen.

In Stockpile Settings on the iPhone, set sync to Local Network and enter `http://192.168.1.42:8090` for PocketBase.

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
