// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9's engine Detectors (TR-8, M11 TR-4, `kind: 'engine'`). Each returns M11 `CheckFinding`s, so the
// two blocker Checks (wrong preset, 0 attacks) run through M3's `evaluateAfkSafety` like M3's own, and
// the M9 module (module.ts) runs the rest. Every word a player reads is in the entries' YAML; slots
// carry names and numbers only. Registered by one-line re-exports in packages/engine/detectors/builds/.
import { humanize } from '@idleon-forge/account-state';
import { type CheckFinding, characterSubject, defineDetector, type SlotValue } from '@idleon-forge/knowledge';
import { z } from 'zod';
import {
  analyzeAccount,
  attackBar,
  bestNextStep,
  type CharacterAnalysis,
  missingSkillAttack,
  presetBehind,
  presetLabel,
  presetSetup,
  resetCandidate,
  sameRole,
  wrongPreset,
} from './analyze';
import type { StepState } from './diff';
import { type BuildsKnowledge, talentLabel } from './knowledge';

const none = z.strictObject({});
const flag = z.number().int().min(0).max(1);

const TALENT_READS = [
  'characters[*].talents',
  'characters[*].class',
  'characters[*].level',
  'characters[*].afkType',
] as const;
const STAGE_READS = ['account.finishedWorlds', 'account.currentWorld', 'characters[*].level'] as const;

const nameOf = (kb: BuildsKnowledge, id: number) => talentLabel(kb.talents.nameOf(id) ?? String(id));
const stepNames = (steps: readonly StepState[]) => steps.map((s) => talentLabel(s.step.talent)).join(', ');
/** "Barbarian fishing build" from the Build's title, for "the {build}". */
const buildName = (title: string) => title.split(' (')[0] ?? title;

type Fire = Extract<CheckFinding, { result: 'fires' }>;
const fires = (a: CharacterAnalysis, slots: Record<string, SlotValue>, extra: Partial<Fire> = {}): Fire => ({
  subject: characterSubject(a.index),
  result: 'fires',
  slots,
  ...extra,
});

/** FR-3: the wrong-preset blocker (M3 pipeline). */
export const wrongPresetDetector = defineDetector({
  id: 'builds/wrong-preset',
  kind: 'engine',
  system: 'builds',
  params: none,
  slots: z.strictObject({ toRole: z.string(), fromRole: z.string() }),
  reads: [...TALENT_READS, ...STAGE_READS],
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    for (const a of acc.characters.values()) {
      const w = wrongPreset(a);
      if (w) out.push(fires(a, { toRole: w.toRole, fromRole: w.fromClass }, { fixHolds: true }));
    }
    return out;
  },
});

/** FR-13: 0 counted attacks on an AFK fighter's bar with an attack levelled (the blocker, via M3). */
export const attackBarDetector = defineDetector({
  id: 'builds/attack-bar',
  kind: 'engine',
  system: 'builds',
  params: z.strictObject({ mode: z.enum(['blocker', 'goal']).default('blocker') }),
  slots: z.strictObject({
    attacksOnBar: z.number(),
    missing: z.string(),
    noneLevelled: flag,
    oneAttack: flag,
  }),
  reads: [...TALENT_READS, ...STAGE_READS],
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }, params) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      const bar = attackBar(a, acc.kb);
      if (!bar || bar.onBar.length > 1) continue;
      const blocker = bar.onBar.length === 0 && bar.levelled.length > 0;
      if ((params.mode === 'blocker') !== blocker) continue;
      // The none-levelled Goal only on a line whose Build wants attacks (a Beginner has none).
      if (!blocker && bar.missing.length === 0 && (a.active.build?.attacks.length ?? 0) === 0) continue;
      out.push(
        fires(
          a,
          {
            attacksOnBar: bar.onBar.length,
            missing: bar.missing.map((id) => nameOf(acc.kb, id)).join(', '),
            noneLevelled: bar.missing.length === 0 ? 1 : 0,
            oneAttack: bar.onBar.length === 1 && bar.missing.length > 0 ? 1 : 0,
          },
          { fixHolds: true },
        ),
      );
    }
    return out;
  },
});

