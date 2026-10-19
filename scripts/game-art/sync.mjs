#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// (This script is GPL-3.0-only. The images it copies are NOT: they are Legends of IdleOn art,
// (c) LavaFlame2, see apps/activeon/public/game-art/NOTICE.md and ADR 0009.)
//
// Copies the game sprites ActiveOn draws from IdleOn Toolbox's image folder, at the Toolbox commit
// pinned in packages/toolbox-parsers/UPSTREAM, into apps/activeon/public/game-art/ (ADR 0009 as
// amended 2026-10-19). One sparse, shallow fetch of only the files we ship; no runtime hotlinking.
//
// Output, every file renamed to the id ActiveOn already holds (so the lookup is a template string):
//   items/<item rawName>.png      every item in Toolbox's items.json (gear, materials, stamps, statues...)
//   cards/<card rawName>.png      Toolbox draws a card from data/2Cards<cardIndex>.png
//   talents/<skillIndex>.png      data/UISkillIcon<skillIndex>.png
//   bubbles/<bubble rawName>.png  data/aUpgrades<G|O|P|Y><index>.png, kept as is
//   vials/<level>.png             data/aVials<level>.png (the jar by vial level)
//   classes/<classIndex>.png      data/ClassIcons<classIndex>.png
//   monsters/<monster rawName>.png monsters/<rawName>/static.png
//   manifest.json                 the pin and every shipped file per kind (tests read it; the app doesn't)
//
// Usage: node scripts/game-art/sync.mjs [--check]
//   --check  fetch nothing; exit 1 when manifest.json's pin is not UPSTREAM's commit or a listed file
//            is missing (the guard test runs the same check).
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PIN = join(ROOT, 'packages/toolbox-parsers/UPSTREAM');
const DATA = join(ROOT, 'packages/toolbox-parsers/vendor/data/website-data');
const OUT = join(ROOT, 'apps/activeon/public/game-art');
const WORK = join(ROOT, 'scripts/game-art/.upstream');
const KINDS = ['items', 'cards', 'talents', 'bubbles', 'vials', 'classes', 'monsters'];

const pin = Object.fromEntries(
  readFileSync(PIN, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);

if (process.argv.includes('--check')) {
  const m = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
  const bad = [];
  if (m.commit !== pin.commit) bad.push(`manifest pin ${m.commit} != UPSTREAM ${pin.commit}`);
  for (const k of KINDS)
    for (const id of m.files[k] ?? [])
      if (!existsSync(join(OUT, k, `${id}.png`))) bad.push(`${k}/${id}.png missing`);
  if (bad.length) {
    console.error(bad.slice(0, 20).join('\n'));
    process.exit(1);
  }
  console.log('game-art matches the pin');
  process.exit(0);
}

const git = (...a) =>
  execFileSync('git', ['-C', WORK, ...a], { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const loadJson = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
if (!existsSync(join(DATA, 'items.json'))) {
  console.error('vendor/data is missing: run `pnpm --filter @idleon-forge/toolbox-parsers build` first');
  process.exit(1);
}
const items = loadJson('items.json');
const cards = loadJson('cards.json');

// 1. One sparse, shallow, blob-less fetch of the pinned commit, then a checkout of only our patterns.
const url = process.env.UPSTREAM_FETCH_URL ?? pin.repo;
if (!existsSync(join(WORK, '.git'))) {
  mkdirSync(WORK, { recursive: true });
  git('init', '--quiet');
  git('remote', 'add', 'origin', url);
}
git('sparse-checkout', 'set', '--no-cone', '/public/data/*.png', '/public/monsters/*/static.png');
git('fetch', '--quiet', '--depth=1', '--filter=blob:none', 'origin', pin.commit);
git('-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--force', 'FETCH_HEAD');
const resolved = git('rev-parse', 'HEAD').trim();
if (resolved !== pin.commit) throw new Error(`fetched ${resolved}, expected ${pin.commit}`);

// 2. Pick and rename.
const src = join(WORK, 'public/data');
const have = new Set(readdirSync(src));
const picks = { items: [], cards: [], talents: [], bubbles: [], vials: [], classes: [], monsters: [] };
const add = (kind, id, from) => picks[kind].push({ id, from });
for (const raw of Object.keys(items)) if (have.has(`${raw}.png`)) add('items', raw, join(src, `${raw}.png`));
for (const c of Object.values(cards)) {
  const f = `2Cards${c.cardIndex}.png`;
  if (have.has(f)) add('cards', c.rawName, join(src, f));
}
for (const f of have) {
  let m = /^UISkillIcon(\d+)\.png$/.exec(f);
  if (m) add('talents', m[1], join(src, f));
  m = /^(aUpgrades[GOPY]\d+)\.png$/.exec(f);
  if (m) add('bubbles', m[1], join(src, f));
  m = /^aVials(\d+)\.png$/.exec(f);
  if (m) add('vials', m[1], join(src, f));
  m = /^ClassIcons(\d+)\.png$/.exec(f);
  if (m) add('classes', m[1], join(src, f));
}
const mons = join(WORK, 'public/monsters');
for (const d of readdirSync(mons)) {
  const f = join(mons, d, 'static.png');
  if (existsSync(f)) add('monsters', d, f);
}

// 3. Write: wipe our kind folders (never the NOTICE), copy byte for byte, list them.
const files = {};
for (const k of KINDS) {
  rmSync(join(OUT, k), { recursive: true, force: true });
  mkdirSync(join(OUT, k), { recursive: true });
  const ids = picks[k].map((p) => p.id).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  for (const p of picks[k]) copyFileSync(p.from, join(OUT, k, `${p.id}.png`));
  files[k] = ids;
}
writeFileSync(
  join(OUT, 'manifest.json'),
  `${JSON.stringify({ source: pin.repo, commit: pin.commit, gameVersion: pin.gameVersion, files }, null, 0)}\n`,
);
console.log(
  `game-art @ ${pin.commit.slice(0, 7)}: ${KINDS.map((k) => `${files[k].length} ${k}`).join(', ')}`,
);
