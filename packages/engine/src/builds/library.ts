// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F4 Talent Book Library (docs/specs/M15-account-depth.md FR-20 to FR-25), built with M9's Builds
// (D-3), so it never recommends a talent no Build uses. Two engine Detectors (M11 TR-4, `kind:
// 'engine'`), registered by one-line re-exports in packages/engine/detectors/library/:
// - `library/checkout`: one Account finding for the first book candidate, in FR-21 order (the pusher,
//   then M2's Role order, D-5), plus a character finding for each next candidate up to the stored
//   checkouts and for each "can read, but no Build uses it" book (FR-23's `nice` branch, never the
//   Next Action);
// - `library/read-book`: one Account finding for the first held book a character can read whose talent
//   is a step of one of that character's Builds (FR-23's build branch), plus one per further book.
// A candidate is the first step (core steps first, then Build order) of the Build for the preset its
// AFK Target needs that targets max, takes a book (`talents.fact.book-eligible`), is filled on that
// preset (base == max) and sits below the lowest book level, so every roll raises it (red-team #20).
import { type AccountState, type BookPage, type HeldBook, humanize } from '@idleon-forge/account-state';
import {
  type CheckFinding,
  characterSubject,
  defineDetector,
  type SlotValue,
  STAGES,
} from '@idleon-forge/knowledge';
import { z } from 'zod';
import { ROLE_LINES } from '../metapath/knowledge';
import { selectPusher } from '../metapath/pusher';
import { assignRoles } from '../metapath/roles';
import { analyzeRoster } from '../metapath/roster';
import type { FactLookup } from '../metapath/types';
import { type AccountAnalysis, analyzeAccount, type CharacterAnalysis, type PresetView } from './analyze';
import { type BuildsKnowledge, talentLabel } from './knowledge';

export const BOOK_ELIGIBLE_FACT = 'talents.fact.book-eligible';
const FROM_STAGE = 'W3-early';
/** With the Book Reservation System on, a checkout needs more than 19 stored and spends 20 (N.js @8875709). */
export const RESERVATION_CHECKOUTS = 20;

const ACCOUNT = { kind: 'account' } as const;
const READS = [
  'account.library',
  'account.finishedWorlds',
  'account.currentWorld',
  'account.frontier',
  'characters[*].talents',
  'characters[*].class',
  'characters[*].classIndex',
  'characters[*].level',
  'characters[*].afkType',
] as const;

interface EligibleRows {
  maxIndex: number;
  ineligible: number[];
}

/** Whether a talent takes a book (Toolbox isBookEligibleTalent; the game's RANDOlist[16]). */
export function bookEligible(facts: FactLookup): (id: number) => boolean {
  const f = facts.get(BOOK_ELIGIBLE_FACT) as { rows?: EligibleRows } | undefined;
  const rows = f?.rows;
  if (!rows) return () => false;
  const bad = new Set(rows.ineligible);
  return (id) => id < rows.maxIndex && !bad.has(id);
}

const who = (state: AccountState, index: number) => {
  const c = state.characters.find((x) => x.index === index);
  return c ? `${humanize(c.class)} Lv ${c.level}` : '';
};

/** The preset the AFK Target needs (the active one when it needs no role), and its Build. */
function presetFor(a: CharacterAnalysis): PresetView | null {
  const role = a.neededRole;
  if (role) {
    if (a.active.cls === role) return a.active;
    if (a.other?.cls === role) return a.other;
    return null;
  }
  return a.active;
}

const levelOn = (v: PresetView, id: number) => {
  for (const t of v.talents.tabs) for (const x of t.talents) if (x.id === id) return x;
  return null;
};

/** The max level a character's talent has (max levels are per character, shared by both presets). */
const maxOf = (a: CharacterAnalysis, id: number): number | null =>
  levelOn(a.active, id)?.max ?? (a.other ? (levelOn(a.other, id)?.max ?? null) : null);

export interface BookCandidate {
  index: number;
  talentId: number;
}

/** FR-20: one character's book candidate, or null. */
export function bookCandidate(
  a: CharacterAnalysis,
  eligible: (id: number) => boolean,
  minBookLv: number,
): BookCandidate | null {
  const view = presetFor(a);
  const build = view?.build;
  if (!view || !build || build.contested) return null;
  const steps = build.tabs.flatMap((t) => t.steps);
  for (const step of [...steps.filter((s) => s.core), ...steps.filter((s) => !s.core)]) {
    if (step.target !== 'max' || !eligible(step.id)) continue;
    const t = levelOn(view, step.id);
    if (!t || t.max <= 0 || t.base !== t.max || t.max >= minBookLv) continue;
    return { index: a.index, talentId: step.id };
  }
  return null;
}

