// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 fix: the 390 px phone bar overflowed to 424 px on a long age ("pasted · 45h 01m ago" beside
// "W3 · 2 to go"). On a phone the bar shows a pip and a compact age ("45h"); the full line stays for
// screen readers and in the ••• menu's Your save row; and the status gives way before the bar can grow
// past the viewport. jsdom has no layout, so this guards the markup and the CSS that make it fit; the
// pixel check at 390 px is scripts/layout/jitter.mjs (it fails when the bar reaches past the viewport).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compactAge, Header, SaveAgeLine } from '../src/components/Header';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const NOW = Date.UTC(2026, 9, 19, 12, 0);
const AGE = (45 * 60 + 1) * 60_000; // 45h 01m
const save = (tag: 'current' | 'last-good' = 'current') => ({
  state: { account: { lastCloudSave: NOW - AGE } } as unknown as AccountState,
  source: 'paste' as const,
  tag,
});
const base = { sync: { status: 'idle' } as never, online: true, lastSnapshotAt: null };

describe('the phone bar never outgrows a 390 px viewport (M24 fix)', () => {
  it('shortens an age to its largest unit', () => {
    expect(compactAge('45h 01m ago')).toBe('45h');
    expect(compactAge('6m ago')).toBe('6m');
    expect(compactAge('2d 3h ago')).toBe('2d');
    expect(compactAge('just now')).toBe('just now');
  });

  it.each(['current', 'last-good'] as const)(
    'a long %s age shows "45h" on the phone, the full line kept',
    (tag) => {
      vi.useFakeTimers({ now: NOW });
      const { container } = render(
        <Header
          {...base}
          save={save(tag)}
          staleAfterSeconds={8 * 3600}
          stage={{ id: 'W3-early', label: 'World 3, early', needs: ['a', 'b'] }}
        />,
      );
      const chip = container.querySelector('.n-agechip') as HTMLElement;
      expect(chip.querySelector('.n-short')?.textContent).toBe('45h');
      expect(chip.querySelector('.n-short')?.getAttribute('aria-hidden')).toBe('true');
      expect(chip.querySelector('.n-long')?.textContent).toMatch(/45h 01m ago/);
    },
  );

  it('the full line is in the menu: SaveAgeLine', () => {
    vi.useFakeTimers({ now: NOW });
    const { container } = render(<SaveAgeLine save={save()} />);
    expect(container.textContent).toBe('pasted · 45h 01m ago');
  });

  it('the phone CSS lets the status give way and keeps the wordmark and the buttons whole', () => {
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../src/styles/chrome.css'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    const phone = css.slice(css.indexOf('@media (max-width: 719.98px)'));
    const rule = (sel: string) => {
      const i = phone.indexOf(`${sel} {`);
      return i < 0 ? '' : phone.slice(i, phone.indexOf('}', i));
    };
    expect(rule('.n-hdr__chips')).toMatch(/min-width:\s*0/);
    expect(rule('.n-hdr__chips')).toMatch(/overflow:\s*hidden/);
    expect(phone).toMatch(/\.n-wm,\s*\.n-hdr__end\s*\{\s*flex:\s*none/);
    // The long line is visually hidden on a phone, never shown beside the compact age.
    expect(rule('.n-hdr__chips .n-long')).toMatch(/clip-path:\s*inset\(50%\)/);
  });
});
