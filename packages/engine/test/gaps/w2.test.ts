// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2 stories through the full golden engine: each System's exact Now text on a public or stage
// fixture (or its mutation) and its page picture. The private test accounts are local truth cases, never
// here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { COPPER, DEFAULT_EXPECTED_RETURN_MS, idleForge } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import type { ForgePicture, TaskBoardPicture } from '../../src/pictures/gaps-types';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const STAGE_DIR = fileURLToPath(new URL('../../../knowledge/test/fixtures/m26/', import.meta.url));
const stageFixture = (id: string) => {
  const file = `${STAGE_DIR}${id}.json`;
  const now = (JSON.parse(readFileSync(file, 'utf8')) as { lastUpdated: number }).lastUpdated;
  return { id, kind: 'public' as const, file, now };
};
const run = (id: string, edit: (s: AccountState) => AccountState = (s) => s): EngineResult => {
  const f = fixtures.find((x) => x.id === id) ?? stageFixture(id);
  return goldenResult({
    state: edit(stateOf(f)),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};
const goals = (r: EngineResult): Goal[] => [...r.account.goals, ...r.characters.flatMap((c) => c.goals)];
const picture = <K extends string>(r: EngineResult, kind: K) => r.slotPictures?.find((p) => p.kind === kind);

describe('the Forge (FR-25)', () => {
  it('US-20 m:fourth-forge-idle: "Fill 4 empty Forge slots with Copper Ore"', () => {
    const r = run('fourth', (s) => idleForge(s, 4, [COPPER]));
    const g = goals(r).find((x) => x.id === 'forge.check.fill-empty-slots');
    expect(g?.nextAction.text).toBe('Fill 4 empty Forge slots with Copper Ore');
    const p = picture(r, 'forge') as ForgePicture | undefined;
    expect(p?.idle).toBe(4);
    expect(p?.slots.filter((s) => s.unlocked)).toHaveLength(4);
  });
  it('fourth.json: every slot smelting, so no fill card; the bars waiting are a card', () => {
    const r = run('fourth');
    expect(goals(r).some((x) => x.id === 'forge.check.fill-empty-slots')).toBe(false);
    expect(goals(r).find((x) => x.id === 'forge.check.collect-bars')?.nextAction.text).toBe(
      'Collect 16 bars from the Forge',
    );
    const p = picture(r, 'forge') as ForgePicture | undefined;
    expect(p).toMatchObject({ slotsUnlocked: 16, idle: 0, barsWaiting: 16, capacity: 20669 });
  });
});

describe('the Task Board (FR-26)', () => {
  it('US-21 fourth.json: one tier met on a reset-on-claim task, named first', () => {
    const r = run('fourth');
    const g = goals(r).find((x) => x.id === 'task-board.check.claim');
    expect(g?.nextAction.text).toBe('Claim 1 task tier (2 merits, 25 task points)');
    expect(g?.nextAction.why).toContain('Claim Maximum Efficiency on World 2 first');
    const p = picture(r, 'task-board') as TaskBoardPicture | undefined;
    expect(p?.ready).toBe(1);
    expect(p?.worlds.map((w) => w.open)).toEqual([true, true, true, true]);
    expect(p?.worlds[1]?.shop).toHaveLength(8);
  });
  it('a closed board holds nothing to claim, and says what opens it', () => {
    const r = run('fourth', (s) =>
      s.account.taskBoard
        ? {
            ...s,
            account: {
              ...s.account,
              taskBoard: {
                ...s.account.taskBoard,
                worlds: s.account.taskBoard.worlds.map((w) => ({ ...w, open: w.world === 1 })),
              },
            },
          }
        : s,
    );
    expect(goals(r).some((x) => x.id === 'task-board.check.claim')).toBe(false);
    const p = picture(r, 'task-board') as TaskBoardPicture | undefined;
    expect(p?.worlds[1]?.opener).toBe("Finish Desert Davey's quest in World 2 town");
  });
});
