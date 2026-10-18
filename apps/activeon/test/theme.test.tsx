// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// Theme and direction on the root (M21 §3.3, D-1, G10, the owner's header toggle).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../src/design/atoms/ThemeToggle';
import {
  applyTheme,
  directionFromSearch,
  initRoot,
  readTheme,
  resolvedScheme,
  THEME_KEY,
  writeTheme,
} from '../src/design/theme';

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete root.dataset.theme;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('direction (dev and QA only)', () => {
  it('is Field Guide unless ?direction= names quest or board', () => {
    expect(directionFromSearch('')).toBe('field');
    expect(directionFromSearch('?direction=quest')).toBe('quest');
    expect(directionFromSearch('?x=1&direction=board')).toBe('board');
    expect(directionFromSearch('?direction=neon')).toBe('field');
  });
  it('is read once onto the root and never stored', () => {
    initRoot(root, '?direction=board');
    expect(root.dataset.direction).toBe('board');
    expect(Object.keys(localStorage).some((k) => k.includes('direction'))).toBe(false);
    initRoot(root, '');
    expect(root.dataset.direction).toBe('field');
  });
});

describe('theme', () => {
  it('defaults to System, which leaves data-theme off so the media query decides', () => {
    expect(readTheme()).toBe('system');
    initRoot(root, '');
    expect(root.dataset.theme).toBeUndefined();
  });
  it('keeps Light or Dark per device and applies it as data-theme', () => {
    writeTheme('dark', root);
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(root.dataset.theme).toBe('dark');
    expect(readTheme()).toBe('dark');
    writeTheme('system', root);
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    expect(root.dataset.theme).toBeUndefined();
  });
  it('works for the session when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeTheme('light', root)).not.toThrow();
    expect(root.dataset.theme).toBe('light');
    expect(readTheme()).toBe('system');
  });
  it('ignores a stored value it does not know', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    expect(readTheme()).toBe('system');
  });
  it('resolves System through the media query', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('dark'),
      addEventListener() {},
      removeEventListener() {},
    }));
    expect(resolvedScheme('system')).toBe('dark');
    expect(resolvedScheme('light')).toBe('light');
    vi.unstubAllGlobals();
  });
  it('applyTheme sets or clears the attribute only', () => {
    applyTheme('light', root);
    expect(root.dataset.theme).toBe('light');
    applyTheme('system', root);
    expect(root.dataset.theme).toBeUndefined();
  });
});

describe('the header toggle', () => {
  it('is a 44 px icon button named for the state it switches to, and flips light and dark', () => {
    vi.useFakeTimers();
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Switch to the dark theme' });
    expect(button.className).toContain('a-icon-btn');
    fireEvent.click(button);
    expect(root.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    const back = screen.getByRole('button', { name: 'Switch to the light theme' });
    // The glyph plays its two frames once, then stops.
    expect(back.querySelector('svg')?.getAttribute('class')).toMatch(/px-anim/);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(back.querySelector('svg')?.getAttribute('class')).not.toMatch(/px-anim/);
    fireEvent.click(back);
    expect(root.dataset.theme).toBe('light');
  });
});
