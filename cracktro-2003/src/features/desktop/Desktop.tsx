"use client";
/* eslint-disable @next/next/no-img-element -- Original desktop icons. */
import { useRef, useState, type CSSProperties } from "react";
import Window from "./Window";
import PixelIcon from "./PixelIcon";
import Scene from "./Scene";
import { Readme } from "./Readme";
import Keygen from "../keygen/Keygen";
import ReleaseViewer from "../releases/ReleaseViewer";
import { releases, type ReleaseId } from "../releases/catalog";

type AppId = ReleaseId | "keygen" | "readme";
type OpenApp = { id: AppId; minimized: boolean; z: number };
const utilityTitles = {
  keygen: "sequence.exe",
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
  kind?: "text" | "paint" | "disk";
  image?: string;
  color?: string;
}[] = [
  {
    id: "keygen",
    x: 22,
    y: 72,
    depth: 1.3,
    image: "/identity/banner.gif",
  },
  { id: "TR01", x: 24, y: 25, depth: 0.75, image: "/art/thumbnails/TR01.webp" },
  {
    id: "BMR08",
    x: 73,
    y: 31,
    depth: 1.1,
    image: "/art/thumbnails/BMR08.webp",
  },
  { id: "BR09", x: 62, y: 73, depth: 0.6, image: "/art/thumbnails/BR09.webp" },
  { id: "readme", x: 53, y: 13, depth: 0.65, kind: "text" },
  { id: "ST04", x: 28, y: 112, depth: 0.7, image: "/art/thumbnails/TR01.webp" },
  { id: "ST05", x: 76, y: 127, depth: 1, image: "/art/thumbnails/BMR08.webp" },
  { id: "ST06", x: 48, y: 155, depth: 0.8, image: "/art/thumbnails/BR09.webp" },
  { id: "ST07", x: 19, y: 179, depth: 1.1, image: "/art/thumbnails/TR01.webp" },
  { id: "ST08", x: 79, y: 195, depth: 0.6, image: "/art/thumbnails/BMR08.webp" },
  { id: "ST09", x: 44, y: 220, depth: 0.9, image: "/art/thumbnails/BR09.webp" },
];

export default function Desktop() {
  const [apps, setApps] = useState<OpenApp[]>([]);
  const [target, setTarget] = useState<ReleaseId>("TR01");
  const [keygenSession, setKeygenSession] = useState(0);
  const [sound, setSound] = useState(false);
  const [soundMessage, setSoundMessage] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const muted = useRef(false);
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
  function playSound() {
    const player = audio.current;
    if (!player) return;
    player.volume = 0.45;
    void player
      .play()
      .then(() => setSoundMessage(""))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setSoundMessage("Audio stopped. Press music to retry.");
      });
  }
  function openKeygen(id?: ReleaseId) {
    if (id && !apps.some((app) => app.id === "keygen")) {
      setTarget(id);
      setKeygenSession((session) => session + 1);
    }
    if (!muted.current) playSound();
    launch("keygen");
  }
  function close(id: AppId) {
    if (id === "keygen" && audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
    }
    setApps((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, minimized: true } : entry,
      ),
    );
  }
  function toggleSound() {
    if (sound) {
      muted.current = true;
      audio.current?.pause();
    } else {
      muted.current = false;
      playSound();
    }
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
      <audio
        ref={audio}
        src="/audio/keygen.mp3"
        loop
        preload="auto"
        onPlay={() => setSound(true)}
        onPause={() => setSound(false)}
        onError={() => {
          setSound(false);
          setSoundMessage("keygen.mp3 could not be loaded.");
        }}
      />
      <Scene>
        {icons.map((icon) => (
          <button
            key={icon.id}
            className="scene-icon"
            aria-label={
              icon.id === "keygen"
                ? "Run SEQUENCE"
                : `Open ${appTitle(icon.id)}`
            }
            style={
              {
                left: `${icon.x}%`,
                top: `${icon.y}svh`,
                "--depth": icon.depth,
              } as CSSProperties
            }
            onClick={() =>
              icon.id === "keygen" ? openKeygen() : launch(icon.id)
            }
          >
            <span className="scene-icon-picture">
              {icon.image ? (
                <img src={icon.image} alt="" />
              ) : (
                <PixelIcon kind={icon.kind!} color={icon.color} />
              )}
            </span>
            <span className="scene-icon-label">{appTitle(icon.id).toLowerCase()}</span>
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
          kind={
            app.id === "keygen"
              ? "keygen"
              : app.id === "readme"
                ? "readme"
                : "art"
          }
          wide={releases.some((release) => release.id === app.id)}
          onFocus={() => focus(app.id)}
          onClose={() => close(app.id)}
          onMinimize={() =>
            setApps((current) =>
              current.map((entry) =>
                entry.id === app.id ? { ...entry, minimized: true } : entry,
              ),
            )
          }
        >
          {app.id === "keygen" ? (
            <Keygen
              key={keygenSession}
              initialRelease={target}
              sound={sound}
              onToggleSound={toggleSound}
              onExit={() => close("keygen")}
              onLaunch={launch}
            />
          ) : app.id === "readme" ? (
            <Readme />
          ) : (
            <ReleaseViewer id={app.id} />
          )}
        </Window>
      ))}
      {soundMessage && (
        <div className="sound-notice" role="status">
          {soundMessage}
          <button
            aria-label="Dismiss audio message"
            onClick={() => setSoundMessage("")}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
