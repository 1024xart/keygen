"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onClose?: () => void; title?: string };
const PALETTE = [
  "#ffffff","#d7ff00","#00ffd7","#00a2ff","#b667ff",
  "#ff3ca6","#ff9f1a","#bbbbbb","#000000"
];

export default function Studio({ onClose, title = "STUDIO" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(4);
  const drawingRef = useRef(false);

  // init canvas backing store for crisp drawing
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const w = 520, h = 300;
    c.width = w * DPR; c.height = h * DPR;
    c.style.width = w + "px"; c.style.height = h + "px";
    const ctx = c.getContext("2d")!;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // safer than scale() if re-init
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  }, []);

  function getCtx() {
    const c = canvasRef.current;
    return c ? c.getContext("2d")! : null;
  }

  function localXY(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    const ctx = getCtx(); if (!ctx) return;

    c.setPointerCapture(e.pointerId);
    const { x, y } = localXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    drawingRef.current = true;
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = getCtx(); if (!ctx) return;
    const { x, y } = localXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onUp(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (e) {
      try { (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
    }
    drawingRef.current = false;
  }

  function clear() {
    const ctx = getCtx(); if (!ctx) return;
    const c = canvasRef.current!; const w = c.clientWidth, h = c.clientHeight;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  }

  function savePNG() {
    const c = canvasRef.current!;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "studio.png"; a.click();
  }

  return (
    <div className="win" role="dialog" aria-label={title}>
      <div className="titleBar" data-drag-handle>
        <span>{title}</span>
        <button
          className="titleClose"
          aria-label="Close"
          onClick={() => onClose?.()}
        >
          ×
        </button>
      </div>

      <div className="toolbar">
        <div className="swatches">
          {PALETTE.map((p) => (
            <button
              key={p}
              className={`sw ${p === color ? "sel" : ""}`}
              style={{ background: p }}
              onClick={() => setColor(p)}
              title={p}
            />
          ))}
        </div>
        <div className="tools">
          <label className="label">Size</label>
          <input
            type="range"
            min={1}
            max={24}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          />
          <button className="btn" onClick={clear}>Clear</button>
          <button className="btn" onClick={savePNG}>Save</button>
        </div>
      </div>

      <div className="canvasWrap">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
      </div>

      <style jsx>{`
        .win {
          width: 560px;
          background:#0f0f0f;
          color:#e6e6e6;
          border:1px solid #444;
          box-shadow:0 0 0 1px #333, 0 12px 40px rgba(0,0,0,0.8);
          display:grid;
          grid-template-rows:auto auto 1fr;
          font:11px Tahoma,"MS Sans Serif",sans-serif;
        }
        .titleBar {
          background:#1a1aa6;
          color:#fff;
          padding:4px 8px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          font-weight:bold;
          user-select:none;
          cursor:default;
        }
        .titleClose {
          background:#1a1a1a; color:#e6e6e6; border:1px solid #000;
          width:22px; height:18px; line-height:16px; padding:0; cursor:pointer;
          box-shadow:inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
          -webkit-appearance:none; appearance:none; border-radius:0;
        }
        .titleClose:focus { outline:none; }
        .titleClose:active {
          box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
        }

        .toolbar {
          display:flex; justify-content:space-between; align-items:center; gap:10px; padding:6px;
          border-bottom:1px solid #333;
          background:#111; box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
        }
        .swatches { display:flex; gap:6px; }
        .sw {
          width:18px; height:18px; border:1px solid #000;
          box-shadow:inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          cursor:pointer;
        }
        .sw.sel { outline:1px solid #9fb4ff; outline-offset:1px; }
        .tools { display:flex; align-items:center; gap:8px; }
        .label { color:#cfcfcf; }
        .btn {
          height:22px; background:#1a1a1a; color:#e6e6e6; border:1px solid #000;
          box-shadow:inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000, 0 0 0 1px #000;
          padding:0 10px; cursor:pointer;
        }
        .btn:active {
          box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a, 0 0 0 1px #000;
          transform:translateY(1px);
        }

        .canvasWrap { padding:8px; display:grid; place-items:center; }
        canvas {
          image-rendering: pixelated;
          border:1px solid #333;
          box-shadow:inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          touch-action: none; /* better pointer drawing on touch */
        }
      `}</style>
    </div>
  );
}
