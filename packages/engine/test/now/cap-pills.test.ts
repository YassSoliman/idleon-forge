// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 Final rulings R-PILL-1 (owner, 2026-10-17): a full anvil, a full worship charge and traps that
// finish early are compact cap pills on the character's row and in its Focus header, never a blocker,
// a Fix card or a Verdict input. Over the real engine on the scrubbed W3-early save, and over a
// synthetic view fixture for the row cap and Skip today.
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src';
import { createAfkSafetyModule } from '../../src/afk';
import type { EngineInput } from '../../src/core/module';
import { buildNowView, DEFAULT_UI, ROW_CAP_PILLS } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { renderNowText } from '../../src/now/render-text';
import type { InfoLine } from '../../src/result';
import { kb, registry, W2, W3 } from '../afk/helpers';
import { fixture, skipNow, view } from './helpers';

/** The W3-early golden's clock: 8.5 h after its cloud save, so every anvil product is full now. */
const W3_LATE = Date.parse('2026-10-17T16:12:33.140Z');

const input = (state = W3(), now = W3_LATE): EngineInput => ({
  state,
  history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
  knowledge: { version: 'test', coverage: () => [] },
  now,
  options: { expectedReturnSeconds: 8 * 3600 },
});

describe('R-PILL-1 on the W3-early save with every anvil full', () => {
  const module = createAfkSafetyModule({ kb, registry });
  const r = runEngine(input(), [module]);
  // M9's wrong-preset blocker (a real blocker) fires on two rows; skip it to see what the pills do alone.
  const preset = r.characters.flatMap((c) => c.verdict.blockerKeys);
  const skips = Object.fromEntries(
    preset.map((k) => [k, { midnightAt: W3_LATE + 3600_000, sessionStartedAt: null }]),
  );
  const ui = { ...DEFAULT_UI, now: W3_LATE, lastCloudSave: W3_LATE - 60_000 };
  const v = buildNowView(r, { ...EMPTY_PREFS, skips }, ui);

  it('a full anvil gives a pill, not a blocker: no Goal, no blocker key', () => {
    for (const c of r.characters) {
      expect(c.verdict.blockerKeys.filter((k) => k.startsWith('anvil.'))).toEqual([]);
      expect(c.goals.map((g) => g.id)).not.toContain('anvil.check.caps-before-return');
      const caps = (c.info ?? []).filter((l) => l.kind === 'cap');
      expect(caps.map((l) => l.label)).toContain('Anvil full · collect');
    }
  });

  it('the Verdict stays Ready on every row whose only problem is a full anvil', () => {
    expect(preset.every((k) => k.startsWith('talent-presets.'))).toBe(true);
    for (const c of r.characters)
      expect(c.verdict.kind).toBe(c.verdict.blockerKeys.length > 0 ? 'fix' : 'ready');
    expect(r.characters.filter((c) => c.verdict.kind === 'ready')).toHaveLength(4);
  });

  it('"safe to log off" still holds once the real blockers are dealt with', () => {
    expect(v.allSet?.text).toBe(`All set: safe to log off (${preset.length} skipped)`);
    expect(v.progress.label).toBe('safe to log off');
  });

  it('no row shows a full-anvil Fix card; every row carries its pills', () => {
    for (const row of v.roster) {
      expect(row.summary).not.toMatch(/from the anvil/);
      expect(row.caps.map((c) => c.label)).toContain('Anvil full · collect');
    }
    const text = renderNowText(v);
    expect(text).not.toMatch(/Fix · Anvil/);
    expect(text).toMatch(/· \[Anvil full · collect\]/);
  });

  it('Focus shows the pills in its header, with the refill time, Why and Source; not as blockers', () => {
    const i = r.characters.find((c) => c.verdict.kind === 'ready')?.index ?? 0;
    const f = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: W3_LATE, focus: i }).focus;
    expect(f?.blockers).toEqual([]);
    const anvil = f?.caps.find((c) => c.entryId === 'anvil.check.caps-before-return');
    expect(anvil?.text).toMatch(/^Collect .+ from the anvil$/);
    expect(anvil?.why).toMatch(/^Time to cap: now; it refills in .+ after you collect\./);
    expect(anvil?.why).toMatch(/Anvil production stops at capacity/);
    expect(anvil?.source?.text).toBe('IdleOn Wiki: Smithing, anvil production');
    expect(anvil?.fullNow).toBe(true);
    expect(f?.info.some((l) => l.key.startsWith('anvil.check.caps-before-return'))).toBe(false);
  });

  it('W2-late: the Barbarian Lv 60 stays Fix for its food only, with its full anvil as a pill', () => {
    const w2 = runEngine(input(W2(), W2().asOf), [module]);
    expect(w2.characters[0]?.verdict.blockerKeys).toEqual(['afk.check.dies-fixable-by-food@c0']);
    expect((w2.characters[0]?.info ?? []).filter((l) => l.kind === 'cap').map((l) => l.label)).toEqual([
      'Anvil full · collect',
    ]);
  });
});

