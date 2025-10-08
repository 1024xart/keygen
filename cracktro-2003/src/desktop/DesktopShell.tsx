"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";
import Taskbar from "./Taskbar";
import BinWindow, { type FileEntry } from "./windows/BinWindow";
import FilePreview from "./windows/FilePreview";
import Thoughts from "./apps/Thoughts";
import Studio from "./apps/Studio";

export default function DesktopShell() {
  // SEQUENCE (keygen)
  const [openSeq, setOpenSeq] = useState(false);
  const [openTrigger, setOpenTrigger] = useState<number | undefined>(undefined);

  // Start menu
  const [startOpen, setStartOpen] = useState(false);

  // Bin
  const [binOpen, setBinOpen] = useState(false);
  const [binFiles] = useState<FileEntry[] | undefined>(undefined); // use BinWindow defaults
  const [previewing, setPreviewing] = useState<FileEntry | null>(null);

  // Apps launched from Start
  const [openThoughts, setOpenThoughts] = useState(false);
  const [openStudio, setOpenStudio] = useState(false);

  // ESC closes the top-most thing: preview → Bin → Studio → Thoughts → SEQUENCE
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewing) return setPreviewing(null);
      if (binOpen) return setBinOpen(false);
      if (openStudio) return setOpenStudio(false);
      if (openThoughts) return setOpenThoughts(false);
      if (openSeq) return setOpenSeq(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewing, binOpen, openStudio, openThoughts, openSeq]);

  return (
    <div
      className="desktop"
      onMouseDown={() => (document.activeElement as HTMLElement | null)?.blur()}
      onClick={() => startOpen && setStartOpen(false)}
    >
      {/* icons column (top-left) */}
      <div className="icons">
        <DesktopIcon
          label="Bin"
          iconSrc="/recycle-bin.png"
          onOpen={() => setBinOpen(true)}
        />
        <DesktopIcon
          label="SEQUENCE.exe"
          iconSrc="/sequence-icon.png"
          onOpen={() => {
            setOpenSeq(true);
            setOpenTrigger(Date.now());
          }}
        />
        {/* Thoughts & Studio removed from desktop; launched from Start */}
      </div>

      {/* SEQUENCE keygen (embedded window) */}
      {openSeq && (
        <div className="layer center" role="dialog" aria-label="SEQUENCE-1024x">
          <Cracktro2003Modern
            embedded
            openTrigger={openTrigger}
            onExit={() => setOpenSeq(false)}
          />
        </div>
      )}

      {/* Bin window */}
      {binOpen && (
        <div className="layer binOffset" onMouseDown={(e) => e.stopPropagation()}>
          <BinWindow
            files={binFiles}
            onClose={() => setBinOpen(false)}
            onOpenFile={(file) => setPreviewing(file)}
          />
        </div>
      )}

      {/* File preview modal */}
      {previewing && (
        <FilePreview file={previewing} onClose={() => setPreviewing(null)} />
      )}

      {/* Thoughts app */}
      {openThoughts && (
        <div className="layer offsetA" role="dialog" aria-label="Thoughts">
          <Thoughts onClose={() => setOpenThoughts(false)} />
        </div>
      )}

      {/* Studio app */}
      {openStudio && (
        <div className="layer offsetB" role="dialog" aria-label="Studio">
          <Studio onClose={() => setOpenStudio(false)} />
        </div>
      )}

      {/* Taskbar with Start menu */}
      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((v) => !v)}
        onLaunchThoughts={() => {
          setOpenThoughts(true);
          setStartOpen(false);
        }}
        onLaunchStudio={() => {
          setOpenStudio(true);
          setStartOpen(false);
        }}
      />

      <style jsx>{`
        .desktop {
          min-height: 100svh;
          background: #000 url("/wallpapers/sequence-desktop.jpg") center / cover no-repeat;
          position: relative;
          overflow: hidden;
          user-select: none;
          padding-bottom: 44px; /* space for taskbar */
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
          z-index: 3;
        }
        .center {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        .binOffset {
          left: 50%;
          top: calc(50% + 180px);
          transform: translate(-50%, -50%);
          z-index: 4;
        }
        .offsetA {
          left: calc(50% - 160px);
          top: calc(50% - 120px);
          transform: translate(-50%, -50%);
          z-index: 5;
        }
        .offsetB {
          left: calc(50% + 160px);
          top: calc(50% + 100px);
          transform: translate(-50%, -50%);
          z-index: 6;
        }
      `}</style>
    </div>
  );
}
