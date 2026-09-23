"use client";
/* eslint-disable @next/next/no-img-element -- Preserve original animated artwork. */
import { useEffect, useState } from "react";
import { getRelease, type ReleaseId } from "./catalog";
export default function ReleaseViewer({ id }: { id: ReleaseId }) {
  const release = getRelease(id);
  const [error, setError] = useState("");
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
    <figure className="art-piece">
      <div className="art-stage">
        <img
          src={release.file}
          alt={release.title + " animated artwork"}
          style={{ width: 1024 / pixelRatio }}
          onError={() => setError("Artwork could not load.")}
        />
      </div>
      <figcaption>
        <span>{release.title}</span>
        <span>{release.number} / SEQUENCE</span>
      </figcaption>
      {"description" in release && (
        <p className="art-description">{release.description}</p>
      )}
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
