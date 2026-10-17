// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Visit Order (M10 §2): worst Verdict first, then most to spend (M6 `spendCount` plus M7
// `perCharacter.lines`), then M2's `visitHints`, then level (higher first) and index, so it is total.
import type { VerdictKind } from '../result';
import type { VisitHint } from './stubs/compare-goals';

const WORST: Record<VerdictKind, number> = { fix: 0, unknown: 1, ready: 2 };

export interface VisitCandidate {
  index: number;
  level: number;
  verdict: VerdictKind;
  /** M6 spendCount + M7 perCharacter lines. */
  toSpend: number;
}

export function visitOrder(
  candidates: readonly VisitCandidate[],
  hints: readonly VisitHint[] = [],
): number[] {
  const sorted = [...candidates].sort(
    (a, b) =>
      WORST[a.verdict] - WORST[b.verdict] || b.toSpend - a.toSpend || b.level - a.level || a.index - b.index,
  );
  const order = sorted.map((c) => c.index);
  const verdictOf = new Map(candidates.map((c) => [c.index, c.verdict]));
  // `pool-after`: visit this character after the ones it pools from, within its Verdict band only, so
  // a hint never puts a Ready character ahead of one that needs fixing.
  for (const h of hints) {
    if (h.kind !== 'pool-after' || !h.after?.length) continue;
    const at = order.indexOf(h.characterIndex);
    if (at < 0) continue;
    const band = verdictOf.get(h.characterIndex);
    const last = Math.max(
      ...h.after.map((i) => (verdictOf.get(i) === band ? order.indexOf(i) : -1)).filter((i) => i >= 0),
      -1,
    );
    if (last > at) {
      order.splice(at, 1);
      order.splice(last, 0, h.characterIndex);
    }
  }
  return order;
}
