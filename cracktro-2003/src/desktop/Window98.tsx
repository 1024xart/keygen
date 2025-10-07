"use client";
import { useEffect, useRef, useState } from "react";

type Pos = { x: number; y: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

export default function Window98({
  title,
  open,
  onClose,
  children,
  width = 880,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<Pos>({ x: 100, y: 80 });
  const drag = useRef<{ start: Pos; offset: Pos } | null>(null);

  // center on mount
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const vw = innerWidth;
    const vh = innerHeight;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.round(vw / 2 - r.width / 2)),
      y: Math.max(16, Math.round(vh * 0.08)),
    });
  }, [open]);

  function down(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { start: { x: e.clientX, y: e.clientY }, offset: { x: r.left, y: r.top } };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const { start, offset } = drag.current;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = innerWidth;
    const vh = innerHeight;
    const x = offset.x + (e.clientX - start.x);
    const y = offset.y + (e.clientY - start.y);
    setPos({ x: clamp(x, 0, vw - r.width), y: clamp(y, 0, vh - Math.min(r.height, vh)) });
  }
  function up(e: React.PointerEvent) {
    drag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }

  if (!open) return null;

  return (
    <div ref={ref} className="win98" style={{ left: pos.x, top: pos.y, width }}>
      <div className="title" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <span>{title}</span>
        <div className="ctl">
          <button title="Minimize">▁</button>
          <button title="Close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="body">{children}</div>

      <style jsx>{`
        .win98 {
          position: absolute;
          background: #0f0f0f;
          color: #e6e6e6;
          border: 1px solid #444;
          box-shadow: 0 0 0 1px #222, 0 18px 70px rgba(0, 0, 0, 0.7);
          user-select: none;
        }
        .title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1aa6;
          color: #fff;
          padding: 4px 6px;
          font-weight: bold;
          cursor: move;
        }
        .ctl {
          display: flex;
          gap: 6px;
        }
        .ctl button {
          width: 22px;
          height: 18px;
          border: 1px solid #000;
          background: #1a1a1a;
          color: #e6e6e6;
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          border-radius: 0;
          line-height: 16px;
          padding: 0;
        }
        .ctl button:active {
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          transform: translateY(1px);
        }
        .body {
          padding: 10px;
          background: #0f0f0f;
        }
      `}</style>
    </div>
  );
}
