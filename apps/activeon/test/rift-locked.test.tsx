// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The locked Rift's thin page draws the Rift Ripper's quest items as bars (LOCKED_BODIES), and nothing
// once The Rift is open.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCKED_BODIES, type SystemPageBodyProps } from '../src/systems/pages';
import { RiftQuestBody } from '../src/systems/w4/rift';

afterEach(() => cleanup());

const props = (quest: { rawName: string; name: string; have: number; need: number }[]) =>
  ({
    s: { result: { slotPictures: [{ kind: 'rift', quest }] }, navigate: () => {} },
    page: { goals: [] },
  }) as unknown as SystemPageBodyProps;

describe('the locked Rift page', () => {
  it('is a registered locked body', () => {
    expect(LOCKED_BODIES.rift).toBeDefined();
  });

  it('shows each quest item, held against needed', () => {
    render(
      <RiftQuestBody
        {...props([
          { rawName: 'GalaxyA2b', name: 'Lost Batteries', have: 2, need: 5 },
          { rawName: 'GalaxyA1', name: 'Purple Mush Cap', have: 900, need: 878 },
        ])}
      />,
    );
    expect(screen.getByText('Lost Batteries')).toBeTruthy();
    expect(screen.getAllByText('2 of 5').length).toBeGreaterThan(0);
    // Held past the need reads as the need.
    expect(screen.getAllByText('878 of 878').length).toBeGreaterThan(0);
  });

  it('draws nothing once the quest is done (no items left to show)', () => {
    const { container } = render(<RiftQuestBody {...props([])} />);
    expect(container.textContent).toBe('');
  });
});
