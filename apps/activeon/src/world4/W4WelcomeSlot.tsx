// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: where Now slots the World 4 welcome. Renders nothing (and fetches nothing) unless the
// account has reached World 4 and a "set up first" step is still open; then the checklist loads as its
// own lazy chunk. I-now places `<W4WelcomeSlot s={s} />` as Now's first block (it carries the screen's
// one `.a-frame` while it shows).
import { Suspense } from 'react';
import { lazyPart } from '../lazy-part';
import type { Session } from '../shell/session';

const Welcome = lazyPart(
  () => import('./W4Welcome'),
  (m) => m.W4Welcome,
);

/** True when Now should show the World 4 welcome (the account reached World 4 and a step is open). */
export const hasW4Welcome = (s: Pick<Session, 'result'>): boolean => Boolean(s.result.world4?.welcome);

export function W4WelcomeSlot({ s }: { s: Session }) {
  const w = s.result.world4?.welcome;
  if (!w) return null;
  return (
    <Suspense fallback={null}>
      <Welcome s={s} w={w} />
    </Suspense>
  );
}
