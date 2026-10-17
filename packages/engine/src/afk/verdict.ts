// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Verdict composer (M3 FR-9, D4): AFK safety from M3 plus Purpose status from M4.
//
// | Safety      | Purpose status                     | Verdict             | unknownReason |
// | unsafe      | any                                | Fix before you leave | -            |
// | unknown     | any                                | Unknown             | cannot-tell   |
// | not-covered | any                                | Unknown             | not-covered   |
// | safe        | serving                            | Ready               | -             |
// | safe        | not-covered                        | Unknown             | not-covered   |
// | safe        | exhausted, none, no-activity       | Unknown             | no-purpose    |
// | safe        | cannot-tell                        | Unknown             | cannot-tell   |
// Until M4 ships, `safe` gives Ready (D4) and the row's Focus says "Purpose not checked yet" (M10).
import type { PurposeStatus, Safety, Verdict } from './types';

const unknown = (reason: NonNullable<Verdict['unknownReason']>): Verdict => ({
  kind: 'unknown',
  blockerKeys: [],
  unknownReason: reason,
  suggestion: null,
});

export function composeVerdict(
  safety: Safety,
  purpose: PurposeStatus | 'not-implemented',
  blockerKeys: readonly string[] = [],
): Verdict {
  if (safety === 'unsafe')
    return { kind: 'fix', blockerKeys: [...blockerKeys], unknownReason: null, suggestion: null };
  if (safety === 'unknown') return unknown('cannot-tell');
  if (safety === 'not-covered') return unknown('not-covered');
  switch (purpose) {
    case 'serving':
    case 'not-implemented':
      return { kind: 'ready', blockerKeys: [], unknownReason: null, suggestion: null };
    case 'not-covered':
      return unknown('not-covered');
    case 'cannot-tell':
      return unknown('cannot-tell');
    default:
      return unknown('no-purpose');
  }
}
