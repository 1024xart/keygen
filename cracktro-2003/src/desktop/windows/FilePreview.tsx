"use client";
import React from "react";
import type { FileEntry } from "./BinWindow";

type Props = {
  file: FileEntry;
  onClose: () => void;
};

export default function FilePreview({ file, onClose }: Props) {
  const isImage = file.type === "image";

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="win"
        role="dialog"
        aria-modal="true"
        aria-label={file.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="titleBar">
          <span>{file.name}</span>
          <button className="titleClose" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div className="body">
          {isImage ? (
            <div className="imgWrap">
              {/* @ts-expect-error narrow union at runtime */}
              <img src={file.src} alt={file.alt ?? file.name} />
            </div>
          ) : (
            <pre className={`content ${file.type === "encrypted" ? "enc" : ""}`}>
              {/* @ts-expect-error narrow union at runtime */}
              {file.content}
            </pre>
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay { position: fixed; inset: 0; display: grid; place-items: center;
                   background: rgba(0,0,0,0.45); z-index: 10; }
        .win { width: 560px; max-height: 70vh; background: #0f0f0f; color: #e6e6e6;
               border: 1px solid #444; box-shadow: 0 0 0 1px #333, 0 12px 40px rgba(0,0,0,0.8);
               font: 11px Tahoma, "MS Sans Serif", sans-serif; display: grid; grid-template-rows: auto 1fr; }
        .titleBar { background: #1a1aa6; color: #fff; padding: 4px 8px; display: flex;
                    justify-content: space-between; align-items: center; font-weight: bold; }
        .titleClose { background: #1a1a1a; color: #e6e6e6; border: 1px solid #000;
                      width: 22px; height: 18px; line-height: 16px; padding: 0; cursor: pointer;
                      box-shadow: inset 1px 1px 0 #6a6a6a, inset -1px -1px 0 #000;
                      -webkit-appearance: none; appearance: none; border-radius: 0; }
        .titleClose:focus { outline: none; }
        .titleClose:active { box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; }

        .body { padding: 8px; overflow: auto; }
        .content { margin: 0; white-space: pre-wrap; background: #0a0a0a; color: #d7d7d7;
                   border: 1px solid #333; box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a;
                   padding: 10px; font: 12px "Lucida Console", Consolas, monospace; }
        .content.enc { color: #b8a7ff; text-shadow: 0 0 6px rgba(182,103,255,0.35); }

        .imgWrap { display: grid; place-items: center; background: #0a0a0a; border: 1px solid #333;
                   box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 #6a6a6a; padding: 10px; }
        .imgWrap img { max-width: 100%; max-height: 58vh; display: block; }
      `}</style>
    </div>
  );
}
