// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Hold to confirm (M21 `cards.action-controls` Hold to confirm Not for me, `flows.clear-my-data` Hold to
// clear): 1 s on a pointer or a held Enter / Space; letting go early cancels. Its fill is a transform, so
// reduced motion shows it filled at once (now.css).
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cx } from '../../design/atoms/Button';

/** Hold to confirm (1 s): a pointer or a held Enter / Space; letting go early cancels. */
export function HoldButton({
  children,
  onConfirm,
  ms = 1000,
  describedBy,
}: {
  children: ReactNode;
  onConfirm(): void;
  ms?: number;
  describedBy?: string;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, ms);
  };
  // Letting go of the page (unmount) cancels a hold in progress.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      className={cx('a-btn a-btn--quiet n-hold', holding && 'is-holding')}
      aria-describedby={describedBy}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') stop();
      }}
      onBlur={stop}
    >
      <span className="n-hold__fill" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
