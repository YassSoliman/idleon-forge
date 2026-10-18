// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Sheet atom (F's, FR-F5) as area N opens it. Esc closes the sheet and only the sheet: the shell
// also listens for Esc on the window to close a Character page (M10 FR-13), so an open sheet takes the
// key first, in the capture phase, and stops it there. (Cross-area request: the shell's Esc handler
// can skip itself while a dialog is open; then this guard is a no-op.)
import { useEffect, useRef } from 'react';
import { Sheet, type SheetProps } from '../../design/atoms/Sheet';

export function ModalSheet(props: SheetProps) {
  const { open, onClose } = props;
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Stops it before the atom's own document listener and the shell's window listener.
      e.stopImmediatePropagation();
      e.preventDefault();
      close.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);
  return <Sheet {...props} />;
}
