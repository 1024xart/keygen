"use client";
/* eslint-disable @next/next/no-img-element -- Keep original animated banner. */
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { releases, getRelease, type ReleaseId } from "../releases/catalog";
import { patchRelease, rememberKey, canPatch } from "../releases/licenses";
import { makeSerial } from "./serial";

type Props = {
  initialRelease: ReleaseId;
  onLaunch: (id: ReleaseId) => void;
  sound: boolean;
  onToggleSound: () => void;
  onExit: () => void;
};

export default function Keygen({
  initialRelease,
  onLaunch,
  sound,
  onToggleSound,
  onExit,
}: Props) {
  const [target, setTarget] = useState(initialRelease);
  const targetTitle = getRelease(target).title;
  const [alias, setAlias] = useState("anonymous");
  const [serial, setSerial] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "patching" | "ready" | "unlocked"
  >("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  function reset() {
    setSerial("");
    setProgress(0);
    setPhase("idle");
    setMessage("");
  }
  function generate() {
    if (phase === "patching") return;
    const result = makeSerial(target, alias.trim() || "anonymous");
    rememberKey(target, result, alias);
    setSerial(result);
    setProgress(0);
    setPhase("ready");
    setMessage("");
  }
  function patch() {
    if (phase !== "ready") return;
    if (!canPatch(target, serial, alias)) {
      setMessage(`Enter this key in ${targetTitle} before patching.`);
      return;
    }
    setPhase("patching");
    setProgress(0);
    setMessage("");
    let step = 0;
    timer.current = setInterval(() => {
      step++;
      setProgress(Math.round((step / 20) * 100));
      if (step < 20) return;
      clearInterval(timer.current!);
      timer.current = null;
      const result = patchRelease(target, serial, alias);
      if (!result.ok) {
        setPhase("ready");
        setProgress(0);
        setMessage("License changed. Register the key again.");
        return;
      }
      setPhase("unlocked");
      if (!result.persisted)
        setMessage("Patched for this session. Local storage unavailable.");
      onLaunch(target);
    }, 90);
  }
  return (
    <div className="keygen">
      <div className="keygen-banner">
        <img src="/identity/banner.gif" alt="SEQUENCE-1024x animated banner" />
      </div>
      <div className="keygen-body">
        <div className="keygen-fields">
          <label htmlFor="release-select">Program:</label>
          <select
            id="release-select"
            value={target}
            disabled={phase === "patching"}
            onChange={(event) => {
              setTarget(event.target.value as ReleaseId);
              reset();
            }}
          >
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.title}
              </option>
            ))}
          </select>
          <label htmlFor="alias">Name:</label>
          <input
            id="alias"
            value={alias}
            maxLength={32}
            disabled={phase === "patching"}
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
              disabled={phase === "patching"}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                setSerial(event.target.value.toUpperCase());
                setPhase(event.target.value.trim() ? "ready" : "idle");
                setMessage("");
              }}
            />
            <button
              aria-label="Copy serial"
              disabled={phase !== "ready" && phase !== "unlocked"}
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
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="keygen-status" role="status">
          {message ||
            (phase === "idle"
              ? "Ready."
              : phase === "patching"
                ? "Patching..."
                : phase === "ready"
                  ? "Key generated."
                  : `${targetTitle} patched.`)}
        </div>
        <div className="keygen-actions">
          <button
            className="os-button"
            onClick={generate}
            disabled={phase === "patching" || phase === "unlocked"}
          >
            Generate
          </button>
          {phase === "unlocked" ? (
            <button
              className="os-button primary"
              onClick={() => onLaunch(target)}
            >
              Run {targetTitle}
            </button>
          ) : (
            <button
              className="os-button primary"
              disabled={phase !== "ready"}
              onClick={patch}
            >
              Patch
            </button>
          )}
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
