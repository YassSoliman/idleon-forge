// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51 (Wave 4): Orion's page on the System template (systems/w1/owl.tsx); the thin page when the
// save has no Owl (it predates Orion).
import type { FullPageProps } from '../pages';
import { owlSections } from '../w1/owl';
import { FramedSections } from '../w23/framed';

export default function OwlPage(p: FullPageProps) {
  return <FramedSections {...p} sections={owlSections(p)} />;
}
