# Can Toolbox's math compare activities and characters we aren't doing yet? (2026-10-17)

Ticket: [#16](https://github.com/YassSoliman/idleon-forge/issues/16). Builds on the [parser spike](https://github.com/YassSoliman/idleon-forge/blob/research/parser-spike/docs/research/2026-10-16-parser-spike.md) and [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md). The experiment code is in [`spikes/hypothetical-math/`](../../spikes/hypothetical-math/) on this branch (never merged).

Upstream pin: IdleOn Toolbox `f1e4240a64b8e90ae21acb5dadc778cd66dc0f38` (2026-10-16, Toolbox 3.3.95 / game 2.3.531), the same pin as the parser spike. `T/` below stands for `https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/`. Line numbers are upstream's. The vendored copies carry a 3-line licence header, so their line numbers are 3 higher.

## Answer

- **Yes, for fighting, without editing upstream code.** Every map- and monster-dependent term in `getMaxDamage` reads `character.mapIndex` and `character.targetMonster`. A shallow clone with those swapped gives the hypothetical. **Toolbox does this itself:** its Speedrun page re-runs `getMaxDamage` on `{ ...character, mapIndex, targetMonster }` for ~200 maps, and its live-verified tests use the same clone trick for kill-per-kill, respawn and AFK gains.
- **The clone must also swap `afkType` (and `afkTarget`).** `getAfkGain` branches on `afkType`, not on the map. If you leave it alone, a fisher "moved" to a fighting map keeps the fishing AFK rate, and `finalKillsPerHour` comes out 12% high (0.95 vs 0.85 on Joseph's Barbarian). Toolbox's Speedrun page gets away without the swap only because it reads raw `killsPerHour`.
- **The identity check passes:** the clone rebuilt on each fighting character's own map gives byte-identical output to the direct call (what Toolbox's Stats page shows). It passed for all 8 fighting characters across both saves (10 of 11 characters in all).
- **"Another character on this map"** is the same call with a different character. **"This character on another skill"** works through `getAfkGain({ ...c, afkType })`, plus `getSkillEfficiency(skillName, …)` and `getSkillExpMulti(skillName, …)`, which take the skill as an argument. **But Toolbox computes no resources-per-hour or skill-EXP-per-hour for skilling.** The only per-hour skilling output is construction EXP. Turning efficiency into a rate would mean writing a formula, which ADR 0005 forbids.
- **Refinery:** `getRefineryCycles` is account-wide. It gives cycle times and the Squires' bonus cycles from `REFINERY_THROTTLE`. Of all the hypotheticals here, only "what if this Squire levels Refinery Throttle" would need a talent-level clone, and that was not tested.
- **Kills per hour is not value.** Joseph's Wizard (lv 73) gets **more** final kills/h on W2's Jar Bridge (1,816) than on its W3 map (934). Comparing activities needs kills/h × EXP per kill (`monsters[x].ExpGiven` × `getClassExpMulti`) and drops (`getDropRate`). Both are map-aware through the same clone, and multiplying them is plain arithmetic. Leverage then comes from Goals, not raw rate.
- **Verified on the real saves:** Yasser's Barbarian (lv 60) gets 1,430 final kills/h on Poopy Sewers and 2,270 to 3,177 on early W2 maps. Joseph's two Squires on the same map are far apart, e.g. Snowfield Outskirts: Squire lv 85 1,702 vs Squire lv 51 388 (survivability 100% vs 83%, and kills/h 1,896 vs 621).
- **Goal and Milestone inventory: mostly present.** Per-map kill counts per character and the Death Note rank thresholds (exported `DEATH_NOTE_RANKS`) are there. So are the Upgrade Vault's kill-scaled upgrades, whose steps fall at each power of 10 of kills on maps 8/13/14/24/101, and stamp costs (`materialCost`, `ownedMats`, `hasMaterials`, `goldCost`). Owned and equipped obols are there, as are both talent presets. **Missing:** which obols you *can* obtain (only 9 obols appear in `monsterDrops`), and any build order. Both belong in the Knowledge Base.
- **Caveats:** `getMaxDamage` on a *skilling* character returns nonsense kill numbers against the ore or fish "monster", so gate on `afkType === 'FIGHTING'`. Skilling maps hold several targets, so the hypothetical needs an explicit `targetMonster`. Swapping talent presets is lossy because the attack bar is not swapped. Toolbox verified kills/h live only on one W7 endgame account, never at W1 to W3. The pin is already one game version behind (2.3.540 landed 2026-10-17; its damage changes are W7-only).

## Details

### 1. Function by function

| Function (at pin) | Computes | Inputs that set the hypothetical | Hypothetical without upstream edits? |
|---|---|---|---|
| [`getMaxDamage`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/damage.ts#L91) `(character, characters, account, shared?)` | `playerInfo`: max/min damage, accuracy, crit, `hitChance`, `respawnRate`, `afkGains`, `survivability`, `killsPerHour`, `killPerkill`, `finalKillsPerHour` = ⌊kph × afkGains × survivability × killPerKill⌋ | `character.mapIndex`, `character.targetMonster`, and `character.afkType` (through `getAfkGain`) | **Yes**: clone and swap. The optional `shared` cache reuses the map-invariant stats across calls (L87 to 90 comment) |
| [`getKillsPerHour`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/damage.ts#L1241) (private) | `min(respawn bound, attack bound)`: monsters on screen / (respawn + 0.1), vs K / (travel + attack wait × hits to kill) | `monsters[targetMonster]` HP and Defence, `mapDetails[mapIndex]` (monsters on screen, travel) | Only through `getMaxDamage` (not exported) |
| [`getSurvivability`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/damage.ts#L1303) (private) | % of the hour alive: monster damage × attackers vs HP and food healing, with auto-respawn time | `targetMonster`, `mapDetails[mapIndex][1][2]` | Through `getMaxDamage` |
| [`getKillPerKill`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/damage.ts#L1483) (private) | Multikill: the per-world band plus overkill tiers | `mapIndex` (world band, diminished after map 300), monster HP and Defence | Through `getMaxDamage` |
| [`getHitChance`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/damage.ts#L1239) / exported `calcHitChance(accuracy, monster)` | Accuracy vs monster Defence curve | monster | `calcHitChance` takes the monster directly |
| [`getRespawnRate`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L1777) `(character, account)` | Seconds per respawn | `targetMonster` (world group), `mapIndex` (shrines) | **Yes**, and upstream's own live test does it ([T/__test__/parsers/live-verified-tasks.test.js L104](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/live-verified-tasks.test.js#L104)) |
| [`getAfkGain`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L3202) `(character, characters, account)` | AFK gain rate for the character's activity type (FIGHTING, MINING, CHOPPIN, FISHING, CATCHING, COOKING, LABORATORY, DIVINITY, SPELUNKING) | `afkType`, `mapIndex` (shrine 8) | **Yes**: `{ ...c, afkType }`. This is exactly upstream's live-verified test ([L27](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/live-verified-afk-gains.test.js#L27)) |
| [`getClassExpMulti`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L1897), [`getDropRate`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L2355), [`getCashMulti`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L2739) | Multipliers for class EXP, drop rate and coins | `mapIndex` (shrines; guild bonus scaled by world) | **Yes**: same clone |
| [`getSkillEfficiency`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/efficiency.ts#L665) `(skillName, character, characters, account, playerInfo)` | Efficiency stat for mining, chopping, fishing, catching, trapping, worship, cooking, lab and spelunking | `skillName` is an argument | **Yes**, for any character and skill. **Efficiency is not a rate** |
| [`getSkillExpMulti`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L554) `(skillName, …)` | Skill EXP multiplier | `skillName` | **Yes** |
| [`getRefineryCycles`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/world-3/refinery.ts#L179) `(account, characters, lastUpdated)` | Combustion, synthesis and polymerize cycle times; Squire bonus cycles from `REFINERY_THROTTLE` max level; cooldowns (reads the clock) | Account-wide plus Squire talents | Account state only. Character-independent apart from the Squire talent |

Toolbox's own usage confirms the clone pattern is intended. [T/parsers/class-specific/speedrun.ts L223](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/class-specific/speedrun.ts#L223) builds `const onMap = { ...character, mapIndex: index, targetMonster: monsterRawName }`, with the comment "Re-run the damage parser as if the character were parked on this map". [T/__test__/parsers/speedrun-damage-cache.test.js](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/speedrun-damage-cache.test.js) asserts that the cached and uncached paths agree on `killsPerHour`, `finalKillsPerHour` and 11 other fields. [T/__test__/parsers/live-verified-character-stats.test.js L98](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/live-verified-character-stats.test.js#L98) checks kill-per-kill on a clone moved to map 200 against the running game.

### 2. The clone that works

```ts
const onMap = (c, mapIndex, targetMonster = mapEnemiesArray[mapIndex]) => ({
  ...c, mapIndex, targetMonster,
  currentMap: mapNames[mapIndex],
  afkTarget: monsters[targetMonster]?.Name,
  afkType: monsters[targetMonster]?.AFKtype,   // needed: getAfkGain keys off this
});
const p = getMaxDamage(onMap(c, 51), characters, account); // p.finalKillsPerHour
```

What the clone does **not** model is "this character as it would be with different gear, cards, prayers or food". Those stay as saved. That is the right default for the Now screen ("move this character, as it is now"), but it is not an optimiser.

### 3. Verification on the real saves

All numbers come from `SPIKE_NOW=2026-10-17T12:00:00Z node dist/probe.mjs <save> maps`. Moving the clock 3 days changed nothing (identical hash), and a sweep of 6 characters over 51 maps takes ~0.5 s on Node 22.

**Yasser's Barbarian (lv 60), currently on Poopy Sewers:**

| Map | Raw kills/h | Final kills/h | Hit | Survivability | Bound by |
|---|---|---|---|---|---|
| Poopy Sewers (W1) | 1,677 | 1,430 | 100% | 78% | respawn (60 s) |
| Jar Bridge (W2) | 2,905 | 3,177 | 100% | 100% | attack speed |
| Mimic Hole … Slamabam Straightaway (6 W2 maps) | 2,076 | 2,270 | 100% | 100% | attack speed (overkill) |
| Mummy Memorial (W2, 70k HP) | 112 | 72 | 100% | 59% | damage |

Poopy Sewers' 1,677 is the same for every one of Yasser's characters, because the respawn bound caps it. On the early W2 maps, Barbarian, Shaman, Bowman and Wizard all land within 2,076 to 2,145 raw: they one-shot, so attack speed sets the rate, not damage. **Poopy Sewers is still a sensible Purpose:** it is map 8, one of the Upgrade Vault's kill-scaled maps. Dirty Money gives "+55% coins per POW 10 Poop kills", and the account is at ~3,000 poop kills, so the next step is 10,000: about 4.9 h at 1,430 kills/h. That ETA is the "time to next Milestone" arithmetic ADR 0005 allows.

**Joseph's two Squires on the same maps:**

| Map | Squire lv 85 (fighting): final kills/h, survivability | Squire lv 51 (mining now): final kills/h, survivability |
|---|---|---|
| Jar Bridge | 2,607, 100% | 995, 100% |
| Steep Sheep Ledge | 1,702, 100% | 509, 100% |
| Snowfield Outskirts | 1,702, 100% | 388, 83% |
| Mamooooth Mountain | 1,702, 100% | 114, 41% |
| Signature Slopes | 1,382, 100% (hit 48%) | 9, 25% (hit 29%) |
| Cryo Catacombs | 340, 100% (hit 15%) | 0 (hit 0%) |

That is the "another character on this map" comparison the Now screen needs, and it is a clean signal that the lv 51 Squire is not a W3 fighter today.

**Identity check:** on each character's own map, the clone matched the direct call field for field for all 8 fighting characters, and for 2 of the 3 skilling ones. The one mismatch was Joseph's mining Squire. Its saved target is Gold, but `mapEnemiesArray` names Iron for that map, which is why the hypothetical needs an explicit `targetMonster` on skilling maps.

**Skills:** `getAfkGain({ ...c, afkType })` gives per-type rates. For example, Yasser's Squire (lv 43) gets 0.87 for MINING vs 0.73 for CHOPPIN and 0.66 for FIGHTING. `getSkillEfficiency` gives every character a value for every skill (Joseph's mining Squire: mining 2,658 vs ~80 for chopping). Neither turns into ore/h or EXP/h without a formula.

**Refinery:** works for both saves (cycle times 900 / 3,600 / 360,000 s, with no speed bonuses yet). Squire bonus cycles are 15 for Yasser's account and 30 for Joseph's two Squires.

**Talent presets (approximate):** swapping in `talentPreset`'s trees changes damage the way you would expect. Joseph's Bowman (lv 60) does more on its *other* preset: 132.8k vs 88.5k max damage, 574 vs 449 final kills/h. But `talentsLoadout` (the attack bar, which feeds the D and K kill multipliers) is not swapped, and one result (a 36-point preset beating a 414-point one on kills/h) shows the swap is not trustworthy as-is. Treat preset comparison as **unverified**.

### 4. Goal and Milestone inventory: what the parsed Account State exposes

| Need | Field (at pin) | Status |
|---|---|---|
| Kills per monster | `character.kills[mapIndex]` = portal requirement − `KillsLeft2Advance` ([T/parsers/character.ts L461](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L461)): per character, per map, lifetime | Present |
| Death Note thresholds | `account.deathNote[world].mobs[{rawName, kills}]` ([T/parsers/world-3/deathNote.ts L5](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/world-3/deathNote.ts#L5)) plus exported `DEATH_NOTE_RANKS` = 25k / 100k / 250k / 500k / 1M / 5M / 100M ([L60](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/world-3/deathNote.ts#L60)) and mini-boss ranks | Present: Milestones are a table lookup. Yasser has 24 mobs killed, none past rank 1; Joseph has 34, one past it |
| Upgrade Vault kill gates | `account.upgradeVault.vaultTotalKills` ([T/parsers/misc/upgradeVault.ts L269](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/misc/upgradeVault.ts#L269)): summed kills on maps 14, 24, 13, 8 and 101, plus ⌊log10⌋ of each. These feed Bored to Death (beans), Slice N Dice (carrots), Stick Snapping (branches) and Dirty Money (poop). Upgrades also carry `level`, `cost`, `unlockLevel`, and there is a `nextUnlock` | Present. "Gates" are really per-power-of-10 Milestones; unlocks are gated by total upgrade levels, not kills |
| Stamp material shortfalls | Each stamp has `materialCost`, `ownedMats`, `hasMaterials`, `goldCost`, `hasMoney` and `futureCosts` (set in [T/parsers/world-1/stamps.ts L87](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/world-1/stamps.ts#L87)) | Present: shortfall = `materialCost − ownedMats`. Joseph has 1 stamp short of materials, Yasser 0. **Privacy note:** each stamp's `bestCharacter` embeds a character name, so strip it in the Account State |
| Obols owned | `account.obols.inventory` (unequipped), `character.obols.list` (equipped, with `levelReq`), `account.obols.list` (family) | Present. Joseph: 4 unequipped, 0 equipped. Yasser: 1 unequipped, 1 equipped. That is an easy Next Action |
| Obols obtainable | `monsterDrops` lists only 9 obols directly (boss and rare drops); the rest drop through nested drop tables or shops | **Not usable as-is**: build it into the Knowledge Base |
| Talent allocation per preset | `character.talents` (active) and `character.talentPreset.{talents, flatTalents, starTalents}` (other), each talent with `level`, `maxLevel` and `baseLevel` ([T/parsers/character.ts L417](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/character.ts#L417)) | Present. A **build order** does not exist in Toolbox, so it is Knowledge Base data |

### 5. Accuracy caveats

1. **Live verification exists only at endgame.** Toolbox checked `killsPerHour` (8,707), kill-per-kill, hit chance and the AFK rates against the running game on a W7 account on 2026-10-10/11 ([character stats test L33](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/live-verified-character-stats.test.js#L33), [AFK gains test](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/parsers/live-verified-afk-gains.test.js)). Nothing has been checked at W1 to W3. Yasser could spot-check one character against in-game AFK Info.
2. **`finalKillsPerHour` is a model,** not the game's own away-kill result. It multiplies kills/h by AFK gains, survivability and kill-per-kill. Its comments say it mirrors the game's `CalcAwayKills("Killing")`, and the Speedrun page calls its derived clear times "a floor, not a prediction".
3. **Skilling characters:** `getMaxDamage` still returns kill numbers for ore and fish "monsters". Never show them.
4. **Skilling maps** have several targets; pass `targetMonster` explicitly.
5. **Preset swap** is lossy (see §3). Card presets and gear are never swapped.
6. **Upstream churn:** Toolbox shipped game 2.3.540 on 2026-10-17 ([commit 15ce8a5](https://github.com/Morta1/IdleonToolbox/commit/15ce8a53758eb7a3ec1baab80912c281ce2f2d68)), one day after our pin. It changed `damage.ts` (+25/−4) and `character.ts` (+45). The `damage.ts` changes we read (Coral Kid, Scurge, Menagerie obol multipliers) are W7-only, so W1 to W3 numbers should not move, but the pin is already Stale.

### 6. For the decision tickets

- **Account State API:** expose a small hypothetical layer, `fightingRate(character, mapIndex, targetMonster?)` and `afkRate(character, afkType)`, as a thin wrapper over the clone. Contract-test it with the identity check (the clone on the character's own map must equal the direct call).
- **Purpose and Leverage:** compare activities on kills/h × (EXP per kill, drops, Milestone progress), not on kills/h alone. The Vault and Death Note Milestones turn kills/h straight into ETAs.
- **Skilling rates:** decide whether Higher-leverage options for skilling can live with efficiency plus AFK rate plus skill level (ranked, not per-hour), or whether ADR 0005 needs an exception.

### Reproduce

```
git checkout research/parser-spike -- spikes/parser-spike   # or a built copy of it
(cd spikes/parser-spike && npm install && npm run sync)
ln -s ../parser-spike/node_modules spikes/hypothetical-math/node_modules
cd spikes/hypothetical-math && node scripts/build.mjs
SPIKE_NOW=2026-10-17T12:00:00Z node dist/probe.mjs <save.json> maps|skills|refinery|preset|inventory
```

The probe prints class and level, never character names.

## Sources

- IdleOn Toolbox at the pin: https://github.com/Morta1/IdleonToolbox/tree/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38 (game 2.3.531, committed 2026-10-16). Files cited inline: `parsers/damage.ts`, `parsers/character.ts`, `parsers/efficiency.ts`, `parsers/world-3/refinery.ts`, `parsers/world-3/deathNote.ts`, `parsers/misc/upgradeVault.ts`, `parsers/world-1/stamps.ts`, `parsers/class-specific/speedrun.ts`, `__test__/parsers/live-verified-*.test.js`, `__test__/parsers/speedrun-damage-cache.test.js`.
- Toolbox UI callers that show these numbers today: [T/components/characters/Stats.jsx L47](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/components/characters/Stats.jsx#L47) and [T/components/characters/Skills.jsx L84](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/components/characters/Skills.jsx#L84).
- Game data at the pin (`data/website-data/`: `mapNames`, `mapEnemiesArray`, `monsters`, `monsterDrops`), as extracted by Toolbox (top of ADR 0004's precedence).
- Post-pin upstream update to game 2.3.540: https://github.com/Morta1/IdleonToolbox/commit/15ce8a53758eb7a3ec1baab80912c281ce2f2d68 (2026-10-17).
- Real-save numbers: Yasser's (W2) and Joseph's (W3) exports in the gitignored `fixtures/private/`, parsed at the pin on 2026-10-17. Only aggregates appear here.

Verified 2026-10-17 against game 2.3.531 (Toolbox pin). Stale against game 2.3.540, which has W7-only damage changes.
