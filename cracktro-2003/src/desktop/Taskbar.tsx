// src/desktop/Taskbar.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Wifi, Volume2 } from "lucide-react";

/* ---------------- Types ---------------- */
type Task = { id: string; label: string; onActivate: () => void };
type Props = {
  startOpen: boolean;
  onToggleStart: () => void;
  onLaunchThoughts?: () => void;
  onLaunchStudio?: () => void;
  onLaunchBMR08?: () => void;
  onLaunchBR09?: () => void;
  onLaunchTR01?: () => void;
  aboutText?: string;
  tasks?: Task[];
};

type AppItem = { label: string; code?: string; onClick?: () => void; icon?: React.ReactNode; disabled?: boolean };

/* Hard de-dupe: last one wins per label */
function dedupeByLabel(items: AppItem[]): AppItem[] {
  const map = new Map<string, AppItem>();
  for (const it of items) if (it.label) map.set(it.label, it);
  return Array.from(map.values());
}

/* ---------------- Component ---------------- */
export default function Taskbar({
  startOpen,
  onToggleStart,
  onLaunchThoughts,
  onLaunchStudio,
  onLaunchBMR08,
  onLaunchBR09,
  onLaunchTR01,
  aboutText = `AUTHORIZATION GRANTED TO THE ABOVE USER.

Welcome back. Your workspace is ready.`,
  tasks = [],
}: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<"home" | "apps">("home");

  useEffect(() => {
    console.info("%c[Taskbar v6] mounted", "color:#b667ff");
  }, []);

  // Reset to home each time the start menu is opened
  useEffect(() => {
    if (startOpen) setPanel("home");
  }, [startOpen]);

  useEffect(() => {
    if (!startOpen || !menuRef.current) return;
    const el = menuRef.current;
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('[role="menuitem"], .listRow, .navRow, .pillBtn, button, [tabindex="0"]')
    );
    (focusable[0] ?? el).focus();
  }, [startOpen, panel]);

  const onMenuKey = (e: React.KeyboardEvent, fn?: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn?.();
    } else if (e.key === "Escape" && panel === "apps") {
      setPanel("home");
    }
  };

  /* One true source + de-dupe */
  const programItems = useMemo(
    () =>
      dedupeByLabel([
        { label: "TR01",  code: "TR01",  icon: <ItemIconApp />, onClick: () => { onLaunchTR01?.();  onToggleStart(); } },
        { label: "BMR08", code: "BMR08", icon: <ItemIconApp />, onClick: () => { onLaunchBMR08?.(); onToggleStart(); } },
        { label: "BR09",  code: "BR09",  icon: <ItemIconApp />, onClick: () => { onLaunchBR09?.();  onToggleStart(); } },
      ]),
    [onLaunchTR01, onLaunchBMR08, onLaunchBR09, onToggleStart]
  );

  const toolItems = useMemo(
    () =>
      dedupeByLabel([
        { label: "Thoughts", icon: <ItemIconNote />,  onClick: () => { onLaunchThoughts?.(); onToggleStart(); } },
        { label: "Studio",   icon: <ItemIconBrush />, onClick: () => { onLaunchStudio?.();   onToggleStart(); } },
      ]),
    [onLaunchThoughts, onLaunchStudio, onToggleStart]
  );

  return (
    <>
      {/* Taskbar */}
      <div className="taskbar" data-taskbar data-version="tb-v6">
        <button
          className={`start ${startOpen ? "down" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStart();
          }}
          title="Start"
          aria-pressed={startOpen}
        >
          <StartPearl />
          <span>START</span>
        </button>

        <div className="quick">
          <div className="quickBtn" title="Desktop" tabIndex={-1}><MiniGrid /></div>
          <div className="quickBtn" title="Files" tabIndex={-1}><MiniFolder /></div>
          <div className="vsep" />
        </div>

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
              <span className="taskDot" aria-hidden />
              <span className="taskLabel">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="tray">
          <div className="vsep" />
          <Wifi className="trayIcon" size={14} aria-hidden />
          <Volume2 className="trayIcon" size={14} aria-hidden />
          <Clock />
        </div>
      </div>

      {/* Start menu */}
      {startOpen && (
        <div className="startWrap" onClick={(e) => e.stopPropagation()} data-startmenu>
          <div className="startmenu animateUp" role="menu" aria-label="Start" ref={menuRef}>
            {/* Brand rail */}
            <div className="rail" aria-hidden>
              <div className="railBrand">SEQUENCE</div>
              <div className="railGlow" />
            </div>

            {/* Content */}
            <div className="content">
              {/* LEFT */}
              <div className="col left">
                <div className="identity">
                  <div className="avatar" aria-hidden />
                  <div className="idText">
                    <div className="hello">Signed in as</div>
                    <div className="name">Anonymous</div>
                  </div>
                </div>

                <div className="separator" aria-hidden />

                <div className="messageCard">
                  <pre className="message">{aboutText}</pre>
                </div>
              </div>

              {/* RIGHT with sliding panels */}
              <div className="col right">
                <div className={`panelTrack ${panel === "apps" ? "toApps" : "toHome"}`} aria-live="polite">
                  {/* HOME panel */}
                  <div className="panel homePanel" aria-hidden={panel !== "home"}>
                    <div
                      className="navRow"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setPanel("apps")}
                      onKeyDown={(e) => onMenuKey(e, () => setPanel("apps"))}
                      aria-label="Open all programs"
                    >
                      <span className="navIcon"><MiniGrid /></span>
                      <div className="navLabel">All programs</div>
                    </div>

                    <div className="sectionTitle small">Tools</div>
                    {toolItems.map((item) => (
                      <ListRow
                        key={item.label}
                        label={item.label}
                        icon={item.icon}
                        onClick={item.onClick}
                        onKeyDown={(e) => onMenuKey(e, item.onClick)}
                      />
                    ))}
                  </div>

                  {/* APPS panel */}
                  <div className="panel appsPanel" aria-hidden={panel !== "apps"}>
                    <div className="appsHeader">
                      <button
                        className="pillBtn"
                        onClick={() => setPanel("home")}
                        onKeyDown={(e) => onMenuKey(e, () => setPanel("home"))}
                        aria-label="Back to Start"
                      >
                        <span className="chev">←</span> Back
                      </button>
                      <div className="appsTitle">All programs</div>
                    </div>

                    <div className="appsList">
                      {programItems.map((item) => (
                        <ListRow
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          // Hide code if same as label
                          code={item.code && item.code.trim() !== item.label.trim() ? item.code : undefined}
                          onClick={item.onClick}
                          onKeyDown={(e) => onMenuKey(e, item.onClick)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        :global(:root){
          --wx-bg:#0f1013;
          --wx-panel:#13151a;
          --wx-panel-2:#171a21;
          --wx-edge:#000;
          --wx-edge-2:#2b2e38;
          --wx-text:#e7e8ea;
          --wx-muted:#a6aab1;
          --wx-accent:#b667ff;
          --wx-accent-2:#5b2fb0;
          --wx-noise:radial-gradient(1px 1px at 30% 30%,rgba(255,255,255,.02),transparent 60%),
                      radial-gradient(1px 1px at 70% 70%,rgba(255,255,255,.02),transparent 60%);
          --wx-font:11px Tahoma,"MS Sans Serif",system-ui,sans-serif;

          /* New: taskbar/menu spacing variables */
          --tb-h: 36px;          /* taskbar height */
          --start-gap: 10px;     /* lift above taskbar */
        }

        /* Taskbar */
        .taskbar{
          position:fixed; left:0; right:0; bottom:0; height:var(--tb-h);
          display:grid; grid-template-columns:auto auto 1fr auto; align-items:center;
          gap:8px; padding:4px 6px; z-index:50; user-select:none;
          background:linear-gradient(180deg,#171a20,#101217 64%),var(--wx-noise);
          color:var(--wx-text); font:var(--wx-font);
          box-shadow:inset 0 1px 0 #2f3137, inset 0 -1px 0 #000, 0 0 0 1px #000;
        }
        .start{height:28px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;border-radius:3px;
          background:linear-gradient(180deg,#1b1d23,#121319);color:var(--wx-text);
          border:1px solid var(--wx-edge);
          box-shadow:inset 1px 1px 0 #63656b, inset -1px -1px 0 #000, 0 0 0 1px #000;
          letter-spacing:.6px;font-weight:800;text-shadow:1px 1px 0 #000;cursor:pointer;
          transition:transform 70ms ease, box-shadow 140ms ease, filter 140ms ease;}
        .start:hover{filter:brightness(1.06); box-shadow:inset 1px 1px 0 #6f7177, inset -1px -1px 0 #000, 0 0 0 1px #000, 0 0 18px rgba(182,103,255,.35);}
        .start.down{transform:translateY(1px); box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;}

        .quick{display:inline-flex; align-items:center; gap:4px;}
        .quickBtn{width:26px;height:26px;display:grid;place-items:center;border:1px solid #000;border-radius:2px;
          background:#1a1b21; box-shadow:inset 1px 1px 0 #595959, inset -1px -1px 0 #000, 0 0 0 1px #000;}
        .quickBtn:hover{filter:brightness(1.08); box-shadow:inset 1px 1px 0 #6b6b6b,inset -1px -1px 0 #000,0 0 0 1px #000,0 0 18px rgba(182,103,255,.3);}
        .vsep{width:1px;height:22px;background:linear-gradient(180deg,#303345,#0d0e12);margin:0 4px;}

        .tasks{display:flex; gap:6px; min-width:0;}
        .taskBtn{max-width:260px;height:26px;padding:0 10px;display:inline-flex;align-items:center;gap:8px;border-radius:3px;
          background:linear-gradient(180deg,#171a21,#11131a);
          color:var(--wx-text); border:1px solid var(--wx-edge);
          box-shadow:inset 1px 1px 0 #555, inset -1px -1px 0 #000, 0 0 0 1px #000;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;
          transition:background 140ms, box-shadow 140ms, transform 70ms;}
        .taskBtn:hover{background:linear-gradient(180deg,#1c2029,#11131a); box-shadow:inset 1px 1px 0 #6a6a6a,inset -1px -1px 0 #000,0 0 0 1px #000,0 0 18px rgba(182,103,255,.28);}
        .taskBtn:active{transform:translateY(1px); box-shadow:inset 1px 1px 0 #000,inset -1px -1px 0 #6a6a6a,0 0 0 1px #000;}
        .taskDot{width:6px;height:6px;border-radius:50%;background:linear-gradient(180deg,#b667ff,#5b2fb0);box-shadow:0 0 8px rgba(182,103,255,.55);}

        .tray{display:inline-flex;align-items:center;gap:8px;color:#d0d0d0;text-shadow:1px 1px 0 #000;padding-right:6px;}
        .trayIcon{opacity:.92;}

        /* Start menu container — now floats above the taskbar */
        .startWrap{position:fixed; left:6px; bottom:calc(var(--tb-h) + var(--start-gap)); z-index:60;}
        .startmenu{
          width:560px; height:min(72vh,500px);
          display:grid; grid-template-columns:74px 1fr;
          background:linear-gradient(180deg,#101116,#0c0d12 70%),var(--wx-noise);
          color:var(--wx-text);
          border:1px solid var(--wx-edge);
          box-shadow:
            0 18px 42px rgba(0,0,0,.55),      /* deeper floating shadow */
            0 0 0 1px #2f3137,
            inset 1px 1px 0 #6a6a6a,
            inset -1px -1px 0 #000;
          overflow:hidden; outline:none; border-radius:10px;
        }
        .animateUp{
          animation: slideUp 220ms cubic-bezier(.22,.9,.23,1) both;
        }
        @keyframes slideUp{
          from { transform: translateY(12px); opacity: .0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .rail{position:relative; background:linear-gradient(180deg,#151722,#0c0d13); border-right:1px solid var(--wx-edge-2);
          display:grid; place-items:end center; padding:10px 6px;}
        .railBrand{writing-mode:vertical-rl; rotate:180deg; letter-spacing:2px; font-weight:900; color:var(--wx-accent);
          text-shadow:0 0 12px rgba(182,103,255,.6); user-select:none;}
        .railGlow{position:absolute; inset:auto 0 0 0; height:2px; background:linear-gradient(90deg,transparent,var(--wx-accent),transparent); opacity:.65;}

        .content{display:grid; grid-template-columns:1fr 1fr;}
        .col{padding:12px 12px 14px; background:linear-gradient(180deg,#13141a,#121318);}
        .col.right{border-left:1px solid #1f222c; position:relative; overflow:hidden;}

        /* Identity */
        .identity{display:flex; align-items:center; gap:10px; padding:4px 2px;}
        .avatar{width:30px; height:30px; border-radius:6px; background:linear-gradient(135deg,#5b2fb0,#b667ff);
          box-shadow:0 0 0 1px #201b2b, inset 0 0 14px rgba(0,0,0,.4);}
        .idText .hello{color:var(--wx-muted); font-size:10px; margin-bottom:2px;}
        .idText .name{font-weight:800; letter-spacing:.4px;}
        .separator{height:1px; margin:10px 0; background:linear-gradient(90deg,transparent,#2a2d36,transparent);}

        /* Message card */
        .messageCard{
          padding:10px 12px; border-radius:6px;
          background:linear-gradient(180deg,rgba(22,24,33,.75),rgba(18,19,25,.75));
          box-shadow:inset 0 0 0 1px #262a34, 0 6px 18px rgba(0,0,0,.22);
        }
        .message{margin:0; white-space:pre-wrap; font-family:"Lucida Console",Consolas,monospace;
          font-size:12px; line-height:1.35; color:#d9d9dc;}

        .sectionTitle{margin:6px 2px 8px; font-weight:900; color:#d8d8d8; letter-spacing:.4px; text-shadow:0 1px 0 #000;}
        .sectionTitle.small{margin-top:14px; font-weight:700; color:#c2c6ce;}

        /* Right column slider */
        .panelTrack{
          position:relative; width:100%; height:100%;
          display:flex; flex-direction:row; transition: transform 220ms cubic-bezier(.22,.9,.23,1);
          will-change: transform;
        }
        .toHome{ transform: translateX(0%); }
        .toApps{ transform: translateX(-100%); }
        .panel{
          width:100%; flex:0 0 100%; padding-bottom:4px;
        }

        /* Home → nav row */
        .navRow{
          height:32px; padding:0 10px; margin-bottom:10px;
          display:inline-flex; align-items:center; gap:10px;
          background:#111319; border:1px solid #2b2e3a; border-radius:8px;
          box-shadow:inset 0 0 0 1px #0c0c0f, 0 1px 0 rgba(255,255,255,.03);
          cursor:pointer; outline:none; white-space:nowrap;
        }
        .navRow:hover,.navRow:focus{
          background:#171a22; border-color:#383c4a;
          box-shadow:inset 0 0 0 1px #0a0a0a, 0 0 0 1px #000, 0 0 18px rgba(182,103,255,.22);
        }
        .navIcon{ width:16px; height:16px; display:flex; align-items:center; justify-content:center; }
        .navLabel{ font-weight:700; }

        /* Apps view header */
        .appsHeader{ display:flex; align-items:center; gap:10px; margin:4px 0 10px; }
        .pillBtn{
          height:26px; padding:0 10px; border-radius:999px; border:1px solid #2b2e3a;
          background:#101218; color:var(--wx-text); display:inline-flex; align-items:center; gap:8px;
          box-shadow:inset 0 0 0 1px #0c0c0f; cursor:pointer;
        }
        .pillBtn:hover{ background:#151824; }
        .chev{ font-weight:900; }
        .appsTitle{ font-weight:900; letter-spacing:.4px; margin-left:4px; }

        .appsList{ display:flex; flex-direction:column; }

        /* List rows (icon → label → code). Force inline row. */
        :global(.listRow){ display:inline-flex !important; align-items:center !important; gap:10px !important; }
        .listRow{
          height:30px; padding:0 10px;
          background:#111319; border:1px solid #2b2e3a; border-radius:6px;
          box-shadow:inset 0 0 0 1px #0c0c0f, 0 1px 0 rgba(255,255,255,.03);
          cursor:default; outline:none; white-space:nowrap;
        }
        .listRow + .listRow{margin-top:8px;}
        .listRow:hover,.listRow:focus{
          background:#171a22; border-color:#383c4a;
          box-shadow:inset 0 0 0 1px #0a0a0a, 0 0 0 1px #000, 0 0 18px rgba(182,103,255,.22);
        }
        :global(.listIcon){ width:16px !important; height:16px !important; display:flex !important; align-items:center !important; justify-content:center !important; flex:0 0 16px !important; }
        :global(.listIcon svg){ display:block !important; }
        .label{ min-width:0; overflow:hidden; text-overflow:ellipsis; }
        .codeTag{
          font-size:10px; color:var(--wx-muted);
          border:1px solid #34343a; background:#15151a; border-radius:4px; padding:0 6px; height:18px;
          display:inline-grid; place-items:center; min-width:42px; margin-left:auto;
        }

        /* Hide the off-screen panel so nothing peeks through and it's not tabbable */
        .panelTrack.toHome .appsPanel { 
          visibility: hidden; 
          pointer-events: none; 
        }
        .panelTrack.toApps .homePanel { 
          visibility: hidden; 
          pointer-events: none; 
        }

        /* Guard against GPU subpixel leaks */
        .appsPanel, .homePanel {
          contain: paint;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .window{
          background: linear-gradient(180deg, var(--seq-bg-1), var(--seq-bg-2));
          border-radius: var(--seq-r-8);
          box-shadow: var(--seq-elev-1);
          border: 1px solid var(--seq-stroke-0);
          outline: 1px solid var(--seq-stroke-1);
        }
        .window .titlebar{
          height:34px; display:flex; align-items:center; gap:8px; padding:0 10px;
          background: linear-gradient(180deg,#1a1d27,#12141a);
          box-shadow: inset 0 1px 0 #6a6a6a, inset -1px -1px 0 #000;
        }
        .window .content{ padding:12px; }
        .window .controls button{
          width:22px; height:22px; border-radius: var(--seq-r-2);
          background:#1a1b21; box-shadow: var(--seq-elev-0); border:1px solid #000;
        }
        .window .controls button:hover{ box-shadow: var(--seq-elev-0), 0 0 18px var(--seq-accent-glow); }
      `}</style>
    </>
  );
}

