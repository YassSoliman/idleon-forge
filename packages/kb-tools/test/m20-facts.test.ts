// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-3: the authored skill, trap and worship facts against Toolbox's game data at the parser pin, and
// the checklist row registry against the Knowledge Base (every row names existing entries, M20 X1's CI
// check). Runs on every parser sync, so a moved level or trap count fails the sync PR.
import { describe, expect, it } from 'vitest';
import { loadSource } from '../src/load';
import { loadGameData } from '../src/toolbox-data';

const src = loadSource();
const fact = <T>(id: string) => src.facts.find((f) => f.value.id === id)?.value.rows as T;
const entryIds = new Set(src.authored.map((e) => e.value.id));
const data = loadGameData().data as {
  items: Record<string, { displayName: string; ID: number; lvReqToEquip: number; Type: string }>;
  totems: { skillReq: number }[];
  randomList: string[][];
  shops: Record<string, { items?: { rawName: string }[] }>;
};

describe('trapping.fact.trap-set-capacity (V3)', () => {
  const rows = fact<{ rawName: string; name: string; traps: number; levelReq: number }[]>(
    'trapping.fact.trap-set-capacity',
  );
  it('traps per set is the set item ID (N.js NumOfTrapsPlaceable), levels are lvReqToEquip', () => {
    for (const r of rows) {
      const item = data.items[r.rawName];
      expect(item?.Type, r.rawName).toBe('TRAP_BOX_SET');
      expect(r.traps, r.rawName).toBe(item?.ID);
      expect(r.levelReq, r.rawName).toBe(item?.lvReqToEquip);
      expect(r.name, r.rawName).toBe(item?.displayName.replace(/_/g, ' '));
    }
  });
  it('covers every trap set in the game data', () => {
    const sets = Object.keys(data.items).filter((k) => data.items[k]?.Type === 'TRAP_BOX_SET');
    expect(rows.map((r) => r.rawName).sort()).toEqual(sets.sort());
  });
});

describe('skills.fact.gates', () => {
  const gates = fact<Record<string, { level: number; label: string }[]>>('skills.fact.gates');
  it('totem levels equal Toolbox getTotems skillReq (W1–W3 totems after the first)', () => {
    expect(gates.worship?.map((g) => g.level)).toEqual(data.totems.slice(1, 4).map((t) => t.skillReq));
  });
  it('trap-box levels equal the sets lvReqToEquip (Silkskin to Royal)', () => {
    const levels = [2, 3, 4, 5, 6, 7].map((n) => data.items[`TrapBoxSet${n}`]?.lvReqToEquip);
    expect(gates.trapping?.map((g) => g.level)).toEqual(levels);
  });
});

describe('worship.fact.skulls', () => {
  it('the Wax Skull is a worship skull sold in the W3 town shop', () => {
    const [wax] = fact<{ rawName: string; levelReq: number }[]>('worship.fact.skulls');
    expect(data.items[wax?.rawName ?? '']?.Type).toBe('WORSHIP_SKULL');
    expect(data.items[wax?.rawName ?? '']?.lvReqToEquip).toBe(wax?.levelReq);
    const w3 = Object.values(data.shops).find((s) => s.items?.some((i) => i.rawName === 'TrapBoxSet1'));
    expect(w3?.items?.some((i) => i.rawName === wax?.rawName)).toBe(true);
  });
});

describe('checklist.fact.rows (M20 X1)', () => {
  const rows = fact<{ id: string; band: string; entries: string[] }[]>('checklist.fact.rows');
  it('17 Phase 1 rows plus the M19 Liquid Shop gem (X5), each naming entries that exist', () => {
    expect(rows).toHaveLength(18);
    for (const r of rows) for (const e of r.entries) expect(entryIds.has(e), `${r.id}: ${e}`).toBe(true);
  });
  it('band order: no bank, banks, weekly', () => {
    const order = rows.map((r) => ['no-bank', 'banks', 'weekly'].indexOf(r.band));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
