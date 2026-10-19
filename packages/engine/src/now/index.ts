// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `@idleon-forge/engine/now`: the view layer the UI thread imports at runtime (M10 TR-1). It must
// import no Detector, no engine module and nothing from toolbox-parsers. Builders that only lazy parts
// call have their own subpaths, so the first load never carries them (M21 TR-12): `./session-view`
// (the Now counter's session view), `./systems-ui`, `./characters-ui` and `./map`.
export { invariantViolations } from '../core/invariants';
export { buildMapView } from '../map/view';
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
export { type ChecklistUi, checklistView } from './checklist-view';
export {
  aboutDuration,
  agoSpan,
  clockAt,
  compact,
  formatAge,
  formatCoins,
  inSpan,
  plural,
  shortDuration,
  span,
} from './format';
export {
  dismissActive,
  EMPTY_PREFS,
  type NowPrefs,
  nextLocalMidnight,
  PREFS_CAP,
  pruneDismissals,
  pruneSkips,
  pruneTicks,
  SESSION_GAP_MS,
  type SessionClock,
  type SkipEntry,
  sessionEndsAt,
  skipActive,
  skipExpiresAt,
} from './prefs';
export { BUILDS_NOT_BUILT, renderBuildsText } from './render-builds-text';
export { MAP_NOT_BUILT, renderMapText } from './render-map-text';
export { renderSystemsText } from './render-systems-text';
export { type RenderTextOptions, renderNowText } from './render-text';
export { renderTimelineText } from './render-timeline-text';
export { skillGridView, skillsHref, skillsView } from './skills-view';
export { buildSlotsView } from './slots-view';
export { signsHref, starSignsView } from './star-signs-view';
export { SYSTEM_HOMES, type SystemHome, tabHomeOf, timelineHome } from './system-homes';
export { buildSystemPageView, buildSystemsView, type SystemsUi, seeItSystem } from './systems-view';
export {
  buildAfkStripView,
  buildTimelineView,
  limitsBeforeBack,
  type TimelineUi,
  type TimeStyle,
  timelineAxisEnd,
} from './timeline-view';
export type * from './view';
export * from './view-words';
