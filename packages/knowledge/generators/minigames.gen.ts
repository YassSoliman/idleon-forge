// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55 (Wave 6): the minigame Milestone ladders, from Toolbox's game data, never hand-copied. The
// authored Goals in systems/minigames.yaml `extends` these (`minigames.goal.ladder-<name>`):
//  - `tome-highscore` and `spiketrap-round`: the Tome rows (tomeData[75], [12]) give their
//    full points at `x1` (450 total highscore, round 13);
//  - `hoops-unlocks` / `darts-unlocks`: each upgrade opens at its `pointsToUnlock` total levels
//    (Toolbox getHoopsData / getDartsData, run on an empty account);
//  - `pen-pals`: one Trapping bonus per 25 of highscore, one tier per randomList[59] value (Toolbox
//    character.ts getTrappingStuff: tier n at 25(n+1)).
// The progress Detectors are packages/knowledge/detectors/minigames/*.ts; M6's module runs the authored Goals.
import type { GeneratedEntryT, SourceT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

const HIGHSCORES = 'parsers/highScores.ts';

interface TomeRow {
  name: string;
  x1: number;
  x3: number;
}
type Unlocks = (account: unknown) => { upgrades: { pointsToUnlock: number }[] };

const WIKI_TOME: SourceT = {
  url: 'https://idleon.wiki/wiki/Tome',
  title: 'IdleOn Wiki: Tome',
  tier: 2,
  claimDate: '2026-10-12',
  verified: '2026-10-19',
  gameVersion: '2.3.540',
};
const WIKI_MINIGAMES: SourceT = {
  url: 'https://idleon.wiki/wiki/Minigames',
  title: 'IdleOn Wiki: Minigames',
  tier: 2,
  claimDate: '2026-10-07',
  verified: '2026-10-19',
  gameVersion: '2.3.540',
};

/** The Hoops and Darts upgrades by position (the game's names, Toolbox's upgrade texts). */
const UPGRADE_NAMES = {
  hoops: ['DMG', 'COIN', 'EXP', 'SKILL, all-skill efficiency'],
  darts: ['DMG', 'TALENT', 'VAULT, cheaper Upgrade Vault', 'SPEED'],
} as const;

/** What each Pen Pals tier's value feeds (Toolbox character.ts, efficiency.ts, traps.ts readers). */
const PEN_PALS = [
  'a Trapping EXP bonus',
  'a trap efficiency bonus',
  'a shiny critter bonus',
  'a Trapping EXP bonus',
  'a critter gain bonus',
  'a shiny critter bonus',
  'a trap efficiency bonus',
  'a critter gain bonus',
  'a skill AFK gain bonus',
];
/** Toolbox getTrappingStuff('TrapMGbonus', n): tier n applies at 25(n+1). */
const PEN_PALS_STEP = 25;

const base = {
  system: 'minigames',
  type: 'goal',
  origin: 'generated',
  confidence: 'H',
  status: 'active',
  scope: 'account',
  category: 'compounding',
} as const;

const generator = defineGenerator({
  name: 'minigames',
  system: 'minigames',
  inputs: [
    'website-data/shared-data.json#tomeData',
    'website-data/randomList.json',
    `${HIGHSCORES}#getHoopsData`,
    `${HIGHSCORES}#getDartsData`,
  ],
  constants: { getHoopsData: HIGHSCORES, getDartsData: HIGHSCORES },
  run({ data, constants, pin }) {
    const tome = data.tomeData as TomeRow[];
    const row = (name: string) => {
      const r = tome.find((t) => t.name === name);
      if (!r) throw new Error(`minigames: no tomeData row ${name}`);
      return r;
    };
    const total = row('Total_Minigame_Highscore_');
    const spike = row('Best_Spiketrap_Surprise_round');
    const random = data.randomList as unknown[][];
    const penPals = (random[59] ?? []).map((v) => Number(v));
    if (penPals.length !== PEN_PALS.length)
      throw new Error(
        `minigames: randomList[59] has ${penPals.length} Pen Pals tiers, not ${PEN_PALS.length}`,
      );
    const ladder = (name: 'getHoopsData' | 'getDartsData') => {
      const fn = constants[name];
      if (typeof fn !== 'function') throw new Error(`minigames: ${name} is not a function`);
      return (fn as Unlocks)({ accountOptions: [] }).upgrades.map((u) => u.pointsToUnlock);
    };
    const hoops = ladder('getHoopsData');
    const darts = ladder('getDartsData');
    const by = generatedBy(generator, pin);
    const tomeSrc = generatedSource(
      pin,
      'website-data/shared-data.json#tomeData',
      'IdleOn Toolbox game data: tomeData, each Tome row and what gives its full points',
    );
    const hsSrc = generatedSource(
      pin,
      HIGHSCORES,
      'IdleOn Toolbox getHoopsData / getDartsData: each upgrade opens at a total of levels bought',
    );
    const penSrc = generatedSource(
      pin,
      'website-data/randomList.json',
      'IdleOn Toolbox game data: randomList[59], the Pen Pals tier values',
    );
    const unlocks = (game: 'hoops' | 'darts', reqs: number[]): GeneratedEntryT => {
      const name = game === 'hoops' ? 'Hoops' : 'Darts';
      const steps = reqs
        .map((at, i) => ({ at, reward: UPGRADE_NAMES[game][i] ?? `upgrade ${i + 1}` }))
        .filter((s) => s.at > 0);
      return {
        ...base,
        id: `minigames.goal.ladder-${game}-unlocks`,
        title: `Open every ${name} upgrade`,
        text: `{more:int} more ${name} levels open {reward} ({value:int}/{next:int})`,
        why: `${name} upgrades open by the total levels bought, not by the level of any one upgrade.`,
        values: { game },
        sources: [hsSrc, WIKI_MINIGAMES],
        appliesTo: { stages: 'all' },
        unit: 'levels',
        progress: { id: 'minigames/unlock-ladder', params: { game } },
        milestones: steps,
        data: { unlocks: reqs },
        generatedBy: by,
      };
    };
    const entries: GeneratedEntryT[] = [
      {
        ...base,
        id: 'minigames.goal.ladder-tome-highscore',
        title: 'Total Minigame Highscore',
        text: 'Raise your minigame highscores to {next:int} in total ({value:int} now)',
        why: 'The Tome adds your Choppin, Fishing, Catching, Mining and Pen Pals highscores into one row. Hoops, Darts and Spiketrap do not count toward it.',
        sources: [
          tomeSrc,
          generatedSource(pin, HIGHSCORES, 'IdleOn Toolbox calcMinigameTotalScore'),
          WIKI_TOME,
        ],
        appliesTo: { stages: [{ from: 'W3-early', to: 'W4-late' }] },
        unit: 'points',
        progress: { id: 'minigames/tome-highscore' },
        milestones: [{ at: total.x1, reward: `the Tome row's full ${total.x3} points` }],
        data: { tomeRow: total.name },
        generatedBy: by,
      },
      {
        ...base,
        id: 'minigames.goal.ladder-spiketrap-round',
        title: 'Spiketrap round',
        text: 'Reach round {next:int} in Spiketrap Surprise (best {value:int})',
        why: 'The Tome scores your best Spiketrap Surprise round, and a higher round pays more of the daily gems.',
        sources: [tomeSrc, WIKI_TOME],
        appliesTo: { stages: 'all' },
        unit: 'rounds',
        progress: { id: 'minigames/spiketrap-round' },
        milestones: [{ at: spike.x1, reward: `the Tome row's full ${spike.x3} points` }],
        data: { tomeRow: spike.name },
        generatedBy: by,
      },
      unlocks('hoops', hoops),
      unlocks('darts', darts),
      {
        ...base,
        id: 'minigames.goal.ladder-pen-pals',
        title: 'Pen Pals bonus tiers',
        text: 'Pen Pals highscore {next:int} opens {reward} ({value:int} now)',
        why: 'Every step of Pen Pals highscore opens a permanent Trapping bonus. You are {more:int} short of the next one.',
        sources: [
          penSrc,
          generatedSource(pin, 'parsers/character.ts', 'IdleOn Toolbox getTrappingStuff: tier n at 25(n+1)'),
        ],
        appliesTo: { stages: [{ from: 'W3-early', to: 'W4-late' }] },
        unit: 'points',
        progress: { id: 'minigames/pen-pals' },
        milestones: penPals.map((_, n) => ({
          at: PEN_PALS_STEP * (n + 1),
          reward: PEN_PALS[n] ?? 'a Trapping bonus',
        })),
        data: { values: penPals },
        generatedBy: by,
      },
    ];
    return { entries };
  },
});

export default generator;
