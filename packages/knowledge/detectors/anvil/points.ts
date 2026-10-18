// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-23 (Final rulings, #70 A2): unspent anvil points, as ONE account finding, "Unspent anvil points
// on N characters -> <stat>", plus one character finding per character holding points, which the M6
// module turns into the account Goal's per-character detail (never a Goal of their own). The split is
// the adapter's brute force over integer splits with Toolbox getPlayerAnvil
// (`characters[].afk.anvilPlan`, M3 TR-2), for the window of the player's Expected Return ("Back in
// about", 8 h by default): most items in that time from empty, ties to Speed.
// Unspent is recomputed from its sources (the stored value goes stale after a Smithing level-up).
import { anvilPlanWindow } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, characterSubject, isKnown, withCharacter } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/points',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({}),
  slots: z
    .strictObject({
      count: z.number(),
      hours: z.number(),
      points: z.number(),
      speed: z.number(),
      capacity: z.number(),
      manyCapacity: z.number(),
      manyMixed: z.number(),
      oneSpeed: z.number(),
      oneCapacity: z.number(),
      oneMixed: z.number(),
      /** Class rawName and level when exactly one character has points: the line names it (R3 QA P3). */
      class: z.string(),
      level: z.number(),
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].class',
    'characters[*].level',
    'characters[*].afk',
    'diagnostics',
  ],
  examples: {
    // W3-early: the Bowman Lv 60 holds 3 points.
    fires: [{ fixture: 'scrubbed-w3' }, { fixture: 'scrubbed-w3', subject: characterSubject(2) }],
    silent: [
      // W2-late: nothing unspent anywhere.
      { fixture: 'scrubbed-w2' },
      { fixture: 'scrubbed-w3', subject: characterSubject(0) },
      // Points already placed (the plan has no spend).
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => {
          const afk = s.characters.find((c) => c.index === 2)?.afk;
          const plan = afk?.anvilPlan;
          return afk && plan
            ? withCharacter(s, 2, {
                afk: {
                  ...afk,
                  anvilPlan: {
                    ...plan,
                    unspent: 0,
                    windows: plan.windows.map((w) => ({ ...w, spend: null })),
                  },
                },
              })
            : s;
        },
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(2),
        mutate: (s) => {
          const afk = s.characters.find((c) => c.index === 2)?.afk;
          return afk ? withCharacter(s, 2, { afk: { ...afk, anvilPlan: null } }) : s;
        },
      },
    ],
  },
  run({ state, expectedReturnMs }): CheckFinding[] {
    const findings: CheckFinding[] = [];
    let speed = 0;
    let capacity = 0;
    let hours = 0;
    let only: { class: string; level: number } | null = null;
    for (const c of state.characters) {
      const subject = characterSubject(c.index);
      const plan = c.afk?.anvilPlan;
      if (!isKnown(state, `characters[${c.index}].afk`) || !plan) {
        findings.push({ subject, slots: {}, result: 'unknown', reason: 'field-missing' });
        continue;
      }
      const window = anvilPlanWindow(plan, expectedReturnMs);
      if (!window?.spend || plan.unspent <= 0) continue;
      const toSpeed = window.spend.speed - plan.speedPoints;
      const toCapacity = window.spend.capacity - plan.capPoints;
      speed += toSpeed;
      capacity += toCapacity;
      hours = window.windowMs / 3_600_000;
      only = { class: c.class, level: c.level };
      findings.push({
        subject,
        slots: { points: plan.unspent, speed: toSpeed, capacity: toCapacity },
        result: 'fires',
        urgency: 'banked',
        doneKey: `anvil-points:${c.index}`,
      });
    }
    const count = findings.filter((f) => f.result === 'fires').length;
    if (count === 0) return findings;
    const stat = speed > 0 && capacity > 0 ? 'Mixed' : capacity > 0 ? 'Capacity' : 'Speed';
    // Exactly one flag picks the entry's text variant (M3 textOf); none is "many characters -> Speed".
    const flag = count === 1 ? `one${stat}` : stat === 'Speed' ? null : `many${stat}`;
    return [
      {
        subject: accountSubject,
        slots: { count, hours, ...(count === 1 && only ? only : {}), ...(flag ? { [flag]: 1 } : {}) },
        result: 'fires',
        urgency: 'banked',
        doneKey: 'anvil-points',
      },
      ...findings,
    ];
  },
});
