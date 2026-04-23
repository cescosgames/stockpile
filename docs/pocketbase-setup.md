# Stockpile — PocketBase Server Setup Guide

This guide sets up a self-hosted PocketBase instance on a Raspberry Pi on your farm's local network. Once running, all devices on that network (phones, tablets, desktop) will sync in real time with no internet required.

---

## What You Need

### Hardware — Minimum Requirements

> ⚠️ **The original Pi Zero W is NOT compatible.** PocketBase has never shipped an ARMv6 binary. The Pi Zero W uses ARMv6 and cannot run PocketBase at any version. **You need at least a Pi Zero 2 W.**

| Item | Notes |
|---|---|
| **Raspberry Pi Zero 2 W** (minimum) | Quad-core ARMv7/ARM64, 512MB RAM, built-in Wi-Fi. ~$15. Use the 64-bit OS image and `linux_arm64` PocketBase binary. |
| **Any Pi 2, 3, or 4** | All work fine — ARMv7/ARM64, same setup. Pi 3B+ or 4 will be noticeably faster. |
| **microSD card (8GB+)** | Class 10 / A1 rated recommended. Test it before use (see Step 0). |
| **Power supply** | 5V micro-USB for Pi Zero 2 W; USB-C for Pi 3/4. Check your specific model. |
| **Case** | Optional but recommended for physical protection. |

> **What about the original Pi Zero W?** It's ARMv6-only. PocketBase has never provided an ARMv6 binary and there is no workaround. If you have one, it cannot be used as a Stockpile sync server.

### Other Requirements

- **A computer** to flash the SD card and SSH from
- **A router with admin access** — needed to assign a static IP to the Pi (see Step 3)
- All farm devices (phones, tablets, desktop) must be on the same local network as the Pi
- The Pi Zero W connects via **Wi-Fi only** — no Ethernet port

