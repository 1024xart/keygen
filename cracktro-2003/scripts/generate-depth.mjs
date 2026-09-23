// Offline helper; install its optional tools using the command in BACKGROUNDS.md.
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "Usage: node scripts/generate-depth.mjs public/wallpapers/photo.jpg public/wallpapers/depth/photo.png",
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
try {
  const { depth } = await estimator(resolve(input));
  await mkdir(dirname(resolve(output)), { recursive: true });
  await sharp(Buffer.from(depth.data), {
    raw: { width: depth.width, height: depth.height, channels: depth.channels },
  })
    .resize({ width: 1024 })
    .blur(0.7)
    .png()
    .toFile(resolve(output));
  console.log("Saved " + resolve(output));
} finally {
  await estimator.dispose();
}
