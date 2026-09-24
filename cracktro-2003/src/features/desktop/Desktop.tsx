"use client";
/* eslint-disable @next/next/no-img-element -- Original desktop icons. */
import { useState, type CSSProperties } from "react";
import Window from "./Window";
import ReadmeIcon from "./ReadmeIcon";
import Scene from "./Scene";
import { Readme } from "./Readme";
import ReleaseViewer from "../releases/ReleaseViewer";
import { releases, type ReleaseId } from "../releases/catalog";

type AppId = ReleaseId | "readme";
type OpenApp = { id: AppId; minimized: boolean; z: number };
const utilityTitles = {
  readme: "readme.txt",
};
function appTitle(id: AppId) {
  const release = releases.find((entry) => entry.id === id);
  return release
    ? release.title
    : utilityTitles[id as keyof typeof utilityTitles];
}
const icons: {
  id: AppId;
  x: number;
  y: number;
  depth: number;
  image?: string;
}[] = [
  { id: "TR01", x: 24, y: 25, depth: 0.75, image: "/art/thumbnails/TR01.webp" },
  {
    id: "BMR08",
    x: 73,
    y: 31,
    depth: 1.1,
    image: "/art/thumbnails/BMR08.webp",
  },
  { id: "BR09", x: 62, y: 73, depth: 0.6, image: "/art/thumbnails/BR09.webp" },
  { id: "DS15", x: 82, y: 94, depth: 0.85, image: "/art/thumbnails/DS15.webp" },
  { id: "readme", x: 53, y: 13, depth: 0.65 },
  { id: "ST04", x: 28, y: 112, depth: 0.7, image: "/art/thumbnails/blackbar.webp" },
  { id: "ST05", x: 76, y: 127, depth: 1, image: "/art/thumbnails/blackbar.webp" },
  { id: "ST06", x: 48, y: 155, depth: 0.8, image: "/art/thumbnails/blackbar.webp" },
  { id: "ST07", x: 19, y: 179, depth: 1.1, image: "/art/thumbnails/blackbar.webp" },
  {
    id: "ST08",
    x: 79,
    y: 195,
    depth: 0.6,
    image: "/art/thumbnails/blackbar.webp",
  },
  { id: "ST09", x: 44, y: 220, depth: 0.9, image: "/art/thumbnails/blackbar.webp" },
];

export default function Desktop() {
  const [apps, setApps] = useState<OpenApp[]>([]);
  const active = apps
    .filter((app) => !app.minimized)
    .sort((a, b) => a.z - b.z)
    .at(-1)?.id;

  function launch(id: AppId) {
    setApps((current) => {
      const z = Math.max(0, ...current.map((app) => app.z)) + 1;
      return current.some((app) => app.id === id)
        ? current.map((app) =>
            app.id === id ? { ...app, minimized: false, z } : app,
          )
        : [...current, { id, minimized: false, z }];
    });
  }
  function focus(id: AppId) {
    setApps((current) => {
      const top = Math.max(0, ...current.map((app) => app.z));
      if (
        current.some((app) => app.id === id && app.z === top && !app.minimized)
      )
        return current;
      return current.map((app) =>
        app.id === id ? { ...app, minimized: false, z: top + 1 } : app,
      );
    });
  }
  function close(id: AppId) {
    setApps((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, minimized: true } : entry,
      ),
    );
  }

  return (
    <main
      className="desktop"
      onClick={(event) => {
        if (
          (event.target as HTMLElement).closest(".scene") &&
          !(event.target as HTMLElement).closest("button")
        ) {
          apps.filter((app) => !app.minimized).forEach((app) => close(app.id));
        }
      }}
    >
      <Scene>
        {icons.map((icon) => (
          <button
            key={icon.id}
            className="scene-icon"
            aria-label={`Open ${appTitle(icon.id)}`}
            style={
              {
                left: `${icon.x}%`,
                top: `${icon.y}svh`,
                "--depth": icon.depth,
              } as CSSProperties
            }
            onClick={() => launch(icon.id)}
          >
            <span className="scene-icon-picture">
              {icon.image ? <img src={icon.image} alt="" /> : <ReadmeIcon />}
            </span>
            <span className="scene-icon-label">
              {appTitle(icon.id).toLowerCase()}
            </span>
          </button>
        ))}
      </Scene>
      {apps.map((app) => (
        <Window
          key={app.id}
          title={appTitle(app.id)}
          active={active === app.id}
          minimized={app.minimized}
          order={app.z}
          kind={app.id === "readme" ? "readme" : "art"}
          onFocus={() => focus(app.id)}
          onClose={() => close(app.id)}
        >
          {app.id === "readme" ? (
            <Readme />
          ) : (
            <ReleaseViewer id={app.id} />
          )}
        </Window>
      ))}
    </main>
  );
}
