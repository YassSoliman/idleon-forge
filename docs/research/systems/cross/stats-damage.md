# Dossier: Character stats, stat points and damage formula (stats-damage)

Revised 2026-10-19 after two adversarial verification passes (source and game-data lenses); every claim carries a confidence (H/M/L) and disputed claims are marked **Disputed**. Verified 2026-10-19 against Toolbox pin 6c37e3d (game 2.3.540). Code paths are relative to `packages/toolbox-parsers/vendor/parsers/` ("P/"). Tier 1 = game data / Toolbox code, 3 = idleon.wiki. Wiki pages for stats are stubs; the stat-point-per-level rule is NOT in Toolbox (see Open questions).

## Character stats and damage pipeline

- **What it is:** Each character has four base stats (STR, AGI, WIS, LUK) plus level. A class's main stat feeds damage; the other three feed accuracy, crit, HP/MP, speed, EXP and drop rate through one shared curve. `getMaxDamage` combines base damage x per-X damage x % damage into max/min hit, then derives kills per hour that every frontier, AFK and walkthrough module reuses. [C1, conf H][C2, conf H][C3, conf H]
- **Unlocks:** Stats exist from character creation; stat points are spent in the player's stats menu. Beginner/Journeyman/Maestro/Voidwalker use LUK, Warrior line STR, Archer line AGI, Mage line WIS as main stat. [C4, conf M]
- **Scope:** Per-character (stats, WP, talents, gear, cards equipped, postoffice, prayers) plus account-wide multipliers (bubbles, stamps, statues, vault, etc.). [C5, conf M]
- **Inputs -> outputs:** Stat points + gear + account bonuses -> maxDamage/minDamage, accuracy, hitChance, critChance, critDamage, maxHp, maxMp, defence, movementSpeed, survivability, killsPerHour, finalKillsPerHour. [C6, conf H]
- **Goals and Milestones:** see "Thresholds" table in the catalogue (stat 1000 curve switch, 250-stat Trione steps, damage softcaps 4k/15k, 100x per-X cap, % damage tiers, mastery 80%, WP+stat 150 cap, speed 175%/200%).
- **Feeds / fed by:** Fed by Alchemy bubbles/vials/sigils, Stamps, Statues, Cards, Post Office, Star Signs, Talents, Prayers, Lab, Divinity, Owl/Kangaroo, Upgrade Vault, Gear, Obols, Food, Companions, Achievements, etc. Feeds ActiveOn frontier (kills/hr on door map), AFK Setup (survivability, kills/hr), purpose/EXP-per-hour, walkthrough kill rates. [C7, conf M][C8, conf M]
- **Per-session actions:** Spend unspent stat points into the main stat (and into LUK/AGI/WIS only on a deliberate plan, see Min-max); check hit chance on the frontier map is >0 before sending anyone AFK; check survivability <100 before assuming kills/hr. [C9, conf L]
- **AFK Setup implications:** `finalKillsPerHour = floor(killsPerHour * afkGains * survivability/100 * killPerKill)`; hitChance 0 gives 0 kills; survivability <100 means the character dies and loses time to respawn. [C10, conf H]
- **Common mistakes:** Treating the wiki damage formula (WP^2/9 + flat) as complete (it omits per-X, softcaps, curses); ignoring that accuracy comes from a different stat than damage (STR class -> WIS accuracy; AGI class -> STR; WIS class -> AGI; LUK -> LUK). [C11, conf M][C12, conf L]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

Format: mechanic - rule/formula - caps - unlock - cost - field.

### M1 Base stats (STR/AGI/WIS/LUK)
- Raw: save `PersonalValuesMap.StatList` index 0 STR, 1 AGI, 2 WIS, 3 LUK, 4 level; parsed to `characters[].stats.{strength,agility,wisdom,luck}`. Level separately `characters[].level` from `Lv0[0]`. [C13, conf H]
- Stat points: no parser in Toolbox reads unspent stat points or the per-level grant; StatList is the already-spent totals. Cost model unknown from code. Re-verified by both lenses: no stat-point parser exists (the only `unspentPoints` is Post Office, unrelated). [C14, conf H] (open question Q1)

