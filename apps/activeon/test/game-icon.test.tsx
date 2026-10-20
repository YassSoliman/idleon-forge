// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// <GameIcon> (ADR 0009 as amended 2026-10-19): the game sprite, lazily, sized so nothing moves; our own
// art when it fails; crisp at whole-number scales; a link to the IdleOn Wiki when it has a name.
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cardArt } from '../src/art/game/card-art';
import { GameIcon, wholeScale } from '../src/art/game/GameIcon';
import { SystemIcon } from '../src/systems/frame/SystemIcon';

describe('<GameIcon>', () => {
  it('draws the game sprite lazily with its box size, decorative by default when asked', () => {
    const { container } = render(<GameIcon art={cardArt('mushG')} fallback="item-card-frame" decorative />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/game-art/data/2CardsA0.webp');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');
    expect(img?.getAttribute('width')).toBe('32');
    expect(img?.getAttribute('height')).toBe('32');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to our own sprite when the file fails, and when there is no id', () => {
    const { container } = render(<GameIcon art={{ path: 'data/NoSuchItem' }} fallback="item-card-frame" />);
    const img = container.querySelector('img');
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg.spr-art')).not.toBeNull();
    const none = render(<GameIcon art={null} fallback={<span className="mono">EE</span>} />);
    expect(none.container.querySelector('.mono')?.textContent).toBe('EE');
  });

  it('is pixel-crisp only at whole-number scales', () => {
    expect(wholeScale(32, 16, 16)).toBe(true);
    expect(wholeScale(48, 24, 12)).toBe(true);
    expect(wholeScale(32, 72, 72)).toBe(false);
    expect(wholeScale(32, 28, 36)).toBe(false);
    expect(wholeScale(32, 0, 0)).toBe(false);
  });

  it('opens the thing on the IdleOn Wiki in a new tab when it has a name', () => {
    const { container } = render(<GameIcon art={{ path: 'data/StampA1' }} wiki="Sword_Stamp" decorative />);
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://idleon.wiki/wiki/Sword_Stamp');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a?.getAttribute('aria-label')).toBe('Open Sword Stamp on the IdleOn Wiki');
    expect(a?.querySelector('img')).not.toBeNull();
  });
});

describe('<SystemIcon>', () => {
  it("draws the System's game sprite, and our own when it fails", () => {
    const { container } = render(<SystemIcon id="stamps" size={24} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/game-art/data/StampA1.webp');
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
