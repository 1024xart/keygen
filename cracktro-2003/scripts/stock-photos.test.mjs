import test from "node:test";
import assert from "node:assert/strict";
import { findPhotos, validatePhoto } from "./stock-photos.mjs";
const photo = {
  id: 123,
  width: 2400,
  height: 1600,
  photographer: "Artist",
  url: "https://www.pexels.com/photo/123/",
  src: { original: "https://images.pexels.com/photos/123/photo.jpg" },
};
test("accepts usable landscape photos and rejects malformed or unsafe sources", () => {
  assert(validatePhoto(photo));
  for (const altered of [
    { width: 900 },
    { width: 1000, height: 2000 },
    { width: undefined },
    { src: { original: "https://example.com/image.jpg" } },
    { url: "javascript:alert(1)" },
    { id: "../bad" },
  ])
    assert(!validatePhoto({ ...photo, ...altered }));
});
test("rainy Japan preset searches variants and deduplicates results", async () => {
  const calls = [];
  const found = await findPhotos(
    "rainy japan nights",
    "test-key",
    async (url, options) => {
      calls.push(url.searchParams.get("query"));
      assert.equal(options.headers.Authorization, "test-key");
      assert.equal(url.searchParams.get("orientation"), "landscape");
      return {
        ok: true,
        json: async () => ({
          photos: [photo, { ...photo, id: 456, width: 500 }],
        }),
      };
    },
  );
  assert.equal(calls.length, 3);
  assert.deepEqual(found, [photo]);
});
test("auth and malformed responses fail without revealing the key", async () => {
  await assert.rejects(
    findPhotos("night", "secret", async () => ({ ok: false, status: 401 })),
    /Pexels rejected the API key/,
  );
  await assert.rejects(
    findPhotos("night", "secret", async () => ({
      ok: true,
      json: async () => ({}),
    })),
    /Unexpected photo-search response/,
  );
});
