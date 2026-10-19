// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-0b: the Tome page, registered in FULL_PAGES so the System has its home. Wave 1 (FR-16)
// draws it on the System template; until then it is the thin page (frame/SimplePage.tsx).
import { SimplePage } from '../frame/SimplePage';
import type { FullPageProps } from '../pages';

export default function TomePage({ s, page }: FullPageProps) {
  return <SimplePage s={s} page={page} />;
}
