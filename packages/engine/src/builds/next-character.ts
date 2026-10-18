// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The "Next character" card (M21 owner request, 2026-10-18, area C): which class the next character
// slot should take (M2 FR-8/FR-9, `analyzeRoster().nextCharacter`) and when that slot opens (M15 F3's
// family-level gap and pace, for the character slot itself, not only when it is the nearest family
// unlock). Every word comes from the Knowledge Base entries that already carry them. Pure.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import { type Entry, render } from '@idleon-forge/knowledge';
import type { EngineHistory } from '../core/module';
import { familyEta, familyPace } from '../metapath/family';
import { familyPoints } from '../metapath/module';
import { analyzeRoster } from '../metapath/roster';
import { detectStage } from '../metapath/stage';
import type { FactLookup } from '../metapath/types';
import type { NextCharacterCard } from '../result';

const NEXT_GOAL = 'metapath.goal.next-character';
const SIGNS_GOAL = 'star-signs.goal.signs';

const value = (e: Entry | undefined, key: string): string | null => {
  const v = e?.values?.[key];
  return typeof v === 'string' ? v : null;
};

/** The card, or null when no slot gate remains or the roster can't be read. */
export function nextCharacterCard(
  state: AccountState,
  facts: FactLookup,
  history: EngineHistory,
  now: number,
  entryOf: (id: string) => Entry | undefined = (id) => facts.get(id) as Entry | undefined,
): NextCharacterCard | null {
  const stage = detectStage(state, facts);
  if (stage.id === null || stage.coverage === 'beyond') return null;
  const n = analyzeRoster(state, facts, stage.id).nextCharacter;
  if (!n) return null;
  const goal = entryOf(NEXT_GOAL);
  const signs = entryOf(SIGNS_GOAL);
  const journeyman = n.line === 'Journeyman';
  const steps: string[] = [];
  const sign = value(signs, 'next-character');
  if (sign) steps.push(sign.replace(/^Next character: /, '').replace(/^./, (c) => c.toUpperCase()));
  const plan = value(goal, journeyman ? 'journeyman' : 'next');
  if (plan) steps.push(render(plan, { line: n.line, baseClass: n.baseClass }));
  const missing = state.characters.length > 0;
  const why = journeyman
    ? 'One of each subclass is made; the Journeyman line is the one left'
    : `No one plays a ${humanize(n.line)} yet. ${goal?.why ?? ''}`.trim();
  let eta: NextCharacterCard['eta'] = null;
  if (!n.slotOpen && n.gap !== null && n.familyLevel !== null) {
    const current = {
      at: state.account.lastCloudSave ?? now,
      familyLevel: n.familyLevel,
      characters: state.characters.length + state.diagnostics.unreadableCharacters.length,
    };
    eta = familyEta(n.gap, familyPace(familyPoints(history), current, now));
  }
  return {
    slotNumber: n.slotNumber,
    baseClass: humanize(n.baseClass),
    line: humanize(n.line),
    slotOpen: n.slotOpen,
    opensAt: n.slotOpen ? null : n.opensAt,
    gap: n.slotOpen ? null : n.gap,
    eta,
    why: missing ? why : (goal?.why ?? why),
    steps,
  };
}
