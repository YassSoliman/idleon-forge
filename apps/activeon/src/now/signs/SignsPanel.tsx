// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs: the Star Chart section the Account shows (area S). Since M21 (TR-12) it is a lazy part,
// so its body (systems/StarChart.tsx) stays out of the first load; the Account keeps importing this name.
// The Signs tab's status line is signs-status.ts (area C); the tab itself is SignsTab.tsx.
import type { NowView } from '@idleon-forge/engine/now';
import { lazyPart, retryable } from '../../lazy-part';

const starChart = retryable(() => import('../../systems/StarChart'));

/** The Star Chart section in the Account: points, unlocked signs, the next constellations, per character. */
export const StarChartSection = lazyPart<{ view: NowView }>(() =>
  starChart().then((m) => m.StarChartSection),
);

export const STAR_CHART_OPEN = 'star-chart-open';
