// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Number, duration and age formatting shared by the components and the text renderer (M10 TR-1).
// Locale-free and deterministic, so golden snapshots don't depend on the machine.

const SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi'];

const trim = (n: number, digits: number) => {
  const s = n.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};

/** 950 -> "950", 1500 -> "1.5k", 13204 -> "13k", 100000 -> "100k", 2.4e6 -> "2.4M", 3e22 -> "3e22". */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '?';
  const sign = n < 0 ? '-' : '';
  let v = Math.abs(n);
  if (v < 1000) return `${sign}${Math.round(v)}`;
  let i = 0;
  while (v >= 1000 && i < SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  if (v >= 1000) {
    const [mantissa = '0', exp = '0'] = Math.abs(n).toExponential(1).split('e');
    return `${sign}${trim(Number(mantissa), 1)}e${Number(exp)}`;
  }
  const rounded = v < 10 ? trim(v, 1) : String(Math.round(v));
  // 999.6k rounds to "1000k": carry into the next suffix.
  if (rounded === '1000' && i < SUFFIXES.length - 1) return `${sign}1${SUFFIXES[i + 1]}`;
  return `${sign}${rounded}${SUFFIXES[i]}`;
}

/** 7200 -> "2h", 1800 -> "30m", 129600 -> "36h". For chips and short labels. */
export function shortDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  const h = s / 3600;
  return `${Number.isInteger(h) ? h : trim(h, 1)}h`;
}

/** "about 9h", "about 45m", "about 3d"; under a minute "under a minute". */
export function aboutDuration(seconds: number): string {
  const s = Math.max(0, seconds);
  if (s < 60) return 'under a minute';
  if (s < 3600) return `about ${Math.round(s / 60)}m`;
  if (s < 100 * 3600) return `about ${Math.round(s / 3600)}h`;
  return `about ${Math.round(s / 86_400)}d`;
}

/** 42 -> "42s", 300 -> "5m", 7300 -> "2h 1m", 200000 -> "2d". Ages clamp at 0 (clock skew). */
export function formatAge(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 120) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86_400)}d`;
}

/** "1 buy", "3 buys". */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
