// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards tab's view model (M8 "Cards view", owner request 2026-10-18): M8's Cards view with each
// character's name, class, level and deep link, and the player-facing Source picked (#74). The UI
// renders it as is. Pure; UI-thread safe.
import type { EngineResult } from '../result';
import { sourceView } from './build-now-view';
import type { CardsNowView } from './view';

/** The Cards tab's deep link for a character: a bare `#cards-<index>` anchor (character-tabs.ts). */
export const cardsHref = (index: number) => `#cards-${index}`;

/** The Cards view in save order, or null when the result carries none. */
export function cardsView(result: EngineResult): CardsNowView | null {
  const v = result.cards ?? null;
  if (!v) return null;
  return {
    characters: v.characters.map((c) => {
      const r = result.characters.find((x) => x.index === c.index);
      return {
        ...c,
        name: r?.name ?? `Character ${c.index + 1}`,
        classLabel: r?.classLabel ?? c.who,
        level: r?.level ?? 0,
        href: cardsHref(c.index),
      };
    }),
    account: v.account,
    caveats: v.caveats,
    source: v.sources.length ? sourceView(v.sources, false, 'cards.fact.drops') : null,
  };
}
