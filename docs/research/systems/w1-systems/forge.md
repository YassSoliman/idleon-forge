# Forge (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there.

## Forge

- **What it is:** the account's smelter in the W1 town. Ore goes into a slot and comes out as bars, with optional oil barrels for speed or extra bars. Six coin upgrades raise slots, capacity, speed, EXP, extra-bar chance and AFK card chance. (H: Toolbox `parsers/world-1/forge.ts`; N.js `_customBlock_ForgeStats`, `_customBlock_ForgeUpdateCosts`, `_customBlock_ForgeSpeeed`, `_customBlock_ForgeInterval`)
- **Unlocks:**
  - The Furnace actor in the W1 town is hidden until OptionsListAccount[249] is set. The town offers it for purchase once **any character reaches class Lv 18**. (H: N.js GrasslandaTown init, threshold list 7/14/18/22/28; the wiki says "made available in World 1 town by buying it for 10".)
  - Glumlee's 2nd and 3rd quests ("Learning to Smelt", "Literally Burning your Money": buy 2 Forge upgrades) teach it and give Glumlee's Special Tutorial Oil. (H: Toolbox `quests.json` `Glumlee`)
- **Scope:** account-wide. One forge, shared slots, and bars go to whoever collects them.
- **Inputs → outputs:**
  - **Ore → bars.** Each smelt cycle eats `Amount` ores and takes `Cooldown / (4 · ForgeSpeeed)` seconds. ForgeSpeeed = `round(100 + 5·SpeedLv + 30·GodshardCardLv)·(1 + Menagerie11/100) / 100`, ×(1 + barrel%) with a speed barrel, ×1.5 on a Brimstone slot, ×0.25 tick share. (H: Toolbox `getSpeed`, `getTimeTillEmpty`; N.js)

| Ore | Ores per bar | Base seconds per bar (Cooldown) |
|---|---|---|
| Copper | 2 | 15 |
| Iron | 4 | 30 |
| Gold | 7 | 60 |
| Platinum | 16 | 200 |
| Dementia | 40 | 400 |
| Void | 100 | 750 |
| Lustre | 250 | 1,300 |
| Starfire | 500 | 2,000 |
| Dreadlo | 1,000 | 3,000 |
| Marble | 3,000 | 5,000 |
| Godshard | 6,000 | 10,000 |
| Prehistrium | 20,000 | 15,000 |
| Starlight (special) | 4 | 100 |

  (H: Toolbox `items.json` `Amount`/`Cooldown`. These match the v2.29 (2025-02-15) change "Reduced time needed to forge bars from ore by −80%". **Any guide quoting 50 / 150 / 350 / 1,000 s is pre-2025 and Stale.**)

  - **Barrels:**
    - Speed: Crude Oil +15%, Radioactive Waste +30%, Eco Friendly Oil +10%, Glumlee's Tutorial Oil +999%.
    - Extra bars: Magma Barrel, Plasma Barrel.
    - Barrels are used up per cycle (`Cooldown` field). The Fossil Fuel Legislation bribe barely changes that (0.2%; see [bribes.md](bribes.md)).
  - **Max ores per slot** = `CosmoBeegBeegForge · (20 + 5·L·(L+3)) · (1 + (Arcade26 + 30·Godshard)/100) · (1 + ForgeStamp/100) · (1 + (Bribe35 + Vault26)/100) · (1 + (50·Achievement281 + 25·SmithingMastery)/100)`, capped at 2B, where L is the Ore Capacity Boost level (`ArbitraryCode5Inputs("add",10,10,L)`; 13,270 base at L 50, which matches the wiki). (H: N.js `ForgeStats(1)`; Toolbox `getForgeOreCapacity`) Storage refills slots up to this cap (the W3 Automation arm).
  - **Upgrades** (coin cost of level L → L+1; H: N.js `ForgeUpdateCosts`, max levels from Toolbox):

| Upgrade | Max | Effect | Cost formula | Cumulative cost to selected levels |
|---|---|---|---|---|
| New Forge Slot | 16 | +1 slot | `200 · 5.4^(L^0.83)` | 5 ≈ 60K, 10 ≈ 11M, 16 ≈ 2.9B |
| Ore Capacity Boost | 50 | base cap 20 + 5·L·(L+3) | L<5: `50 · 2.5^(L^0.51)`; else `400 · 1.41^(L−5)` | 10 ≈ 5.4K, 20 ≈ 169K, 30 ≈ 5.3M, 50 ≈ 5.1B |
| Forge Speed | 90 | +5% speed/level | L<5 as above; else `400 · 1.2^(L−5)` | 20 ≈ 30K, 50 ≈ 7.3M, 75 ≈ 698M, 90 ≈ 10.8B |
| Forge EXP Gain | 85 | +1% Smithing EXP from the anvil/level (wiki) | else `400 · 1.21^(L−5)` | 50 ≈ 10M, 85 ≈ 8B |
| Bar Bonanza | 75 | +1% extra-bar chance/level | else `400 · 1.25^(L−5)` | 50 ≈ 37M, 75 ≈ 9.7B |
| Puff Puff Go | 60 | +2% AFK card chance/level (Forge cards) | else `400 · 1.33^(L−5)` | 30 ≈ 1.5M, 60 ≈ 7.9B |

  - **Brimstone Forge Slot** (gem shop, `gemShopPurchases[104]`): ×1.5 speed and +50% multi-bar on that slot (wiki).
