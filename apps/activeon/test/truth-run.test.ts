// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 Layer 2, the headless half of a truth run: the whole worker (parser, engine, truth checks) over
// one raw save, written to a JSON file for `scripts/truth/run.mjs` to diff against the page. Local
// only: it runs when TRUTH_SAVE names a save (e.g. fixtures/private/live-<date>.raw.json) and is
// skipped otherwise, so CI never sees a private save.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/worker/handle-request';

const SAVE = process.env.TRUTH_SAVE;
const OUT = process.env.TRUTH_OUT;

describe.skipIf(!SAVE)('truth run (headless, local only)', () => {
  it('parses the save, runs the engine and the truth checks, and writes the report', () => {
    const text = readFileSync(SAVE as string, 'utf8');
    const raw = JSON.parse(text) as { data: Record<string, unknown> };
    const ta = raw.data.TimeAway;
    const savedAt = Math.round(
      ((typeof ta === 'string' ? JSON.parse(ta) : ta) as { GlobalTime: number }).GlobalTime * 1000,
    );
    // A "fresh" run, like the page after a time-shifted paste: the save's own time + 60 s.
    const now = Number(process.env.TRUTH_NOW) || savedAt + 60_000;
    const res = handleRequest({
      type: 'parse',
      id: 1,
      now,
      input: { kind: 'text', text },
      engine: {
        expectedReturnSeconds: 8 * 3600,
        sessionStartedAt: null,
        learnedExpectedReturnSeconds: null,
        knowledgeVersion: 'truth-run',
      },
      truthDetail: true,
    });
    if (!res.ok) throw new Error(`${res.kind}: ${res.message}`);
    expect(res.truth?.error ?? null).toBeNull();
    const result = res.result && !('error' in res.result) ? res.result : null;
    // Class and slot only: no name leaves this file.
    const out = {
      save: path.basename(SAVE as string),
      now,
      truth: res.truth,
      builds: result?.builds ?? [],
      characters: (result?.characters ?? []).map((c) => ({
        index: c.index,
        classId: c.classId,
        level: c.level,
      })),
    };
    const file = OUT ?? path.resolve('truth-headless.json');
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(out, null, 1));
  });
});
