// src/desktop/ui/Window.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Pos = { x: number; y: number };
let Z_COUNTER = 10;

type Props = {
  children: ReactNode;

  // Chrome
  chrome?: "external" | "internal";
  title?: string;
  onRequestClose?: () => void;

  // Dragging
  handleSelector?: string;

  // Positioning
  defaultPosition?: Pos;
  centerOnMount?: boolean;
  boundsPadding?: number;
  taskbarHeight?: number;

  widthHint?: number;
  heightHint?: number;

  // Layering
  zIndex?: number;

  // bump this number to programmatically bring to front
  activateSignal?: number;
};

export default function Window({
  children,
  chrome = "external",
  title = "Window",
  onRequestClose,
  handleSelector,
  defaultPosition,
  centerOnMount = true,
  boundsPadding = 8,
  taskbarHeight = 36,
  widthHint,
  heightHint,
  zIndex = 7,
  activateSignal,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const zRef = useRef<number>(Math.max(zIndex, ++Z_COUNTER));
  const dragData = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    dragging: boolean;
  } | null>(null);

  const [pos, setPos] = useState<Pos>(() => defaultPosition ?? { x: boundsPadding, y: boundsPadding });
  const [positioned, setPositioned] = useState<boolean>(!!defaultPosition);

  const clampToBounds = useCallback((x: number, y: number) => {
    const el = rootRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = el?.getBoundingClientRect();
    const w = rect?.width || widthHint || 600;
    const h = rect?.height || heightHint || 400;

    const minX = boundsPadding;
    const minY = boundsPadding;
    const maxX = Math.max(boundsPadding, vw - w - boundsPadding);
    const maxY = Math.max(boundsPadding, vh - taskbarHeight - h - boundsPadding);

    return {
      x: Math.min(maxX, Math.max(minX, Math.round(x))),
      y: Math.min(maxY, Math.max(minY, Math.round(y))),
    };
  }, [boundsPadding, taskbarHeight, widthHint, heightHint]);

  const centerNow = useCallback(() => {
    const el = rootRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = el?.getBoundingClientRect();
    const w = rect?.width || widthHint || 600;
    const h = rect?.height || heightHint || 400;

    const x = Math.round((vw - w) / 2);
    const y = Math.round((vh - taskbarHeight - h) / 2);
    const clamped = clampToBounds(x, y);

    setPos(clamped);
    setPositioned(true);
  }, [clampToBounds, taskbarHeight, widthHint, heightHint]);

  useLayoutEffect(() => {
    if (defaultPosition) {
      const clamped = clampToBounds(defaultPosition.x, defaultPosition.y);
      setPos(clamped);
      setPositioned(true);
      return;
    }
    if (centerOnMount) centerNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => clampToBounds(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampToBounds]);

  const getHandleEl = useCallback((): HTMLElement | null => {
    const el = rootRef.current;
    if (!el) return null;
    if (chrome === "internal") return el.querySelector<HTMLElement>(".winTitleBar");
    const selector = handleSelector ?? ".titleBar, .banner, .dragHandle, .panel";
    return el.querySelector<HTMLElement>(selector);
  }, [chrome, handleSelector]);

  const raise = useCallback(() => {
    zRef.current = ++Z_COUNTER;
    setPos((p) => ({ ...p })); // nudge to re-render with new z
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const handleEl = getHandleEl();
    if (!root || !handleEl) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, select, textarea, a")) return;

      raise();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      dragData.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: pos.x,
        baseY: pos.y,
        dragging: true,
      };
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = dragData.current;
      if (!d?.dragging) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      setPos(clampToBounds(d.baseX + dx, d.baseY + dy));
    };

    const end = (e?: PointerEvent) => {
      const d = dragData.current;
      if (!d?.dragging) return;
      dragData.current = null;
      if (e) (handleEl as HTMLElement).releasePointerCapture?.(e.pointerId);
    };

    handleEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", () => end());

    return () => {
      handleEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", () => end());
    };
  }, [pos, clampToBounds, getHandleEl, raise]);

  useEffect(() => {
    if (activateSignal != null) raise();
  }, [activateSignal, raise]);

  return (
    <div
      ref={rootRef}
      className="winRoot"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: zRef.current,
        opacity: positioned ? 1 : 0,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={title}
    >
      {chrome === "internal" ? (
        <div className="winFrame">
          <div className="winTitleBar" data-drag-region>
            <div className="winTitle">{title}</div>
            {onRequestClose && (
              <button className="winCtrl winClose" aria-label="Close window" onClick={onRequestClose}>
                ×
              </button>
            )}
          </div>
          <div className="winBody">{children}</div>
        </div>
      ) : (
        children
      )}

      <style jsx>{`
        /* ====== SequenceOS window chrome ====== */
        .winFrame{
          background: linear-gradient(180deg, var(--seq-bg-1), var(--seq-bg-2));
          color: var(--seq-text-hi);
          border-radius: var(--seq-r-8);
          border: 1px solid var(--seq-stroke-0);
          outline: 1px solid var(--seq-stroke-1);
          box-shadow: var(--seq-elev-1);
          display: grid;
          grid-template-rows: auto 1fr;
          min-width: 320px;
          font: 12px/1.2 var(--seq-font-ui), system-ui, sans-serif;
        }

        .winTitleBar{
          height: 34px;
          display: flex; align-items: center; gap: 8px;
          padding: 0 10px; user-select: none;
          background: linear-gradient(180deg, #1a1d27, #12141a);
          box-shadow: inset 0 1px 0 #6a6a6a, inset -1px -1px 0 #000;
          cursor: default;
        }

        .winTitle{
          font-weight: 700; letter-spacing: .3px; pointer-events: none;
        }

        .winCtrl{
          width: 22px; height: 22px; display: grid; place-items: center;
          border-radius: var(--seq-r-2);
          background: #1a1b21; color: var(--seq-text-hi);
          border: 1px solid #000; box-shadow: var(--seq-elev-0);
          cursor: pointer;
          transition: transform var(--seq-dur-press) var(--seq-ease-snap),
                      box-shadow var(--seq-dur-hover) var(--seq-ease-snap),
                      filter var(--seq-dur-hover) var(--seq-ease-snap);
        }
        .winCtrl:hover{ box-shadow: var(--seq-elev-0), 0 0 18px var(--seq-accent-glow); }
        .winCtrl:active{ transform: translateY(1px); }
        .winClose:hover{ background: #25151f; }

        .winBody{
          padding: 12px; /* symmetric padding fixes the “uneven gaps” */
        }

        /* Utility: to perfectly center inner panes (e.g., activation UI) */
        :global(.centerContent){ display: grid; place-items: center; min-height: 220px; }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce){
          .winCtrl{ transition: none !important; }
        }
      `}</style>
    </div>
  );
}
