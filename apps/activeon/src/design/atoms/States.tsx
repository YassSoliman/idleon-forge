// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Waiting, empty, broken and toast states (M21 FR-F5, TR-5, owner overrides "Blob walking" and
// "Sleeping blob", D-11, D-15, G3).
import { type ReactNode, useEffect, useState } from 'react';
import { PixelArt } from '../art/PixelArt';
import { Button, cx } from './Button';
import { GLYPH } from './glyphs';

export interface EmptyStateProps {
  /** Always names the next thing to do ("Nothing to do now. Back in 8h 10m: …"). */
  line: string;
  next?: ReactNode;
}

/** A screen-level empty state: the sleeping blob plus the next action. Inline empties are one plain line. */
export function EmptyState({ line, next }: EmptyStateProps) {
  return (
    <div className="a-empty">
      <PixelArt name={GLYPH.sleepingBlob} scale={2} decorative />
      <p className="a-empty__line">{line}</p>
      {next ? <div className="a-empty__next">{next}</div> : null}
    </div>
  );
}

export interface LoadingProps {
  /** Named steps ("Reading your save · Working it out · Drawing your characters"). */
  steps?: string[];
  current?: number;
  /** After this long, show `hint` (the Cloud Save hint after 30 s). */
  hintAfterMs?: number;
  hint?: string;
  /** Show nothing at all for this long, so a fast load never flashes (a lazy part: 400 ms). */
  delayMs?: number;
  /** The accessible name of the busy region when no steps are given. */
  label?: string;
  /** The skeleton under the blob, so nothing jumps when the answer lands. */
  skeleton?: ReactNode;
  /** The caller announces the wait itself (one polite line), so the blob carries no live role. */
  quiet?: boolean;
}

function useElapsed(ms: number | undefined): boolean {
  const [done, setDone] = useState(!ms);
  useEffect(() => {
    if (!ms) return;
    const t = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return done;
}

/** Our guide blob walking a 4-frame loop over a skeleton; reduced motion pins frame 1 (art.css). */
export function Loading({
  steps,
  current = 0,
  hintAfterMs,
  hint,
  delayMs,
  label,
  skeleton,
  quiet,
}: LoadingProps) {
  const shown = useElapsed(delayMs);
  const hinted = useElapsed(hintAfterMs ?? undefined) && hintAfterMs !== undefined;
  if (!shown) return <div className="a-loading a-loading--pending" aria-busy="true" />;
  const step = steps?.[Math.min(current, (steps?.length ?? 1) - 1)];
  return (
    <div className={cx('a-loading', delayMs !== undefined && 'a-loading--part')} aria-busy="true">
      {skeleton ? <div className="a-loading__skeleton">{skeleton}</div> : null}
      <div className="a-loading__blob" role={quiet ? undefined : 'status'}>
        <PixelArt name={GLYPH.walkingBlob} scale={delayMs !== undefined ? 1 : 2} animate decorative />
        <span className="a-loading__step" aria-hidden={quiet || undefined}>
          {step ?? label}
        </span>
        {steps && steps.length > 1 ? (
          <span className="a-loading__count num" aria-hidden="true">
            {Math.min(current + 1, steps.length)} / {steps.length}
          </span>
        ) : null}
      </div>
      {hinted && hint ? <p className="a-loading__hint">{hint}</p> : null}
    </div>
  );
}

export interface PartFailedProps {
  line: string;
  retry: string;
  onRetry(): void;
  /** While a retry runs: the button is disabled and reads this. */
  busy?: string | null;
}

/** G3: a lazy part that failed, in place of the part only: cracked gear, one line, "Try again". */
export function PartFailed({ line, retry, onRetry, busy }: PartFailedProps) {
  return (
    <section className="a-part-failed" role="alert" aria-label={line}>
      <PixelArt name={GLYPH.crackedGear} decorative />
      <span>{line}</span>
      <Button tone="quiet" onClick={onRetry} disabled={Boolean(busy)}>
        {busy ?? retry}
      </Button>
    </section>
  );
}

export interface ToastProps {
  children: ReactNode;
  /** Up to two actions ("Reload", "Later"). */
  actions?: { label: string; onClick(): void }[];
  onClose?(): void;
  closeLabel?: string;
}

/** One toast, shown once (flows.banners "Toast once"); the dot on the overflow is the caller's. */
export function Toast({ children, actions = [], onClose, closeLabel }: ToastProps) {
  return (
    <div className="a-toast" role="status">
      <div className="a-toast__text">{children}</div>
      <div className="a-toast__actions">
        {actions.map((a) => (
          <Button key={a.label} tone="quiet" onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
        {onClose && closeLabel ? (
          <Button tone="plain" onClick={onClose}>
            {closeLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
