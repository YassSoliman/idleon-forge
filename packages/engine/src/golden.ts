// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine side of M11's golden harness (M11 TR-15, M10 TR-15). M11's `kb golden` loads this file
// (packages/engine/src/golden.ts) and calls `goldenEngine.renderNow(input)` for each fixture's
// `## Now` section: renderNowText(buildNowView(engine(fixture), emptyPrefs, { focus: null })).
import type { AccountState } from '@idleon-forge/account-state';
import type { CompiledKnowledge, DetectorRegistry } from '@idleon-forge/knowledge';
import { createAfkSafetyModule } from './afk/module';
import { createAlchemyModule } from './alchemy/module';
import { renderAlchemyText } from './alchemy/text';
import { createBuildsModule } from './builds/module';
import { createCollectionsModule } from './collections';
import { DEFAULT_MODULES, runEngine } from './core/engine';
import type { EngineModule, ToolboxPort } from './core/module';
import { lookupOf } from './metapath/knowledge';
import { createMetaPathModule } from './metapath/module';
import { detectStage } from './metapath/stage';
import { buildNowView, DEFAULT_UI } from './now/build-now-view';
import { EMPTY_PREFS } from './now/prefs';
import { renderNowText } from './now/render-text';
import { renderSystemsText, renderTimelineText } from './now/render-views-text';
import { buildSystemsView } from './now/systems-view';
import { buildTimelineView } from './now/timeline-view';
import { classXpActionFor, createPurposeModule, purposeStatusFor, suggestionFor } from './purpose';
import type { EngineResult } from './result';
import { createM20Modules } from './slots';
import { createSpendModule } from './spend';
import { createStarSignsModule } from './starsigns';
import { createUnspentModule } from './unspent';
import { createWalkthroughModule } from './walkthrough';

/** The fields of M11's `GoldenInput` this engine reads. */
export interface GoldenInput {
  state: AccountState;
  /** M11's compiled bundle; tests may pass only its version (no Stage then). */
  kb: { version: { display: string } } & Partial<Omit<CompiledKnowledge, 'version'>>;
  /** M11's discovered registries; the Knowledge Base one feeds M3's Checks. */
  registries?: { knowledge: DetectorRegistry; engine: DetectorRegistry };
  now: number;
  expectedReturnMs: number;
  /** M19 TR-1: Toolbox's bubble cost function (kb golden passes it). */
  toolbox?: ToolboxPort;
}

export interface GoldenEngine {
  stage(input: GoldenInput): string | null;
  renderNow(input: GoldenInput): string;
  /** M17 TR-10: the `## Systems` section (renderSystemsText(buildSystemsView(...))). */
  renderSystems(input: GoldenInput): string;
  /** M17 TR-10 (Phase 2): the `## Timeline` section (renderTimelineText(buildTimelineView(...))). */
  renderTimeline(input: GoldenInput): string;
  /** M19 TR-10: the `## Alchemy` section (pick, per-pot picks, vial pick, roll targets). */
  renderAlchemy(input: GoldenInput): string;
}

/** The worker's modules (M2, and M3 when the bundle and registry are there), so goldens show real Verdicts. */
export function goldenModules(input: GoldenInput): readonly EngineModule[] {
  const kb = input.kb.entries ? (input.kb as CompiledKnowledge) : null;
  if (!kb || !input.registries) return DEFAULT_MODULES;
  const facts = lookupOf(kb);
  const purpose = { kb, registry: input.registries.knowledge };
  return [
    // M15 FR-15: the next family unlock takes M4's top Class XP Next Action.
    createMetaPathModule({ classXpAction: classXpActionFor(purpose) }),
    createAfkSafetyModule({
      kb,
      registry: input.registries.knowledge,
      stage: (s) => detectStage(s, facts),
      purpose: purposeStatusFor(purpose),
      purposeSuggestion: suggestionFor(purpose),
    }),
    createPurposeModule(purpose),
    createUnspentModule({
      kb,
      registry: input.registries.knowledge,
      stage: (s) => {
        const stage = detectStage(s, facts);
        return stage.id ? { id: stage.id } : null;
      },
    }),
    createBuildsModule({ kb }),
    createCollectionsModule({ kb, registry: input.registries.engine }),
    createSpendModule({ kb, stage: (s) => detectStage(s, facts) }),
    createWalkthroughModule({ kb }),
    createStarSignsModule({ kb }),
    ...createM20Modules({ kb }),
    createAlchemyModule({ kb }),
  ];
}

export function goldenResult(input: GoldenInput): EngineResult {
  return runEngine(
    {
      state: input.state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      // The golden file has its own "Not covered yet" section from M11's coverage().
      knowledge: {
        version: input.kb.version.display,
        coverage: () => [],
        kb: input.kb.entries ? (input.kb as CompiledKnowledge) : null,
        // M17 TR-2: the Systems hub's unlock states use the same registries as the golden's findings.
        ...(input.registries ? { registries: [input.registries.knowledge, input.registries.engine] } : {}),
      },
      now: input.now,
      options: { expectedReturnSeconds: Math.round(input.expectedReturnMs / 1000) },
      ...(input.toolbox ? { toolbox: input.toolbox } : {}),
    },
    goldenModules(input),
  );
}

/** C1…Cn in save order, never a name (M11 TR-15 golden slot check). */
export const saveOrderLabel = (state: AccountState) => (index: number) => {
  const order = [...state.characters.map((c) => c.index), ...state.diagnostics.unreadableCharacters].sort(
    (a, b) => a - b,
  );
  const i = order.indexOf(index);
  return i >= 0 ? `C${i + 1}` : `C?${index}`;
};

export const goldenEngine: GoldenEngine = {
  stage: (input) => {
    const s = goldenResult(input).stage;
    return s.id === 'not-covered' ? null : s.id;
  },
  renderNow: (input) => {
    const result = goldenResult(input);
    const view = buildNowView(result, EMPTY_PREFS, {
      ...DEFAULT_UI,
      now: input.now,
      lastCloudSave: input.state.account.lastCloudSave,
      appVersion: 'golden',
    });
    return renderNowText(view, { label: saveOrderLabel(input.state), includeNotCovered: false });
  },
  renderSystems: (input) => {
    const result = goldenResult(input);
    if (!result.systems) return '(no Knowledge Base)';
    return renderSystemsText(buildSystemsView(result, EMPTY_PREFS, { now: input.now }));
  },
  renderAlchemy: (input) => renderAlchemyText(goldenResult(input).alchemy ?? null),
  renderTimeline: (input) => {
    const result = goldenResult(input);
    const lastCloudSave = input.state.account.lastCloudSave;
    const now = buildNowView(result, EMPTY_PREFS, { ...DEFAULT_UI, now: input.now, lastCloudSave });
    const view = buildTimelineView(result, EMPTY_PREFS, now, { now: input.now, lastCloudSave });
    const c = (i: number) => result.characters.find((x) => x.index === i);
    return renderTimelineText(view, {
      label: saveOrderLabel(input.state),
      classOf: (i) => (c(i) ? `${c(i)?.classLabel} ${c(i)?.level}` : '?'),
    });
  },
};
