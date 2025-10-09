// src/desktop/Taskbar.tsx
"use client";

import React, { useEffect, useState } from "react";

type Task = {
  id: string;
  label: string;
  onActivate: () => void; // bring to front (or restore if you add minimize later)
};

type Props = {
  startOpen: boolean;
  onToggleStart: () => void;

  // start menu launchers (existing)
  onLaunchThoughts?: () => void;
  onLaunchStudio?: () => void;
  onLaunchEcho?: () => void;
  onLaunchGlitch?: () => void;
  onLaunchBloom?: () => void;

  // NEW: open windows to show as taskbar tabs
  tasks?: Task[];
};

export default function Taskbar({
  startOpen,
  onToggleStart,
  onLaunchThoughts,
  onLaunchStudio,
  onLaunchEcho,
  onLaunchGlitch,
  onLaunchBloom,
  tasks = [],
}: Props) {
  const onMenuKey = (e: React.KeyboardEvent, fn?: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn?.();
      onToggleStart();
    }
  };

  return (
    <>
      <div className="taskbar">
        <button
          className={`start ${startOpen ? "down" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStart();
          }}
          title="Start"
        >
          START
        </button>

        {/* NEW: task buttons */}
        <div className="tasks">
          {tasks.map((t) => (
            <button
              key={t.id}
              className="taskBtn"
              title={t.label}
              onClick={(e) => {
                e.stopPropagation();
                t.onActivate();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="spacer" />
        <div className="tray">
          <Clock />
        </div>
      </div>

      {startOpen && (
        <div className="startmenu" role="menu" aria-label="Start" onClick={(e) => e.stopPropagation()}>
          <div className="userTile">
            <div className="avatar" aria-hidden />
            <div className="meta">
              <div className="hello">Signed in as</div>
              <div className="name">Anonymous</div>
            </div>
          </div>

          <div className="sectionTitle">Programs</div>

          <div
            className="menuItem"
            role="menuitem"
            tabIndex={0}
            onClick={() => { onLaunchThoughts?.(); onToggleStart(); }}
            onKeyDown={(e) => onMenuKey(e, onLaunchThoughts)}
          >
            Thoughts
          </div>
          <div
            className="menuItem"
            role="menuitem"
            tabIndex={0}
            onClick={() => { onLaunchStudio?.(); onToggleStart(); }}
            onKeyDown={(e) => onMenuKey(e, onLaunchStudio)}
          >
            Studio
          </div>

          <div className="sectionTitle">Demo</div>
          <div
            className="menuItem"
            role="menuitem"
            tabIndex={0}
            onClick={() => { onLaunchEcho?.(); onToggleStart(); }}
            onKeyDown={(e) => onMenuKey(e, onLaunchEcho)}
          >
            Echo
          </div>
          <div
            className="menuItem"
            role="menuitem"
            tabIndex={0}
            onClick={() => { onLaunchGlitch?.(); onToggleStart(); }}
            onKeyDown={(e) => onMenuKey(e, onLaunchGlitch)}
          >
            Glitch
          </div>
          <div
            className="menuItem"
            role="menuitem"
            tabIndex={0}
            onClick={() => { onLaunchBloom?.(); onToggleStart(); }}
            onKeyDown={(e) => onMenuKey(e, onLaunchBloom)}
          >
            Bloom
          </div>
        </div>
      )}

      <style jsx>{`
        .taskbar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 36px;
          background: #111;
          color: #e6e6e6;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 4px 6px;
          z-index: 50;
          font: 11px Tahoma, "MS Sans Serif", sans-serif;
          user-select: none;
        }
        .start {
          height: 28px;
          padding: 0 14px;
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          cursor: pointer;
          appearance: none;
          border-radius: 0;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .start.down {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform: translateY(1px);
        }

        /* NEW task buttons strip */
        .tasks {
          display: flex;
          gap: 6px;
          overflow: hidden;
        }
        .taskBtn {
          max-width: 220px;
          height: 26px;
          padding: 0 10px;
          background: #1a1a1a;
          color: #e6e6e6;
          border: 1px solid #000;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          cursor: pointer;
        }
        .taskBtn:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform: translateY(1px);
        }

        .spacer { min-width: 8px; }
        .tray { padding: 0 8px; color: #d0d0d0; text-shadow: 1px 1px 0 #000; }

        /* start menu styles (unchanged below) */
        .startmenu {
          position: fixed;
          left: 6px;
          bottom: 36px;
          width: 220px;
          background: #0f0f0f;
          color: #e6e6e6;
          z-index: 60;
          border: 1px solid #000;
          box-shadow: 0 0 0 1px #333, 0 10px 30px rgba(0, 0, 0, 0.6),
            inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
          padding: 8px;
        }
        .userTile { display: grid; grid-template-columns: 28px 1fr; gap: 8px; align-items: center; padding: 6px; border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; background: #111; }
        .avatar { width: 28px; height: 28px; background: linear-gradient(135deg, #5b2fb0, #b667ff); box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000; }
        .meta .hello { color: #9a9a9a; font-size: 10px; margin-bottom: 2px; }
        .meta .name { font-weight: 700; letter-spacing: 0.3px; }
        .sectionTitle { margin: 10px 2px 6px; font-weight: 700; color: #cfcfcf; letter-spacing: 0.3px; }
        .menuItem { margin: 6px 0; padding: 6px 8px; background: #111; border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; cursor: default; user-select: none; }
        .menuItem:active { box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; transform: translateY(1px); }
      `}</style>
    </>
  );
}

function Clock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span aria-label="Clock">{time}</span>;
}
