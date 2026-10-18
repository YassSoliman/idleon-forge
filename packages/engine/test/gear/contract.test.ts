// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 TR-10 contract tests on the 11 public saves and both scrubbed saves (M12's weekly re-sync runs them,
// so a patch that moves recipe numbers fails loudly):
//  - V4: every Task Board recipe's raw AnvilCraftStatus agrees with Toolbox's taskUnlocks flag, and every
//    Merit Shop recipe with that world's "Smithing recipes" level;
//  - V9: a world's Unlocks column only has unlocks once its anvil tab is owned and enough recipes are in;
//  - the engine never crashes, and a W4+ account gets no Gear Plan Goal from W1–W3 rows.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { COLUMN_UNLOCKS, gearFacts } from '../../src/gear';
import { recipeState } from '../../src/gear/judge';
import { gearGoals, kb, run, scrubbedFile, workerState } from './helpers';

const PUBLIC = fileURLToPath(new URL('../../../account-state/fixtures/public/', import.meta.url));
const files = [
  ...readdirSync(PUBLIC)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => `${PUBLIC}${f}`),
  scrubbedFile('scrubbed-w2'),
  scrubbedFile('scrubbed-w3'),
];
const facts = (() => {
  const f = gearFacts(kb);
  if (!f) throw new Error('gear facts not shipped');
  return f;
})();

const unlocksOf = (file: string): number[][] => {
  const env = normalizeEnvelope(JSON.parse(readFileSync(file, 'utf8')));
  const p = parseSave(env, { now: Date.UTC(2026, 9, 17) });
  const list = (p.account as { taskUnlocks?: { taskUnlocksList?: { unlocked: number }[][] } }).taskUnlocks
    ?.taskUnlocksList;
  return (list ?? []).map((col) => col.map((u) => Number(u.unlocked) || 0));
};

describe.each(files.map((f) => [f.replace(/.*\//, ''), f]))('%s', (_, file) => {
  const state = workerState(file);
  const flags = unlocksOf(file);

  it('V4: Task Board recipes agree with the taskUnlocks flags; merit recipes with the merit level', () => {
    for (const [raw, r] of facts.recipes) {
      const s = recipeState(state, facts, raw);
      if (s === null) continue;
      const piece = facts.ladder.get(raw);
      if (r.from === 'task' && piece?.unlock) {
        const flag = flags[piece.unlock.world - 1]?.[piece.unlock.row];
        if (flag !== undefined)
          expect(s >= 0, `${raw} (W${piece.unlock.world} row ${piece.unlock.row})`).toBe(flag === 1);
      }
      if (r.from === 'merit' && r.world && r.purchase) {
        const slot = facts.meritSlot.get(r.world);
        const lv = state.account.merits
          ?.find((m) => m.world === r.world)
          ?.rows.find((x) => x.index === slot)?.level;
        if (lv !== undefined) expect(s >= 0, raw).toBe(lv >= r.purchase);
      }
    }
  });

  it('V9: a world column has unlocks only with its anvil tab owned and enough recipes unlocked', () => {
    const bought = flags.flat().reduce((n, x) => n + x, 0);
    const tabs = state.account.anvilTabsOwned ?? 0;
    for (const w of [2, 3]) {
      if (!(flags[w - 1] ?? []).some((x) => x === 1)) continue;
      expect(tabs, `W${w} tabs`).toBeGreaterThanOrEqual(w);
      expect(bought, `W${w} unlocks`).toBeGreaterThanOrEqual(COLUMN_UNLOCKS[w] ?? 0);
    }
  });

  it('the engine runs; a W4+ account gets no next piece or empty-slot craft from the W1–W3 Gear Plan', () => {
    const r = run(state);
    expect(r.gear).toBeTruthy();
    expect(r.diagnostics.failedDetectors.filter((f) => f.detectorId.startsWith('gear'))).toEqual([]);
    if ((state.account.currentWorld ?? 0) >= 4) {
      const ids = gearGoals(r).map((g) => g.goal.id);
      expect(ids.filter((id) => id === 'gear.check.next-piece')).toEqual([]);
      expect(r.gear?.characters.every((c) => c.note === 'The Gear Plan covers Worlds 1–3')).toBe(true);
    }
  }, 120_000);
});
