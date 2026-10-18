#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Re-reads the game-data tables src/game-data.ts copies from the game client, so a patch can be
// checked against them. It reads a local copy of N.js (download it from
// https://www.legendsofidleon.com/ytGl5oc/N.js; never commit it) and prints the class names, the
// TalentOrder table and the offsets of the functions the truth readers follow, then compares them
// with src/game-data.ts and exits 1 on any difference.
// Usage: node packages/truth/scripts/extract-n.mjs <path/to/N.js>
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
if (!file) {
  console.error('usage: extract-n.mjs <path/to/N.js>');
  process.exit(2);
}
const src = readFileSync(file, 'utf8');

const between = (start, end) => {
  const i = src.indexOf(start);
  if (i < 0) throw new Error(`not found: ${start}`);
  return { offset: i, text: src.slice(i + start.length, src.indexOf(end, i + start.length)) };
};
const names = between('ja.ClassNames=function(){return"', '".split(" ")');
const order = between('ja.TalentOrder=function(){return[', ']');
const found = {
  classNames: names.text.split(' '),
  talentOrder: order.text.split(',').map((s) => Number(s.trim())),
  offsets: {
    classNames: names.offset,
    talentOrder: order.offset,
    totalTalentPoints: src.indexOf('_customBlock_TotalTalentPoints=function'),
    returnClasses: src.indexOf('_customBlock_ReturnClasses=function'),
    achieveStatus: src.indexOf('_customBlock_AchieveStatus=function'),
    loadSkillLevels: src.indexOf('u.getLoadMap("SL_"+this._pID)'),
    loadOtherPreset: src.indexOf('u.getLoadMap("SLpre_"+this._pID)'),
  },
};

const here = path.dirname(fileURLToPath(import.meta.url));
const ours = readFileSync(path.join(here, '../src/game-data.ts'), 'utf8');
const list = (name) => {
  const m = new RegExp(`export const ${name}: readonly \\w+\\[\\] = \\[([^\\]]*)\\]`).exec(ours);
  return m
    ? JSON.parse(
        `[${m[1]
          .replace(/\/\/[^\n]*/g, '')
          .replace(/'/g, '"')
          .trim()
          .replace(/,\s*$/, '')}]`,
      )
    : null;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okNames = same(list('CLASS_NAMES'), found.classNames);
const okOrder = same(list('TALENT_ORDER'), found.talentOrder);
console.log(JSON.stringify({ offsets: found.offsets, classNames: okNames, talentOrder: okOrder }, null, 2));
if (!okNames || !okOrder) {
  console.error(
    'game-data.ts differs from this N.js: update the tables and GAME_SOURCES, then re-run the truth tests.',
  );
  process.exit(1);
}
