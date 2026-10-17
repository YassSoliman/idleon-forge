// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Stage label in the header (M2 D5): shown from EngineResult.stage, never for unknown/not-covered.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Header } from '../src/components/Header';

afterEach(cleanup);
const base = {
  save: null,
  sync: { status: 'idle' } as never,
  online: true,
  lastSnapshotAt: null,
  suggestHref: '#',
};

describe('Header Stage label', () => {
  it('shows "World 3 · early" with what the next Stage needs as its title', () => {
    render(
      <Header
        {...base}
        stage={{ id: 'W3-early', label: 'World 3, early', needs: ['Build the Death Note to level 1'] }}
      />,
    );
    const el = screen.getByText('World 3 · early');
    expect(el.getAttribute('title')).toBe('Next Stage: Build the Death Note to level 1');
  });
  it('shows nothing for an unknown or not-covered Stage', () => {
    render(<Header {...base} stage={{ id: 'unknown', label: 'Unknown' }} />);
    expect(screen.queryByText('Unknown')).toBeNull();
  });
});
