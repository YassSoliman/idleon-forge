// IdleOn Forge hypothetical-math spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Usage: SPIKE_NOW=<iso> node dist/probe.mjs <save.json> <experiment>
// Prints numbers only, keyed by class and level, never character names (saves are personal data).
import { readFileSync } from 'node:fs';
import '@parsers/../polyfills.js';
import { parseData } from '@parsers/index';
import { getMaxDamage } from '@parsers/damage';
import { getAfkGain, getSkillExpMulti } from '@parsers/character';
import { getSkillEfficiency } from '@parsers/efficiency';
import { getRefineryCycles } from '@parsers/world-3/refinery';
import { mapNames, mapEnemiesArray, monsters } from '@website-data';

if (process.env.SPIKE_NOW) {
  const fixed = new Date(process.env.SPIKE_NOW).getTime();
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...a: any[]) { super(...((a.length ? a : [fixed]) as [])); }
    static now() { return fixed; }
  }
  globalThis.Date = FrozenDate as DateConstructor;
}

const [file, experiment = 'all'] = process.argv.slice(2);
const env = JSON.parse(readFileSync(file, 'utf8'));
const { account, characters } = parseData(env.data, env.charNames ?? [], env.companion ?? null,
  env.guildData ?? null, env.serverVars, env.accountCreateTime, env.tournament ?? null) as any;
if (!Object.keys(account).length) throw new Error('parse failed (empty account)');
const label = (c: any) => `${c.class} lv${c.level}`;
const round = (n: any) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);

// The hypothetical: a shallow clone with the AFK target swapped. Toolbox's own speedrun route
// (parsers/class-specific/speedrun.ts) swaps mapIndex + targetMonster; we also swap the fields
// getAfkGain and getRespawnRate branch on (afkType, afkTarget), and currentMap for display.
const onMap = (c: any, mapIndex: number) => {
  const raw = (mapEnemiesArray as any)[mapIndex];
  const m = (monsters as any)[raw];
  return { ...c, mapIndex, currentMap: (mapNames as any)[mapIndex], targetMonster: raw, afkTarget: m?.Name, afkType: m?.AFKtype };
};
const fight = (c: any) => {
  const p = getMaxDamage(c, characters, account);
  return {
    map: c.currentMap, monster: c.targetMonster, maxDamage: round(p.maxDamage), hitChance: round(p.hitChance),
    respawn: round(p.respawnRate), afkGains: round(p.afkGains), survivability: p.survivability,
    killsPerHour: p.killsPerHour, killPerKill: round(p.killPerkill?.value), finalKillsPerHour: p.finalKillsPerHour,
  };
};
const mapIdx = (name: string) => Number(Object.entries(mapNames as any).find(([, n]) => n === name)?.[0]);

