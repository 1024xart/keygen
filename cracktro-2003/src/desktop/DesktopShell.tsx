"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";
import Taskbar from "./Taskbar";
import BinWindow, { type FileEntry } from "./windows/BinWindow";
import FilePreview from "./windows/FilePreview";

export default function DesktopShell() {
  const [open, setOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState<number | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false);

  // Recycle Bin
  const [binOpen, setBinOpen] = useState(false);
  const [binFiles] = useState<FileEntry[] | undefined>(undefined); // use BinWindow defaults
  const [previewing, setPreviewing] = useState<FileEntry | null>(null);

  // ESC closes the app window (not the preview; preview uses overlay click or ×)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewing) setPreviewing(null);
        else if (binOpen) setBinOpen(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewing, binOpen]);

  return (
    <div
      className="desktop"
      onMouseDown={() => (document.activeElement as HTMLElement | null)?.blur()}
      onClick={() => startOpen && setStartOpen(false)}
    >
      {/* icons column (top-left) */}
      <div className="icons">
        <DesktopIcon
          label="Recycle Bin"
          iconSrc="/recycle-bin.png"
          onOpen={() => setBinOpen(true)}
        />

        <DesktopIcon
          label="SEQUENCE.exe"
          iconSrc="/sequence-icon.png"
          onOpen={() => {
            setOpen(true);
            setOpenTrigger(Date.now());
          }}
        />
      </div>

      {/* keygen app */}
      {open && (
        <div className="layer" role="dialog" aria-label="SEQUENCE-1024x">
          <Cracktro2003Modern
            embedded
            openTrigger={openTrigger}
            onExit={() => setOpen(false)}
          />
        </div>
      )}

      {/* recycle bin window */}
      {binOpen && (
        <div className="binLayer" onMouseDown={(e) => e.stopPropagation()}>
          <BinWindow
            files={binFiles}
            onClose={() => setBinOpen(false)}
            onOpenFile={(file) => setPreviewing(file)}
          />
        </div>
      )}

      {/* file preview modal */}
      {previewing && (
        <FilePreview file={previewing} onClose={() => setPreviewing(null)} />
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
          position: relative;
          overflow: hidden;
          user-select: none;
          padding-bottom: 44px;
        }
        .icons {
          position: absolute;
          left: 18px;
          top: 18px;
          display: grid;
          grid-auto-rows: min-content;
          gap: 14px;
          z-index: 2;
        }
        .layer {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
        }
        .binLayer {
          position: absolute;
          left: 50%;
          top: calc(50% + 180px); /* offset from keygen if both open */
          transform: translate(-50%, -50%);
          z-index: 4;
        }
      `}</style>
    </div>
  );
}
