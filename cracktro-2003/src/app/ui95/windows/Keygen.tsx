// src/app/ui95/windows/Keygen.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import {
  Window,
  WindowHeader,
  WindowContent,
  Button,
  TextField,
  Frame,
  Select,
  Progress,
} from 'react95';
import { setLicense, clearLicense, type AppId, type License } from '@/system/license';

type Props = { onFocus?: () => void; onClose?: () => void };

// --- constants / helpers (ported from your original) ---
const BANNER_URL = '/banner.gif';
const VERSION = 'v0.2.0';
const MUSIC_TARGET_VOL = 0.45;
const LIFESPAN_MS = 7 * 24 * 60 * 60 * 1000;

const APP_IDS = ['TR01', 'BMR08', 'BR09'] as const;
type TargetId = typeof APP_IDS[number];

const DISPLAY_LABELS: Record<TargetId, string> = {
  TR01: 'TR01',
  BMR08: 'BMR08',
  BR09: 'BR09',
};

function hash32(str: string, salt = 0) {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}
function makeSerial(program: string | undefined, request: string) {
  const base = `${(program ?? '').trim().toUpperCase()}::${request.trim().toUpperCase()}`;
  const h = hash32(base, 0x5ea1);
  const a = (h & 0xffff).toString(16).padStart(4, '0');
  const b = ((h >>> 16) & 0xffff).toString(16).padStart(4, '0');
  const c = Math.abs(h).toString(36).slice(0, 4).toUpperCase();
  return `${a}-${b}-${c}`.toUpperCase();
}
function makePlaceholder() {
  const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const g = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
  return `${g()}-${g()}-${g()}`;
}

