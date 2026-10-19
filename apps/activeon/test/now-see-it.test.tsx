// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views in the DOM, area N (M21 §9): "See it" from Now (US-12) and "→ Systems". Split from
// shell.test.tsx.
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { withSystems } from './helpers/views';
import { props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('US-12 "See it" from Now', () => {
  it('a Next Action sees its System page, outlined there; a Cards Goal sees its Cards tab', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(document.querySelector('[data-index="0"]') as HTMLElement);
    fireEvent.click(screen.getByRole('link', { name: 'See it: Alchemy bubbles' }));
    expect(window.location.hash).toBe('#system-alchemy-bubbles');
    expect(document.querySelector('.na.lit')?.getAttribute('data-na-key')).toBe(
      'alchemy-bubbles.check.fill-slot@c0',
    );
    act(() => {
      window.history.replaceState(null, '', '/#now-2');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByRole('link', { name: 'See it: Cards' }));
    expect(window.location.hash).toBe('#cards-2');
  });

  it('"Not covered yet" ends with "→ Systems"', () => {
    const r = withSystems({ notCovered: [{ systemId: 'equinox', label: 'Equinox' }] });
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: '→ Systems' }));
    expect(window.location.hash).toBe('#systems');
  });
});
