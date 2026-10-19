# Cross-dossier contradictions 1: resolution log (M26)

Verified 2026-10-19 against N.js (game client, `https://www.legendsofidleon.com/ytGl5oc/N.js`, copy in the M26 work dir) and IdleOn Toolbox @ 6c37e3d (game 2.3.540). Paths relative to `packages/toolbox-parsers/vendor/`. Affected dossiers were fixed in place: rift.md, stamps.md, alchemy-vials.md, cards.md, salt-lick.md, alchemy-liquids.md, killroy.md, checklist.md.

- **What it is:** a log of four cross-dossier disagreements, how each was settled from game code, and what each dossier now says.
- **Unlocks:** n/a (meta dossier).
- **Scope:** Rift (account-wide), Salt Lick / liquids (account-wide), Killroy (account-wide).
- **Inputs -> outputs:** inputs are N.js and Toolbox reads; output is one verdict per contradiction.
- **Goals and Milestones:** see the verdict table.
- **Feeds / fed by:** rift.md, stamps.md, alchemy-vials.md, cards.md, salt-lick.md, alchemy-liquids.md, killroy.md, checklist.md.
- **Per-session actions:** none; ActiveOn rules in the verdicts.
- **AFK Setup implications:** none.
- **Common mistakes:** treating the wiki's Rift number as the code gate (off by one); treating Toolbox's Killroy room count as the game's; treating Salt Lick #6 as capacity-only.
- **Save and Toolbox fields:** `Rift[0]` -> `account.rift.currentRift` (`world-4/rift.ts#L11-L28`); `SaltLick[5]` -> `account.saltLick[5].level`; `OLA[227]` (3rd Killroy room), `OLA[113]` (rooms done); `finishedWorlds` (`quests.ts#L29-L44`).
- **Sources:** inline per claim, register at bottom.

## Verdicts

| # | Contradiction | Verdict | Confidence |
|---|---|---|---|
| 1 | Stamp Mastery Rift 25 vs 26 | Same event. Code gate `Rift[0] >= 25`; the game and wiki display Rift number as `Rift[0]+1`, so "Rift 26". [C1][C2][C3] | H |
| 2 | Vial Mastery Rift 35 vs 36 | Same event, same offset: code `Rift[0] >= 35` = displayed "Rift 36". [C2][C3][C4] | H (offset), M (no N.js site found by name) |
| 3 | Salt Lick #6 capacity only vs cap and rate | Both partly right. Capacity: only via the bleach/Dragonic term (Toolbox faithful). Rate: +1%/level on ALL liquids in the game's `LiquidHRrate`; Toolbox omits it. [C5][C6][C7] | H |
| 4 | Killroy room 2 gate | Game gate is `GenINFO[58] >= 4` (World 4 accessible = World 3 finished). Wiki and ActiveOn's World 3 gate agree; Toolbox `getKillRoy` ignores the gate (over-counts). The third room is NESTED inside that gate: it needs `GenINFO[58] >= 4` AND `OLA[227]==1`. [C8][C9][C10] | H (gate), M (proxy equivalence) |

Adversarial verification (2026-10-19, source lens and game-data lens): C1-C10 were each upheld by both lenses; none refuted, none Disputed. Refinements adopted from the verifiers: C8 nesting (above); C5 "only" was checked on about 1000 chars by the source lens but the game-data lens found both `SaltLick(5)` hits inside `CauldStatDN1bb` (confidence H); the wiki text in C3 could not be re-verified by the game-data lens (the code numbering could), so C3's wiki half is M.

## Mechanics catalogue