/** FR-14: the AFK skill's skill attack is missing from the skilling preset's bar. */
export const skillAttackDetector = defineDetector({
  id: 'builds/skill-attack',
  kind: 'engine',
  system: 'builds',
  params: none,
  slots: z.strictObject({ talent: z.string(), skill: z.string() }),
  reads: [...TALENT_READS, ...STAGE_READS],
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      const c = state.characters.find((x) => x.index === a.index);
      const id = missingSkillAttack(a, acc.kb, c?.afkType ?? null);
      if (id !== null) out.push(fires(a, { talent: nameOf(acc.kb, id), skill: humanize(c?.afkType ?? '') }));
    }
    return out;
  },
});

/** FR-4, FR-7, FR-8: one Detector, three modes (one per entry). */
export const presetEmptyDetector = defineDetector({
  id: 'builds/preset-empty',
  kind: 'engine',
  system: 'builds',
  params: z.strictObject({ mode: z.enum(['empty', 'incomplete', 'same-role']) }),
  slots: z.strictObject({
    role: z.string(),
    otherRole: z.string(),
    points: z.number(),
    firstSteps: z.string(),
    backRole: z.string(),
    build: z.string(),
    buildId: z.string(),
    current: flag,
    swapBack: flag,
    reset: flag,
  }),
  reads: [...TALENT_READS, ...STAGE_READS, 'account.resetItems'],
  examples: { fires: [], silent: [] },
  run: ({ state, facts }, params) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    const items = state.account.resetItems ?? null;
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      if (params.mode === 'same-role') {
        const s = sameRole(a);
        if (!s) continue;
        const canReset =
          !!items && (items.potions >= 1 || items.fragments >= 10) && !s.build.stale && !s.build.contested;
        out.push(
          fires(a, {
            role: s.role,
            otherRole: a.active.cls,
            points: 0,
            firstSteps: '',
            backRole: s.role,
            build: buildName(s.build.entry.title),
            buildId: s.build.entry.id,
            current: 0,
            swapBack: 0,
            reset: canReset ? 1 : 0,
          }),
        );
        continue;
      }
      const f = presetSetup(a);
      if (!f || f.mode !== params.mode) continue;
      out.push(
        fires(a, {
          role: f.role,
          otherRole: f.role === 'fighting' ? 'skilling' : 'fighting',
          points: f.points,
          firstSteps: stepNames(f.firstSteps),
          backRole: presetLabel(a.active),
          build: buildName(f.build.entry.title),
          buildId: f.build.entry.id,
          current: f.target.isActive ? 1 : 0,
          swapBack: f.swapBack ? 1 : 0,
          reset: 0,
        }),
      );
    }
    return out;
  },
});

/** FR-9: at least `minPoints` points left behind on a preset (a lower bound, TR-7). */
export const presetBehindDetector = defineDetector({
  id: 'builds/preset-behind',
  kind: 'engine',
  system: 'builds',
  params: z.strictObject({ minPoints: z.number().int().positive() }),
  slots: z.strictObject({
    role: z.string(),
    points: z.number(),
    tabs: z.string(),
    firstSteps: z.string(),
    noBuild: flag,
    buildId: z.string(),
  }),
  reads: [...TALENT_READS, ...STAGE_READS],
  examples: { fires: [], silent: [] },
  run: ({ state, facts }, params) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      const b = presetBehind(a, params.minPoints);
      if (!b) continue;
      const tabNames = b.tabs.map((t) =>
        humanize(b.preset.talents.tabs.find((x) => x.tab === t)?.tabName ?? String(t)),
      );
      out.push(
        fires(a, {
          role: presetLabel(b.preset),
          points: b.preset.lb?.total ?? 0,
          tabs: tabNames.join(', '),
          firstSteps: stepNames(b.firstSteps),
          noBuild: b.firstSteps.length === 0 ? 1 : 0,
          buildId: b.preset.build?.entry.id ?? '',
        }),
      );
    }
    return out;
  },
});

