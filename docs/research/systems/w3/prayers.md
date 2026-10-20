# Prayers - M26 dossier

Verified 2026-10-19. Game 2.3.540, Toolbox pin 6c37e3d. `P` = `packages/toolbox-parsers/vendor/parsers/`, `D` = `packages/toolbox-parsers/vendor/data/website-data/`. Prior: `origin/research/w3-systems:docs/research/systems/w3-systems/shrines-prayers-equinox-bosses-quests.md` (N.js v1.23, 2026-10-17). Every number below was re-derived from the vendored data here (cost totals recomputed with `calcPrayerCost`); they match the prior. Tier-4 community sources could not be retrieved this run (see Open questions); Min-max lines are therefore marked DERIVED where they come from code analysis, not community consensus.

## Prayers

- **What it is:** 19 live account-owned buffs, each a paired Blessing and Curse, bought with the five Worship souls and equipped per character in a small number of slots. [C1][C2]
- **Unlocks:** each prayer is gated on a wave in one of five Worship Tower Defence zones (`unlockZone`, `unlockWave`), then bought at Lv 1 for `costMulti` souls. Prayers appear in W3 (Worship) but the first zones are cheap enough that an early W3 account has several. Tachion's achievement text says wave 10 of Waka TD, data says wave 11 (see C9). [C3][C9]
- **Scope:** levels are account-wide; equipped prayers are per character; slot count is account-wide. [C4][C5][C6]
- **Inputs -> outputs:** souls in; a character-wide blessing and curse out, both `round(x * (1 + (L-1)/10))`. Level never improves the blessing/curse ratio. [C7][C8]
- **Goals and Milestones:** slot thresholds (Wizard-line class level 1/60/85/110/150/170/200/250 + up to 4 gem slots); per-prayer Lv 5 (end of cheap curve) and max level; Tome "total prayer levels" line; achievement "Soulslike" (4 equipped). See Mechanics catalogue. [C5][C10][C11]
- **Feeds / fed by:** fed by Worship souls and TD waves, best Wizard-line class level, Gem Shop, W5 Gaming superbits. Feeds Class/Skill EXP, drop rate, coins, accuracy/damage/crit, multikill, carry capacity, AFK gain rate, AFK time cap, 3D Printer sample size, Trapping shinies, giants (Snouts 3, Bellows 3 quests), dungeons, minigames, Death Note kills. [C12]
- **Per-session actions:** (1) each character should have all slots filled with a prayer that suits its next AFK activity; (2) treat Unending Energy's '10 h max AFK' curse text as a Check at confidence M (Disputed, C13): the text says it, no Toolbox code enforces it, so avoid carrying it into an AFK stretch > 10 h until an in-game test confirms or refutes the cap; (3) spend souls on cheap sub-Lv-5 levels of in-use prayers; (4) buy newly unlocked prayers (cheap). Idle state = free slots with unequipped owned prayers. Souls themselves do not cap. [C13][C14]
- **AFK Setup implications:** skillers: Skilled Dimwit or Balance of Proficiency (mutually opposed); damage-safe fighters: Big Brain Time / Midas Minded / Jawbreaker; pushers: Beefy For Real / Balance of Precision; kill grinders: Fibers of Absence; giant farming: Tachion (game text only; Glitterbug's curse lowers giant spawn chance in Toolbox's formula, so do not pair them for spawn rate); printing: The Royal Sampler only while sampling; ≤10 h AFK: Unending Energy (the 10 h cap itself is M, Disputed, C13). Characters with zero prayers equipped benefit from superbits (W5). [C15][C16]
- **Min-max by stage:** see section below.
- **Common mistakes:** owned-but-unequipped prayers; Unending Energy overnight (Check at M, Disputed: the 10 h cap is curse text only, C13); HP-curse prayers on a damage-limited pusher; levelling past Lv 5 before buying more prayers (cost jumps ×1.12/level); expecting levels to improve the ratio; leaving Royal Sampler on (−30% All EXP, cannot unequip until samples are removed); mixing Skilled Dimwit with Balance of Proficiency. [C8][C14][C17]
- **Save and Toolbox fields:** see Mechanics catalogue (`account.prayers[]`, `characters[].activePrayers[]`, raw `PrayersUnlocked`/`PrayOwned`, character `Prayers`).
- **Sources:** inline per claim.

