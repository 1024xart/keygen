# SEQUENCE / art by 1024x

An art site with a scrolling field of glowing thumbnails, dithered depth-map backgrounds, draggable panels, and a keygen interaction.

## Run

From this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. For production, run `npm.cmd run build`, then `npm.cmd run start`. On macOS/Linux use `npm`.

## Current content

- Three artworks: if_looks_could_shimmer, empty_space, this_was_my_first_attempt.
- Six temporary study icons reuse those artworks for testing scroll and activation.
- Seven stock backgrounds in the brutalist nature collection. Excluded photo IDs stay excluded during imports.

Generate a key in sequence.exe, paste it into the matching piece, register it, then patch in the keygen. Generation is immediate; patching runs a progress bar before revealing the artwork. This is a theatrical client-side gate, not DRM.

Panels open centered and can be dragged by their handles. Background clicks dismiss them; reopening preserves the current key. Opening the keygen starts its soundtrack; the speaker toggles music and closing stops it. Holding empty background amplifies the depth distortion. Reduced-motion preferences disable scene animation; original artwork GIFs remain animated.

## Files

- `src/app/`: route, metadata, global styles.
- `src/features/desktop/`: scene, icon layout, panels, signature and background configuration.
- `src/features/keygen/`: key generation and patching UI.
- `src/features/releases/`: artwork catalog, registration storage and viewer.
- `public/art/`: original GIFs and small thumbnail previews.
- `public/identity/`, `public/audio/`, `public/cursors/`, `public/fonts/`: current site assets.
- `public/wallpapers/`: fallback backgrounds, active stock collection, depth maps and credits.
- `scripts/`: stock imports, depth-map generation and checks.

To change artwork names/files, edit `src/features/releases/catalog.ts`. Keep internal IDs stable to retain saved keys. Icon positions are in `src/features/desktop/Desktop.tsx`.

See [BACKGROUNDS.md](BACKGROUNDS.md) for adding backgrounds or importing a category. `.env.local` stores the private Pexels key and is excluded from Git. Optional depth tooling and its model cache live in ignored `.artifacts/depth-tools/`; they are not shipped to visitors.

## Checks

```powershell
npm.cmd run test:stock
npm.cmd run build
# With the server running:
npm.cmd run test:browser
```

Browser checks use installed Chrome/Edge, a disposable profile, and screenshots in ignored `.artifacts/`. Override `CHROME_PATH` or `TEST_URL` as needed. Build performs lint/type checks.

Patches persist under `seq_patches_v3`; generated keys use `sequence:key:*`. Storage events synchronize licenses across tabs.

[W95FA](https://www.dafont.com/w95fa.font) is bundled with its supplied SIL Open Font License in `public/fonts/`. Background sources are credited in [CREDITS.md](public/wallpapers/CREDITS.md) and the stock manifest.
