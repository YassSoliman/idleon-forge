// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-3: the World 4 bands and the beyond policy every module's Stage filter uses.
import { describe, expect, it } from 'vitest';
import { appliesAtStage, STAGE_DEFINITIONS, STAGES, stagesOf } from '../src';
import { AppliesTo } from '../src/schema';

describe('Stages (M26 FR-3)', () => {
  it('has W4-mid and W4-late after W4-entry, labelled and in World 4', () => {
    expect(STAGES.slice(-3)).toEqual(['W4-entry', 'W4-mid', 'W4-late']);
    expect(STAGE_DEFINITIONS['W4-mid'].label).toBe('World 4, mid');
    expect(STAGE_DEFINITIONS['W4-late']).toEqual({ id: 'W4-late', label: 'World 4, late', world: 4 });
  });

  it('beyond policy: a range ending at W4-entry or later stays live through W4-late', () => {
    expect(appliesAtStage({ stages: [{ from: 'W3-early', to: 'W4-entry' }] }, 'W4-late')).toBe(true);
    expect(appliesAtStage({ stages: ['W4-entry'] }, 'W4-mid')).toBe(true);
    expect(appliesAtStage({ stages: [{ from: 'W4-mid', to: 'W4-mid' }] }, 'W4-late')).toBe(true);
    expect(appliesAtStage({ stages: [{ from: 'W4-mid', to: 'W4-late' }] }, 'W4-entry')).toBe(false);
    // Earlier ranges keep their end.
    expect(appliesAtStage({ stages: [{ from: 'W1-mid', to: 'W3-late' }] }, 'W4-entry')).toBe(false);
    expect(appliesAtStage({ stages: ['W3-late'] }, 'W4-entry')).toBe(false);
  });

  it('stopsAt cuts the range, open-ended or not', () => {
    const scope = { stages: [{ from: 'W3-early', to: 'W4-entry' }], stopsAt: 'W4-mid' } as const;
    expect(stagesOf(scope)).toEqual(['W3-early', 'W3-mid', 'W3-late', 'W4-entry']);
    expect(appliesAtStage(scope, 'W4-mid')).toBe(false);
    expect(appliesAtStage({ stages: 'all', stopsAt: 'W2-early' }, 'W2-early')).toBe(false);
    expect(appliesAtStage({ stages: 'all', stopsAt: 'W2-early' }, 'W1-late')).toBe(true);
  });

  it('an unknown Stage never hides an entry', () => {
    expect(appliesAtStage({ stages: ['W1-early'] }, null)).toBe(true);
    expect(appliesAtStage({ stages: ['W1-early'] }, 'unknown')).toBe(true);
  });

  it('the schema accepts stopsAt and the new Stages', () => {
    expect(AppliesTo.parse({ stages: [{ from: 'W4-entry', to: 'W4-late' }], stopsAt: 'W4-late' })).toEqual({
      stages: [{ from: 'W4-entry', to: 'W4-late' }],
      stopsAt: 'W4-late',
    });
    expect(() => AppliesTo.parse({ stages: ['W5-early'] })).toThrow();
  });
});
