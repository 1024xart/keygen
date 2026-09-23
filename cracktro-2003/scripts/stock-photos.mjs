export const presets = {
  "brutalist nature": ["brutalist architecture nature", "abandoned concrete building", "overgrown abandoned architecture"],
  "rainy japan nights": [
    "japan rain night",
    "tokyo rainy street",
    "osaka night rain",
  ],
};
export function validatePhoto(photo) {
  if (
    !Number.isSafeInteger(photo?.id) ||
    photo.id < 1 ||
    !Number.isFinite(photo.width) ||
    !Number.isFinite(photo.height) ||
    photo.height < 1 ||
    photo.width < 1600 ||
    photo.width <= photo.height ||
    typeof photo.photographer !== "string"
  )
    return false;
  try {
    return (
      new URL(photo.src?.original).hostname === "images.pexels.com" &&
      new URL(photo.src.original).protocol === "https:" &&
      new URL(photo.url).hostname === "www.pexels.com" &&
      new URL(photo.url).protocol === "https:"
    );
  } catch {
    return false;
  }
}
export async function findPhotos(category, key, fetcher = fetch) {
  const queries = presets[category.toLowerCase()] || [category];
  const unique = new Map();
  for (const query of queries) {
    const url = new URL("https://api.pexels.com/v1/search");
    url.search = new URLSearchParams({
      query,
      orientation: "landscape",
      size: "large",
      per_page: "30",
    });
    const response = await fetcher(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Pexels rejected the API key."
          : "Photo search failed (HTTP " + response.status + ").",
      );
    const data = await response.json();
    if (!Array.isArray(data.photos))
      throw new Error("Unexpected photo-search response.");
    for (const photo of data.photos)
      if (validatePhoto(photo)) unique.set(photo.id, photo);
  }
  return [...unique.values()];
}
