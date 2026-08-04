# Doomsday Archive

Two offline apps styled as a government containment OS ("Data Containment
Initiative"), built for when the grid goes down: ALL wifi and online services
can be dead and everything here still works.

- **Doomsday Archive** (host): runs on the PC that owns the storage. Link
  whole hard drives, SSDs, or external storage; the vault serves them in
  full over the local wire.
- **Doomsday Field Terminal** (client): runs on every other PC in the house.
  Finds the host automatically (UDP broadcast, no config), requests
  clearance, then browses and retrieves files.

Phones and machines without the client app can still use the browser portal
at `http://<host-ip>:8737`.

No internet. No accounts. No cloud. Ever.

## Features

- Government terminal aesthetic: green phosphor CRT, world map, DCI seal
- ReactBits components (vendored offline): DecryptedText, LetterGlitch,
  TextType, FaultyTerminal, ASCIIText, LineSidebar
- Boot sequence with "WELCOME BACK, <PC NAME>" decryption animation, no login,
  and a CRT power-off animation on close
- Full-drive vault: link any number of whole drives or folders
- Zero-config discovery: field terminals find the host over UDP broadcast
- Host approval flow: every device must be granted clearance in DEVICES,
  and can be revoked at any time
- Works with zero internet: ethernet + switch, direct PC-to-PC cable, or the
  host's Windows Mobile hotspot
- Field downloads land in Downloads/Doomsday Archive with progress toasts
- Bundled CC0 sounds and OFL fonts so everything runs offline

## Dev

```bash
npm install
npm run dev          # host app
npm run dev:client   # field terminal
npm run dev:both     # both at once (great for testing approval flow)
```

## Build the Linux packages

```bash
npm run dist         # both apps
npm run dist:host    # Doomsday-Archive-Setup-x.y.z.AppImage / .deb / .tar.gz
npm run dist:client  # Doomsday-Field-Terminal-Setup-x.y.z.AppImage / .deb / .tar.gz
```

Output lands in `release/`. Packaging must run on Linux: AppImage needs
symlinks and tar.gz needs exec bits, neither of which survive a Windows host.
The Build Linux workflow does it on an Ubuntu runner and attaches the packages
to a published release.

## Connecting without wifi

1. Ethernet: plug devices into the same router or switch. Internet service is
   not needed.
2. Hotspot: Windows Settings > Network > Mobile hotspot on the host PC, then
   join it from phones/laptops and browse to the uplink address.
3. Direct cable: one ethernet cable between two PCs works too.

## Asset credits

See `public/assets/CREDITS.md` (Kenney CC0 sounds, OFL fonts, public domain
map).