### Software (on your computer)
- [Raspberry Pi Imager](https://www.raspberrypi.com/software/) — to flash the SD card
- An SSH client — Terminal on macOS/Linux, PuTTY or Windows Terminal on Windows

---

## Step 0 — Test the SD Card

No-name cards often lie about capacity or have bad sectors. Do this before flashing.

```bash
# Install F3 via Homebrew (on your Mac)
brew install f3

# Insert the card, then find its disk identifier
diskutil list
```

Look for the external disk around 8GB — it will say `(external, physical)` and show a FAT32 partition. Note the disk number (e.g. `disk4`).

> ⚠️ **Double-check the disk number before running anything.** `disk0` is your Mac's internal SSD — writing to it will wipe your entire computer. The SD card will always show as `(external, physical)` with a size around 7–8 GB. If in doubt, remove the card, run `diskutil list` again, and compare — the entry that disappears is the card.

Now run the write test. F3 on macOS works on the **mounted volume**, not the raw device:

```bash
# Write test — use the volume path, not the device path
f3write /Volumes/NO\ NAME

# Then read it back
f3read /Volumes/NO\ NAME
```

> If `/Volumes/NO NAME` doesn't exist, run `diskutil mountDisk /dev/disk4` (use your disk number) and try again.

If it reports `Data LOST: 0.00 Byte` and no corrupted sectors, the card is good. If there are any errors, discard the card — don't use it for the Pi.

After the test passes, clean up the test files before flashing:

```bash
rm /Volumes/NO\ NAME/*.h2w
```

---

## Step 1 — Flash the SD Card

1. Open Raspberry Pi Imager on your computer.
2. **Choose Device** → select your Pi model (e.g. Raspberry Pi Zero 2 W).
3. **Choose OS** → Raspberry Pi OS (other) → **Raspberry Pi OS Lite (64-bit)**.
   > Use 64-bit for Pi Zero 2 W, Pi 3, and Pi 4. This gives you the `aarch64` architecture and the `linux_arm64` PocketBase binary.
4. **Choose Storage** → select your SD card.
5. Click **Next** — Imager will ask "Would you like to apply OS customisation settings?" → click **Edit Settings** (not No — if you click No, SSH won't be enabled and the Pi will be unreachable).
6. Fill in the settings:
   - **Hostname:** `stockpile` (so you can SSH as `stockpile.local`)
   - **Username/Password:** set a username and a strong password — write it down
   - **Wireless LAN:** enter your Wi-Fi SSID and password. SSIDs are case-sensitive — enter it exactly as it appears.
   - **Locale:** set your timezone and keyboard layout
7. On the **Services** tab → **Enable SSH** → **Use password authentication**.
8. Click **Save** → **Yes** to apply settings → **Yes** to confirm the flash.

Remove the SD card, insert it into the Pi, and connect the power supply.

> **Pi Zero 2 W:** Has two micro-USB ports. The one labelled **PWR IN** (closer to the corner) is for power — plug in there, not the middle USB port. If you plug into the wrong port the Pi won't boot.

---

## Step 2 — Connect to the Pi

The Pi Zero W takes **3–5 minutes** on first boot — it expands the filesystem, applies settings, and connects to Wi-Fi before SSH becomes available. Give it the full time.

The green LED will flicker during boot. Once it goes **solid green**, SSH should be ready shortly after.

Try SSH by hostname first:

```bash
ssh your-username@stockpile.local
```

If that fails, find the IP from your router's admin panel. The Pi may appear as `stockpile`, or as its MAC address (e.g. `MAC-6CC370`) before the hostname resolves — either way, note its IP and use it directly:

```bash
ssh your-username@192.168.0.244
```

> If you get `Connection refused` (not a timeout), the Pi is on the network but SSH isn't ready yet — keep retrying every 30 seconds. You can confirm the Pi is reachable with `ping 192.168.0.244`. If you can ping it but SSH is refused, just wait.

Accept the host fingerprint when prompted (`yes`) and enter your password. The password prompt shows nothing as you type — that's normal.

Once you're in, update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

> This takes a long time on the Pi Zero W — 5–10 minutes is normal. Let it finish.

---

## Step 3 — Assign a Static IP

The Pi's IP must not change — if it does, all farm devices will lose sync until you reconfigure them. Choose one of the two methods below.

### Option A — Reserve the IP in your router (recommended)

Most routers let you pin a device's IP to its MAC address (called a "DHCP reservation" or "static lease"). This is the easiest and most reliable method.

1. Log into your router's admin panel (typically `192.168.1.1` or `192.168.0.1` in a browser).
2. Find the connected devices list and locate your Pi.
3. Find the option to reserve/pin its IP — the label varies by router: "DHCP Reservation", "Static Lease", "Address Reservation", or "IP Binding".
4. Save the reservation. The Pi will keep this IP address every time it connects.

### Option B — Set a static IP on the Pi directly

Use this if your router doesn't support DHCP reservations.

Find your network interface name (Wi-Fi on the Pi Zero W is `wlan0`):

```bash
ip link show
```

Edit the DHCP configuration:

```bash
sudo nano /etc/dhcpcd.conf
```

Add the following lines at the bottom, substituting your own values:

```
interface wlan0
static ip_address=192.168.1.42/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1
```

- `static ip_address` — the IP you want the Pi to always use (choose one not in your router's DHCP range)
- `static routers` — your router's IP (gateway)
- `static domain_name_servers` — usually the same as your router's IP

Save with `Ctrl+O`, exit with `Ctrl+X`, then reboot:

```bash
sudo reboot
```

SSH back in using the new static IP.

---

## Step 4 — Install PocketBase

PocketBase is a single binary — no package manager needed.

First, confirm your Pi's architecture:

```bash
uname -m
```

- `aarch64` → 64-bit ARM → use `linux_arm64` (Pi Zero 2 W, Pi 3, Pi 4 with 64-bit OS)
- `armv7l` → 32-bit ARMv7 → use `linux_armv7` (Pi Zero 2 W or Pi 2/3 with 32-bit OS)

Then download the matching binary:

```bash
# Create a directory for PocketBase
mkdir -p ~/pocketbase && cd ~/pocketbase

# For 64-bit ARM (aarch64) — Pi Zero 2 W with 64-bit OS
wget https://github.com/pocketbase/pocketbase/releases/download/v0.37.3/pocketbase_0.37.3_linux_arm64.zip

# OR for 32-bit ARMv7 (armv7l)
# wget https://github.com/pocketbase/pocketbase/releases/download/v0.37.3/pocketbase_0.37.3_linux_armv7.zip

# Unzip (install unzip first if needed: sudo apt install unzip -y)
unzip pocketbase_0.37.3_linux_arm64.zip

# Make it executable
chmod +x pocketbase
```

Test that it runs:

```bash
./pocketbase --version
```

---

## Step 5 — Import the Collection Schema

Start PocketBase temporarily to access the Admin UI:

```bash
./pocketbase serve --http="0.0.0.0:8090"
```

On your computer, open a browser and navigate to:

```
http://192.168.1.42:8090/_/
```

(Replace the IP with your Pi's static IP.)

You'll be prompted to create an admin account — use any email and a strong password. This account is only used to manage the PocketBase instance; it is not a user-facing login.

Once logged in:

1. Go to **Settings** (gear icon in the left sidebar).
2. Select **Import collections**.
3. Click **Load from JSON file**.
4. Upload `docs/pb_schema.json` from this repository.
5. Click **Review** → **Confirm and import**.

You should now see 9 collections created: `animals`, `feedItems`, `feedingTasks`, `weeklyTasks`, `monthlyTasks`, `oneOffTasks`, `notes`, `checkedState`, `contacts`, and `settings`.

Stop PocketBase for now (`Ctrl+C` in the SSH session) — you'll set it up to start automatically in the next step.

---

## Step 6 — Run PocketBase as a System Service

This makes PocketBase start automatically on boot and restart if it crashes.

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/pocketbase.service
```

Paste the following, replacing `your-username` with your Pi username:

```ini
[Unit]
Description=PocketBase — Stockpile data server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/pocketbase
ExecStart=/home/your-username/pocketbase/pocketbase serve --http="0.0.0.0:8090"
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl+O`, `Ctrl+X`), then enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

Check that it's running:

```bash
sudo systemctl status pocketbase
```

You should see `Active: active (running)`. PocketBase will now start automatically every time the Pi boots.

Confirm the Admin UI is accessible again from your computer's browser:

```
http://192.168.1.42:8090/_/
```

---

## Step 7 — Configure the App

No build-time configuration needed. Sync mode is set entirely from within the app:

1. Open Stockpile on a device connected to the farm network.
2. Go to **Settings** (gear icon).
3. Under **Sync**, switch from **Local only** to **Local network**.
4. Enter the Pi's address: `http://192.168.1.42:8090` (use your Pi's actual static IP).
5. Save. The app will connect immediately and begin syncing.

Repeat on each device. All devices pointing at the same Pi address will stay in real-time sync.

If the Pi is unreachable, the app falls back to its last cached state and shows an **Offline** banner. Writes are disabled until the connection is restored.

---

## Verify Everything Works

1. Open Stockpile on two devices connected to the farm network.
2. Add an animal or check off a feeding task on one device.
3. The change should appear on the second device within a second or two — no refresh needed.

If sync isn't working, check:

```bash
# On the Pi — confirm PocketBase is running
sudo systemctl status pocketbase

# On the Pi — confirm port 8090 is listening
ss -tlnp | grep 8090
```

Make sure no firewall is blocking port 8090 on the Pi:

```bash
sudo ufw status
```

If UFW is active, allow the port:

```bash
sudo ufw allow 8090/tcp
```

---

## Backup

PocketBase stores all data in a single SQLite file at `~/pocketbase/pb_data/data.db`. Back it up by copying that file — you can do this while PocketBase is running.

To copy it to your computer:

```bash
# Run this on your computer, not the Pi
scp your-username@192.168.1.42:~/pocketbase/pb_data/data.db ./stockpile-backup.db
```

A weekly cron job on the Pi is a sensible option if you want automated backups:

```bash
crontab -e
```

Add a line like this to back up every Sunday at 2 AM:

```
0 2 * * 0 cp ~/pocketbase/pb_data/data.db ~/pocketbase/pb_data/backup-$(date +\%Y\%m\%d).db
```

---

## Local Dev Environment

You don't need a Raspberry Pi to work on the PocketBase integration. PocketBase runs as a local binary on your dev machine in exactly the same way it runs on the Pi.

### 1 — Download the binary

Go to the [PocketBase releases page](https://github.com/pocketbase/pocketbase/releases) and download the latest macOS binary for your architecture. Check yours with:

```bash
uname -m
# arm64  → Apple Silicon → download darwin_arm64
# x86_64 → Intel        → download darwin_amd64
```

Drag the `pocketbase` binary (no extension) from the unzipped folder into the project root. Keep it out of the repo — it's already in `.gitignore`.

> **Note:** macOS may flag the binary as unverified. If it refuses to run, clear the quarantine attribute:
> ```bash
> xattr -d com.apple.quarantine pocketbase
> ```
> If that returns `No such xattr: com.apple.quarantine`, the binary was never quarantined — just run it directly.

### 2 — Start the server

```bash
./pocketbase serve
```

### 3 — Create an admin account

Open `http://127.0.0.1:8090/_/` and create an admin account with any email and password. This is local-only — credentials don't matter.

### 4 — Import the schema

In the Admin UI: **Settings → Import collections → Upload JSON file** → select `docs/pb_schema.json` → **Review → Confirm and import**.

> **Warning prompt:** PocketBase will warn about deleting fields from system collections (`_superusers`, `users`, etc.). This is expected — our schema doesn't include those system fields. Confirm and proceed.

You should see 10 collections created: `animals`, `feedItems`, `feedingTasks`, `weeklyTasks`, `monthlyTasks`, `oneOffTasks`, `notes`, `checkedState`, `contacts`, and `settings`.

### 5 — Connect the app

In a second terminal, start the dev server:

```bash
npm run dev
```

In the Stockpile app: **Settings (gear) → Sync → Local network → URL: `http://127.0.0.1:8090` → Save → reload the page**.

The app will connect to your local PocketBase instance exactly as it would to the Pi.

When you're done developing, `Ctrl+C` stops the server. Data persists in `pb_data/` between runs.

> **Note:** Keep the PocketBase binary and its data directory out of version control. Both are covered by `.gitignore`:
> ```
> /pocketbase
> /pb_data/
> ```

---

## Common Issues During Local Development

These are real problems encountered while building the PocketBase integration, documented here because they're easy to hit and the error messages aren't always obvious.

---

### Record IDs rejected with `validation_max_text_constraint`

**Symptom:** `create()` calls fail with a 400 error. The response body shows something like:
```json
{ "data": { "id": { "code": "validation_max_text_constraint", "message": "Must be no more than 15 character(s)." } } }
```

**Cause:** PocketBase enforces a **maximum of 15 characters** for record IDs. Any custom ID — whether passed directly to `create()` or generated by your app — must be exactly 15 alphanumeric characters.

**Fix:** Audit all hardcoded seed IDs and your `newId()` function. A common mistake is writing IDs that look 15 chars but are actually 16 (easy to mis-count). Verify with:
```js
"youridstring".length // must equal 15
```

---

### `sort: "created"` rejected with a 400

**Symptom:** `getFullList({ sort: "created" })` fails with a 400.

**Cause:** In PocketBase 0.22+, the default sort field is named `created` but the option syntax changed. Passing `sort: "created"` as an option can be rejected depending on your SDK version.

**Fix:** Drop the sort option entirely — `getFullList()` with no arguments works fine and returns all records:
```js
pb.collection("animals").getFullList()
```

---

### React StrictMode causes double-init and duplicate ID errors

**Symptom:** In development, the PocketBase `useEffect` runs twice. The first run seeds records successfully; the second run tries to create the same records again and fails with duplicate ID errors.

**Cause:** React 18 StrictMode intentionally mounts effects twice in development to surface side-effect bugs. Both runs fire nearly simultaneously.

**Fix:** Use an `active` flag. The first (discarded) run sets `active = false` on cleanup before the async work completes; the second (real) run checks `active` after each await and exits early if false:
```js
let active = true;
async function init() {
  await pb.health.check();
  if (!active) return; // exits if StrictMode discarded this run
  // ... rest of init
}
init();
return () => { active = false; };
```

---

### SDK cancels its own parallel requests

**Symptom:** Seeding multiple collections in parallel with `Promise.all` causes some requests to silently fail or throw a cancellation error.

**Cause:** The PocketBase JS SDK automatically cancels in-flight requests with the same "cancel key" when a new request to the same collection fires. With parallel seeding this happens frequently.

**Fix:** Disable auto-cancellation on the PocketBase instance after creating it:
```js
const pb = new PocketBase(url);
pb.autoCancellation(false);
```

---

### App goes offline after Pi restarts, won't reconnect without a page refresh

**Symptom:** After PocketBase stops and restarts, the offline banner stays up even once the Pi is back. Users have to manually refresh.

**Cause:** The SSE subscription connection drops when PocketBase stops. The SDK tries to reconnect but the app's `pbOnline` state flag isn't updated when the connection recovers.

**Fix:** Add a periodic health-check interval (e.g. every 10 seconds) that sets `pbOnline` based on whether the health endpoint responds. This also proactively shows the banner before a failed write reveals the offline state:
```js
const healthTimer = setInterval(async () => {
  try {
    await pb.health.check();
    setPbOnline(true);
  } catch {
    setPbOnline(false);
  }
}, 10_000);
// clear in useEffect cleanup: clearInterval(healthTimer)
```

---

### Seed data gets pushed to PB with stale IDs after a version bump

**Symptom:** After bumping `STORE_VERSION` to clear localStorage, the app tries to seed PocketBase from the freshly-wiped local store — but gets the seed defaults, not the user's real data. Or vice versa: the old localStorage IDs differ from the updated seed IDs and cause 404s on update.

**Cause:** The version wipe clears all localStorage keys including `settings`, which contains `syncMode` and `pbUrl`. After the wipe, `isPB` becomes `false` (no URL), so PB mode is skipped entirely on reload.

**Fix:** Before wiping localStorage on a version bump, read and preserve `syncMode` and `pbUrl` from the old settings, then write them back after the wipe:
```js
const old = JSON.parse(localStorage.getItem("settings") ?? "{}");
localStorage.clear(); // wipe everything
localStorage.setItem("settings", JSON.stringify({
  ...DEFAULT_SETTINGS,
  syncMode: old.syncMode ?? "local",
  pbUrl: old.pbUrl ?? "",
}));
```
