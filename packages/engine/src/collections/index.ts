// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections (docs/specs/M8-collections.md): stamps you can get now or work toward, cards, card
// sets and card presets, the Obol Altar and stored obols. Worker-side only, like the rest of the engine.
import type { AccountState } from '@idleon-forge/account-state';
import { classTree } from '../metapath/knowledge';
import { cardList, classLine, evaluateCards } from './cards';
import { type FactLookup, M8 } from './knowledge';
import { evaluateObols } from './obols';
import { evaluateStamps } from './stamps';
import type { CollectionsResult } from './types';

export {
  activityName,
  CARD_ACTIVITIES,
  type CardActivity,
  type CardPreferences,
  type CardsAdvice,
  cardCandidates,
  cardLevel,
  cardList,
  classLine,
  evaluateCards,
  fits,
  isPassive,
  presetFits,
  pusherIndex,
  rankOwnedCards,
  recommendedSet,
  setBonus,
} from './cards';
export {
  BASE_MAX_LEVEL,
  buildCardsView,
  CARD_DROPS,
  CARD_RATE_MAPS,
  CARDS_CAVEATS,
  type CardDropRow,
  cardLeavesForRates,
  effectText,
  hoursText,
  killsFor,
  nextThreshold,
  oneIn,
  QUICK_HOURS,
  UNOWNED_MULTIPLIER,
} from './cards-view';
export type * from './cards-view-types';
export {
  COLLECTIONS_DETECTORS,
  cardPresetDetector,
  cardSetDetector,
  cardSlotsDetector,
  type M8Finding,
  obolStateDetector,
  stampStatusDetector,
} from './detectors';
export { CollectionsKnowledgeError, type FactLookup, M8, stampEntries } from './knowledge';
export {
  COLLECTIONS_SYSTEMS,
  type CollectionsKnowledge,
  type CollectionsModuleDeps,
  createCardsViewModule,
  createCollectionsModule,
} from './module';
export { evaluateObols, type ObolsEval } from './obols';
export { holdings, who } from './routes';
export { evaluateStamps, type QuestOpportunity, type StampsEval } from './stamps';
export type * from './types';

/**
 * The internal collections result (TR-7) for one save: stamp statuses with counts and M7's Lv 0 list,
 * per-character card advice, the card lists M4 reads, and the obol state.
 * M4 isn't built yet: it reads `cardLists` (and `cardList(kb, class, stage)`) when it ships.
 */
export function collectionsResult(
  state: AccountState,
  kb: FactLookup,
  stage: string | null = null,
): CollectionsResult {
  const s = evaluateStamps(state, kb);
  const cards = evaluateCards(state, kb);
  const o = evaluateObols(state, kb);
  const tree = classTree(kb);
  return {
    stamps: {
      owned: s.owned,
      obtainable: s.obtainable,
      byStatus: s.byStatus,
      items: s.items,
      lv0ForSpendPlan: s.lv0,
    },
    cards: {
      perCharacter: cards.map((c) => ({ index: c.index, slots: c.slots, set: c.set, preset: c.preset })),
    },
    cardLists: state.characters.flatMap((c) => {
      const line = classLine(kb, c.class);
      if (!line || cardList(kb, c.class, stage).length === 0) return [];
      const classIndex = c.classIndex ?? tree.byName.get(c.class)?.classIndex ?? -1;
      return [{ classIndex, stage: stage ?? 'all', entryId: `${M8.cardPreferences}#${line}` }];
    }),
    obols: {
      altar: o.altar
        ? {
            routeIndex: 0,
            kind: o.altar.how === 'buy' ? 'buyThenQuest' : 'quest',
            status: o.altar.how === 'missing' ? 'toward' : 'now',
            character: o.altar.character,
            requirements: [],
            etaSeconds: null,
            lookAhead: null,
          }
        : null,
      altarDone: o.altarDone,
      placements: o.placements.map((p) => ({
        from: 'storage' as const,
        to: p.to === 'family' ? ('family' as const) : (`c${p.to}` as const),
        shape: p.shape,
        count: p.count,
      })),
      nextFamilySlot: o.nextFamilySlot
        ? { levelReq: o.nextFamilySlot.levelReq, shape: o.nextFamilySlot.shape }
        : null,
    },
  };
}
