# M19 Alchemy

Spec for System Atlas gap #5, "which bubble to level next, plus vials and Pay 2 Win" (owner request of 2026-10-18), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**. An independent reviewer red-teamed it: 34 findings (5 P1, 16 P2, 13 P3), every confirmed P1 and P2 fixed (section 10). The owner was away, so every open question is self-ruled with a researched recommendation (section 8, "Owner review"). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions follow [ADRs 0001–0009](../adr/).

**Why this exists.** Alchemy is the W2 System with the most Leverage, and almost all of it is account-wide. ActiveOn already covers its waste side: spend banked brew (M6), fill big-bubble slots (M6), use the daily vial attempts (M6), Water at cap (M3) and an empty cauldron seat (M3, M20). It never says what to spend the Water and materials *on*. Both private fixtures show the gap. On the W2-late account every bubble but one is at level 1, with Water at its cap of 32. On the W3-early account 24 bubbles are unlocked and 20 of them are still at level 1, 15 vials sit at level 1 with the materials for level 2 in storage, and the Pay 2 Win Player upgrades are a level behind the best Alchemy level. The Design Lab drew the cauldron pots, the vial shelf and the liquid tubes (`systems.alchemy`), but its critique says the pictures "can't light the choice yet" because the levelling order is "not covered". M19 is that order. It gives one opinionated, cited plan per Stage for bubbles and vials, the Pay 2 Win order the Spend Plan follows, and a picture rule: which bubble to light.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md), [0004](../adr/0004-source-precedence.md) (with its 2026-10-17 amendment on judgment entries), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic: every cost comes from Toolbox's own functions), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md), [0007](../adr/0007-generated-facts-authored-judgment.md) (curves and costs generated, the plan authored), [0009](../adr/0009-game-art.md) (pots, shelf and tubes are our pixel art).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74) (a player-readable tier 2–4 Source on every entry), [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5 (one account line, never the same line on every character).
- **M15's owner principles P1–P7**, adopted unchanged.
- **IdleOn AutoReview is cited, never copied** (no licence, [#3](https://github.com/YassSoliman/idleon-forge/issues/3)). M19's bands are our own rule: "10%, 20% and 40% of a bubble's maximum value" by Stage, computed from game data. AutoReview publishes the same percentages, and M19 cites them as the idea's source, the way M15 F5 cites its Pinchy rater. No AutoReview table, text or list is reused.
- **Design Lab v2 critique**: one highlight per picture; steps of about 12 words; lists behind a picture capped at three rows; units on every number.

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d`. The current major patch is v1.20 (2026-08-26). Wiki pages were opened on 2026-10-18 (section 11.3). No patch since v2.28 (2025-02-08) changed W1–W3 bubble costs, vials or the Liquid Shop, except the Roid Ragin material, which became Copper Ore in v1.00 (wiki [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025), [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)). Guides from before 2025-02-08 are Stale on numbers. (The game's version numbers restarted at v1.00 with the W7 update of 2025-11-06, so v1.20 and v1.23 come after v2.28.)

**Fixtures.** The **W2-late account** (5 characters: Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; `currentWorld` 2) and the **W3-early account** (6 characters: Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; `currentWorld` 3), by class and level only. Values were read on 2026-10-18 by local scripts at the golden clock (Expected Return 8 h). CI runs the same assertions on the scrubbed fixtures, and the golden snapshots pin the exact text.

## 1. Purpose

A player in a Play Session opens the Alchemy screen with Water, a pile of W1–W3 materials and 100 bubbles to choose from. The game shows every bubble and its cost, but not which one is worth the Water today. M19 answers four questions. **"Which bubble do I level next, and to what level?"** M19 keeps a **Bubble Plan**, an ordered list per Stage of the bubbles that matter for the classes and skills this account has, each with a target level. It names the first one the account can afford now and lights it on the Alchemy page. **"Which vial?"** The vial order says which vial to level with the items in storage, and which locked vials to roll first with today's attempts. **"What do I buy in Pay 2 Win?"** The Pay 2 Win order tells M7's Spend Plan which coin upgrade comes next, and M19 says when the Player upgrades fall behind your Alchemy level. **"What else in the Liquid Shop?"** It flags the daily gem buy and the permanent Talent Point. Every line says what to do, where, and with what you hold. It reads only the save, and never touches the game.

## 2. Scope / Out of scope

### Ownership (who builds what)

M19 is a **new module** with its own folders (D-1). Existing Alchemy Checks keep their owners. M19 adds the choice side and the Alchemy page.

| # | Feature | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|
| F1 | **Alchemy facts**: bubble curves and costs, vial costs, Liquid Shop counters, Player Pay 2 Win levels | `packages/account-state/src/alchemy.ts`, `packages/knowledge/generators/alchemy-curves.gen.ts` | `alchemy-bubbles.fact.curves` (generated), `alchemy-vials.fact.catalogue` (generated), `alchemy-vials.fact.costs` (generated) | Phase 1 |
| F2 | **The Bubble Plan**: the next bubble to level, per Stage, and the picture rule | `packages/engine/src/alchemy/` | `alchemy-bubbles.priority.plan` (authored), `alchemy-bubbles.goal.level-next`; engine Detector `alchemy/plan` | Phase 1 |
| F3 | **Vials**: the level order and today's roll targets | `packages/engine/src/alchemy/` | `alchemy-vials.priority.plan` (authored), `alchemy-vials.goal.level-next`; roll targets as details of M6's `alchemy-vials.check.daily-attempts` (X3) | Phase 1 |
| F4 | **Pay 2 Win**: the order the Spend Plan follows, and Player upgrades behind | `packages/engine/src/alchemy/`, M7's spend list (X2) | `alchemy-p2w.priority.order` (authored), `alchemy-p2w.check.player-behind` | Phase 1 |
| F5 | **Liquids and the Liquid Shop**: where Water goes, the daily gem row, the Talent Point | `packages/engine/src/alchemy/` | `alchemy.check.talent-point`; a `checklist.fact.rows` row (X5); the Water line's pick (X4) | Phase 1 |
| F6 | **The Alchemy page**: pots, vial shelf, liquid tubes, Pay 2 Win grid, cauldron seats | `apps/activeon/src/alchemy/` (lazy chunk) | none (views add no advice) | Phase 1 |
| F7 | Brew: new bubbles versus cauldron Boosts; Bargain Tags before an expensive level; who brews where (replacing M20 FR-27); the Bargain bubbles and Laaarrrryyyy; sigils (W4) | same folders | added entries | Phase 2 |

### In scope

- Bubble levels for the passive (small) bubbles and the big bubbles a character equips, in the four cauldrons, W1–W3 content: bubbles whose materials all come from Worlds 1–3 (generated from the items' drop and node worlds, M14's item data; several bubbles at index 15–24 need W4 or W5 materials and are out).
- Vial levels 1–13 and which locked vial to roll with today's attempts.
- Pay 2 Win: the order of the coin upgrades the Spend Plan shows, and Player upgrades below the account's best Alchemy level.
- Where Water goes, the Liquid Shop's daily gem buy, and the permanent Talent Point.
- The Alchemy System page body, which replaces M20's cauldron-seats body as the home of the four Alchemy Systems and embeds that picture as one of its parts.

### Out of scope (and who owns it)

- **Spending banked brew and filling big-bubble slots**: M6 (`alchemy-bubbles.check.spend-brew`, `.fill-slot`, `.wrong-fit`). M19 never repeats them. The page shows their state and links their Goals.
- **Blockers and caps**: M3 (`alchemy.check.cauldron-unassigned`, `alchemy.check.liquid-cap`, `liquid-cap-line`). M19 only names the bubble the Water should go to (X4).
- **Who sits on which cauldron or liquid**: M20 (`alchemy.check.liquid-unstaffed`) in Phase 1. M19's Phase 2 seat plan replaces it (M20 X6).
- **Coins**: M7 owns the Spend Plan, its wallets and its prices. M19 supplies only the order of the Pay 2 Win lines (X2).
- **Cauldron Boosts, Bargain Tags, the Bargain bubbles, Laaarrrryyyy, Prisma, No Bubble Left Behind, sigils, Toxic Mercury**: Phase 2 or W4+. No human Source gives a W2–W3 rule for Boosts versus new bubbles (section 11.3), and Laaarrrryyyy is Contested.
- **Navigation, the generic System page and "See it"**: M17.

## 3. Functional requirements

### Facts settled for this spec (section 11.4)

- **F-a Bubbles.** Toolbox `alchemy.bubbles.{power,quicc,high-iq,kazam}[]` gives each bubble's `level`, `func`, `x1`, `x2` and `itemReq` (each material's rawName and `baseCost`; liquids are `Liquid1`–`Liquid4`). The game counts only the unbroken run of unlocked bubbles from the first (`unlockedBubbles`, Toolbox `getUnlockedBubbleCount`). M19 treats a bubble as unlocked only inside that run (index < `unlockedBubbles`), never by `level ≥ 1` alone. Value curves: `decay` is `x1·L/(L+x2)`, so it reaches 10%, 20% and 40% of its maximum at `L = x2/9`, `x2/4` and `2·x2/3`; `decayMulti` is `1 + x1·L/(L+x2)`, and for it M19's "share of maximum" means the share of the bonus above 1× (`x1·L/(L+x2)` against `x1`), with the same fractions. This is our own definition: Toolbox's `getMaxBonus` reports `x1 + 1` and the wiki's "Max Bonus" counts the 1×, so the band is stated in levels on screen, never as a percent; `addDECAY` and `bigBase` grow linearly in W1–W3 (Toolbox `growth`; the wiki cauldron pages show the same curves and a "% from maximum" per level).
- **F-b Bubble costs.** Toolbox `getBubbleUpgradeCost` prices a level from the game's own cost table (`gameTables.bubbleCost`). Its discounts (the cauldron's Cost boost, Undeveloped Costs, the Barley Brew vial, the colour's Bargain bubble, the Bargain Tag, S-M-R-T) are inputs the Toolbox UI computes outside the vendored parsers. M19 calls it **with no discounts**, which gives an upper bound (every discount is a factor of at most 1, applied before the clamp): the real cost is at most that (wiki [Alchemy/Power Cauldron](https://idleon.wiki/wiki/Alchemy/Power_Cauldron) lists the same reducers). The liquid cost has no discount (`base + floor(L/20)`). So "you can afford at least K levels" is always true, and never "exactly K" (D-5).
- **F-c Vials.** Toolbox `alchemy.vials[]` gives `level` (0–13), `mainItem`, `discoveryScore` (the d100 roll needed: "Score+ N" on the wiki; the Pay 2 Win Vial RNG upgrade adds rolls that don't use an attempt, so M19 never prints a percent chance) and the liquid. Levelling from L to L+1 costs `vialCostsArray[L]` of the item plus `3·L` of its liquid (Toolbox `vialCostsArray`, `shared-data` `vialCosts`; Toolbox's own vial alert, `account.js` L477–494). Daily attempts: `alchemy.p2w.vialsAttempts.{current,max}`, max = 3 + the Pay 2 Win Attempts level. "Vials that are at least level 4 count towards the Shaman's Virile Vials talent" (wiki [Vials](https://idleon.wiki/wiki/Alchemy/Vials)).
- **F-d Liquids.** `alchemy.liquids[0..3]` against Toolbox `getLiquidCauldrons` `maxLiquid`. Liquid Nitrogen opens at the account's best Alchemy level 20, Trench Seawater at 35 (with Liquid Shop 2), Toxic Mercury at 80 (wiki [Alchemy](https://idleon.wiki/wiki/Alchemy)). Liquid stops at its cap.
- **F-e Liquid Shop.** `alchemy.multiplierArray[i]` (raw `CauldronInfo[10]`) counts today's purchases of shop item `i` (`shared-data` `liquidsShop`, price `x1 · x2^count`). Every price resets daily except the two Talent Points (indexes 8 and 17) and Small Donation (wiki Alchemy, Liquid Shop: "The price of all items except the Talent Point and Small Donation will reset every 24 hours"). Toolbox's own alert reads A Pair of Gems as unbought today while its price is at base (`account.js` L452–458); M19 applies the same price-at-base test to One Measly Gem (index 3).
- **F-f Pay 2 Win.** Toolbox `alchemy.p2w`: cauldrons (Speed, New Bubble, Boost Req), liquids (Regen, Capacity; level −1 = not open), vials (Attempts, RNG) and Player (`speedLv`, `extraExpLv`). Toolbox prices cauldron and liquid upgrades (`cost`, `costToMax`) and none of the vial or Player upgrades (M7 FR-14 lists them `unpriced`). Player upgrades are capped at "the highest alchemy level of any character" (wiki Alchemy, Pay 2 Win). It is a coin sink ("In game coins are used to upgrade …").
- **F-g Holdings.** A bubble or vial level takes its materials from the storage chest (Toolbox's vial alert counts `storage` only). M19 counts chest storage for "can afford now" and adds "deposit N from your <class Lv>'s bag" when the bag holds the rest. V3 confirms this for bubbles from N.js.

### F2 The Bubble Plan

- **FR-1 The plan.** `alchemy-bubbles.priority.plan` is an authored ordering list (`list: order`). Each row names a bubble (by rawName, so names like `BUG]` never matter), a condition (always; a class line on the account; a skill some character AFKs; "equipped by a character"), and its **band**. Bands are the only target levels: **W2** (Stages W2-early to W2-late) is 10% of the bubble's maximum value, **W3** (W3-early and W3-mid) is 20%, and **W3-late** (W3-late and W4-entry) is 40% (D-3). For `decay` and `decayMulti` bubbles the band level comes from the curve (F-a). Linear bubbles have no maximum, so the plan gives every linear bubble (the main-stat bubbles, FMJ, Shaquracy, Name I Guess and the big bubbles) the band levels of a reference curve with `x2 = 100`: 12, 25 and 67. That reference is our own rule, not anyone's table. The main-stat levels it gives happen to equal AutoReview's, because AutoReview pegs them to the same skill-bubble curve; the big-bubble levels differ (D-3). `alchemy-bubbles.fact.curves` precomputes every band level from game data, so no level is typed by hand.
- **FR-2 Phase 1 rows, in order** (our judgment from the Sources in TR-4 and section 11.3; confidence per row):

  | # | Bubble(s) | Condition | Why (Source) | Confidence |
  |---|---|---|---|---|
  | 1 | Roid Ragin, Swift Steppin, Stable Jenius | that class line on the account | +STR / AGI / WIS "for all players, always" (bubble text, wiki cauldron pages); the first bubble of each class cauldron | M |
  | 2 | Hearty Diggy, Hocus Choppus | some character AFKs Mining / Choppin | skill efficiency; "early game skill bubbles are important … because you need the printer samples" (Reddit, 2026-06-03) | M |
  | 3 | Warriors Rule, Archer Or Bust, Mage Is Best | that class line on the account | each multiplies every small bubble of its colour for that class (bubble text, wiki) | M |
  | 4 | Stronk Tools, Sanic Tools, Le Brain Tools | always | more skill power from tools (bubble text) | M |
  | 5 | Prowesessary | always | multiplies every skill's prowess, capped at 2× (wiki Kazam Cauldron) | M |
  | 6 | Wyoming Blood, Sploosh Sploosh, Bug², Molto Loggo, Hammer Hammer, Call Me Bob / Ash / Pope | a character has it equipped (M6's `characters[].bigBubbles`); each bubble appears once in the plan, here; Call Me Pope (`decayMulti`) takes its own curve's band, the linear ones the `x2 = 100` reference | a big bubble works only where it is equipped (wiki Alchemy) | M |
  | 7 | Undeveloped Costs | always, from W2-late | cuts the material cost of every bubble (wiki Kazam Cauldron); no human Source puts it first (D-4) | L |
  | 8 | FMJ, Shaquracy | always | defence and accuracy; recommended by a 2026-06-28 Steam guide, "much more necessary before The Vault" (Reddit, 2025-03-28) | L |
  | 9 | Name I Guess | a Mage line on the account, from W3 | base damage from Max MP (bubble text) | L |

  Laaarrrryyyy, Brewstachio, Big Meaty Claws, Quick Slap, Droppin Loads and the Bargains are not in Phase 1. For Laaarrrryyyy the Sources disagree (section 11.3; all of them predate the current major patch, so it is not Contested under ADR 0004's amendment, only unsettled), so it waits. For the others no human Source gives a W2–W3 target.
- **FR-3 Liquid and materials, in plan order.** M19 walks the plan rows in order for the account's band. For each row whose bubble is unlocked (F-a) and below its band level, it hands out **affordable levels**: one level at a time, while chest storage covers every material's undiscounted cost (F-b) and the liquid covers its liquid cost, deducting as it goes. So two rows that share Spore Cap or Water never count the same items twice. A row gets at most the levels up to its band.
- **FR-4 The pick.** The **account pick** is the first row that got at least one affordable level. The **per-cauldron picks** are the first such row in each cauldron. A row that is unlocked and below its band but got no level is **blocked**, with its shortfall: the first material it ran out of and how many more it needs.
- **FR-5 One account Goal.** `alchemy-bubbles.goal.level-next` (account, details): "Level Roid Ragin 3 → 12 (Power cauldron)". Why: "Your plan for this Stage: +STR for every character. You hold enough Copper Ore and Water for at least 9 levels." Details (at most two): the next rows with affordable levels and the level FR-3 reaches, "then Swift Steppin 1 → 8 (Quicc)". Category `compounding`, unit "levels". Position: in each W2 and W3 Stage list, right after the subclass and tutorial Goals (M2 X1). Done (M6 FR-29) when the picked bubble reaches its band, or on any later save where the pick changes.
- **FR-6 When nothing is affordable.** When rows are below their band but every one is blocked, the Goal shows the first blocked row's shortfall as its Next Action. A material shortfall reads "Get 120 more Spore Caps for Warriors Rule (Blunder Hills)" and opts into M14's Requirement Tree for that material (M14 FR-1, the material's `items.acquisition` entry). A liquid shortfall has no Requirement Tree: the line reads "Water is the limit: spend it as it refills" with the liquid's cap, and the Goal drops to `nice`. When every row is at its band, no Goal shows, and the page says "Bubble Plan met for your Stage".
- **FR-7 Locked bubbles.** A plan row whose bubble isn't unlocked yet is skipped for the pick, and the page says "unlocks with brew: spend it" next to M6's brew Goal. M19 never rolls for bubbles itself.
- **FR-8 The picture rule.** On the Alchemy page (FR-24) exactly one bubble element is lit when the page opens with no highlight: the account pick (FR-4); if there is none, the first blocked row with its shortfall; if the plan is met, none. Each pot also shows its own per-cauldron pick as text ("Next: Mage Is Best 1 → 6"). When the page is opened from a Next Action ("See it"), the element with that action's key is lit instead (M17 FR-31).

### F3 Vials

- **FR-9 The vial order.** `alchemy-vials.priority.plan` is an authored ordering list of vial rows, each with a target level by band and a condition (always; a cauldron with brewers; a liquid unlocked; a Shaman on the account). Phase 1 rows, in order (our judgment, confidence L, D-6):

  | # | Vial(s) | Target | Condition | Why |
  |---|---|---|---|---|
  | 1 | Copper Corona, Sippy Splinters, Mushroom Soup, Spool Sprite | Lv 2 (W2), Lv 4 (W3) | its cauldron has a brewer | brew speed of that cauldron (vial text) |
  | 2 | Barium Mixture, Jungle Juice | Lv 2 (W2), Lv 4 (W3) | always | Water cap and liquid regen (vial text) |
  | 3 | Barley Brew | Lv 2 (W2), Lv 4 (W3) | always | lowers every bubble's cost (vial text) |
  | 4 | Tea With Pea | Lv 2 | Liquid Nitrogen open | Nitrogen cap |
  | 5 | Sippy Soul, Ramificoction | Lv 2 (W2), Lv 4 (W3) | always | talent points for tab 2 and tab 1 |
  | 6 | every other unlocked W1–W3 vial | Lv 4 | a Shaman on the account, from W3 | "Vials that are at least level 4 count towards the Shaman's Virile Vials talent" (wiki Vials) |

- **FR-10 The vial Goal.** `alchemy-vials.goal.level-next` (account, details) names the first row, in order, whose vial is unlocked, below its target, and affordable now (F-c: chest storage holds more than the item cost, as Toolbox's alert counts it, and the liquid covers `3·L`). It only uses liquid left **after FR-3's allocation for the account pick** (all of the pick's affordable levels, not just the next one), so the bubble line's "at least K levels" stays true when the vial is levelled (D-7). Toolbox's alert counts only the first storage stack of the item; M19 counts every chest stack, which can only make the line fire where Toolbox's alert wouldn't, never the reverse. "Level Copper Corona 1 → 2 (100 Copper Ore, 3 Water)". Details: the next two affordable rows. Position: next to `alchemy-bubbles.goal.level-next`. Category `compounding`.
- **FR-11 Roll targets.** While M6's `alchemy-vials.check.daily-attempts` fires, M19 supplies its details (X3): up to three locked vials whose item the account holds (M14 `holdingsOf`, every place), ranked by the roll needed (lowest `discoveryScore` first, then vial index). Items held only in the Refinery or the Forge don't count (they can't be dropped on the cauldron). "Easiest rolls with what you hold: Dieter Drink (40+, Bean Slices), Skinny 0 Cal (60+, Snake Skin), Jungle Juice (60+, Jungle Logs)". The why adds the community tip: "Drop several stacks quickly: each counts as a roll" (AutoReview `alchemy_vials.py` L123, cited). M6's Goal, rank and text are otherwise unchanged.

### F4 Pay 2 Win

- **FR-12 The order.** `alchemy-p2w.priority.order` is an authored ordering list of the Pay 2 Win upgrades: (1) Player Alchemy Speed and Extra EXP up to the account's best Alchemy level; (2) Regen and Capacity of every unlocked liquid; (3) Vial Attempts, then Vial RNG; (4) each cauldron's Speed, then its New Bubble chance; (5) Boost Requirement last. *Sources:* AutoReview "… Player upgrades after each Alchemy level up!" (`alchemy_p2w.py` L121, cited); the wiki ("Early on, it's beneficial to level up the rate and cap" of the liquid cauldrons). No human Source orders steps 3–5, so they are our judgment (confidence L, D-8). The AutoReview quote is a dated community tool's advice, cited (tier 3) beside the wiki, which is the player-readable Source (#74).
- **FR-13 The Spend Plan follows it.** M7's `every-p2w` and `vial-attempts` items are replaced by one spend item per step of M19's order, at consecutive positions where `every-p2w` sat in each Stage list (X2). Each step offers its upgrades that are open and below their max. Priced ones are checked against a wallet, and `unpriced` ones are shown exactly as M7 FR-14 shows them today. Because the steps sit at their own positions, M7's rule "unpriced ranks below priced at the same position" keeps M19's order. M7 keeps its wallets, its pricing and its Spend frame. Player upgrades are new to M7: today `SpendInputs.p2w` holds cauldron, liquid and vial upgrades only, and no Player Acquisition is generated. X2 therefore also asks M7 to add `player.speed` and `player.extraExp` as `unpriced` P2W keys (from M19's `p2wPlayer`, capped at the best Alchemy level) and the `alchemy-p2w` generator to emit their two Acquisitions.
- **FR-14 Player upgrades behind.** `alchemy-p2w.check.player-behind` (account): when `speedLv` or `extraExpLv` is below the best Alchemy level on the account, "Buy Player Alchemy Speed and Extra EXP 10 → 13 in Pay 2 Win (cost not checked)". Why: "They cap at your best Alchemy level (13) and speed up every brewer." It is `unpriced` (F-f) and never says the coins are enough. M19's module runs `after: true`, so it reads the merged Spend Plan: when M7's plan already shows the Player line, the Detector stays silent (no new dedupe mechanism in M10). When the Spend Plan is hidden or doesn't reach that line, the Check shows on its own. Category `compounding`, position 3.

### F5 Liquids and the Liquid Shop

- **FR-15 Where Water goes.** When M3's `alchemy.check.liquid-cap-line` or `liquid-cap` fires for **Water** and the account pick spends Water, M3's line fills its new `{pick}` detail slot (X4): "level Roid Ragin first". M3's own text is unchanged. For another liquid, or when the pick spends a different liquid, the slot names the first plan row that spends that liquid, or stays empty.
- **FR-16 The daily gem.** M19 adds one row to M20's `checklist.fact.rows` (X5), band `no-bank`, clock `daily`: "Liquid Shop: One Measly Gem" (done when `multiplierArray[3] ≥ 1`, F-e), and from Trench Seawater on, "and A Pair of Gems" (`multiplierArray[12] ≥ 1`). It costs 5 Water (wiki), the row says so, and it is a row only, never a Goal (M20 D-4). Its 5 Water comes out of FR-3's budget only when the player ticks it; M19 doesn't reserve Water for it.
- **FR-17 The permanent Talent Point.** `alchemy.check.talent-point` (account): when Liquid Nitrogen is open, Water covers the Toolbox data price (`x1 · x2^n` = `3 · 1.3^n` from `liquidsShop` index 8, never reset) and Liquid Nitrogen is at least 1 (the wiki lists a Nitrogen cost that the data table doesn't price; the line says "plus some Liquid Nitrogen: check the price in game"),  "Buy a Talent Point in the Liquid Shop: every character gets one more tab-2 point". Category `compounding`, position 3, confidence H (wiki: the Talent Point is permanent).

### F6 The Alchemy page

- **FR-18 Home.** `alchemy-lab` becomes the page home of `alchemy`, `alchemy-bubbles`, `alchemy-vials` and `alchemy-p2w` in `SYSTEM_HOMES` (M17 TR-7). It replaces M20's `alchemy: { page: 'cauldron-seats' }` and embeds M20's cauldron-seats picture as one of its parts (M20 X6). It is a lazy chunk (TR-8).
- **FR-19 The pots** (Design Lab pick "Cauldron pots"). Four pots in game order. Each shows its brew banked as "about N new bubbles" (M6's data) and the next unlock's chance; its per-cauldron pick ("Next: Mage Is Best 1 → 6") or "Plan met"; and, for the account pick's pot, the lit element. Tapping a pot opens its column sheet: the cauldron's next three plan rows (level, band, "at least K levels", or the shortfall), then "show all" for the full column of bubble chips with their level and percent of maximum.
- **FR-20 The vial shelf** (Design Lab "Vial shelf"). W1–W3 vials in game order (the catalogue's index; vial data carries no world). An unlocked vial shows its level as fill height, and a locked one shows the roll it needs ("60+"). Only the lit vial and the best three roll targets are labelled (the critique's small-text fix). Today's attempts show as "3 of 11 left".
- **FR-21 The liquid tubes.** One tube per liquid: "32 of 32 · full", "92 of 138", "opens at Alchemy 35 (your best: 20)". A tube at its cap is lit when the page opens from M3's line.
- **FR-22 The Pay 2 Win grid.** Rows: four cauldrons, the open liquids, vials, Player. Each cell shows its level and max as a bar, and the next upgrade in FR-12's order is lit when the page opens from M7's Pay 2 Win line or FR-14.
- **FR-23 One step on top.** Under M17's generic header, the page shows the account's top Alchemy Next Action of any owner (M6, M3, M19, M20) as one step of about 12 words. The Next Actions list stays M17's.

### All features

- **FR-24 Stage gates.** Every M19 output starts at W2-early (the cauldron is in the W2 town). On a W1 account the Alchemy page shows M17's "Opens in World 2". Bands never exceed the next Stage (P2).
- **FR-25 Determinism.** The same Account State, Knowledge Base and `now` give byte-identical picks, Goals and pictures.
- **FR-26 Fail closed.** A Goal or element that reads an unknown field is `unknown` with a diagnostic (M11). Nothing is offered from an unknown cost. `EmptyAccountError` produces no M19 output.
- **FR-27 Sources.** Every entry carries the IdleOn Wiki page that covers it (tier 2) plus its tier-1 provenance (Toolbox at the pin), and every judgment row carries its community Source and confidence (section 11.3). AutoReview appears only as a cited tier-3 idea source, never as text.
- **FR-28 Stage Expectations (M15 F5).** M19 adds one row to `metapath.metapath.stage-expectations`: "every Bubble Plan row at its W2 band by W3-mid" (fix: `alchemy-bubbles.goal.level-next`, `when: { findingField: belowW2Band, equals: true }`, the printer row's mechanism). The Detector sets `belowW2Band` on its finding whenever any unlocked row is still below its W2 band level, whatever the account's current band.

## 4. User stories

**US-1. Which bubble.** As a player in a Play Session, I want the one bubble to level now, so that my Water and materials go where they help most.
- **Given** the W2-late account (all three class lines; Water 32 of 32; Roid Ragin 3, every other bubble 1) at the golden clock **When** the engine runs **Then** the Account section shows "Level Roid Ragin 3 → 12 (Power cauldron)" with "at least 9 levels" and the detail "then Swift Steppin 1 → 8 (Quicc)": the 14 Water left buys 7 of its levels, and Stable Jenius gets none.
- **Given** the W3-early account (Water 92 of 138; Roid Ragin 12, Stable Jenius 9) **When** the engine runs **Then** the Goal reads "Level Roid Ragin 12 → 25 (Power cauldron)" with "at least 13 levels", then "Swift Steppin 1 → 25 (Quicc)". The two rows take 84 of the 92 Water (each level costs `2 + floor(L/20)` Water), so Stable Jenius gets 4 levels (9 → 13) of what is left.
- **Given** a W3-early mutation with every row at its W3 band **When** the engine runs **Then** no bubble Goal exists, and the Alchemy page reads "Bubble Plan met for your Stage".

**US-2. Water at cap names the bubble.** As a player, I want the full-Water warning to say what to spend it on.
- **Given** the W2-late account (Water at cap) **When** the engine runs **Then** M3's Water line reads "Spend Water: level Roid Ragin first (it's at cap, 32 of 32)".

**US-3. Vials.** As a player, I want the vial worth levelling now, and the vials worth rolling today.
- **Given** the W3-early account (15 vials at level 1; a Shaman on the account) **When** the engine runs **Then** "Level Copper Corona 1 → 2 (100 Copper Ore, 3 Water)" shows, with "then Sippy Splinters 1 → 2, Mushroom Soup 1 → 2". All four cauldrons have brewers. The bubble pick's 31 Water is reserved first (FR-10), and the rest covers the vial levels.
- **Given** the W2-late account (11 of 11 attempts left) **When** the engine runs **Then** M6's "Use your 11 vial attempts on the W2 town cauldron" carries the details "Easiest rolls with what you hold: Dieter Drink (40+, Bean Slices), Skinny 0 Cal (60+, Snake Skin), Jungle Juice (60+, Jungle Logs)".
- **Given** the W3-early account (0 of 17 attempts left) **When** the engine runs **Then** no roll targets show (M6's Goal doesn't fire).

**US-4. Pay 2 Win.** As a player, I want to know which coin upgrade comes first in Alchemy.
- **Given** the W2-late account (Player upgrades 10, best Alchemy 13) **When** the engine runs **Then** M7's Spend Plan shows "Buy Player Alchemy Speed and Extra EXP 10 → 13 (cost not checked, see the price in game)" as its first Pay 2 Win line, and the Account section shows no separate Player line (FR-14: the Detector sees M7's line and stays silent). This needs X2's new Player keys in M7.
- **Given** the W3-early account (Player 19, best Alchemy 20; Liquid Nitrogen open but its Pay 2 Win upgrades read −1) **When** the engine runs **Then** the Pay 2 Win lines are Player 19 → 20 (unpriced), then Water Regen (Toolbox price), and no Nitrogen upgrade (M7 AC-8.2's −1 rule).

**US-5. The Liquid Shop.** As a player, I want the daily gem buy and the permanent Talent Point when I can afford them.
- **Given** either fixture **When** the checklist renders **Then** it has the row "Liquid Shop: One Measly Gem · 5 Water", `todo` (both `multiplierArray[3]` are 0).
- **Given** the W3-early account (Liquid Nitrogen 0.08) **When** the engine runs **Then** no Talent Point Goal shows, and the Alchemy page's tube reads "Talent Point needs 1 Liquid Nitrogen".

**US-6. The page lights one bubble.** As a player, I want the Alchemy page to show the next step on a picture of the cauldrons.
- **Given** the W2-late account **When** the player opens the Alchemy page from the hub **Then** the Power pot is lit with "Next: Roid Ragin 3 → 12", the other pots read "Next: Swift Steppin 1 → 8" (Quicc), "Stable Jenius 1 → 12 · needs Water" (High-IQ) and "Nothing to level yet · spend brew" (Kazam: neither of its plan rows, Prowesessary and Undeveloped Costs, is unlocked), and each pot shows "about N new bubbles" from M6.
- **Given** the W2-late account **When** the player taps "See it" on M3's Water line **Then** the Water tube is lit instead of the pot.

## 5. Technical requirements

### TR-1 Package boundaries
Engine logic is pure in `packages/engine/src/alchemy/` (`plan.ts`, `vials.ts`, `p2w.ts`, `shop.ts`, `views.ts`, `module.ts`). One engine module, `alchemy-plan`, registered with `after: true` so it can read M3's, M6's and M7's merged output for its links and dedupe (M14 TR-1). The adapter lives in `packages/account-state/src/alchemy.ts` and `alchemy-types.ts`. Bubble costs come from Toolbox `getBubbleUpgradeCost`, wrapped as `toolboxCalls.bubbleCost(rawName, bubbleIndex, level, baseCost)` (a new entry in `packages/toolbox-parsers/src/calls.ts`). The parse worker hands it to the engine as a pure function on `EngineInput.toolbox` (the engine runs in the same worker, M10 TR-6). It is deterministic and has no I/O, so the engine stays pure. Costs are computed at engine time and are never stored in the Account State or its 30-day history. The UI never imports `toolbox-parsers`, and the main chunk never imports `apps/activeon/src/alchemy/`.

### TR-2 Account State additions (M1 TR-11 growth; null when the `alchemy` section fails)
```ts
export interface BubbleState {
  cauldron: CauldronId; index: number; rawName: string; level: number;   // costs are NOT stored (TR-1)
}
export interface VialState { index: number; name: string; level: number; item: string; liquid: 1 | 2 | 3 | 4; score: number }

// AccountSummary (extends M6's AlchemyState; read in alchemy.ts only)
alchemyPlan?: null | {
  bubbles: BubbleState[];             // every bubble of the four cauldrons (levels only), plus `unlockedBubbles` per cauldron from M6
  vials: VialState[];                 // the 42 W1–W3 vials
  liquids: Array<{ index: 0 | 1 | 2 | 3; current: number; max: number; open: boolean }>; // shared with M20's field
  liquidShopBought: number[];         // multiplierArray (F-e)
  p2wPlayer: { speedLv: number; extraExpLv: number };
  bestAlchemyLevel: number;           // max over characters
};
```
`liquids` is declared here only as a reference to M20 TR-2's field: the adapter fills it once. Chest storage counts are M8's `account.storageItems`. About 1.5 KB is added per save (100 levels, 42 vials, 18 counters), inside M1's 320 KB guard. An earlier draft stored 40 levels of costs per bubble, about 76 KB on the W3-early fixture; that is why costs moved to engine time.

### TR-3 Fact tables (ADR 0007)
| id | Origin | Contents | Source |
|---|---|---|---|
| `alchemy-bubbles.fact.curves` | generated from Toolbox `cauldrons.json` | per W1–W3 bubble: rawName, cauldron, index, active or passive, `func`, `x1`, `x2`, the band levels for 10%, 20% and 40% of maximum (F-a; linear bubbles get the `x2 = 100` reference levels, FR-1) | Toolbox game data; wiki cauldron pages ([Power](https://idleon.wiki/wiki/Alchemy/Power_Cauldron), [Quicc](https://idleon.wiki/wiki/Alchemy/Quicc_Cauldron), [High-IQ](https://idleon.wiki/wiki/Alchemy/High-IQ_Cauldron), [Kazam](https://idleon.wiki/wiki/Alchemy/Kazam_Cauldron), 2026-10-04) |
| `alchemy-vials.fact.catalogue` | generated from Toolbox `vials.json` | index, name, item, score, liquid, per-level effect text | Toolbox; wiki [Vials](https://idleon.wiki/wiki/Alchemy/Vials) (2026-09-29) |
| `alchemy-vials.fact.costs` | generated from Toolbox `vialCostsArray` | the item cost per level; the liquid cost rule `3·L` | Toolbox `world-2/alchemy.ts`; wiki Vials |
| `alchemy.fact.liquid-shop` | generated from `shared-data.json` `liquidsShop` | name, index, `x1`, `x2`, and whether its price resets daily (authored flag: Talent Points and Small Donation never reset) | Toolbox; wiki Alchemy (Liquid Shop) |

Size: about 14 KB raw for the four tables and the three authored lists, measured in the build PR's `kb compile` (budget: +25 KB).

### TR-4 Entries (#11 shape; **A** authored)
| Entry id | Type | Detector | Position | Notes |
|---|---|---|---|---|
| `alchemy-bubbles.priority.plan` | priority (`list: order`) **A** | — | — | FR-1, FR-2 |
| `alchemy-bubbles.goal.level-next` | goal (account, details) **A** | `alchemy/plan` | after the subclass Goals in W2 and W3 lists | FR-3–FR-6; Walkthrough only in FR-6's case |
| `alchemy-vials.priority.plan` | priority (`list: order`) **A** | — | — | FR-9 |
| `alchemy-vials.goal.level-next` | goal (account, details) **A** | `alchemy/vials` | next to the bubble Goal | FR-10 |
| `alchemy-p2w.priority.order` | priority (`list: order`) **A** | — | — | FR-12; consumed by M7's spend items (X2) |
| `alchemy-p2w.check.player-behind` | check (account) **A** | `alchemy/p2w` | 3 | FR-14; silent when the merged Spend Plan already has the Player line (it runs `after: true`) |
| `alchemy.check.talent-point` | check (account) **A** | `alchemy/shop` | 3 | FR-17 |
| `alchemy/plan`, `alchemy/vials`, `alchemy/p2w`, `alchemy/shop` | engine Detectors | — | — | |

### TR-5 Engine output (M10 TR-2 additions, built in the worker)
```ts
export interface BubblePick {
  cauldron: CauldronId; rawName: string; name: string; from: number; to: number;
  atLeast: number;                                        // affordable levels (FR-3), a lower bound (F-b)
  blocked: null | { rawName: string; name: string; more: number }; // FR-4's shortfall
  actionKey: string | null;
}
export interface AlchemyResult {
  band: 'w2' | 'w3' | 'w3-late' | null;
  pick: BubblePick | null;                                // FR-4 account pick
  pots: Array<{ cauldron: CauldronId; next: BubblePick | null; expectedNewBubbles: number; nextUnlockChance: number | null }>;
  column: Record<CauldronId, Array<{ rawName: string; name: string; level: number; bandLevel: number | null; pctOfMax: number | null; inPlan: boolean }>>;
  vials: Array<{ index: number; name: string; level: number; rollNeeded: number | null; lit: boolean; rollTarget: boolean }>;
  vialPick: null | { name: string; from: number; to: number; actionKey: string | null };
  rollTargets: Array<{ name: string; rollNeeded: number; item: string }>;  // X3, at most 3
  tubes: Array<{ index: number; current: number; max: number; open: boolean; opensAt: number | null; actionKey: string | null }>;
  p2w: Array<{ key: string; level: number; max: number; next: boolean; actionKey: string | null }>;
  planMet: boolean;
}
// EngineResult addition
alchemy?: AlchemyResult | null;
```
`buildNowView` passes `result.alchemy` through as `view.alchemy`. The lazy page chunk only formats it.

### TR-6 Pictures and homes (M17 interfaces)
- `SYSTEM_HOMES`: `alchemy`, `alchemy-bubbles`, `alchemy-vials` and `alchemy-p2w` each `{ page: 'alchemy-lab' }`. `SYSTEM_PAGES['alchemy-lab']` is a `lazy()` component that renders the pots, shelf, tubes and grid from `view.alchemy`, then M20's `CauldronSeatsBody` as its last part (FR-18).
- Highlight: elements carry `actionKey`. The page lights the element whose key equals `SystemPageView.highlight`; with no highlight, FR-8's default.
- The pictures follow ADR 0009 (our pixel art) and the Design Lab's v2 tokens. Only the lit element and up to three others carry text under 14 px (the critique's small-text issue).

### TR-7 Cross-module wiring
- **M3 (X4):** `alchemy.check.liquid-cap-line` and `liquid-cap` gain an optional `{pick}` details slot filled from `EngineResult.alchemy.pick` for the liquid that is full (FR-15). Their text is not rewritten. M3's Detectors and blocker rules don't change.
- **M6 (X3):** `alchemy-vials.check.daily-attempts` gains a `{targets}` details slot filled from `rollTargets`.
- **M7 (X2):** in every `spend.priority.<stage>`, the `every-p2w` and `vial-attempts` items become five `p2w` items, one per step of `alchemy-p2w.priority.order`, at consecutive positions (FR-13). M7's `p2wCandidates` filters by the step's keys. Pricing and wallets stay M7's.
- **M20 (X5, X6):** the Liquid Shop row in `checklist.fact.rows`; `SYSTEM_HOMES.alchemy` moves to `alchemy-lab`, and M20's picture becomes a part of it.

### TR-8 Performance and budgets
- **Worker:** FR-3 calls `bubbleCost` at most once per level it hands out (at most 67 per row, about 1,500 calls on a late save), pure arithmetic, ≤ 1 ms. The engine module is ≤ 2 ms.
- **Knowledge Base:** ≤ +25 KB raw and +5 KB gzip (TR-3). The bundle measured 574 KB raw and 130.8 KB gzip on 2026-10-18 (`kb compile` on `4ae879c`); with M18's +45 KB it is about 645 KB of 720 KB raw and under 145 KB of 160 KB gzip.
- **Main chunk:** 319.05 KB gzip of 320 KB on main (2026-10-18). M19 adds nothing to it: the page is a lazy chunk, `buildNowView` only passes `alchemy` through, and the slot texts for M3 and M6 are filled in the worker. The build PR's `check-budgets` must show the main chunk within +0.3 KB of main. `SYSTEM_PAGES` imports its bodies eagerly today, and `SystemPage.tsx` has no `<Suspense>`: the first of M18 and M19 to build adds both (M18 X6), and the other reuses them.
- **Account State:** ≤ 2 KB per save (TR-2).

### TR-9 Storage, security and privacy
M19 stores nothing. Dismissals use M10's store by entry id. Nothing leaves the device. Tests print no fixture names.

### TR-10 Tests
- **Detector examples** on the scrubbed fixtures: each entry fires, stays silent and reads `unknown` with section 4's mutations.
- **Allocation** (FR-3): two rows sharing Spore Cap and Water never both count the same items; a row stops at its band; Water reserved for the bubble pick isn't given to the vial line (FR-10).
- **Bands** (FR-1): the generator's band levels equal the curve's (Hearty Diggy `x2 = 100` → 12, 25, 67; Warriors Rule `x2 = 50` → 6, 13, 34), and the CI cross-check fails if Toolbox's `x2` changes.
- **Costs** (F-b): a property test that `getBubbleUpgradeCost` with any discount factors in (0, 1] never exceeds the no-discount cost, at every W1–W3 bubble and level 0–100, run in M12's weekly re-sync so a patch that changes the cost function's shape fails loudly. (A comparison with the game's displayed cost isn't possible: the discounts live outside the vendored parsers.)
- **Goldens:** section 11's lines are lines of the Now text snapshot, plus a `## Alchemy` section (pick, per-pot picks, vial pick, roll targets).
- **Public saves:** no crash; no M19 output on W1 saves; no plan row above the next Stage on any save.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, empty parse | No Alchemy page body; no M19 Goals |
| W1 account | M17's "Opens in World 2"; no M19 output |
| `alchemy` section failed | Every M19 output `unknown`; M3 and M6 lines keep their own text |
| Every plan row met | No bubble Goal; the page says "Bubble Plan met for your Stage" |
| No row affordable | FR-6: the first shortfall, with a Requirement Tree for a material; a liquid shortfall reads "Water is the limit" with no tree |
| A Beginner or Journeyman line only | FR-2's class rows are skipped (no LUK main-stat row in Phase 1); the other rows apply |
| A bubble costed in Bits (Gaming) | Not a W1–W3 bubble; never in the plan |
| A liquid open but at 0 regen (nobody on it, no Pay 2 Win Regen) | Rows that need it read "needs <liquid>"; M20's seat line covers the seat |
| The daily gem bought after the save | The checklist row ticks from the next save; Water the bubble Goal counted may be 5 short until then |
| A bubble's cost exceeds 1e9 | Toolbox clamps it; "at least" stays true |
| A plan bubble not unlocked yet | Skipped for the pick; "unlocks with brew" on the page (FR-7) |
| Two rows share a material | FR-3's in-order allocation |
| Water at cap and nothing to level | M3's own text, unchanged (FR-15) |
| A vial at 13 | Never a target |
| Liquid Shop counters reset since the save | The gem row reads `todo` after the daily reset (M20 FR-3's projection) |
| Pay 2 Win liquid at −1 with the liquid open | Shown as "not open in Pay 2 Win yet" on the grid; no line (M7 AC-8.2) |
| A W4+ account | The W3-late band applies; W4+ bubbles and sigils are "not covered"; the page says "Bubble Plan covers Worlds 1–3" |
| Patch changes a curve or a cost table | Generated facts change at re-sync; the cost contract test fails loudly; authored rows naming a missing rawName fail CI |
| Multiple tabs, second account, paste mode | As M17; nothing cached across accounts |

## 7. Dependencies and cross-module requests

| Module | What M19 uses | Interface or request |
|---|---|---|
| **M1** | Account State, `isKnown` | TR-2 growth |
| **M2** | Stage, `compareGoals`, Stage lists, Roles | **X1:** `alchemy-bubbles.goal.level-next` and `alchemy-vials.goal.level-next` after the subclass Goals in every W2 and W3 list; `alchemy-p2w.check.player-behind` and `alchemy.check.talent-point` in `free-value-fills` |
| **M3** | the Water lines | **X4:** a `{pick}` slot (TR-7) |
| **M6** | brew, big bubbles, vial attempts | **X3:** a `{targets}` slot on the vial attempts Check; M6's `bigBubbles` field for FR-2 row 6 |
| **M7** | Spend Plan, `p2w` candidates, wallets | **X2:** five `p2w` items in `alchemy-p2w.priority.order`; new `unpriced` keys `player.speed` and `player.extraExp` in `SpendInputs.p2w`, with two generated Acquisitions (FR-13) |
| **M8** | `storageItems` | read-only |
| **M10** | `EngineResult`, `NowView`, `EngineInput` | `alchemy` passed through; `EngineInput.toolbox.bubbleCost` (TR-1) |
| **M11** | schema, fact tables, generators, Detector contract | the `alchemy-curves` generator; CI for band levels and rawNames |
| **M14** | Requirement Trees for a material shortfall (FR-6), `holdingsOf` | read-only (an ordinary material target) |
| **M15** | Stage Expectations | FR-28's row |
| **M17** | `SYSTEM_HOMES`, `SYSTEM_PAGES`, highlight, registry | TR-6; the Suspense request M18 already makes (M18 X6) |
| **M20** | `liquids`, the checklist registry, the cauldron-seats picture | **X5:** the Liquid Shop row; **X6** (M20's own request): the home moves to `alchemy-lab`. M20 FR-28 says its liquid-seat rule yields "when M19 publishes bubble targets"; that clause is about a seat plan, which M19 Phase 1 doesn't publish, so FR-27 stays until M19 Phase 2 and M20's spec gets a one-line note saying so |

## 8. Owner review (self-ruled; the owner was asleep)

Each question was ruled by the author with the recommendation below, so the build can start. Each is also one line under "M19" in the batched review queue. The owner confirms or overturns in the review release.

- **D-1 Module home and ownership.** Options: absorb every `alchemy*` Check into M19 (the atlas's suggestion), or add the choice side only. ➡️ **A new module M19 that adds the choice side and the Alchemy page.** M6's brew and big-bubble Checks, M3's blockers and M20's seats keep their owners. *Why:* moving working, tested Checks buys nothing and risks regressions. The gap is the missing choice, not who owns the waste lines.
- **D-2 One plan, by Stage.** ➡️ One ordered Bubble Plan with three bands (W2, W3, W3-late), instead of per-cauldron lists. *Why:* the Water and the shared materials (Spore Cap feeds all three class multis) are account-wide, so one order is the only way to spend them without counting twice (FR-3).
- **D-3 The bands.** Options: AutoReview's tier levels; fixed levels of our own; percent-of-maximum bands. ➡️ **10%, 20% and 40% of maximum, from the curve, mapped to W2, W3 and W3-late.** *Why:* the percentages are a property of each bubble's curve (wiki "% from maximum"), so the levels are generated, not copied. AutoReview publishes the same three percentages as "finishing W2", "starting W3" and "starting W4" (cited as the idea's source). Its own stage rater expects them later still (its first band only by late W3), so ours are a stretch. That's intended for a coach, and the Goal sits at a Stage position, not at position 3, so it never crowds out free value.
- **D-4 The order of rows.** ➡️ Main-stat bubbles, then skill bubbles for skills in use, then the class multis, tools, Prowesessary, equipped big bubbles, Undeveloped Costs, FMJ and Shaquracy, Name I Guess (FR-2). *Why:* a main-stat bubble pays every character at once; the multis only scale small bubbles that are still near level 1 on both fixtures, so they pay more once rows 1–2 are levelled. No human Source gives a W2–W3 order (section 11.3), so the rows carry confidence M or L. Its row set overlaps AutoReview's early tiers because both pick the obvious early bubbles; every row here is justified by the bubble's own text or a human Source, and no AutoReview list order or level table is used (linear bubbles use our own `x2 = 100` reference, which gives big bubbles 12/25/67 where AutoReview has other levels). **The order most likely to change.**
- **D-5 Costs.** ➡️ Toolbox's own cost function with no discounts, read as an upper bound ("at least K levels"). *Why:* the discounts are computed outside the vendored parsers; computing them ourselves would be a game formula (ADR 0005). An upper bound never claims an unaffordable level is affordable.
- **D-6 The vial order.** ➡️ FR-9's six rows: brew-speed vials for cauldrons in use, the liquid vials, Barley Brew, Tea With Pea, the talent-point vials, then every vial to level 4 when a Shaman is on the account. Confidence L. *Why:* no human Source gives a W2–W3 vial order. The rows follow each vial's own text, and the wiki's Virile Vials rule is the one hard fact.
- **D-7 Water between bubbles and vials.** ➡️ All the Water the bubble pick's affordable levels need is reserved; the vial line fires only from what's left. *Why:* one Water pool, and "at least" must stay true for the line the player reads first.
- **D-8 Pay 2 Win order.** ➡️ Player upgrades to the best Alchemy level, then liquid Regen and Capacity, then Vial Attempts, cauldron Speed and New Bubble, then Boost Requirement; M7's Spend Plan follows it. *Why:* AutoReview's "Player upgrades after each Alchemy level up" (cited) and the wiki's "Early on, it's beneficial to level up the rate and cap" of the liquids; no Source orders the rest (confidence L).
- **D-9 Boosts and Bargain Tags.** ➡️ Phase 2. *Why:* the sources disagree on new bubbles versus Boosts and give no numeric switch rule, and Bargain Tags need Trench Seawater (Alchemy 35), which neither fixture has.
- **D-10 Laaarrrryyyy.** ➡️ Not in the Phase 1 plan; the page shows it with "sources disagree". *Why:* players call it "priority number one" (Reddit 2026-06-08) and "a good priority if your characters can push out the materials" (2026-06-02), while AutoReview places it far later. Every one of these Sources predates the current major patch, so it isn't Contested under ADR 0004's amendment; it is simply unsettled, and an unsettled row doesn't belong in a plan that lights one bubble.
- **D-11 The page.** ➡️ One page, `alchemy-lab`, home of all four Alchemy Systems, with pots (the Design Lab pick), the vial shelf, the liquid tubes, the Pay 2 Win grid and M20's seats as its last part. *Why:* the atlas: "Alchemy is one engine … one Alchemy page, not five checks".
- **D-12 The Liquid Shop.** ➡️ The daily gem as a checklist row; the Talent Point as a Goal when affordable; Bargain Tags in Phase 2. *Why:* the gem doesn't bank and belongs with the daily routine (M20 D-4); the Talent Point is permanent for every character.
- **D-13 Stage Expectation.** ➡️ "Every Bubble Plan row at its W2 band by W3-mid". *Why:* that is the plan's own first band, one Stage of slack after W3-early.
- **D-14 Glossary.** ➡️ Add **Bubble Plan**. *Why:* the UI says "Bubble Plan met for your Stage".

## 9. Red-team notes (author's own pass)

1. **"Affordable" when it isn't.** *Defence:* undiscounted costs are an upper bound, and every line says "at least" (F-b, D-5).
2. **Counting shared materials twice.** *Defence:* FR-3's in-order allocation, plus the Water reserve for vials (FR-10).
3. **Copying AutoReview.** *Defence:* bands are generated from curves, rows are our own order with human Sources, and AutoReview is cited as an idea source only (header, FR-27).
4. **A wrong order.** *Defence:* confidence M or L on every row, Sources shown in "why", D-4 flagged as the most likely to change, and Suggestions for corrections.
5. **Noise.** *Defence:* one bubble Goal and one vial Goal, both account lines; roll targets live inside M6's existing line; the Player line merges into M7's.
6. **Main chunk.** *Defence:* everything visual is lazy, and the worker fills M3's and M6's slots (TR-8).
7. **Patch day.** *Defence:* generated curves and cost tables, a cost contract test, CI on rawNames.

## 10. Red-team log

An independent reviewer (no access to the author's reasoning) checked the draft against the vendored Toolbox code, the game data, M3, M6, M7, M10, M17 and M20, the wiki and both private saves, and recomputed section 11 with a port of Toolbox's cost function: 34 findings (0 P0, 5 P1, 16 P2, 13 P3). It confirmed the curve fractions, the upper-bound reading of the cost function, the vial costs, the −1 rule, the Player cap, the fixture facts and every W2-late pick except the Swift Steppin detail. The author re-checked each finding before ruling.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P1 | The row set and linear levels mirror AutoReview's tier table | fixed | Every row now justified by bubble text or a human Source (FR-2, D-4); linear bubbles use our own `x2 = 100` reference, which differs from AutoReview for big bubbles; the overlap is stated openly |
| 2 | P1 | FMJ, Shaquracy, Name I Guess had no band | fixed | FR-1: every linear bubble takes the reference levels |
| 3 | P1 | M7 has no Player Pay 2 Win keys | fixed | X2 adds `player.speed` / `player.extraExp` (unpriced) and two generated Acquisitions (FR-13, §7) |
| 4 | P1 | Stored per-level costs would add ~76 KB per save | fixed | Costs computed at engine time via `EngineInput.toolbox.bubbleCost`, never stored (TR-1, TR-2: ~1.5 KB) |
| 5 | P1 | W3-early example ignored the liquid step (84 Water, not 74) | fixed | US-1, §11.2: 31 + 53 = 84; Stable Jenius 4 levels |
| 6 | P2 | V3 open but goldens pinned | fixed | V3 must settle before the goldens; §11 states the assumption |
| 7 | P2 | "index 0–24" includes W4/W5 materials | fixed | Scope by material worlds (§2) |
| 8 | P2 | "% of maximum" for `decayMulti` contradicts `getMaxBonus` and the wiki | fixed | F-a defines our share-of-the-bonus; shown as levels, never a percent |
| 9 | P2 | Header claimed a red-team before it happened | fixed | This log |
| 10 | P2 | Laaarrrryyyy wrongly called Contested (pre-patch Sources) | fixed | "Sources disagree (pre-patch)"; still left out (FR-2, D-10) |
| 11 | P2 | `dedupeWith` doesn't exist | fixed | FR-14: the Detector (`after: true`) stays silent when the merged Spend Plan has the line |
| 12 | P2 | Contradiction with M20 FR-28 | fixed | §7 and a note in M20 FR-28: it yields to a seat plan (Phase 2), not to bubble targets |
| 13 | P2 | Vial line could break the bubble line's "at least K" | fixed | FR-10, D-7: all the pick's affordable levels' Water is reserved |
| 14 | P2 | Roll chance ignores Vial RNG | fixed | Show and rank by the roll needed ("60+"), never a percent (F-c, FR-11) |
| 15 | P2 | Vial RNG dropped from the Spend Plan | fixed | FR-12 step 3 |
| 16 | P2 | Stage Expectation could never fire | fixed | `belowW2Band` finding field (FR-28) |
| 17 | P2 | Talent Point Nitrogen price isn't in Toolbox data | fixed | FR-17: data price for Water, Nitrogen ≥ 1 with "check the price in game"; tab-3 point out |
| 18 | P2 | Cost contract test can't be built | fixed | Replaced by a property test on the cost function (TR-10) |
| 19 | P2 | No shortfall path for Water | fixed | FR-6: "Water is the limit", no Requirement Tree, `nice` |
| 20 | P2 | Main chunk; `pages.ts` not lazy; depends on M18 X6 | fixed | TR-8: whichever of M18/M19 builds first adds `lazy()` and Suspense |
| 21 | P2 | "unlocked = level ≥ 1" isn't the game's rule | fixed | F-a, FR-3: inside the unbroken run only |
| 22 | P2 | FR-15 used a Water pick for any liquid and rewrote M3's text | fixed | FR-15, TR-7: a details slot, per liquid |
| 23 | P2 | Swift Steppin detail overstated (1 → 8, not 12) | fixed | FR-5 details show the level reached; US-1, US-6, §11.1 |
| 24 | P3 | Toolbox's strict ">" and first-stack-only count | fixed in part | Every chest stack counts (FR-10); the strict ">" is kept as Toolbox's rule until V3 |
| 25 | P3 | Gem-alert citation wrong | fixed | F-e cites the Pair of Gems alert and applies its test to index 3 |
| 26 | P3 | D-3's "a world later" wrong | fixed | D-3 reworded (its rater, not its labels) |
| 27 | P3 | Version numbering reads out of order | fixed | Patch note in the header |
| 28 | P3 | Call Me Pope fits two band rules | fixed | Its own curve wins (FR-2 row 6) |
| 29 | P3 | "Vials grouped by world" has no data | fixed | Game order (FR-20) |
| 30 | P3 | Roll targets ignore the plan and count Refinery/Forge items | fixed in part | Refinery and Forge excluded; ranking stays by the easiest roll, because an unlock is a roll, not a level, and the plan only orders levels |
| 31 | P3 | Some Sources aren't player-readable | rejected | Every entry keeps a wiki or dated community Source; the Atlas, research branches and AutoReview lines are provenance only, as #74 allows |
| 32 | P3 | Gzip budget missing, size unmeasured | fixed | TR-8: measured 574 KB raw / 130.8 KB gzip, gzip target stated |
| 33 | P3 | `liquids` declared twice | fixed | TR-2 note |
| 34 | P3 | Missing edge cases | fixed | §6: Beginner-only, Bits, idle liquid, the daily gem |

Rejected: 1 (#31). Deferred: none.

## 11. Worked examples (private fixtures, by class and level)

Golden clock, Expected Return 8 h.

### 11.1 W2-late account (Stage W2-late → band W2)
- **Cauldrons:** Power 6 bubbles unlocked, Quicc 2, High-IQ 2, Kazam 3 (13 in all). Every bubble is at level 1 except Roid Ragin (3). Brewers: one each in Power, Quicc and Kazam, two in High-IQ. M6's brew Goal: "Spend banked brew in Quicc, High-IQ and Kazam: about 10 new bubbles".
- **Bubble Goal:** "Level Roid Ragin 3 → 12 (Power cauldron)", at least 9 levels (Copper Ore 1,294; Water 32), then "Swift Steppin 1 → 8 (Quicc)" with the 14 Water left. Stable Jenius, Hearty Diggy and the three class multis are below their bands with no Water left. Stronk Tools, Sanic Tools, Le Brain Tools, Prowesessary and Undeveloped Costs aren't unlocked yet. Per-pot picks: Power Roid Ragin, Quicc Swift Steppin, High-IQ "Stable Jenius · needs Water", Kazam "Nothing to level yet · spend brew".
- **Water:** 32 of 32. M3's line names Roid Ragin (X4).
- **Vials:** 6 unlocked, all level 1. With Roid Ragin's 18 Water reserved, the vial Goal is "Level Copper Corona 1 → 2 (100 Copper Ore, 3 Water)", then Sippy Splinters and Spool Sprite. Roll targets in M6's line: Dieter Drink (40+), Skinny 0 Cal (60+), Jungle Juice (60+).
- **Pay 2 Win:** Player 10, best Alchemy 13: "Buy Player Alchemy Speed and Extra EXP 10 → 13" leads M7's Pay 2 Win lines (unpriced). Water Regen 31 and Capacity 19 come next, with Toolbox prices (236K coins for the next Regen level).
- **Liquid Shop:** the gem row is `todo`. No Talent Point (Liquid Nitrogen opens at Alchemy 20; best 13).

### 11.2 W3-early account (Stage W3-early → band W3)
- **Cauldrons:** Power 7, Quicc 6, High-IQ 5, Kazam 6 (24 in all). Roid Ragin 12, Stable Jenius 9, Level Up Gift 11, Lotto Skills 2; the other 20 at level 1. Equipped big bubbles: Wyoming Blood, Sploosh Sploosh, Molto Loggo, Hammer Hammer, Level Up Gift.
- **Bubble Goal:** "Level Roid Ragin 12 → 25 (Power cauldron)", at least 13 levels (Water 92), then "Swift Steppin 1 → 25 (Quicc)". The first two rows take 84 of the 92 Water (31 and 53, at `2 + floor(L/20)` a level), so Stable Jenius gets 4 levels (9 → 13) and every later row reads "needs Water" in its pot's sheet. These counts assume Toolbox prices the next level at the current level (V3); the golden is recorded after V3.
- **Vials:** 15 unlocked, all level 1, and a Shaman on the account. "Level Copper Corona 1 → 2", then Sippy Splinters and Mushroom Soup. Anearful, Tea With Pea and Ramificoction can't be levelled from storage (79, 100 and 9 items against 100). No roll targets (0 of 17 attempts left).
- **Pay 2 Win:** Player 19, best Alchemy 20 → "19 → 20" leads; Liquid Nitrogen is open but its Pay 2 Win upgrades read −1, so no Nitrogen line.
- **Liquids:** Water 92 of 138, Nitrogen 0.08 of 13. The Talent Point waits for 1 Nitrogen.

### 11.3 Facts and judgment checked for this spec
| Claim | Evidence (opened 2026-10-18) |
|---|---|
| Curves, band fractions, "% from maximum" | Toolbox `cauldrons.json`, `growth` @ 6c37e3d; wiki cauldron pages (2026-10-04); for `decayMulti` our share-of-the-bonus definition (F-a) |
| Costs and their discounts | Toolbox `getBubbleUpgradeCost` (`world-2/alchemy.ts` L129–146); wiki Power Cauldron's cost calculator (2026-10-04) |
| Vial costs, the roll needed, Virile Vials at level 4 | Toolbox `vialCostsArray`, `account.js` L477–507; wiki [Alchemy/Vials](https://idleon.wiki/wiki/Alchemy/Vials) (2026-09-29) |
| Liquids open at 20, 35, 80; Liquid Shop prices and resets; the Talent Point never resets | wiki [Alchemy](https://idleon.wiki/wiki/Alchemy) (2026-10-05; Liquid Shop prose 2026-04-09) |
| Pay 2 Win is coins; Player capped at the best Alchemy level | wiki Alchemy, Pay 2 Win section |
| "Early on, level the rate and cap" of liquids | wiki Alchemy, Liquids |
| Skill bubbles early for printer samples | Reddit [1tv3615](https://www.reddit.com/r/idleon/comments/1tv3615/) (comment 2026-06-03) |
| FMJ / Shaquracy weaker since the Vault | Reddit [1jlis0c](https://www.reddit.com/r/idleon/comments/1jlis0c/) (2025-03-28); for them: Steam guide [3368490152](https://steamcommunity.com/sharedfiles/filedetails/?id=3368490152) (updated 2026-06-28) |
| Laaarrrryyyy: Sources disagree (all pre-patch) | Reddit [1tzseli](https://www.reddit.com/r/idleon/comments/1tzseli/) (2026-06-08), 1tv3615 (2026-06-02); against: AutoReview tier 7 (cited), Reddit [1cuu3kj](https://www.reddit.com/r/idleon/comments/1cuu3kj/) (2024) |
| New bubbles vs Boosts: no rule | Reddit 1cuu3kj (2024-05-18), [1gpwc4t](https://www.reddit.com/r/idleon/comments/1gpwc4t/) (2024-11-13), [1bxc1x3](https://www.reddit.com/r/idleon/comments/1bxc1x3/) (2024-04-06): they disagree |
| Daily vial tip (drop stacks) | AutoReview `w2/alchemy_vials.py` L123 @05ac449 (cited) |
| Bands as an idea; Player upgrades after each level | AutoReview `consts/progression_tiers.py` L945–1094, `w2/alchemy_p2w.py` L121 @05ac449 (cited, nothing copied) |
| Early bubble cost cut (older guides Stale) | wiki Changelog/2025, v2.28 (2025-02-08); Roid Ragin to Copper Ore, v1.00 |
| Daily Checklist lists the Liquid Shop gems | wiki [Daily Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24) |
| Fixture values in 11.1–11.2 | local scripts over both private fixtures (aggregates only), using Toolbox's cost table |

**No human Source found** (so the rows are confidence L or left out): Undeveloped Costs or the Bargains "first"; Brewstachio, Big Meaty Claws and Quick Slap targets; a vial levelling order; an order among the Pay 2 Win coin upgrades; a numeric rule for Boosts.

### 11.4 Verify before build
- **V1** (settled) Bubble curves, band fractions and Toolbox's cost function (F-a, F-b).
- **V2** (settled) Vial cost, the roll needed ("Score+") and the storage count Toolbox's alert uses (F-c).
- **V3** Bubble levels take materials from the chest only, and which `level` argument gives the next level's cost, from N.js (`CauldronStats("CauldronCosts")` and the upgrade handler). Agent task, **before the goldens are recorded**: section 11's counts assume the current level. If the inventory also counts, FR-3 counts it with M14's places.
- **V4** Which Pay 2 Win liquid levels open when (the W3-early account has Nitrogen open but its upgrades at −1). Agent task (N.js `CauldronP2W` unlock). Until then −1 means "not open" (M7 AC-8.2).
- **V5** `multiplierArray[3]` and `[12]` reset at the account's daily reset (M20 F-a), not a server day. Agent task; else the row's clock changes.
- **V6** (settled) Player Pay 2 Win upgrades cap at the best Alchemy level (wiki).

## 12. Phased build plan

| Phase | Ships | Why first |
|---|---|---|
| **1** (after M17 Phase 1, alongside M18) | F1 facts; F2 Bubble Plan, picks and picture rule; F3 vial order, vial Goal, roll targets in M6's line; F4 Pay 2 Win order for M7 and the Player line; F5 the Water pick, the gem row, the Talent Point; F6 the Alchemy page; the Stage Expectation row | Uses only built modules (M1–M3, M6–M8, M10, M11, M14, M17, M20) |
| **2** | Boosts versus new bubbles; Bargain Tags before an expensive level; the Bargain bubbles on the matching class; Laaarrrryyyy once a post-patch Source settles it; who brews where (replacing M20 FR-27); Trench and Toxic Mercury; sigils at W4 | Needs Sources that agree, Trench Seawater, or W4 |

## Sources

- IdleOn Wiki, opened 2026-10-18: [Alchemy](https://idleon.wiki/wiki/Alchemy) (2026-10-05), [Power Cauldron](https://idleon.wiki/wiki/Alchemy/Power_Cauldron), [Quicc Cauldron](https://idleon.wiki/wiki/Alchemy/Quicc_Cauldron), [High-IQ Cauldron](https://idleon.wiki/wiki/Alchemy/High-IQ_Cauldron), [Kazam Cauldron](https://idleon.wiki/wiki/Alchemy/Kazam_Cauldron) (2026-10-04), [Vials](https://idleon.wiki/wiki/Alchemy/Vials) (2026-09-29), [Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks) (2025-12-24), [Daily Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24), [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (2026-10-08), [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) (2026-09-27).
- Reddit r/idleon (tier 3): 1tv3615 (2026-06-02/03), 1tzseli (2026-06-08), 1jlis0c (2025-03-28), 1cuu3kj (2024-05-18), 1gpwc4t (2024-11-13), 1bxc1x3 (2024-04-06), linked in section 11.3. Steam guide 3368490152 by MegaMidboss (updated 2026-06-28).
- IdleOn AutoReview @ 05ac449 (2026-09-23): `consts/progression_tiers.py` L945–1094, `w2/alchemy_p2w.py` L121, `w2/alchemy_vials.py` L123. Cited only; nothing copied (no licence).
- Toolbox parsers and data @ `6c37e3d`: `world-2/alchemy.ts`, `utility/dashboard/account.js`, `website-data/cauldrons.json`, `vials.json`, `shared-data.json` (`liquidsShop`, `vialCosts`, `gameTables.bubbleCost`).
- Dossier: [`research/w2-systems`](https://github.com/YassSoliman/idleon-forge/blob/research/w2-systems/docs/research/systems/2026-10-17-w2-systems.md) (Alchemy Bubbles, Liquids, Vials, Pay 2 Win), [`research/priority-verification`](https://github.com/YassSoliman/idleon-forge/blob/research/priority-verification/docs/research/2026-10-17-priority-verification.md) rows 4.1–4.5.
- System Atlas (design lab, 2026-10-18, private): entries "Alchemy bubbles", "Liquids", "Vials", "Pay 2 Win". Design Lab v2 `systems.alchemy` and its critique.
