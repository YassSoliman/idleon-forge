// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-22 to FR-24, TR-5: the Bubba System page's data, built in the worker from the same reading the
// Checks use (`bubbaNow`). Two parts, said plainly (FR-22): Bubba's bonuses to the account (Boon, boosted
// by Megaflesh) and everything inside Bubba (Charisma, pats, Smoker, gifts, dice), which boosts only
// Bubba's meat. Arithmetic only: comparisons and time from rate; every game number is Toolbox's or X1's.
import type { AccountState } from '@idleon-forge/account-state';
import { charismaLevelsFrom } from '@idleon-forge/account-state';
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import {
  type BubbaNow,
  charismaOpen,
  charismaXpAt,
  GIFT,
  hasGift,
  isOpen,
  MF_EMULSIFY,
  MINDFUL,
  patsLeft,
  refillAt,
  SMOKER_MAX_QUALITY_SECONDS,
  smokeAt,
  UPG,
} from '@idleon-forge/knowledge/helpers';
import type { TimelineBar } from '../result';
import { amount, bonusText, charismaLabel, meatText } from './text';
import type {
  BoonKey,
  BubbaBuyView,
  BubbaCharismaView,
  BubbaMegafleshView,
  BubbaResult,
  BubbaTargetView,
} from './types';

export interface BoonRow {
  id: number;
  key: BoonKey;
  name: string;
  perStack: number;
  negative: boolean;
}
interface UpgradeRow {
  index: number;
  name: string;
  x4: number;
}
interface MegafleshRow {
  row: number;
  name: string;
  text: string;
}
interface CharismaRow {
  id: number;
  name: string;
  label: string;
}
interface GiftRow {
  id: number;
  name: string;
}
interface Targets {
  sources: { id: string; name: string; date: string; until?: number }[];
  targets: { source: string; from: number; levels: number[] }[];
}

