// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 as an engine step (TR-1): it runs after every other module, on the Goals they produced, because a
// Walkthrough hangs off a Goal another module owns (the Post Office unlock is M6's, the push quest M2's).
// It hands the core one Walkthrough per target, attached to its parent Goal's card (FR-23), the FR-21
// assignment Next Actions on the assignees' rows, and the printer Parallel Slot Plan as one account Goal
// with per-character detail (#70 A5). It never sets a Verdict and never takes one down (affectsVerdict
// false): a throw here drops only its own lines.
import type { AccountState } from '@idleon-forge/account-state';
import { slugify } from '@idleon-forge/knowledge/generators';
import type {
  CharacterContribution,
  EngineInput,
  EngineModule,
  ModuleGoal,
  ModuleOutput,
} from '../core/module';
import { runMetaPath } from '../metapath';
import { PUSH_GOAL_ID, rankPosition } from '../metapath/priority';
import type { MetaPathResult } from '../metapath/types';
import type { EngineResult, Goal, GoalDetail, Subject } from '../result';
import { planWalkthroughs, type WalkthroughParent, who } from './build';
import { planParams } from './detectors';
import { ENTRY, hoursText, human, itemOf, say, sourcesOf, type WalkthroughKnowledge } from './knowledge';
import type { PlanValues } from './plan';

/** M2's push Goal and W3 tutorial name a gate quest by NPC and number: their Walkthrough target. */
const questTarget = (npc: string, n: number) => `quests.acquisition.${slugify(`${npc}${n}`)}`;

export function walkthroughValues(kb: WalkthroughKnowledge, expectedReturnSeconds: number): PlanValues {
  const e = kb.entries[ENTRY.assign];
  const p = planParams.safeParse(e?.type === 'check' ? e.detector.params : {});
  const v = p.success ? p.data : planParams.parse({});
  return {
    unratedBottleneckAt: v.unratedBottleneckAt,
    firstJobWithinSeconds: v.firstJobWithinSeconds,
    tieSeconds: v.tieSeconds,
    expectedReturnSeconds,
  };
}

/** FR-1: the shown Goals that name a Walkthrough target, in rank order (FR-13's allocation order). */
export function parentsOf(
  prior: EngineResult,
  kb: WalkthroughKnowledge,
  meta: MetaPathResult | null,
): WalkthroughParent[] {
  const out: (WalkthroughParent & { pos: number; idx: number })[] = [];
  const consider = (g: Goal, subject: Subject, idx: number) => {
    const e = kb.entries[g.id];
    let target: string | null = null;
    if (e && (e.type === 'goal' || e.type === 'check') && e.walkthrough) target = e.walkthrough;
    else if (g.id === PUSH_GOAL_ID && meta?.pushGoal?.step.kind === 'quest')
      target = questTarget(meta.pushGoal.step.npc, meta.pushGoal.step.number);
    else if (g.id === 'metapath.goal.world-tutorial-w3') {
      const n = meta?.goals.find((x) => x.entryId === g.id)?.slots.number;
      if (typeof n === 'number') target = questTarget('Hoggindaz', n);
    }
    if (!target || !kb.entries[target]) return;
    const pos = meta
      ? rankPosition({ entryId: g.id, framePosition: null }, meta.list)
      : Number.POSITIVE_INFINITY;
    out.push({ key: g.nextAction.key, entryId: g.id, subject, title: g.title, targetId: target, pos, idx });
  };
  for (const c of prior.characters)
    c.goals.forEach((g, i) => {
      consider(g, `c${c.index}`, i);
    });
  prior.account.goals.forEach((g, i) => {
    consider(g, 'account', i);
  });
  out.sort(
    (a, b) => a.pos - b.pos || a.idx - b.idx || (a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0),
  );
  return out.map(({ pos: _p, idx: _i, ...p }) => p);
}

/** TR-3: the targets the worker computes supply rates for, before the engine runs. */
export function rateTargets(state: AccountState, kb: WalkthroughKnowledge): string[] {
  const out = new Set<string>();
  for (const e of Object.values(kb.entries))
    if ((e.type === 'goal' || e.type === 'check') && e.walkthrough && kb.entries[e.walkthrough])
      out.add(e.walkthrough);
  // The gate quests M2 may push next: the first one of each gate NPC nobody has finished.
  const world = state.account.currentWorld ?? 1;
  const byNpc = new Map<string, { order: number; id: string }>();
  for (const e of Object.values(kb.entries)) {
    if (e.type !== 'acquisition' || !e.id.startsWith('quests.acquisition.') || !('data' in e) || !e.data)
      continue;
    const d = e.data as { npc?: string; questKey?: string; questOrder?: number; world?: number | null };
    if (!d.npc || d.world == null || d.world > world || typeof d.questOrder !== 'number') continue;
    const done = state.characters.some((c) => c.quests?.[d.npc as string]?.[d.questKey as string] === 1);
    if (done) continue;
    const prev = byNpc.get(d.npc);
    if (!prev || d.questOrder < prev.order) byNpc.set(d.npc, { order: d.questOrder, id: e.id });
  }
  for (const { id } of byNpc.values()) out.add(id);
  return [...out].sort();
}