- **Goals and Milestones:**

| Milestone | Why |
|---|---|
| Slots filled with the best ore you can supply, none empty | Toolbox `emptySlots` alert |
| Forge total upgrade levels 60 / 120 / 180 / 240 / 291 | AutoReview smithing tiers 1–5 (L) |
| Puff Puff Go levels | Forge-card drops while AFK (cards dossier) |
| Capacity so a full slot lasts at least the Expected Return | `getTimeTillEmpty` vs Expected Return (ADR 0005 arithmetic) |

- **Feeds / fed by:**
  - **Fed by:** ore from Mining (skills dossier); coins; the Godshard Ore card; the Forge Stamp; Arcade bonus 26 (W2); Upgrade Vault 26; the Vitamin D-licious achievement (W5); Smithing mastery (Rift); the Menagerie (W7, v1.23); Beeg Beeg Forge (W5 Hole cosmo).
  - **Feeds:** bars for gear and anvil crafts, [Stamps](stamps.md) (bar-material stamps), Alchemy vials (W2), the Refinery (W3), Post Office orders (Copper/Iron/Gold Bar in Simple Shippin), and Forge cards.
- **Per-session actions:**
  1. Collect the bars.
  2. Refill the slots with ore, putting the scarcest bar's ore on the Brimstone slot.
  3. Add barrels if you have them.
  4. Buy cheap upgrades.
  - **Capped or idle states:** an empty slot; the ore running out before the Expected Return; output at max.
- **AFK Setup implications:** before an AFK Stretch, every slot needs enough ore for the Expected Return (`timeTillEmpty`). That means a Mining character AFK on the needed ore, or storage stacks. Late-game warning (r/idleon, 2026-04-14): claiming AFK on Archers can drain ore stacks from storage that the forge refills from. Keep a reserve.
- **Min-max by stage:**
  - **Early W1:** Glumlee's quests, then New Forge Slot and Forge Speed first, then Ore Capacity Boost. Keep Copper and Iron smelting at all times ("always have ores smelting", Incomplete Guide).
  - **W2:** Gold and Platinum bars for gear and stamps. Bar Bonanza once slots are 6+. Puff Puff Go for Forge cards.
  - **W3:** slots toward 10+, speed 50+. The Refinery and vials need bars.
  - **Late:** many players stop actively managing the forge, because Archers make bars (L).
  - **Per class:** none; the forge is account-wide.
- **Common mistakes:**
  - Empty slots.
  - Ore storage too small for the AFK Stretch.
  - Ignoring the forge (the Incomplete Guide headline is "DONT FORGET!").
  - Relying on old smelt times.
  - Buying the Brimstone slot and then smelting copper in it.
  - For reference, the W2 fixture had 6 slots and speed level 35; the W3 fixture had 11 slots, speed level 62 and a Brimstone slot.
- **Save and Toolbox fields:**
  - Raw `ForgeItemOrder` (3 per slot: ore, barrel, bar), `ForgeItemQty` / `ForgeItemQuantity`, `ForgeLV` / `FurnaceLevels` (6 upgrade levels).
  - Parsed `account.forge.list[]` = `{isBrimestone, speed, ore{rawName, amount, timeTillEmpty}, barrel{}, bar{}}`, `account.forge.upgrades[]` = `{name, level, maxLevel}`, `account.forge.oreCapacity.value`.
  - Unlock flag `accountOptions[249]`.
- **Sources:** N.js v1.23 (2026-10-17): `_customBlock_ForgeStats`, `_customBlock_ForgeUpdateCosts`, `_customBlock_ForgeSpeeed`, `_customBlock_ForgeInterval`, `_customBlock_FoodBonuses("…ForgeCooldownBonus")`, GrasslandaTown init (Furnace actor gated on OLA[249]). Toolbox @ 6827d3f: [`parsers/world-1/forge.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/forge.ts), `items.json` (ore `Amount`/`Cooldown`, barrels), `baseTrackers.js` (World 1 → forge `emptySlots`). Wiki [Smithing#The_Forge](https://idleon.wiki/wiki/Smithing) (rev. 2026-10-05). [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025) v2.29 (−80% smelt time). AutoReview @ 05ac449 `smithing_progressionTiers` "Forge Total". r/idleon [1sljz8q](https://www.reddit.com/r/idleon/comments/1sljz8q/) (2026-04-14, late-game forge and ore drain).
