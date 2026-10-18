// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `@idleon-forge/engine/now`: the view layer the UI thread imports at runtime (M10 TR-1). It must
// import no Detector, no engine module and nothing from toolbox-parsers.
export { invariantViolations } from '../core/invariants';
export {
  ACCOUNT_GOAL_CAP,
  buildNowView,
  CHARACTER_GOAL_CAP,
  DEFAULT_UI,
  displayOrder,
  EXPECTED_RETURN_CHIPS,
  goalView,
  milestoneText,
  NOT_COVERED_BANNER,
  type NowUi,
  SPEND_LINE_CAP,
  safeHref,
  sourceView,
  spendLineKey,
} from './build-now-view';
export { buildHref, buildsView } from './build-view';
export { cardsHref, cardsView } from './cards-view';
export { aboutDuration, compact, formatAge, plural, shortDuration } from './format';
export {
  dismissActive,
  EMPTY_PREFS,
  type NowPrefs,
  nextLocalMidnight,
  PREFS_CAP,
  pruneDismissals,
  pruneSkips,
  SESSION_GAP_MS,
  type SessionClock,
  type SkipEntry,
  sessionEndsAt,
  skipActive,
  skipExpiresAt,
} from './prefs';
export { type RenderTextOptions, renderNowText } from './render-text';
export { renderSystemsText } from './render-views-text';
export { SYSTEM_HOMES, type SystemHome, tabHomeOf } from './system-homes';
export { buildSystemPageView, buildSystemsView, type SystemsUi, seeItSystem } from './systems-view';
export type * from './view';
export * from './view-words';
