// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// <GameIcon> (ADR 0009 as amended 2026-10-19): the game sprite, lazily; our own art when it fails.
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameIcon } from '../src/art/game/GameIcon';

describe('<GameIcon>', () => {
  it('draws the game sprite lazily, decorative by default when asked', () => {
    const { container } = render(
      <GameIcon art={{ kind: 'card', id: 'mushG' }} fallback="item-card-frame" decorative />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/game-art/cards/mushG.png');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to our own sprite when the file fails, and when there is no id', () => {
    const { container } = render(
      <GameIcon art={{ kind: 'item', id: 'NoSuchItem' }} fallback="item-card-frame" />,
    );
    const img = container.querySelector('img');
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg.spr-art')).not.toBeNull();
    const none = render(<GameIcon art={null} fallback={<span className="mono">EE</span>} />);
    expect(none.container.querySelector('.mono')?.textContent).toBe('EE');
  });
});