## Mechanics catalogue

### M1. Prayer list and base data
19 live prayers; indices 19-24 are `Some_Prayer_Name0` placeholders (wave 999, maxLevel 999) removed by `liveEntries` so they never reach `account.prayers`. Index 24's curse text reads "None. Even curses need time off every now and then", i.e. a future no-curse prayer (M, speculation from text only). [C2][C18]

| # | Prayer | Blessing x1 | Curse x2 | Soul | TD zone, wave | Max Lv | costMulti | Bless/Curse at max |
|---|---|---|---|---|---|---|---|---|
| 0 | Big Brain Time | +30% Class EXP | +250% monster Max HP | Forest | Goblin Gorefest 10 | 50 | 100 | 177 / 1475 |
| 1 | Skilled Dimwit | +30% Skill Efficiency | −20% Skill EXP | Forest | Goblin Gorefest 25 | 50 | 300 | 177 / 118 |
| 2 | Unending Energy | +25% Class and Skill EXP | Max AFK time 10 h (fixed) | Forest | Goblin Gorefest 51 | 50 | 600 | 148 / n.a. |
| 3 | Shiny Snitch | shiny critters in bundles: size `round((1+bonus)*bundleMulti)` (21 at Lv1) | shiny chance ÷`round(1+curse)` (16 at Lv1, 89 at max; earlier draft said ÷15) | Forest | Goblin Gorefest 81 | 50 | 1000 | 118 / 88 |
| 4 | Zerg Rushogen | +5% AFK Gain Rate | −12% Carry Capacity | Forest | Goblin Gorefest 121 | 20 | 3000 | 14 / 35 |
| 5 | Tachion of the Titans | giants can spawn on kill | (same) | Dune | Wakawaka War 11 | 2 | 100 | 11 / 11 |
| 6 | Balance of Precision | +30% Total Accuracy | −5% Total Damage | Dune | Wakawaka War 31 | 50 | 250 | 177 / 30 |
| 7 | Midas Minded | +20% Drop Rate | +250% monster Max HP | Dune | Wakawaka War 71 | 50 | 700 | 118 / 1475 |
| 8 | Jawbreaker | +40% Coins from monsters | +200% monster Max HP | Dune | Wakawaka War 101 | 50 | 1500 | 236 / 1180 |
| 9 | The Royal Sampler | +15% 3D Printer Sample Size | −30% All EXP; remove all samples to unequip | Rooted | Acorn Assault 21 | 20 | 100 | 44 / 87 |
| 10 | Antifun Spirit | +700% Minigame reward multi | minigames cost 9 plays per attempt | Rooted | Acorn Assault 41 | 10 | 600 | 1330 / 17 plays |
| 11 | Circular Criticals | +10% Crit Chance | −15% Crit Damage | Rooted | Acorn Assault 71 | 20 | 2000 | 29 / 44 |
| 12 | Ruck Sack | +30% Carry Capacity | −15% AFK Gain Rate | Rooted | Acorn Assault 111 | 50 | 4500 | 177 / 88 |
| 13 | Fibers of Absence | +30% kills for Death Note and portals | −15% Total Damage | Frigid | Frosty Firefight 21 | 50 | 100 | 177 / 88 |
| 14 | Vacuous Tissue | +100% Dungeon Credits and Flurbos (fixed text) | 2x Dungeon Passes per run | Frigid | Frosty Firefight 51 | 1 | 10 | fixed |
| 15 | Beefy For Real | +20% Total Damage | −10% Total Defence and Accuracy | Frigid | Frosty Firefight 121 | 40 | 5000 | 98 / 49 |
| 16 | Balance of Pain | +8% Multikill per damage tier | −15% Total Defence and Accuracy | Squishy | Clash of Cans 21 | 30 | 100 | 31 / 58 |
| 17 | Balance of Proficiency | +30% Skill EXP | −20% Skill Efficiency | Squishy | Clash of Cans 51 | 50 | 1000 | 177 / 118 |
| 18 | Glitterbug | +30% chance giants summon 2 crystal mobs | giants less likely to spawn (20%) | Squishy | Clash of Cans 131 | 30 | 7000 | 117 / 78 |

