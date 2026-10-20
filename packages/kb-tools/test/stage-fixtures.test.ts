// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-0a: the committed stage fixtures are exactly what their script builds from first.json, parse
// to a non-empty Account State, and land on their intended Stage.
import { describe, expect, it } from 'vitest';
import { runStageFixtures } from '../src/stage-fixtures';

describe('stage fixtures (M26 FR-0a)', () => {
  it('stage-w1-early and stage-w3-mid match their script, parse, and classify as intended', async () => {
    expect(await runStageFixtures({ check: true })).toEqual([]);
  }, 120_000);
});