/** FR-21, D-5: the pusher first, then by the M2 Role table order of the first active Role, then level, then index. */
export function libraryOrder(state: AccountState, facts: FactLookup, acc: AccountAnalysis): number[] {
  const selection = selectPusher(state, facts);
  const pusher = selection.kind === 'pusher' ? selection.pusher.index : null;
  const roster = analyzeRoster(state, facts, acc.stage);
  const roles = assignRoles(state, facts, acc.stage, roster, pusher);
  const roleRank = (index: number) => {
    const first = (roles[index] ?? []).find((r) => r.active && r.role !== 'pusher');
    if (!first) return Number.POSITIVE_INFINITY;
    const line = first.entryId.split('role-')[1] ?? '';
    const i = ROLE_LINES.findIndex((l) => l.toLowerCase() === line);
    return i < 0 ? ROLE_LINES.length : i;
  };
  const level = (i: number) => state.characters.find((c) => c.index === i)?.level ?? 0;
  return state.characters
    .map((c) => c.index)
    .sort(
      (x, y) =>
        Number(y === pusher) - Number(x === pusher) ||
        roleRank(x) - roleRank(y) ||
        level(y) - level(x) ||
        x - y,
    );
}

/** The class line a book page serves (the Beginner page: every character). */
const pageServes = (page: BookPage, baseLine: string | null) => page === 'Beginner' || page === baseLine;

interface BookRead {
  index: number;
  book: HeldBook;
  count: number;
  inBuild: boolean;
}