### M2 Stat curve (getStatCurveValue)
- stat < 1000: (stat+1)^0.37 - 1) / 40. stat >= 1000: ((stat-1000)/(stat+2500))*0.5 + 0.297. Game call `Stat2num`. Continuous at 1000 (about 0.297). Asymptote 0.797. [C15, conf H] Field: `P/misc.ts#L711`.
- Used for: LUK drop-rate (`1.4 * curve` in drop rate, `P/character.ts#L2384`, `#L2510`), WIS alchemy brew speed (`1 + curve/WISDOM_CURVE_DIVISOR`, `P/world-2/alchemy.ts#L721`), AGI anvil speed (`curve*2+1`, `P/misc.ts#L717`, `P/world-1/anvil.ts#L21`). [C16, conf H]

### M3 Per-use curve variants (same shape, different constants)
- LUK -> class EXP: <1000 `((luck+1)^0.37 - 1)/30`; else `(luck-1000)/(luck+2500)*0.8 + 0.3963`; then times (1+talent)/1.8 (`P/character.ts#L1918-1922`, `#L2148`). [C17, conf H]
- AGI -> movement speed: <1000 `((agi+1)^0.4 - 1)/40`; else `(agi-1000)/(agi+2500)*0.5 + 0.371`; contributes agiMulti/2.2 to speed (`P/character.ts#L3200-3213`). [C18, conf H]
- AGI -> crit chance: same 0.37 curve but high branch constant 0.255 (not 0.297); crit% contribution = curve/2.3*100 (`P/damage.ts#L1200`, in getCritChance). [C19, conf H]
- STR -> crit damage: same, high-branch constant 0.255; contribution = 100*curve/1.8 (`P/damage.ts#L1175`). [C20, conf H]
- Note the constants 0.255 (crit) vs 0.297 (getStatCurveValue) disagree at stat 1000; Toolbox follows the game's own per-site code, so neither is a bug flag; record both. Confirmed 0.255 at `damage.ts` L1194/L1229 vs 0.297 at `misc.ts` L713 (source lens); whether the game itself matches is unverifiable. Confidence M. [C21, conf M]

### M4 Main-stat damage (damageFromStat)
- `damageFromStat = stats[mainStat] * (1 + (STRENGTH_IN_NUMBERS + KNOWLEDGE_IS_POWER + LUCKY_HIT + statBubble)/100)`; statBubble = FARQUAD_FORCE (STR), QUICKDRAW_QUIVER (AGI), SMARTER_SPELLS (WIS); none for LUK. (`P/damage.ts#L96-120`). [C22, conf H]
- Feeds three places: (a) base damage flat term; (b) `Min(150, 2*WP + damageFromStat)`; (c) per-X term `damageFromStat^0.7` percent. [C23, conf H]

### M5 Base damage (DamageDealtLIST[0])
- `base = ((WP*(1 + (CARRY_A_BIG_STICK + HIGH_POLYMER_LIMBS + POWER_OVERWHELMING + Cosmo)/100) + SHARPENED_AXE)/3)^2 + damageFromStat + goldenNomwich + min(150, 2*WP + damageFromStat) + arcade + owl + vault0 + vault20*vaultKills5 + stamps + gear(16) + obols + statue0 + postoffice(Civil_War_Memory_Box) + hpBubble*log(max(maxHp-250,1)) + speedBubble*(log2(max(speed/100-0.1,0))/0.25) + mpBubble*log(max(maxMp-150,1)) + cards + sigil(PLUNGING_SWORD)` (`P/damage.ts#L890-982`). Wiki states (WP^2)/9 + flat, consistent with ((WP)/3)^2. [C24, conf H][C25, conf M]
- Softcaps: above 4,000: 4000 + (x-4000)^0.91; above 15,000: 15000 + (x-15000)^0.84. Then food base-dmg boosts added after. (`#L955-961`). [C26, conf H]
- Cap on `2*WP + damageFromStat`: 150 (`BASE_DAMAGE_STAT_AND_POWER_CAP`). [C27, conf H]

### M6 Weapon Power
- `WP = 5 + DeathsStorageUnit(PO) + flurbo + food + cards(WP) + passive cards + guild bonus[3] + sigil DUSTER_STUDS + (gear WP + obols*menagerieMulti) * (1 + (lab chip index 19 + class WP bubble)/100) + beginner best + vials(WeaponPOW) + family(Barbarian) + starsign + arcade + talents (TOUGH_STEAKS cooking/10, GAMER_STRENGTH gaming/10, CREW_ROWING_STRENGTH sailing/10, BELIEVER_STRENGTH divinity/10, ANIMALISTIC_FEROCITY*log(first stored pet), WIRED_IN_POWER lab/10)`. Class WP bubble: STR SPEAR_POWAH, AGI BOW_POWER, WIS/LUK WAND_PAWUR. (`P/damage.ts#L1120-1173`). [C28, conf H]
- Minehead upgrade 4 additionally multiplies damage by `mineheadUpg4 * weapon WP` percent (W7). [C29, conf M]

