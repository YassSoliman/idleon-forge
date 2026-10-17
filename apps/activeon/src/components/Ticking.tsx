// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The only parts of the screen that re-render every second: each owns its own clock (M10 TR-5), so
// the tick never re-renders the roster. None of them is a live region (M10 TR-14).
import { formatAge } from '../format';
import { useNow } from '../use-now';

/** "5m" since `at` (epoch ms), ticking. */
export function Ago({ at }: { at: number }) {
  const now = useNow();
  return <>{formatAge((now - at) / 1000)}</>;
}

/** "29m" until `until` (epoch ms), ticking. */
export function Countdown({ until }: { until: number }) {
  const now = useNow();
  return <>{formatAge(Math.max(0, (until - now) / 1000))}</>;
}
