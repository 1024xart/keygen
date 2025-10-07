// KeygenWin98Panel.tsx — dark early-Windows keygen + music (TS-safe, silent autoplay)
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from "react";

const BANNER_URL = "/banner.gif";
const VERSION = "v0.2.0";
const MUSIC_TARGET_VOL = 0.45; // 0..1

type Props = {
  /** Change this (e.g. Date.now()) when opening from desktop to force a fresh fade-in */
  openTrigger?: number;
  /** When true, disables the fullscreen black wrapper so it can sit on the faux desktop */
  embedded?: boolean;
  /** Called when the user clicks Exit — parent decides to close/hide the window */
  onExit?: () => void;
};

// deterministic serial (art only)
function hash32(str: string, salt = 0) {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}
function makeSerial(program: string, request: string) {
  const base = `${program.trim().toUpperCase()}::${request.trim().toUpperCase()}`;
  const h = hash32(base, 0x5EA1);
  const a = (h & 0xffff).toString(16).padStart(4, "0");
  const b = ((h >>> 16) & 0xffff).toString(16).padStart(4, "0");
  const c = Math.abs(h).toString(36).slice(0, 4).toUpperCase();
  return `${a}-${b}-${c}`.toUpperCase();
}
function makePlaceholder() {
  const ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const g = () =>
    Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
  return `${g()}-${g()}-${g()}`;
}

