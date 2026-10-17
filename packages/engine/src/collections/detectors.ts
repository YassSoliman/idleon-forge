// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8's engine Detectors (M8 TR-5, M11 TR-4, `kind: 'engine'`): stamp status, card slots, card set,
// card preset and obol state behind the Detector contract, so the module runs them with per-Detector
// error isolation and records their `reads` as provenance. Each `view` param selects the findings one
// Check entry renders; every word the player reads is in the entry's template, and the Detector
// supplies only slot values (names, counts, places). Findings name characters by index only.
//
// Registered by one-line re-exports in packages/engine/detectors/{stamps,cards,obols}/<name>.ts.
// Ids the module reads (named here so `kb compile` ships them): 'stamps.priority.acquire',
// 'stamps.fact.unobtainable', 'stamps.fact.shared-resources', 'metapath.fact.town-unlocks',
// 'obols.fact.obol-altar', 'quests.acquisition.obol-altar1', 'cards.fact.activity-keywords',
// 'cards.fact.slots', 'classes.fact.class-tree'.
import type { AccountState } from '@idleon-forge/account-state';
import { defineDetector, type SlotValue, type Subject, type UnknownReason } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { activityName, type CardsAdvice, evaluateCards, setBonus } from './cards';
import { type FactLookup, human } from './knowledge';
import { evaluateObols, type ObolsEval } from './obols';
import { and, plural, who } from './routes';
import {
  evaluateStamps,
  handInAction,
  lookAheadText,
  questGap,
  questLabel,
  questNote,
  type StampsEval,
  stampNames,
} from './stamps';

/** One M8 finding: a CheckFinding plus what the module needs to place and group it. */
export type M8Finding = {
  subject: Subject;
  slots: Record<string, SlotValue>;
  /** Findings of one entry with the same group on two or more characters merge into one account line (#70 A5). */
  group?: string;
  /** "Squire 85", for the merged line. */
  who?: string;
  milestone?: { unit: string; current: number; next: number; etaSeconds: number | null };
  /** For an Active Play view: which quest this is. */
  quest?: string;
} & ({ result: 'fires' } | { result: 'unknown'; reason: UnknownReason });

const acct: Subject = { kind: 'account' };
const char = (index: number): Subject => ({ kind: 'character', index });
const unknown = (subject: Subject = acct): M8Finding => ({
  subject,
  slots: {},
  result: 'unknown',
  reason: 'parser-section-failed',
});

// One evaluation per (state, knowledge) pair: several Checks read the same one.
const memo = <T>(f: (s: AccountState, kb: FactLookup) => T) => {
  const cache = new WeakMap<AccountState, WeakMap<FactLookup, T>>();
  return (s: AccountState, kb: FactLookup): T => {
    let inner = cache.get(s);
    if (!inner) {
      inner = new WeakMap();
      cache.set(s, inner);
    }
    const hit = inner.get(kb);
    if (hit !== undefined) return hit;
    const v = f(s, kb);
    inner.set(kb, v);
    return v;
  };
};
export const stampsOf = memo<StampsEval>(evaluateStamps);
export const cardsOf = memo<CardsAdvice[]>(evaluateCards);
export const obolsOf = memo<ObolsEval>(evaluateObols);

const label = (s: AccountState, i: number | null) => {
  const c = s.characters.find((x) => x.index === i);
  return c ? who(c) : '';
};

const STAMP_READS = [
  'account.stampLevels',
  'account.currentWorld',
  'account.shopStock',
  'account.storageItems',
  'account.refineryStorage',
  'account.heldItemTypes',
  'account.highestLevel',
  'characters[*].quests',
  'characters[*].inventoryItems',
  'characters[*].freeInventorySlots',
  'characters[*].carryPerSlot',
  'characters[*].smithingLevel',
  'characters[*].targetMonster',
  'characters[*].afk',
  'characters[*].level',
  'characters[*].class',
] as const;

/** Every slot a view may fill (each optional: one Detector serves several entries). */
const slotsOf = (numbers: readonly string[], strings: readonly string[]) =>
  z.strictObject({
    ...Object.fromEntries(numbers.map((k) => [k, z.number().optional()])),
    ...Object.fromEntries(strings.map((k) => [k, z.string().optional()])),
  }) as unknown as z.ZodType<Record<string, SlotValue>>;

