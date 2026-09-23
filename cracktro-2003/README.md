# SEQUENCE — Independent Art Distribution

A fictional art distribution desktop. Open a release, generate a serial in SEQUENCE, apply it, and launch the original animated artwork. Unlocks are remembered in this browser. This is an artistic interaction, not DRM; media remains publicly accessible.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Visit http://localhost:3000. On macOS/Linux, use `npm` instead of `npm.cmd`.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
```

With the server running, `npm.cmd run test:browser` verifies the unlock journeys and mobile layout in headless Chrome or Edge. Set `CHROME_PATH` if your browser is installed elsewhere, and `TEST_URL` if using another port. Screenshots are saved in the ignored `.artifacts/` folder. This test uses a disposable browser profile and no added testing dependencies.

## Organization

- `src/app/` — route, metadata, global styles.
- `src/features/desktop/` — dithered scene, thumbnail icons, frameless overlays, and readme.
- `src/features/keygen/` — serial generation and the unlock interface.
- `src/features/releases/` — release catalog, saved licenses, and artwork viewer.
- `public/art/releases/` — original animated artworks.
- `public/art/archive/` — recovered artwork in the recycle bin.
- `public/identity/` — original keygen banner and desktop icons.
- `public/audio/` — original soundtrack.
- `public/wallpapers/` — local scene backgrounds and source credits.
- `scripts/` — browser verification.

## Add or update art

Put the original artwork in `public/art/releases/` and add its ID, file path, display title, version, and size in `src/features/releases/catalog.ts`. That catalog supplies the desktop files and keygen. Keep artist statements in the release content; the existing IDs and artwork have been preserved without inventing titles or dates.

## Interaction

- Each visit selects a background different from the previous one. Cursor movement shifts the scene and icons at different depths; reduced motion disables this.
- Open a release and enter the key copied from SEQUENCE. A valid license shows ?Patch required?; artwork remains unloaded.
- Generate ? copy into the program ? Activate ? return to SEQUENCE ? Patch. Patching before activation is rejected. A successful patch reveals the artwork while keeping the keygen open. Generation is immediate; the progress bar runs during patching.
- Drag the small handle above each object to move it; multiple objects can stay open together. Click the background to dismiss open objects, or use Escape/Close for the focused object. Reopening SEQUENCE preserves the generated key.
- Artwork opens directly on black without a surrounding frame.
- Opening SEQUENCE starts the original track directly from the opening click. The embedded music button mutes it. Minimizing keeps it playing; closing the keygen stops and resets it. An explicit mute is remembered for the session.
- On small screens, windows fit the viewport and their contents scroll.
- Interface animation honors reduced motion. Original artwork GIFs remain animated. Small static WebP previews are used for the scene icons.

## Persistence

Patches are stored under `seq_patches_v3`. Each record must have a matching program/name serial and an explicit patched flag. Old unlock records are left untouched but no longer grant access. Invalid records are ignored. If browser storage is unavailable, new unlocks work for the session and the interface explains that they could not be saved. Storage events synchronize unlocks across tabs. Existing `sequence/thoughts.txt` notes are retained.

## Cleanup

Replaced the old desktop/window implementations, duplicated demo wrappers and serial functions, placeholder activation stage, unused shadcn components and animation helpers. Removed unused Radix, Tailwind, Framer Motion, class utility dependencies, and a font module referencing missing files. W95FA is bundled locally, so builds and rendering do not require remote font requests. Original media is preserved in the organized public folders.

## Font

[W95FA](https://www.dafont.com/w95fa.font) by MadeByArne, obtained from the author?s DaFont distribution. The unmodified font and supplied SIL Open Font License are in `public/fonts/`.

## Backgrounds

Add local images to `public/wallpapers/` and entries to `src/features/desktop/backgrounds.ts`. The scene uses ordered dithering with WebGL and a Canvas fallback. Source credits are in `public/wallpapers/CREDITS.md`.

Each background now has a matching `depth` asset in its configuration. The WebGL shader samples this independent near/far map for cursor displacement and a subtle idle drift, rather than using photograph brightness. Reduced motion disables animation; Canvas fallback retains simple panning. Maps were generated offline with Depth Anything V2 Small; see wallpaper credits.

See [BACKGROUNDS.md](BACKGROUNDS.md) for adding photos, generating their depth maps, and changing the rotation.
