// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M20's fields come from (M20 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save keys
// behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });
const OPT = raw('OptLacc', 'json');

export const SLOTS_FIELD_SOURCES: Record<string, string> = {
  'characters[].skills': 'characters[i].skillsInfo.<skill>.{level, exp, expReq}',
  'characters[].slots':
    'account.construction.baseBoard / CogOrder (player cogs), characters[i].constructionSpeed, .constructionExpPerHour, .tools[4], .tools[5], .questComplete.Lord_of_the_Hunt1, account.alchemy.activities[i]',
  'account.cogBoard':
    'account.construction.baseBoard (currentAmount, requiredAmount, cog.name), totalBuildRate, totalExpRate, totalFlaggyRate',
  'account.liquids':
    'account.alchemy.liquids[i], liquidCauldrons[i].maxLiquid, characters[].skillsInfo.alchemy',
  'account.resets': 'account.accountOptions[39] and [191] (raw OptLacc)',
  'account.killroy':
    'account.accountOptions[105, 113, 227, 417], getKillRoyClasses(rooms, account, serverVars, true, week), finishedWorlds',
  'account.weeklyBattle': 'account.accountOptions[189] and [190] (raw OptLacc)',
  'account.ballot': 'account.accountOptions[309] (raw OptLacc), account.voteBallot.selectedBonus',
  'account.randomEvents': 'account.accountOptions[137] (raw OptLacc), getRandomEvents(account)',
  'account.petTournament':
    'account.accountOptions[511] (raw OptLacc), account.tournament.tournamentDay, tournament.global.C, companions.list[].acquired',
  'account.taskBoardDailies':
    'account.tasks[1][w][8], account.tasksDescriptions[w][8].name, characters[].npcDialog / questComplete (Grasslands_Gary, Desert_Davey2, Iceland_Irwin1)',
  'account.guildTasks':
    'account.guild.members (count), account.guild.totalGp, account.guild.guildTasks.{daily, weekly}[].{progress, requirement}',
  'account.totems': 'account.totems[] (getTotems: name, map, skillReq, maxWave, expReward)',
};

export const SLOTS_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].skills': [raw('Lv0_{i}', 'json')],
  'characters[].slots': [raw('EquipOrder_{i}', 'json'), raw('QuestComplete_{i}', 'json')],
  'account.cogBoard': [raw('CogO', 'json'), raw('FlagU', 'json')],
  'account.liquids': [raw('CauldronInfo', 'json')],
  'account.resets': [OPT],
  'account.killroy': [OPT],
  'account.weeklyBattle': [OPT],
  'account.ballot': [OPT],
  'account.randomEvents': [OPT],
  'account.petTournament': [OPT],
  'account.taskBoardDailies': [raw('TaskZZ1', 'json')],
  'account.totems': [raw('TotemInfo', 'json')],
};

export const SLOTS_FIELD_SECTIONS: Record<string, string[]> = {
  'account.cogBoard': ['construction'],
  'account.liquids': ['alchemy'],
  'account.killroy': ['killroy'],
  'account.ballot': ['voteBallot'],
  'account.petTournament': ['tournament', 'companions'],
  'account.taskBoardDailies': ['tasks'],
  'account.guildTasks': ['guild'],
  'account.totems': ['totems'],
};