export const stampStatusDetector = defineDetector({
  id: 'stamps/status',
  kind: 'engine',
  system: 'stamps',
  params: z.strictObject({
    view: z.enum(['collect', 'shop-now', 'handin-now', 'held-now', 'quest-toward', 'active']),
    /** For `active`: the quest (Toolbox QuestName, e.g. "Wellington1"). */
    quest: z.string().optional(),
  }),
  slots: slotsOf(
    ['owned', 'obtainable', 'now', 'active', 'toward', 'later', 'count'],
    ['stamps', 'where', 'stamp', 'place', 'action', 'note', 'quest', 'gap', 'who', 'lookAhead'],
  ),
  reads: STAMP_READS,
  examples: { fires: [{ fixture: 'scrubbed-w3', params: { view: 'shop-now' } }], silent: [] },
  run: ({ state, facts }, p): M8Finding[] => {
    const s = stampsOf(state, facts);
    if (p.view === 'collect') {
      if (s.state === 'unknown') return [unknown()];
      if (s.state === 'locked') return [];
      return [
        {
          subject: acct,
          result: 'fires',
          slots: {
            owned: s.owned,
            obtainable: s.obtainable,
            now: s.byStatus.now,
            active: s.byStatus.active,
            toward: s.byStatus.toward,
            later: s.byStatus.later,
          },
          milestone: { unit: 'stamps', current: s.owned, next: s.obtainable, etaSeconds: null },
        },
      ];
    }
    if (s.state !== 'ok') return s.state === 'unknown' ? [unknown()] : [];
    switch (p.view) {
      case 'shop-now': {
        if (s.shopNow.length === 0) return [];
        const towns: string[] = [];
        for (const b of s.shopNow) {
          const town = human(b.town);
          const names = s.shopNow.filter((x) => x.town === b.town).map((x) => human(x.name));
          const line = `${town}: ${and(names)}`;
          if (!towns.includes(line)) towns.push(line);
        }
        return [
          {
            subject: acct,
            result: 'fires',
            slots: { count: s.shopNow.length, stamps: towns.join('; ') },
            milestone: { unit: 'stamps', current: s.owned, next: s.obtainable, etaSeconds: null },
          },
        ];
      }
      case 'held-now':
        return s.held.map((h) => ({
          subject: h.character === null ? acct : char(h.character),
          result: 'fires' as const,
          slots: {
            stamp: human(h.name),
            where: h.character === null ? 'Take the' : 'Use the',
            place: h.character === null ? ' from storage and use it' : " you're carrying",
          },
          group: h.rawName,
          who: label(state, h.character),
        }));
      case 'handin-now':
        return s.handins
          .filter((o) => o.character !== null)
          .map((o) => ({
            subject: char(o.character as number),
            result: 'fires' as const,
            slots: {
              action: handInAction(state, o),
              stamps: stampNames(o),
              note: `${questNote(o)}${lookAheadText(state, o)}`,
              quest: questLabel(o.quest),
            },
          }));
      case 'quest-toward': {
        const quests = s.toward
          .filter((o) => o.character !== null)
          .map((o) => ({
            subject: char(o.character as number),
            result: 'fires' as const,
            slots: {
              quest: questLabel(o.quest),
              gap: questGap(o),
              stamps: stampNames(o),
              note: questNote(o),
            },
          }));
        const soldOut = s.soldOut.map((b) => ({
          subject: acct,
          result: 'fires' as const,
          slots: {
            quest: `${human(b.town)} shop`,
            gap: 'sold out; the shop restocks',
            stamps: human(b.name),
            note: '',
          },
        }));
        const drops = s.drops.map((d) => ({
          subject: char(d.character),
          result: 'fires' as const,
          slots: {
            quest: 'This map',
            gap:
              d.etaSeconds === null
                ? 'can drop it'
                : `can drop it, within about ${Math.max(1, Math.round(d.etaSeconds / 3600)).toLocaleString('en-US')} h at base rate (likely sooner)`,
            stamps: human(d.name),
            note: '',
          },
        }));
        return [...quests, ...soldOut, ...drops];
      }
      case 'active':
        return s.active
          .filter((o) => o.quest.questName === p.quest && o.character !== null)
          .map((o) => ({
            subject: acct,
            result: 'fires' as const,
            slots: {
              who: label(state, o.character),
              stamps: stampNames(o),
              lookAhead: lookAheadText(state, o),
            },
            quest: o.quest.questName,
          }));
    }
    return [];
  },
});

