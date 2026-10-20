// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11 (Wave 1): the Rift page on the System template: this level, coming up and the bonus ladder
// (systems/w4/rift.tsx), the thin page when the save has no Rift record.
import type { FullPageProps } from '../pages';
import { riftSections } from '../w4/rift';
import { FramedSections } from '../w23/framed';

export default function RiftPage(p: FullPageProps) {
  return <FramedSections {...p} sections={riftSections(p)} />;
}
