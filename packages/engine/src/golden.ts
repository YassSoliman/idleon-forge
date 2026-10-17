// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine side of M11's golden harness (M11 TR-15, M10 TR-15). M11's `kb golden` loads this file
// (packages/engine/src/golden.ts) and calls `goldenEngine.renderNow(input)` for each fixture's
// `## Now` section: renderNowText(buildNowView(engine(fixture), emptyPrefs, { focus: null })).
// The input type mirrors M11's `GoldenInput` structurally, so this file doesn't import
// `@idleon-forge/knowledge` (it may run before M11 merges).
import type { AccountState } from '@idleon-forge/account-state';
import { runEngine } from './core/engine';
import { buildNowView, DEFAULT_UI } from './now/build-now-view';
import { EMPTY_PREFS } from './now/prefs';
import { renderNowText } from './now/render-text';
import type { EngineResult } from './result';

/** The fields of M11's `GoldenInput` this engine reads. */
export interface GoldenInput {
  state: AccountState;
  kb: { version: { display: string } };
  now: number;
  expectedReturnMs: number;
}

export interface GoldenEngine {
  stage(input: GoldenInput): string | null;
  renderNow(input: GoldenInput): string;
}

export function goldenResult(input: GoldenInput): EngineResult {
  return runEngine({
    state: input.state,
    history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
    // The golden file has its own "Not covered yet" section from M11's coverage().
    knowledge: { version: input.kb.version.display, coverage: () => [] },
    now: input.now,
    options: { expectedReturnSeconds: Math.round(input.expectedReturnMs / 1000) },
  });
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
  // M2 owns the Stage; until it ships the header keeps "(engine not built)".
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
};