const CARD_READS = [
  'account.cards',
  'account.cardSets',
  'account.gemPurchases',
  'account.frontier',
  'characters[*].cardLoadout',
  'characters[*].afkType',
  'characters[*].level',
  'characters[*].class',
] as const;

const cardName = (s: AccountState, raw: string) => human(s.account.cards?.[raw]?.name ?? raw);

export const cardSlotsDetector = defineDetector({
  id: 'cards/slots',
  kind: 'engine',
  system: 'cards',
  params: z.strictObject({ view: z.enum(['empty', 'passive']) }),
  slots: slotsOf(['count', 'open'], ['cardsWord', 'cards', 'passive', 'activity']),
  reads: CARD_READS,
  examples: { fires: [{ fixture: 'scrubbed-w3', params: { view: 'empty' } }], silent: [] },
  run: ({ state, facts }, p): M8Finding[] =>
    cardsOf(state, facts).flatMap((a): M8Finding[] => {
      if (a.unknown) return [unknown(char(a.index))];
      const sl = a.slots;
      if (!sl || !a.activity) return [];
      const passive = sl.passive.length > 0;
      if ((p.view === 'passive') !== passive) return [];
      const n = Math.min(sl.suggest.length, sl.open + sl.passive.length);
      const picks = sl.suggest.slice(0, n);
      return [
        {
          subject: char(a.index),
          result: 'fires',
          slots: {
            count: n,
            cardsWord: plural(n, 'card'),
            open: sl.open,
            cards: and(picks.map((r) => cardName(state, r))),
            passive: and(sl.passive.map((r) => cardName(state, r))),
            activity: activityName(a.activity),
          },
          // Merged only when the advice is the same, card for card.
          group: `${p.view}:${sl.passive.join(',')}:${picks.join(',')}`,
          who: label(state, a.index),
        },
      ];
    }),
});

export const cardSetDetector = defineDetector({
  id: 'cards/set',
  kind: 'engine',
  system: 'cards',
  params: z.strictObject({
    view: z.enum(['no-set', 'set-mismatch', 'blunder-50']).optional(),
    /** The generated set Goals (`cards.goal.set-*`) name their set; M8 reads tiers from `account.cardSets`. */
    set: z.string().optional(),
  }),
  // `value` and `next` are the generated set Goals' (cards.goal.set-*) template slots.
  slots: slotsOf(['tier', 'value', 'next'], ['set', 'bonus', 'current']),
  reads: CARD_READS,
  examples: { fires: [{ fixture: 'scrubbed-w3', params: { view: 'no-set' } }], silent: [] },
  run: ({ state, facts }, p): M8Finding[] =>
    cardsOf(state, facts).flatMap((a): M8Finding[] => {
      if (a.unknown) return [unknown(char(a.index))];
      const s = a.set;
      if (!s || s.reason !== p.view) return [];
      const r = s.recommended;
      const current = state.account.cardSets?.find((x) => x.rawName === s.current);
      return [
        {
          subject: char(a.index),
          result: 'fires',
          slots: {
            set: human(r.name),
            tier: r.tier,
            bonus: setBonus(r),
            current: current ? human(current.name) : '',
          },
          group: `${p.view}:${r.rawName}:${s.current ?? ''}`,
          who: label(state, a.index),
          milestone: {
            unit: `${human(r.name)} set points`,
            current: r.points,
            next: (r.tier + 1) * r.size,
            etaSeconds: null,
          },
        },
      ];
    }),
});

export const cardPresetDetector = defineDetector({
  id: 'cards/preset',
  kind: 'engine',
  system: 'cards',
  params: z.strictObject({ view: z.enum(['switch', 'fill']) }),
  slots: slotsOf(['n'], ['activity', 'top']),
  reads: [...CARD_READS, 'characters[*].cardLoadout.presets', 'characters[*].cardLoadout.selectedPreset'],
  examples: { fires: [{ fixture: 'scrubbed-w3', params: { view: 'switch' } }], silent: [] },
  run: ({ state, facts }, p): M8Finding[] =>
    cardsOf(state, facts).flatMap((a): M8Finding[] => {
      if (a.unknown) return [unknown(char(a.index))];
      if (!a.preset || a.preset.kind !== p.view || !a.activity) return [];
      return [
        {
          subject: char(a.index),
          result: 'fires',
          slots: {
            n: a.preset.n + 1,
            activity: activityName(a.activity),
            top: a.preset.top ? ` (${cardName(state, a.preset.top)} card first)` : '',
          },
        },
      ];
    }),
});

