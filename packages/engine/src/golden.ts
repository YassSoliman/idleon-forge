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
import { createBubbaModule } from './bubba/module';
import { renderBubbaText } from './bubba/text';
import { createBuildsModule } from './builds/module';
import { createCollectionsModule } from './collections';
import { DEFAULT_MODULES, runEngine } from './core/engine';
import type { EngineModule, ToolboxPort } from './core/module';
import { createGearModule } from './gear';
import { renderGearText } from './gear/render';
import { buildMapView, createMapModule } from './map';
import { lookupOf } from './metapath/knowledge';
import { createMetaPathModule } from './metapath/module';
import { detectStage } from './metapath/stage';
import { buildNowView, CHARACTER_GOAL_CAP, DEFAULT_UI } from './now/build-now-view';
import { EMPTY_PREFS } from './now/prefs';
import { renderBuildsText } from './now/render-builds-text';
import { renderMapText } from './now/render-map-text';
import { renderSystemsText } from './now/render-systems-text';
import { renderNowText } from './now/render-text';
import { renderTimelineText } from './now/render-timeline-text';
import { buildSystemsView } from './now/systems-view';
import { buildTimelineView } from './now/timeline-view';
import { createPicturesModule } from './pictures';
import { buildSystemsHubView } from './pictures/hub-view';
import { classXpActionFor, createPurposeModule, purposeStatusFor, suggestionFor } from './purpose';
import type { EngineResult } from './result';
import { createSessionModule } from './session';
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
  /** M18 TR-10: the `## Gear` section (each character's lit slot and slot words, the Smithy). */
  renderGear(input: GoldenInput): string;
  /** M23 TR-10: the `## Bubba` section (the step, the bonus list, the next Megaflesh, Charisma). */
  renderBubba(input: GoldenInput): string;
  /** M21 TR-8: the `## Builds` section (area C; a stub line until the Build path ships). */
  renderBuilds(input: GoldenInput): string;
  /** M21 TR-9: the `## Map` section (area M; a stub line until the Map ships). */
  renderMap(input: GoldenInput): string;
  /**
   * M21 FR-N3: the Next Action entries shown on 3 or more characters (in their first
   * CHARACTER_GOAL_CAP Goals), with those characters' indexes. `kb golden` requires a `groupText` on each.
   */
  repeatedJobs(input: GoldenInput): RepeatedJob[];
}

/** M21 FR-N3: one Next Action entry shown on several characters. */
export interface RepeatedJob {
  entryId: string;
  characters: number[];
}

/** The entries whose Next Action shows on at least `min` characters' visible Goals, by entry id. */
export function repeatedJobsOf(result: EngineResult, min = 3): RepeatedJob[] {
  const by = new Map<string, Set<number>>();
  for (const c of result.characters)
    for (const g of c.goals.slice(0, CHARACTER_GOAL_CAP)) {
      const id = g.nextAction.entryId;
      by.set(id, (by.get(id) ?? new Set()).add(c.index));
    }
  return [...by]
    .filter(([, set]) => set.size >= min)
    .map(([entryId, set]) => ({ entryId, characters: [...set].sort((a, b) => a - b) }))
    .sort((a, b) => (a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0));
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
    // M18: before M14's step, which builds its Goals' Walkthroughs.
    createGearModule({ kb }),
    createWalkthroughModule({ kb }),
    createStarSignsModule({ kb }),
    ...createM20Modules({ kb }),
    createAlchemyModule({ kb }),
    createBubbaModule({ kb, registry: input.registries.knowledge }),
    // M21 Phase F: the area modules' stubs, registered once (spec §9).
    createSessionModule(),
    createMapModule(),
    createPicturesModule(),
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
    return renderSystemsText(
      buildSystemsHubView(
        result,
        EMPTY_PREFS,
        { now: input.now },
        buildSystemsView(result, EMPTY_PREFS, { now: input.now }),
      ),
    );
  },
  renderAlchemy: (input) => renderAlchemyText(goldenResult(input).alchemy ?? null),
  renderBubba: (input) => renderBubbaText(goldenResult(input).bubba ?? null, input.now),
  renderGear: (input) => {
    const result = goldenResult(input);
    const c = (i: number) => result.characters.find((x) => x.index === i);
    return renderGearText(result.gear, saveOrderLabel(input.state), (i) =>
      c(i) ? `${c(i)?.classLabel} ${c(i)?.level}` : '?',
    );
  },
  repeatedJobs: (input) => repeatedJobsOf(goldenResult(input)),
  renderBuilds: (input) => {
    const result = goldenResult(input);
    const c = (i: number) => result.characters.find((x) => x.index === i);
    return renderBuildsText(result, {
      label: saveOrderLabel(input.state),
      classOf: (i) => (c(i) ? `${c(i)?.classLabel} ${c(i)?.level}` : '?'),
    });
  },
  renderMap: (input) => {
    const result = goldenResult(input);
    const lastCloudSave = input.state.account.lastCloudSave;
    const now = buildNowView(result, EMPTY_PREFS, { ...DEFAULT_UI, now: input.now, lastCloudSave });
    const c = (i: number) => result.characters.find((x) => x.index === i);
    return renderMapText(buildMapView(result, now), {
      label: saveOrderLabel(input.state),
      classOf: (i) => (c(i) ? `${c(i)?.classLabel} ${c(i)?.level}` : '?'),
    });
  },
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
