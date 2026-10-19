# Salt Lick (dossier)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` in the reference checkout (`TB:`). Revised 2026-10-19 after two adversarial verdict sets (source, game data). Community tier-4 coverage is thin (one gist); see Open questions. Every claim carries a confidence (H/M/L); **Disputed** marks claims one verifier lens refuted.

## Salt Lick

- **What it is:** A W3 Construction building where Refinery salts buy 11 permanent account-wide bonuses. [C1][C2] (H)
- **Unlocks:** Built at the Construction Table; the build payment is 20 Explosive Salts (salt 2). [C3] Each building level reveals one more upgrade, in table order; the `maxLevel` of the building is 11. [C4][C5] The game draws a blank slot past the unlocked count. [C4] The building itself has `bonusInc` 2 and `costInc` [1, 30] in `towers.Salt_Lick` (building-upgrade cost scaling; exact formula not traced). [C34] (M)
- **Scope:** Account-wide. Levels live in one array on the account, not per character. [C6]
- **Inputs → outputs:** Upgrade at level L costs `baseCost × increment^L` of its salt. [C7] All are salt-only since v1.17 (2026-06-06), which also added upgrade 11. [C8] Outputs are `level × baseBonus` summed into other systems; a stored level above `maxLevel` is clamped down on load. [C9][C35]
- **Goals and Milestones:** The cap column in the catalogue. Cheap caps (cost to max, geometric sum of `baseCost × increment^l`, l=0..max-1; matches within rounding, in-game display rounding unverifiable): #1 33.2K Redox, #2 6.0K Redox, #5 11.1K Spontaneity, #7 7.6K Dioxide, #9 11.1K Purple. [C10] (M)
- **Feeds / fed by:** Feeds 3D Printer sampling, Obol storage, Refinery speed, class/skill EXP (class EXP and skill EXP/AFK gain), Talent Book Library, Alchemy liquid capacity, Worship tower defence, move speed, Multikill, total damage, W4 Cooking Mastery. [C11] Fed by Refinery salts; the building level is fed by Construction. [C4]
- **Per-session actions:** Spend only salt not reserved for queued building payments (Spend Plan reserves payments first). Idle state: every unlocked upgrade is capped or unaffordable. Owned salt counts the logged-in character's inventory, storage and salts waiting in Refinery slots. [C12]
- **AFK Setup implications:** None direct. #3 is summed into refinery cycle speed (cycles get shorter); that fuel burns faster is an inference, not shown in the cited code (fuel consumption is not in refinery.ts#L117-L142). [C13] (L)
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** Building at 0 upgrades bought (`saltLick[i].unlocked && level == 0`). Spending Explosive on #4 EXP while buildings wait for Explosive. Trusting the wiki infobox "max 10" (stale; data says 11). Assuming #6 boosts liquid rate (Toolbox applies it to capacity only). Assuming Multikill (#9) works without the Death Note building. Trusting guides that list non-salt W3 materials as costs (pre-v1.17). [C5][C8][C14]
- **Save and Toolbox fields:** raw `SaltLick` (array of levels, parsed with tryToParse) and `TowerInfo[towers.Salt_Lick.index = 3]` for building level; parsed to `account.saltLick[]` with `{name, rawName, desc, baseCost, increment, baseBonus, maxLevel, level (clamped), unlocked (index < building level), totalAmount}`. Bonus read via `getSaltLickBonus(account.saltLick, index)`. [C4][C6][C9]
- **Sources:** inline per claim.

## Mechanics catalogue

Index = position in `account.saltLick[]` (= `data/website-data/shared-data.json` `saltLicks[]`). Cost per purchase at current level L = `baseCost × increment^L`; cost-to-max = geometric sum over L=0..max-1. [C7][C10]

