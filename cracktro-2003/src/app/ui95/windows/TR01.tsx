// src/app/ui95/windows/TR01.tsx
'use client';

import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import {
  Window,
  WindowHeader,
  WindowContent,
  Button,
  TextField,
  Frame,
} from 'react95';
import { useWM } from '../wm';
import { useLicense } from '@/system/license'; // license drives "Patched" view

type Props = {
  onFocus?: () => void;
  onClose?: () => void;
};

export default function TR01({ onFocus, onClose }: Props) {
  const { closeWin, focusWin } = useWM();

  const [requestCode] = useState('04FC-36EC-1XEA');
  const [activationCode, setActivationCode] = useState('');

  // NEW: UI flags
  const [copied, setCopied] = useState(false);          // Copy button label
  const [activated, setActivated] = useState(false);    // flips to true after correct activation
  const [activateError, setActivateError] = useState(false); // transient inline error

  // --- license from shared store (becomes non-null after Keygen -> Patch) ---
  const { license, expired } = useLicense('TR01');
  const isPatched = !!license && !expired;

  // --- Auto width via DOM measurement of a hidden TextField ---
  const placeholder = 'Paste code from SEQUENCE keygen';
  const measureRef = useRef<HTMLInputElement | null>(null);
  const [winWidth, setWinWidth] = useState<number>(560);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const fieldW = el.offsetWidth;
    const L = 120;     // label column width
    const B = 110;     // button column width
    const GAP = 8 + 8; // two gaps
    const OUTER = 48;  // padding/border buffer

    const minNeeded = L + GAP + fieldW + B + OUTER;
    const viewportMax =
      typeof window !== 'undefined' ? Math.max(480, window.innerWidth - 40) : 900;

    const computed = Math.min(Math.max(Math.ceil(minNeeded), 560), viewportMax);
    setWinWidth(computed);
  }, [placeholder]);

  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(requestCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // keep label as "Copy" if clipboard fails; you could surface a toast if you like
    }
  };

  // --- same algorithm as Keygen to verify Activation ---
  function hash32(str: string, salt = 0) {
    let h = 0x811c9dc5 ^ salt;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }
  function expectedSerial(program: string, request: string) {
    const base = `${program.trim().toUpperCase()}::${request.trim().toUpperCase()}`;
    const h = hash32(base, 0x5ea1);
    const a = (h & 0xffff).toString(16).padStart(4, '0');
    const b = ((h >>> 16) & 0xffff).toString(16).padStart(4, '0');
    const c = Math.abs(h).toString(36).slice(0, 4).toUpperCase();
    return `${a}-${b}-${c}`.toUpperCase();
  }

  const activate = () => {
    const got = activationCode.trim().toUpperCase();
    const want = expectedSerial('TR01', requestCode);

    if (got && got === want) {
      setActivated(true);        // ← Status becomes "Pending patch"
      setActivateError(false);
    } else {
      setActivateError(true);    // brief error, Status remains "Trial"
      setTimeout(() => setActivateError(false), 1500);
    }
  };

  const handleFocus = () => {
    onFocus?.();
    focusWin('tr01');
  };

  const defaults = useMemo(
    () => ({ x: 80, y: 80, width: 560, height: 'auto' as const }),
    []
  );

  // Derived status label
  const statusLabel = isPatched ? 'Patched' : activated ? 'Pending patch' : 'Trial';

  return (
    <Rnd
      default={{ x: defaults.x, y: defaults.y, width: defaults.width, height: defaults.height }}
      size={{ width: winWidth, height: 'auto' as const }}
      onResize={(e, dir, ref) => setWinWidth(ref.offsetWidth)}
      bounds="#workarea"
      enableResizing={{ right: true }}
      dragHandleClassName="drag-handle"
      onDragStart={handleFocus}
      onResizeStart={handleFocus}
      style={{ position: 'absolute', maxWidth: 'calc(100vw - 40px)' }}
    >
      <Window style={{ width: '100%' }} onMouseDown={handleFocus}>
        <WindowHeader className="drag-handle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>TR01</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={() => (onClose ? onClose() : closeWin('tr01'))}>✖</Button>
          </div>
        </WindowHeader>

        <WindowContent>
          {/* Hidden measurer */}
          <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: -99999, top: -99999 }}>
            <TextField
              value={placeholder}
              onChange={() => {}}
              ref={(node: any) => {
                measureRef.current = node as HTMLInputElement | null;
              }}
            />
          </div>

          {/* If patched, show art; else show trial UI */}
          {isPatched ? (
            <Frame variant="well" style={{ padding: 2 }}>
              <img src="/art1.gif" alt="TR01 art" style={{ display: 'block', width: '100%', height: 'auto' }} />
            </Frame>
          ) : (
            <>
              {/* Request row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 110px',
                  gap: 8,
                  alignItems: 'center',
                  marginTop: 2,
                  marginBottom: 8,
                }}
              >
                <div style={{ textAlign: 'right', paddingRight: 6 }}>Request:</div>
                <TextField value={requestCode} readOnly fullWidth />
                <Button onClick={copyRequest}>{copied ? 'Copied' : 'Copy'}</Button>
              </div>

              {/* Activation row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 110px',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div style={{ textAlign: 'right', paddingRight: 6 }}>Activation:</div>
                <div style={{ display: 'contents' }}>
                  <TextField
                    value={activationCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivationCode(e.target.value)}
                    placeholder={placeholder}
                    fullWidth
                  />
                  <div style={{ position: 'relative' }}>
                    <Button primary disabled={!activationCode.trim()} onClick={activate}>
                      Activate
                    </Button>
                    {activateError && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          whiteSpace: 'nowrap',
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Invalid code
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ fontSize: 12, lineHeight: 1.35 }}>
                Open <strong>SEQUENCE.exe</strong>, choose <strong>TR01</strong>, paste the <em>Request</em>, generate,
                then paste the code here. After activation, return to the keygen and click <strong>Patch</strong>.
              </div>
            </>
          )}
        </WindowContent>

        {/* Status bar */}
        <Frame
          variant="status"
          style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', gap: 8 }}
        >
          <span>
            Status:&nbsp;<strong>{statusLabel}</strong>
          </span>
        </Frame>
      </Window>
    </Rnd>
  );
}
