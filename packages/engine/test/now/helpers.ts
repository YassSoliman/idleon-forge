// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildNowView, DEFAULT_UI, type NowUi } from '../../src/now/build-now-view';
import { EMPTY_PREFS, type NowPrefs } from '../../src/now/prefs';
import type { EngineResult } from '../../src/result';

const DIR = fileURLToPath(new URL('./fixtures/', import.meta.url));

export const FIXTURE_IDS = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

/** A fresh copy of a synthetic view fixture (M10 §4). */
export const fixture = (id: string): EngineResult => JSON.parse(readFileSync(`${DIR}${id}.json`, 'utf8'));

export const uiFor = (r: EngineResult, over: Partial<NowUi> = {}): NowUi => ({
  ...DEFAULT_UI,
  now: r.asOf,
  lastCloudSave: r.asOf - 60_000,
  ...over,
});

export const view = (r: EngineResult, ui: Partial<NowUi> = {}, prefs: Partial<NowPrefs> = {}) =>
  buildNowView(r, { ...EMPTY_PREFS, ...prefs }, uiFor(r, ui));

/** A skip made now, in the result's Play Session. */
export const skipNow = (r: EngineResult, ...keys: string[]): NowPrefs['skips'] =>
  Object.fromEntries(
    keys.map((k) => [k, { midnightAt: r.asOf + 3600_000, sessionStartedAt: r.sessionStartedAt }]),
  );
