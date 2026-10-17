// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 TR-2: the AFK facts, built from Toolbox's own functions. The scrubbed W2-late save (CI) carries
// the spec's acceptance numbers: a Barbarian Lv 60 at 78% survivability (53% with no food) whose anvil
// is full, Water at cap and an Arcade claimed 96 h ago against a 48 h cap.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, AFK_HORIZON_MS, isKnown, toAccountState } from '../src';
import { listJson, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));
const scrubbed = (id: string) => {
  const raw = JSON.parse(readFileSync(`${SCRUBBED}${id}.json`, 'utf8'));
  const meta = JSON.parse(readFileSync(`${SCRUBBED}${id}.meta.json`, 'utf8')) as { now: string };
  return { raw, now: Date.parse(meta.now) };
};
const toolbox = { calls: toolboxCalls, withFrozenClock };

function stateOf(raw: unknown, now: number, withCalls = true): AccountState {
  const envelope = normalizeEnvelope(raw);
  return toAccountState(parseSave(envelope, { now }), envelope, withCalls ? { toolbox } : {});
}

describe('AFK facts on the scrubbed W2-late save', () => {
  const { raw, now } = scrubbed('scrubbed-w2');
  const state = stateOf(raw, now);
  const barbarian = state.characters.find((c) => c.class === 'Barbarian' && c.level === 60);

  it('reads the Barbarian Lv 60 survivability with and without food, and the foods that fix it', () => {
    const f = barbarian?.afk?.fighting;
    expect(f?.survivability).toBe(78);
    expect(f?.survivabilityNoFood).toBe(53);
    expect(f?.fixingFoods.length).toBe(4);
    expect(Math.max(...(f?.fixingFoods ?? []).map((x) => x.amount))).toBe(105);
    expect(barbarian?.afk?.food.some((x) => x.kind === 'health')).toBe(false);
    expect(barbarian?.afk?.blankFoodSlot).toBe(true);
  });

  it('reads the full anvil product and how long it takes to refill from empty', () => {
    const [p] = barbarian?.afk?.anvil ?? [];
    expect(p?.amount).toBe(p?.capacity);
    expect(p?.capAt).toBeLessThanOrEqual(state.asOf);
    expect((p?.fromEmptyMs ?? 0) / 3_600_000).toBeCloseTo(2.76, 1);
  });

  it('reads the Arcade claim, Water at cap and storage room', () => {
    const afk = state.account.afk;
    expect(afk?.arcade?.maxClaimMs).toBe(48 * 3_600_000);
    expect((state.asOf - (afk?.arcade?.lastClaimAt ?? 0)) / 3_600_000).toBeCloseTo(96.3, 0);
    expect(afk?.liquids?.[0]).toEqual({ index: 0, current: 32, max: 32 });
    expect(afk?.salts).toEqual([]);
    expect(afk?.projectedAt).toBe(state.asOf);
  });

  it('marks every character as assigned to a cauldron', () => {
    expect(state.characters.map((c) => c.afk?.cauldronAssigned)).toEqual([true, true, true, true, true]);
  });

  it('is null, never a default, without the Toolbox calls', () => {
    const bare = stateOf(raw, now, false);
    expect(bare.account.afk).toBeNull();
    expect(bare.characters.every((c) => c.afk === null)).toBe(true);
  });
});

describe('AFK facts on the scrubbed W3-early save', () => {
  const { raw, now } = scrubbed('scrubbed-w3');
  const state = stateOf(raw, now);

  it('reads worship charge, rates and skulls', () => {
    const w = state.characters.map((c) => c.afk?.worship);
    expect(w.every((x) => x?.max === 50 && x.hasSkull === false)).toBe(true);
  });

  it('reads the active salt and its fuel time', () => {
    const salts = state.account.afk?.salts ?? [];
    expect(salts.map((s) => s.salt)).toEqual(['Refinery1']);
  });

  it('reads the Wizard Lv 73 bag: 18 of 23 slots used', () => {
    const wizard = state.characters.find((c) => c.class === 'Wizard' && c.level === 73);
    expect(wizard?.afk?.inventory?.usedSlots).toBe(18);
    expect(wizard?.afk?.inventory?.totalSlots).toBe(23);
  });
});

describe('AFK facts on every public save', () => {
  it.each(listJson(PUBLIC_DIR))('%s: every time is finite and within 30 days of the parse', (file) => {
    const raw = readSave(PUBLIC_DIR, file) as { lastUpdated?: number };
    const now = raw.lastUpdated ?? Date.UTC(2026, 9, 17, 12);
    const state = stateOf(raw, now);
    const near = (t: number) => Number.isFinite(t) && Math.abs(t - state.asOf) <= AFK_HORIZON_MS;
    for (const c of state.characters) {
      if (!c.afk) continue;
      for (const p of c.afk.anvil ?? []) expect(near(p.capAt)).toBe(true);
      for (const t of c.afk.traps?.placed ?? []) expect(near(t.endsAt)).toBe(true);
      const f = c.afk.fighting;
      if (f) expect(f.survivability).toBeGreaterThanOrEqual(f.survivabilityNoFood);
    }
    for (const s of state.account.afk?.salts ?? []) expect(near(s.dryAt)).toBe(true);
  });

  it('reports a fact unknown when a section it depends on failed', () => {
    const { raw, now } = scrubbed('scrubbed-w2');
    const state = stateOf(raw, now);
    const failed = { ...state, diagnostics: { ...state.diagnostics, failedSections: ['arcade'] } };
    expect(isKnown(failed, 'account.afk.arcade')).toBe(false);
    expect(isKnown(failed, 'account.afk.liquids')).toBe(true);
    expect(isKnown(failed, 'characters[0].afk.fighting')).toBe(false);
  });
});