export default function Keygen({ onFocus, onClose }: Props) {
  // geometry
  const defaults = useMemo(() => ({ x: 120, y: 120, width: 640, height: 'auto' as const }), []);

  // inputs
  const [program, setProgram] = useState<TargetId | ''>('');
  const [request, setRequest] = useState('');

  // activation output + flicker
  const [activation, setActivation] = useState('');
  const [serialView, setSerialView] = useState('');
  const [copied, setCopied] = useState(false);

  // progress / patching
  const [patching, setPatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const pendingLicenseRef = useRef<License | null>(null);

  // music (simple mute toggle; keeps your banner vibe)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    a.play()
      .then(() => {
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 900);
          a.volume = MUSIC_TARGET_VOL * k;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      })
      .catch(() => {
        /* user gesture will be needed */
      });
  }, []);
  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
    if (!a.paused && !a.muted) a.volume = MUSIC_TARGET_VOL;
  };

  // clear activation view when inputs change
  useEffect(() => {
    setSerialView('');
    setActivation('');
  }, [program, request]);

  // progress loop
  useEffect(() => {
    if (!patching) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + 6 + Math.floor(Math.random() * 10));
        if (n >= 100) {
          clearInterval(id);
          setPatching(false);
          if (pendingLicenseRef.current) {
            try {
              setLicense(pendingLicenseRef.current);
            } catch {
              /* noop if not wired */
            }
            pendingLicenseRef.current = null;
          }
        }
        return n;
      });
    }, 120);
    return () => clearInterval(id);
  }, [patching]);

  // flicker reveal effect
  const flicker = (to: string) => {
    if (!to) return;
    const HEX = '0123456789ABCDEF';
    let i = 0;
    const steps = 12;
    const id = setInterval(() => {
      const scrambled = to
        .split('')
        .map((c) => (c === '-' ? '-' : HEX[Math.floor(Math.random() * HEX.length)]))
        .join('');
      setSerialView(scrambled);
      if (++i >= steps) {
        clearInterval(id);
        setSerialView(to);
      }
    }, 45);
  };

  const toCopy = serialView || activation;

  const handleFocus = () => onFocus?.();

  // ---- About modal state ----
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutBtnRef = useRef<HTMLButtonElement | null>(null);
  const okRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aboutOpen) setAboutOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aboutOpen]);

  useEffect(() => {
    // simple focus management
    if (aboutOpen) setTimeout(() => okRef.current?.focus(), 0);
    else setTimeout(() => aboutBtnRef.current?.focus(), 0);
  }, [aboutOpen]);

  return (
    <Rnd
      default={{ x: defaults.x, y: defaults.y, width: defaults.width, height: defaults.height }}
      bounds="#workarea"
      enableResizing={{ right: true }}
      dragHandleClassName="drag-handle"
      onDragStart={handleFocus}
      onResizeStart={handleFocus}
      style={{ position: 'absolute' }}
    >
      {/* position:relative to anchor the in-window modal overlay */}
      <Window style={{ width: '100%', position: 'relative' }}>
        <WindowHeader className="drag-handle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>SEQUENCE Keygen {VERSION}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</Button>
            <Button size="sm" onClick={onClose}>✖</Button>
          </div>
        </WindowHeader>

        <WindowContent>
          {/* hidden audio */}
          <audio ref={audioRef} style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
            <source src="/keygen.mp3" type="audio/mpeg" />
          </audio>

          {/* banner */}
          <Frame variant="well" style={{ marginBottom: 10, padding: 2 }}>
            <img src={BANNER_URL} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </Frame>

          {/* Program */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ textAlign: 'right', paddingRight: 6 }}>Program:</div>
            <Select
              width="100%"
              options={[
                { label: 'Select…', value: '' },
                ...APP_IDS.map((id) => ({ label: DISPLAY_LABELS[id], value: id })),
              ]}
              value={program}
              onChange={(option) => setProgram((option?.value ?? '') as TargetId | '')}
            />
          </div>

          {/* Request */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ textAlign: 'right', paddingRight: 6 }}>Request:</div>
            <TextField
              placeholder="Paste Request here"
              value={request}
              onChange={(e: any) => setRequest(e.target.value)}
              fullWidth
            />
          </div>

          {/* Activation (display + copy) */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ textAlign: 'right', paddingRight: 6 }}>Activation:</div>
            <TextField readOnly value={serialView || activation} placeholder="(empty)" fullWidth />
            <Button
              disabled={!toCopy}
              onClick={() => {
                if (!toCopy) return;
                navigator.clipboard.writeText(toCopy).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 900);
                });
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {/* Progress + status */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ textAlign: 'right', paddingRight: 6 }}>Progress:</div>
            <Progress value={progress} style={{ width: '100%' }} />
          </div>
          {(patching || progress === 100) && (
            <div style={{ marginTop: 6 }}>
              {patching ? `Patching… ${progress}%` : 'Patch successful.'}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Button
              onClick={() => {
                const target = request ? makeSerial(program || undefined, request) : makePlaceholder();
                setActivation(target);
                flicker(target);
              }}
            >
              Generate
            </Button>

            <Button
              disabled={!program}
              onClick={() => {
                if (!program) return;
                setProgress(0);
                setPatching(true);
                const now = Date.now();
                const key = (serialView || activation || makePlaceholder()) + '-SEQ';
                pendingLicenseRef.current = {
                  key,
                  name: DISPLAY_LABELS[program],
                  appId: program as AppId,
                  issuedAt: now,
                  expiresAt: now + LIFESPAN_MS,
                };
              }}
            >
              Patch
            </Button>

            <Button onClick={onClose}>Exit</Button>
            {/* NEW: About button */}
            <Button ref={aboutBtnRef} onClick={() => setAboutOpen(true)}>
              About
            </Button>
          </div>
        </WindowContent>

        {/* REMOVED: bottom tip/status Frame */}
        {/* (nothing here now) */}

        {/* About modal (inside window; overlays content) */}
        {aboutOpen && (
          <div
            onClick={() => setAboutOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 10,
            }}
          >
            <Frame
              variant="outside"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 420, background: 'silver', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
            >
              <div style={{ padding: 10 }}>
                <Frame variant="well" style={{ padding: 6, marginBottom: 10 }}>
                  <pre style={{ margin: 0, fontFamily: '"Lucida Console", Consolas, monospace', fontSize: 12 }}>
{String.raw`
 _  ___ ____  _  _        SEQUENCE-1024x
/ |/ _ \___ \| || |__  __ v${VERSION}
| | | |__) | | || |\ \/ /
| | |_| / __/|__   _>  <
|_|\___/_____|  |_|/_/\_\
`.trim()}
                  </pre>
                </Frame>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button ref={okRef} onClick={() => setAboutOpen(false)}>OK</Button>
                </div>
              </div>
            </Frame>
          </div>
        )}
      </Window>
    </Rnd>
  );
}
