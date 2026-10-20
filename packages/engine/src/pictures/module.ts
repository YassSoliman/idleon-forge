// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-10: the `pictures` engine module, owned by area S (Systems). An engine step (`after`): it reads
// the other modules' assembled result for the lit element (M8's stamp Goals, M7's Spend Plan) and re-runs
// M14's pure Walkthrough plan for the printer's Parallel Slot Plan (the same inputs as M14's step, so the
// same plan: walkthrough/build.ts FR-32). It emits the Stamps, Statues, Upgrade Vault and 3D Printer
// pictures on `slotPictures`, after M20's (core/engine.ts concatenates them in module order). It adds no
// advice and never touches a Verdict. The Pay 2 Win grid (G8) is drawn from M19's `EngineResult.alchemy`,
// which already carries its order and its one "next" cell, so it needs no picture here.
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import type { MetaPathResult } from '../metapath/types';
import type { EngineResult, SystemPicture } from '../result';
import { planWalkthroughs, who } from '../walkthrough/build';
import { ENTRY, human, itemOf, say, type WalkthroughKnowledge } from '../walkthrough/knowledge';
import { parentsOf, walkthroughValues } from '../walkthrough/module';
import type { PrinterSlotPlan } from '../walkthrough/types';
import { printerPicture, stampsPicture, statuesPicture, vaultPicture } from './build';
import { forgePicture, taskBoardPicture } from './gaps';
import { elitePicture, riftPicture, tomePicture } from './w4';
import {
  buildSlotsPicture,
  prayersPicture,
  printerSamplesPicture,
  refineryPicture,
  shrinesPicture,
} from './w23';

function printerPlan(input: EngineInput, prior: EngineResult, kb: CompiledKnowledge): PrinterSlotPlan | null {
  const wk = kb as unknown as WalkthroughKnowledge;
  let meta: MetaPathResult | null = null;
  try {
    meta = runMetaPath(input.state, kb, input.now);
  } catch {
    meta = null;
  }
  const parents = parentsOf(prior, wk, meta);
  // M14's step makes no plan without a parent Goal, so neither do we (the slots then read "no change").
  if (parents.length === 0) return null;
  const values = walkthroughValues(wk, input.options.expectedReturnSeconds);
  return planWalkthroughs({ state: input.state, kb: wk, meta, prior, values, parents }).printer ?? null;
}

export function createPicturesModule(): EngineModule {
  return {
    id: 'pictures',
    covers: [],
    // The printer plan reads the Expected Return through M14's values.
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    after: true,
    run(input: EngineInput, prior?: EngineResult): ModuleOutput {
      const kb = input.knowledge.kb;
      if (!prior || !kb) return {};
      const { state } = input;
      const wk = kb as unknown as WalkthroughKnowledge;
      const out: SystemPicture[] = [];
      const add = (p: SystemPicture | null) => {
        if (p) out.push(p);
      };
      // One picture failing never takes the others with it.
      const safe = <T>(f: () => T): T | null => {
        try {
          return f();
        } catch {
          return null;
        }
      };
      add(safe(() => stampsPicture(state, kb, prior)));
      add(safe(() => statuesPicture(state, prior)));
      add(safe(() => vaultPicture(state, kb, prior)));
      add(
        safe(() => {
          const plan = printerPlan(input, prior, kb);
          const maps = kb.facts['maps.fact.maps']?.rows as { index: number; name: string }[] | undefined;
          return printerPicture(
            state,
            plan,
            (raw) => itemOf(wk, raw)?.name ?? human(raw),
            (i) => {
              const ch = plan?.changes.find((c) => c.characterIndex === i);
              const c = state.characters.find((x) => x.index === i);
              if (!ch || !c) return null;
              const item = itemOf(wk, ch.item)?.name ?? human(ch.item);
              const map = ch.mapIndex !== null ? maps?.find((m) => m.index === ch.mapIndex)?.name : null;
              return ch.action === 'swap-to-stored'
                ? say(wk, ENTRY.printer, 'swap', { who: who(c), item })
                : say(wk, ENTRY.printer, 'take-sample', { map: human(map ?? ''), who: who(c), item });
            },
          );
        }),
      );
      // M24: the World 2 and 3 pages' read-only pictures (w23.ts).
      const maps = kb.facts['maps.fact.maps']?.rows as { index: number; name: string }[] | undefined;
      add(safe(() => refineryPicture(state)));
      add(safe(() => buildSlotsPicture(state)));
      add(safe(() => printerSamplesPicture(state)));
      add(safe(() => prayersPicture(state)));
      add(safe(() => shrinesPicture(state, (i) => maps?.find((m) => m.index === i)?.name ?? null)));
      // M26 Wave 1: the World 4 core pages (w4.ts).
      add(safe(() => riftPicture(state)));
      add(safe(() => elitePicture(state)));
      add(safe(() => tomePicture(state)));
      // M26 Wave 2: the W2/W3 gaps' pages (gaps.ts).
      add(safe(() => forgePicture(state)));
      add(safe(() => taskBoardPicture(state)));
      return out.length ? { slotPictures: out } : {};
    },
  };
}
