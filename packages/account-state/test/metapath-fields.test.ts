// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Contract tests for the M2 Stage & Meta Path fields (M2 TR-3), on the committed scrubbed saves.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { computeFrontier, FIELD_SECTIONS, GATE_NPCS, isKnown, toAccountState } from '../src';
import { NOW } from './helpers';

const scrubbed = (id: string) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../../../fixtures/scrubbed/${id}.json`, import.meta.url)), 'utf8'),
  );

function read(id: string, failedSections: string[] = []) {
  const envelope = normalizeEnvelope(scrubbed(id));
  const parsed = parseSave(envelope, { now: NOW });
  return { envelope, parsed: { ...parsed, failedSections: [...parsed.failedSections, ...failedSections] } };
}

describe('M2 fields on the scrubbed W2-late save', () => {
  const { parsed, envelope } = read('scrubbed-w2');
  const state = toAccountState(parsed, envelope);

  it('classIndex, the family level and the narrowed NPC dialogue', () => {
    expect(state.characters.map((c) => c.classIndex)).toEqual([8, 9, 33, 20, 32]);
    expect(state.account.accountLevel).toBe(257);
    for (const c of state.characters)
      for (const npc of Object.keys(c.npcDialog ?? {})) expect(GATE_NPCS as readonly string[]).toContain(npc);
    expect(state.characters[0]?.npcDialog?.Djonnut).toBe(5);
  });

  it('gate quests read completed[] (not progress[]): Djonnut 1 done by slot 0, Djonnut 2 in progress there', () => {
    expect(state.account.gateQuests?.Djonnut1?.completedBy).toEqual([0]);
    expect(state.account.gateQuests?.Djonnut2).toEqual({ completedBy: [], inProgressBy: [0] });
  });

  it('buildings, salts and world crystals', () => {
    expect(state.account.buildings).toEqual({ deathNote: 0, printer3d: 0, atomCollider: 0 });
    expect(state.account.salts?.[5]).toEqual({ rawName: 'Refinery6', unlocked: false });
    expect(state.account.worldCrystals?.glacierQuartz).toBe(0);
    expect(state.account.frontier).toBeNull();
  });
});

describe('M2 fields on the scrubbed W3-early save', () => {
  const { parsed, envelope } = read('scrubbed-w3');
  const state = toAccountState(parsed, envelope);
  it('Death Note 0, 3D Printer 4, nobody with Hoggindaz 5, one character standing on Hoggindaz 1', () => {
    expect(state.account.buildings?.deathNote).toBe(0);
    expect(state.account.buildings?.printer3d).toBe(4);
    expect(state.account.gateQuests?.Hoggindaz5?.completedBy).toEqual([]);
    expect(state.account.gateQuests?.Hoggindaz1?.inProgressBy).toHaveLength(1);
  });
});

describe('failed sections make their fields unknown, never a default', () => {
  it('towers, refinery, quests and storage', () => {
    const { parsed, envelope } = read('scrubbed-w3', ['towers', 'refinery', 'quests', 'storage']);
    const s = toAccountState(parsed, envelope);
    expect([s.account.buildings, s.account.salts, s.account.gateQuests, s.account.worldCrystals]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    for (const f of ['account.buildings', 'account.salts', 'account.gateQuests', 'account.worldCrystals'])
      expect(isKnown(s, f)).toBe(false);
  });

  it('the frontier is null when a damage-relevant section failed, or when the kill-rate call throws', () => {
    const route = [{ mapIndex: 1, mapName: 'Spore_Meadows', door: 0, requirement: 21 }];
    const rate = {
      characterIndex: 0,
      finalKillsPerHour: 1,
      killsPerHour: 1,
      hitChance: 100,
      survivability: 100,
    };
    const ok = read('scrubbed-w2');
    expect(computeFrontier(ok.parsed, ok.envelope, { world: 1, route, rates: () => [rate] })).not.toBeNull();
    const bad = read('scrubbed-w2', ['stamps']);
    expect(FIELD_SECTIONS['account.frontier']).toContain('stamps');
    expect(computeFrontier(bad.parsed, bad.envelope, { world: 1, route, rates: () => [rate] })).toBeNull();
    const boom = () => {
      throw new Error('getMaxDamage threw');
    };
    expect(computeFrontier(ok.parsed, ok.envelope, { world: 1, route, rates: boom })).toBeNull();
  });
});
