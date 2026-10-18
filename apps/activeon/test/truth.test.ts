// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 truth checks through the real worker: on every public and scrubbed save the raw readers agree
// with the Account State; the W2-late save's "no points waiting" lines that the save contradicts are
// held back; and a deliberately corrupted Account State (wrong preset points) is caught and only its
// advice is replaced. Class and slot only, never a name.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { CANT_BE_SURE } from '@idleon-forge/truth';
import { describe, expect, it } from 'vitest';
import { handleRequest, withTruth } from '../src/worker/handle-request';
import type { ParseResponse } from '../src/worker/protocol';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const PUBLIC = path.join(ROOT, 'packages/account-state/fixtures/public');
const SCRUBBED = path.join(ROOT, 'fixtures/scrubbed');

const ENGINE = {
  expectedReturnSeconds: 8 * 3600,
  sessionStartedAt: null,
  learnedExpectedReturnSeconds: null,
  knowledgeVersion: 'k',
};

function parse(file: string, opts: { engine?: boolean; detail?: boolean } = {}) {
  const text = readFileSync(file, 'utf8');
  const data = (JSON.parse(text) as { data: Record<string, unknown> }).data;
  const ta = data.TimeAway;
  const savedAt = Math.round(
    ((typeof ta === 'string' ? JSON.parse(ta) : ta) as { GlobalTime: number }).GlobalTime * 1000,
  );
  const res = handleRequest({
    type: 'parse',
    id: 1,
    now: savedAt + 60_000,
    input: { kind: 'text', text },
    ...(opts.engine ? { engine: ENGINE } : {}),
    ...(opts.detail ? { truthDetail: true } : {}),
  });
  if (!res.ok) throw new Error(`${res.kind}: ${res.message}`);
  return { res, envelope: JSON.parse(text) as { data: Record<string, unknown> } };
}

const resultOf = (res: Extract<ParseResponse, { ok: true }>): EngineResult => {
  if (!res.result || 'error' in res.result) throw new Error('expected an engine result');
  return res.result;
};

describe('M22 raw readers agree with the Account State on every public and scrubbed save', () => {
  const files = [
    ...[
      'toolbox-raw',
      'first',
      'second',
      'third',
      'fourth',
      'fresh',
      'highend',
      'latest',
      'latest-2026-08',
    ].map((n) => path.join(PUBLIC, `${n}.json`)),
    path.join(SCRUBBED, 'scrubbed-w2.json'),
    path.join(SCRUBBED, 'scrubbed-w3.json'),
  ];
  it.each(files.map((f) => [path.basename(f), f]))('%s', (_name, file) => {
    const { res } = parse(file, { detail: true });
    const truth = res.truth;
    expect(truth?.error).toBeNull();
    expect(truth?.raw?.characters.length).toBe(res.state.characters.length);
    expect(truth?.violations.filter((v) => v.rule === 'raw-matches-state')).toEqual([]);
    // The table really compares: talent levels, levels and coins have both a raw and a state value.
    const both = (re: RegExp) =>
      truth?.facts.filter((f) => re.test(f.key) && f.values.raw != null && f.values.state != null).length ??
      0;
    expect(both(/\.talent\.\d+$/)).toBeGreaterThan(0);
    expect(both(/^c\d+\.level$/)).toBe(res.state.characters.length);
  });
});

