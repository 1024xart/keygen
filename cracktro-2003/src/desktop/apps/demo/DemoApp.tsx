"use client";

import React, { useMemo, useState } from "react";
import { setLicense, useLicense, type AppId } from "@/system/license";

type Props = {
  appId: AppId;          // "echo" | "glitch" | "bloom"
  name: string;          // UI label
  onClose?: () => void;  // optional close handler for DesktopShell
};

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

function getMachineId() {
  if (typeof window === "undefined") return "OFFLINE";
  const k = "seq_machine_id";
  let v = localStorage.getItem(k);
  if (!v) {
    const rnd = crypto.getRandomValues(new Uint32Array(3));
    const to4 = (n: number) => n.toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
    v = `${to4(rnd[0])}-${to4(rnd[1])}-${to4(rnd[2])}`;
    localStorage.setItem(k, v);
  }
  return v;
}

// Patch-revealed art per app (put your gifs in /public/media/demo/)
// NOTE: Partial so we don't have to list every AppId (e.g., "sequence")
const ART_MAP: Partial<Record<AppId, string>> = {
  echo:   "/media/demo/art2.gif",
  glitch: "/media/demo/art3.gif",
  bloom:  "/media/demo/art1.gif",
};

export default function DemoApp({ appId, name, onClose }: Props) {
  const { license } = useLicense(appId);
  const [code, setCode] = useState("");
  const req = useMemo(getMachineId, []);
  const expected = makeSerial(appId, req);

  const unlocked = !!license;                // has any license
  const patched  = !!license?.expiresAt;     // keygen Patch sets this

  return (
    <div className="win" role="dialog" aria-label={name}>
      <div className="titleBar">
        <span>{name}</span>
        {onClose && (
          <button className="titleClose" aria-label="Close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="body">
        {/* STAGE 1 — TRIAL (unchanged) */}
        {!unlocked && (
          <div className="trial">
            <div className="title">{name} — Trial</div>

            <div className="row">
              <label>Request:</label>
              <div className="req">{req}</div>
              <button
                className="btn btnWide"
                onClick={() => navigator.clipboard.writeText(req)}
                title="Copy request"
              >
                Copy
              </button>
            </div>

            <div className="row">
              <label>Activation:</label>
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code from SEQUENCE keygen"
              />
              <button
                className="btn btnWide"
                onClick={() => {
                  if (code.trim().toUpperCase() === expected) {
                    // IMPORTANT: do NOT set expiresAt here.
                    setLicense({
                      key: code.trim().toUpperCase(),
                      name,
                      appId,
                      issuedAt: Date.now(),
                    });
                  } else {
                    alert("Invalid activation code for this machine.");
                  }
                }}
              >
                Activate
              </button>
            </div>

            <div className="hint">
              Open <b>SEQUENCE.exe</b>, choose <b>{name}</b>, paste the Request, generate, then
              paste the code here.
            </div>
          </div>
        )}

        {/* STAGE 2 — ACTIVATED (NOT PATCHED): keep your existing “canvas” animation */}
        {unlocked && !patched && (
          <div className="full">
            <div className="badge">FULL VERSION</div>

            {/* your original animated canvas */}
            <div className="canvas">
              <div className="orb" />
              <div className="line" />
            </div>

            <div className="updateNotice">
              Update available. Open <b>SEQUENCE.exe</b> and press <b>Patch</b> for <b>{name}</b> to
              install the latest software update.
            </div>
          </div>
        )}

        {/* STAGE 3 — PATCHED: reveal GIF art */}
        {unlocked && patched && (
          <div className="full">
            <div className="badge">UPDATED</div>
            <img className="artMedia" src={ART_MAP[appId]} alt={`${name} artwork`} />
          </div>
        )}
      </div>

      <style jsx>{`
        .win {
          width: 600px;
          background: #0f0f0f;
          color: #e6e6e6;
          border: 1px solid #444;
          box-shadow: 0 0 0 1px #333, 0 12px 40px rgba(0, 0, 0, 0.8);
          display: grid;
          grid-template-rows: auto 1fr;
          font: 11px Tahoma, "MS Sans Serif", sans-serif;
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
        .titleClose:focus { outline: none; }
        .titleClose:active { box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; }

        .body { padding: 10px; }

        .title { font-weight: 700; margin-bottom: 8px; }

        .row {
          display: grid;
          grid-template-columns: 100px 1fr 110px;
          gap: 8px;
          align-items: center;
          margin: 8px 0;
        }
        .req {
          font: 12px "Lucida Console", Consolas, monospace;
          padding: 6px 8px;
          background: #0a0a0a;
          border: 1px solid #333;
          color: #d7d7d7;
        }
        .input {
          height: 24px;
          background: #111;
          color: #eaeaea;
          border: 1px solid #3a3a3a;
          padding: 0 8px;
        }
        .btn {
          height: 26px;
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          cursor: pointer;
          padding: 0 12px;
          white-space: nowrap;
        }
        .btnWide { min-width: 96px; }
        .btn:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform: translateY(1px);
        }
        .hint { color: #9a9a9a; margin-top: 6px; }

        .full { display: grid; gap: 10px; }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border: 1px solid #333;
          background: #0a0a0a;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          color: #b8ffcf;
        }
        .canvas {
          position: relative;
          height: 220px;
          background: #080808;
          border: 1px solid #333;
          box-shadow: inset 0 0 24px rgba(182, 103, 255, 0.2);
          overflow: hidden;
        }
        .orb {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle, #b667ff, #5b2fb0);
          animation: float 5.5s ease-in-out infinite;
          left: 20%;
          top: 30%;
        }
        .line {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #b667ff, transparent);
          animation: scan 2.2s linear infinite;
        }
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(160px, -30px) scale(1.06); }
          100% { transform: translate(0, 0); }
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .updateNotice {
          color: #dcdcdc;
        }

        .artMedia {
          max-width: 100%;
          height: auto;
          border: 1px solid #333;
          box-shadow: inset 0 0 24px rgba(182, 103, 255, 0.2);
          background: #080808;
        }

        @media (max-width: 560px) {
          .row { grid-template-columns: 1fr; }
          .row .btn { justify-self: start; }
        }
      `}</style>
    </div>
  );
}
