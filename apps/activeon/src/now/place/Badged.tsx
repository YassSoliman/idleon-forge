// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25: a Now blob with the game's class icon on its corner (characters/ClassBadge.tsx), as on the
// Characters list. The badge and its class table are a lazy chunk (characters/ is lazy-only, and the
// first load has no room for them): the bare blob draws until it arrives, then the badge pins on.
import { lazy, type ReactNode, Suspense } from 'react';

const ClassBadge = lazy(() => import('../../characters/ClassBadge').then((m) => ({ default: m.ClassBadge })));

export function Badged({
  classLabel,
  size,
  children,
}: {
  classLabel: string | undefined;
  size: number;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <ClassBadge classLabel={classLabel} size={size}>
        {children}
      </ClassBadge>
    </Suspense>
  );
}
