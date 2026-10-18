// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the shell's view words (area M): the navigation and its badges.
/** The navigation (FR-5): badge names and the nav's own label. */
export const NAV_WORDS = {
  label: 'Places',
  nowBadge: (n: number) => `${n} to fix before you leave`,
  systemsBadge: (n: number) => `${n} wasting`,
  playing: (text: string) => `${text} · go`,
} as const;

/** M21 owner addition (G10 promoted): the header's theme toggle, named for the state it switches to. */
export const THEME_WORDS = {
  toDark: 'Switch to the dark theme',
  toLight: 'Switch to the light theme',
} as const;

/** M21 G3: a lazy part that failed to load, in place of the part. */
export const PART_WORDS = {
  failed: "Couldn't load this part.",
  /** The rest of the line, after the failed part's sentence. */
  hint: 'Check your connection.',
  retry: 'Try again',
  retrying: 'Trying again…',
} as const;
