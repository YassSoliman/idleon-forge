// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The name scrub (M13 FR-6) and the anonymous renderer (FR-9). A character name is matched as a whole
// word with Unicode-aware boundaries, case-insensitively, so "Zoë" and "zoë" both go but "Zoëlla"
// stays. Suggestions are public GitHub issues: no character name may ever reach one.

/** What a scrubbed name becomes in the player's own text. */
export const CHARACTER = '[character]';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex for every name, longest first so "Anna" wins over "Ann". Null when there are no names. */
export function namesPattern(names: readonly string[]): RegExp | null {
  const clean = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))].sort(
    (a, b) => b.length - a.length,
  );
  if (clean.length === 0) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${clean.map(escapeRe).join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
}

/** Every account character name in free text becomes "[character]" (FR-6). */
export function scrubNames(text: string, names: readonly string[]): string {
  const re = namesPattern(names);
  return re ? text.replace(re, CHARACTER) : text;
}

/** True when any name is still in the text (a last check before anything leaves the browser). */
export function containsName(text: string, names: readonly string[]): boolean {
  const re = namesPattern(names);
  return re ? re.test(text) : false;
}

export interface NamedCharacter {
  name: string;
  classLabel: string;
  level: number;
}

/**
 * The anonymous rendering of advice text (FR-9): each character name becomes "<Class> lv <n>", then the
 * scrub runs over the result for any name left (a name that is also a class word, say).
 */
export function anonymize(
  text: string,
  characters: readonly NamedCharacter[],
  names: readonly string[] = [],
): string {
  let out = text;
  const byLength = [...characters]
    .filter((c) => c.name.trim().length > 0)
    .sort((a, b) => b.name.length - a.name.length);
  for (const c of byLength) {
    const re = namesPattern([c.name]);
    if (re) out = out.replace(re, () => `${c.classLabel} lv ${c.level}`);
  }
  return scrubNames(out, [...names, ...characters.map((c) => c.name)]);
}
