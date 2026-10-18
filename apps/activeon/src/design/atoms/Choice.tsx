// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Segmented controls and tabs (M21 FR-F5, TR-5, TR-17). A segmented control is a radio group of real
// radio inputs (arrow keys move the choice, as browsers do); tabs follow the ARIA tabs pattern with
// roving focus. Every segment and tab is at least 44 px.
import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';
import type { ArtName } from '../art/names';
import { PixelArt } from '../art/PixelArt';
import { cx } from './Button';

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; glyph?: ArtName }[];
  onChange(v: T): void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className="a-seg">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label key={o.value} className={cx('a-seg__option', o.value === value && 'a-seg__option--on')}>
          <input
            type="radio"
            className="sr-only"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
          />
          {o.glyph ? <PixelArt name={o.glyph} decorative /> : null}
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export interface TabsProps<T extends string> {
  label: string;
  value: T;
  tabs: { value: T; label: string; badge?: ReactNode; glyph?: ArtName }[];
  onChange(v: T): void;
  /** The id prefix of the tab panels (`${idBase}-panel-${value}`), for aria-controls; the caller renders them. */
  idBase?: string;
}

export function Tabs<T extends string>({ label, value, tabs, onChange, idBase }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const fallback = useId();
  const base = idBase ?? fallback;
  const move = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    const t = tabs[to];
    if (t) onChange(t.value);
    refs.current[to]?.focus();
  };
  return (
    <div className="a-tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`${base}-tab-${t.value}`}
          aria-selected={t.value === value}
          aria-controls={idBase ? `${idBase}-panel-${t.value}` : undefined}
          tabIndex={t.value === value ? 0 : -1}
          className={cx('a-tab', t.value === value && 'a-tab--on')}
          onClick={() => onChange(t.value)}
          onKeyDown={(e) => move(e, i)}
        >
          {t.glyph ? <PixelArt name={t.glyph} decorative /> : null}
          <span>{t.label}</span>
          {t.badge}
        </button>
      ))}
    </div>
  );
}