interface Kb {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

const rows = <T>(kb: Kb, id: string): T[] => {
  const r = kb.facts[id]?.rows;
  return Array.isArray(r) ? (r as T[]) : [];
};
const val = (kb: Kb, id: string, key: string) => kb.entries[id]?.values[key];

export interface ViewInput {
  n: BubbaNow;
  kb: Kb;
  state: AccountState;
  stage: string;
  step: BubbaResult['step'];
  timeline: TimelineBar[];
  openOn: string | null;
  share: number;
}

/** The seven Boon bonuses in rotation order (`bubba.fact.boon`, Toolbox's `bubba.bonuses` keys). */
export const BOON_ORDER: readonly BoonKey[] = [
  'buildRate',
  'critterGain',
  'soulGain',
  'totalDamage',
  'allKills',
  'expMulti',
  'atomCost',
];

/** FR-17's ratings for one Stage (`bubba.priority.boon-bonuses`: one letter per bonus, H, M or L). */
export function ratingsOf(kb: Kb, stage: string): Record<string, 'high' | 'mid' | 'low'> {
  const raw = val(kb, 'bubba.priority.boon-bonuses', stage);
  const out: Record<string, 'high' | 'mid' | 'low'> = {};
  if (typeof raw !== 'string') return out;
  const word = { H: 'high', M: 'mid', L: 'low' } as const;
  BOON_ORDER.forEach((key, i) => {
    const r = word[raw.charAt(i) as keyof typeof word];
    if (r) out[key] = r;
  });
  return out;
}

/** The meat-from-save time a cost is covered at; null with no production or past a year (FR-20). */
function affordAt(n: BubbaNow, cost: number | null): number | null {
  if (cost === null || n.rate === null || n.rate <= 0) return null;
  const at = n.save + (Math.max(0, cost - n.b.meat) / (n.rate / 60)) * 1000;
  return Number.isFinite(at) && at - n.now <= 365 * 86_400_000 ? at : null;
}

function megafleshView(n: BubbaNow, kb: Kb): BubbaMegafleshView {
  const { b } = n;
  const table = rows<MegafleshRow>(kb, 'bubba.fact.megaflesh');
  const nextRow = Math.min(b.megaflesh + 1, 12);
  const row = table.find((r) => r.row === nextRow);
  const cost = b.costs[UPG.megaflesh] ?? null;
  const label = String(val(kb, 'bubba.check.megaflesh', `label-${nextRow}`) ?? '');
  const gameText = (row?.text ?? '').split('@')[0]?.trim() ?? '';
  const open = isOpen(b, UPG.megaflesh);
  return {
    owned: b.megaflesh,
    rows: table
      .filter((r) => r.row <= 11)
      .map((r) => ({ row: r.row, name: r.name, owned: b.megaflesh >= r.row })),
    chromatic: Math.max(0, b.megaflesh - 11),
    next: row
      ? {
          row: nextRow,
          name: row.name,
          label,
          // Row 12's "$x" is a value the game fills in; our label says it without inventing the number.
          text: gameText.includes('$') ? label : gameText,
          cost: open && cost !== null ? meatText(cost) : null,
          have: n.projected,
          need: open ? cost : null,
          progress:
            open && cost !== null && n.projected !== null
              ? `${amount(Math.min(n.projected, cost))} of ${amount(cost)}`
              : null,
          at: open ? affordAt(n, cost) : null,
          affordable: open && cost !== null && n.projected !== null && n.projected >= cost,
        }
      : null,
    multiplier: b.megafleshMultiplier === null ? null : `${amount(b.megafleshMultiplier)}x`,
  };
}

/** FR-16: the run order's tiers 4-7, open upgrades with a price, cheapest first inside a tier. */
function nextBuys(n: BubbaNow, kb: Kb): BubbaBuyView[] {
  const { b } = n;
  const ups = rows<UpgradeRow>(kb, 'bubba.fact.upgrades');
  const tiers = ['production', 'openers', 'discounts', 'rest'].map((k) =>
    String(val(kb, 'bubba.priority.run', k) ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map(Number),
  );
  const discounts = [4, 18, 26];
  const mfCost = b.costs[UPG.megaflesh] ?? null;
  const out: BubbaBuyView[] = [];
  tiers.forEach((list, t) => {
    const tier = t + 4;
    const open = list
      .filter((i) => isOpen(b, i) && (b.levels[i] ?? 0) < (ups[i]?.x4 ?? 999))
      .filter((i) => {
        // FR-5: an opener is "at its first level" only.
        if (tier === 5) return (b.levels[i] ?? 0) === 0;
        if (tier !== 6) return true;
        // FR-16's payback test: the cost is at most what one more level saves on the next Megaflesh.
        const ratio = b.discountNextRatio?.[discounts.indexOf(i)];
        const cost = b.costs[i] ?? null;
        return ratio !== undefined && cost !== null && mfCost !== null && cost <= (1 - ratio) * mfCost;
      })
      .map((i) => ({ i, cost: b.costs[i] ?? null }))
      .filter((x): x is { i: number; cost: number } => x.cost !== null)
      .sort((x, y) => x.cost - y.cost);
    for (const x of open)
      out.push({ index: x.i, name: ups[x.i]?.name ?? String(x.i), cost: meatText(x.cost), tier });
  });
  return out;
}

function charismaView(n: BubbaNow, kb: Kb): BubbaCharismaView | null {
  const { b } = n;
  if (!charismaOpen(b)) return null;
  const c = b.charisma;
  const table = rows<CharismaRow>(kb, 'bubba.fact.charisma');
  const max = c.maxLevel;
  const attrs = table.map((r, i) => {
    const level = c.levels[i] ?? 0;
    const now = c.bonus?.[i];
    const next = c.bonusNext?.[i];
    const atMax = max !== null && level >= max;
    return {
      id: r.id,
      name: r.name,
      level,
      max,
      now: now === undefined ? null : charismaLabel(r.label, now),
      next:
        next === undefined || atMax
          ? null
          : `${r.name} ${level} → ${level + 1}: ${charismaLabel(r.label, next)}`,
      training: c.selected === r.id,
      atMax,
      emulsified: c.emulsified === r.id,
    };
  });
  const xp = charismaXpAt(n);
  const total = c.levels.reduce((a, l) => a + l, 0);
  const banked = xp === null ? null : charismaLevelsFrom(total, xp);
  const sel = attrs.find((a) => a.training);
  const nextLevelAt =
    sel && !sel.atMax && xp !== null && c.xpReq !== null && c.xpPerSec !== null && c.xpPerSec > 0
      ? xp >= c.xpReq
        ? n.now
        : n.now + ((c.xpReq - xp) / c.xpPerSec) * 1000
      : null;
  const mfNow = Math.max(1, b.megaflesh);
  const targets: BubbaTargetView[] = [];
  const tt = kb.facts['bubba.fact.charisma-targets']?.rows as Targets | undefined;
  for (const src of tt?.sources ?? []) {
    if (src.until !== undefined && mfNow > src.until) continue;
    // The row that applies this run: the latest `from` at or below the Megaflesh owned.
    const row = (tt?.targets ?? [])
      .filter((t) => t.source === src.id && t.from <= mfNow)
      .sort((x, y) => y.from - x.from)[0];
    if (!row) continue;
    targets.push({
      source: src.id,
      label: `${src.name} (${src.date})`,
      from: row.from,
      gaps: row.levels.map((target, i) =>
        target > 0 ? { target, gap: Math.max(0, target - (c.levels[i] ?? 0)) } : null,
      ),
    });
  }
  return {
    attrs,
    nextLevelAt,
    banked,
    allMax: max !== null && attrs.every((a) => a.atMax),
    emulsifyOpen: b.megaflesh >= MF_EMULSIFY && c.emulsified === 0,
    mindfulFirst: b.megaflesh >= MF_EMULSIFY ? { level: c.levels[MINDFUL - 1] ?? 0, max } : null,
    targets,
  };
}

export function buildBubbaView(input: ViewInput): BubbaResult {
  const { n, kb, stage, step, timeline, openOn } = input;
  const { b } = n;
  const boon = rows<BoonRow>(kb, 'bubba.fact.boon');
  const ups = rows<UpgradeRow>(kb, 'bubba.fact.upgrades');
  const rate = ratingsOf(kb, stage);
  const level = b.levels[UPG.boon] ?? 0;
  const nextKey = boon[level % 7]?.key;
  const bonuses = boon.map((r, i) => ({
    key: r.key,
    name: r.name,
    text: bonusText(r.key, r.name, b.bonuses[i] ?? 0),
    stacks: Math.max(0, Math.ceil((level - i) / 7)),
    rating: rate[r.key] ?? 'mid',
    next: r.key === nextKey,
  }));
  const nextRow = boon[level % 7];
  const boonCost = b.costs[UPG.boon] ?? null;
  const boonNext =
    nextRow && isOpen(b, UPG.boon)
      ? {
          level: level + 1,
          key: nextRow.key,
          name: nextRow.name,
          add: b.boonNextDelta === null ? null : bonusText(nextRow.key, nextRow.name, b.boonNextDelta),
          cost: boonCost === null ? null : meatText(boonCost),
          at: affordAt(n, boonCost),
          affordable: boonCost !== null && n.projected !== null && n.projected >= boonCost,
        }
      : null;
  const gifts = rows<GiftRow>(kb, 'bubba.fact.gifts');
  const opener = (i: number) => `Opens at ${ups[i]?.name ?? i}`;
  const locked: Record<string, string> = {};
  const happi = (b.levels[UPG.happiBoi] ?? 0) + (b.prestige[UPG.happiBoi] ?? 0);
  if (happi < 1) locked.pats = opener(UPG.happiBoi);
  if (!b.smoker.unlocked) locked.smoker = opener(UPG.smoker);
  if (!charismaOpen(b)) locked.charisma = opener(UPG.charisma);
  if (!isOpen(b, UPG.funGifts) || (b.levels[UPG.funGifts] ?? 0) < 1) locked.gifts = opener(UPG.funGifts);
  if (!isOpen(b, 12)) locked.dice = opener(12);
  const smokeNow = smokeAt(n);
  const smokerCost = b.costs[UPG.smoker] ?? null;
  const atMax = smokeNow >= SMOKER_MAX_QUALITY_SECONDS;
  const refill = refillAt(n);
  const future = timeline
    .filter((t) => t.at !== null && t.at > n.now)
    .sort((x, y) => (x.at ?? 0) - (y.at ?? 0))[0];
  const nextType =
    b.types < 28
      ? `${ups[b.types]?.name ?? 'The next upgrade'} opens at ${meatText(b.nextTypeAt)} made this run`
      : null;
  return {
    state: n.notStarted ? 'not-started' : 'ok',
    step,
    nextEvent: future && future.at !== null ? { label: future.what, at: future.at } : null,
    ratePerMin: n.rate === null ? null : meatText(n.rate),
    projected: n.projected === null ? null : meatText(n.projected),
    bonuses,
    boonNext,
    megaflesh: megafleshView(n, kb),
    run: { nextType, nextBuys: nextBuys(n, kb) },
    pats:
      happi >= 1
        ? { left: patsLeft(n), perHour: b.pats.perHour, refillAt: refill > n.now ? refill : null }
        : null,
    smoker: b.smoker.unlocked
      ? {
          seconds: smokeNow,
          max: SMOKER_MAX_QUALITY_SECONDS,
          atMax,
          heldForSlabcakes: atMax && hasGift(b, GIFT.slabcakes),
          maxAt: atMax ? null : n.save + (SMOKER_MAX_QUALITY_SECONDS - b.smoker.seconds) * 1000,
          needs:
            atMax && smokerCost !== null && n.projected !== null && smokerCost > n.projected
              ? `needs ${meatText(smokerCost - n.projected)} more`
              : null,
        }
      : null,
    charisma: charismaView(n, kb),
    gifts: b.gifts.filter((g) => g > 0).map((g) => gifts.find((x) => x.id === g)?.name ?? String(g)),
    dice: b.dice.filter((d) => d > 0),
    loginNote: !n.unlock.all && !n.notStarted,
    openOn,
    locked,
  };
}