### M7 HP/MP-scaled damage and flat % pool (DamageDealtLIST[2] sibling: hpMp)
- `hpMp = 1 + (damageFromStat^0.7 + vault27*vaultKills6 + vault15*opt338 + 0.4*vault10 + bribes[30],[20] + stamps(Total_Damage) + landRank14 + statue22 + log(maxHp)*MEAT_SHANK + log(maxMp)*OVERCLOCKED_ENERGY + owl(Total DMG) + kangaroo + bubba + vault80 + spelunking64)/100` (`P/damage.ts#L823-888`). [C30, conf H]

### M8 Per-X damage (DamageDealtLIST[1])
- `perX = hpMp * smithing talent (1 + VEINS_OF_THE_INFERNAL*min(100,smithLv)/10/100) * (1+summoning winner/100) * (1 + (sum of per-X talents/bubbles)/100) * goldenKebab`. Sum includes: CHOPPIN_IT_UP_EZ*floor(chopScore/25), bubbles DMG_OF_THE_SUN/MOON/SOUL, SKILLAGE_DAMAGE*floor(lowestSkill/5), APOCALYPSE_ZOW*zows, PRECISION_POWER*refinery levels (only if accuracy >= 2.25*monster Defence), VIRILE_VIALS*(vials >3), LOOTY_MC_SHOOTY*items/50, PAPERWORK*stamps/10, Well sediment schematic, SPEEDNA*floor(min(speed-1,10)/0.15), DREAMER_DAMAGE*dreams, FILTHY_DAMAGE*log(garbage), DUNGEONIC_DAMAGE*log(credits), QUEST_KAPOW (cap = completed quests), Nobisect minor divinity. (`P/damage.ts#L674-810`). [C31, conf H]
- Softcap chain `PER_X_DAMAGE_SCALING`: above 100 -> 100 + (x-100)^0.86; above 2e6 -> 2e6*(x/2e6)^0.5; above 1e8 -> 1e8*(x/1e8)^0.3. [C32, conf H]

### M9 Percent damage (DamageDealtLIST[2])
- Product of pre-softcap groups: Wormhole Emperor x Wraith Overlord x vials(7dmg) x Eclipse skulls x Palette x Dream[6] (1+x/10) x Pristine charm x Summoning 79 x Crystal Glunko x [additive group: No Pain No Gain, friend bonus, star sign Total_Damage, Gods Chosen Children*max(0,gods-10), Power Orb*floor((lvl-200)/50)] x [account additive: grimoire, lustre set, shrine, monument, 3 post-office boxes, family, artifacts, atom, shiny, superbit, shimmer, crop depot, vault 41] x [bubble/stat group: skill mastery, STR%/AGI%/WIS% bubbles BRITTLEY_SPEARS/BOW_JACK/MATTY_STAFFORD, Trione bubbles *floor(stat/250), constr mastery, tome, compass, exotic, opt419] x [gear/lab group] x [companion/cards] x [arena/chip/meal/achievements/god blessings] x curses x Minehead x Jelly x Royal Statue x Coral Kid x weekly boss (<= x2.5) (`P/damage.ts#L296-520`). [C33, conf H]
- Trione bubbles: POWER_TRIONE (STR/LUK mains), POWER_TRITWO (AGI), POWER_TRITHREE (WIS) give bonus per 250 of the matching stat (LUK mains use max(STR,LUK)). [C34, conf H]
- Softcap chain `PERCENT_DAMAGE_SCALING` on the product: >100 -> 100+(x-100)^0.86; >2e7 ^0.8; >5e8 ^0.6; >2e9 ^0.45; >1.5e10 ^0.36; >6e10 ^0.28. Curse floor 0.05 multiplier. [C35, conf H]
- Post-softcap (unaffected): gear EtcBonus 72/75/104, vote bonus, fountain, superbit Destructive Gamer x1.1, opt232, card multi 96, farming sticker multi, tome 6 + achievements 371/384, Killroy (max x3), sushi, companions 12/33/160/168/170, Crystal6 card (max 15%), meritocracy 5, damage bundle x1.5, family Arcane Cultist [80]; then Reliquarium exponent `4/(5+opt473)`, and Clamworks /100 per Scurge upgrade level (`#L520-670`). [C36, conf H]
- `maxDamage = baseDamage * perDamage * percentDamage`; `minDamage = mastery * maxDamage`. [C37, conf H]

