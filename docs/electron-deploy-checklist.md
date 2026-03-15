# Electron Deploy Checklist

## Current State

`electron-builder` is configured in `package.json` with `appId`, `productName`, `mac`, and `win` targets. The build script is:

```bash
npm run electron:build
```

This runs `tsc -b && vite build && electron-builder` and outputs to `dist-electron/`.

---

## Before Shipping

### 1. Package name (minor)

`package.json` `name` is `"farm-app"`. Not user-facing, but worth aligning:

```json
"name": "stockpile"
```

### 2. macOS icon — `.icns` required

Currently using `public/pwa-512.png`. electron-builder accepts PNG for dev but macOS renders a blurry icon in Finder/Dock without a proper `.icns` file.

**Fix:**
1. Go to [cloudconvert.com/png-to-icns](https://cloudconvert.com/png-to-icns) (or use macOS `iconutil`)
2. Convert `public/pwa-512.png` → `public/icon.icns`
3. Update `package.json`:
   ```json
   "mac": {
     "category": "public.app-category.productivity",
     "icon": "public/icon.icns"
   }
   ```

### 3. Windows icon — larger `.ico` needed

Currently using `favicon.ico` (16/32/48px). Windows installer needs 256px embedded in the `.ico`.

**Fix:**
1. Convert `public/pwa-512.png` → a multi-size `.ico` with 16/32/48/256px layers
2. Save as `public/icon.ico`
3. Update `package.json`:
   ```json
   "win": {
     "icon": "public/icon.ico"
   }
   ```

Free tool: [icoconvert.com](https://icoconvert.com) — select all sizes when exporting.

---

## Building

### macOS `.dmg` (build on your Mac)

```bash
npm run electron:build
```

Output: `dist-electron/Stockpile-<version>.dmg`

**First-launch warning:** macOS will show "app can't be opened because it is from an unidentified developer" for unsigned builds. Workaround for personal use:

```bash
xattr -cr /Applications/Stockpile.app
```

Or: right-click the `.dmg` → Open → Open anyway.

To remove the warning for others: requires an Apple Developer account ($99/yr) + notarization.

### Windows `.exe` — cross-compilation limitation

electron-builder **cannot build `.exe` on macOS** without Wine installed (complex, not recommended). Options:

#### Option A — Build on a Windows machine
Copy the repo, run `npm install && npm run electron:build`. Output: `dist-electron/Stockpile Setup <version>.exe` (NSIS installer).

#### Option B — GitHub Actions (recommended)

Add `.github/workflows/electron-build.yml`:

```yaml
name: Build Electron

on:
  push:
    tags:
      - 'v*'

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run electron:build
      - uses: actions/upload-artifact@v4
        with:
          name: mac-dmg
          path: dist-electron/*.dmg

  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run electron:build
      - uses: actions/upload-artifact@v4
        with:
          name: win-installer
          path: dist-electron/*.exe
```

Push a tag (`git tag v1.0.0 && git push --tags`) and both artifacts appear in GitHub Actions → your run → Artifacts. Free on public repos, 2,000 free minutes/month on private repos.

---

## Code Signing (optional — needed for public distribution)

| Platform | Cost | What it removes |
|---|---|---|
| macOS notarization | $99/yr Apple Developer | "Unidentified developer" warning |
| Windows code signing | ~$70–$400/yr (DigiCert etc.) | SmartScreen "Unknown publisher" warning |

For personal/family farm use, the workarounds above are fine. Sign if distributing publicly.

---

## Checklist Summary

- [x] Convert icon to `.icns` (macOS) — `public/pwa-512.icns` already existed
- [x] Windows multi-size `.ico` with 256px — `public/icon.ico` created (16/32/48/256px); `win.icon` updated in `package.json`
- [x] Update icon paths in `package.json` — mac uses `pwa-512.icns`, win uses `icon.ico`
- [x] Rename `"name"` to `"stockpile"` in `package.json`
- [x] Fix GitHub Actions workflow — added `--publish never` to electron-builder; was failing because tag push triggered implicit GitHub publish without `GH_TOKEN`
- [ ] Build `.dmg` locally (see below)
- [ ] Test install, launch, and data persistence on each platform
- [ ] (Optional) Code sign for public distribution

---

## Building the .dmg locally (macOS)

Run from the project root:

```bash
npm run electron:build
```

Output: `dist-electron/Stockpile-0.1.0.dmg`

**Notes:**
- Requires Xcode command line tools (already present on any dev Mac)
- `dist-electron/` is gitignored — the `.dmg` lives only on disk; upload manually to GitHub Releases
- First-launch Gatekeeper warning is expected for unsigned builds. Workarounds:
  - Right-click the `.dmg` → Open → "Open anyway"
  - Or after installing: `xattr -cr /Applications/Stockpile.app`