const OBOL_READS = [
  'account.familyObols',
  'account.storedObols',
  'account.obolDropMerit',
  'account.accountLevel',
  'account.highestLevel',
  'account.shopStock',
  'account.storageItems',
  'account.refineryStorage',
  'characters[*].quests',
  'characters[*].personalObols',
  'characters[*].inventoryItems',
  'characters[*].level',
  'characters[*].class',
] as const;

export const obolStateDetector = defineDetector({
  id: 'obols/state',
  kind: 'engine',
  system: 'obols',
  params: z.strictObject({ view: z.enum(['altar', 'stored', 'slots']) }),
  slots: slotsOf(
    ['stored', 'count'],
    ['action', 'storedWord', 'obolsWord', 'where', 'shape', 'merit', 'line'],
  ),
  reads: OBOL_READS,
  examples: { fires: [{ fixture: 'scrubbed-w3', params: { view: 'altar' } }], silent: [] },
  run: ({ state, facts }, p): M8Finding[] => {
    const o = obolsOf(state, facts);
    if (o.state === 'unknown') return [unknown()];
    if (o.state === 'hidden') return [];
    const merit =
      o.meritLevel === 0
        ? "; regular monsters don't drop obols until the W2 merit 'Monsters now drop Obols'"
        : '';
    if (p.view === 'altar') {
      const a = o.altar;
      if (o.altarDone || !a || a.how === 'missing') return [];
      const action =
        a.how === 'carrying'
          ? `Give the Obol Altar the ${a.item} you're carrying`
          : a.how === 'storage'
            ? `Take the ${a.item} from storage and give it to the Obol Altar`
            : `Buy a ${a.item} at the ${a.town} shop and give it to the Obol Altar`;
      return [
        {
          subject: char(a.character),
          result: 'fires',
          slots: { action, stored: o.stored, storedWord: plural(o.stored, 'obol') },
        },
      ];
    }
    if (p.view === 'stored') {
      if (!o.altarDone) return [];
      return o.placements.map((x) => ({
        subject: x.to === 'family' ? acct : char(x.to),
        result: 'fires' as const,
        slots: {
          count: x.count,
          obolsWord: plural(x.count, 'obol'),
          where: `${x.count === 1 ? 'a ' : ''}${x.to === 'family' ? 'family' : 'personal'} ${x.shape.toLowerCase()} ${plural(x.count, 'slot')}`,
          shape: x.shape.toLowerCase(),
          merit,
        },
        group: `${x.to === 'family' ? 'family' : 'personal'}:${x.shape}`,
        who: x.to === 'family' ? '' : `${label(state, x.to)} (${x.count})`,
      }));
    }
    // slots: the obol Goal (FR-22, FR-23).
    if (!o.altarDone) {
      if (o.stored === 0) return [];
      return [
        {
          subject: acct,
          result: 'fires',
          slots: { line: `${o.stored} stored ${plural(o.stored, 'obol')} wait for the Obol Altar${merit}` },
        },
      ];
    }
    const next = o.nextFamilySlot;
    // Nothing to say once every family slot is filled, none is coming and obols drop (#70 A5's noise rule).
    if (!next && !merit && o.familyOpen === 0) return [];
    const line = next
      ? `Family obols ${o.familyFilled} of ${o.familyFilled + o.familyOpen} filled; next ${next.shape.toLowerCase()} slot at family level ${next.levelReq.toLocaleString('en-US')} (${next.gap.toLocaleString('en-US')} to go)${merit}`
      : `Family obols ${o.familyFilled} of ${o.familyFilled + o.familyOpen} filled${merit}`;
    const fam = state.account.accountLevel;
    return [
      {
        subject: acct,
        result: 'fires',
        slots: { line },
        ...(next && fam !== null
          ? { milestone: { unit: 'family level', current: fam, next: next.levelReq, etaSeconds: null } }
          : {}),
      },
    ];
  },
});

/** Every M8 engine Detector, by id. */
export const COLLECTIONS_DETECTORS = Object.freeze({
  [stampStatusDetector.id]: stampStatusDetector,
  [cardSlotsDetector.id]: cardSlotsDetector,
  [cardSetDetector.id]: cardSetDetector,
  [cardPresetDetector.id]: cardPresetDetector,
  [obolStateDetector.id]: obolStateDetector,
});
