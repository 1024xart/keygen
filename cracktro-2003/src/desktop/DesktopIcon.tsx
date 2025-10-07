// src/desktop/DesktopIcon.tsx
"use client";

import { useState } from "react";

type Props = {
  label: string;
  onOpen: () => void;
  iconSrc?: string; // path under /public (e.g. "/sequence-icon.png")
};

export default function DesktopIcon({ label, onOpen, iconSrc = "/sequence-icon.png" }: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      className={`icon ${selected ? "selected" : ""}`}
      onClick={() => setSelected((s) => !s)}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      title={label}
    >
      <span className="art">
        <img src={iconSrc} alt="" />
      </span>
      <span className="label">{label}</span>

      <style jsx>{`
        .icon {
          width: 92px;
          background: transparent;
          border: 0;
          padding: 6px 4px;
          display: grid;
          justify-items: center;
          gap: 6px;
          cursor: default;
          outline: none;
          user-select: none;
        }
        .art {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
        }
        .art img {
          width: 48px;
          height: 48px;
          image-rendering: pixelated; /* crisp retro */
          display: block;
        }
        .label {
          max-width: 100%;
          text-align: center;
          font: 10px Tahoma, "MS Sans Serif", sans-serif;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000;
          line-height: 1.2;
          padding: 2px 4px;
          border: 1px solid transparent;
          background: transparent;
        }
        .icon.selected .label {
          border-color: #5b2fb0;
          background: rgba(20, 20, 20, 0.45);
          box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
        }
      `}</style>
    </button>
  );
}
