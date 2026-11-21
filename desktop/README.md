# SmileOS desktop app

A Windows / Mac / Linux app that opens your SmileOS server in its own window and lets **program links (bridges)** start local programs such as X-ray sensor software (Dexis, Sidexis, Carestream…), perio probes and ortho software with the selected patient.

## Build an installer

```bash
npm install
npm run icons        # makes build/icon.png from the SmileOS icon
npm run dist:win     # Windows installer (.exe) – run on Windows, or on Linux with Wine
npm run dist:mac     # macOS .dmg – must run on a Mac (sign + notarize for distribution)
npm run dist:linux   # Linux AppImage
```

Installers are written to `dist/`. On first start the app asks for the server address (e.g. `http://192.168.1.20:4000`). Change it later from the menu: **SmileOS → Change server…**

## Security

- The window only shows pages from the configured SmileOS server; other links open in the normal browser.
- Bridges can only be launched by the configured server, and only programs that exist on the computer.