- **Rift display numbering:** displayed Rift = `Rift[0]+1`; bonus unlocks when `Rift[0] >= riftInfo index` (Toolbox `index <= currentRift`). Field `account.rift.currentRift`. [C1][C2]
- **Stamp Mastery (Rift[0] >= 25):** chance `GenINFO[106]/1e4` per login day, `25 > Rift[0] ? 0`; `randomFloat() < chance` -> `OLA[154]++`. [C1]
- **Vial Mastery (Rift[0] >= 35):** `2 * (#vials at level >= 13)` in the vial additive group (`world-2/alchemy.ts#L529-L545`). [C4]
- **Ruby Cards (Rift[0] >= 45):** `5starCards` = `45 > Rift[0] ? 0 : 1` (N.js @10781444). [C3]
- **Salt Lick #6 capacity:** `CauldStatDN1bb = 0.5+SL/100` (Bleach `GemItemsPurchased[106] > i`), `1` (Dragonic `OLA[123] > i`, no Bleach), `SL/100+2` (both), else 0; `maxLiquid = ceil((1 + bb + (meal + 5*mastery)/100) * ...)`. [C5]
- **Salt Lick #6 rate:** `LiquidHRrate` = base mult (1.95 Bleach+Dragonic, 1.5 Bleach, 1 none) x `(1 + cauldron + (research + StampLiquidSpd + SaltLick(5) + Sigil20 + SummoningVault38)/100)` x Mainframe 6 x Voting 12. [C6]
- **Killroy rooms:** 1; `GenINFO[58] >= 4` -> 2; and, only inside that block, `OLA[227]==1` -> 3 (3 rooms needs both). `GenINFO[58]` = world-reached index (2 = W2 unlocked), roughly the highest unlocked world, 2..7 from `KillsLeft2Advance[0/50/100/150/200/250][0] <= 0` (or Windwalker/Tesseract portal checks). [C8][C9]
- **Rift tasks and progress (confidence H for structure, L for exact thresholds):** `Rift` save = `[currentRift, currentProgress, chars]` (`vendor/parsers/world-4/rift.ts#L9-L18`). `riftInfo[i].task` is the per-rift task (kill N in 5 min, tear drops, skull points, orb/wormhole/pirate-flag score, AFK kills, kill all before respawn, mega-monster on 4 chars); entries 65-69 read "cannot progress further" (cap at the end of the data, game 2.3.540). Both lenses cite the completion test `Rift[1] >= RiftStuff[5][task]` (N.js; threshold values not re-extracted here, so L). Source: `vendor/data/website-data/shared-data.json` riftInfo; tier 1; 2026-10-19. ActiveOn does not yet read `currentProgress` as a goal.
- **Rift bonus map (code index, displayed = +1):** 5 Trap_Box_Vacuum, 10 Infinite_Stars, 15 Skill_Mastery, 20 Eclipse_Skulls, 25 Stamp_Mastery, 30 Eldritch_Artifact, 35 Vial_Mastery, 40 Construct_Mastery, 45 Ruby_Cards, 50 Killroy_Prime, 55 Sneak_Mastery, 60 Cooking_Mastery. Source: shared-data.json riftInfo `riftBonus` keys; tier 1; H. Gate is `index <= Rift[0]` for all of them, so the same off-by-one applies (displayed 6, 11, 16, 21, ...).
- **Infinite Stars / `enabledStarSigns` (Rift[0] >= 10):** the first `5 + shiny bonus (Infinite_Star_Signs)` catalog star signs count as equipped on every character, 0 before. Source: `vendor/parsers/starSigns.ts#L33-L37`; tier 1; H (game-data lens also cites the 5-plus-shiny formula).
- **Eclipse Skulls (Rift[0] >= 20):** a normal mob with strictly more than 1e9 kills ranks as Death Note rank 20 (`ECLIPSE_SKULL_KILLS`, `ECLIPSE_SKULL_RANK`); the bonus counts only Death Note worlds 0-5, excluding W6+ and mini-bosses. Source: `vendor/parsers/world-3/deathNote.ts#L65-L85`; tier 1; H.
- **Skill Mastery (Rift[0] >= 15) tiers:** per-skill second tiers read `RiftStuff("RiftSkillBonus,<skill>", 1)`: alchemy is `RiftSkillBonus,4` = `+5%` all liquid cap (`5 *` term in `LiquidCap`; Toolbox `alchemy.ts#L179`), smithing `,1` (`forge.ts#L56`), cooking `,9` efficiency (`cooking.ts#L160`), lab `,11` (`lab.ts#L434`), summoning `,17` +10% (`summoning.ts#L508`), spelunking skill 18 (`spelunking.ts#L1095`), talent 445 needs `,8` (`efficiency.ts#L636`). The rank needed ("200" for alchemy) is from the Toolbox comment; other skills' rank thresholds not extracted (L). Tier 1.
- **Killroy damage (`KillroyDMG`):** `1 + floor(totalKills^0.4)/100`, `totalKills` = sum of `KRbest` over the Death Note mobs only (summoning trial keys `SummzTrz0-6` in `KRbest` never count). Source: `vendor/parsers/misc.ts#L1584-L1594`; tier 1; H. `KillroyXtra` / `KillroyXtra2` / Killroy_Prime (Rift[0] >= 50) bonus magnitudes were named by the game-data lens but not extracted here: L. Third-room unlock: only the flag `OLA[227]==1` is known; HOW it is earned is not found in the vendored parsers: L. `OLA[113]` (rooms done) semantics unverified: L.
- **Gilded Stamps:** `OLA[154]` counts stored gilded stamps (daily roll on login, chance `GenINFO[106]/1e4`, 0 before Rift[0] >= 25). The verifiers cite a 95% stamp-upgrade cost reduction when one is spent; the spend path was not located in the vendored parsers, so the 95% figure and the spend mechanic are L. Source: N.js @15091541 (tier 1).
- **`mobRespBase`:** the game-data lens reports a Rift constant of 45 in mob respawn; not independently located, L.
- **World-gate alternatives:** `GenINFO[58]` is also set from Windwalker/Tesseract `CanWeEnterPortal` checks (thresholds 0/50/100/150/200 give 2-6), so a player can reach "world N" without the `KillsLeft2Advance` route; world finish for ActiveOn still uses the NPC-dialog proxy. N.js @5536145; tier 1; M.
- **W5+ extensions:** Rift 55 Sneak Mastery, 60 Cooking Mastery (displayed 56/61); GenINFO[58] 5..7 gate W5-W7 content.

