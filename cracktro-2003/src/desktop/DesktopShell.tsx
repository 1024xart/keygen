// src/desktop/DesktopShell.tsx
"use client";

import { useState, useEffect } from "react";
import DesktopIcon from "./DesktopIcon";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";
import Taskbar from "./Taskbar";
import BinWindow, { type FileEntry } from "./windows/BinWindow";
import FilePreview from "./windows/FilePreview";
import Window from "@/desktop/ui/Window";

import Thoughts from "@/desktop/apps/Thoughts";
import Studio from "@/desktop/apps/Studio";
import Echo from "@/desktop/apps/demo/Echo";
import Glitch from "@/desktop/apps/demo/Glitch";
import Bloom from "@/desktop/apps/demo/Bloom";

type PreviewWin = { file: FileEntry; sig: number };

export default function DesktopShell() {
  const [open, setOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState<number | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false);

  // Bin
  const [binOpen, setBinOpen] = useState(false);
  const [binFiles] = useState<FileEntry[] | undefined>(undefined);

  // File previews (multiple)
  const [previews, setPreviews] = useState<PreviewWin[]>([]);

  // Apps
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [glitchOpen, setGlitchOpen] = useState(false);
  const [bloomOpen, setBloomOpen] = useState(false);

  // z-raise signals for regular windows
  const [sigKeygen, setSigKeygen] = useState(0);
  const [sigBin, setSigBin] = useState(0);
  const [sigThoughts, setSigThoughts] = useState(0);
  const [sigStudio, setSigStudio] = useState(0);
  const [sigEcho, setSigEcho] = useState(0);
  const [sigGlitch, setSigGlitch] = useState(0);
  const [sigBloom, setSigBloom] = useState(0);

  // Helpers for previews
  function openPreview(file: FileEntry) {
    setPreviews((list) => {
      const idx = list.findIndex((p) => p.file.id === file.id);
      if (idx >= 0) {
        // Already open: raise it
        const next = list.slice();
        next[idx] = { ...next[idx], sig: next[idx].sig + 1 };
        return next;
      }
      return [...list, { file, sig: 0 }];
    });
  }
  function closePreview(fileId: string) {
    setPreviews((list) => list.filter((p) => p.file.id !== fileId));
  }
  function raisePreview(fileId: string) {
    setPreviews((list) => {
      const idx = list.findIndex((p) => p.file.id === fileId);
      if (idx < 0) return list;
      const next = list.slice();
      next[idx] = { ...next[idx], sig: next[idx].sig + 1 };
      return next;
    });
  }

  // ESC handling (close most recent preview first, then others)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (previews.length > 0) {
        // close the last opened/last in array
        closePreview(previews[previews.length - 1].file.id);
      } else if (binOpen) setBinOpen(false);
      else if (bloomOpen) setBloomOpen(false);
      else if (glitchOpen) setGlitchOpen(false);
      else if (echoOpen) setEchoOpen(false);
      else if (studioOpen) setStudioOpen(false);
      else if (thoughtsOpen) setThoughtsOpen(false);
      else if (open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previews, binOpen, bloomOpen, glitchOpen, echoOpen, studioOpen, thoughtsOpen, open]);

  // Build taskbar tasks from open windows + previews
  const tasks = [
    open && {
      id: "keygen",
      label: "SEQUENCE.exe",
      onActivate: () => {
        if (!open) setOpen(true);
        setSigKeygen((n) => n + 1);
      },
    },
    binOpen && {
      id: "bin",
      label: "Recycle Bin",
      onActivate: () => setSigBin((n) => n + 1),
    },
    thoughtsOpen && {
      id: "thoughts",
      label: "THOUGHTS",
      onActivate: () => setSigThoughts((n) => n + 1),
    },
    studioOpen && {
      id: "studio",
      label: "STUDIO",
      onActivate: () => setSigStudio((n) => n + 1),
    },
    echoOpen && {
      id: "echo",
      label: "Echo",
      onActivate: () => setSigEcho((n) => n + 1),
    },
    glitchOpen && {
      id: "glitch",
      label: "Glitch",
      onActivate: () => setSigGlitch((n) => n + 1),
    },
    bloomOpen && {
      id: "bloom",
      label: "Bloom",
      onActivate: () => setSigBloom((n) => n + 1),
    },
    // one task per open preview
    ...previews.map((p) => ({
      id: `preview:${p.file.id}`,
      label: p.file.name,
      onActivate: () => raisePreview(p.file.id),
    })),
  ].filter(Boolean) as { id: string; label: string; onActivate: () => void }[];

  return (
    <div
      className="desktop"
      onMouseDown={() => (document.activeElement as HTMLElement | null)?.blur()}
      onClick={() => startOpen && setStartOpen(false)}
    >
      <div className="icons">
        <DesktopIcon label="Bin" iconSrc="/recycle-bin.png" onOpen={() => setBinOpen(true)} />
        <DesktopIcon
          label="SEQUENCE.exe"
          iconSrc="/sequence-icon.png"
          onOpen={() => {
            setOpen(true);
            setOpenTrigger(Date.now());
          }}
        />
      </div>

      {/* Keygen */}
      {open && (
        <Window
          chrome="external"
          title="SEQUENCE-1024x"
          handleSelector=".panel"       // draggable from anywhere on keygen panel
          activateSignal={sigKeygen}
        >
          <div>
            <Cracktro2003Modern embedded openTrigger={openTrigger} onExit={() => setOpen(false)} />
          </div>
        </Window>
      )}

      {/* Bin */}
      {binOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="Recycle Bin" activateSignal={sigBin}>
          <div>
            <BinWindow
              files={binFiles}
              onClose={() => setBinOpen(false)}
              onOpenFile={(file) => openPreview(file)} // open as its own window
            />
          </div>
        </Window>
      )}

      {/* File previews — each one is its own window + taskbar item */}
      {previews.map((p) => (
        <FilePreview
          key={p.file.id}
          file={p.file}
          onClose={() => closePreview(p.file.id)}
          activateSignal={p.sig} // Window inside FilePreview listens to this
        />
      ))}

      {/* Thoughts */}
      {thoughtsOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="THOUGHTS" activateSignal={sigThoughts}>
          <div>
            <Thoughts onClose={() => setThoughtsOpen(false)} />
          </div>
        </Window>
      )}

      {/* Studio */}
      {studioOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="STUDIO" activateSignal={sigStudio}>
          <div>
            <Studio onClose={() => setStudioOpen(false)} />
          </div>
        </Window>
      )}

      {/* Demo apps */}
      {echoOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="Echo" activateSignal={sigEcho}>
          <div>
            <Echo onClose={() => setEchoOpen(false)} />
          </div>
        </Window>
      )}
      {glitchOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="Glitch" activateSignal={sigGlitch}>
          <div>
            <Glitch onClose={() => setGlitchOpen(false)} />
          </div>
        </Window>
      )}
      {bloomOpen && (
        <Window chrome="external" handleSelector=".titleBar" title="Bloom" activateSignal={sigBloom}>
          <div>
            <Bloom onClose={() => setBloomOpen(false)} />
          </div>
        </Window>
      )}

      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((v) => !v)}
        onLaunchThoughts={() => setThoughtsOpen(true)}
        onLaunchStudio={() => setStudioOpen(true)}
        onLaunchEcho={() => setEchoOpen(true)}
        onLaunchGlitch={() => setGlitchOpen(true)}
        onLaunchBloom={() => setBloomOpen(true)}
        tasks={tasks}
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
      `}</style>
    </div>
  );
}
