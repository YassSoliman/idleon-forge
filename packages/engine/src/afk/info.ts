// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3's quiet per-character info lines (#70 A1, M3 FR-18 Final rulings): "Anvil full in 6 h at current
// speed". They are not Goals or Next Actions and never touch a Verdict, first fill or the blocker rule;
// they are the firing findings of the info entries below, rendered with the entry's text. A Detector
// that throws or says unknown just drops its line.
import type { AccountState } from '@idleon-forge/account-state';
import {
  type CheckFinding,
  type Entry,
  type HistoryEntry,
  makeContext,
  render,
  runDetector,
} from '@idleon-forge/knowledge';
import type { InfoLine, TimelineBar } from '../result';
import type { AfkSafetyInput } from './evaluate';
import { characterBuiltins, sourceRef, timelineWordsOf } from './evaluate';

/** The info entries M3 renders as `CharacterResult.info`; no other module runs them. */
export const AFK_INFO_ENTRIES: readonly string[] = ['anvil.check.fill-time'];

type CheckEntry = Extract<Entry, { type: 'check' }>;

export interface AfkInfoInput {
  state: AccountState;
  history: readonly HistoryEntry[];
  now: number;
  expectedReturnMs: number;
  kb: AfkSafetyInput['kb'];
  registry: AfkSafetyInput['registry'];
}

/** Info lines by character index, in entry-id order. */
export function afkInfoLines(input: AfkInfoInput): Map<number, InfoLine[]> {
  return afkInfo(input).lines;
}

/**
 * The info lines and their Timeline bars (M17 TR-4: "Anvil full in 6 h at current speed" is a plain
 * bar at its time, never outlined, effect 'info').
 */
export function afkInfo(input: AfkInfoInput): { lines: Map<number, InfoLine[]>; bars: TimelineBar[] } {
  const { state, kb, registry } = input;
  const ctx = makeContext(state, kb, {
    now: input.now,
    history: input.history,
    expectedReturnMs: input.expectedReturnMs,
  });
  const out = new Map<number, InfoLine[]>();
  const bars: TimelineBar[] = [];
  for (const id of [...AFK_INFO_ENTRIES].sort()) {
    const entry = kb.entries[id];
    if (entry?.type !== 'check') continue;
    const detector = registry[(entry as CheckEntry).detector.id];
    if (!detector) continue;
    const run = runDetector(detector, ctx, entry.detector.params);
    if (!run.ok) continue;
    for (const f of run.findings as readonly CheckFinding[]) {
      if (f.result !== 'fires' || f.subject.kind !== 'character') continue;
      const subject = `c${f.subject.index}` as const;
      let text: string;
      try {
        text = render(entry.text, f.slots, characterBuiltins(state, subject), entry.values);
      } catch {
        continue;
      }
      const line: InfoLine = {
        key: `${entry.id}@${subject}`,
        text,
        sources: entry.sources.map(sourceRef),
      };
      out.set(f.subject.index, [...(out.get(f.subject.index) ?? []), line]);
      const words = timelineWordsOf(entry as CheckEntry);
      if (words && f.at !== undefined)
        bars.push({
          barId: line.key,
          key: line.key,
          entryId: entry.id,
          system: entry.system,
          subject,
          ...words,
          at: f.at,
          untimed: false,
          effect: 'info',
          fixHolds: false,
        });
    }
  }
  return { lines: out, bars };
}