export default function KeygenWin98Panel({ openTrigger, embedded, onExit }: Props) {
  const PANEL_WIDTH = 820;

  // Inputs
  const [program, setProgram] = useState("");
  const [request, setRequest] = useState("");
  const activation = useMemo(
    () => (request ? makeSerial(program, request) : ""),
    [program, request]
  );

  // Copy + serial flicker
  const [copied, setCopied] = useState(false);
  const [serialView, setSerialView] = useState("");
  function flicker(to: string) {
    if (!to) return;
    const HEX = "0123456789ABCDEF";
    let i = 0;
    const steps = 12;
    const id = setInterval(() => {
      const scrambled = to
        .split("")
        .map((c) => (c === "-" ? "-" : HEX[Math.floor(Math.random() * HEX.length)]))
        .join("");
      setSerialView(scrambled);
      if (++i >= steps) {
        clearInterval(id);
        setSerialView(to);
      }
    }, 45);
  }
  useEffect(() => {
    setSerialView("");
  }, [activation]);

  // Progress
  const [patching, setPatching] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!patching) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + 6 + Math.floor(Math.random() * 10));
        if (n >= 100) {
          clearInterval(id);
          setPatching(false);
        }
        return n;
      });
    }, 120);
    return () => clearInterval(id);
  }, [patching]);

  // Banner auto-height
  const innerWidth = PANEL_WIDTH - 28;
  const [bannerH, setBannerH] = useState<number>(160);
  useEffect(() => {
    const img = new Image();
    img.src = BANNER_URL;
    img.onload = () => setBannerH(Math.round((img.height / img.width) * innerWidth));
  }, [innerWidth]);

  // About modal
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutBtnRef = useRef<HTMLButtonElement | null>(null);
  const okRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aboutOpen) setAboutOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen]);
  useEffect(() => {
    if (aboutOpen) setTimeout(() => okRef.current?.focus(), 0);
    else setTimeout(() => aboutBtnRef.current?.focus(), 0);
  }, [aboutOpen]);

  // --- music (safe fade) ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const fadeRAF = useRef<number | null>(null);
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const setSafeVolume = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = clamp01(+v || 0);
  };
  const cancelFade = () => {
    if (fadeRAF.current) {
      cancelAnimationFrame(fadeRAF.current);
      fadeRAF.current = null;
    }
  };
  function fadeTo(target: number, ms = 800) {
    const a = audioRef.current;
    if (!a) return;
    cancelFade();
    const start = clamp01(a.volume || 0);
    const goal = clamp01(target);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const next = start + (goal - start) * k;
      setSafeVolume(Number(next.toFixed(4)));
      if (k < 1) fadeRAF.current = requestAnimationFrame(step);
      else fadeRAF.current = null;
    };
    fadeRAF.current = requestAnimationFrame(step);
  }

  // try to autoplay on mount (will resume on first interaction if blocked)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = true;
    el.preload = "auto";
    el.muted = false;
    setSafeVolume(0);

    const tryPlay = () => {
      const a = audioRef.current;
      if (!a) return Promise.resolve();
      return a
        .play()
        .then(() => {
          fadeTo(MUSIC_TARGET_VOL, 900);
        })
        .catch(() => {
          const onInteract = () => {
            const b = audioRef.current;
            if (!b) return;
            b.play()
              .then(() => {
                setSafeVolume(MUSIC_TARGET_VOL);
              })
              .catch(() => {});
            window.removeEventListener("pointerdown", onInteract);
            window.removeEventListener("keydown", onInteract);
          };
          window.addEventListener("pointerdown", onInteract);
          window.addEventListener("keydown", onInteract);
        });
    };

    void tryPlay();

    return () => {
      cancelFade();
      const a = audioRef.current;
      if (a) a.pause();
    };
  }, []);

  // when opened from desktop, force a fresh play + fade
  useEffect(() => {
    if (!openTrigger) return;
    const a = audioRef.current;
    if (!a) return;
    a.muted = false;
    setSafeVolume(0);
    a.play()
      .then(() => fadeTo(MUSIC_TARGET_VOL, 700))
      .catch(() => {});
  }, [openTrigger]);

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    cancelFade();
    if (a.paused) {
      void a.play();
    }
    a.muted = !a.muted;
    setMuted(a.muted);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toCopy = serialView || activation;

  return (
    <div className={embedded ? "wrap embed" : "wrap"}>
      <div className="panel" style={{ width: PANEL_WIDTH }}>
        {/* Hidden audio element */}
        <audio ref={audioRef} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}>
          <source src="/keygen.mp3" type="audio/mpeg" />
          <source src="/keygen.ogg" type="audio/ogg" />
        </audio>

        {/* Banner */}
        <div className="banner" style={{ height: bannerH }}>
          <img src={BANNER_URL} alt="" className="bannerImg" />
        </div>

        {/* Program */}
        <div className="field">
          <label>Program :</label>
          <select
            className={`select sunken ${program ? "" : "placeholder"}`}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="" disabled hidden>
              Select…
            </option>
            <option value="Application 1">Application 1</option>
            <option value="Application 2">Application 2</option>
            <option value="Application 3">Application 3</option>
          </select>
        </div>

        {/* Request (optional) */}
        <div className="field">
          <label>Request (optional) :</label>
          <input
            className="input sunken"
            placeholder="Paste Request here (optional)"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
        </div>

        {/* Activation */}
        <div className="field">
          <label>Activation :</label>
          <div className="activationRow">
            <div className="serialBox sunken">
              <span className="serial">{serialView || activation || ""}</span>
            </div>
            <button
              className="btn copyBtn"
              disabled={!toCopy}
              onClick={() => {
                if (!toCopy) return;
                navigator.clipboard.writeText(toCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 900);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="progress sunken">
          <div className="bar" style={{ width: `${progress}%` }} />
        </div>
        {(patching || progress === 100) && (
          <div className="status">{patching ? `Patching… ${progress}%` : "Patch successful."}</div>
        )}

        {/* Buttons — About (small) + Mute icon */}
        <div className="buttons">
          <button
            className="btn"
            onClick={() => {
              const target = request ? activation : makePlaceholder();
              flicker(target);
            }}
          >
            Generate
          </button>
          <button className="btn" onClick={() => { setProgress(0); setPatching(true); }}>
            Patch
          </button>

          {/* Exit now calls parent; no reload */}
          <button
            className="btn"
            onClick={() => {
              if (typeof onExit === "function") onExit();
            }}
            title="Close SEQUENCE"
          >
            Exit
          </button>

          <button className="btn btnSmall" ref={aboutBtnRef} onClick={() => setAboutOpen(true)}>
            About
          </button>

          <button
            className="iconBtn"
            onClick={toggleMute}
            aria-pressed={!muted}
            title={muted ? "Sound off (M)" : "Sound on (M)"}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 10v4h4l5 4V6L7 10H3zM19.1 12l2.5-2.5L20.2 8l-2.5 2.5L15.2 8l-1.4 1.5 2.5 2.5-2.5 2.5 1.4 1.5 2.5-2.5L20.2 16l1.4-1.5L19.1 12z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z" />
                <path fill="currentColor" d="M16 8a5 5 0 010 8l-1.2-1.6a3 3 0 000-4.8L16 8z" />
                <path
                  fill="currentColor"
                  d="M18.5 5.5a9 9 0 010 13l-1.3-1.6a7 7 0 000-9.8l1.3-1.6z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Strapline */}
        <div className="strap">BECOME PART OF THE SEQUENCE</div>

        {/* About modal */}
        {aboutOpen && (
          <div className="modalOverlay" onClick={() => setAboutOpen(false)}>
            <div
              className="modalWindow"
              role="dialog"
              aria-modal="true"
              aria-labelledby="aboutTitle"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="titleBar">
                <span id="aboutTitle">About</span>
                <button className="titleClose" aria-label="Close" onClick={() => setAboutOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modalBody">
                <pre className="nfo">{String.raw`
 _  ___ ____  _  _        SEQUENCE-1024x
/ |/ _ \___ \| || |__  __ ${VERSION}    
| | | |__) | | || |\ \/ /  
| | |_| / __/|__   _>  < 
|_|\___/_____|  |_|/_/\_\   
                `.trim()}</pre>
                <div className="modalButtons">
                  <button className="btn modalOk" ref={okRef} onClick={() => setAboutOpen(false)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #000;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        /* Embedded mode: remove fullscreen background & centering */
        .wrap.embed {
          min-height: 0;
          background: transparent;
          display: block;
          padding: 0;
        }

        /* Panel (dark) */
        .panel {
          background: #0f0f0f;
          color: #e6e6e6;
          position: relative;
          box-shadow: 0 0 0 1px #222, 0 16px 64px rgba(0, 0, 0, 0.7);
          padding: 14px;
          box-sizing: border-box;
          font: 11px Tahoma, "MS Sans Serif", Verdana, sans-serif;
          overflow: hidden;
        }

        /* Banner frame (dark bevel) */
        .banner {
          border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #666, 0 0 0 1px #000;
          background: #000;
          margin-bottom: 10px;
          position: relative;
        }
        .banner::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(60% 120% at 0% 50%, rgba(182, 103, 255, 0.1), transparent 60%),
            radial-gradient(40% 100% at 100% 40%, rgba(91, 47, 176, 0.12), transparent 70%);
        }
        .bannerImg {
          width: 100%;
          height: 100%;
          object-fit: fill;
          object-position: left center;
          display: block;
        }

        /* Field blocks */
        .field {
          margin-bottom: 10px;
        }
        .field label {
          display: block;
          margin-bottom: 4px;
          color: #d8d8d8;
        }

        /* Inputs (dark) */
        .input,
        .select {
          width: 100%;
          height: 22px;
          padding: 0 6px;
          background: #111;
          color: #eaeaea;
          border: none;
          outline: none;
          font: 11px Tahoma, "MS Sans Serif";
          caret-color: #eaeaea;
        }
        .input::placeholder {
          color: #777;
        }
        .sunken {
          border: 1px solid #3a3a3a;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
        }
        .select.placeholder {
          color: #7a7a7a;
        }
        .select:not(.placeholder) {
          color: #eaeaea;
        }
        .select option[value=""] {
          color: #7a7a7a;
        }
        .select option {
          color: #eaeaea;
          background: #111;
        }

        /* Activation row */
        .activationRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .serialBox {
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          background: #111;
        }
        .serial {
          flex: 1;
          font: 13px "Lucida Console", Consolas, monospace;
          letter-spacing: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          color: #f0f0f0;
        }
        .copyBtn {
          min-width: 120px;
        }

        /* Progress (dark) */
        .progress {
          height: 18px;
          background: #1a1a1a;
          margin-top: 8px;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #5a5a5a;
        }
        .bar {
          height: 100%;
          background: linear-gradient(90deg, #5b2fb0, #b667ff);
        }
        .status {
          margin-top: 4px;
          color: #cfcfcf;
        }

        /* Buttons row — 3 main buttons + small About + icon mute */
        .buttons {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto auto;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
        .btn {
          height: 28px;
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          font: 11px Tahoma, "MS Sans Serif";
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          border-radius: 0;
        }
        .btn:focus,
        .btn:focus-visible {
          outline: none;
        }
        :global(button::-moz-focus-inner) {
          border: 0;
        }
        .btn:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform: translateY(1px);
        }
        .btnSmall {
          padding: 0 10px;
          min-width: 64px;
        }

        /* Icon mute button */
        .iconBtn {
          height: 28px;
          width: 32px;
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          display: grid;
          place-items: center;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          border-radius: 0;
          padding: 0;
        }
        .iconBtn:focus,
        .iconBtn:focus-visible {
          outline: none;
        }
        .iconBtn:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform: translateY(1px);
        }

        /* Strapline */
        .strap {
          margin-top: 12px;
          height: 32px;
          display: grid;
          place-items: center;
          position: relative;
          font: 11px Tahoma, "MS Sans Serif", Verdana, sans-serif;
          color: #e6e6e6;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 1px 1px 0 #000;
          background: #1a1a1a;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 -1px 0 #333,
            0 0 0 1px #333, 0 0 0 2px #000;
        }

        /* About modal (dark) */
        .modalOverlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: grid;
          place-items: center;
        }
        .modalWindow {
          width: 420px;
          background: #0f0f0f;
          color: #e6e6e6;
          box-shadow: 0 0 0 1px #333, 0 10px 40px rgba(0, 0, 0, 0.8);
          border: 1px solid #444;
        }
        .titleBar {
          background: #1a1aa6;
          color: #fff;
          padding: 4px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
        }
        .titleClose {
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          width: 22px;
          height: 18px;
          line-height: 16px;
          padding: 0;
          cursor: pointer;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
          -webkit-appearance: none;
          appearance: none;
          border-radius: 0;
        }
        .titleClose:focus,
        .titleClose:focus-visible {
          outline: none;
        }
        .titleClose:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
        }
        .modalBody {
          padding: 10px;
        }
        .nfo {
          margin: 0;
          padding: 8px;
          background: #0a0a0a;
          color: #d7d7d7;
          border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          font: 12px "Lucida Console", Consolas, monospace;
          white-space: pre-wrap;
        }
        .modalButtons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
        .modalOk {
          min-width: 120px;
        }
      `}</style>
    </div>
  );
}
