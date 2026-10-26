// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';

export const cleanUpgradeName = (name) => cleanUnderscore(name
  .replace(/[船般航舞製]/, '')
  .replace('(Tap_for_more_info)', '')
  .replace('(Tap_for_Info)', '')
  .replace('(#)', ''));

// Masterclass glyphs plus 千膛, which only show up in the Royal Guardian catalogs (statues, orblet market, armory).
export const cleanText = (str) => cleanUnderscore((str ?? '').replace(/[船般航舞製千膛]/g, ''));

// Catalogs repeat names (placeholder bonuses, twin entries): the 2nd and later get "(n)" so searches stay unambiguous.
export const withUniqueNames = (rows, nameOf) => {
  const seen = new Map();
  return rows.map((row) => {
    const base = nameOf(row);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...row, goalName: count > 1 ? `${base} (${count})` : base };
  });
};

export const capitalizeFirst = (str) => str.replace(/^./, (c) => c.toUpperCase());

// "SPROUTLUCK_II" -> "Sproutluck II": title case that keeps roman-numeral tiers upper case
export const titleCaseTiers = (str) => cleanUnderscore(str ?? '').toLowerCase()
  .replace(/(^|\s)(\S+)/g, (_, space, word) => space + (/^[ivx]+$/.test(word) ? word.toUpperCase() : word.replace(/^./, (c) => c.toUpperCase())));

// Catalog text with the game's value placeholders ("{", "}", "$", "^" fill in a number) and layout marks ("|", "@"):
// the placeholders become N so the name never depends on a level.
export const stableText = (str) => cleanText(str)
  .replace(/[{}$^]/g, 'N')
  .replace(/[|@]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Bonus text that leads with its value ("+{%_Mining_Efficiency", "}x_Bucket_Fill_Rate"): the text without the value
export const withoutValue = (str) => capitalizeFirst(stableText(str).replace(/^\+?N%?x?\s*/, ''));

// The game joins a name and its blurb with "}" ("Gene_Splicing_}_Helps_unlock_next_Mob_type")
export const joinedText = (str) => cleanText(str).replace(/\s*}\s*/g, ': ').trim();
