// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 TR-2's star sign fields: the letter decoder (V4) on synthetic strings, and the fields on the
// scrubbed saves (CI). Never a fixture's letters string (TR-8).
import { readFileSync } from 'node:fs';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { decodeLetters, GATE_NPCS, toAccountState } from '../src';

const scrubbed = (id: string) => {
  const raw = JSON.parse(
    readFileSync(new URL(`../../../fixtures/scrubbed/${id}.json`, import.meta.url), 'utf8'),
  ) as Parameters<typeof normalizeEnvelope>[0];
  const env = normalizeEnvelope(raw);
  const d = env.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  const now = Math.round(ta.GlobalTime * 1000);
  return toAccountState(parseSave(env, { now }), env);
};

describe('decodeLetters (M16 V4)', () => {
  it("decodes '_' as slot 0 and 'a', 'b', … as slots 1, 2, …", () => {
    expect(decodeLetters('_cb')).toEqual([0, 3, 2]);
    expect(decodeLetters('')).toEqual([]);
    expect(decodeLetters('a')).toEqual([1]);
  });
  it('drops unknown letters and repeats', () => {
    expect(decodeLetters('_?A_b')).toEqual([0, 2]);
  });
});

describe('star sign fields on the scrubbed saves', () => {
  it('Telescope is a gate NPC (M16 X1)', () => {
    expect(GATE_NPCS).toContain('Telescope');
  });

  it('W2-late: 4 starters, 0 points, quest not handed in, A-9 recorded on 4 characters; one tree route nearly open', () => {
    const s = scrubbed('scrubbed-w2');
    const ss = s.account.starSigns;
    expect(ss?.unlocked).toEqual([0, 1, 2, 3]);
    expect(ss?.pointsUnspent).toBe(0);
    expect(ss?.telescopeQuestDone).toBe(false);
    expect(ss?.claimed).toEqual([]);
    expect(ss?.progress).toEqual([{ rawIndex: 8, letterCount: 4, recorded: [0, 2, 1, 3] }]);
    for (const c of s.characters) expect(c.starSigns?.length).toBe(1);
    // The Barbarian Lv 60 (slot 0) has the first two doors open.
    expect(s.characters[0]?.telescopeRoute?.slice(0, 2)).toEqual([0, 0]);
  });

  it('W3-early: quest handed in, A-2 claimed, 3 points, every character has the Telescope dialogue', () => {
    const s = scrubbed('scrubbed-w3');
    const ss = s.account.starSigns;
    expect(ss?.telescopeQuestDone).toBe(true);
    expect(ss?.claimed).toEqual([1]);
    expect(ss?.pointsUnspent).toBe(3);
    // V4 on a real save: A-9's letters are '_' and 'c', the Wizard Lv 73 (slot 0) and the Squire Lv 85 (slot 3).
    expect(ss?.progress.find((p) => p.rawIndex === 8)?.recorded).toEqual([0, 3]);
    for (const c of s.characters) expect(c.npcDialog?.Telescope).toBe(9999);
    expect(s.characters[0]?.telescopeRoute).toEqual([0, 0, 0]);
  });
});