export interface WalkthroughModuleDeps {
  kb: WalkthroughKnowledge;
}

export function createWalkthroughModule(deps: WalkthroughModuleDeps): EngineModule {
  const { kb } = deps;
  return {
    id: 'walkthroughs',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    after: true,
    run(input: EngineInput, prior?: EngineResult): ModuleOutput {
      if (!prior) return {};
      const { state, now } = input;
      let meta: MetaPathResult | null = null;
      const full = input.knowledge.kb;
      if (full)
        try {
          meta = runMetaPath(state, full, now);
        } catch {
          meta = null;
        }
      const values = walkthroughValues(kb, input.options.expectedReturnSeconds);
      const parents = parentsOf(prior, kb, meta);
      if (parents.length === 0) return {};
      const r = planWalkthroughs({ state, kb, meta, prior, values, parents });
      const sources = sourcesOf(kb, ENTRY.assign);
      const confidence = kb.entries[ENTRY.assign]?.confidence ?? 'M';

      // FR-21: at most one assignment per character, ranked at its parent's position.
      const characters: CharacterContribution[] = [];
      const seen = new Set<number>();
      for (const row of r.rows) {
        if (seen.has(row.characterIndex)) continue;
        seen.add(row.characterIndex);
        const goal: Goal = {
          id: ENTRY.assign,
          title: kb.entries[ENTRY.assign]?.title ?? 'Walkthrough step',
          system: 'walkthrough',
          category: 'compounding',
          nextAction: {
            key: row.key,
            entryId: ENTRY.assign,
            text: row.text,
            why: row.why,
            sources,
            stale: false,
            contested: null,
            confidence,
            provenance: {
              entryIds: [ENTRY.assign, row.parentEntryId],
              fields: ['account.supplyRates', 'account.storageItems'],
            },
          },
          milestone: null,
        };
        characters.push({
          index: row.characterIndex,
          goals: [{ goal, rank: { rankAs: row.parentEntryId } }],
        });
      }

      // FR-27: the printer plan as one account Goal, one detail line per change (#70 A5).
      const account: ModuleGoal[] = [];
      const pr = r.printer;
      if (pr && pr.changes.length > 0) {
        const s = (t: string, slots: Record<string, string | number>) => say(kb, ENTRY.printer, t, slots);
        const lines: GoalDetail[] = [];
        const whys: string[] = [];
        for (const ch of pr.changes) {
          const c = state.characters.find((x) => x.index === ch.characterIndex);
          if (!c) continue;
          const name = itemOf(kb, ch.item)?.name ?? human(ch.item);
          const sample = state.account.printer?.characters
            .find((x) => x.characterIndex === ch.characterIndex)
            ?.active.find((x) => x.rawName === ch.replaces);
          const old = ch.replaces
            ? sample
              ? human(sample.name)
              : (itemOf(kb, ch.replaces)?.name ?? human(ch.replaces))
            : null;
          const map =
            ch.mapIndex !== null
              ? (kb.facts['maps.fact.maps']?.rows as { index: number; name: string }[] | undefined)?.find(
                  (m) => m.index === ch.mapIndex,
                )?.name
              : null;
          const text =
            ch.action === 'swap-to-stored'
              ? s('swap', { who: who(c), item: name, perHour: Math.round(ch.perHour ?? 0) })
              : s('take-sample', {
                  map: human(map ?? ''),
                  who: who(c),
                  item: name,
                  replaces: old ? (s('replaces', { old }) ?? '') : '',
                });
          if (text) lines.push({ subject: `c${c.index}`, text });
          const why =
            ch.action === 'swap-to-stored'
              ? s('why-swap', { item: name, missing: ch.missing })
              : `${s('why-take', { item: name, missing: ch.missing, who: who(c) }) ?? ''} ${
                  ch.resetLoss > 0.0005
                    ? (s('reset-loss', {
                        now: pr.multiNow.toFixed(2),
                        after: pr.multiAfterSample.toFixed(2),
                      }) ?? '')
                    : (s('reset-none', {}) ?? '')
                }`.trim();
          if (why) whys.push(why);
        }
        const e = kb.entries[ENTRY.printer];
        if (lines.length && e)
          account.push({
            goal: {
              id: ENTRY.printer,
              title: e.title,
              system: 'printer',
              category: 'compounding',
              nextAction: {
                key: `${ENTRY.printer}@account`,
                entryId: ENTRY.printer,
                text: lines.length === 1 ? (lines[0]?.text ?? '') : `${lines.length} printer changes`,
                why: whys.join(' '),
                sources: sourcesOf(kb, ENTRY.printer),
                stale: false,
                contested: null,
                confidence: e.confidence,
                provenance: { entryIds: [ENTRY.printer], fields: ['account.printer', 'account.supplyRates'] },
              },
              milestone: null,
              ...(lines.length > 1 ? { details: lines } : {}),
            },
            rank: { framePosition: 3 },
          });
      }
      void hoursText;
      return {
        characters,
        account: { goals: account },
        walkthroughs: r.walkthroughs.map((w) => ({ parentKey: w.parentKey, view: w.view })),
      };
    },
  };
}
