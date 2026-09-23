"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
type Props = {
  title: string;
  children: ReactNode;
  active: boolean;
  minimized: boolean;
  order: number;
  wide?: boolean;
  kind: "keygen" | "readme" | "art";
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
};
export default function Window({
  title,
  children,
  active,
  minimized,
  order,
  kind,
  onFocus,
  onClose,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const placed = useRef(false);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!drag.current || !panel.current) return;
      setPosition({
        x: Math.max(
          8,
          Math.min(
            innerWidth - panel.current.offsetWidth - 8,
            drag.current.left + event.clientX - drag.current.x,
          ),
        ),
        y: Math.max(
          38,
          Math.min(
            innerHeight - panel.current.offsetHeight - 12,
            drag.current.top + event.clientY - drag.current.y,
          ),
        ),
      });
    };
    const stop = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
    };
  }, []);
  useEffect(() => {
    if (minimized) { placed.current = false; return; }
    if (!panel.current) return;
    const fit = () => {
      const el = panel.current!;
      const maxX = Math.max(8, innerWidth - el.offsetWidth - 8);
      const maxY = Math.max(38, innerHeight - el.offsetHeight - 12);
      setPosition((current) => {
        if (!placed.current || !current) {
          const x = (innerWidth - el.offsetWidth) / 2;
          return {
            x: Math.max(8, Math.min(maxX, x)),
            y: Math.max(
              38,
              Math.min(maxY, (innerHeight - el.offsetHeight) / 2),
            ),
          };
        }
        return {
          x: Math.max(8, Math.min(maxX, current.x)),
          y: Math.max(38, Math.min(maxY, current.y)),
        };
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(panel.current);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [minimized, kind]);
  useEffect(() => {
    if (
      active &&
      !minimized &&
      !panel.current?.contains(document.activeElement)
    )
      panel.current?.focus();
  }, [active, minimized]);
  return (
    <div
      className="piece-overlay"
      hidden={minimized}
      style={{ zIndex: 30 + order }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-label={title}
        className={"piece-panel panel-" + kind}
        style={{ left: position?.x ?? 8, top: position?.y ?? 38 }}
        onPointerDown={onFocus}
        onFocusCapture={onFocus}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <button
          className="piece-drag"
          aria-label={"Move " + title}
          title="Drag to move"
          onKeyDown={(event) => {
            const directions: Record<string, number[]> = {
              ArrowLeft: [-20, 0],
              ArrowRight: [20, 0],
              ArrowUp: [0, -20],
              ArrowDown: [0, 20],
            };
            const d = directions[event.key];
            if (d && position && panel.current) {
              event.preventDefault();
              placed.current = true;
              setPosition({
                x: Math.max(
                  8,
                  Math.min(
                    innerWidth - panel.current.offsetWidth - 8,
                    position.x + d[0],
                  ),
                ),
                y: Math.max(
                  38,
                  Math.min(
                    innerHeight - panel.current.offsetHeight - 12,
                    position.y + d[1],
                  ),
                ),
              });
            }
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 || !panel.current) return;
            placed.current = true;
            const r = panel.current.getBoundingClientRect();
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              left: r.left,
              top: r.top,
            };
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (!drag.current || !panel.current) return;
            setPosition({
              x: Math.max(
                8,
                Math.min(
                  innerWidth - panel.current.offsetWidth - 8,
                  drag.current.left + event.clientX - drag.current.x,
                ),
              ),
              y: Math.max(
                38,
                Math.min(
                  innerHeight - panel.current.offsetHeight - 12,
                  drag.current.top + event.clientY - drag.current.y,
                ),
              ),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <span aria-hidden="true">&middot;&middot;&middot;</span>
        </button>
        <button
          className="piece-close"
          aria-label={"Close " + title}
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </section>
    </div>
  );
}
