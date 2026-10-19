// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-10: the converted drafts are exactly what `kb convert-drafts` builds from the research notes,
// with no duplicate id, every draft schema-valid and held as `status: draft`.
import { describe, expect, it } from 'vitest';
import { convertDrafts, runConvertDrafts } from '../src/convert-drafts';
import { loadSource } from '../src/load';

describe('kb convert-drafts (M26 FR-10)', () => {
  it('the committed output matches the script, with no duplicate id', () => {
    expect(runConvertDrafts({ check: true })).toEqual([]);
  }, 120_000);

  it('every converted draft loads as a draft, and none shadows a live id', () => {
    const { report } = convertDrafts();
    const src = loadSource();
    expect(src.drafts.length).toBe(report.drafts);
    expect(src.drafts.every((d) => d.value.status === 'draft')).toBe(true);
    const live = new Set(src.authored.map((e) => e.value.id));
    expect(src.drafts.filter((d) => live.has(d.value.id))).toEqual([]);
    expect(src.issues.filter((i) => i.level === 'error' && i.file.includes('.drafts.yaml'))).toEqual([]);
  }, 120_000);
});
