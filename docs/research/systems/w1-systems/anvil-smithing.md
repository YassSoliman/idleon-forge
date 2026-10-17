# Anvil production and Smithing (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there. Smithing as a skill (levelling curve, what to AFK) belongs to the skills dossier ([#25](https://github.com/YassSoliman/idleon-forge/issues/25)). This file covers the Anvil's **Produce** tab and its points, plus the Anvil Tab (crafting) gates that W1 progression needs.

## Anvil production

- **What it is:** each character's personal Anvil "Produce" tab. It turns time into crafting materials (Thread, Trusty Nails, Boring Brick …), and it is the main source of **Smithing EXP**. Anvil points, spent on EXP, Speed and Capacity, tune it. (H: Toolbox `parsers/world-1/anvil.ts`; wiki [Smithing](https://idleon.wiki/wiki/Smithing), rev. 2026-10-05)
- **Unlocks:**
  - It is available from the start: the Scripticus tutorial has you craft at the anvil.
  - Since v2.27 (2025-02-03) the anvil works from anywhere (Codex Quick Ref), not only in town ([Changelog 2025](https://idleon.wiki/wiki/Changelog_2025)).
  - Products unlock by **Smithing level** (`levelReq`; table below).
  - Extra production slots ("hammers") come from the **Infinity Hammer** gem shop upgrade (+1) and the **Hammer Hammer** active Alchemy bubble (+1), for 3 at most.
- **Scope:** **per character.** Production, points, hammers and capacity are all per character. Products go into the shared storage via Quick Deposit (or automatically from the W3 Automation Station). (H: save keys `AnvilPA_N`, `AnvilPAstats_N`, `AnvilPAselect_N` are per character)
- **Inputs → outputs:**
  - **Time** (it runs during AFK on any activity) gives products and Smithing EXP. Per hammer, the progress per second is `anvilSpeed/3600`, and a product needs `requiredAmount` progress. With 3 hammers on one product it is made 3× faster. (H: Toolbox `getAnvilFutureProduction`, comment "AFKcode("AnvilPA")")
  - **Speed** = `(1 + (AnvilZoomerStamp + 2·speedPoints)/100) · (1 + (BlacksmithBox₂ + AnvilStatue + Vault24)/100) · (1 + HammerHammer/100) · AGI factor · (1 + (TownSpeed starsign + Broken Time talent)/100)`, ×3600 per hour. (H: Toolbox `getAnvilSpeed`, `getPlayerAnvil`)
  - **Capacity** = `MaterialBag capacityPerSlot · (2 + 0.1·capPoints)`, capped at **2,000,000,000**. (H: Toolbox `getPlayerAnvil`) Material capacity (pouches, the Matty Bag stamp, bribes) therefore raises the anvil cap for free.
  - **EXP per product** gets the xp-points bonus: `(1 + 3·xpPoints/100) · SmithingEXPmulti`, soft-capped above 20× and hard-capped at 75×. (H: Toolbox `getAnvilExp`, `calcAnvilExp`)

| Product | Smithing Lv | Progress per item | EXP per item |
|---|---|---|---|
| Thread | 1 | 100 | 6 |
| Trusty Nails | 5 | 200 | 10 |
| Boring Brick | 12 | 350 | 16 |
| Chain Link | 17 | 700 | 25 |
| Leather Hide | 25 | 1,200 | 35 |
| Pinion Spur | 30 | 2,000 | 50 |
| Lugi Bracket | 35 | 3,000 | 65 |
| Purple Screw | 43 | 4,000 | 75 |
| Thingymabob | 50 | 6,000 | 90 |
| Tangled Cords | 60 | 8,500 | 110 |
| PVC Pipe | 70 | 12,000 | 140 |

  (H: Toolbox `shared-data.json` `anvilProducts`. Indices 11–13 are `Filler` with `levelReq` 999, so they are not in the game.) EXP per progress is highest for Thread (6/100 = 0.06), falls to about 0.012 for PVC Pipe, and only Thread beats the others for pure EXP. The rest are worth producing for the **material** (crafts, stamps, Post Office orders), not for EXP.

  **Anvil points.** Each point bought or earned goes into EXP, Speed or Capacity.

| Source | Amount | Cost (no Anvilnomics reduction) |
|---|---|---|
| Smithing level | +1 per level | free |
| Coins | up to 600 | point p (0-based) costs `round((p³ + 50)·(1 + p/100))`. Cumulative: 10 pts ≈ 2.7K, 50 ≈ 2.1M, 100 ≈ 44M, 200 ≈ 1.03B, 400 ≈ 26.7B, 600 ≈ 187B |
| Monster materials | up to 700 | point p costs `round((p+1)^1.5 + p)` of a drop that changes with p: Spore Cap (1–5), Frog Leg (6–15), Bean Slices (16–25), Slime Sludge (26–40), Carrot Cube (41–55), Glublin Ear (56–70), Bullfrog Horn (71–85), Pocket Sand (86–100), Crabby Cakey (101–115), Coconotnotto (116–130), Pincer Arm (131–150), High Steaks (151–175), Wakka Cherry (176–200), Shrapshell (201–225), Melty Cube (226–250), Sticky Stick (251–280), Pen (281–310), Sippy Straw (311–350), Ram Wool (351–375), Purple Mush Cap (376–410), Half Eaten Donut (411–440), Genie Lamp (441–470), Bottle Cap (471–500), Tongue Bone (501–540), Empty Oyster Shell (541–600), Condensed Zap (601–700) |
| Acme Anvil (Archer talent) | +talent · floor(Smithing Lv / 10) | talent points; the points stay spent if the talent is reset (wiki) |

  The **Anvilnomics** bubble cuts both coin and material costs (floor 10%), and it is stronger on an Archer (`getBubbleBonus(..., isArcher)`). The **Anvil Reset Whetstone** (Frostbite Tundra shop, W3) refunds spent points. (H: Toolbox `getCoinCost`, `getMonsterMatCost`, `anvilUpgradeCost`; wiki Smithing)

- **Goals and Milestones:**

| Milestone | Meaning | Source |
|---|---|---|
| Every hammer slot in use (1 → 2 → 3) | No idle production | Toolbox `missingHammers` alert |
| Coin points 20 / 60 / 100 / 150 / 200 / 600 per character | AutoReview smithing tiers 1–6 | AutoReview `smithing_progressionTiers` (L) |
| Monster points 85 / 150 / 225 / 350 / 500 / 700 per character | Same tiers. Bullfrog Horn → Pincer Arm → Shrapshell → Sippy Straw → Bottle Cap → Condensed Zap is the material wall. | AutoReview (L) |
| Smithing 15 / 35 / 50 / 65 / 80 / 80 | Anvil Tabs 2–7 craftable (each needs an Anvil Expansion craft) | wiki Smithing |
| Capacity hits 2B | Cap points are wasted after this | Toolbox (H) |

- **Feeds / fed by:**
  - **Fed by:** AGI; the Anvil Zoomer stamp ([Stamps](stamps.md)); the Blacksmith Box ([Post Office](post-office.md)); the Anvil Statue ([Statues](statues.md)); the Hammer Hammer and Anvilnomics bubbles (Alchemy, W2); the "Speed in Town" star sign; the Broken Time talent; Upgrade Vault 24; Material carry capacity; [Forge](forge.md) EXP upgrades; Smithing cards (Fire Forge, Cinder Forge).
  - **Feeds:** Smithing EXP (skills dossier), crafting materials for gear, the Anvil Expansions, Empty Boxes (Post Office unlock), Post Office orders (Thread, Trusty Nails, Boring Brick are Simple Shippin items), stamp cap raises (Thread for Target Stamp, Boring Brick for Crystallin, and others), and later-world construction.
- **Per-session actions:**
  1. Quick Deposit the products.
  2. Make sure every hammer is producing.
  3. Spend unspent points.
  4. Buy cheap coin or monster points.
  5. Check time-to-full against the Expected Return.
  - **Idle or capped states:** a product at capacity stops (Toolbox `anvilOverdue`, alert X minutes before full). Unspent points (`unspentPoints`). Fewer products selected than hammers owned (`missingHammers`).
- **AFK Setup implications:** every character, whatever its activity, should leave with all hammers on a product that will **not** fill before the Expected Return. Use `getTimeTillCap` with the Expected Return. For EXP, put all hammers on the highest-EXP product, which is Thread on most accounts. For a material Goal, put them on the product that Goal needs.
- **Min-max by stage:**
  - **Early (W1):** all points into **Speed** (community consensus: "Always speed… your cap goes up with your characters carry cap") and produce Thread. Buy coin points up to ~20 and monster points up to ~85 per character.
  - **W2:** add Hammer Hammer as an active bubble on characters that are not fighting with it. Buy the Infinity Hammer if you spend gems. Unlock Anvil Tab 2 (Smithing 15) for Empty Boxes (Post Office).
  - **W3:** tiers 3–4. Anvil Reset Whetstone if early points went into Capacity. The Automation Station auto-deposits.
  - **Per class:** Archers get Acme Anvil and a stronger Anvilnomics, so do big point purchases on an Archer-line character. EXP points matter more on the character you level Smithing on (archer-line skill per the wiki).
  - **Counterpoint (L):** one 2026 comment argues for EXP points once speed is high, since capacity caps at about 2B. Rule for ActiveOn: if the product fills before the Expected Return, add Capacity; otherwise Speed. That follows from Toolbox's `getTimeTillCap` (ADR 0005 arithmetic).
- **Common mistakes:**
  - Hammers idle or products capped (alerts above).
  - Points dumped into Capacity early, when Capacity comes from the material bag anyway.
  - Producing a high-tier product for EXP when Thread gives more EXP per hour.
  - Forgetting other characters: the anvil is per character, and the alt characters often hold 100+ unspent points (r/idleon: "700 points I forgot about on anvil on multiple characters", 2026-05-07).
- **Save and Toolbox fields:**
  - Raw `AnvilPA_N` (per product: `[currentAmount, currentXP, currentProgress, totalProduced]`), `AnvilPAstats_N` (`[availablePoints, pointsFromCoins, pointsFromMats, xpPoints, speedPoints, capPoints]`), `AnvilPAselect_N` (product index per hammer).
  - Parsed `account.anvil[i]` = `{anvilProduction, anvilStats, anvilSelected}` and `characters[i].anvil`.
  - Computed by `getPlayerAnvil(character, characters, account)`: `stats.anvilSpeed` (per hour), `stats.anvilCapacity`, `stats.anvilCost.{nextCoinUpgrade,nextMatUpgrade,coinsToMax,totalMats}`, `production[].hammers`.
  - Helpers: `getTimeTillCap`, `getAnvilFutureProduction`, `calcAnvilExp`, `calcTotals` (per-product per-hour across characters).
- **Sources:** Toolbox @ 6827d3f: [`parsers/world-1/anvil.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/anvil.ts), `shared-data.json` `anvilProducts` / `anvilUpgradeCost`, `utility/dashboard/baseTrackers.js` (characters → anvil). Wiki: [Smithing](https://idleon.wiki/wiki/Smithing) (rev. 2026-10-05; tab gates, point rules, Anvil Reset Whetstone). Changelog 2025 v2.27 ("Anvil is no longer Quick-Ref only") and 2026 v1.07 ("SUPER boosted anvil craft speed", which affects crafting, not production). AutoReview @ 05ac449 `smithing_progressionTiers`. r/idleon: [1t5xhj0](https://www.reddit.com/r/idleon/comments/1t5xhj0/) (2026-05-07, speed vs cap). Idleon Incomplete Guide W1 tab (**Stale**; "best thing to produce for XP is Thread … investing ALL your points into speed").
