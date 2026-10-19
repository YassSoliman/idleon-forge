// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { SimplePage } from '../frame/SimplePage';
import type { FullPageProps } from '../pages';

export default function StampsPage({ s, page }: FullPageProps) {
  return <SimplePage s={s} page={page} />;
}