/** FR-11, FR-12: the character's next talent step over both presets (the module applies D6 and RT1). */
export const nextStepDetector = defineDetector({
  id: 'builds/next-step',
  kind: 'engine',
  system: 'builds',
  params: none,
  slots: z.strictObject({
    talent: z.string(),
    target: z.number(),
    current: z.number(),
    tab: z.number(),
    core: flag,
    preset: z.string(),
    onOther: flag,
    build: z.string(),
    tabPoints: z.number(),
    slot: z.number(),
    buildId: z.string(),
  }),
  reads: [...TALENT_READS, ...STAGE_READS],
  examples: { fires: [], silent: [] },
  run: ({ state, facts }) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      const n = bestNextStep(a);
      if (!n?.preset.build) continue;
      out.push(
        fires(a, {
          talent: talentLabel(n.state.step.talent),
          target: n.state.target,
          current: n.state.current,
          tab: n.state.tab,
          core: n.state.step.core ? 1 : 0,
          preset: presetLabel(n.preset),
          onOther: n.preset.isActive ? 0 : 1,
          build: buildName(n.preset.build.entry.title),
          tabPoints: n.tabPoints,
          slot: n.preset.slot,
          buildId: n.preset.build.entry.id,
        }),
      );
    }
    return out;
  },
});

/** FR-15, FR-16: a reset that clearly pays (Stale filtering by the bundle is the module's). */
export const resetCandidateDetector = defineDetector({
  id: 'builds/reset-candidate',
  kind: 'engine',
  system: 'builds',
  params: z.strictObject({ minWrongRolePoints: z.number().int().positive() }),
  slots: z.strictObject({
    role: z.string(),
    otherRole: z.string(),
    owned: z.number(),
    fragments: z.number(),
    points: z.number(),
    talents: z.string(),
    checkTalent: z.string(),
    checkLevel: z.number(),
    firstStep: z.string(),
    swap: flag,
    frag: flag,
    swapFrag: flag,
    buildId: z.string(),
  }),
  reads: [...TALENT_READS, ...STAGE_READS, 'account.resetItems'],
  examples: { fires: [], silent: [] },
  run: ({ state, facts }, params) => {
    const acc = analyzeAccount(state, facts);
    const out: CheckFinding[] = [];
    const items = state.account.resetItems ?? null;
    for (const a of acc.characters.values()) {
      if (wrongPreset(a)) continue;
      const r = resetCandidate(a, params.minWrongRolePoints, items);
      if (!r?.preset.build) continue;
      const first = r.preset.build.tabs[0]?.steps[0];
      const swap = !r.preset.isActive;
      const frag = r.potions < 1;
      out.push(
        fires(a, {
          role: presetLabel(r.preset),
          otherRole: r.preset.cls === 'fighting' ? 'skilling' : 'fighting',
          owned: r.potions,
          fragments: r.fragments,
          points: r.wrong.points,
          talents: r.wrong.talents
            .slice(0, 3)
            .map((t) => talentLabel(t.talent))
            .join(', '),
          checkTalent: r.check ? nameOf(acc.kb, r.check.id) : '',
          checkLevel: r.check?.level ?? 0,
          firstStep: first ? talentLabel(first.talent) : '',
          swap: swap && !frag ? 1 : 0,
          frag: frag && !swap ? 1 : 0,
          swapFrag: swap && frag ? 1 : 0,
          buildId: r.preset.build.entry.id,
        }),
      );
    }
    return out;
  },
});

/** Every M9 engine Detector, by id. */
export const BUILDS_DETECTORS = Object.freeze({
  [wrongPresetDetector.id]: wrongPresetDetector,
  [attackBarDetector.id]: attackBarDetector,
  [skillAttackDetector.id]: skillAttackDetector,
  [presetEmptyDetector.id]: presetEmptyDetector,
  [presetBehindDetector.id]: presetBehindDetector,
  [nextStepDetector.id]: nextStepDetector,
  [resetCandidateDetector.id]: resetCandidateDetector,
});
