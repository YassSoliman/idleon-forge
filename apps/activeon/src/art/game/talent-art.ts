// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A talent's game sprite (data/UISkillIcon<skillIndex>) by its id, or by its name where a view holds
// only the name (the attack bar, step text). The name table is generated from the pinned talents.json
// (talent-index.gen.ts); its own module, so only the views that draw talents carry it.
import { type GameArt, talentArt } from './game-art';
import { TALENT_INDEX } from './talent-index.gen';

/** A talent name as the table keys it: "Piercing Arrow", "PIERCING_ARROW" -> "piercingarrow". */
export const talentKey = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The skillIndex of a talent name, or null when the name is no talent. */
export function talentIdOfName(name: string | null | undefined): number | null {
  if (!name) return null;
  const id = TALENT_INDEX[talentKey(name)];
  return typeof id === 'number' ? id : null;
}

/** A talent's sprite by id when known, else by name; null when neither names a talent. */
export function talentArtOf(id: number | null | undefined, name?: string | null): GameArt | null {
  return talentArt(typeof id === 'number' ? id : talentIdOfName(name));
}

/** The longest talent name a sentence mentions ("Put Piercing Arrow on the attack bar"), or null. */
export function talentIdInText(text: string | null | undefined): number | null {
  if (!text) return null;
  const words = text.split(/[^\p{L}\p{N}'!]+/u).filter(Boolean);
  let best: { id: number; len: number } | null = null;
  for (let i = 0; i < words.length; i++)
    for (let n = Math.min(6, words.length - i); n >= 1; n--) {
      const key = talentKey(words.slice(i, i + n).join(''));
      const id = TALENT_INDEX[key];
      // One-word matches must be a real word of the talent's name, not a common word: 2+ words, or
      // a single word of 6+ letters ("Bucklered"), keeps "Clover" in "Lucky Clover" honest.
      if (typeof id === 'number' && (n > 1 || key.length >= 6) && (!best || n > best.len))
        best = { id, len: n };
    }
  return best?.id ?? null;
}
