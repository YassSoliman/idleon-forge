// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Templates (M11 TR-6): `{slot}` or `{slot:format}` in plain text. Rendering returns a plain string;
// M10 renders it as a text node only, so a template can never inject markup.
import type { SlotValue } from './types';

/**
 * M21 FR-F6 (one time language): `duration` is effort ("about 10m"), `in` a future moment ("in 14h 04m")
 * and `ago` a past one ("8h 30m ago"). All three take milliseconds.
 */
export const FORMATS = [
  'int',
  'compact',
  'pct',
  'coins',
  'duration',
  'in',
  'ago',
  'hours',
  'name',
  'date',
] as const;
export type Format = (typeof FORMATS)[number];
/** The slot type each format accepts. A number slot can't take `name`; a string slot takes only `name`. */
export const FORMAT_TYPE: Readonly<Record<Format, 'number' | 'string'>> = {
  int: 'number',
  compact: 'number',
  pct: 'number',
  coins: 'number',
  duration: 'number',
  in: 'number',
  ago: 'number',
  name: 'string',
  hours: 'number',
  date: 'number',
};

/** Engine built-ins every template may use (TR-6), with their types. M10 fills them at render time. */
export const BUILTIN_SLOTS: Readonly<Record<string, 'number' | 'string'>> = {
  character: 'string',
  class: 'string',
  level: 'number',
  value: 'number',
  next: 'number',
  eta: 'number',
  stage: 'string',
  preset: 'string',
  /** M26 Wave 6: a ladder Goal's next Milestone reward, and how far `value` is from `next`. */
  reward: 'string',
  more: 'number',
};

export interface TemplatePart {
  slot: string;
  format: Format | null;
  /** Offset of the `{` in the template. */
  at: number;
}

export class TemplateError extends Error {
  override name = 'TemplateError';
}

const SLOT_RE = /\{([a-zA-Z][a-zA-Z0-9]*)(?::([a-z]+))?\}/g;

/** The slots of a template, in order. Throws `TemplateError` on an unknown format or a stray brace. */
export function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  for (const m of template.matchAll(SLOT_RE)) {
    const format = m[2] ?? null;
    if (format !== null && !(FORMATS as readonly string[]).includes(format))
      throw new TemplateError(`unknown format "${format}" in {${m[1]}:${format}}`);
    parts.push({ slot: m[1] as string, format: format as Format | null, at: m.index ?? 0 });
  }
  const rest = template.replace(SLOT_RE, '');
  if (/[{}]/.test(rest)) throw new TemplateError('unbalanced or malformed { } in template');
  return parts;
}

const floorTo = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.floor(n * f) / f;
};
const trim = (s: string) => s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

/** 12345 -> "12,345". */
export const formatInt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** 13021 -> "13k", 1500 -> "1.5k", 1234567 -> "1.2M". Rounds down, so it never claims more than reached. */
export function formatCompact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const units: [number, string][] = [
    [1e15, 'Q'],
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k'],
  ];
  for (const [size, unit] of units) {
    if (a >= size) {
      const v = a / size;
      return `${sign}${trim(String(v < 10 ? floorTo(v, 1) : Math.floor(v)))}${unit}`;
    }
  }
  return `${sign}${Math.floor(a)}`;
}

/** A percentage given 0..100 -> "12%". */
export const formatPct = (n: number): string => `${Math.round(n)}%`;

/** Toolbox's coin tiers: base 100 per tier (helpers.getCoinsArray). Names for the first ten. */
const COIN_TIERS = [
  'copper',
  'silver',
  'gold',
  'platinum',
  'dementia',
  'void',
  'lustre',
  'starfire',
  'dreadlo',
  'godshard',
];
const trimFixed = (n: number, digits: number) => {
  const s = n.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};
const ROUND_SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi'];

/**
 * The app's one short-number format (M10 TR-1): 950 -> "950", 1500 -> "1.5k", 13204 -> "13k",
 * 2.4e6 -> "2.4M", 3e22 -> "3e22". Rounds to nearest (`formatCompact` floors, for progress).
 */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '?';
  const sign = n < 0 ? '-' : '';
  let v = Math.abs(n);
  if (v < 1000) return `${sign}${Math.round(v)}`;
  let i = 0;
  while (v >= 1000 && i < ROUND_SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  if (v >= 1000) {
    const [mantissa = '0', exp = '0'] = Math.abs(n).toExponential(1).split('e');
    return `${sign}${trimFixed(Number(mantissa), 1)}e${Number(exp)}`;
  }
  const rounded = v < 10 ? trimFixed(v, 1) : String(Math.round(v));
  // 999.6k rounds to "1000k": carry into the next suffix.
  if (rounded === '1000' && i < ROUND_SUFFIXES.length - 1) return `${sign}1${ROUND_SUFFIXES[i + 1]}`;
  return `${sign}${rounded}${ROUND_SUFFIXES[i]}`;
}

/**
 * The one coin format (Design Lab rule): 157_000_000 -> "157M coins", 1.3e9 -> "1.3B coins". Text never
 * prints the game's tiers ("1 dementia 57 platinum"); `coinTiers` keeps them for an optional icon row.
 */
export function formatCoins(n: number): string {
  if (!Number.isFinite(n) || n < 1) return '0 coins';
  return `${compact(n)} coins`;
}

