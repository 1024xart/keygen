// src/app/ui95/StartMenu.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { Frame, MenuList, MenuListItem, Separator } from 'react95';

export default function StartMenu({
  anchorEl,
  open,
  onOpenApp,
  onDismiss,
}: {
  anchorEl: HTMLElement | null;
  open: boolean;
  onOpenApp: (id: 'tr01' | 'keygen') => void; // ← updated union
  onDismiss: () => void;
}) {
  // Always call hooks in the same order
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  const pos = useMemo(() => {
    if (!anchorEl) return { left: 6, bottom: 46 };
    const r = anchorEl.getBoundingClientRect();
    return { left: r.left, bottom: window.innerHeight - r.top + 6 };
  }, [anchorEl]);

  if (!open) return null;

  return (
    <div onClick={onDismiss} style={{ position: 'absolute', inset: 0, zIndex: 1200 }}>
      <Frame
        variant="outside"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: pos.left,
          bottom: pos.bottom,
          width: 220,
          background: 'silver',
        }}
      >
        <MenuList onClick={onDismiss}>
          <MenuListItem onClick={() => onOpenApp('tr01')}>TR01</MenuListItem>
          <MenuListItem onClick={() => onOpenApp('keygen')}>SEQUENCE Keygen</MenuListItem>
          <Separator />
          <MenuListItem disabled>Logout</MenuListItem>
        </MenuList>
      </Frame>
    </div>
  );
}