### M10 Mastery (min damage fraction)
- `min(0.8, 0.35 + (LIL_BIG_DAMAGE bubble (AGI mains) + Minimum_Damage cards + MASTERY_UP + gear idx21)/100)`. Cap 80%. (`P/damage.ts#L216`). [C38, conf H]

### M11 Accuracy
- Accuracy stat: STR main -> WIS; AGI main -> STR; WIS main -> AGI; LUK main -> LUK.
- `acc0 = accStat * (1+SHAQURACY/100) * (1 + (EXTENDO_RANGEO + cards + starsign + BALANCED_SPIRIT + statue14 + arcade + flurbo + bribe21 + companion23)/100)`; x(1+TIPTOE_QUICKNESS/100) if speed>199%. Final: `(acc0/4)^1.4 + acc0 + baseAcc) * (1 + (acc0 + 2*cardSet4)/200) * prayer * (1 + (chip + meal + kangaroo + vote + amarok)/100) * (1 + Snehebatu minor/100)`; baseAcc = 2 + vials + postoffice + cards + gear28 + Butter Bar + stamps (`P/damage.ts#L984-1047`). [C39, conf H]

### M12 Hit chance
- Monster targets: `floor(min(100*(0.95*r - 0.425), 100))` where r = accuracy/Defence; 0 below r=0.5. Resource targets (ore, tree, fish, bug): `floor(min(6*(r-0.174)/(r-0.17+9.04)*100,100))`, 0 below r=0.25. 100% at r=1.5 (monster). (`utility/hit-chance.mjs`, `P/damage.ts#L1253`). [C40, conf H]
- **Disputed (C41).** Source lens: the wiki form Hit% = 142.5*Acc/AccReq - 42.5, with AccReq = accuracy for 100% = 1.5 x Defence, reduces to 95r - 42.5, identical to Toolbox `100*(0.95r - 0.425)`; the two agree and the earlier "older/other form" reading and the "5% minimum" were not supported by the fetched page. Game-data lens: Toolbox side confirmed (floor(100*(0.95r-0.425)), gate r=0.5); wiki side unverifiable from game data. Net: treat as equivalent; Toolbox H, wiki-side details L. Source: idleon.wiki Damage/Accuracy (tier 3, 2026-10-19), `P/damage.ts#L1253` (tier 1). [C41, conf L]

### M13 Crit
- Chance (%): `5 + cardSet6 + cards + min(passive cards,50) + MEGA_CRIT + gear23 + obols + prayer + meal + statue13 + starsign + I_SEE_YOU + FARSIGHT + 5*achievement184 + postoffice + OVERACCURATE_CRIT*log(acc - 1.5*monster Defence) + agiCurve/2.3*100 + CHEAP_SHOT bubble (AGI main)` (`#L1200`). [C42, conf H]
- Damage multiplier: `1.2 + (CRITIKILL + statue5 + FARSIGHT + stamps + 100*strCurve/1.8 + BAPPITY_BOOPITY(STR main) + cards - Circular_Criticals curse + KNUCKLEBUSTER + gear22 + obols + DIVINE_INTERVENTION)/100` (`#L1175`). [C43, conf H]
- Average hit used for kills/hr: `maxDamage*(mastery + (1-mastery)/2) * (1 + (critDmg-1)*critChance/100) * hit%` (`#L1260-1289`). Code also multiplies by max(dEffect,1) (AFK-attack D multiplier from talents), omitted above: incomplete, not contradicted. [C44, conf H]

### M14 Max HP / Max MP
- HP: `flat = 15 + cards + stamps + food + statue4 + PO(Locally_Sourced_Organs) + HEALTH_BOOSTER + UBERCHARGED_HEALTH + (STR*(1+STRENGTH_IN_NUMBERS/100))^1.05`; times (1 + (HEALTH_OVERDRIVE + HEMA_OVERDRIVE + gear15 + obols)/100) x shrine x golden jam x PO% x (1 - NO_PAIN_NO_GAIN/100) x (1+(family Squire + cards%)/100) x starsign (`#L1071`). [C45, conf H]
- MP: `(10 + cards + stamps + MANA_BOOSTER + WIS + PO Magician_Starterpack) * (1+(MANA_OVERDRIVE+HEMA_OVERDRIVE)/100)*(1+(PO%+cards%)/100)` (`#L1049`). [C46, conf H]

