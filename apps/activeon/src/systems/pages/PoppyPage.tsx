// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55 (Wave 6): Poppy's page on the System template: the pond, the Megafish ladder and spirals,
// the Tar Pit and the bonuses (systems/w1/poppy.tsx); the thin page while the pond is unread.
import type { FullPageProps } from '../pages';
import { poppySections } from '../w1/poppy';
import { FramedSections } from '../w23/framed';

export default function PoppyPage(p: FullPageProps) {
  return <FramedSections {...p} sections={poppySections(p)} />;
}
