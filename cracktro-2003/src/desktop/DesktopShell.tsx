// src/desktop/DesktopShell.tsx
"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";

export default function DesktopShell() {
  const [open, setOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState<number | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false); // if you already added Taskbar

  // ESC closes the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="desktop"
      onMouseDown={() => (document.activeElement as HTMLElement | null)?.blur()}
      onClick={() => startOpen && setStartOpen(false)}
    >
      {/* icons column (top-left) */}
      <div className="icons">
        {/* NEW: Recycle Bin above SEQUENCE.exe */}
        <DesktopIcon
          label="Recycle Bin"
          iconSrc="/recycle-bin.png"     // put this file in /public
          onOpen={() => {
            // placeholder – we can wire a bin window later
          }}
        />

        <DesktopIcon
          label="SEQUENCE.exe"
          iconSrc="/sequence-icon.png"   // you already added this
          onOpen={() => {
            setOpen(true);
            setOpenTrigger(Date.now()); // triggers audio fade in app
          }}
        />
      </div>

      {/* frameless app layer */}
      {open && (
        <div className="layer" role="dialog" aria-label="SEQUENCE-1024x">
          <Cracktro2003Modern embedded openTrigger={openTrigger} onExit={() => setOpen(false)} />
        </div>
      )}

      <style jsx>{`
        .desktop {
          min-height: 100svh;
          background: #000 url("/wallpapers/sequence-desktop.jpg") center / cover no-repeat;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          user-select: none;
        }
        .icons {
          position: absolute;
          left: 18px;
          top: 18px;
          display: grid;
          grid-auto-rows: min-content;
          gap: 14px; /* vertical stack spacing */
        }
        /* centers the keygen panel with no extra chrome */
        .layer {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
  );
}
