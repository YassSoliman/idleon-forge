// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 1: the World 4 core pages' pictures (w4-types.ts) from the Account State. Pure and
// advice-free. Every Rift number goes through `riftLabel()` (FR-4).
import { type AccountState, ELITE_OF_SUBCLASS, type RiftTask } from '@idleon-forge/account-state';
import { riftLabel, riftText } from '../world4/rift-label';
import type {
  ElitePicture,
  RiftBonusView,
  RiftLevelView,
  RiftPicture,
  TomePicture,
  TomeRowView,
  TomeTierView,
} from './w4-types';

const human = (s: string) => s.replace(/_/g, ' ').trim();
const int = (n: number) => Math.round(n).toLocaleString('en-US');

/** "DEFEAT_500_MONSTERS_WITHIN_5_MIN" -> "Defeat 500 monsters within 5 min". */
export function riftTaskWords(t: RiftTask): string {
  if (t.kind === 'afk') return `Kill ${int(t.quota ?? 0)} monsters while AFK`;
  const s = t.text
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\bchars\b/g, 'characters')
    .replace(/\d{4,}/g, (n) => int(Number(n)))
    .replace(/divine knight|siege breaker|elemental sorcerer|rift tear/g, (m) =>
      m.replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const KIND: Record<RiftTask['kind'], (t: RiftTask) => string> = {
  afk: () => 'AFK kills',
  score: () => 'Score',
  characters: (t) => `On ${t.quota ?? 0} characters`,
  active: () => 'Played',
  end: () => 'Done',
};

/**
 * The twelve bonuses in words and the System each feeds (dossier C12 and M5-M19; tier 1 Toolbox and
 * game data). Eldritch Artifact (Sailing) and Sneak Mastery (Sneaking) are World 5+ and drawn "later".
 */
export const RIFT_BONUS_WORDS: Readonly<
  Record<string, { what: string; system: string | null; page?: string; later?: true }>
> = {
  Trap_Box_Vacuum: {
    what: 'Traps collect themselves every 24 hours, into storage',
    system: 'trapping',
    page: 'Trapping',
  },
  Infinite_Stars: {
    what: 'Your first star signs always count, with no downsides',
    system: 'star-signs',
    page: 'Star Signs',
  },
  Skill_Mastery: {
    what: "Each skill's level total across characters opens bonus tiers",
    system: 'skills',
    page: 'Skills',
  },
  Eclipse_Skulls: {
    what: 'Monsters past 1 billion kills count as Eclipse skulls: +5% damage each',
    system: 'death-note',
    page: 'Death Note',
  },
  Stamp_Mastery: {
    what: 'A daily chance at a Gilded Stamp: one upgrade at 5% of its cost',
    system: 'stamps',
    page: 'Stamps',
  },
  Eldritch_Artifact: { what: 'Sailing can find the Eldritch artifact tier', system: null, later: true },
  Vial_Mastery: {
    what: 'Each vial at level 13 adds 2% to every vial',
    system: 'alchemy-vials',
    page: 'Vials',
  },
  Construct_Mastery: {
    what: 'Total building levels add refinery speed, damage and build speed',
    system: 'construction',
    page: 'Construction',
  },
  Ruby_Cards: { what: 'Cards go up to 5 stars', system: 'cards', page: 'Cards' },
  Killroy_Prime: {
    what: "Killroy's best scores add damage to every character",
    system: 'killroy',
    page: 'Killroy',
  },
  Sneak_Mastery: { what: 'Ninja Castle mastery runs', system: null, later: true },
  Cooking_Mastery: { what: 'A Mastery shelf in the Meal Menu', system: 'cooking', page: 'Cooking' },
};

export function riftPicture(state: AccountState): RiftPicture | null {
  const r = state.account.rift;
  if (!r) return null;
  const bonusAt = new Map(r.bonuses.map((b) => [b.level, b.name]));
  const levelView = (t: RiftTask): RiftLevelView => {
    // Reaching this level (`Rift[0]` = its index) is what opens a bonus (FR-4: "Rift 16" Skill Mastery).
    const bonus = bonusAt.get(t.level) ?? null;
    return {
      shown: riftLabel(t.level),
      label: riftText(t.level),
      kind: KIND[t.kind](t),
      task: riftTaskWords(t),
      icon: t.icon,
      gate:
        t.kind === 'score' && t.elite
          ? { elite: human(t.elite), owned: (r.elites[t.elite] ?? []).length > 0 }
          : null,
      bonus: bonus ? human(bonus) : null,
    };
  };
  const next = r.bonuses.find((b) => !b.unlocked) ?? null;
  const bonuses: RiftBonusView[] = r.bonuses.map((b, i) => {
    const w = RIFT_BONUS_WORDS[b.name];
    return {
      name: human(b.name),
      icon: i,
      // A bonus needing `Rift[0]` >= L opens as the game's level L + 1 is reached (FR-4: Rift 16 Skill Mastery).
      shown: riftLabel(b.level),
      label: riftText(b.level),
      unlocked: b.unlocked,
      next: b === next,
      what: w?.what ?? '',
      system: w?.system ?? null,
      page: w?.page ?? null,
      later: !b.unlocked && w?.later === true,
    };
  });
  const chest = state.account.storageItems ?? {};
  const held = (raw: string) =>
    (chest[raw] ?? 0) + state.characters.reduce((n, c) => n + (c.inventoryItems?.[raw] ?? 0), 0);
  return {
    systemId: 'rift',
    kind: 'rift',
    unlocked: r.unlocked,
    shown: riftLabel(r.level),
    label: riftText(r.level),
    done: r.level,
    max: 65,
    current:
      r.task && r.task.kind !== 'end'
        ? {
            ...levelView(r.task),
            progress: r.progress,
            quota: r.task.quota ?? 0,
            complete: r.complete,
            counted: r.countedChars,
          }
        : null,
    afk: r.afkOnRift,
    nextBonus: next
      ? {
          name: human(next.name),
          shown: riftLabel(next.level),
          label: riftText(next.level),
          levelsToGo: next.level - r.level,
        }
      : null,
    upcoming: r.upcoming.map(levelView),
    bonuses,
    quest: r.unlocked
      ? []
      : r.questItems.map((i) => ({
          rawName: i.rawName,
          name: human(i.name),
          have: held(i.rawName),
          need: i.amount,
        })),
  };
}

/** The `Rift[0]` of each elite's score levels (game client RiftStuff[4], tasks 6-8; account-state rift.test.ts). */
const ELITE_RIFT_LEVELS: Readonly<Record<string, readonly number[]>> = {
  Divine_Knight: [7, 17, 28, 42],
  Elemental_Sorcerer: [8, 26, 43],
  Siege_Breaker: [15, 21, 35, 64],
};

/** M26 FR-17: the six elites at Eliteus, who holds each and who is on the way. */
export function elitePicture(state: AccountState): ElitePicture | null {
  if (!state.characters.some((c) => c.eliteStep)) return null;
  const elites = Object.entries(ELITE_OF_SUBCLASS).map(([from, elite]) => ({
    elite,
    name: human(elite),
    from: human(from),
    holders: state.characters
      .filter((c) => c.eliteStep?.step === 'done' && c.eliteStep.elite === elite)
      .map((c) => c.index),
    onTheWay: state.characters.flatMap((c) => {
      const e = c.eliteStep;
      return e && e.elite === elite && (e.step === 'gang' || e.step === 'pick')
        ? [{ index: c.index, step: e.step, kills: e.gangKills ?? 0 }]
        : [];
    }),
    riftGates: (ELITE_RIFT_LEVELS[elite] ?? []).map(riftText),
  }));
  return {
    systemId: 'elite-classes',
    kind: 'elite',
    elites,
    pending: elites.reduce((n, e) => n + e.onTheWay.length, 0),
    done: elites.reduce((n, e) => n + e.holders.length, 0),
  };
}

/** "Total_Talent_Max_LV__(Tap_for_more_info)" -> "Total Talent Max LV". */
const metricName = (name: string) =>
  human(name.replace(/\(Tap_for_more_info\)/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
/** 602 -> "602", 1234567 -> "1.23M" (deterministic, no locale). */
const short = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `${Number((n / 1e9).toPrecision(3))}B`;
  if (a >= 1e6) return `${Number((n / 1e6).toPrecision(3))}M`;
  if (a >= 1e4) return `${Number((n / 1e3).toPrecision(3))}K`;
  return int(n);
};
const NEXT_TIER: Record<TomeTierView, 'silver' | 'gold' | 'blue' | null> = {
  bronze: 'silver',
  silver: 'gold',
  gold: 'blue',
  blue: null,
};

/** M26 FR-16: the Tome page's metrics, PTS, gates and bonuses. */
export function tomePicture(state: AccountState): TomePicture | null {
  const t = state.account.tome;
  if (!t) return null;
  const lv = t.accountLevel;
  const rows: TomeRowView[] = t.metrics.map((m) => {
    const nt = NEXT_TIER[m.tier];
    const need = nt ? m.needs[nt] : null;
    return {
      name: metricName(m.name),
      order: m.order,
      counting: m.lvReq <= lv,
      lvReq: m.lvReq,
      points: m.points,
      maxPoints: m.maxPoints,
      tier: m.tier,
      quantity: short(m.quantity),
      next: nt && need !== null ? { tier: nt, need: short(need) } : null,
      lowerIsBetter: m.lowerIsBetter,
    };
  });
  const waitingRows = rows.filter((r) => !r.counting);
  return {
    systemId: 'tome',
    kind: 'tome',
    points: t.totalPoints,
    damagePct: t.damagePct,
    skillEffPct: t.skillEffPct,
    dropRatePct: t.dropRatePct,
    accountLevel: lv,
    counted: rows.length - waitingRows.length,
    total: rows.length,
    waiting: waitingRows.reduce((n, r) => n + r.points, 0),
    nextUnlocks: waitingRows
      .sort((a, b) => a.lvReq - b.lvReq)
      .slice(0, 3)
      .map((r) => ({ name: r.name, lvReq: r.lvReq, levelsToGo: r.lvReq - lv, points: r.points })),
    rows,
    pages: t.pages,
  };
}
