// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The entry schema (M11 FR-1 to FR-8, TR-2, TR-2a, TR-2b).
import { describe, expect, it } from 'vitest';
import { AuthoredEntry, AuthoredFile, FactTable, GeneratedEntry, Source, SystemDef } from '../src/schema';
import { ALL, blocker, check, contribution, goal, metapath, priority, tier1, tier3 } from './examples';

const messages = (v: unknown) => {
  const r = AuthoredEntry.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('the seven entry types (FR-1)', () => {
  it.each(Object.entries(ALL))('a valid %s parses', (_name, entry) => {
    expect(messages(entry)).toEqual([]);
  });

  it('rejects any other type', () => {
    expect(AuthoredEntry.safeParse({ ...check, type: 'tip' }).success).toBe(false);
  });

  it('an authored file needs at least one entry', () => {
    expect(AuthoredFile.safeParse({ system: 'afk', entries: [] }).success).toBe(false);
    expect(AuthoredFile.safeParse({ system: 'afk', entries: [blocker] }).success).toBe(true);
  });
});

describe('required fields and Sources (FR-2, FR-3)', () => {
  it('needs at least one Source', () => {
    const r = AuthoredEntry.safeParse({ ...check, sources: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ code: 'too_small', path: ['sources'] });
  });

  it.each(['title', 'text', 'why', 'appliesTo', 'confidence', 'status'])('needs %s', (field) => {
    const entry: Record<string, unknown> = { ...check };
    delete entry[field];
    expect(AuthoredEntry.safeParse(entry).success).toBe(false);
  });

  it('Sources are https, with a tier, a verified date and a game version', () => {
    expect(Source.safeParse(tier1).success).toBe(true);
    expect(Source.safeParse({ ...tier3, url: 'http://example.org' }).success).toBe(false);
    expect(Source.safeParse({ ...tier3, tier: 5 }).success).toBe(false);
    expect(Source.safeParse({ ...tier3, gameVersion: '2.3' }).success).toBe(false);
  });

  it('tier 2 and 3 Sources need claimDate', () => {
    const { claimDate: _c, ...noDate } = tier3;
    expect(Source.safeParse(noDate).error?.issues[0]?.message).toBe(
      'tier 2 and tier 3 Sources need claimDate',
    );
  });

  it('a tier 1 Source is a Toolbox permalink at a 40-character sha (R17)', () => {
    const r = Source.safeParse({
      ...tier1,
      url: 'https://github.com/YassSoliman/idleon-forge/blob/main/docs/x.md',
    });
    expect(r.error?.issues[0]?.message).toMatch(/Toolbox permalink/);
  });
});

describe('ids (FR-4)', () => {
  it('follow <system>.<type>.<slug> with the type in the middle', () => {
    expect(messages({ ...check, id: 'alchemy.goal.empty-big-bubble-slot' })).toContain(
      'id segment "goal" must equal type "check"',
    );
    expect(messages({ ...check, id: 'Alchemy.check.x' }).length).toBeGreaterThan(0);
    expect(messages({ ...check, system: 'afk' })).toContain('id must start with its system');
  });

  it('Detector ids are <system>/<name>', () => {
    expect(messages({ ...check, detector: { id: 'alchemy.empty' } }).length).toBeGreaterThan(0);
  });
});

describe('contested and blockers (FR-6, FR-7, D-3)', () => {
  const sides = {
    sides: [
      { position: 'A', sources: [tier3] },
      { position: 'B', sources: [tier3] },
    ],
  };

  it('contested status and its sides go together', () => {
    expect(messages({ ...check, status: 'contested' })).toContain(
      'contested status and contested.sides go together',
    );
    expect(messages({ ...check, status: 'contested', contested: sides })).toEqual([]);
  });

  it('a contested entry cannot be a Verdict blocker (US-3)', () => {
    expect(messages({ ...blocker, status: 'contested', contested: sides })).toContain(
      'a contested entry cannot be a Verdict blocker',
    );
  });

  it('a blocker needs confidence H and a tier 1 or 2 Source', () => {
    expect(messages({ ...blocker, confidence: 'M' })).toContain('Verdict blockers need confidence H');
    expect(messages({ ...blocker, sources: [tier3] })).toContain(
      'Verdict blockers need a tier 1 or 2 Source (D3)',
    );
  });

  it('a blocker is never an Active Play suggestion nor a by-urgency list item', () => {
    expect(messages({ ...blocker, activePlay: { minutes: 5 } })).toContain(
      'Active Play suggestions never affect a Verdict',
    );
    expect(messages({ ...blocker, priority: { frame: 'by-urgency' } })).toContain(
      'Verdict blockers are not list items',
    );
  });

  it('affectsVerdict, when stated, must be true exactly for blockers (M6 R9)', () => {
    expect(messages({ ...check, affectsVerdict: true })).toContain(
      'affectsVerdict is true exactly for effect: blocker',
    );
    expect(messages({ ...blocker, affectsVerdict: true })).toEqual([]);
  });
});

describe('Timeline bar words (M17 TR-4)', () => {
  it('timelineKind and timelineWhat go together, and the kind is one of TIMELINE_KINDS', () => {
    expect(messages({ ...check, values: { timelineKind: 'storage', timelineWhat: 'anvil' } })).toEqual([]);
    expect(messages({ ...check, values: { timelineKind: 'storage' } })).toContain(
      'timelineKind and timelineWhat go together (M17 TR-4)',
    );
    expect(messages({ ...check, values: { timelineWhat: 'anvil' } })).toContain(
      'timelineKind and timelineWhat go together (M17 TR-4)',
    );
    expect(messages({ ...check, values: { timelineKind: 'bucket', timelineWhat: 'anvil' } })).toContain(
      'timelineKind must be one of storage, food, time-cap, production, bank, timer',
    );
    expect(messages({ ...check, values: { timelineKind: 'bank', timelineWhat: 3 } })).toContain(
      'timelineWhat is a short phrase (1 to 40 characters)',
    );
  });
});

describe('no weights, ever (FR-8)', () => {
  it('rejects any unknown key, at the top or inside a tier item', () => {
    expect(AuthoredEntry.safeParse({ ...check, weight: 3 }).success).toBe(false);
    expect(
      AuthoredEntry.safeParse({ ...priority, tiers: [[{ ref: 'metapath.goal.push', score: 1 }]] }).success,
    ).toBe(false);
  });
});

describe("verified before build: a refine inside zod 4's discriminated union (spec index, M11)", () => {
  it('Contribution: exactly one of goal or goalFamily', () => {
    const { goal: _g, ...neither } = contribution;
    expect(messages(neither)).toContain('exactly one of goal or goalFamily');
    expect(messages({ ...contribution, goalFamily: 'upgrade-vault.goal.kill-row' })).toContain(
      'exactly one of goal or goalFamily',
    );
    expect(messages({ ...neither, goalFamily: 'upgrade-vault.goal.kill-row' })).toEqual([]);
  });

  it('refines on nested objects and on union members run too (activity, metapath slots, tier items)', () => {
    expect(messages({ ...contribution, activity: { afkType: 'FIGHTING', slot: 'trap' } })).toContain(
      'exactly one of afkType or slot',
    );
    const slots = [{ slot: 1, classLine: 'Barbarian', status: 'contested' }];
    expect(messages({ ...metapath, slots })).toContain(
      'a contested slot needs sides, and only a contested slot has them',
    );
    expect(
      messages({ ...priority, tiers: [[{ ref: 'metapath.goal.push', verification: 'contested' }]] }),
    ).toContain('a contested item needs at least 2 sides');
  });
});

describe('per-type rules (TR-2 entryRules)', () => {
  it('a Goal has exactly one of extends or milestones, and Milestones ascend', () => {
    expect(messages({ ...goal, milestones: [{ at: 1, reward: 'x' }] })).toContain(
      'a Goal needs exactly one of extends or milestones',
    );
    const { extends: _e, ...own } = goal;
    expect(
      messages({
        ...own,
        milestones: [
          { at: 10, reward: 'a' },
          { at: 5, reward: 'b' },
        ],
      }),
    ).toContain('Milestones must strictly ascend');
  });

  it('a kills-per-hour ETA is only for FIGHTING', () => {
    expect(messages({ ...contribution, activity: { afkType: 'MINING' } })).toContain(
      'kills-per-hour ETA only for FIGHTING (#11 item 8)',
    );
  });

  it('Priority Lists: block lists have no Stage, goals lists have one, appliesTo matches it', () => {
    expect(messages({ ...priority, list: 'block' })).toContain('block lists have no stage');
    const { stage: _s, ...noStage } = priority;
    expect(messages(noStage)).toContain('goals, spend and leverage lists have exactly one stage');
    expect(messages({ ...priority, appliesTo: { stages: ['W3-mid'] } })).toContain(
      'appliesTo.stages must be [stage]',
    );
    expect(messages({ ...noStage, list: 'order', appliesTo: { stages: 'all' } })).toEqual([]);
  });

  it('a Meta Path entry carries exactly the field its part names', () => {
    expect(messages({ ...metapath, part: 'roles' })).toContain(
      'part "roles" needs exactly the "roles" field',
    );
  });

  it('templates are plain text', () => {
    expect(messages({ ...check, text: 'Equip <b>now</b>' })).toContain('templates are plain text; no < or >');
  });

  it('contestedOn only on a contested Contribution', () => {
    expect(messages({ ...contribution, contestedOn: 'order' })).toContain(
      'contestedOn only on a contested entry',
    );
  });
});

describe('generated entries, fact tables and the System registry (TR-2, TR-2a, TR-9)', () => {
  const generated = {
    ...goal,
    id: 'death-note.goal.poop-small',
    extends: undefined,
    milestones: [{ at: 25000, reward: 'rank 1' }],
    origin: 'generated',
    generatedBy: {
      generator: 'death-note',
      inputs: ['x'],
      commit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
    },
  };

  it('generated Goals carry machine provenance; authored YAML never does', () => {
    expect(GeneratedEntry.safeParse(generated).success).toBe(true);
    expect(AuthoredEntry.safeParse(generated).success).toBe(false);
  });

  it('only generated Acquisitions carry rates (FR-17)', () => {
    expect(AuthoredEntry.safeParse({ ...ALL.acquisition, rates: { Boss2A: 0.001 } }).success).toBe(false);
  });

  it('fact tables: generated cite tier 1 with generatedBy; authored cite tier 2–3 with claimDate', () => {
    const table = {
      id: 'trapping.fact.trap-durations',
      system: 'trapping',
      title: 'Trap durations',
      rows: [1, 2],
    };
    expect(FactTable.safeParse({ ...table, origin: 'authored', sources: [tier3] }).success).toBe(true);
    expect(FactTable.safeParse({ ...table, origin: 'generated', sources: [tier1] }).success).toBe(false);
    expect(
      FactTable.safeParse({
        ...table,
        origin: 'generated',
        sources: [tier1],
        generatedBy: generated.generatedBy,
      }).success,
    ).toBe(true);
    expect(
      FactTable.safeParse({ ...table, id: 'trapping.trap-durations', origin: 'authored', sources: [tier3] })
        .success,
    ).toBe(false);
  });

  it('a System is unlocked always or by a milestone Detector reference', () => {
    const s = {
      id: 'trapping',
      name: 'Trapping',
      world: 3,
      scope: 'character',
      dossier: 'https://example.org/d',
    };
    expect(SystemDef.safeParse({ ...s, unlocked: 'always' }).success).toBe(true);
    expect(
      SystemDef.safeParse({ ...s, unlocked: { id: 'worlds/reached', params: { world: 3 } } }).success,
    ).toBe(true);
    expect(SystemDef.safeParse({ ...s, unlocked: 'sometimes' }).success).toBe(false);
  });
});
