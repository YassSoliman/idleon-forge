// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The who-glyph (M21 FR-F4, DS-13): one chibi per class family, an accessible name when it stands
// alone, hidden beside its class word, a text (never pixel-font) badge, and a blink only when asked.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type ClassFamily, WhoGlyph } from '../src/design/who/WhoGlyph';

afterEach(() => cleanup());

const FAMILIES: ClassFamily[] = ['beginner', 'journeyman', 'warrior', 'archer', 'mage'];

describe('<WhoGlyph>', () => {
  it.each(FAMILIES)('draws the %s chibi at 16, 32 and 48 px', (family) => {
    for (const scale of [1, 2, 3] as const) {
      const { container } = render(<WhoGlyph family={family} classLabel="Squire" scale={scale} />);
      const svg = container.querySelector('svg') as SVGSVGElement;
      expect(svg.classList.contains(`px-now-blob-${family}`)).toBe(true);
      expect(svg.getAttribute('width')).toBe(String(16 * scale));
      cleanup();
    }
  });

  it('names the character when it stands alone', () => {
    render(<WhoGlyph family="warrior" classLabel="Squire" level={85} scale={2} />);
    expect(screen.getByRole('img', { name: 'Squire 85' })).toBeTruthy();
  });

  it('is hidden beside its class word', () => {
    const { container } = render(<WhoGlyph family="archer" classLabel="Bowman" scale={1} decorative />);
    expect(container.querySelector('.who')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('blinks only when animate is set (the character being played)', () => {
    const { container, rerender } = render(<WhoGlyph family="mage" classLabel="Wizard" scale={1} />);
    expect(container.querySelector('svg')?.classList.contains('px-anim')).toBe(false);
    rerender(<WhoGlyph family="mage" classLabel="Wizard" scale={1} animate />);
    expect(container.querySelector('svg')?.classList.contains('px-anim')).toBe(true);
  });

  it('carries the subclass badge as text and the world tint as a class', () => {
    const { container } = render(
      <WhoGlyph family="mage" classLabel="Shaman" scale={1} badge="S" world={3} />,
    );
    expect(container.querySelector('.who-badge')?.textContent).toBe('S');
    expect(container.querySelector('.who')?.classList.contains('px-w3')).toBe(true);
    expect(container.querySelectorAll('[style]').length).toBe(0);
  });

  it('sets the badge in the body face at 12 px, never a pixel face (DS-14)', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../src/design/who/who.css'), 'utf8');
    const badge = /\.who-badge \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(badge).toContain('font-family: var(--ff-humanist)');
    expect(badge).toContain('font-size: var(--text-xs)');
    expect(badge).toContain('font-weight: 700');
    expect(css).not.toMatch(/pixel/);
  });
});
