// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Theme and direction on the root element (M21 §3.3, G10, owner addition 2026-10-18).
// - Theme: System by default; a player's Light or Dark choice sets `data-theme` on <html>, so every
//   direction's light and dark token sets follow. It is a per-device choice, kept in localStorage
//   (every access guarded: storage can be missing or throw). Settings (G10, area N) offers all three;
//   the header toggle flips between light and dark.
// - Direction: the root carries data-direction="field". `?direction=quest|board` swaps it for QA
//   screenshots only: read once at start, never stored, never shown (D-1).
import { STORAGE_PREFIX } from '../storage';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';
export type Direction = 'field' | 'quest' | 'board';

export const THEME_KEY = `${STORAGE_PREFIX}theme`;
const DIRECTIONS: readonly Direction[] = ['field', 'quest', 'board'];

const local = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export function readTheme(): ThemeChoice {
  try {
    const v = local()?.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Stores the choice (System removes the key) and applies it. Storage failing keeps it for the session. */
export function writeTheme(choice: ThemeChoice, root: HTMLElement = document.documentElement): void {
  try {
    if (choice === 'system') local()?.removeItem(THEME_KEY);
    else local()?.setItem(THEME_KEY, choice);
  } catch {}
  applyTheme(choice, root);
}

export function applyTheme(choice: ThemeChoice, root: HTMLElement = document.documentElement): void {
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
}

/** The scheme the page shows now: the choice, or the system's when the choice is System. */
export function resolvedScheme(choice: ThemeChoice): Scheme {
  if (choice !== 'system') return choice;
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

/** `?direction=quest|board` (dev and QA only); anything else is Field Guide. */
export function directionFromSearch(search: string): Direction {
  const v = new URLSearchParams(search).get('direction');
  return DIRECTIONS.includes(v as Direction) ? (v as Direction) : 'field';
}

/** Run once in main.tsx before the first render, so the first paint already has the right colours. */
export function initRoot(root: HTMLElement = document.documentElement, search = location.search): void {
  root.dataset.direction = directionFromSearch(search);
  applyTheme(readTheme(), root);
}
