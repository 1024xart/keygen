"use client";
/* eslint-disable @next/next/no-img-element -- Preserve original animated artwork. */
import { useEffect, useState } from "react";
import { getRelease, type ReleaseId } from "./catalog";
export default function ReleaseViewer({ id }: { id: ReleaseId }) {
  const release = getRelease(id);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const images = "images" in release ? release.images : [release.file];
  const album = images.length > 1;
  const dimensions = "dimensions" in release ? release.dimensions[index] : null;
  function step(direction: number) {
    setIndex((current) => (current + direction + images.length) % images.length);
    setError("");
  }
  const [pixelRatio, setPixelRatio] = useState(1);
  useEffect(() => {
    let query: MediaQueryList;
    const update = () => {
      query?.removeEventListener("change", update);
      const ratio = window.devicePixelRatio || 1;
      setPixelRatio(ratio);
      query = window.matchMedia(`(resolution: ${ratio}dppx)`);
      query.addEventListener("change", update);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      query?.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <figure className={"art-piece" + (album ? " art-album" : "")}
      onKeyDown={(event) => {
        if (!album || (event.target as HTMLElement).closest(".piece-drag")) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          step(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="art-stage">
        <img
          src={images[index]}
          alt={release.title + (album ? ` — study ${index + 1}` : " artwork")}
          style={dimensions ? {
            width: `min(${dimensions[0] / pixelRatio}px, calc(100vw - 32px), calc((100svh - 140px) * ${dimensions[0] / dimensions[1]}))`,
            maxWidth: "none",
            maxHeight: "none",
          } : { width: 1024 / pixelRatio }}
          onError={() => setError("Artwork could not load.")}
        />
        {album && <>
          <button className="album-arrow album-previous" aria-label="Previous image" onClick={() => step(-1)}>&lsaquo;</button>
          <button className="album-arrow album-next" aria-label="Next image" onClick={() => step(1)}>&rsaquo;</button>
        </>}
      </div>
      <figcaption>
        <span>{release.title}</span>
        <span aria-live="polite">{album ? `${index + 1} / ${images.length}` : `${release.number} / SEQUENCE`}</span>
      </figcaption>
      {"description" in release && (
        <p className="art-description">{release.description}</p>
      )}
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