Data: `D/shared-data.json` `prayers` (L34322+). Soul names: Soul1-5 = Forest, Dune, Rooted, Frigid, Squishy. [C2][C19]

### M2. Blessing / curse formula
`value = x + x*(level-1)/10`, then `Math.round`. Level 0 (not owned) gives `x*(1-0.1)`, but a prayer is only usable when owned so level ≥ 1. Same constant lives in `wikiTables.prayerBonus = {offset 1, divisor 10}`. Rounding is applied by `getPrayerBonusAndCurse`. Curses of the same kind are summed additively by consumers (Max HP: `baseHp*(1+(BigBrain+Midas+Jawbreaker curse)/100)`). [C7][C20]

### M3. Cost formula (`calcPrayerCost`, next level from current level L)
- L < 6: `round(costMulti*(1 + (4 + i/25)*L))`.
- L ≥ 6: `round(min(2e9, costMulti*(1 + (1 + i/20)*L) * 1.12^(L-5)))`; The Royal Sampler (i = 9) uses `(2 + i/20)` and `1.3^(L-5)`.
- L = 0 gives the unlock cost = `costMulti`. The 2e9 cap is never reached within any prayer's max level (recomputed). Totals (souls): to Lv 5 / Lv 10 / max: Big Brain 4,500 / 11,226 / 5.70M; Skilled Dimwit 13,620 / 34,470 / 17.9M; Unending Energy 27,480 / 70,527 / 37.6M; Shiny Snitch 46,200 / 120,189 / 65.4M; Zerg 139,800 / 368,506 / 2.18M; Tachion 620 (max); Precision 11,850 / 32,031 / 18.4M; Midas 33,460 / 91,539 / 53.5M; Jawbreaker 72,300 / 200,123 / 119M; Royal Sampler 4,860 / 23,357 / 677k; Antifun 29,400 / 83,223 (max); Circular Crit 98,800 / 282,701 / 1.82M; Ruck Sack 224,100 / 647,982 / 407M; Fibers 5,020 / 14,664 / 9.32M; Vacuous 10; Beefy 255,000 / 759,656 / 121M; Pain 5,140 / 15,458 / 553k; Proficiency 51,800 / 157,222 / 104M; Glitterbug 365,400 / 1.12M / 40.8M. [C21][C22]

### M4. Slots
Slots = number of `RANDOlist[9]` thresholds ≤ best class level among Wizard (32), Elemental Sorcerer (34), Spiritual Monk (35), plus Gem Shop PRAYER_SLOTS purchases. `randomList[9]` = 1, 60, 85, 110, 150, 170, 200, 250 (then 9999 filler). Gem Shop item index 114 "PRAYER_SLOTS", base cost 250 gems, +75 per purchase, max 4 purchases (so 12 slots total; gem cost 250/325/400/475 if the increment is linear, M). The "Wizard-line only" class IDs come from the game client, not Toolbox (Toolbox has no slot function). [C5][C23]

### M5. Equip rules
A character's `Prayers` raw array holds prayer indices, `-1` = empty slot; Toolbox maps each to `account.prayers[id]` and drops unknown ones. The Royal Sampler cannot be unequipped while any 3D Printer sample is still set. Tachion has no "curse" beyond the same text; **Disputed:** the game text says giants need Tachion equipped, but Toolbox does not model that gate (the Tachion check in `P/misc.ts#L900` is commented out), so Tachion is game-text only in Toolbox. Confidence M. [C4][C9][C24]

