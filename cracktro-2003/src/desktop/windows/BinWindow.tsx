"use client";
import React from "react";

export type FileEntry =
  | {
      id: string;
      name: string;
      type: "text" | "encrypted";
      size?: string;
      modified?: string;
      content: string;
    }
  | {
      id: string;
      name: string;
      type: "image";
      size?: string;
      modified?: string;
      src: string;
      alt?: string;
    };

type Props = {
  files?: FileEntry[];
  onClose: () => void;
  onOpenFile: (file: FileEntry) => void;
};

const DEFAULT_FILES: FileEntry[] = [
  {
    id: "f1",
    name: "log_000001.enc",
    type: "encrypted",
    size: "32 KB",
    modified: "2003-08-12 03:14",
    content: [
      "5F 8B 2A 9C 00 1D 3F 3F 7A 11 0A 0A D3 0C 0C 7F",
      "0A 00 93 E2 41 41 1B A0 77 2D 6E 0E 4A 5D 5D 2C",
      "— BEGIN BLOCK —",
      "XQv+e8X+KPX9wD3uYk9R1y6o3VgJ2qz8WZk0rBf3mN7h…",
      "…c9ca2f7a2b1e5a830a7d019be47a1f5e // ?? lots of noise",
      "— END BLOCK —",
    ].join("\n"),
  },
  {
    id: "f2",
    name: "notes.txt",
    type: "text",
    size: "3 KB",
    modified: "2003-08-12 22:41",
    content: `quick pass on sequence.exe before bed.
kept the .enc here so i remember where i stopped.
– a`,
  },
  {
    id: "f3",
    name: "artifact.jpg",
    type: "image",
    size: "128 KB",
    modified: "2004-02-14 09:28",
    src: "/bin/artifact.jpg", // put this image in /public/bin/artifact.jpg
    alt: "Scanned polaroid with a hand-drawn sequence mark",
  },
];

export default function BinWindow({ files = DEFAULT_FILES, onClose, onOpenFile }: Props) {
  return (
    <div className="bin">
      <div className="titleBar">
        <span>Bin</span>
        <button className="titleClose" aria-label="Close" onClick={onClose}>×</button>
      </div>

      <div className="toolbar">
        <button className="btn" disabled title="Coming soon">Empty Bin</button>
      </div>

      <div className="list" role="list">
        {files.map((f) => (
          <div
            key={f.id}
            className="row"
            role="listitem"
            onDoubleClick={() => onOpenFile(f)}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpenFile(f)}
            title="Double-click to open"
          >
            <div className="cell icon">
              {f.type === "encrypted" ? <LockIcon/> : f.type === "image" ? <ImgIcon/> : <TxtIcon/>}
            </div>
            <div className="cell name">{f.name}</div>
            <div className="cell size">{f.size ?? ""}</div>
            <div className="cell mod">{f.modified ?? ""}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .bin { width: 560px; background: #0f0f0f; color: #e6e6e6; border: 1px solid #444;
               box-shadow: 0 0 0 1px #333, 0 12px 40px rgba(0,0,0,0.8);
               font: 11px Tahoma, "MS Sans Serif", sans-serif; }
        .titleBar { background: #1a1aa6; color: #fff; padding: 4px 8px; display: flex;
                    justify-content: space-between; align-items: center; font-weight: bold; }
        .titleClose { background: #1a1a1a; color: #e6e6e6; border: 1px solid #000; width: 22px; height: 18px;
                      line-height: 16px; padding: 0; cursor: pointer;
                      box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
                      -webkit-appearance: none; appearance: none; border-radius: 0; }
        .titleClose:focus { outline: none; }
        .titleClose:active { box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; }

        .toolbar { padding: 6px; border-bottom: 1px solid #333; background: #111;
                   box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; }
        .btn { height: 22px; background: #1a1a1a; color: #aaa; border: 1px solid #000;
               box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
               padding: 0 10px; cursor: default; }
        .btn:disabled { opacity: 0.7; }

        .list { display: grid; padding: 6px; gap: 4px; max-height: 360px; overflow: auto; }
        .row { display: grid; grid-template-columns: 22px 1fr 80px 150px; align-items: center; gap: 8px;
               padding: 4px 6px; border: 1px solid #333; background: #111;
               box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; cursor: default; }
        .row:focus { outline: none; box-shadow: 0 0 0 1px #9fb4ff inset; }
        .cell.icon { display: grid; place-items: center; }
        .cell.name { color: #eaeaea; }
        .cell.size, .cell.mod { color: #9a9a9a; font-size: 10px; text-align: right; }
      `}</style>
    </div>
  );
}

function TxtIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="#d7d7d7" d="M6 2h9l5 5v15H6z"/>
      <path fill="#9a9a9a" d="M15 2v5h5"/>
      <path fill="#111" d="M8 12h8v1H8zm0 3h8v1H8zm0 3h5v1H8z"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" fill="#d7d7d7"/>
      <path d="M8 10V8a4 4 0 118 0v2" fill="none" stroke="#d7d7d7" strokeWidth="2"/>
    </svg>
  );
}
function ImgIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" fill="#d7d7d7"/>
      <circle cx="9" cy="9" r="2" fill="#111"/>
      <path d="M4 18l6-6 4 4 3-3 4 5" fill="none" stroke="#111" strokeWidth="1.5"/>
    </svg>
  );
}
