// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 cards, card sets and card presets (FR-13 to FR-19, TR-9): per character, the open card slots with
// the cards to put in them, the card set for its activity (D3's pusher rule), and the card preset to
// switch to or fill. Card fit is by effect keyword (the authored table), never by card category. Pure.
import {
  type AccountState,
  type CardSetState,
  type CharacterState,
  isKnown,
} from '@idleon-forge/account-state';
import { classTree } from '../metapath/knowledge';
import { selectPusher } from '../metapath/pusher';
import { acquisitionId, type FactLookup, factRows, human, M8 } from './knowledge';

/** The AFK types M8 has card advice for. */
export const CARD_ACTIVITIES = ['FIGHTING', 'MINING', 'CHOPPIN', 'FISHING', 'CATCHING'] as const;
export type CardActivity = (typeof CARD_ACTIVITIES)[number];

export interface Keywords {
  fighting: string[];
  skilling: string[];
  both: string[];
  MINING: string[];
  CHOPPIN: string[];
  FISHING: string[];
  CATCHING: string[];
}

/** Gem Shop indices (TR-3): Extra Card Slot (GemP3) and Card Presets (GemQ9). */
export interface CardFacts {
  baseSlots: number;
  basePresets: number;
  presetLevel: number;
  maxPresets: number;
  gemExtraSlot: number;
  gemPresets: number;
  fightLevelBand: number;
}

export interface SetAdvice {
  reason: 'no-set' | 'set-mismatch' | 'blunder-50';
  current: string | null;
  recommended: CardSetState;
}

export interface CardsAdvice {
  index: number;
  activity: CardActivity | null;
  /** FR-13/FR-16. */
  slots: { total: number; open: number; passive: string[]; suggest: string[] } | null;
  set: SetAdvice | null;
  /** FR-19: the set this character uses or is told to use, for its tier Milestone. */
  setInUse: CardSetState | null;
  /** FR-17: 0-based preset index; texts add 1. */
  preset: { kind: 'switch' | 'fill'; n: number; top: string | null } | null;
  unknown: boolean;
}

const tokens = (effect: string) =>
  `_${effect
    .replace(/^\+?\{(%|px)?_?/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')}_`;
const matches = (effect: string, words: readonly string[]) => {
  const t = tokens(effect);
  return words.some((w) => t.includes(`_${w.toLowerCase()}_`));
};

export const isPassive = (effect: string) => /\(passive\)|\(p\)/i.test(effect);

/** TR-9: does a card's effect fit an activity? Drop rate fits both. */
export function fits(effect: string, activity: CardActivity, k: Keywords): boolean {
  if (matches(effect, k.both)) return true;
  if (activity === 'FIGHTING') return matches(effect, k.fighting);
  return matches(effect, k[activity]) || matches(effect, k.skilling);
}

/** A preset fits an activity when at least half of its cards fit it (ties fit both). */
export function presetFits(
  state: AccountState,
  cards: readonly string[],
  activity: CardActivity,
  k: Keywords,
): boolean {
  if (cards.length === 0) return false;
  const n = cards.filter((c) => fits(state.account.cards?.[c]?.effect ?? '', activity, k)).length;
  return n * 2 >= cards.length;
}

/** The class line a card list is keyed by: the base class (Warrior, Archer, Mage, Journeyman). */
export function classLine(kb: FactLookup, cls: string): string | null {
  const tree = classTree(kb);
  let row = tree.byName.get(cls);
  for (let guard = 0; row && guard < 10; guard++) {
    if (row.tier === 'base') return row.class;
    if (row.tier === 'beginner') return null;
    row = row.promotesFrom ? tree.byName.get(row.promotesFrom) : undefined;
  }
  return null;
}

/** `cards.fact.card-preferences` (authored, by card rawName): the preset matrix and the class lines' main-stat cards. */
export interface CardPreferences {
  matrix: Record<CardActivity, string[][]>;
  sets: { FIGHTING: string[]; FIGHTING_50: string[]; SKILLING: string[] };
  mainStat: Record<string, string[]>;
}