describe('R-PILL-1 in the view', () => {
  const cap = (n: number, at: number | null = null): InfoLine => ({
    key: `test.check.cap-${n}@c0`,
    text: `Collect thing ${n}`,
    sources: [
      {
        label: 'IdleOn Wiki: Test',
        url: 'https://idleon.wiki/wiki/Test',
        tier: 2,
        verifiedOn: '2026-10-17',
        gameVersion: '2.3.540',
      },
    ],
    kind: 'cap',
    label: `Cap ${n}`,
    why: 'Why it caps',
    at,
  });
  const withCaps = (count: number) => {
    const r = fixture('all-set');
    const c = r.characters[0];
    if (c) c.info = [...Array.from({ length: count }, (_, n) => cap(n + 1)), ...(c.info ?? [])];
    return r;
  };

  it(`shows at most ${ROW_CAP_PILLS} pills on a row, then "+n", and names them all for screen readers`, () => {
    const r = withCaps(5);
    const row = view(r).roster.find((x) => x.index === r.characters[0]?.index);
    expect(row?.caps.map((c) => c.label)).toEqual(['Cap 1', 'Cap 2', 'Cap 3']);
    expect(row?.moreCaps).toBe(2);
    for (const n of [1, 2, 3, 4, 5]) expect(row?.accessibleName).toContain(`Cap ${n}`);
    expect(renderNowText(view(r))).toContain('[Cap 1] [Cap 2] [Cap 3] [+2]');
  });

  it('pills never change the Verdict or All set', () => {
    const before = view(fixture('all-set'));
    const after = view(withCaps(4));
    expect(after.roster.map((x) => x.pill)).toEqual(before.roster.map((x) => x.pill));
    expect(after.allSet).toEqual(before.allSet);
    expect(after.progress.label).toBe(before.progress.label);
  });

  it('Skip today hides a pill for today, and its key joins the undo list in Focus', () => {
    const r = withCaps(2);
    const i = r.characters[0]?.index ?? 0;
    const v = view(r, { focus: i }, { skips: skipNow(r, 'test.check.cap-1@c0') });
    expect(v.focus?.caps.map((c) => c.label)).toEqual(['Cap 2']);
    expect(v.focus?.skippedKeys).toContain('test.check.cap-1@c0');
    expect(v.roster.find((x) => x.index === i)?.caps.map((c) => c.label)).toEqual(['Cap 2']);
  });

  it('a row whose only items are pills shows just the pills, not "Nothing to do here"', () => {
    const r = withCaps(1);
    const c = r.characters[0];
    if (c) c.goals = [];
    const row = view(r).roster.find((x) => x.index === c?.index);
    expect(row?.summary).toBe('');
    expect(row?.caps).toHaveLength(1);
  });
});
