// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The sheets the first screen can open (the crest, the overflow menu, Settings, "Change" on the return
// line, the sign-in code) load with their first opening, so the Sheet atom stays out of the first load
// (M21 TR-12). Closed, it renders nothing; open, it is the ModalSheet.
import { Suspense } from 'react';
import type { SheetProps } from '../../design/atoms/Sheet';
import { lazyPart } from '../../lazy-part';

const Part = lazyPart(
  () => import('./ModalSheet'),
  (m) => m.ModalSheet,
);

export function LazySheet(props: SheetProps) {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <Part {...props} />
    </Suspense>
  );
}
