# Stamps (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins (N.js v1.23, Toolbox @ 6827d3f, AutoReview @ 05ac449) are listed there. The per-stamp table is in [stamps-table.md](stamps-table.md).

## Stamps

- **What it is:** a collection of 128 stamps in three tabs (44 Combat, 57 Skills, 27 Misc; 7 of the 128 are unobtainable). Each stamp you own gives an account-wide bonus that grows with its level. Coins buy levels up to the stamp's current **max level** (its cap). Materials raise the cap by a fixed step. (H: Toolbox `data/website-data/stamps.json`, `parsers/world-1/stamps.ts`; N.js `_customBlock_StampCostss`)
- **Unlocks:**
  - Mr Pigibank appears in the W1 town once any character on the account reaches **class Lv 14**. He is then bought (OptionsListAccount[248]), and his quest "A Pig and his Stamps" (buy a stamp from the town shop) opens the Stamp and Bribe book. (H: N.js town-unlock thresholds 7/14/18/22/28 on OLA[247–251] and the `Mr_Pigibank` actor gate on OLA[248]; quest from Toolbox `quests.json` `Mr_Pigibank`.)
  - The wiki says "at class level 12" ([Stamps](https://idleon.wiki/wiki/Stamps), rev. 2026-10-05), and so does the Incomplete Guide. I found no 12 anywhere in the code, which checks 14. **Treat 12 as Stale.** The wiki's [Mr Pigibank](https://idleon.wiki/wiki/Mr_Pigibank) page says he "can be bought for 10".
  - Individual stamps come from shops (Sword, Heart, Mana, Target, Shield, Pickaxe and Hatchet are early ones), NPC quests (Hamish, Mutton, Tiki Chief, Snouts, Wellington, XxX Cattleprod XxX and others), rare monster or skilling drops, the Arcade, and later-world sources. See the Source column in [stamps-table.md](stamps-table.md).
- **Scope:** **account-wide** levels and bonuses, with three per-character modifiers:
  1. **Skill-stamp falloff.** A Skills stamp tied to a skill, with a cap step above 1, gives less once its level runs ahead of the character's level in that skill. Example: Pickaxe Stamp Lv 100 on a character with Mining 50 acts as Lv 62. A ×5-step stamp at Lv 60 with skill 50 acts as Lv 32. The Jade Emporium bonus "Level Exemption" (W6) removes the falloff. (H: N.js `_customBlock_StampOverLevel`; Toolbox `getStampBonus`.) The affected stamps are tied to mining, smithing, choppin, fishing, alchemy, catching, trapping, construction and worship.
  2. **Toilet Paper Postage** (star talent) multiplies stamps whose stat is an efficiency ("Eff"). (H: Toolbox `getStampBonus`)
  3. Per-character carry capacity decides whether a cap raise fits (see Inputs).
- **Inputs → outputs:**

| Action | Cost | Formula (no reductions) | Reductions |
|---|---|---|---|
| Buy +1 level (only while level < cap) | Coins | `baseCoin · max(1.05, powCoin − L/(L+5m)·0.25)^(L·10/m)`, where L is the current level and m is the cap step | Bribe **Insider Trading −8%** (the code uses 8; its text says 5%); the "material cost for stamps" vials (Blue Flav, Venison Malt) also apply to coins, floored at −90% |
| Raise the cap by m (only when level = cap) | Material | `baseMat · powMat^((round(L/m) − 1)^0.8)` | Hydrogen atom (W3): −(atom Lv)% per day logged in, up to −90%, and reset to 0 by **any** cap raise. Envelope Pile sigil: ÷(1 + 12/25/40/65/75%) by sigil tier. Meritocracy bonus 14 (W2 ballot). The vials above (floor −90%). A **Gilded Stamp** gives ×0.05 on one raise. |

  - The material is taken from the **inventory of the character doing the upgrade** (N.js loops `InventoryOrder` to remove it). One character's carry capacity for that item type is therefore the hard wall. That is why the Matty Bag, Mason Jar and Lil' Mining Baggy stamps and the material pouches matter. Toolbox computes this as `enoughPlayerStorage`, plus a `minReduction` (the smallest atom % that makes the next raise fit). (H: N.js stamp-upgrade handler; Toolbox `evaluateStamp`, `getMinReduction`)
  - **Free levels:** "No Stamp Left Behind" gives +5/day with the `bun_s` bundle, +3/day from event shop bonus 1, and more from Summoning winner bonus 20. These are applied by the daily routine. (H: N.js daily loop; Toolbox `getStampsPerDay`)
  - **Outputs:** base damage, HP, MP, accuracy, defence, all four stats, % total damage, crit, boss damage, class EXP, drop rate (Golden Sixes), skill efficiency/EXP/carry and multi-chances, Anvil speed (Anvil Zoomer), alchemy speed and liquids, talent points (Talent II–IV, S), card drop (Card Stamp), crystal spawn (Crystallin), Arcade ball rate and claim time, Forge capacity (Forge Stamp), shop stock, and later-world skills. The full list is in [stamps-table.md](stamps-table.md).
- **Goals and Milestones:**

| Milestone | What it gives | Source |
|---|---|---|
| Stamp collected (level ≥ 1) | Its bonus; +1 to the stamps-collected count | Toolbox `calcStampCollected` |
| Each cap step (5 or 10 levels for most) | Lets coins buy the next m levels | stamps.json `reqItemMultiplicationLevel` |
| Total stamp levels 50 / 100 / 150 / 200 / 250 / 300 / 400 / 500 / 600 / 700 / 800 / 1,000 / 2,500 / 4,000 / 5,500 / 7,500 / 9,200 / 11,000 / 13,000 | AutoReview's progression tiers. Each tier also names stamps to collect, and target levels for core stamps (e.g. Pickaxe and Hatchet 35 → 45 → 55 → 65 → … → 255/295 at the top) | AutoReview `stamps_progressionTiers` (L) |
| Every 100 total levels | +1% daily chance of a Gilded Stamp (after Rift 26) | N.js `RiftStuff("gildedStampChance")`; [wiki Stamp Mastery](https://idleon.wiki/wiki/Stamps#Stamp_Mastery) |
| Toolbox "max with coins" | Every stamp below its cap whose levels cost ≤ X% of account coins (default 25%) | Toolbox `baseTrackers.js` `affordableStampLevels` |

- **Feeds / fed by:**
  - **Fed by:** Coins (all fighting); materials from Mining, Choppin, Fishing, Catching, Trapping, Construction and Worship (W1–W3 skills); monster drops; Anvil products (Thread and Nails are the Target and other stamps' materials); Forge bars (Copper/Iron/Gold/Platinum bars); [Bribes](bribes.md) (cost and drop rate); Alchemy vials and sigils (W2); Atom Collider (W3); Gilded Stamps (Rift, W4); Exalted Stamps (Windwalker Compass and gem shop, W6+); the Certified Stamp Book lab node (×2 Combat and Skills, W4); the Liqorice Rolle charm (×1.25, W6); Upgrade Vault 16 (+% to BaseDmg/HP/Acc/Def stamps). (H: Toolbox `getStampBonus`, `getExaltedStampBonus`; wiki Stamps)
  - **Feeds:** damage and survivability for every character, skill speed (which feeds every skill dossier), [Anvil production](anvil-smithing.md) (Anvil Zoomer), [Forge](forge.md) capacity (Forge Stamp), Alchemy (speed, liquids, sigil charge), talent points (character builds), Card drop (cards dossier), the Arcade (W2), Crystal mobs, which drop [Statues](statues.md), and carry capacity, which feeds stamps themselves.
- **Per-session actions:**
  1. Spend coins on stamps below their cap, cheapest-per-benefit first. Toolbox's `affordableStampLevels` alert is the trigger.
  2. For stamps at their cap, check whether the cap-raise material is in storage and whether the best-capacity character can carry it (`hasMaterials`, `enoughPlayerStorage`). If the atom discount has climbed high, raise **several caps in the same session**: the first raise resets the discount for all of them.
  3. Pick up any new stamp items (from drops and quests) and click them in.
  4. **Idle or capped states:** a stamp at its cap with unaffordable or unfit materials is a Goal (farm the material or raise carry capacity), not a spend. A stamp below its cap is a spendable.
- **AFK Setup implications:** stamp caps want **material stockpiles**. Put skilling characters on the skills whose materials gate the stamps you are capping (Oak Logs, Copper Ore, Bleach Logs, Gold/Platinum Bar inputs and so on). Make sure the character who will do the raise has the carry capacity. Coin income (fighting AFK) funds levels. Stamps never cap out from AFK.
- **Min-max by stage:**

| Stage | Priority (community opinion unless marked) |
|---|---|
| Early W1 (class Lv 14–30) | Unlock Mr Pigibank and buy the shop stamps. Do Hamish's quests (Tomahawk, then Choppin' Bag Stamp). Level Sword, Heart, Mana, Target, Shield, Pickaxe and Hatchet with spare coins. Buy bribe set 1 first (Insider Trading makes everything after it 8% cheaper). AutoReview's first named tier (150 total levels) asks for Mana, Tomahawk, Target, Shield, Vitality, Choppin' Bag and Vendor. |
| Late W1 / early W2 | Carry stamps first (Lil' Mining Baggy, Matty Bag; Mason Jar when you find it), because they unlock every later cap raise. Then Anvil Zoomer, Fishing Rod and Catch Net. Push Pickaxe and Hatchet to 35+. AutoReview flags Clover, Kapow, Hermes and Talent III as "not recommended" at this stage. |
| W2 | Collect the Mutton and Wellington quest stamps (Fist, Manamoar, Scimitar, Golden Apple, Steve Sword, Arcane, Brainstew). Get the damage % stamps (Battleaxe, Longsword, Bullseye, Buckler) and Drippy Drop/Droplots/Alch Go Brrr for Alchemy. Card Stamp and Crystallin. The 700-level tier names most of the 2-of-each skill stamps. |
| W3 | The Hydrogen atom changes the play: let the discount build, then batch-raise. Stample, Spice, Egg, Mason Jar and Sigil Stamp (800 tier). Talent S. Card Stamp to 50+. Drippy Drop to 50. 1,000-tier: Bag o Heads, Cooked Meal. |
| W4+ outline | Certified Stamp Book (×2), Gilded Stamps from Rift 26, Golden Sixes/Stat Wallstreet/Amplestample from Island Expeditions (W5), Exalted Stamps from the Windwalker Compass. AutoReview's top tiers (4,000–13,000 total levels) are W5–W7 content. |
| Per class | Stamps are account-wide, so classes only differ through the skill falloff. Level a skill stamp to roughly your **best** character's level in that skill, and do the skilling on that character. |

- **Common mistakes** (each is detectable from the save):
  - **Too few stamps collected.** Count `level > 0` over obtainable stamps. Both MVP fixtures (W2 and W3) had 8 and 17 stamps owned and 235 and 333 total levels. That sits in AutoReview's 200–300-level tiers, and most of the stamps its 400–700 tiers name (Fishing Rod, Catch Net, Drippy Drop, the W2 damage stamps) are missing (L for the tier reading).
  - **Coins sitting idle while stamps are below their cap.** Detect `level < maxLevel` with `goldCost ≤ rawMoney`.
  - **Raising one cap at a time and wiping the atom discount** (W3+). Detect a falling `atoms.stampReducer` pattern across saves.
  - **Skill stamps levelled far past the skill.** Compare the stamp level × (10/m) with the best character's skill level.
  - **Using a Gilded Stamp while the atom discount is still high.** Toolbox has the `showGildedWhenNoAtomDiscount` option for exactly this case.
  - **Trusting the "5%" on Insider Trading:** it is 8% (harmless, but it affects Spend Plan arithmetic).
- **Save and Toolbox fields:**
  - Raw save keys: `StampLv` / `StampLevel` (levels, `[tab][index]`) and `StampLvM` / `StampLevelMAX` (caps).
  - Parsed `account.stamps.{combat,skills,misc}[]`, with `level`, `maxLevel`, `itemReq`, `baseMatCost`, `reqItemMultiplicationLevel`, `skillIndex`, `ownedMats`. After `updateStamps`, entries also carry `goldCost`, `materialCost`, `hasMoney`, `hasMaterials`, `enoughPlayerStorage`, `bestCharacter`, `futureCosts` and `minReduction`.
  - Helpers: `calcStampLevels`, `calcStampCollected`, `getStampBonus` (per character), `getStampsPerDay`.
  - Related fields: `account.atoms.stampReducer`, the gilded count `accountOptions[154]`, `account.bribes[0].done`, and exalted flags in `account.compass.exaltedStamps`.
  - `unobtainableStamps` in Toolbox has a typo ("Stat_Wallstree_Stamp"), so it matches nothing. Stat Wallstreet **is** obtainable (Island Expedition, per the wiki). Splosion is unobtainable per the wiki but is not on Toolbox's list. Use the wiki's 7-stamp unobtainable list.
- **Sources:**
  - N.js v1.23 (2026-10-17): `_customBlock_StampCostss`, `_customBlock_StampDetails`, `_customBlock_StampOverLevel`, the stamp cap-raise handler (`StampLevelMAX += StampDetails[4]`), the daily "No Stamp Left Behind" loop, `RiftStuff("gildedStampChance")` (0 below Rift 25, else `GenINFO[106]/1E4`), `GetBribeBonus` (reads `BribeDescriptions[i][5]`, which is 8 for Insider Trading), and town unlocks OLA[247–251].
  - Toolbox @ 6827d3f: [`parsers/world-1/stamps.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/stamps.ts), [`data/website-data/stamps.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/stamps.json), [`utility/dashboard/baseTrackers.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/baseTrackers.js) (World 1 → stamps), `shared-data.json` `sigils` (ENVELOPE_PILE 12/25/40/65/75), `vials.json` (BLUE_FLAV, VENISON_MALT `MatCostStamp`), `shared-data.json` `atomsInfo` (Hydrogen).
  - Wiki: [Stamps](https://idleon.wiki/wiki/Stamps) (rev. 2026-10-05, bot tables), [Atom Collider](https://idleon.wiki/wiki/Atom_Collider) (rev. 2026-10-07), [Mr Pigibank](https://idleon.wiki/wiki/Mr_Pigibank) (rev. 2026-10-05).
  - Changelogs: [2025](https://idleon.wiki/wiki/Changelog_2025) (v2.3x adds Reclaim buttons for stamp quests; Crystallin exalting balance note) and [2026](https://idleon.wiki/wiki/Changelog_2026). I found no W1 stamp mechanics change in v1.05–v1.23.
  - AutoReview @ 05ac449 (2026-09-23): [`progression_tiers.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/consts/progression_tiers.py) `stamps_progressionTiers`. This is community opinion, one patch before v1.23.
  - r/idleon: ["Is the Matty Bag stamp worth adding?"](https://www.reddit.com/r/idleon/comments/1t0r1fy/) (2026-05-01; "the purpose of Matty bag is to help you level your other stamps").
  - Idleon Incomplete Guide (W1 tab, undated, **Stale**): "always try unlock more stamps and level them as much as you can".

## Gilded Stamps and the stamp-cost reducers (interplay outline)

| Reducer | World | Effect on a cap raise | Stacks how | Notes |
|---|---|---|---|---|
| Hydrogen, Stamp Decreaser (Atom Collider) | W3 | −(level)% per day logged in, up to −90% | multiplicative | **Any** cap raise resets it to 0%. Batch your raises. |
| Gilded Stamp (Stamp Mastery) | W4 (Rift 26) | ×0.05 on one raise | multiplicative with the atom | Daily chance = total stamp levels / 10,000 (1% per 100 levels). Banked in `accountOptions[154]`; one is used per raise while you hold any. |
| Envelope Pile sigil | W2 Alchemy (sigils need the W4 Lab to charge) | ÷1.12 / 1.25 / 1.40 / 1.65 / 1.75 | multiplicative | Unlock/Boost/Ionized/Ethereal/Eclectic tiers |
| Meritocracy bonus 14 | W2 ballot | ÷(1 + bonus%) | multiplicative | Only the weeks it is voted |
| Blue Flav / Venison Malt vials | W2 Alchemy | −x% (combined floor −90%), also applies to the coin cost | multiplicative, after flooring | Blue Flav needs Platinum Ore |

The order of operations (from N.js `StampCostss`): base × atom × sigil × growth, then ×0.05 if gilded, then ÷ meritocracy, then floor, then × vial, then floor; the result is at least 1. A Gilded Stamp is "spent" by the next cap raise. The code decrements `OLA[154]` whenever you hold one, so you cannot keep it for a costlier stamp while raising a cheap one (M: control flow). **For ActiveOn:** when `OLA[154] > 0`, recommend raising the stamp with the highest current material cost first.

**Exalted Stamps (outline, W6+):** an exalted stamp gets ×(1 + StampDoubler/100), and the base doubler is 100%, so ×2. Atom Aluminium, the Jellypick charm, the Compass, the Emperor set, the event shop, palette, exotic market, exalted fragments, a legend talent, sushi and jelly all raise it. Unlike the other multipliers, it also applies to Misc stamps. Exalt credits come from the Windwalker Compass and the gem shop. (H: Toolbox `getExaltedStampBonus`; wiki Stamps)
