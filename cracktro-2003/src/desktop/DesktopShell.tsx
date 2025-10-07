"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Taskbar from "./Taskbar";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";

export default function DesktopShell() {
  const [open, setOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState<number | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false);

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
      onClick={() => startOpen && setStartOpen(false)} // click desktop closes Start
    >
      {/* icons column (top-left) */}
      <div className="icons">
        <DesktopIcon
          label="SEQUENCE.exe"
          iconSrc="/sequence-icon.png"
          onOpen={() => {
            setOpen(true);
            setOpenTrigger(Date.now());
            setStartOpen(false);
          }}
        />
      </div>

      {/* frameless app layer */}
      {open && (
        <div className="layer" role="dialog" aria-label="SEQUENCE-1024x">
          <Cracktro2003Modern
            embedded
            openTrigger={openTrigger}
            onExit={() => setOpen(false)} // <-- closes without reloading
          />
        </div>
      )}

      {/* taskbar */}
      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((v) => !v)}
      />

      <style jsx>{`
        .desktop {
          min-height: 100svh;
          background: #000 url("/wallpapers/sequence-desktop.jpg") center / cover no-repeat;
          position: relative; overflow: hidden; user-select: none;
          padding-bottom: 36px; /* keep content above taskbar if needed */
        }
        .icons {
          position: absolute; left: 18px; top: 18px;
          display: grid; grid-auto-rows: min-content; gap: 14px; z-index: 2;
        }
        .layer {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          z-index: 3;
        }
      `}</style>
    </div>
  );
}