/** 1234567 coins -> 1 platinum, 23 gold: the top two non-zero tiers. For an optional coin-icon visual only. */
export function coinTiers(n: number): { q: number; name: string }[] {
  if (!Number.isFinite(n) || n < 1) return [];
  let digits = BigInt(Math.floor(n)).toString();
  const tiers: number[] = [];
  while (digits.length > 0) {
    tiers.push(Number(digits.slice(-2)));
    digits = digits.slice(0, -2);
  }
  return tiers
    .map((q, i) => ({ q, name: COIN_TIERS[i] ?? `tier-${i + 1}` }))
    .reverse()
    .filter((t) => t.q > 0)
    .slice(0, 2);
}

/**
 * The app's one approximate duration (Design Lab rule): "about 9h", "about 45m", "about 3d"; under a
 * minute "under a minute". A template writes `{x:duration}`, never its own "about" or unit.
 */
export function aboutDuration(seconds: number): string {
  const s = Math.max(0, seconds);
  if (s < 60) return 'under a minute';
  if (s < 3600) return `about ${Math.round(s / 60)}m`;
  if (s < 100 * 3600) return `about ${Math.round(s / 3600)}h`;
  return `about ${Math.round(s / 86_400)}d`;
}

/** The `{x:duration}` format: ms -> `aboutDuration`; zero or less reads "now". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  return aboutDuration(ms / 1000);
}

/**
 * The app's one exact duration (M17, Design Lab P6): "14h 04m", "45m", "2d 12h". Under a minute reads
 * "1m"; from 48 h it switches to days and hours. Countdowns read "in 14h 04m" (`inSpan`).
 */
export function span(ms: number): string {
  const m = Math.max(1, Math.round(Math.max(0, ms) / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${String(m % 60).padStart(2, '0')}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** "in 14h 04m": the Timeline's relative time (Design Lab P6). */
export const inSpan = (ms: number): string => `in ${span(ms)}`;

/** "8h 30m ago": an age (M21 FR-F6, DS-6). */
export const agoSpan = (ms: number): string => `${span(ms)} ago`;

/** The `{x:in}` format (M21 FR-F6): a moment, ms from now -> "in 14h 04m"; zero or less reads "now". */
export function formatIn(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  return inSpan(ms);
}

/** The `{x:ago}` format (M21 FR-F6): ms since -> "8h 30m ago"; zero or less reads "just now". */
export function formatAgo(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'just now';
  return agoSpan(ms);
}

/**
 * 7200 -> "2h", 1800 -> "30m", 129600 -> "36h": an exact short time for chips and labels, and the
 * `{x:hours}` format (a slot in hours: a return window, a game's "AFK 12h" requirement).
 */
export function shortDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  const h = s / 3600;
  return `${Number.isInteger(h) ? h : trimFixed(h, 1)}h`;
}

/** epoch ms -> "2026-10-17" (UTC). */
export const formatDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** `Poopy_Sewers` -> "Poopy Sewers"; an all-caps id is sentence-cased (same rule as account-state's humanize). */
export function formatName(id: string): string {
  const spaced = id.replace(/_/g, ' ').trim();
  return spaced === spaced.toUpperCase() ? spaced.charAt(0) + spaced.slice(1).toLowerCase() : spaced;
}

export function formatValue(value: SlotValue, format: Format | null): string {
  if (format === null) return typeof value === 'number' ? formatInt(value) : value;
  if (FORMAT_TYPE[format] === 'string') {
    if (typeof value !== 'string') throw new TemplateError(`format "${format}" needs a string, got a number`);
    return formatName(value);
  }
  if (typeof value !== 'number') throw new TemplateError(`format "${format}" needs a number, got a string`);
  switch (format) {
    case 'int':
      return formatInt(value);
    case 'compact':
      return formatCompact(value);
    case 'pct':
      return formatPct(value);
    case 'coins':
      return formatCoins(value);
    case 'duration':
      return formatDuration(value);
    case 'in':
      return formatIn(value);
    case 'ago':
      return formatAgo(value);
    case 'hours':
      return shortDuration(value * 3600);
    case 'date':
      return formatDate(value);
    default:
      throw new TemplateError(`unknown format "${format}"`);
  }
}

/**
 * Renders `template`, resolving each slot from `scopes` in order (TR-6: the finding's slots, the
 * engine built-ins, the entry's values, the referenced facts). Throws `TemplateError` on a missing
 * slot, so a broken entry never renders "{x}" to a player.
 */
export function render(
  template: string,
  ...scopes: readonly (Readonly<Record<string, SlotValue>> | undefined)[]
) {
  const parts = parseTemplate(template);
  let out = '';
  let last = 0;
  for (const m of template.matchAll(SLOT_RE)) {
    const part = parts.find((p) => p.at === m.index);
    if (!part) continue;
    const scope = scopes.find((s) => s !== undefined && Object.hasOwn(s, part.slot));
    if (!scope) throw new TemplateError(`slot "${part.slot}" has no value`);
    out += template.slice(last, m.index) + formatValue(scope[part.slot] as SlotValue, part.format);
    last = (m.index ?? 0) + m[0].length;
  }
  return out + template.slice(last);
}