### M15 Defence and survivability
- Defence: floor(base sum incl. gear Defence * (1 + bubble FMJ etc.)) x (1+(shrine+bribe22)/100) x prayer multi (min 0.05) x (1+% group) x (1+(minor + vote)/100) + kangaroo + vault5 (`#L1367`). FMJ base is capped at character level. [C47, conf H]
- Monster damage: `Damages[0] - 2.5*def^0.8` divided by `max(1 + def/max(Damages[0],1)*def^1.5/100, 1)`; BRICKY_SKIN reduces (min x0.05); NO_PAIN doubles (`#L1348`). [C48, conf H]
- Survivability %: if monsterDmg*mapRate - healing > 0: `t = maxHp / that; surv = round(100*t/(t + respawn/3600))` capped 100; respawn 600s base, reduced by PO Locally_Sourced_Organs, BORED_TO_DEATH override (min 100s) (`#L1322`). [C49, conf H]

### M16 Movement speed
- `final = 1 + (food + FEATHERWEIGHT + stamps + STRAFE + statue1 + starsign + gear1 + cards + FEATHER_FLIGHT)/100 + agiMulti/2.2`. If raw >2.0: only floored to 2 decimals, NOT capped. If 1.75 < raw <= 2.0: min(2, floor(final + TIPTOE/100)). Else (<=1.75): min(1.75, final + (salt lick 7 + lab chip 15 + TIPTOE + sigil TUFT_OF_HAIR + grounded motherboard)/100). Returned as percent integer. Speed >199% unlocks TIPTOE accuracy (`P/character.ts#L3192`). [C50, conf M]
- **Disputed (C50).** Earlier claim: hard 175% base cap, 200% with TIPTOE. Game-data lens (refutes): the 175% cap applies only when pre-bonus speed <= 1.75; the 1.75-2.0 band caps at 200% after Tiptoe; raw >2.0 is uncapped. Source lens did not refute. Correction adopted above. Tier 1, `P/character.ts#L3192`.

### M17 Kills per hour and kills-per-kill
- `actionWait = max(0.1, (1 + (10 - weaponSpeed)/5) / (1 + (gear56+obols+meal+chip+HYPERSWIFT+PO Deaths_Storage_Unit[1])/100))`; `hourlyKills = min(mapSpawn/(respawnRate+0.1), K / (travel/(130*speed/100) + actionWait*max((monsterHP/avgHit + 0.52)/hit%,1)))`; `killsPerHour=floor(3600*hourlyKills)`; K = clamp(AFK talent K, 1, 2.2) (`#L1260`). [C51, conf H]
- Final rate multiplies afkGains, survivability and `killPerKill` (multikill, `#L1503-1750`). [C52, conf H]

### M18 Other consumers of stats
- Cash bubbles PENNY_OF_STRENGTH / DOLLAR_OF_AGILITY / NICKEL_OF_WISDOM add per 250 of the stat (`P/character.ts#L2773-2849`); REELY_SMART and NOODUBBLE skill bubbles key off main stat STR/WIS (`P/character.ts#L595,662`). [C53, conf H]

### W5+ extensions (one line each)
- W5: Divinity gods (Gods Chosen Children, Power Orb, Flutterbis/Kattlekruk blessings), sailing artifacts, Hole (Cosmo, Well schematics, Monument, Fountain), gaming palette/superbits add damage terms. [C54, conf M]
- W6: farming (crop depot, land rank, exotic market, sticker multi), summoning (winner bonus, upg 79), sneaking charms (Pristine) add terms. [C55, conf M]
- W7: Minehead, Sushi, Jelly Operator, Spelunking shop 64, Coral Kid, Menagerie obol multi/Scurge, Legend talents add terms. [C56, conf M]
- Class-specific: Royal Guardian statues, Compass, Grimoire feed damage; Reliquarium exponent penalty. [C57, conf M]

## Additional mechanics (added from verifier review, 2026-10-19)

All Tier 1 unless stated, Toolbox pin 6c37e3d, paths relative to `P/`. Line numbers approximate; confidence M unless noted.