1. **Upgrade #1 (idx 0) Printer Sample Size.** Redox; +0.5% sample size per level; max 20 (+10%); base 5, ×1.5; ~33.2K to max. Consumed in `getPrinterSampleRate` (character.ts#L3015) summed additively with talent/gear/bubble/vial/etc. [C15][C16] (H)
2. **Upgrade #2 (idx 1) Obol storage slots.** Redox; +4 slots per level (Circle, Square, Hexagon, Sparkle in order); max 8; base 10, ×2.3; ~6.0K. Data `baseBonus` is 1 (per-level step), the wiki's "max +32 slots" is derived. No Toolbox parser consumes idx 1 (grep of parsers finds no use). The in-game description says +4 slots but data `baseBonus` is 1; the 4 is not present in the data. [C17][C18][C36] (M)
3. **Upgrade #3 (idx 2) Refinery Speed.** Explosive; +2% per level, max 100 (+200%); base 5, ×1.15; ~39.2M. Consumed in refinery.ts#L117-L142 as `redMaltVial + saltLickUpgrade + amplifiedFamilyBonus`. Cycles take less time. [C19] (H for the cycle-speed sum; L for any fuel claim)
4. **Upgrade #4 (idx 3) Class and Skill EXP.** Explosive; +0.2% per level, max 100 (+20%); base 10, ×1.2; ~4.1B. Read in two places in character.ts: #L1674 (class EXP) and #L2160 (`getAfkGain`, skill EXP / AFK gain). [C20][C38] (H)
5. **Upgrade #5 (idx 4) Talent-book max level.** Spontaneity; +2 library max level per level, max 10 (+20); base 5, ×2.2; ~11.1K. Added to `maxBookLv` in misc.ts#L329 (base 125 + relics, atoms, merits etc.). [C21] (H)
6. **Upgrade #6 (idx 5) Alchemy liquid capacity AND rate.** Spontaneity; +1% per level, max 100 (+100%); base 10, ×1.122; ~8.2M. **Resolved (both halves right).** Resolved in contradictions-1 [X2] from N.js: the game applies `SaltLick(5)` in TWO places. (1) Capacity: only inside the bleach/Dragonic term `CauldStatDN1bb` (`0.5+SL/100`; Dragonic alone 1; both `SL/100+2`; neither 0), N.js `LiquidCap` @5116234-5116555, exactly as Toolbox. (2) Rate: `LiquidHRrate` @5121626-5122463 adds `SaltLick(5)` into the additive percent group `(1+(research speed + StampBonus LiquidSpd + SaltLick(5) + Sigil 20 + Summoning vault 38)/100)` in all three branches (Bleach+Dragonic x1.95, Bleach x1.5, neither x1), so +1% liquid rate per level applies to ALL liquids regardless of Bleach. Toolbox models only the capacity half (a Toolbox gap, rate is not computed in alchemy.ts). Confidence H (game code). Capacity: Toolbox alchemy.ts#L159-L187 (bleach/Dragonic branch only); rate: all liquids, all four. Model: capacity bleach-branch only, rate +1%/level on every liquid. [C22][C39][X2] (H)
7. **Upgrade #7 (idx 6) Worship tower-defence points.** Dioxide; +5% per level, max 10 (+50%); base 5, ×2.1; ~7.6K. Data confirms +5, max 10, base 5, ×2.1 and a Tower Defence points description, but no Toolbox parser reads idx 6, so the effect is unverifiable in code. [C18][C23] (L)
8. **Upgrade #8 (idx 7) Move speed.** Dioxide; +0.4% per level, max 25 (+10%); base 10, ×1.4; ~112K. Applied in character.ts#L3222 only in the branch where the pre-bonus speed is at or under 1.75, final cap 1.75; the in-game desc says 170%, which differs from the 1.75 cap; above 1.75 a different branch (cap 2, no Salt Lick) applies. [C24] (M)
9. **Upgrade #9 (idx 8) Multikill rate (all worlds).** Purple; +3% per level, max 10 (+30%); base 5, ×2.2; ~11.1K. Added in `getMultiKillBase` (damage.ts#L1622-L1632). Multikill itself needs the Death Note building; Death Note level adds +2% base multikill per level (damage.ts#L1634) and the overkill tier requires `towersTwo > 0.5` (damage.ts#L1511). [C25][C26][C37] (M)
10. **Upgrade #10 (idx 9) Total damage.** Purple; +0.1% per level, max 250 (+25%); base 10, ×1.04; ~4.5M. Inside the additive gear/lab multiplier in damage.ts#L364-L439. [C27]
11. **Upgrade #11 (idx 10) Cooking Mastery EXP (W4, Rift 61).** Nullo (salt 6); +1% per level, max 100 (+100%); base 100, ×1.22; ~197B. In cooking.ts#L369-L456 added to vial + arcade inside one `(1 + (vial + arcade + saltLick)/100)` factor (cooking.ts#L456). [C28] (H)
12. **Building level gate.** Upgrade i is purchasable only if `i < TowerInfo[3]`; level clamps to `maxLevel` on load. [C4][C35] (H)
13. **Owned-salt counting.** Logged-in character's inventory + storage + Refinery slot storage via `calculateItemTotalAmount`. [C12]
14. **W5+ extensions.** None found in 2.3.540 data: the table ends at 11 upgrades and the Nullo upgrade is the last. [C29]

