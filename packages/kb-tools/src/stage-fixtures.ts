// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-0a: the stage fixtures. No public save is below World 4, so two early-stage saves are built
// from first.json (the only W4-entry public save) by key edits, by this script only: a fixture that
// fails is rebuilt here, never hand-edited.
//  - stage-w1-early: one character at class level 8, no world finished, every World 2+ key removed.
//  - stage-w3-mid: World 3 not finished (no Carpenter Cardinal dialogue), no World 3-late marker (Nullo
//    Salt locked, no Galaxial Amethyst), every World 4 key removed.
// `kb stage-fixtures` writes them; `--check` (CI, via the test) rebuilds in memory and fails on any
// difference, an empty parse, or a Stage other than the intended one.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile } from './compile';
import { loadSource } from './load';
import { accountStateOfExport } from './parse';
import { ENGINE, KNOWLEDGE, PUBLIC_FIXTURES } from './paths';

export const STAGE_FIXTURE_DIR = path.join(KNOWLEDGE, 'test/fixtures/m26');

type Data = Record<string, unknown>;
interface Export {
  data: Data;
  charNames: string[];
  lastUpdated: number;
  [k: string]: unknown;
}

const parsed = (v: unknown): unknown => (typeof v === 'string' ? JSON.parse(v) : v);
const asStored = (orig: unknown, v: unknown): unknown => (typeof orig === 'string' ? JSON.stringify(v) : v);
const edit = (d: Data, key: string, f: (v: unknown) => unknown) => {
  if (key in d) d[key] = asStored(d[key], f(parsed(d[key])));
};
const slotOf = (k: string): number | null => {
  const m = /_(\d+)$/.exec(k);
  return m ? Number(m[1]) : null;
};

/** World 4 keys of the save (Lab, Breeding and its Mobs, Cooking, Territory, the Rift). */
const W4_KEYS = ['Lab', 'Breeding', 'Cooking', 'Meals', 'Territory', 'Rift', 'Pets', 'PetsStored'];
/** World 3 keys (Construction, Refinery, Worship, Atoms, Shrines, Prayers, the Printer, Equinox, traps, cogs). */
const W3_KEYS = [
  'Tower',
  'Refinery',
  'SaltLick',
  'Atoms',
  'Shrine',
  'PrayOwned',
  'Print',
  'PrinterXtra',
  'TotemInfo',
  'Dream',
  'CogM',
  'CogO',
];
const W3_CHAR_KEYS = ['Prayers', 'PldTraps'];
/** World 2 keys (Alchemy, Obols, the Arcade, the Bug Catching info, Killroy, the Weekly Boss, the flags). */
const W2_KEYS = [
  'CauldronBubbles',
  'CauldUpgLVs',
  'CauldUpgXPs',
  'CauldronInfo',
  'CauldronJobs0',
  'CauldronJobs1',
  'CauldronP2W',
  'ObolEqMAPz1',
  'ObolEqMAPz2',
  'ObolEqO1',
  'ObolEqO2',
  'ObolInvOr',
  'ObolInvOwn',
  'ArcadeUpg',
  'ArcUnclaim',
  'BugInfo',
  'KRbest',
  'WeeklyBoss',
  'FlagP',
  'FlagU',
];
/** The NPCs a character talks to past each world's exit (Toolbox isWorldFinished). */
const GATEKEEPERS = ['Builder_Bird', 'Constructor_Crow', 'Carpenter_Cardinal', 'Muhmuguh', 'Lafu_Shi'];

