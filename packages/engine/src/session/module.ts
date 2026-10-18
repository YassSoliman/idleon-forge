// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-11: the `session` engine module, owned by area N (Now and flows). An engine step (`after`): it
// runs once every other module has run, so it sees the Goals they emitted.
//
// It emits `EngineResult.session`: the Play Session facts the pause points and the Away card read
// (`facts.ts`), plus the grouped-job sentences (FR-N3): for each Check entry whose Next Action shows on
// two or more characters, its authored `groupText` ("Collect and re-place your finished traps"). The UI
// imports no Knowledge Base, so the sentence travels with the result. Only a `groupText` with no
// placeholder is sent; one that needs a scope stays with its own module (the account-level ones the
// collections module already words).
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import type { EngineResult, SessionFacts } from '../result';
import { sessionFacts } from './facts';

/** The grouped-job sentences for every entry shown on 2 or more characters' Goals. */
export function groupTextsOf(prior: EngineResult | undefined, input: EngineInput): Record<string, string> {
  const kb = input.knowledge.kb;
  if (!kb || !prior) return {};
  const seen = new Map<string, Set<number>>();
  for (const c of prior.characters)
    for (const g of c.goals) {
      const id = g.nextAction.entryId;
      seen.set(id, (seen.get(id) ?? new Set()).add(c.index));
    }
  const out: Record<string, string> = {};
  for (const [id, who] of seen) {
    if (who.size < 2) continue;
    const entry = kb.entries[id] as { type?: string; groupText?: unknown } | undefined;
    const text = entry?.type === 'check' ? entry.groupText : undefined;
    if (typeof text === 'string' && text.length > 0 && !text.includes('{')) out[id] = text;
  }
  return out;
}

export function createSessionModule(): EngineModule {
  return {
    id: 'session',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    after: true,
    run(input, prior): ModuleOutput {
      const session: SessionFacts = {
        ...sessionFacts(input.state, input.history),
        groupTexts: groupTextsOf(prior, input),
      };
      return { session };
    },
  };
}