### M6. No-prayer superbits (W5 Gaming)
Superbit 9 `No_more_Praying` (1/5), 39 `Prayers_Begone` (2/5 text), 53 `Prayers_Aint_Meta` (3/5 text). Code: active only if the character has zero equipped prayers AND (superbit 9 OR 39) is unlocked; each unlocked superbit of the three adds 0.2 to a multiplier (all three = 0.6); applies to every prayer with `level > 0.5` (owned-but-unlevelled Lv 0 prayers are excluded) except index 5 (Tachion); curses are zero. Result `round(multi * unroundedBonus)`. Superbit 53 alone does nothing. Note the description texts say 1/5, 2/5, 3/5 but code adds 1/5 each (max 3/5 total). [C25][C26]

### M7. Per-prayer effect consumers (where each effect is actually computed)
- Big Brain Time bonus: Class EXP (`P/character.ts#L2161`); curse: monster HP (`P/damage.ts#L1315`).
- Midas Minded bonus: Drop Rate (`P/character.ts#L2399`); curse: monster HP.
- Jawbreaker bonus: coins from monsters (`P/character.ts#L2785`); curse: monster HP.
- Unending Energy bonus: Class EXP (`#L2162`) and Skill EXP (`#L1668`); cap: 10 h AFK as curse text only (`prayers.facts.json`, `utility/dashboard/characters.js#L68`); Disputed, M: no parser code enforces it (see monster-afk.md C35).
- Skilled Dimwit: bonus efficiency (`P/efficiency.ts#L169`); curse skill EXP (`P/character.ts#L1670`). Balance of Proficiency: the reverse (`efficiency.ts#L170`, `character.ts#L1669`).
- The Royal Sampler: bonus sample size (`character.ts#L3021`); curse class EXP (`#L2163`) and skill EXP (`#L1671`).
- Balance of Precision: bonus accuracy (`P/damage.ts#L1021`); curse total damage (`#L409`). Beefy For Real: bonus total damage (`#L367`); curse defence/accuracy (`#L1022`, `#L1390`). Fibers: bonus Death Note/portal kills (`#L1552`); curse total damage (`#L410`). Balance of Pain: bonus multikill (`#L1674`); curse defence/accuracy (`#L1023`, `#L1391`).
- Circular Criticals: bonus crit chance (`#L1206`); curse crit damage (`#L1185`).
- Zerg Rushogen: bonus AFK gain rate (`character.ts#L3256`); curse carry capacity (`P/misc.ts#L1159`). Ruck Sack: bonus carry capacity (`misc.ts#L1160`, with `forceMaxCapacity` option); curse AFK gain rate (`character.ts#L3257`).
- Shiny Snitch: `round(1 + curse)` divides shiny chance; bonus is bundle size (`P/world-3/traps.ts#L200`).
- Glitterbug: giant spawn chance divided by `(1 + curse/100)` (`P/misc.ts#L898-L915`). Tachion: gate only in game text; the check is commented out in Toolbox (`misc.ts#L900`) and no Toolbox calculation consumes it. Giants are touched only via the Glitterbug curse (M7b). Shiny Snitch: divider `round(1+curse)`, bundle `round((1+bonus)*bundleMulti)` with Meritocracy and Menagerie multipliers (`traps.ts#L200-L218`). Glitterbug's bonus (2 crystal mobs) has no numeric consumer; `compass` only labels Crystal mobs "Glitterbug prayer".
- Antifun Spirit, Vacuous Tissue: no Toolbox consumer (game-side only; effects from data text). [C27]

### M7b. Giant spawn chance (`getGiantMobChance`, `P/misc.ts#L901-L919`)
Let n = `accountOptions[57]` (giants already spawned). If n < 5: `chance = 1/((100 + 50*(n+1)^2) * (1 + glitterbugCurse/100)) * (1 + (crescentShrine + giantMobVial)/100)`. Else: `1/(2*(n+1)^1.95 * (1+glitterbugCurse/100) * (n+1)^(1.5 + n/15)) * (same multiplier)`. The Glitterbug curse divides the chance (a penalty, matching its curse text "giants less likely to spawn"); one verifier described it as raising spawn chance, which the formula contradicts. **Disputed**, confidence M. Tachion check is commented out. Tier 1, verified 2026-10-19, game 2.3.540. [C35]