function stageW1Early(src: Export): Export {
  const out = structuredClone(src);
  const d = out.data;
  for (const k of Object.keys(d)) if ((slotOf(k) ?? 0) > 0) delete d[k];
  out.charNames = ['StageOne'];
  for (const k of [...W4_KEYS, ...W3_KEYS, ...W2_KEYS]) delete d[k];
  for (const k of W3_CHAR_KEYS) delete d[`${k}_0`];
  edit(d, 'Lv0_0', (v) =>
    Array.isArray(v) ? [8, ...v.slice(1).map((x) => (typeof x === 'number' && x > 0 ? 1 : x))] : v,
  );
  edit(d, 'NPCdialogue_0', () => ({}));
  // No quest done: a later world's gate quest would imply that world (M2 TR-6a).
  edit(d, 'QuestComplete_0', () => ({}));
  edit(d, 'CharacterClass_0', () => 1);
  return out;
}

function stageW3Mid(src: Export): Export {
  const out = structuredClone(src);
  const d = out.data;
  out.charNames = src.charNames.map((_, i) => `Stage${i + 1}`);
  for (const k of W4_KEYS) delete d[k];
  for (const k of Object.keys(d))
    if (/^NPCdialogue_\d+$/.test(k))
      edit(d, k, (v) => {
        const o = { ...(v as Record<string, unknown>) };
        for (const g of GATEKEEPERS.slice(2)) delete o[g];
        return o;
      });
  // No World 4 quest done (Gobo's would imply World 3 finished, M2 TR-6a).
  for (const k of Object.keys(d))
    if (/^QuestComplete_\d+$/.test(k))
      edit(d, k, (v) =>
        Object.fromEntries(
          Object.entries(v as Record<string, unknown>).filter(([q]) => !q.startsWith('Gobo')),
        ),
      );
  // No World 3-late marker: Nullo Salt (Refinery salt 6) locked, no Galaxial Amethyst held.
  edit(d, 'Refinery', (v) => {
    const r = v as unknown[];
    const salt = r[8];
    if (Array.isArray(salt)) r[8] = [0, ...salt.slice(1).map(() => 0)];
    return r;
  });
  for (const k of ['ChestOrder', ...Object.keys(d).filter((x) => /^InventoryOrder_\d+$/.test(x))])
    edit(d, k, (v) => (Array.isArray(v) ? v.map((x) => (x === 'Crystal3' ? 'Blank' : x)) : v));
  return out;
}

export const STAGE_FIXTURES: ReadonlyArray<{ id: string; stage: string; build: (src: Export) => Export }> = [
  { id: 'stage-w1-early', stage: 'W1-early', build: stageW1Early },
  { id: 'stage-w3-mid', stage: 'W3-mid', build: stageW3Mid },
];

const text = (e: Export) => `${JSON.stringify(e, null, 1)}\n`;

/** Builds both fixtures; with `check`, compares with the committed files instead of writing them. */
export async function runStageFixtures(opts: { check?: boolean } = {}): Promise<string[]> {
  const src = JSON.parse(readFileSync(path.join(PUBLIC_FIXTURES, 'first.json'), 'utf8')) as Export;
  const kb = await compile(loadSource(), { git: null });
  const engine = (await import(pathToFileURL(path.join(ENGINE, 'src/metapath/index.ts')).href)) as {
    detectStage: (s: unknown, kb: unknown) => { id: string | null };
    lookupOf: (kb: unknown) => unknown;
  };
  const problems: string[] = [];
  for (const f of STAGE_FIXTURES) {
    const built = f.build(src);
    const state = accountStateOfExport(built, built.lastUpdated);
    if (state.characters.length === 0 || Object.keys(state.account).length < 5)
      problems.push(`${f.id}: empty parse`);
    const stage = engine.detectStage(state, engine.lookupOf(kb)).id;
    if (stage !== f.stage) problems.push(`${f.id}: the classifier says ${stage}, not ${f.stage}`);
    const file = path.join(STAGE_FIXTURE_DIR, `${f.id}.json`);
    if (opts.check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== text(built))
        problems.push(`${f.id}: differs from its script (run pnpm kb stage-fixtures)`);
    } else {
      mkdirSync(STAGE_FIXTURE_DIR, { recursive: true });
      writeFileSync(file, text(built));
    }
  }
  return problems;
}