## Min-max by stage

Priority orders below are inferred from value per salt and the one tier-4 source; no community-ranked upgrade list was found (Open questions). Confidence L-M.

- **W3 early (building just built, Redox/Explosive only):** #1 Printer Sample then #2 Obol slots, both cheap Redox. [C30] The gist only says to build and max the Printer first; no "then Salt Lick" ordering. [C31] Then #3 Refinery Speed in step with Explosive supply, after reserving Explosive for building payments. [C13][C30]
- **W3 mid (Spontaneity, Dioxide, Purple online):** #5 talent-book level and #9 Multikill (cheap caps), then #6 liquids and #7 tower points. [C30][C32] The gist says to max liquid Rate/Cap first, then follow the bottleneck; refinery speed is not in the gist (only a DK family bonus). [C32] Both views recorded; they differ on where #5/#9 sit; confidence L.
- **W3 late:** #8 move speed (~112K, small), #10 damage and #4 EXP as long-term sinks; #3/#6 toward cap. [C30]
- **W4:** #11 Cooking Mastery once Rift 61 Cooking Mastery is reached and Nullo flows; cheap early levels (base 100, ×1.22). (An earlier claim that the wiki calls #4 and #11 "essential" in W4+ was removed: the wiki page has no such text.) [C33][C28]
- **Per class:** no class dependence found; #8/#10 matter to every character, #9 matters to all kill-based play. [C25]

## Open questions