/** FR-23: per held talent book (best level per page and talent), the highest-level character that can read it. */
export function bookReads(
  state: AccountState,
  acc: AccountAnalysis,
  baseLineOf: (cls: string) => string | null,
): BookRead[] {
  const books = state.account.library?.heldBooks ?? [];
  const groups = new Map<string, HeldBook[]>();
  for (const b of books) {
    const key = `${b.page}#${b.talentId}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  const out: BookRead[] = [];
  for (const group of groups.values()) {
    const best = [...group].sort((p, q) => q.level - p.level)[0] as HeldBook;
    const readers = [...acc.characters.values()]
      .filter((a) => {
        const c = state.characters.find((x) => x.index === a.index);
        const max = maxOf(a, best.talentId);
        return !!c && pageServes(best.page, baseLineOf(c.class)) && max !== null && max < best.level;
      })
      .sort((p, q) => {
        const lp = state.characters.find((c) => c.index === p.index)?.level ?? 0;
        const lq = state.characters.find((c) => c.index === q.index)?.level ?? 0;
        return lq - lp || p.index - q.index;
      });
    const reader = readers[0];
    if (!reader) continue;
    const inBuild = [reader.builds.fighting, reader.builds.skilling].some(
      (b) => !!b?.stepIds.has(best.talentId),
    );
    out.push({ index: reader.index, book: best, count: group.length, inBuild });
  }
  return out.sort((p, q) => q.book.level - p.book.level || p.book.talentId - q.book.talentId);
}

/** M9's resolved base line of a class ("Squire" -> "Warrior"), from the class tree. */
function baseLines(facts: FactLookup): (cls: string) => string | null {
  const f = facts.get('classes.fact.class-tree') as
    | { rows?: { class: string; line: string | null }[] }
    | undefined;
  const rows = new Map((f?.rows ?? []).map((r) => [r.class, r.line]));
  return (cls) => rows.get(cls) ?? null;
}

const nameOf = (kb: BuildsKnowledge, id: number) => talentLabel(kb.talents.nameOf(id) ?? String(id));

/** The gates both Detectors share: Stage from W3-early, M9's Builds apply, the Library is built (FR-25). */
function gate(state: AccountState, acc: AccountAnalysis): 'unknown' | 'off' | 'on' {
  const lib = state.account.library;
  if (lib === undefined || lib === null) return 'unknown';
  if (acc.beyond || acc.stage === null) return 'off';
  if (STAGES.indexOf(acc.stage) < STAGES.indexOf(FROM_STAGE)) return 'off';
  return lib.libraryLevel >= 1 ? 'on' : 'off';
}

const unknown = (): CheckFinding[] => [
  { subject: ACCOUNT, slots: {}, result: 'unknown', reason: 'field-missing' },
];

/** FR-20 to FR-24: what to check out, for whom; the "no current build uses it" books as details. */
export const checkoutDetector = defineDetector({
  id: 'library/checkout',
  kind: 'engine',
  system: 'library',
  params: z.strictObject({}),
  slots: z
    .strictObject({
      talent: z.string(),
      who: z.string(),
      page: z.string(),
      checkouts: z.number(),
      nextIn: z.number(),
      count: z.number(),
      nice: z.number(),
    })
    .partial(),
  reads: READS,
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts, now }) => {
    if (!state.account.library) return unknown();
    const acc = analyzeAccount(state, facts);
    const g = gate(state, acc);
    if (g === 'unknown') return unknown();
    if (g === 'off') return [];
    const lib = state.account.library;
    const ready = lib.reservationOn ? lib.checkouts >= RESERVATION_CHECKOUTS : lib.checkouts >= 1;
    if (!ready)
      return [{ subject: ACCOUNT, slots: {}, result: 'pass', nextChangeAt: now + lib.nextInSeconds * 1000 }];
    const eligible = bookEligible(facts);
    const baseLineOf = baseLines(facts);
    const order = libraryOrder(state, facts, acc);
    const candidates = order.flatMap((i) => {
      const a = acc.characters.get(i);
      const c = a ? bookCandidate(a, eligible, lib.bookLv.min) : null;
      return c ? [c] : [];
    });
    const first = candidates[0];
    if (!first) return [{ subject: ACCOUNT, slots: {}, result: 'pass' }];
    const firstChar = state.characters.find((c) => c.index === first.index);
    const page = (firstChar && baseLineOf(firstChar.class)) ?? '';
    const out: CheckFinding[] = [
      {
        subject: ACCOUNT,
        slots: {
          talent: nameOf(acc.kb, first.talentId),
          who: who(state, first.index),
          page,
          checkouts: lib.checkouts,
          nextIn: lib.nextInSeconds * 1000,
        },
        result: 'fires',
        urgency: 'banked',
        doneKey: `books:${lib.heldBooks.length}`,
      },
    ];
    // The next candidates, up to the checkouts stored (P4).
    for (const c of candidates.slice(1, Math.max(1, lib.checkouts)))
      out.push({
        subject: characterSubject(c.index),
        slots: { talent: nameOf(acc.kb, c.talentId), who: who(state, c.index) },
        result: 'fires',
      });
    // FR-23's nice branch: books a character could read, though no Build of theirs uses the talent.
    const listed = new Set(out.map((f) => (f.subject.kind === 'character' ? f.subject.index : -1)));
    for (const r of bookReads(state, acc, baseLineOf))
      if (!r.inBuild && !listed.has(r.index)) {
        listed.add(r.index);
        out.push({
          subject: characterSubject(r.index),
          slots: {
            talent: nameOf(acc.kb, r.book.talentId),
            who: who(state, r.index),
            count: r.count,
            nice: 1,
          },
          result: 'fires',
        });
      }
    return out;
  },
});

/** FR-23's build branch: read a held book on the character whose Build uses the talent. */
export const readBookDetector = defineDetector({
  id: 'library/read-book',
  kind: 'engine',
  system: 'library',
  params: z.strictObject({}),
  slots: z
    .strictObject({
      talent: z.string(),
      who: z.string(),
      level: z.number(),
      inStorage: z.number(),
      count: z.number(),
    })
    .partial(),
  reads: READS,
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => {
    if (!state.account.library) return unknown();
    const acc = analyzeAccount(state, facts);
    const g = gate(state, acc);
    if (g === 'unknown') return unknown();
    if (g === 'off') return [];
    const reads = bookReads(state, acc, baseLines(facts)).filter((r) => r.inBuild);
    const [first, ...rest] = reads;
    if (!first) return [{ subject: ACCOUNT, slots: {}, result: 'pass' }];
    const slots = (r: BookRead): Record<string, SlotValue> => ({
      talent: nameOf(acc.kb, r.book.talentId),
      who: who(state, r.index),
      level: r.book.level,
      ...(r.book.place === 'storage' ? { inStorage: 1 } : {}),
    });
    return [
      {
        subject: ACCOUNT,
        slots: { ...slots(first), count: reads.length },
        result: 'fires',
        urgency: 'banked',
        doneKey: `books:${state.account.library.heldBooks.length}`,
      },
      ...rest.map(
        (r): CheckFinding => ({ subject: characterSubject(r.index), slots: slots(r), result: 'fires' }),
      ),
    ];
  },
});