/** The ordered card candidates for an activity (FR-13): a fighter's class line's main-stat cards, then the matrix. */
export function cardCandidates(
  kb: FactLookup,
  c: Pick<CharacterState, 'class'>,
  activity: CardActivity,
): string[] {
  const p = factRows<CardPreferences>(kb, M8.cardPreferences);
  const matrix = (p.matrix[activity] ?? []).flat();
  if (activity !== 'FIGHTING') return matrix;
  const line = classLine(kb, c.class);
  return [...((line && p.mainStat[line]) || []), ...matrix];
}

/** FR-14/D3: the set order for an activity and level, as set rawNames, best first. */
function setOrder(kb: FactLookup, activity: CardActivity, level: number, band: number): string[] {
  const { sets } = factRows<CardPreferences>(kb, M8.cardPreferences);
  return activity === 'FIGHTING' ? (level >= band ? sets.FIGHTING_50 : sets.FIGHTING) : sets.SKILLING;
}

/** "+20% All Food Effect" for a set at a tier. */
export function setBonus(s: CardSetState, tier = s.tier): string {
  const v = Math.round(s.bonus * tier * 100) / 100;
  return `+${human(s.effect.replace(/^\{/, String(v)).replace(/^(\d+(?:\.\d+)?)%_/, '$1% '))}`;
}

/** Toolbox's cardsAlert set kinds (utility/dashboard/characters.js): skill sets and W1–W3 fight sets. */
const SKILL_SETS = ['CardSet2', 'CardSet3', 'CardSet5'];
const FIGHT_SETS = ['CardSet0', 'CardSet1', 'CardSet4'];

