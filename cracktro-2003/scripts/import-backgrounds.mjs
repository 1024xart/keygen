import { readFile, writeFile, mkdir, rename, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import sharp from "sharp";
import { findPhotos } from "./stock-photos.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  loadEnvFile(resolve(root, ".env.local"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const [category, countText = "6"] = process.argv.slice(2);
const count = Number(countText);
if (!category || !Number.isInteger(count) || count < 1 || count > 12) {
  console.error(
    'Usage: npm.cmd run backgrounds:import -- "rainy japan nights" 6 (count: 1-12)',
  );
  process.exit(1);
}
if (!process.env.PEXELS_API_KEY) {
  console.error(
    "Add PEXELS_API_KEY to .env.local first. Get a free key at https://www.pexels.com/api/",
  );
  process.exit(1);
}
const manifestPath = resolve(
  root,
  "src/features/desktop/background-imports.json",
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const photos = await findPhotos(category.trim(), process.env.PEXELS_API_KEY);
const existing = new Set(
  manifest.images
    .filter((image) => image.category === category.trim())
    .map((image) => image.photoId),
);
const excluded = new Set(manifest.excludedPhotoIds || []);
const candidates = photos.filter((photo) => !existing.has(photo.id) && !excluded.has(photo.id));
// Shuffle search matches so successive imports do not always pick the same order.
for (let i = candidates.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
}
const selected = candidates.slice(0, count);
if (!selected.length) {
  console.error(
    "No new landscape photos matched. Try a broader category. Existing backgrounds were kept.",
  );
  process.exit(1);
}
const { pipeline, env } =
  await import("../.artifacts/depth-tools/node_modules/@huggingface/transformers/dist/transformers.node.mjs");
env.cacheDir = resolve(root, ".artifacts/depth-tools/cache");
const estimator = await pipeline(
  "depth-estimation",
  "onnx-community/depth-anything-v2-small",
  { dtype: "fp32", device: "cpu" },
);
const folder = resolve(root, "public/wallpapers/stock");
await mkdir(folder, { recursive: true });
const slug =
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "world";
const added = [];
try {
  for (const photo of selected) {
    const id = slug + "-" + photo.id;
    const imagePath = resolve(folder, id + ".jpg");
    const depthPath = resolve(folder, id + "-depth.png");
    try {
      try {
        await access(imagePath);
        await access(depthPath);
      } catch {
        const url = new URL(photo.src.original);
        url.search = new URLSearchParams({
          auto: "compress",
          cs: "srgb",
          w: "1920",
        });
        const response = await fetch(url, {
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok)
          throw new Error("Download failed (HTTP " + response.status + ").");
        const image = Buffer.from(await response.arrayBuffer());
        if (image.byteLength > 30 * 1024 * 1024)
          throw new Error("Photo exceeds 30 MB.");
        await sharp(image)
          .rotate()
          .resize({ width: 1920, withoutEnlargement: true })
          .jpeg({ quality: 86 })
          .toFile(imagePath);
        const { depth } = await estimator(imagePath);
        await sharp(Buffer.from(depth.data), {
          raw: {
            width: depth.width,
            height: depth.height,
            channels: depth.channels,
          },
        })
          .resize({ width: 1024 })
          .blur(0.7)
          .png()
          .toFile(depthPath);
      }
      added.push({
        id,
        src: "/wallpapers/stock/" + id + ".jpg",
        depth: "/wallpapers/stock/" + id + "-depth.png",
        category: category.trim(),
        photoId: photo.id,
        credit: { photographer: photo.photographer, url: photo.url },
        importedAt: new Date().toISOString(),
        license: "https://www.pexels.com/license/",
      });
      console.log("Prepared photo " + photo.id + " by " + photo.photographer);
    } catch (error) {
      console.error("Skipped photo " + photo.id + ": " + error.message);
    }
  }
  if (!added.length)
    throw new Error("No photos were prepared. Existing backgrounds were kept.");
  const next = {
    ...manifest,
    activeCategory: category.trim(),
    images: [...manifest.images, ...added],
  };
  await writeFile(manifestPath + ".tmp", JSON.stringify(next, null, 2) + "\n");
  await rename(manifestPath + ".tmp", manifestPath);
  console.log(
    "Added " +
      added.length +
      " backgrounds. Active world: " +
      category.trim() +
      ". Rebuild/restart the production site to use them.",
  );
} finally {
  await estimator.dispose();
}
