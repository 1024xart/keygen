# Backgrounds

1. Put JPG, PNG, or WebP photos in `public/wallpapers/`. Landscape images around 1920 pixels wide work well.
2. Generate a matching depth map (near objects white, distant objects black). From this app directory:

```powershell
npm.cmd install --prefix .artifacts/depth-tools --no-audit --no-fund @huggingface/transformers@4.3.0
node scripts/generate-depth.mjs public/wallpapers/my-photo.jpg public/wallpapers/depth/my-photo.png
```

The first run downloads the model. It runs locally; the website only loads the finished images. The tools are already installed in this workspace.

3. Add an entry to `src/features/desktop/backgrounds.ts`:

```ts
{
  id: "my-photo",
  src: "/wallpapers/my-photo.jpg",
  depth: "/wallpapers/depth/my-photo.png",
},
```

Each visit chooses another entry. To replace an existing photo, replace its file and regenerate its depth map. Keep the photo and map aligned: identical crop and aspect ratio. Remove an entry from the array to stop showing it. Restart the production build/server after changing the list or files; development mode picks up changes automatically.

Moving the pointer distorts the depth layers. Holding on empty background amplifies that distortion after 150 ms; releasing eases it back. Reduced-motion preferences disable it.

## Import a world from stock photos

Create a free key at https://www.pexels.com/api/ and add it to the app's ignored `.env.local` file:

```dotenv
PEXELS_API_KEY=your_key_here
```

With the depth tools installed (above), run:

```powershell
npm.cmd run backgrounds:import -- "rainy japan nights" 6
```

Other category text works too, such as `empty train station night` or `foggy forest`. The rainy Japan preset searches several related terms. Search matches are candidates, not a guarantee of subject/location; review the prepared photos before deploying.

The importer downloads landscape photos, resizes them, generates depth maps locally, and records the photographer, source URL, and license. The site shows a photographer/Pexels link for each imported background, as required by the API guidelines. Photos are free to use under the Pexels license, not public domain.

Files go into `public/wallpapers/stock/`. The generated list and active category live in `src/features/desktop/background-imports.json`. Remove unwanted entries from `images`; set `activeCategory` to another imported category to switch worlds, or `null` to return to the original set. Existing images are retained when importing another world. A failed import never replaces the current list.

This is an on-demand preparation command, not a search on every visitor request. Run it again for more photos; repeated photo IDs within a category are skipped. Production requires a rebuild and restart after an import. The API key and model are never shipped to visitors.
