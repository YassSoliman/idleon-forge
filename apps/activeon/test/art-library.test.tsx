// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The pixel-art library (M21 FR-F3, TR-4): <PixelArt> draws every core motif with an accessible name or
// hidden beside its word, at whole multiples of its grid, with no inline style (CSP), recolours through
// classes, pins a frame under reduced motion, and never throws on a motif that isn't loaded yet.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ART_INDEX, type ArtName, CORE_NAMES } from '../src/design/art/names';
import { hasArt, loadArtGroup, PixelArt } from '../src/design/art/PixelArt';

afterEach(() => cleanup());

const css = readFileSync(resolve(import.meta.dirname, '../src/design/art/art.css'), 'utf8');
const svgOf = (el: HTMLElement) => el.querySelector('svg') as SVGSVGElement;

describe('<PixelArt>', () => {
  it.each(CORE_NAMES)('%s renders with its title, at its grid', (name) => {
    const { container } = render(<PixelArt name={name} />);
    const svg = svgOf(container);
    const [w, h] = ART_INDEX[name];
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBeTruthy();
    expect(svg.querySelector('title')?.textContent).toBe(svg.getAttribute('aria-label'));
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${w} ${h}`);
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual([String(w), String(h)]);
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(svg.classList.contains('px-missing')).toBe(false);
  });

  it('sizes only at whole multiples of the grid', () => {
    for (const scale of [1, 2, 3, 4] as const) {
      const { container } = render(<PixelArt name="now-blob-mage" scale={scale} />);
      expect(svgOf(container).getAttribute('width')).toBe(String(16 * scale));
      cleanup();
    }
    const { container } = render(<PixelArt name="flows-walking-blob" scale={2} />);
    expect(svgOf(container).getAttribute('width')).toBe('64');
  });

  it('is hidden from assistive tech when decorative, with no title', () => {
    const { container } = render(<PixelArt name="now-pin" decorative />);
    const svg = svgOf(container);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.querySelector('title')).toBeNull();
  });

  it('takes a title override', () => {
    const { container } = render(<PixelArt name="now-glyph-check" title="Ready" />);
    expect(svgOf(container).getAttribute('aria-label')).toBe('Ready');
  });

  it('puts no style attribute anywhere (CSP style-src self)', () => {
    for (const name of CORE_NAMES) {
      const { container } = render(<PixelArt name={name} ramp="gold" w={3} />);
      expect(container.querySelectorAll('[style]').length).toBe(0);
      cleanup();
    }
  });

  it('recolours through classes: ramp, world tint and cauldron', () => {
    const { container } = render(<PixelArt name="now-pin" ramp="ruby" w={4} cauldron="high-iq" />);
    const c = svgOf(container).classList;
    expect(c.contains('px-ramp-ruby')).toBe(true);
    expect(c.contains('px-w4')).toBe(true);
    expect(c.contains('px-cauldron-high-iq')).toBe(true);
    for (const k of ['power', 'quicc', 'high-iq', 'kazam']) expect(css).toContain(`.px-cauldron-${k}`);
  });

  it('animates multi-frame motifs as stepped frames, and only when asked', () => {
    const { container, rerender } = render(<PixelArt name="flows-walking-blob" />);
    const svg = svgOf(container);
    expect(svg.querySelectorAll('g.px-f').length).toBe(4);
    expect(svg.classList.contains('px-anim')).toBe(true);
    expect(svg.classList.contains('px-n4')).toBe(true);
    rerender(<PixelArt name="flows-walking-blob" animate={false} />);
    expect(svgOf(container).classList.contains('px-anim')).toBe(false);
    expect(svgOf(container).querySelector('.px-f0')).not.toBeNull();
    expect(svgOf(container).querySelector('.px-flast')).not.toBeNull();
  });

  it('pins a frame under reduced motion and steps frames (no tween)', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(css).toContain('steps(1, end)');
    expect(css).not.toMatch(/font-size/);
  });

  it('renders an empty placeholder of the right size for a motif not loaded yet, then fills in', async () => {
    const name = 'v2-systems-cauldron' as ArtName;
    expect(hasArt(name)).toBe(false);
    const { container } = render(<PixelArt name={name} scale={2} cauldron="power" />);
    const svg = svgOf(container);
    expect(svg.classList.contains('px-missing')).toBe(true);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('32');
    await act(() => loadArtGroup('systems'));
    expect(hasArt(name)).toBe(true);
    expect(svgOf(container).classList.contains('px-missing')).toBe(false);
    expect(svgOf(container).querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('never throws on an unknown name', () => {
    const { container } = render(<PixelArt name={'no-such-art' as ArtName} />);
    expect(svgOf(container).classList.contains('px-missing')).toBe(true);
  });
});
