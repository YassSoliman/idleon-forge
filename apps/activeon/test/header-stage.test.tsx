// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Stage label in the header (M2 D5): shown from EngineResult.stage, never for unknown/not-covered.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Header } from '../src/components/Header';

afterEach(cleanup);
const base = {
  save: null,
  sync: { status: 'idle' } as never,
  online: true,
  lastSnapshotAt: null,
};

describe('Header Stage label', () => {
  it('shows "World 3 · early" with what the next Stage needs as its title', () => {
    render(
      <Header
        {...base}
        stage={{ id: 'W3-early', label: 'World 3, early', needs: ['Build the Death Note to level 1'] }}
      />,
    );
    const el = screen.getByText('World 3 · early').closest('button') as HTMLElement;
    expect(el.getAttribute('title')).toBe('Next Stage: Build the Death Note to level 1');
    // M21 `now.stage-badge` World crest: a tap opens the next Stage's steps as 44 px rows.
    fireEvent.click(el);
    expect(screen.getByRole('dialog', { name: 'To move past World 3, early' }).textContent).toContain(
      'Build the Death Note to level 1',
    );
  });
  it('shows nothing for an unknown or not-covered Stage', () => {
    render(<Header {...base} stage={{ id: 'unknown', label: 'Unknown' }} />);
    expect(screen.queryByText('Unknown')).toBeNull();
  });
});
