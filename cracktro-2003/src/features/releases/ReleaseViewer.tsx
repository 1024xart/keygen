"use client";
/* eslint-disable @next/next/no-img-element -- Preserve original animated artwork. */
import { useState } from "react";
import { getRelease, type ReleaseId } from "./catalog";
export default function ReleaseViewer({ id }: { id: ReleaseId }) {
  const release = getRelease(id);
  const [error, setError] = useState("");
  return (
    <figure className="art-piece">
      <div className="art-stage">
        <img
          src={release.file}
          alt={release.title + " animated artwork"}
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
