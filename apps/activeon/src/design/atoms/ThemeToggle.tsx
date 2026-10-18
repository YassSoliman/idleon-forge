// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The header's light/dark toggle (owner addition 2026-10-18; spec G10's theme row promoted to a header
// control). UX, chosen for being the simplest clear one: one tap flips what you see now, light to dark
// or dark to light, and the choice is kept on this device. The button shows the scheme it switches to
// (the moon in light, the sun in dark) and its accessible name says so. Going back to System is the
// Settings sheet's Theme row (G10), never a hidden long-press. The glyph plays its two frames once on a
// tap; reduced motion pins frame 1 (art.css).
import { THEME_WORDS } from '@idleon-forge/engine/now';
import { useEffect, useState } from 'react';
import { readTheme, resolvedScheme, type Scheme, type ThemeChoice, writeTheme } from '../theme';
import { IconButton } from './Button';
import { GLYPH } from './glyphs';

export interface ThemeWords {
  toDark: string;
  toLight: string;
}

export const DEFAULT_THEME_WORDS: ThemeWords = THEME_WORDS;

/** Follows the system scheme while the choice is System, so the glyph is right after an OS switch. */
function useScheme(choice: ThemeChoice): Scheme {
  const [scheme, setScheme] = useState(() => resolvedScheme(choice));
  useEffect(() => {
    setScheme(resolvedScheme(choice));
    if (choice !== 'system' || typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setScheme(resolvedScheme('system'));
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [choice]);
  return scheme;
}

export function ThemeToggle({ words = DEFAULT_THEME_WORDS }: { words?: ThemeWords }) {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme);
  const scheme = useScheme(choice);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), 500);
    return () => clearTimeout(t);
  }, [playing]);
  const next: Scheme = scheme === 'dark' ? 'light' : 'dark';
  return (
    <IconButton
      className="a-theme-toggle"
      label={next === 'dark' ? words.toDark : words.toLight}
      glyph={next === 'dark' ? GLYPH.moon : GLYPH.sun}
      animate={playing}
      onClick={() => {
        writeTheme(next);
        setChoice(next);
        setPlaying(true);
      }}
    />
  );
}
