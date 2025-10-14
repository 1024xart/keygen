'use client';

import { useRef, useState } from 'react';
import { Button, Frame } from 'react95';
import StartMenu from './StartMenu';
import { useWM } from './wm';
import TR01 from './windows/TR01';
import Keygen from './windows/Keygen';

export default function Desktop() {
  const startBtnRef = useRef<HTMLButtonElement | null>(null);
  const [startOpen, setStartOpen] = useState(false);

  // include closeWin so windows can close themselves
  const { open, order, openWin, focusWin, closeWin } = useWM();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#008080', // wallpaper color; swap for image later
      }}
    >
      {/* Work area (above wallpaper, below taskbar) */}
      <div id="workarea" style={{ position: 'absolute', inset: '0 0 40px 0', padding: 12 }}>
        {/* Windows render in z-order */}
        {order.map((id, idx) => {
          if (!open[id]) return null;
          const z = 10 + idx; // base z

          if (id === 'tr01') {
            return (
              <div key={id} style={{ position: 'absolute', zIndex: z }}>
                <TR01
                  onFocus={() => focusWin('tr01')}
                  onClose={() => closeWin('tr01')}
                />
              </div>
            );
          }

          if (id === 'keygen') {
            return (
              <div key={id} style={{ position: 'absolute', zIndex: z }}>
                <Keygen
                  onFocus={() => focusWin('keygen')}
                  onClose={() => closeWin('keygen')}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Taskbar */}
      <Frame
        variant="outside"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 40,
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'silver',
          zIndex: 1000,
        }}
      >
        <Button ref={startBtnRef} onClick={() => setStartOpen((o) => !o)}>
          Start
        </Button>

        {/* Task buttons reflect open windows & z-order */}
        {order.map((id) =>
          open[id] ? (
            <Button key={id} onClick={() => focusWin(id)}>
              {id.toUpperCase()}
            </Button>
          ) : null
        )}
      </Frame>

      {/* Start menu (click outside closes) */}
      <StartMenu
        anchorEl={startBtnRef.current}
        open={startOpen}
        onOpenApp={(id) => {
          openWin(id as 'tr01' | 'keygen');
          setStartOpen(false);
        }}
        onDismiss={() => setStartOpen(false)}
      />
    </div>
  );
}
