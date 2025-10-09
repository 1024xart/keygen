// src/desktop/windows/FilePreview.tsx
"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { FileEntry } from "./BinWindow";
import Window from "@/desktop/ui/Window";

type Props = {
  file: FileEntry;
  onClose: () => void;
  // NEW: allow DesktopShell to bump this preview to the front (taskbar click)
  activateSignal?: number;
};

// Narrow the union using the discriminant `type`
type ImageEntry = Extract<FileEntry, { type: "image" }>;
type TextishEntry = Extract<FileEntry, { type: "text" | "encrypted" }>;

function isImageEntry(f: FileEntry): f is ImageEntry {
  return f.type === "image";
}
function isTextishEntry(f: FileEntry): f is TextishEntry {
  return f.type === "text" || f.type === "encrypted";
}

export default function FilePreview({ file, onClose, activateSignal }: Props) {
  const imageFile: ImageEntry | null = isImageEntry(file) ? (file as ImageEntry) : null;
  const textFile: TextishEntry | null = isTextishEntry(file) ? (file as TextishEntry) : null;

  return (
    <Window
      chrome="internal"
      title={file.name}
      onRequestClose={onClose}
      // give the Window some sizing hints so it can center before measuring
      widthHint={560}
      heightHint={420}
      activateSignal={activateSignal}
    >
      <div className="body">
        {imageFile ? (
          <div className="imgWrap">
            <img src={imageFile.src} alt={imageFile.alt ?? imageFile.name} />
          </div>
        ) : textFile ? (
          <pre className={`content ${textFile.type === "encrypted" ? "enc" : ""}`}>
            {textFile.content}
          </pre>
        ) : (
          <div className="content">Can’t preview this file.</div>
        )}
      </div>

      <style jsx>{`
        .body {
          padding: 8px;
          overflow: auto;
          max-height: 70vh;
        }
        .content {
          margin: 0;
          white-space: pre-wrap;
          background: #0a0a0a;
          color: #d7d7d7;
          border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          padding: 10px;
          font: 12px "Lucida Console", Consolas, monospace;
        }
        .content.enc {
          color: #b8a7ff;
          text-shadow: 0 0 6px rgba(182, 103, 255, 0.35);
        }
        .imgWrap {
          display: grid;
          place-items: center;
          background: #0a0a0a;
          border: 1px solid #333;
          box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
          padding: 10px;
        }
        .imgWrap img {
          max-width: 100%;
          max-height: 58vh;
          display: block;
        }
      `}</style>
    </Window>
  );
}
