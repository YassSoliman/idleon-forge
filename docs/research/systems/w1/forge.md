# Forge dossier (M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` (abbrev. `V/`). Tiers: 1 game data/Toolbox code, 2 Toolbox logic, 3 wiki, 4 community. Confidence tags: H = confirmed in vendored code/data by both verifier lenses; M = confirmed by one lens or wiki/guide consistent with code; L = unverifiable here or single-source. Where a tier label was wrong, the vendored code is tier 1. Prior research (`research/w1-systems` forge.md, 2026-10-17) is cited as "prior" where it carried N.js-derived facts that this pass could not re-read (cost formulas, unlock flag); those are flagged UNVERIFIED-HERE.

## Forge

- **What it is:** the account's smelter in W1 town. Ore goes in a slot, bars come out, optional oil barrel per slot for speed or extra bars. Six coin upgrades. [C1][C2] (H)
- **Unlocks:** wiki: buyable in W1 town for 10 silver coins [C19]; prior: gated on `OptionsListAccount[249]`, offered once any character hits class Lv 18 [C20] (UNVERIFIED-HERE, L; tier overstated, it is prior N.js research not tier 1). Wiki confidence M [C19]. Glumlee's three quests teach it and give Glumlee's Special Tutorial Oil [C21] (H; the 'buy 2 forge upgrades' requirement for Glumlee3 is unchecked, L). Gem-shop Brimstone slots [C18]; Archer talent SMELTIN' ERRYDAY [C22].
- **Scope:** account-wide (single `ForgeItemOrder`/`FurnaceLevels` arrays, not per character). [C2] (H)
- **Inputs -> outputs:** ore + time (+ barrel) -> bars. Coins buy upgrades. Cycle: `Amount` ore -> 1 bar (+ extra-bar chance), taking `Cooldown/(4*slotSpeed)` s. [C5][C6] (H; C5 is vendored code, tier 1, not tier 2)
- **Goals and Milestones:**

| Milestone | Value | Source |
|---|---|---|
| Slots | 16 max (upgrade) | [C1] (H) |
| Ore capacity base at L50 | 13,270 (before multipliers) | [C14] (H; the `growth()` helper is not vendored, so the exact add-formula is M) |
| Forge Speed L90 | 550% of base speed | [C3][C24] (H code, M wiki; see Disagreements) |
| Bar Bonanza L75 | +75% extra bar chance | [C1][C24] (M; description only) |
| Puff Puff Go L60 | +120% forge-card drop chance (wiki) | [C24] (M) |
| Total upgrade levels 60/120/180/240/291 | AutoReview smithing tiers (prior) | [C31] (L, unverifiable) |

- **Feeds / fed by:** fed by Mining ore, coins, capacity sources [C15] (H). Feeds gear/anvil crafts, bar stamps, vials, Refinery, Post Office. Printer never samples bars ("bars come from the forge") [C27] (H). Storage ore refill arm uses the capacity cap [C13].
- **Per-session actions:** collect bars; refill every slot up to capacity with the best ore you can supply (scarcest bar on Brimstone slots); add barrels; buy cheap upgrades. Idle states: empty slot, `timeTillEmpty` shorter than the Expected Return, leftover ore below `Amount`. [C5][C28] (H). Caveat: Toolbox's `emptySlots` alert counts all 16 list entries without checking New Forge Slot level, so locked slots read as empty; ActiveOn must gate on `upgrades[0].level` (M; reported by verifier, alert code not in the vendored tree).
- **AFK Setup implications:** slots must hold ore for the whole AFK Stretch; Archers with SMELTIN' ERRYDAY add forge progress per kill in active and AFK play [C22] (data H; the active vs AFK behaviour is unverifiable here, L; wiki says it works Active/AFK and multikill counts, M); claiming AFK on Archers can drain storage ore stacks the forge refills from [C30] (L, tier 4).
- **Min-max by stage:** see section below.
- **Common mistakes:** empty slots; capacity too small for AFK; stale smelt times (pre-v2.29) [C25] **Disputed**: the cited Changelog_2025 page returns 404 and no v2.29 patch entry was found; wiki Bar table times equal game data, so no stale-time or 80%-cut claim is supported. Confidence L; kept only as a warning to prefer game-data times; smelting copper in a Brimstone slot; assuming the Toolbox oil-bribe value is right [C12]; forgetting Toxic Sludge is a double-bar barrel [C10] (H; wiki Bar lists all three extra-bar barrels).
- **Save and Toolbox fields:** see Mechanics catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

