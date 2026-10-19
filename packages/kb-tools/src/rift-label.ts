// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Rift label lint (M26 FR-4): player text never carries a bare number after "Rift". The save
// stores `Rift[0]` and the game shows one more, so a typed number is wrong half the time; text names
// the level through a slot the engine fills with `riftLabel()` ("Rift {rift}"). Runs over live
// entries, drafts and fact tables; Sources and notes are not player text.
import type { Issue } from './issues';
import type { KbSource, Located } from './load';

const BARE = /\bRift\s+#?\d/i;
const NOT_PLAYER_TEXT = new Set(['id', 'sources', 'notes', 'note', 'url', 'dossier', 'detector', 'progress']);

function hits(
  v: unknown,
  where: (string | number)[],
  out: Array<{ where: (string | number)[]; text: string }>,
) {
  if (typeof v === 'string') {
    if (BARE.test(v)) out.push({ where, text: v });
  } else if (Array.isArray(v)) {
    for (const [i, x] of v.entries()) hits(x, [...where, i], out);
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!NOT_PLAYER_TEXT.has(k)) hits(x, [...where, k], out);
  }
  return out;
}

export function riftLabelIssues(src: KbSource): Issue[] {
  const all: Located<unknown>[] = [...src.authored, ...src.drafts, ...src.facts];
  return all.flatMap((e) =>
    hits(e.value, [], []).map((h) => ({
      level: 'error' as const,
      file: e.file,
      line: e.lineOf(h.where),
      id: (e.value as { id?: string }).id,
      message: `${h.where.join('.')}: a bare number after "Rift" ("${h.text.slice(0, 60)}"); write "Rift {rift}" and let riftLabel() fill it (M26 FR-4)`,
      code: 'rift-label',
    })),
  );
}
