"use client";
/* eslint-disable @next/next/no-img-element -- Preserve original animated artwork. */
import { useState } from "react";
import { getRelease, type ReleaseId } from "./catalog";
import { registerRelease, useLicenses } from "./licenses";
export default function ReleaseViewer({ id }: { id: ReleaseId }) {
  const release = getRelease(id);
  const license = useLicenses()[id];
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  if (!license)
    return (
      <form
        className="license-entry"
        onSubmit={(event) => {
          event.preventDefault();
          if (!registerRelease(id, key)) setError("Invalid license key.");
        }}
      >
        <div className="activation-heading">
          <span className="edition-label">SEQUENCE / {release.number}</span>
          <span className="activation-step">01 / LICENSE</span>
        </div>
        <div className="activation-title">
          <strong className="release-title-text">{release.title}</strong>
          <span>LOCKED</span>
        </div>
        <p className="activation-intro">Enter your license key for {release.title}.</p>
        <label htmlFor={id + "-license"}>License key</label>
        <input
          id={id + "-license"}
          value={key}
          onChange={(event) => {
            setKey(event.target.value);
            setError("");
          }}
          placeholder="XXXX-XXXX-XXXX"
          aria-describedby={id + "-status"}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <div className="license-actions">
          <button type="submit">Register key</button>
        </div>
        <p id={id + "-status"} className="activation-feedback" role="status">
          {error || "Awaiting license."}
        </p>
      </form>
    );
  if (!license.patched)
    return (
      <div className="license-entry patch-required">
        <div className="activation-heading">
          <span className="edition-label">SEQUENCE / {release.number}</span>
          <span className="activation-step">02 / PATCH</span>
        </div>
        <div className="activation-title">
          <strong className="release-title-text">{release.title}</strong>
          <span className="license-accepted">REGISTERED</span>
        </div>
        <h2>
          License accepted.
          <br />
          <span>Patch required.</span>
        </h2>
      </div>
    );
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
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