/* ---------------- Small components ---------------- */

function ListRow(props: {
  label: string;
  code?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}) {
  const { label, code, icon, onClick, onKeyDown, disabled } = props;
  const showCode = Boolean(code && code.trim() !== label.trim());

  return (
    <div
      className={`listRow ${disabled ? "disabled" : ""}`}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e) => !disabled && onKeyDown?.(e)}
      aria-disabled={disabled || undefined}
    >
      <span className="listIcon">{icon ?? <span style={{ width: 16, height: 16 }} />}</span>
      <div className="label">{label}</div>
      {showCode ? <span className="codeTag">{code}</span> : <span style={{ marginLeft: "auto" }} />}
    </div>
  );
}

/* ---------------- Icons ---------------- */

function StartPearl(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...props}>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6d6ff" />
          <stop offset="1" stopColor="#6a6ae6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="6" fill="url(#g)" />
    </svg>
  );
}
function MiniGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  );
}
function MiniFolder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 6h7l2 2h9v10H3z" />
    </svg>
  );
}
function NetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M2 12a10 10 0 1020 0A10 10 0 002 12zm9-7.9V8h2V4.1A8.02 8.02 0 0120 12h-4v2h4a8.02 8.02 0 01-7 7.9V16h-2v5.9A8.02 8.02 0 014 14h4v-2H4a8.02 8.02 0 017-7.9z" />
    </svg>
  );
}
function VolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z" />
      <path fill="currentColor" d="M16 8a5 5 0 010 8l-1.2-1.6a3 3 0 000-4.8L16 8z" />
    </svg>
  );
}
function ItemIconBrush(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M20.7 5.3l-2-2L9 13v2h2l9.7-9.7zM7 14c-1.7 0-3 1.3-3 3 0 1.1-.9 2-2 2 2.5 2.5 7 1 7-2 0-1.7-1.3-3-3-3z"/>
    </svg>
  );
}
function ItemIconNote(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M6 3h9l3 3v15H6zM8 7h8v2H8zm0 4h8v2H8zm0 4h6v2H8z" />
    </svg>
  );
}
/* Simple, neutral app glyph for programs */
function ItemIconApp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm3 4h8v2H8V7zm0 4h8v2H8v-2zm0 4h6v2H8v-2z"/>
    </svg>
  );
}

/* ---------------- Clock ---------------- */
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
  return <span aria-label="Clock" className="seq-mono" style={{ fontFeatureSettings:"'tnum' 1" }}>{time}</span>;
}
