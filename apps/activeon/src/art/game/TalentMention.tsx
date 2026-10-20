// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <TalentMention>: the game icon of the talent a sentence names (a Now card, a Walkthrough step, a
// Goal), else `fallback`. The talent table loads in its own chunk (talent-mention-impl), so the first
// screen draws the fallback and then the icon, in the same fixed box.
import { type ReactNode, Suspense } from 'react';
import { lazyPart } from '../../lazy-part';

const Impl = lazyPart(
  () => import('./talent-mention-impl'),
  (m) => m.TalentMentionImpl,
);

export function TalentMention({
  text,
  fallback,
  size,
}: {
  text: string;
  fallback: ReactNode;
  size: 16 | 24 | 32 | 48 | 64;
}) {
  return (
    <Suspense fallback={fallback}>
      <Impl text={text} fallback={fallback} size={size} />
    </Suspense>
  );
}