describe('M22 on the W2-late save (the scrubbed copy of a real account)', () => {
  const { res } = parse(path.join(SCRUBBED, 'scrubbed-w2.json'), { engine: true, detail: true });
  const result = resultOf(res);

  // Before #120 this save showed "No points waiting" on two tab-3 lines (the W2-late Shaman's and
  // Bowman's) while the save has a point left in each; since #120 they read "No unspent points known
  // here", which is reported but not held back. The checks are invariants, so they hold either way.
  it('leaves no "No points waiting" line where the save has points left, and holds back only those', () => {
    const v = res.truth?.violations.filter((x) => x.rule === 'no-points-vs-unspent') ?? [];
    const raw = res.truth?.raw;
    for (const b of result.builds ?? [])
      for (const p of b.presets)
        for (const n of p.next) {
          if (!/no points waiting/i.test(n.text)) continue;
          const tab = raw?.characters
            .find((c) => c.index === b.index)
            ?.presets.find((x) => x.slot === p.slot)
            ?.tabs.find((t) => t.tab === n.tab);
          expect(tab?.unspentAtLeast ?? 0).toBe(0);
        }
    for (const x of v) {
      const line = result.builds
        ?.find((b) => b.index === x.scope.character)
        ?.presets.find((p) => p.slot === x.scope.slot)
        ?.next.find((n) => n.key === x.scope.itemKey);
      // A false "No points waiting" is held back; the hedged "No unspent points known" (#120) stays.
      if (x.hold === false) expect(line?.text).toMatch(/no unspent points known/i);
      else expect(line?.text).toBe(CANT_BE_SURE);
    }
    const held = res.truth?.suppressed.filter((s) => s.kind === 'build-next') ?? [];
    expect(held).toHaveLength(v.filter((x) => x.hold !== false).length);
    // Every other line still reads as the engine wrote it.
    const others = (result.builds ?? [])
      .flatMap((b) => b.presets.flatMap((p) => p.next))
      .filter((n) => n.text !== CANT_BE_SURE);
    expect(others.length).toBeGreaterThan(10);
  });

  it('sends only the short report unless the debug hook asks for the facts', () => {
    const plain = parse(path.join(SCRUBBED, 'scrubbed-w2.json'), { engine: true });
    expect(plain.res.truth?.rules.length).toBeGreaterThan(0);
    expect(plain.res.truth?.facts).toEqual([]);
    expect(plain.res.truth?.raw).toBeNull();
    expect(res.truth?.facts.length).toBeGreaterThan(100);
  });
});

describe('M22 a deliberately corrupted Account State', () => {
  const { res, envelope } = parse(path.join(SCRUBBED, 'scrubbed-w2.json'), { engine: true });
  const result = resultOf(res);

  it('wrong preset points trigger the violation and suppress that preset’s items', () => {
    const state = structuredClone(res.state) as AccountState;
    const c = state.characters.find((x) => x.index === 1);
    const talents = c?.talents;
    if (!talents?.other) throw new Error('expected the Squire to have a second preset');
    // The other preset (game slot 1 - selected) gets 7 points the save doesn't have in tab 2.
    const t2 = talents.other.tabs.find((t) => t.tab === 2);
    const first = t2?.talents[0];
    if (!first) throw new Error('expected tab 2 talents');
    first.base += 7;
    const otherSlot = 1 - talents.selectedPreset;
    const out = withTruth(envelope as never, state, result);
    const v = out.truth.violations.filter((x) => x.rule === 'raw-matches-state');
    expect(v.map((x) => x.key).sort()).toEqual(
      [`c1.p${otherSlot}.t2.spent`, `c1.p${otherSlot}.talent.${first.id}`].sort(),
    );
    expect(v.every((x) => x.scope.character === 1 && x.scope.slot === otherSlot)).toBe(true);
    const checked = out.result as EngineResult;
    const preset = checked.builds?.find((b) => b.index === 1)?.presets.find((p) => p.slot === otherSlot);
    const tab2 = preset?.next.filter((n) => n.tab === 2) ?? [];
    expect(tab2.every((n) => n.text === CANT_BE_SURE)).toBe(true);
    // Something of that character's was held back, and nothing of anyone else's by this rule.
    const held = out.truth.suppressed.filter((x) => x.rules.includes('raw-matches-state'));
    expect(held.length).toBeGreaterThan(0);
    expect(held.every((x) => x.character === 1)).toBe(true);
    // The other characters' Build lines are untouched.
    const before = result.builds?.find((b) => b.index === 0);
    const after = checked.builds?.find((b) => b.index === 0);
    expect(after).toEqual(before);
  });

  it('a clean Account State suppresses nothing new', () => {
    const out = withTruth(envelope as never, res.state, result);
    expect(out.truth.violations.filter((x) => x.rule === 'raw-matches-state')).toEqual([]);
  });
});
