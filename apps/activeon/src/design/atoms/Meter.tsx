// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Fill bars and rings (M21 FR-F5, TR-5). A meter's fill is a CSS custom property (the one inline
// style the CSP allows, as the Timeline already does); the ring is SVG attributes only. Rings are for
// the daily and weekly reset clock only: time across characters is length, never rings (DS-6).
import type { CSSProperties } from 'react';
import { cx } from './Button';

export interface MeterProps {
  value: number;
  max: number;
  /** The accessible name, with units ("1,010 of 2,000 teeth"). */
  label: string;
  tone?: 'ok' | 'fix' | 'muted' | 'accent';
  dashed?: boolean;
}

const fraction = (value: number, max: number) =>
  max > 0 && Number.isFinite(value) ? Math.min(1, Math.max(0, value / max)) : 0;

export function Meter({ value, max, label, tone = 'accent', dashed }: MeterProps) {
  const f = fraction(value, max);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a native <meter> can't be styled the same in every browser
    <div
      className={cx('a-meter', `a-meter--${tone}`, dashed && 'a-meter--dashed')}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(0, value), max)}
      style={{ '--fill': f } as CSSProperties}
    >
      <span className="a-meter__fill" />
    </div>
  );
}

export interface RingProps {
  value: number;
  max: number;
  label: string;
  /** Diameter in px, a multiple of 8. */
  size?: 32 | 48 | 64 | 96 | 128;
  tone?: 'ok' | 'fix' | 'muted' | 'accent';
}

export function Ring({ value, max, label, size = 48, tone = 'accent' }: RingProps) {
  const stroke = size >= 96 ? 8 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = fraction(value, max);
  return (
    <svg
      className={cx('a-ring', `a-ring--${tone}`)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
    >
      <circle className="a-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className="a-ring__fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={`${c * f} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
