// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-N3: a Check whose Next Action shows on 3 or more characters of any golden fixture carries a
// `groupText`, the "Same job on N characters" card's sentence said once. Grouping is by entry id, not
// the rendered words (the trap line reads "6 finished traps" on some rows and "7" on others), so the
// card needs its own sentence. `kb golden` runs this over the fixtures it renders (it has the engine);
// a missing `groupText` fails the run, like a golden that differs.
import type { CompiledKnowledge } from '@idleon-forge/knowledge';

/** One entry's repeats on one fixture (the engine's `repeatedJobs`). */
export interface RepeatSighting {
  fixtureId: string;
  entryId: string;
  characters: number;
}

export interface GroupTextProblem {
  entryId: string;
  /** "latest (8 characters), multikill-pin (8 characters)". */
  where: string;
  message: string;
}

/** The repeated entries with no `groupText`, by entry id. Entries that aren't in the bundle are skipped. */
export function groupTextProblems(
  kb: Pick<CompiledKnowledge, 'entries'>,
  sightings: readonly RepeatSighting[],
): GroupTextProblem[] {
  const by = new Map<string, RepeatSighting[]>();
  for (const s of sightings) by.set(s.entryId, [...(by.get(s.entryId) ?? []), s]);
  const out: GroupTextProblem[] = [];
  for (const [entryId, seen] of [...by].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const entry = kb.entries[entryId] as { type?: string; groupText?: string } | undefined;
    if (!entry || entry.type !== 'check' || entry.groupText) continue;
    out.push({
      entryId,
      where: seen.map((s) => `${s.fixtureId} (${s.characters} characters)`).join(', '),
      message: 'shows on 3 or more characters; add a groupText (the grouped card says it once, FR-N3)',
    });
  }
  return out;
}