- Community priority list for Salt Lick upgrades (r/idleon, IdleOn Academy): not retrieved, search budget exhausted. Needs a human or a later agent.
- Does #6 apply to all liquids and to rate (wiki) or only bleach-branch capacity (Toolbox)? Check game code.
- Is #7 (worship TD points) and #2 (obol slots) applied in-game but simply not modelled by Toolbox? No parser reads them (idx 1, idx 6).
- Exact formula of building-upgrade cost scaling from `bonusInc` 2 / `costInc` [1, 30] on `towers.Salt_Lick`.
- Exact salt amounts at which Spend Plan should reserve for the Nullo upgrade pre-W4.
- Does multikill (#9) stack additively with everything in `MultiKill_base`, and what is the cap?

## Sources

See claim list. Patch: game 2.3.540. All verified 2026-10-19.

## Claims

(Tier / verified 2026-10-19 / game 2.3.540 unless stated.)

- [C1] Salt Lick spends refinery salts for permanent bonuses. Source: https://idleon.wiki/wiki/Salt_Lick (rev. 2026-10-07), tier 3. Confidence H.
- [C2] Account-wide upgrades table has 11 entries. Source: TB:data/website-data/shared-data.json `saltLicks[]`, tier 1. Confidence H.
- [C3] Building requires 20 Explosive Salts. Source: TB:data/website-data/shared-data.json `towers.Salt_Lick.itemReq`, tier 1. Confidence H.
- [C4] Building level `TowerInfo[3]` gates how many upgrades are unlocked; maxLevel 11. Source: TB:parsers/world-3/saltLick.ts#L14-L29 and shared-data.json `towers.Salt_Lick`, tier 1. Confidence H.
- [C5] Wiki infobox says max construction level 10, data says 11 (disagreement; data wins, confidence H). Source: https://idleon.wiki/wiki/Salt_Lick vs shared-data.json, tiers 3/1. Confidence H.
- [C6] Raw save key `SaltLick` holds the level array. Source: TB:parsers/world-3/saltLick.ts#L12, #L23, tier 1. Confidence H.
- [C7] Cost formula Scale^Level x BaseCost. Source: https://idleon.wiki/wiki/Salt_Lick, tier 3; base/increment from shared-data.json, tier 1; cost-to-max arithmetic checked for #1 (33.2K). Confidence M.
- [C8] All upgrades salt-only since v1.17 (2026-06-06), which added upgrade 11. Source: https://idleon.wiki/wiki/Changelog/2026 via prior research research/w3-systems construction.md, tier 3. Confidence M.
- [C9] Bonus equals baseBonus x level. Source: TB:parsers/world-3/saltLick.ts#L34-L40, tier 1. Confidence H.
- [C10] Cost to max per upgrade ~33.3K, 6.02K, 39.2M, 4.15B, 11.1K, 8.19M, 7.58K, 113K, 11.1K, 4.54M, 197B. Source: https://idleon.wiki/wiki/Salt_Lick, tier 3 (consistent with data formula). Confidence M. Data-lens: geometric sums reproduce the values within rounding; in-game rounding unverifiable.
- [C11] Consumers listed in the catalogue. Source: TB:parsers grep of getSaltLickBonus (character.ts, damage.ts, misc.ts, refinery.ts, alchemy.ts, cooking.ts), tier 1. Confidence H.
- [C12] Owned salts = logged-in character inventory + storage + refinery slot storage. Source: TB:parsers/world-3/saltLick.ts#L16-L20, tier 1. Confidence H.
- [C13] #3 shortens refinery cycles so fuel is spent faster. Source: TB:parsers/world-3/refinery.ts#L117-L142 and wiki desc, tier 1/3 (inference on fuel). Confidence L. Both lenses: cited lines only sum cycle-speed bonuses; fuel consumption is an unverified inference.
- [C14] Pre-v1.17 guides list non-salt costs. Source: prior research construction.md, tier 3. Confidence M.
- [C15] #1: Redox, +0.5/lvl, max 20, base 5, x1.5. Source: shared-data.json saltLicks[0], tier 1. Confidence H.
- [C16] Sample rate sums saltLick idx 0. Source: TB:parsers/character.ts#L3015, #L3030, tier 1. Confidence H.
- [C17] #2: Redox, +4 obol slots/lvl (Circle, Square, Hexagon, Sparkle), max 8, base 10, x2.3, baseBonus 1. Source: shared-data.json saltLicks[1], tier 1. Confidence H.
- [C18] Idx 1 and idx 6 are not read by any Toolbox parser. Source: grep of TB:parsers for getSaltLickBonus indices, tier 1. Confidence M.
- [C19] #3: Explosive, +2/lvl, max 100, base 5, x1.15; refinery speed. Source: shared-data.json saltLicks[2]; TB:parsers/world-3/refinery.ts#L117-L142, tier 1. Confidence H.
- [C20] #4: Explosive, +0.2/lvl, max 100, base 10, x1.2; EXP. Source: shared-data.json saltLicks[3]; TB:parsers/character.ts#L1674, #L2160, tier 1. Confidence H. Source verdict: verified at #L1674; also read at #L2160 (getAfkGain), now included.
- [C21] #5: Spontaneity, +2 book level/lvl, max 10, base 5, x2.2; in maxBookLv. Source: shared-data.json saltLicks[4]; TB:parsers/misc.ts#L329, tier 1. Confidence H.
- [C22] #6: Spontaneity, +1/lvl, max 100, base 10, x1.122; Toolbox applies it only inside the bleach-liquid branch, wiki says all liquids. Source: shared-data.json saltLicks[5]; TB:parsers/world-2/alchemy.ts#L159-L169; https://idleon.wiki/wiki/Salt_Lick, tier 1/3. Confidence M. **Disputed** (see catalogue #6). Capacity only, bleach branch (alchemy.ts#L159-L169, #L187).
- [C23] #7: Dioxide, +5/lvl, max 10, base 5, x2.1; Worship TD points. Source: shared-data.json saltLicks[6], tier 1. Confidence L. Data confirms idx6 +5 max 10 base 5 x2.1 with TD points desc, but no parser reads idx 6.
- [C24] #8: Dioxide, +0.4/lvl, max 25, base 10, x1.4; move speed, final cap 1.75 in the <=1.75 branch. Source: shared-data.json saltLicks[7]; TB:parsers/character.ts#L3222-L3225, tier 1. Confidence M. Cap 1.75 applies only in the branch where base speed <= 1.75; in-game desc says 170%.
- [C25] #9: Purple, +3/lvl, max 10, base 5, x2.2; Multikill, all worlds. Source: shared-data.json saltLicks[8]; TB:parsers/damage.ts#L1622-L1632, tier 1. Confidence H.
- [C26] Multikill needs the Death Note building at level 1. Source: prior research research/w3-systems worship-trapping-death-note.md, tier 3 (not re-verified in code). Confidence L. Not re-verified at claim time; see C37.
- [C27] #10: Purple, +0.1/lvl, max 250, base 10, x1.04; total damage. Source: shared-data.json saltLicks[9]; TB:parsers/damage.ts#L364, #L439, tier 1. Confidence H.
- [C28] #11: Nullo, +1/lvl, max 100, base 100, x1.22; Cooking Mastery EXP, Rift 61. Source: shared-data.json saltLicks[10]; TB:parsers/world-4/cooking.ts#L369, #L456, tier 1. Confidence H.
- [C29] No W5+ Salt Lick upgrade exists in the 2.3.540 data. Source: shared-data.json saltLicks length 11, tier 1. Confidence H.
- [C30] Early-to-late order #1, #2, #3, then #5/#9, #6/#7, then #10/#4 is opinion from value per salt. Source: prior research research/w3-systems construction.md Salt Lick section, tier 4 (opinion), confidence L. Confidence L.
- [C31] **Disputed** (weak). Original: Printer is built first, then Salt Lick. Correction: gist only says build and max the Printer first. Confidence L. Source: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (claimDate 2026-09-18), tier 4.
- [C32] **Disputed.** Original: refinery speed and liquid rate/cap first. Correction: gist says max liquid Rate/Cap first (refinery speed not in gist; only a DK family bonus), then follow the bottleneck; gives no strict tier list. Source: same gist, tier 4, confidence L.
- [C33] REMOVED: wiki "Soul Harvest and Cooking Mastery essential in W4+" was refuted (no such text on the wiki Salt Lick page; only a Cooking Mastery row mentioning Rift 61).
- [C34] `towers.Salt_Lick` has `bonusInc` 2 and `costInc` [1, 30] (building upgrade cost scaling). Source: TB:data/website-data/shared-data.json `towers.Salt_Lick`, tier 1. Confidence M (values read; usage formula not traced).
- [C35] `getSaltLick` clamps stored level to `maxLevel` and sets `unlocked = index < TowerInfo[3]`. Source: TB:parsers/world-3/saltLick.ts#L14-L32, tier 1. Confidence H.
- [C36] Redox idx 1 description says +4 obol slots per upgrade but `baseBonus` is 1. Source: shared-data.json saltLicks[1], tier 1. Confidence H.
- [C37] Death Note level adds +2% base multikill per level (damage.ts#L1634); overkill requires `towersTwo > 0.5` (damage.ts#L1511, re-read). Source: TB:parsers/damage.ts, tier 1. Confidence M (#L1634 not re-read).
- [C38] Salt Lick idx 3 is read at character.ts#L1674 and #L2160 (getAfkGain). Source: TB:parsers/character.ts, tier 1, re-read 2026-10-19. Confidence H.
- [C39] Salt Lick idx 5 feeds liquid capacity only (alchemy.ts#L159-L169, #L187), not rate. Source: TB:parsers/world-2/alchemy.ts, tier 1, re-read 2026-10-19. Confidence H.