/** Evaluates every character's card loadout. */
export function evaluateCards(state: AccountState, kb: FactLookup): CardsAdvice[] {
  const k = factRows<Keywords>(kb, M8.keywords);
  const f = factRows<CardFacts>(kb, M8.cardSlots);
  const gems = state.account.gemPurchases ?? null;
  const cards = state.account.cards ?? null;
  const sets = state.account.cardSets ?? null;
  const setsKnown = isKnown(state, 'account.cardSets') && sets !== null;
  const cardsKnown = isKnown(state, 'account.cards') && cards !== null;
  const gemsKnown = isKnown(state, 'account.gemPurchases') && gems !== null;
  const pusher = (() => {
    try {
      const s = selectPusher(state, kb);
      return s.kind === 'pusher' ? s.pusher.index : null;
    } catch {
      return null;
    }
  })();
  const hitChance = (i: number) =>
    state.account.frontier?.fights.find((x) => x.characterIndex === i)?.hitChance ?? null;
  const setOf = (raw: string | null) => sets?.find((s) => s.rawName === raw) ?? null;

  return state.characters.map((c): CardsAdvice => {
    const out: CardsAdvice = {
      index: c.index,
      activity: null,
      slots: null,
      set: null,
      setInUse: null,
      preset: null,
      unknown: false,
    };
    const act = (CARD_ACTIVITIES as readonly string[]).includes(c.afkType ?? '')
      ? (c.afkType as CardActivity)
      : null;
    out.activity = act;
    const l = c.cardLoadout;
    if (!isKnown(state, `characters[${c.index}].cardLoadout`) || !l || !cardsKnown || !gemsKnown || !cards) {
      out.unknown = true;
      return out;
    }
    if (act === null) return out;
    const effect = (raw: string) => cards[raw]?.effect ?? '';
    const level = (raw: string) => (cards[raw] ? (cards[raw]?.stars ?? 0) + 1 : 0);

    // FR-13, FR-16: open slots and passive cards in slots.
    const total = f.baseSlots + (gems?.[f.gemExtraSlot] ?? 0);
    const passive = l.equipped.filter((r) => isPassive(effect(r)));
    const open = Math.max(0, total - l.equipped.length);
    const list = cardCandidates(kb, c, act);
    const rank = new Map(list.map((r, i) => [r, i]));
    const usable = (r: string) =>
      (cards[r]?.amount ?? 0) > 0 &&
      !l.equipped.includes(r) &&
      !isPassive(effect(r)) &&
      fits(effect(r), act, k);
    const fromList = list.filter(usable);
    const others = Object.keys(cards)
      .filter((r) => usable(r) && !rank.has(r))
      .sort((a, b) => level(b) - level(a) || (a < b ? -1 : 1));
    const byLevel = [...fromList].sort(
      (a, b) => level(b) - level(a) || (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
    );
    const want = open + passive.length;
    const suggest = [...byLevel, ...others].slice(0, want);
    if (want > 0 && suggest.length > 0) out.slots = { total, open, passive, suggest };

    // FR-14, FR-15, D3: the set for the activity.
    if (setsKnown && sets) {
      const order = setOrder(kb, act, c.level, f.fightLevelBand);
      let recommended = order.map(setOf).find((s) => s && s.tier >= 1) ?? null;
      const frost = setOf('CardSet4');
      const hc = hitChance(c.index);
      if (
        act === 'FIGHTING' &&
        c.level >= f.fightLevelBand &&
        c.index === pusher &&
        frost &&
        frost.tier >= 1 &&
        hc !== null &&
        hc < 100
      )
        recommended = frost;
      const current = l.set;
      const cur = setOf(current);
      out.setInUse = recommended ?? cur;
      if (recommended && current !== recommended.rawName) {
        if (current === null) out.set = { reason: 'no-set', current, recommended };
        else if (current === 'CardSet0' && c.level >= f.fightLevelBand)
          out.set = { reason: 'blunder-50', current, recommended };
        // A set for the other kind of activity (Toolbox's cardsAlert), or a set the list ranks below its
        // pick (D3's pusher rule), is swapped for the pick (FR-14). Any other set (Bosses, Dungeons,
        // W4+ sets) is past what M8 judges, so it is left alone.
        else {
          const kind = (raw: string) =>
            SKILL_SETS.includes(raw) ? 'skill' : FIGHT_SETS.includes(raw) ? 'fight' : null;
          const wrongKind =
            kind(current) !== null && kind(current) !== (act === 'FIGHTING' ? 'fight' : 'skill');
          const ranked = order.indexOf(current);
          const lower = ranked >= 0 && ranked > order.indexOf(recommended.rawName);
          const pusherSwap = recommended.rawName === 'CardSet4' && current === 'CardSet1';
          if (wrongKind || lower || pusherSwap) out.set = { reason: 'set-mismatch', current, recommended };
        }
      }
    }

    // FR-17: card presets.
    // FR-17: only when the active preset's cards fit another activity (passive cards fit none and are
    // FR-16's), so a fighter on its choppin cards switches, and a slot of passive cards is just refilled.
    const active = l.equipped.filter((r) => !isPassive(effect(r)));
    const fitsOther = CARD_ACTIVITIES.some((x) => x !== act && presetFits(state, active, x, k));
    if (c.level >= f.presetLevel && fitsOther && !presetFits(state, active, act, k)) {
      const unlocked = Math.min(f.maxPresets, f.basePresets + (gems?.[f.gemPresets] ?? 0));
      const sel = l.selectedPreset ?? 0;
      const indices = Array.from({ length: unlocked }, (_, i) => i).filter((i) => i !== sel);
      const sw = indices.find((i) => presetFits(state, l.presets[i] ?? [], act, k));
      if (sw !== undefined) out.preset = { kind: 'switch', n: sw, top: null };
      else {
        const empty = indices.find((i) => (l.presets[i] ?? []).length === 0);
        const top =
          [...fromList, ...others].filter((r) => !isPassive(effect(r)))[0] ??
          list.find((r) => (cards[r]?.amount ?? 0) > 0 && fits(effect(r), act, k)) ??
          null;
        if (empty !== undefined) out.preset = { kind: 'fill', n: empty, top };
      }
      // Switching the preset is the fix; don't also ask to fill the wrong cards' slots.
      if (out.preset) out.slots = null;
    }
    return out;
  });
}

/**
 * `cardList(class, stage)` for M4 (FR-18): the generated card Acquisition ids worth levelling for a
 * class, in order. M4 isn't built yet; it reads this when it ships. The list doesn't vary by Stage yet.
 */
export function cardList(kb: FactLookup, cls: string, _stage?: string | null): string[] {
  if (!classLine(kb, cls)) return [];
  return cardCandidates(kb, { class: cls }, 'FIGHTING').map((raw) => acquisitionId('cards', raw));
}

/** "Mining", "fighting". */
export const activityName = (a: CardActivity) =>
  a === 'FIGHTING' ? 'fighting' : human(a.charAt(0) + a.slice(1).toLowerCase());
