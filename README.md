# Doomsday Archive

An offline, LAN-only file archive terminal styled as a government containment
OS ("Data Containment Initiative"). Built with Electron, Vite, and React.

No internet. No accounts. No cloud. The host PC serves an archive from a
linked hard drive, SSD, or external storage, and other devices in the house
connect over the local network and must be approved by the host.

## Features

- Government terminal aesthetic: green phosphor CRT, world map, DCI seal
- Boot sequence with "WELCOME BACK, <PC NAME>" animation (no login)
- Link any drive or folder as the vault; files are served read-only
- LAN uplink server: other devices open `http://<host-ip>:8737` in a browser
- Host approval flow: every device must be granted clearance in DEVICES
- Works with zero internet: ethernet + switch, direct PC-to-PC cable, or the
  host's Windows Mobile hotspot
- QR code for phones, live toasts for access requests and downloads
- Bundled CC0 sounds and OFL fonts so everything runs offline

## Dev

```bash
npm install
npm run dev
```

## Build the Windows installer

```bash
npm run dist
```

Output lands in `release/`.

## Connecting without wifi

1. Ethernet: plug devices into the same router or switch. Internet service is
   not needed.
2. Hotspot: Windows Settings > Network > Mobile hotspot on the host PC, then
   join it from phones/laptops and browse to the uplink address.
3. Direct cable: one ethernet cable between two PCs works too.

## Asset credits

See `public/assets/CREDITS.md` (Kenney CC0 sounds, OFL fonts, public domain
map).
