// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17 (Wave 1): the Elite classes page on the System template: the six elites, who holds each and
// who is on the way (systems/w4/elite.tsx); the thin page when no character's step can be read.
import type { FullPageProps } from '../pages';
import { eliteSections } from '../w4/elite';
import { FramedSections } from '../w23/framed';

export default function EliteClassesPage(p: FullPageProps) {
  return <FramedSections {...p} sections={eliteSections(p)} />;
}