- **A1 Base vs total stat.** Gear, star sign, talent and bubble bonuses to STR/AGI/WIS/LUK are folded into the totals Toolbox exposes via `characters[].stats`; `StatList` alone is base (spent) points. ActiveOn cannot currently separate base from bonus. See `character.ts` stat assembly. conf M.
- **A2 Stat points per level, cost curve, respec.** Not parsed by Toolbox (both lenses agree). Unresolved; keep Q1 open. conf L.
- **A3 Boss damage and WIS boss damage.** `getMaxDamage` has no separate boss branch beyond the weekly boss multiplier (x<=2.5, see M9); WIS-based boss damage bonuses are not parsed separately. conf L.
- **A4 DoT / poison and non-hit damage.** Not modelled by Toolbox's kills/hr; only direct hit average is used. conf L.
- **A5 Skilling-efficiency stat uses beyond M2.** AGI anvil speed, WIS brew speed, LUK drop/EXP (M2, M3); mining efficiency is derived inside `getMaxDamage` via `getMiningEff`. conf M.
- **A6 Kills/hr D and K talents.** `getKillsPerHour` takes D/K multipliers from `getTalentEffectOnKills`: ATTACKS_ON_SIMMER, TWO_PUNCH_MAN, TRIPLE_JAB, DOUBLE_STRIKE, HAVE_ANOTHER, ALL_FOR_KILL bubble. Weapon/attack speed adds HYPERSWIFT, meal AtkSpd, lab chip, Deaths_Storage_Unit (see M17). conf M.
- **A7 Respawn and AFK gains.** `getRespawnRate` and map spawn caps bound `hourlyKills`; `getAfkGain` has a 1% minimum. conf M.
- **A8 Monster HP prayer curses.** Big_Brain_Time, Midas_Minded and Jawbreaker alter total monster HP in the kill-time term. conf M.
- **A9 Survivability inputs.** Health food, GOBLET_OF_HEMOGLOBIN, MANA_IS_LIFE healing; BORED_TO_DEATH respawn; Locally_Sourced_Organs; NO_PAIN_NO_GAIN and BRICKY_SKIN on monster damage (extends M15). conf M.
- **A10 Base-damage extras.** BIG_MEATY_CLAWS / QUICK_SLAP / NAME_I_GUESS log terms; food BaseDmgBoosts added after the softcap; Plunging Sword sigil (extends M5). conf M.
- **A11 Per-main-stat bubbles.** FARQUAD_FORCE, QUICKDRAW_QUIVER, SMARTER_SPELLS, LIL_BIG_DAMAGE, BAPPITY_BOOPITY, CHEAP_SHOT, SHAQURACY, HYPERSWIFT each key off the character's main stat or class. conf M.
- **A12 Tiptoe and accuracy prayers.** Accuracy gets TIPTOE_QUICKNESS when speed >1.99, and prayers Balance_of_Precision / Balance_of_Pain modify accuracy (extends M11). conf M.
- **A13 OVERACCURATE_CRIT.** Crit chance per-accuracy term uses `log(acc - 1.5*monster Defence)`, so it depends on the target monster (already in M13). conf H.
- **A14 Cash bubbles per 250 stat.** PENNY_OF_STRENGTH / DOLLAR_OF_AGILITY / NICKEL_OF_WISDOM (already in M18). conf H.

## Thresholds table (Goals and Milestones)

| Threshold | Effect | Claim |
|---|---|---|
| stat 1000 | stat curves change from ^0.37/0.4 power to asymptotic fraction | C15 |
| every 250 of main stat | +1 Trione bubble step | C34 |
| 2*WP + mainStat >= 150 | flat term stops growing | C27 |
| base damage 4,000 / 15,000 | exponent 0.91 / 0.84 | C26 |
| per-X 100 / 2e6 / 1e8 | exponent 0.86 / 0.5 / 0.3 | C32 |
| %damage 100 / 2e7 / 5e8 / 2e9 / 1.5e10 / 6e10 | exponent 0.86 / 0.8 / 0.6 / 0.45 / 0.36 / 0.28 | C35 |
| mastery | max 80% | C38 |
| speed | 175% cap only if pre-bonus <=175%; 175-200% band caps 200% after Tiptoe; >200% uncapped (Disputed) | C50 |
| accuracy / Defence | >=0.5 any hit, 1.5 = 100% vs monsters | C40 |
| kills/hr K | 1..2.2 | C51 |