## Min-max by stage

- **W1-W3:** no action; none of these contradictions is reachable. Do not gate any advice on Rift. [C2]
- **W4 early/mid:** Killroy room 2 appears the moment W4 is accessible; run it immediately. [C8]
- **W3 mid/late:** Spontaneity Salts (Salt Lick #6) is worth buying for rate on every liquid, and for capacity only if Bleach/Dragonic covers that liquid. Community priority order: not found (no source beyond the wiki), so none is invented. [C5][C6]
- **W4 late:** Rift displayed 26 (Stamp Mastery) then 36 (Vial Mastery); see rift.md for ordering.

## Open questions

- Which game site applies Vial Mastery by name (not found in N.js by string).
- How the third Killroy room (`OLA[227]`) is earned; what `OLA[113]` stores; the gilded-stamp spend path and 95% reduction; `KillroyXtra`/`KillroyXtra2` magnitudes; `mobRespBase` use; per-skill Mastery rank thresholds; Rift task thresholds.
- Whether `KillsLeft2Advance[100]` is exactly the W3 exit quota and how it aligns with the Carpenter Cardinal dialogue proxy.
- Whether the Toolbox UI shows liquid rate with Salt Lick (Toolbox gap) should be reported upstream.

## Claims register (verified 2026-10-19, game 2.3.540)

| Cid | Claim | Source | Tier | Confidence |
|---|---|---|---|---|
| C1 | Stamp Mastery gate is `25 > Rift[0] ? 0 : GenINFO[106]/1e4`; daily roll increments `OLA[154]` | N.js @10781884, @15091541 | 1 | H |
| C2 | The game draws "WELCOME_TO_RIFT_ / YOU'RE_IN_RIFT_ / ENJOY_YOUR_STAY_IN_RIFT_" + (`Rift[0]`+1); Toolbox unlock is `index <= currentRift` | N.js @8924838; `vendor/parsers/world-4/rift.ts#L24-L28` | 1 |
| C3 | Wiki lists every Rift bonus at code+1 (Stamp Mastery 26, Vial Mastery 36, Ruby Cards 46, Trap Box 6 ...); `5starCards` gate `45 > Rift[0]` | https://idleon.wiki/wiki/Rift (fetched 2026-10-19); N.js @10781444 | 3 / 1 |
| C4 | Vial Mastery at riftInfo index 35 gives `2 * #level-13 vials` | `vendor/data/website-data/shared-data.json` riftInfo[35]; `vendor/parsers/world-2/alchemy.ts#L529-L545` | 1 |
| C5 | Liquid capacity uses `SaltLick(5)` only in the bleach/Dragonic term | N.js `LiquidCap` @5116234-5116555; `vendor/parsers/world-2/alchemy.ts#L159-L187` | 1 |
| C6 | Liquid rate `LiquidHRrate` adds `SaltLick(5)` to the percent group in all three branches (x1.95 / x1.5 / x1) | N.js @5121626-5122463 | 1 |
| C7 | Salt Lick bonus = level x `SaltLicks[d][3]` | N.js `_customBlock_SaltLick` @7821917 | 1 |
| C8 | Killroy rooms: `GenINFO[58] >= 4` -> 2, `OLA[227]==1` -> 3 | N.js @4337500-4338300 | 1 |
| C9 | `GenINFO[58]` = highest unlocked world from `KillsLeft2Advance[0/50/100/150/200/250]` or Windwalker/Tesseract portal checks | N.js @5536145 | 1 |
| C10 | Toolbox `getKillRoy` rooms = 3 if `OLA[227]===1` else 2, no world check; `finishedWorlds.World3` = W3 gatekeeper NPC dialog | `vendor/parsers/misc.ts#L1592-L1593`; `vendor/parsers/quests.ts#L29-L44` | 1 | H |