### M7c. Carry capacity cross-feed (`getAllCap`, `P/misc.ts#L1157-L1175`)
Carry = guild/talent x companion x shrine x `max(1 - ZergCurse/100, 0.4)` x `(1 + (RuckSackBonus + bribe + ramLvl2)/100)`. The Zerg curse multiplier is floored at 0.4. With `forceMaxCapacity` the Zerg curse is dropped and Ruck Sack is forced active (`forcePrayer`). Ruck Sack's curse and Zerg's bonus feed AFK gain rate (`character.ts#L3256-L3257`). Confidence H. [C36]

### M8. Tome and achievements
Tome line: sum of all live prayer levels (`calcTotalPrayersLevel`, `P/world-4/tome.ts#L368`; live prayers only, consumes the level sum only). Each parsed prayer also carries `totalAmount` of its soul from storage (affordability data). Achievements: "Big Mobs, Eek" (defeat 5 giants; needs Tachion), "Soulslike" (4 prayers in the Prayer Rock, reward 2% Arcade balls/hr). Quests Snouts3 and Bellows3 require a giant kill (Tachion). [C28][C29]

### M9. Alerts
Toolbox `worshipAlerts`: Unending Energy equipped and AFK > 10 h (an alert, not proof of an in-game cap; Disputed, M). [C13][C14]

### W5+ extensions (one line each)
- W5 Gaming superbits 9/39/53 (M6). [C25]
- No other prayer-specific mechanics found in Toolbox through W7 (grep over `P/**`); prayers listed as a W3 system only. [C30]

## Min-max by stage

Community meta (tier 4) could not be fetched this run: WebSearch budget exhausted and reddit.com blocked in WebFetch. The only community-style source in hand is the prior Reddit note (2026-09-28) quoted in the coverage audit: "Skilled Dimwit / Royal Sampler for prints". Everything else is DERIVED from code and data (tier 1-2) and marked so. Wiki (tier 3) gives only generic guidance: equip only prayers you actively use. [C31][C32]

