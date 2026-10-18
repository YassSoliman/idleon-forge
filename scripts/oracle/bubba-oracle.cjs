#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Runs the game's own Bubba code on one save and prints the values ActiveOn derives (ADR 0010, M23 X1).
// It extracts `_customBlock_Bubbastuff`, `cb.BubbaUpg` and `cb.Spelunky` verbatim from the game client
// (N.js) and evaluates them in a node:vm sandbox over the save's raw `Bubba` record. Nothing is written
// anywhere; N.js is read from --n or downloaded to the OS temp folder, never into the repo.
//
// Usage: node scripts/oracle/bubba-oracle.cjs <save.json> [--n <N.js>] [--companion51 <x>]
//   --companion51  the game's Companions(51) for this account (Toolbox's companion list `.bonus`,
//                  0 when the companion isn't active). It is a lookup, not Bubba math.
// See scripts/oracle/README.md.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

// The client URL changes per patch; packages/truth/src/game-data.ts records the current one.
const N_JS_URL = 'https://www.legendsofidleon.com/ytGl5oc/N.js';

function args(argv) {
  const out = { save: null, n: null, companion51: 0 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--n') out.n = argv[++i];
    else if (argv[i] === '--companion51') out.companion51 = Number(argv[++i]);
    else out.save = argv[i];
  }
  if (!out.save || !Number.isFinite(out.companion51)) {
    console.error('usage: bubba-oracle.cjs <save.json> [--n <N.js>] [--companion51 <x>]');
    process.exit(2);
  }
  return out;
}

async function readClient(file) {
  if (file) return fs.readFileSync(file, 'utf8');
  const cached = path.join(os.tmpdir(), 'idleon-forge-N.js');
  if (!fs.existsSync(cached)) {
    const res = await fetch(N_JS_URL);
    if (!res.ok) throw new Error(`N.js download failed: HTTP ${res.status}`);
    fs.writeFileSync(cached, await res.text());
    console.error(`downloaded ${N_JS_URL} -> ${cached}`);
  }
  return fs.readFileSync(cached, 'utf8');
}

/** The source of `<start>function(...){...}`, braces matched outside string literals. */
function grab(src, start) {
  const i = src.indexOf(start);
  if (i < 0) throw new Error(`not found in N.js: ${start}`);
  let depth = 0;
  let quote = null;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    const ch = src[k];
    if (quote) {
      if (ch === '\\') k++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return src.slice(src.indexOf('=', i) + 1, k + 1);
  }
  throw new Error(`unbalanced: ${start}`);
}

async function main() {
  const opt = args(process.argv.slice(2));
  const client = await readClient(opt.n);
  const save = JSON.parse(fs.readFileSync(opt.save, 'utf8'));
  const data = save.data ?? save;
  const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
  const original = parse(data.Bubba);
  if (!Array.isArray(original)) throw new Error('the save has no Bubba record');

  const state = {
    Bubba: structuredClone(original),
    DNSM: { h: {} },
    OptionsListAccount: parse(data.OptLacc) ?? [],
    companion51: opt.companion51,
  };
  const sandbox = {
    Math,
    state,
    a: { engine: { getGameAttribute: (k) => (k === 'CustomLists' ? sandbox.lists : state[k]) } },
    c: { asNumber: Number },
    // N.js: k._customBlock_getLOG and k._customBlock_Log2, verbatim
    k: {
      // biome-ignore lint/suspicious/noApproximativeNumericConstant: the game divides by 2.30259, not Math.LN10.
      _customBlock_getLOG: (x) => Math.log(Math.max(x, 1)) / 2.30259,
      _customBlock_Log2: (x) => Math.log(Math.max(x, 1)) / Math.log(2),
    },
    // Outside Bubba. Minehead and the menagerie cheapener scale every UpgCost alike, so they cancel in
    // the cost ratios this script prints; it never prints a cost itself.
    q: { _customBlock_MenagerieStuff: () => 1 },
    m: { _customBlock_Minehead: () => 0, _customBlock_Companions: () => state.companion51 },
  };
  vm.createContext(sandbox);
  sandbox.lists = {
    h: {
      BubbaUpg: vm.runInContext(`(${grab(client, 'cb.BubbaUpg=function')})()`, sandbox),
      Spelunky: vm.runInContext(`(${grab(client, 'cb.Spelunky=function')})()`, sandbox),
    },
  };
  sandbox.m._customBlock_Bubbastuff = vm.runInContext(
    `(${grab(client, '_customBlock_Bubbastuff=function')})`,
    sandbox,
  );
  const B = (name, b = 0, e = 0) => sandbox.m._customBlock_Bubbastuff(name, b, e);
  /** Evaluate `f` on a copy of the record changed by `edit`. */
  const edited = (edit, f) => {
    const saved = state.Bubba;
    state.Bubba = structuredClone(saved);
    edit(state.Bubba);
    try {
      return f();
    } finally {
      state.Bubba = saved;
    }
  };

  const boon = Number(state.Bubba[1][3]);
  const ring = (boon % 7) + 1;
  const boonNow = B('BubbaRoG_Bonuses', ring);
  const boonNext = edited(
    (x) => {
      x[1][3] = boon + 1;
    },
    () => B('BubbaRoG_Bonuses', ring),
  );
  B('BubbaRoG_Bonuses', 1);
  const megafleshMultiplier = 1 + state.DNSM.h.Bubba_RoG_all / 100;
  const cost0 = B('UpgCost', 0);
  const discountNextRatio = [4, 18, 26].map(
    (i) =>
      edited(
        (x) => {
          x[1][i] = Number(x[1][i]) + 1;
        },
        () => B('UpgCost', 0),
      ) / cost0,
  );
  const traits = [0, 1, 2, 3, 4, 5];
  const charismaBonus = traits.map((i) => B('CharismaBonus', i));
  const charismaBonusNext = traits.map((i) =>
    edited(
      (x) => {
        x[3][i] = Number(x[3][i]) + 1;
      },
      () => B('CharismaBonus', i),
    ),
  );
  // The ActorEvents_713 tick run to the end: fold Bubba[0][7] * CharismaTraitSPD into Bubba[0][8] (the game
  // does this once TotalUpgTypesAvailable > 5; pass a save past that), then level while XP >= REQ. Uncapped:
  // every level goes to attribute 0, which CharismaTraitREQ only reads through the total.
  const charismaLevelsBanked = edited(
    () => {},
    () => {
      const x = state.Bubba;
      x[0][8] = Number(x[0][8]) + Number(x[0][7]) * B('CharismaTraitSPD');
      x[0][7] = 0;
      let levels = 0;
      while (levels < 10000 && x[0][8] >= B('CharismaTraitREQ')) {
        x[0][8] -= B('CharismaTraitREQ');
        x[3][0] = Math.round(Number(x[3][0]) + 1);
        levels++;
      }
      return levels;
    },
  );

  const out = {
    save: path.basename(opt.save),
    companion51: opt.companion51,
    boonLevel: boon,
    nextBoonBonus: ring,
    happiness: Number(state.Bubba[0][1]),
    patsPerHour: B('DailyPetting'),
    charismaXpReq: B('CharismaTraitREQ'),
    charismaXpPerSec: B('CharismaTraitSPD'),
    charismaLevelsBanked,
    charismaBonus,
    charismaBonusNext,
    boonNextDelta: boonNext - boonNow,
    megafleshMultiplier,
    discountNextRatio,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