const out: any = {};
if (experiment === 'maps' || experiment === 'all') {
  // every character: current map as parsed, the same map rebuilt through the clone (identity check),
  // then a ladder of W1/W2 fighting maps
  const ladder = (process.env.MAPS ?? 'Poopy_Sewers,Jar_Bridge,Mummy_Memorial,Bandit_Bob,Bug_Ville,Sandy_Pots').split(',');
  out.maps = characters.filter((c: any) => c.level).map((c: any) => ({
    who: label(c), afkType: c.afkType,
    current: fight(c),
    identity: fight(onMap(c, c.mapIndex)),
    ladder: ladder.map((n) => (Number.isFinite(mapIdx(n)) ? fight(onMap(c, mapIdx(n))) : { map: n, missing: true })),
  }));
}
if (experiment === 'skills' || experiment === 'all') {
  const skills = ['mining', 'chopping', 'fishing', 'catching', 'trapping', 'worship'];
  out.skills = characters.filter((c: any) => c.level).map((c: any) => {
    const p = getMaxDamage(c, characters, account);
    const asType = (t: string) => getAfkGain({ ...c, afkType: t }, characters, account)?.afkGains;
    return {
      who: label(c), afkType: c.afkType,
      afkGainsIf: Object.fromEntries(['FIGHTING', 'MINING', 'CHOPPIN', 'FISHING', 'CATCHING'].map((t) => [t, round(asType(t))])),
      efficiency: Object.fromEntries(skills.map((s) => [s, round(getSkillEfficiency(s, c, characters, account, p)?.value)])),
      expMulti: Object.fromEntries(skills.map((s) => [s, round(getSkillExpMulti(s, c, characters, account, p)?.value)])),
      skillLevels: Object.fromEntries(skills.map((s) => [s, c.skillsInfo?.[s]?.level])),
    };
  });
}
if (experiment === 'refinery' || experiment === 'all') {
  const r = getRefineryCycles(account, characters, env.lastUpdated);
  out.refinery = { squiresCycles: r.squiresCycles, cycleSeconds: r.cycles.map((x: any) => [x.name, x.time]) };
}
if (experiment === 'preset' || experiment === 'all') {
  // the other talent preset: swap in talentPreset's trees (the attack bar, talentsLoadout, is not swapped)
  out.preset = characters.filter((c: any) => c.level && c.afkType === 'FIGHTING').map((c: any) => {
    const tp = c.talentPreset ?? {};
    const other = { ...c, talents: tp.talents, flatTalents: tp.flatTalents, starTalents: tp.starTalents, flatStarTalents: tp.flatStarTalents };
    const a = fight(c), b = fight(other);
    const pts = (t: any) => Object.values(t ?? {}).flatMap((x: any) => x?.orderedTalents ?? []).reduce((n: number, x: any) => n + (x?.level || 0), 0);
    return { who: label(c), activePoints: pts(c.talents), otherPoints: pts(tp.talents),
      active: { maxDamage: a.maxDamage, finalKillsPerHour: a.finalKillsPerHour }, other: { maxDamage: b.maxDamage, finalKillsPerHour: b.finalKillsPerHour } };
  });
}
if (experiment === 'inventory' || experiment === 'all') {
  // Goal / Milestone inputs that the parsed Account State already exposes (counts only)
  const dn = account.deathNote ?? {};
  const mobs = Object.entries(dn).filter(([k]) => k !== 'miniBosses').flatMap(([, w]: any) => w?.mobs ?? []);
  const RANKS = [25e3, 1e5, 25e4, 5e5, 1e6, 5e6, 1e8];
  const killed = mobs.filter((m: any) => m.kills > 0);
  const stamps = Object.values(account.stamps ?? {}).flat() as any[];
  const short = stamps.filter((s) => s.level > 0 && s.materialCost > 0 && !s.hasMaterials);
  const vault = account.upgradeVault ?? {};
  out.inventory = {
    deathNote: { mobs: mobs.length, killed: killed.length,
      pastFirstRank: killed.filter((m: any) => m.kills >= RANKS[0]).length,
      nextThresholdKnown: killed.every((m: any) => RANKS.find((r) => m.kills < r) !== undefined || m.kills >= 1e8) },
    perCharacterKillsArray: characters.filter((c: any) => c.level).every((c: any) => Array.isArray(c.kills)),
    vault: { upgrades: vault.upgrades?.length, totalUpgradeLevels: vault.totalUpgradeLevels, hasNextUnlock: !!vault.nextUnlock,
      killSlots: (vault.vaultTotalKills ?? []).length, costFieldPresent: vault.upgrades?.every((u: any) => 'cost' in u) },
    stamps: { total: stamps.length, owned: stamps.filter((s) => s.level > 0).length,
      atMaterialGate: stamps.filter((s) => s.level > 0 && s.materialCost > 0).length, shortOfMaterials: short.length,
      fields: ['goldCost', 'materialCost', 'ownedMats', 'hasMaterials', 'hasMoney', 'futureCosts'].filter((f) => stamps.some((s) => f in s)) },
    obols: { accountInventorySlots: account.obols?.inventory?.length, ownedUnequipped: (account.obols?.inventory ?? []).flat().filter((o: any) => typeof o === 'string' ? o.startsWith('Obol') && !o.startsWith('ObolLocked') : o?.rawName?.startsWith?.('Obol')).length,
      equippedPerCharacter: characters.filter((c: any) => c.level).map((c: any) => (c.obols?.list ?? []).filter((o: any) => o?.rawName?.startsWith('Obol') && !o.rawName.startsWith('ObolLocked')).length) },
    talents: { bothPresetsParsed: characters.filter((c: any) => c.level).every((c: any) => c.talents && c.talentPreset?.talents) },
  };
}
console.log(JSON.stringify(out, null, 1));