- **W1 early/mid/late:** prayers are not yet available (Worship is W3). Nothing to do except to level the best Wizard-line character, since slots track its class level (60 = 2nd slot). [C5] DERIVED.
- **W2:** Wakawaka War and Goblin Gorefest waves are playable; wiki and achievement text point to Tachion's unlock in W2 (Waka TD, wave 10-11). [C9]
- **W3 early (1 slot, Forest/Dune souls):** first buys by cost-effectiveness: Big Brain Time (100 souls; +30% Class EXP) for EXP grinders who one-shot their map; Skilled Dimwit (300) for skillers; Tachion to Lv 2 (620 Dune) for the giant quests/achievements. Do not level past Lv 5 beyond these. [C3][C21] DERIVED.
- **W3 mid (Wizard 60-85, 2-3 slots):** Unending Energy (wave 51, 600) for ≤10 h loops (cap Disputed, M); Midas Minded (drops) for drop farming; Fibers of Absence once Frosty Firefight 21 is reached; The Royal Sampler only during printing. [C27][C33] DERIVED.
- **W3 late / W4 (4-5 slots):** pushers: Beefy For Real + Balance of Precision (note Beefy's curse hits accuracy and Precision's bonus offsets it; Precision's curse is small at -5%); Balance of Pain (multikill) and Vacuous Tissue for dungeon runs; Balance of Proficiency for the skill that is EXP-limited. HP-curse prayers (Big Brain, Midas, Jawbreaker) stack additively, so all three at Lv 1 is +700% monster HP: only run them on maps the character one-shots. [C20][C27] DERIVED.
- **Priority order for souls (DERIVED, cost per effect):** unlock every cheap prayer you will use (≤ 1,500 souls each) → level the in-use ones to Lv 5 (~4.5k-72k souls) → past Lv 5 level only the 2-3 prayers each equipped set actually uses; costs grow ×1.12 per level (×1.3 Royal Sampler). [C21]
- **Per class:** the Wizard line drives slots; warriors/pushers want Beefy + Precision; skillers (hunter, bowman, shaman) the skill prayers; no prayer is class-locked in Toolbox code. [C5][C34]
- **W5+:** with superbits 9/39/53, a character with no prayers equipped gets 20-60% of every levelled prayer's blessing and no curses (Tachion excluded), which beats equipping curse prayers for passive characters. [C25]

## Sources (additional prose, claims below)

Wiki: https://idleon.wiki/wiki/Prayers (read 2026-10-19; mentions "v1.50 level caps", 2022, consistent with data); https://idleon.wiki/wiki/Worship (read 2026-10-19; its numbers for "waves 30-177" are garbled bonus ranges, not wave gates, disregard). Prior research file and N.js symbols as quoted in the prior (v1.23, 2026-10-17).

## Claims

[C1] 19 live prayers (indices 0-18). Source: `D/shared-data.json#prayers` L34322+, `P/catalog.ts` placeholder filter. Tier 1. Verified 2026-10-19. Patch 2.3.540. Confidence H.
[C2] Indices 19-24 are placeholders `Some_Prayer_Name0` (wave 999, maxLevel 999) filtered out by `liveEntries`. Source: `D/shared-data.json#prayers`, `P/catalog.ts#L1-L25`. Tier 1. Confidence H.
[C3] Each prayer unlocks at an `unlockZone`/`unlockWave` pair and costs `costMulti` souls at Lv 1. Source: `D/shared-data.json#prayers`, `P/world-3/prayers.ts#L70-L80`. Tier 1. Whether the wave gate itself is enforced in the save was not verified in Toolbox (Toolbox has no TD wave field); the prior and wiki say it is. Confidence M.
[C4] Equipped prayers are per character: raw `char.Prayers` array, `-1` empty, mapped to `account.prayers[id]` into `character.activePrayers`. Source: `P/character.ts#L433`. Tier 1. Confidence H.
[C5] Slots: thresholds 1, 60, 85, 110, 150, 170, 200, 250 of the best Wizard-line class level (classes 32, 34, 35) plus gem slots; wiki: "the level of your BEST wizard". Source: `D/randomList.json` index 9; prior dossier citing N.js prayer UI @7733424 and @7673614 (v1.23, 2026-10-17); https://idleon.wiki/wiki/Prayers. Tier 1 (data and game code), 3 (wiki). Confidence H.
[C6] Prayer levels are account-wide: raw `PrayersUnlocked` (legacy `PrayOwned`), `level = prayersRaw[index] ?? 0`. Source: `P/world-3/prayers.ts#L10-L26`. Tier 1. Confidence H.
[C7] Blessing and curse are `x + x*(level-1)/10`, rounded. Source: `P/world-3/prayers.ts#L50-L65`; `D/wikiTables.json#prayerBonus` offset 1 divisor 10. Tier 1. Confidence H.
[C8] Because both scale by the same factor, levelling never changes the blessing:curse ratio. Source: derived from C7. Tier 1 (derivation). Confidence H.
[C9] Tachion of the Titans: gate for giant monsters (needed for Snouts3, Bellows3, Big_Mobs_Eek); data says Waka wave 11, achievement text says "wave 10 of Waka Tower Defence (world 2)". Source: `D/shared-data.json#prayers[5]`, `D/achievements.json` L2152, `D/quests.json` L6895, L8143. Tier 1. Both views recorded; confidence M (wave 10 vs 11 off-by-one unexplained, likely "wave 11 reached" = "beat wave 10").
[C10] Tome includes the sum of all prayer levels. Source: `P/world-4/tome.ts#L368`, `P/world-3/prayers.ts#L81`. Tier 1. Confidence H.
[C11] Achievement "Soulslike": 4 prayers in the Prayer Rock, reward "2% Arcade balls/hr". Source: `D/achievements.json` L2192. Tier 1. Confidence H.
[C12] Prayer effects are consumed by damage, accuracy, EXP, drop, coin, carry, AFK, shiny, giant (Glitterbug curse only) and Tome parsers; Tachion is not consumed (check commented out, `P/misc.ts#L900`). Source: grep of `getPrayerBonusAndCurse` in `P/damage.ts`, `P/character.ts`, `P/misc.ts`, `P/efficiency.ts`, `P/world-3/traps.ts`. Tier 1. Confidence H.
[C13] **Disputed.** View A (prayer data): curse text "Max AFK time is now 10 hours. Use with caution" (client N.js prayer table carries the same string, the only occurrence of Unending_Energy in the client file). View B (code): no Toolbox parser reads a 36,000 s cap (calculateAfkTime in `P/misc.ts#L681-L683` has no cap; the prayer is read only for Class/Skill EXP, `P/character.ts#L1668`, `#L2162`), and no in-game test is on record. Both views kept; dependent Checks (Unending Energy overnight, worship AFK setup, monster-afk cap) all carry M, Disputed until an in-game test. Source: `packages/knowledge/generated/prayers.facts.json`, `D/shared-data.json#prayers[2]`, see monster-afk.md C35. Tier 1. Confidence M (was H; downgraded 2026-10-19).
[C14] Toolbox alert: Unending Energy equipped and AFK longer than 10 h. Source: `utility/dashboard/characters.js#L68-L75`. Tier 2. Confidence L (the alert encodes the curse text; it is not evidence of enforcement).
[C15] Skill efficiency vs skill EXP are opposing pairs: Skilled Dimwit (+eff, −skill EXP) and Balance of Proficiency (+skill EXP, −eff). Source: `P/efficiency.ts#L169-L170`, `P/character.ts#L1668-L1670`. Tier 1. Confidence H.
[C16] The Royal Sampler curse cannot be removed while samples are set. Source: curse text in `D/shared-data.json#prayers[9]`. Tier 1. Confidence H.
[C17] Royal Sampler curse is −30% All EXP at Lv 1 (applied to both class and skill EXP). Source: `P/character.ts#L2163`, `#L1671`. Tier 1. Confidence H.
[C18] Index 24 curse text hints at a future no-curse prayer. Source: `D/shared-data.json#prayers[24]`. Tier 1, interpretation M/L. Confidence L.
[C19] Soul mapping: Soul1-5 = Forest, Dune, Rooted, Frigid, Squishy; per-prayer soul in the data. Source: `D/shared-data.json#prayers`, `D/items.json`; https://idleon.wiki/wiki/Worship. Tier 1/3. Confidence H.
[C20] Max HP curses of Big Brain Time, Midas Minded and Jawbreaker add: `baseHp*(1+(a+(b+c))/100)`. Source: `P/damage.ts#L1313-L1320`; `P/misc/boneJoeCalculator.ts#L57-L60`. Tier 1. Confidence H.
[C21] Cost: L<6 `round(m*(1+(4+i/25)*L))`; L≥6 `round(min(2e9, m*(1+(1+i/20)*L)*1.12^(L-5)))`; Royal Sampler `(2+i/20)`, `1.3^(L-5)`; recomputed totals in M3. Source: `P/world-3/prayers.ts#L70-L80`, `D/shared-data.json#gameTables.prayerCost` L10187. Tier 1. Confidence H.
[C22] The 2e9 cost cap is never reached within any prayer's max level. Source: recomputation with C21 for all 19 prayers, 2026-10-19. Tier 1 (derivation). Confidence H.
[C23] Gem Shop "PRAYER_SLOTS": +1 equipped prayer on all characters, base 250 gems, increment 75, max 4 purchases, globalIndex 114. Source: `D/gemShop.json#L615-L625`. Tier 1. Confidence H.
[C24] The Royal Sampler is unequipped only after all samples are removed. Source: `D/shared-data.json#prayers[9]` curse text. Tier 1. Confidence M.
[C25] Superbits `No_more_Praying` (9), `Prayers_Begone` (39), `Prayers_Aint_Meta` (53): when zero prayers are equipped and (9 or 39) is unlocked, each unlocked of the three adds 0.2 of the unrounded bonus for every prayer with level > 0.5 except Tachion; curses 0. Source: `P/world-3/prayers.ts#L30-L67`, `D/shared-data.json` L44725, L44935, L45033. Tier 1. Descriptions say 1/5, 2/5, 3/5 while code adds 1/5 each (max 3/5); both views recorded, confidence M for the superbit-53-alone case.
[C26] Superbit rule is "only when no prayers equipped"; `forcePrayer` is Toolbox-only (it treats a prayer as active with zero curse). Source: `P/world-3/prayers.ts#L28-L67`. Tier 2. Confidence H.
[C27] Antifun Spirit and Vacuous Tissue have no Toolbox consumer; effects come from data text only (+700% minigame reward multi, 9 plays; +100% dungeon credits and flurbos, 2x passes). Source: grep over `P/**` found no references; `D/shared-data.json#prayers[10]`, `[14]`. Tier 1/2. M. Confidence M.
[C28] Achievement "Big Mobs, Eek": defeat 5 giants; game text says Tachion is required, unlocked by wave 10 of Waka TD (**Disputed**: Toolbox does not model the Tachion gate). Source: `D/achievements.json` L2152. Tier 1. Confidence M.
[C29] Quests Snouts3 and Bellows3 need a giant kill; quest text says a prayer is needed (**Disputed** for Tachion specifically: not modelled in Toolbox). Source: `D/quests.json` L6895, L8143. Tier 1. Confidence M.
[C30] No prayer mechanics beyond superbits found through W7 in Toolbox. Source: grep of `P/**` (this run). Tier 1 (absence), M. Confidence M.
[C31] Wiki gives no prescriptive per-stage prayer priorities; says equip only prayers you actively use and pick by farming focus. Source: https://idleon.wiki/wiki/Worship, read 2026-10-19. Tier 3. Confidence L.
[C32] Community note: Skilled Dimwit / Royal Sampler for 3D Printer prints. Source: Reddit r/idleon 2026-09-28 as cited in `scratchpad/ux/m25-coverage.md` L130 (not re-fetched; reddit blocked). Tier 4. Confidence L.
[C33] Fibers of Absence raises Death Note and portal kills; curse −Total Damage. Source: `P/damage.ts#L1552`, `#L410`. Tier 1. Confidence H.
[C34] No prayer is class-locked in Toolbox code. Source: grep of all consumers, no class checks. Tier 1 (absence). Confidence H.

[C35] `getGiantMobChance` formula (M7b); Glitterbug curse divides the chance. Source: `P/misc.ts#L901-L919`. Tier 1. Confidence H for code, M for in-game meaning.
[C36] Carry cap and Zerg/Ruck Sack cross-feed (M7c). Source: `P/misc.ts#L685`, `#L1157-L1175`; `P/character.ts#L3256-L3257`. Tier 1. Confidence H.
[C37] Shiny Snitch real numbers: divider `round(1+curse)` = 16 at Lv1, 89 at max; bundle `round((1+bonus)*bundleMulti)` = 21 at Lv1. Source: `P/world-3/traps.ts#L200-L218`. Tier 1. Confidence H.

## ActiveOn gap notes

Today: `systems.yaml` entry (scope marked character, but levels and slots are account-wide: CORRECTION), a `PrayersPage` with `account.prayers`, `characters[].afk.prayers`, one generated fact (Unending Energy cap), no detectors, no `prayers.yaml`. Sprites: one generic `item-prayer` (mapped from `sys-prayers`) and `item-soul`. Needed sprites: five per-type souls (Forest, Dune, Rooted, Frigid, Squishy) and 19 prayer icons (or at least one per effect family: EXP, drop/coin, HP-curse, accuracy/damage, carry/AFK, giant, minigame, dungeon). Not drawn in this research task.
