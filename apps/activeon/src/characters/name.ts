// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A character's in-game name as a quiet second label (M25 owner feedback: an account can hold several
// characters of one class, so "Barbarian 74" alone does not say which). Class and level stay the label;
// the name only tells them apart. It is read from the save on this device and only ever displayed
// (never sent: Suggestions, reports and logs keep class and slot only).

/** The name to show, or null when the save has none (the adapter numbers them "Character 3"). */
export function shownName(c: { index: number; name: string } | null | undefined): string | null {
  const name = c?.name?.trim() ?? '';
  if (!c || name === '' || name === `Character ${c.index + 1}`) return null;
  return name;
}
