// src/desktop/DesktopShell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import DesktopIcon from "./DesktopIcon";
import Cracktro2003Modern from "@/components/Cracktro2003Modern";
import Taskbar from "./Taskbar";
import BinWindow, { type FileEntry } from "./windows/BinWindow";
import FilePreview from "./windows/FilePreview";
import Window from "@/desktop/ui/Window";

import Thoughts from "@/desktop/apps/Thoughts";
import Studio from "@/desktop/apps/Studio";

// NEW: renamed demo apps (make sure the file names match exactly)
import BMR08 from "@/desktop/apps/demo/BMR08";
import BR09 from "@/desktop/apps/demo/BR09";
import TR01 from "@/desktop/apps/demo/TR01";

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

  // Demo apps (renamed)
  const [bmr08Open, setBmr08Open] = useState(false);
  const [br09Open, setBr09Open] = useState(false);
  const [tr01Open, setTr01Open] = useState(false);

  // z-raise signals for regular windows
  const [sigKeygen, setSigKeygen] = useState(0);
  const [sigBin, setSigBin] = useState(0);
  const [sigThoughts, setSigThoughts] = useState(0);
  const [sigStudio, setSigStudio] = useState(0);

  // z-raise signals for demo apps
  const [sigBMR08, setSigBMR08] = useState(0);
  const [sigBR09, setSigBR09] = useState(0);
  const [sigTR01, setSigTR01] = useState(0);

  // -------- Aesthetic marquee only --------
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const toRect = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(a.x - b.x);
    const h = Math.abs(a.y - b.y);
    return { x, y, w, h };
  };

  // Treat these surfaces as “UI chrome” (no marquee, don’t close Start)
  const isInUIChrome = (el: HTMLElement | null) =>
    !!el?.closest(".winRoot, .iconItem, .taskbar, .startMenu, [data-taskbar], [data-startmenu]");

  const onDesktopMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    // Only start marquee on empty desktop
    if (isInUIChrome(target)) return;

    (document.activeElement as HTMLElement | null)?.blur?.();

    const bounds = desktopRef.current!.getBoundingClientRect();
    const start = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    setDragging(true);
    setDragStart(start);
    setDragRect({ x: start.x, y: start.y, w: 0, h: 0 });
  };

  const onDesktopMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragging || !dragStart) return;
    const bounds = desktopRef.current!.getBoundingClientRect();
    const cur = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    setDragRect(toRect(dragStart, cur));
  };

  const onDesktopMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    if (!dragging) return;
    setDragging(false);
    setDragStart(null);
    setDragRect(null);
  };

  // Close Start ONLY when clicking on empty desktop (not on UI chrome)
  const onDesktopClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!startOpen) return;
    const target = e.target as HTMLElement;
    if (!isInUIChrome(target)) setStartOpen(false);
  };

  // Helpers for previews
  function openPreview(file: FileEntry) {
    setPreviews((list) => {
      const idx = list.findIndex((p) => p.file.id === file.id);
      if (idx >= 0) {
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

  // ESC handling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (previews.length > 0) {
        closePreview(previews[previews.length - 1].file.id);
      } else if (binOpen) setBinOpen(false);
      else if (tr01Open) setTr01Open(false);
      else if (br09Open) setBr09Open(false);
      else if (bmr08Open) setBmr08Open(false);
      else if (studioOpen) setStudioOpen(false);
      else if (thoughtsOpen) setThoughtsOpen(false);
      else if (open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previews, binOpen, tr01Open, br09Open, bmr08Open, studioOpen, thoughtsOpen, open]);

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
    binOpen && { id: "bin", label: "Recycle Bin", onActivate: () => setSigBin((n) => n + 1) },
    thoughtsOpen && { id: "thoughts", label: "THOUGHTS", onActivate: () => setSigThoughts((n) => n + 1) },
    studioOpen && { id: "studio", label: "STUDIO", onActivate: () => setSigStudio((n) => n + 1) },

    // renamed demo apps
    bmr08Open && { id: "BMR08", label: "BMR08", onActivate: () => setSigBMR08((n) => n + 1) },
    br09Open  && { id: "BR09",  label: "BR09",  onActivate: () => setSigBR09((n) => n + 1) },
    tr01Open  && { id: "TR01",  label: "TR01",  onActivate: () => setSigTR01((n) => n + 1) },

    // one task per open preview
    ...previews.map((p) => ({
      id: `preview:${p.file.id}`,
      label: p.file.name,
      onActivate: () => raisePreview(p.file.id),
    })),
  ].filter(Boolean) as { id: string; label: string; onActivate: () => void }[];

  return (
    <div
      ref={desktopRef}
      className="desktop"
      onMouseDown={onDesktopMouseDown}
      onMouseMove={onDesktopMouseMove}
      onMouseUp={onDesktopMouseUp}
      onClick={onDesktopClick}
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
          handleSelector=".panel"
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
              onOpenFile={(file) => openPreview(file)}
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
          activateSignal={p.sig}
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

      {/* Demo apps (renamed) */}
      {bmr08Open && (
        <Window chrome="external" handleSelector=".titleBar" title="BMR08" activateSignal={sigBMR08}>
          <div>
            <BMR08 onClose={() => setBmr08Open(false)} />
          </div>
        </Window>
      )}
      {br09Open && (
        <Window chrome="external" handleSelector=".titleBar" title="BR09" activateSignal={sigBR09}>
          <div>
            <BR09 onClose={() => setBr09Open(false)} />
          </div>
        </Window>
      )}
      {tr01Open && (
        <Window chrome="external" handleSelector=".titleBar" title="TR01" activateSignal={sigTR01}>
          <div>
            <TR01 onClose={() => setTr01Open(false)} />
          </div>
        </Window>
      )}

      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((v) => !v)}
        onLaunchThoughts={() => setThoughtsOpen(true)}
        onLaunchStudio={() => setStudioOpen(true)}
        // NEW: renamed launchers
        onLaunchBMR08={() => setBmr08Open(true)}
        onLaunchBR09={() => setBr09Open(true)}
        onLaunchTR01={() => setTr01Open(true)}
        tasks={tasks}
      />

      {/* purely aesthetic marquee */}
      {dragRect && (
        <div
          className="marquee"
          style={{
            left: dragRect.x,
            top: dragRect.y,
            width: dragRect.w,
            height: dragRect.h,
          }}
        />
      )}

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
        .marquee {
          position: absolute;
          z-index: 3; /* above icons, below windows */
          border: 1px solid rgba(64, 110, 220, 0.9);   /* darker edge */
          background: rgba(64, 110, 220, 0.22);        /* darker fill */
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
