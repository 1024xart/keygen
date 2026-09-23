"use client";
/* eslint-disable @next/next/no-img-element -- Keep original animated banner. */
import { useState } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { makeSerial } from "./serial";

type Props = {
  sound: boolean;
  onToggleSound: () => void;
  onExit: () => void;
};

export default function Keygen({ sound, onToggleSound, onExit }: Props) {
  const [alias, setAlias] = useState("anonymous");
  const [serial, setSerial] = useState("");
  const [message, setMessage] = useState("");
  function reset() {
    setSerial("");
    setMessage("");
  }
  function generate() {
    setSerial(makeSerial("SEQUENCE", alias.trim() || "anonymous"));
    setMessage("Key generated.");
  }
  return (
    <div className="keygen">
      <div className="keygen-banner">
        <img src="/identity/banner.gif" alt="SEQUENCE-1024x animated banner" />
      </div>
      <div className="keygen-body">
        <div className="keygen-fields">
          <label htmlFor="release-select">Program:</label>
          <select id="release-select" disabled aria-label="Program">
            <option>No target loaded</option>
          </select>
          <label htmlFor="alias">Name:</label>
          <input
            id="alias"
            value={alias}
            maxLength={32}
            onChange={(event) => {
              setAlias(event.target.value);
              reset();
            }}
            spellCheck={false}
            autoComplete="off"
          />
          <label htmlFor="serial">Serial:</label>
          <div className="serial-output">
            <input
              id="serial"
              aria-label="Serial"
              value={serial}
              placeholder="---- ---- ----"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                setSerial(event.target.value.toUpperCase());
                setMessage("");
              }}
            />
            <button
              aria-label="Copy serial"
              disabled={!serial}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(serial);
                  setMessage("Copied.");
                } catch {
                  setMessage("Select the serial to copy it.");
                }
              }}
            >
              copy
            </button>
          </div>
        </div>
        <div
          className="patch-progress"
          role="progressbar"
          aria-label="Patch progress"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: "0%" }} />
        </div>
        <div className="keygen-status" role="status">
          {message || "No target loaded."}
        </div>
        <div className="keygen-actions">
          <button className="os-button" onClick={generate}>
            Generate
          </button>
          <button className="os-button primary" disabled>
            Patch
          </button>
          <button className="os-button" onClick={onExit}>
            Exit
          </button>
          <button
            className="os-button music-button"
            aria-label={sound ? "Mute keygen music" : "Play keygen music"}
            aria-pressed={sound}
            onClick={onToggleSound}
          >
            {sound ? (
              <Volume2 size={17} aria-hidden="true" />
            ) : (
              <VolumeOff size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