M1. **Slots.** 16 max via New Forge Slot (levels 0..16), parsed as 16 rows of 3 raw entries (ore, barrel, bar) with matching quantities. Field: raw `ForgeItemOrder`, `ForgeItemQuantity`||`ForgeItemQty` (V/parsers/world-1/forge.ts#31-33,110-122) -> `account.forge.list[i] = {isBrimestone, speed, ore{rawName,amount,timeTillEmpty(ms)}, barrel{}, bar{}}`. Whether slot i is usable is NOT gated by upgrade level in the parser (all 16 rows are parsed); the usable count comes from `upgrades[0].level` [C1][C2] (H) (H). Cost `200*5.4^(L^0.83)` (prior, UNVERIFIED-HERE, L) [C23].

M2. **Smelt cycle.** Ore `Amount` consumed per bar, `Cooldown` base seconds: `cycleSeconds = Cooldown/(4*slotSpeed)`. Cycles = floor(qty/Amount); leftover never smelts. `account.forge.list[i].ore.timeTillEmpty` (forge.ts#216-228) [C5][C6] (H).

M3. **Ore/bar table** (items.json `Amount`, `Cooldown`; 12 bars + Starlight): Copper 2/15, Iron 4/30, Gold 7/60, Platinum 16/200, Dementia 40/400, Void 100/750, Lustre 250/1300, Starfire 500/2000, Dreadlo 1000/3000, Marble 3000/5000, Godshard 6000/10000, Prehistrium 20000/15000, Starlight 4/100 [C6][C7] (H; note the Platinum key is `Plat` in items.json). Bars: CopperBar..PrehistriumBar, 12 BAR types in items.json, matching the wiki list [C8] (H). W1-W4 relevance: Copper-Dementia reachable by W4; Void+ are W5-W6 ores [prior mapping not re-verified; open question Q2] (L).

M4. **Forge Speed upgrade.** Max 90, +5 per level. `speed = round((100 + 5*L + 30*GodshardCardLv) * (1 + MenagerieBoost11/100))`; slot speed `= speed/100 * (1+barrel%/100 if speed barrel) * (1.5 if Brimstone) * 0.25` (forge.ts#103-106,205-214) [C3][C4] (H). Cost: L<5 `50*2.5^(L^0.51)`, else `400*1.2^(L-5)` (prior, UNVERIFIED-HERE, L; only the costMulti bases match forge.ts) [C23]. Menagerie term is `MenagerieBoost11`.

M5. **Ore Capacity Boost.** Max 50. `cap = BeegBeegForge * (20 + growth_add(10,10,L)) * (1+(Arcade26+GodshardCard)/100) * (1+ForgeStamp/100) * (1+(Bribe+Vault)/100) * (1+(Ach281+Mastery)/100)`, hard cap 2e9. L50 base 13,270 (forge.ts#164-202) -> `account.forge.oreCapacity.value` [C13][C14] (H, add-term M). Cost L<5 as above else `400*1.41^(L-5)` (prior, L) [C23].

M6. **Capacity multipliers** (each its own path) [C15] (H; the `stamps.json#2597` anchor is approximate, Forge_Stamp is at stamps.json ~2596-2617): Godshard card (+30% per card level; also speed); Forge Stamp (stat `ForgeCap`, stamps.json C10, decay x1=120 x2=250); Arcade shop bonus index 26 ("+% Forge Capacity", decay 100/100); Bribe Forge_Cap_Smuggling +30 (price 4.4e18); Upgrade Vault 26 "Beeg Forge" (maxLevel 100, unlock vault level 860); Achievement 281 Vitamin D-licious +50% (5,000,000 Orange Slices exactly in storage); Smithing Rift mastery tier index 1 +25% (needs rift >=15 and smithing rank >1); Beeg Beeg Forge (W5 Hole cosmo t2 i1, `max(1, 3^level)`).

M7. **Forge EXP Gain.** Max 85, +1% EXP from anvil production per level (wiki, M). Cost `400*1.21^(L-5)` (prior, L) [C23][C24]. Parser has no formula (display only). See M19 for the interaction with the Fire/Cinder Forge cards.

M8. **Bar Bonanza.** Max 75, +1% extra-bar chance per level. Cost `400*1.25^(L-5)` (prior, L) [C23][C24] (M). Parser has no formula (display only). Extra-bar chance also from DoubleBars barrels and Brimstone slots [C10][C18]; how these stack is unmodelled by Toolbox (see M20).

M9. **Puff Puff Go.** Max 60, +2% card drop chance per level while AFK (wiki, M). Cost `400*1.33^(L-5)` (prior, L) [C23][C24]. Consumer of the drop is not detailed in any tier 1-3 source (L). Related cards: Fire Forge (Smithing EXP +4 base), Cinder Forge (+7) [C26] (H; cards.json ForgeA C16 / ForgeB D16, ForgeA RespawnTime 86400).

M10. **Speed barrels.** Crude Oil +15% (consume 75), Radioactive Waste +30 (30), Eco Friendly Oil +10 (30), Glumlee's Special Tutorial Oil +999% (200) (items.json `Effect` SpeedForge) [C9].

M11. **Double-bar barrels.** Toxic Sludge 20% (60), Magma Barrel 40% (50), Plasma Barrel 60% (30) (`DoubleBarsForge`) [C10]. Toolbox does not model the extra-bar effect (no DoubleBarsForge handling in forge.ts). Wiki Bar lists all three (Toxic Sludge 20%/60, Magma 40%/50, Plasma 60%/30) [C10] (H).

M12. **Barrel consumption.** `Cooldown` is a % chance to consume one barrel unit per bar forged; Toolbox: barrel lasts `qty/(Cooldown*use/100)` cycles, `use = 1 - FossilFuelBribe/100` [C11][C12] (H).

M13. **Brimstone slots.** Gem shop `gemShopPurchases[104]`, max 16, base 100 gems (guide: 100-325 per, 3,400 total); first N slots (index < count) get x1.5 speed in Toolbox; in-game text also +50% multi-bar, unmodelled by Toolbox [C18] (H on gemShop index 104/max 16/cost 100; 3,400 total and 100-325 scaling are guide-sourced, tier 4, L).

M14. **Archer talent SMELTIN' ERRYDAY.** Each kill has x% chance (x1=50,x2=80 decay) to give y (1..60 intervalAdd) seconds of instant forge progress [C22] (H data; talents.json x1 50, x2 80).

M15. **Godshard card.** Card F39: +30 per card level to forge capacity AND speed (passive) [C15][C16] (H). The bonus scales with card level, so community '180%' figures are level dependent.

M16. **Menagerie (W7) Forge Speed.** Boost index 11: x forge speed, 75 per level (research.json[57]/[58], menagerie.ts#80-81) [C17] (H).

M17. **Glumlee tutorial quests.** Glumlee1 gives Tutorial Oil; Glumlee2 "Learning to Smelt" (smelt 1 Copper Bar -> 10 Bottled Town Teleport + EXP); Glumlee3 buy 2 forge upgrades (Mining Certificate etc.) [C21] (H for rewards/items in quests.json; upgrade requirement unchecked, L). Achievement Learn_2_Forge ("Get the mining certificate from Glumlee", reward 10 gems + 1hr time candy) exists in achievements.json (H). Task Forge_Foreman_Grillin ("smelt 25 Iron Bars", tasks.json ~385, breakpoint 1) is a forge-related merit task (H, see M24).

M18. **Smithing EXP link.** Forge EXP Gain + Fire/Cinder Forge cards feed Smithing EXP [C26] (H).

M19. **Forge EXP Gain vs cards.** Forge EXP Gain (upgrade) raises anvil-production Smithing EXP; Fire Forge (+4) and Cinder Forge (+7) cards add Smithing EXP (Passive) separately [C24][C26]. How they stack is not modelled by Toolbox. Confidence M (effect text H, stacking L).

M20. **Extra-bar chance stacking.** Sources: Bar Bonanza (+1%/level, max 75), DoubleBarsForge barrels (20/40/60%), Brimstone slots (+50% per in-game text). Toolbox models none; their combination (additive vs multiplicative) is unknown. Confidence L. Source: forge.ts (no handling), items.json, gemShop 104 [C10][C18][C24].

M21. **Locked-slot alert caveat.** Toolbox's empty-slots alert counts all 16 entries regardless of New Forge Slot level. ActiveOn must count only `upgrades[0].level` slots. Confidence M (verifier-reported; alert code not vendored). Source: forge.ts#30-35,107-161 (always 16 entries) [C2][C28].

M22. **Forge Stamp scaling.** stamps.json "Forge_Stamp" (StampC10, skillIndex 0): decay x1=120 x2=250, `baseMatCost` 250, `powMatBase` 8, `baseCoinCost` 5e12, `powCoinBase` 1.3, `reqItemMultiplicationLevel` 10, stat ForgeCap, itemReq Godshard Ore. Confidence H (data). Source: V/data/website-data/stamps.json#2596-2617, tier 1, 2026-10-19.

M23. **Upgrade Vault Beeg Forge.** Vault index 26, maxLevel 100, unlock vault level 860; cost curve x1 1600, x2 1.15; the bonus is affected by `upgrades[60]` higherBonuses. Confidence M (cost curve reported by verifier, not independently re-read). Source: upgradeVault data, tier 1 [C15].

M24. **Rift mastery gate.** Smithing mastery needs current rift >= 15 AND smithing rank > 1 (rank > tier). Confidence H [C15]. Also task Forge_Foreman_Grillin (smelt 25 Iron Bars, tasks.json ~385) and achievement Learn_2_Forge (name/reward only; requirement is the Glumlee mining certificate). Confidence H (data).

M25. **Not covered, open.** (a) Bars obtainable outside the forge (shops/drops): no tier 1-3 source found, L. (b) Printer/Refinery: the Printer never samples bars [C27]; Refinery and Salt Lick draw from the same ore/bar pools, so forge output competes with them (M, structural). (c) Forge UI entry points (W1 town forge, Smithing NPC): only wiki-sourced [C19], L. (d) Kill-triggered progress (M14) AFK vs active behaviour unverified, L.

W5+ extensions (one line each): Beeg Beeg Forge cosmo (W5 hole); Godshard/Prehistrium/Marble ores and bars (W5-W6 mining); Vitamin D-licious achievement and Beeg Forge vault; Menagerie Forge Speed (W7). [C15][C17] (H)

## Min-max by stage

- **Early W1:** do the Glumlee chain, then buy New Forge Slot and Forge Speed first, then Ore Capacity (prior; L, single-source) [C32]. Keep copper/iron smelting always (Incomplete Guide, via prior; L) [C32].
- **Mid W1 / W2:** gold and platinum bars for gear/stamps; Bar Bonanza once 6+ slots (prior, L: single-source) [C32]. Buy 1-2 Brimstone slots only; community tier A, not more because W5 capacity boosts dwarf it [C33] (M; gameslikefinder confirms A Tier and 'buy 1 or 2 initially').
- **Late W1/W2 -> W3:** slots toward 10+, speed 50+ (prior, L) [C32]. Forge Stamp as stamp budget allows [C15].
- **W3-W4:** the Refinery and vials draw bars; Godshard card gives big cap+speed later (community: "180% for both") [C34]. Many late players stop managing the forge because Archers make bars [C30] (L).
- **Priority order that exists:** no sourced strict upgrade order exists in tier 1-3; the above is community/prior. Cost curves [C23] let ActiveOn rank by `benefit/cost` instead: Speed (x1.2/level) is by far the cheapest per level at depth, Bonanza and Puff Puff Go (x1.25, x1.33) the costliest.

## Disagreements and confidence

- Oil bribe: game text says consumption chance becomes 80% of original; data `value` is 0.2 and Toolbox computes `1 - 0.2/100` = 99.8%. Confidence H that the two disagree, L on which is right [C12]. Confirmed: desc says 80%, value 0.2, price 55000, forge.ts#106 computes 1 - 0.2/100.
- Wiki "Ore Capacity = 10 x (2+level)" describes only the growth term; the code adds the 20 base and multipliers. Agree at L50 = 13,270 [C14]: 20 + 5*50*53 = 13,270 (M, helper unvendored). Confidence H on the number, M on the form.
- Wiki "+550% speed at L90" vs parser `100+5*90 = 550` total (i.e. +450% over base). Same number, different framing; the wiki figure is a total, not a bonus. Wiki also says 'five upgrades' but lists six [C3][C24]. Confidence H.
