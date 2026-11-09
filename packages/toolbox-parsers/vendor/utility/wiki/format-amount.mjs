// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// How the wiki prints a plain number, on the site's digit rule. No game data: app pages (ShortAmount on the Item Planner)
// print amounts the same way without loading the wiki's client tables (game-constants.mjs). An .mjs reading only .mjs,
// because the graph build runs it in Node, where utility/helpers.js can't load.
import { fullDigits, notateNumber } from '../notate.mjs';

// Past a billion the digits stop being readable (costs run to 1e11 feathers, Feather Restart's multiplier to 1e19).
const BIG_FROM = 1e9;

const signed = (value, digits) => {
  const text = digits(Math.abs(value));
  return value < 0 && text !== '0' ? `-${text}` : text;
};

// Every number the wiki prints: the rule's decimals, the game's Big from a billion. An overflowed formula reads as
// infinite rather than leaving its placeholder behind.
export const formatNumber = (value) => signed(value, (magnitude) => (magnitude >= BIG_FROM ? notateNumber(magnitude, 'Big') : fullDigits(magnitude)));

// A cost is a whole amount below a billion. A value that is not a number reads as blank, not "0"; an overflow reads as ∞.
export const formatAmount = (value) => {
  if (value === Infinity || value === -Infinity) return formatNumber(value);
  if (!Number.isFinite(value)) return '';
  return formatNumber(Math.abs(value) >= BIG_FROM ? value : Math.round(value));
};
