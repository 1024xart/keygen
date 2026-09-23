import imported from "./background-imports.json";
export type Background = {
  id: string;
  src: string;
  depth: string;
  credit?: { photographer: string; url: string };
};
// Backgrounds are separate from the locked artwork files.
const originals: Background[] = [
  {
    id: "forest",
    depth: "/wallpapers/depth/forest.png",
    src: "/wallpapers/forest.jpg",
  },
  {
    id: "lake",
    depth: "/wallpapers/depth/lake.png",
    src: "/wallpapers/lake.jpg",
  },
  {
    id: "hills",
    depth: "/wallpapers/depth/hills.png",
    src: "/wallpapers/sequence-desktop.jpg",
  },
];
const stock = imported as {
  activeCategory: string | null;
  images: (Background & { category: string })[];
};
const active = stock.images.filter(
  (image) => image.category === stock.activeCategory,
);
export const backgrounds: Background[] = active.length ? active : originals;

export function chooseBackground(
  previous: string | null,
  random = Math.random(),
) {
  const alternatives = backgrounds.filter(
    (background) => background.id !== previous,
  );
  const candidates = alternatives.length ? alternatives : backgrounds;
  return candidates[
    Math.min(candidates.length - 1, Math.floor(random * candidates.length))
  ];
}
