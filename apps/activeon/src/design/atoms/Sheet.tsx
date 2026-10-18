// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The one second level (M21 DS-4, FR-F5, TR-5, TR-17): a bottom sheet on a phone, a side panel from
// 1000 px. role="dialog" with aria-modal, a focus trap, Esc to close, the rest of the page inert, and
// focus returned to the opener. A sheet never opens a sheet inline (DS-4): a deeper level replaces it.
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './Button';

export interface SheetProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
  /** auto: bottom under 1000 px, side panel from 1000 px. */
  side?: 'auto' | 'bottom' | 'panel';
  /** The close button's accessible name, from the engine's words. */
  closeLabel?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, title, onClose, children, side = 'auto', closeLabel = 'Close' }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const host = ref.current?.closest('.a-sheet-host');
    // Everything else on the page is inert while the sheet is open.
    const others = [...document.body.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== host && !el.hasAttribute('inert'),
    );
    for (const el of others) el.setAttribute('inert', '');
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z?.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      for (const el of others) el.removeAttribute('inert');
      opener?.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className={cx('a-sheet-host', `a-sheet-host--${side}`)}>
      <button
        type="button"
        className="a-sheet-scrim"
        aria-label={closeLabel}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={ref}
        className="a-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="a-sheet__head">
          <h2 className="a-sheet__title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="a-icon-btn a-sheet__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="a-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
