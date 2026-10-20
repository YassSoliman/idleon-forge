// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16 (Wave 1): the Tome page on the System template: PTS, the next gates and every metric
// (systems/w4/tome.tsx); the thin page when the save has no Tome.
import type { FullPageProps } from '../pages';
import { tomeSections } from '../w4/tome';
import { FramedSections } from '../w23/framed';

export default function TomePage(p: FullPageProps) {
  return <FramedSections {...p} sections={tomeSections(p)} />;
}
