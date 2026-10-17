// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Templates (M11 TR-6): `{slot}` or `{slot:format}` in plain text. Rendering returns a plain string;
// M10 renders it as a text node only, so a template can never inject markup.
import type { SlotValue } from './types';

export const FORMATS = ['int', 'compact', 'pct', 'coins', 'duration', 'name', 'date'] as const;
export type Format = (typeof FORMATS)[number];
/** The slot type each format accepts. A number slot can't take `name`; a string slot takes only `name`. */
export const FORMAT_TYPE: Readonly<Record<Format, 'number' | 'string'>> = {
  int: 'number',
  compact: 'number',
  pct: 'number',
  coins: 'number',
  duration: 'number',
  name: 'string',
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
/** 1234567 coins -> "1 platinum 23 gold": the top two non-zero tiers. */
export function formatCoins(n: number): string {
  if (!Number.isFinite(n) || n < 1) return '0 copper';
  let digits = BigInt(Math.floor(n)).toString();
  const tiers: number[] = [];
  while (digits.length > 0) {
    tiers.push(Number(digits.slice(-2)));
    digits = digits.slice(0, -2);
  }
  const named = tiers.map((q, i) => ({ q, name: COIN_TIERS[i] ?? `tier-${i + 1}` })).reverse();
  return named
    .filter((t) => t.q > 0)
    .slice(0, 2)
    .map((t) => `${t.q} ${t.name}`)
    .join(' ');
}

/** ms -> coarse buckets, so small upstream changes don't move the text: < 1 h in 10 min steps, < 24 h in whole hours, then days. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  const min = ms / 60_000;
  if (min < 60) return min < 10 ? 'under 10 min' : `${Math.round(min / 10) * 10} min`;
  const h = ms / 3_600_000;
  if (h < 24) return `${Math.max(1, Math.round(h))} h`;
  return `${Math.max(1, Math.round(h / 24))} d`;
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
