"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onClose: () => void; title?: string };
const STORAGE_KEY = "sequence/thoughts.txt";

export default function Thoughts({ onClose, title = "THOUGHTS" }: Props) {
  const [value, setValue] = useState("");
  const [wrap, setWrap] = useState(true);
  const saveTimer = useRef<number | null>(null);

  // load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved != null) setValue(saved);
  }, []);

  // autosave (debounced)
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, value);
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [value]);

  function handleExport() {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "thoughts.txt";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="win">
      <div className="titleBar">
        <span>{title}</span>
        <button className="titleClose" aria-label="Close" onClick={onClose}>×</button>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={() => setValue("")}>New</button>
        <button className="btn" onClick={handleExport}>Export</button>
        <label className="chk">
          <input type="checkbox" checked={wrap} onChange={e => setWrap(e.target.checked)} />
          Word wrap
        </label>
      </div>

      <textarea
        className="editor"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        wrap={wrap ? "soft" : "off"}
        spellCheck={false}
        autoFocus
      />

      <style jsx>{`
        .win{ width: 560px; height: 380px; background:#0f0f0f; color:#e6e6e6;
              border:1px solid #444; box-shadow:0 0 0 1px #333, 0 12px 40px rgba(0,0,0,0.8);
              display:grid; grid-template-rows:auto auto 1fr; font:11px Tahoma,"MS Sans Serif",sans-serif; }
        .titleBar{ background:#1a1aa6; color:#fff; padding:4px 8px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; }
        .titleClose{ background:#1a1a1a; color:#e6e6e6; border:1px solid #000; width:22px; height:18px; line-height:16px; padding:0; cursor:pointer;
                     box-shadow:inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000; -webkit-appearance:none; appearance:none; border-radius:0; }
        .titleClose:focus{ outline:none; }
        .titleClose:active{ box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; }
        .toolbar{ padding:6px; border-bottom:1px solid #333; background:#111;
                  box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; display:flex; gap:8px; align-items:center; }
        .btn{ height:22px; background:#1a1a1a; color:#e6e6e6; border:1px solid #000;
              box-shadow:inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000; padding:0 10px; cursor:pointer; }
        .btn:active{ box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000; transform:translateY(1px); }
        .chk{ display:flex; align-items:center; gap:6px; color:#cfcfcf; }
        .editor{ width:100%; height:100%; background:#0a0a0a; color:#d7d7d7; border:none; outline:none; padding:10px;
                 font:12px "Lucida Console", Consolas, monospace; resize:none; }
      `}</style>
    </div>
  );
}