## What ActiveOn's frontier damage uses

- `computeFrontier` never computes damage; the parse worker calls Toolbox `getMaxDamage` on a character clone moved to the frontier map and reads `finalKillsPerHour`, `killsPerHour`, `hitChance`, `survivability` into `FrontierFight`. FRONTIER_SECTIONS lists the account sections that must have parsed (a failed section makes the frontier null). Same call powers AFK facts (with and without food), purpose EXP/hour and walkthrough. ADR 0005: use Toolbox numbers, not our formulas. [C58, conf H][C59, conf H][C60, conf H]
- Unexposed: base stats (`characters[].stats`) live in Toolbox output but ActiveOn has no stats view, no unspent-point detector, no damage-breakdown view (per the M25 coverage audit). [C61, conf L]

## Min-max by stage

Evidence quality: the wiki gives no stat-allocation advice and community sources were not reachable (web-search budget exhausted this session); the priorities below are derived from code (tier 1) and flagged as derived, not community meta. Confidence L-M.

- **W1 early (levels 1-~30):** Put all points in the class main stat: it is the only stat that raises damage directly and, via `damageFromStat`, base damage, the 150-capped term and per-X (damage = stat^0.7). [C62, conf M] Below 150 combined (2*WP+stat), each main-stat point is worth a full point of the capped term plus the flat term, so early stat points are at their best value. [C27, conf H][C63, conf M]
- **W1 mid:** Keep main stat; watch hit chance: accuracy uses a different stat (STR class needs WIS, AGI class STR, WIS class AGI). If hitChance on the frontier map is <100 and accuracy ratio <1.5, a few points in the accuracy stat can be worth more than main stat because hit% is linear 95%/ratio. Check with Toolbox `hitChance` on the frontier map. [C40, conf H][C39, conf H][C64, conf L]
- **W1 late / W2:** Main stat still dominant; weapon power and %damage groups beat stat points once base damage passes the 4,000 softcap (exponent 0.91). [C26, conf H][C65, conf L]
- **W3:** LUK is the drop-rate/EXP stat (drop `1.4*curve`), valuable on alts or Beginner-line mains; for others keep main stat. Stat bubbles (Trione etc.) step per 250 of main stat, so round main stat up to the next 250 when close. [C16, conf H][C17, conf H][C34, conf H]
- **W4 / late:** Past 1000 every stat is on the flat asymptotic curve (max +0.5 more), so returns on crit (AGI), speed (AGI), drop/EXP (LUK), brew speed (WIS) diminish strongly; main stat still scales as stat^0.7 uncapped and Trione steps. Invest in multiplier groups (the %damage product) and move scaling tiers. [C15, conf H][C35, conf H][C66, conf L]
- **Per class:** STR (Warrior line): STR also boosts HP (stat^1.05) and crit damage. AGI (Archer): AGI boosts speed and crit chance, Quick Slap and Cheap Shot bubbles. WIS (Mage): WIS boosts MP, brew speed, Name I Guess. LUK (Beginner line): LUK serves damage and accuracy, drops, EXP. [C45, conf H][C46, conf H][C19, conf H][C17, conf H]
- **Priority orders from community:** none found; flagged Q2.

## Open questions

- Q1: Stat points granted per level, per-point cost, and respec rules are not in Toolbox or the fetched wiki pages. Needs wiki "Stats" page / game files (not reachable: idleon.wiki/wiki/Stats and Character_Stats returned 404).
- Q2: Community stat allocation meta (Reddit, Steam, IdleOn Academy) was not searchable (search budget exhausted); needs a follow-up pass.
- Q3: Crit constants 0.255 vs curve 0.297 at stat >= 1000: confirm in-game.
- Q4: Wiki hit-chance formula (142.5r - 42.5) vs Toolbox (95r - 42.5): which patch changed it.
- Q5: Whether to add a stats view and an unspent-stat-points detector to ActiveOn.

## Claims (index)

All numbered claims above are keyed to: Toolbox code at P/<file>#L<line> (tier 1), game data `vendor/data/website-data` (tier 1), idleon.wiki pages Damage/Strength/Agility/Wisdom/Luck fetched 2026-10-19 (tier 3), ActiveOn source under `packages/account-state/src` (project code, used for "what ActiveOn uses"). The structured claim list is returned separately.
