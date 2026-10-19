# M26 F-C Crafting guidance and Production Plans

Addendum to [`M26-systems-w1-w4.md`](M26-systems-w1-w4.md) for issue
[#159](https://github.com/YassSoliman/idleon-forge/issues/159) ("what to craft and when, and how to unlock it"). Part of
the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft for owner review, red-teamed once**
(2026-10-19: two reviewers, completeness and correctness; every finding and its resolution is logged in section 15). The
parent spec's rules apply unchanged (spec-before-build, the Two-Source rule, unlock guards, claimed-by, one schema bump
per wave release, stage fixtures). This file adds section **F-C**: the stories, FRs, data, ranking rule, views,
Knowledge Base entries, Detectors and waves it needs, and the parent-spec amendments it implies (section 16). Terms
follow [`GLOSSARY.md`](../../GLOSSARY.md) on `feat/M25-release` (Walkthrough, Requirement Tree, Demand, Supply,
Bottleneck, **Production Plan**, Gear Plan, Bubble Plan, Spend Plan, Parallel Slot Plan), with the glossary edits of
section 17.

**The request.** A tester on a World 4 account (issue #159, `stage: W4-entry`, a Shaman Lv 82 open) wrote that he spends
"too much time spiralling in the crafting anvil" and wants to know "what to craft and when to craft them and/or unlock
them". Advice such as "craft anvil tab 3" is opaque: it names a gate and never says what the gate needs. He also asked
what each character should make at any time, when to unlock a given bubble and when to boost it.

**Owner decisions this addendum rests on (2026-10-19):**
1. Every gate mention (an anvil tab, a recipe, a skill level, a quest) links to a **Walkthrough** tab on the page of the
   System that owns the gate; the Anvil page also gets a **Recipes** tab.
2. A **Production Plan** per character (glossary): what each producer should make now and why, ranked by the Bottleneck
   it shortens.
3. A **craft next** line from the Gear Plan.
4. Speed-ups (bubbles, cauldron Boosts, stamps, anvil points) appear as **steps** of the Production Plan.
5. The same pattern covers Forge, Refinery, Cooking, Alchemy brewing, Construction and cogs, Trapping, the 3D Printer,
   the Lab and Breeding.
6. This leads M26: the anvil part ships first, as Wave C (section 3).

**Patch and Sources.** Game 2.3.540, Toolbox pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1` (Toolbox 3.3.96). Game facts
cite the dossiers [`w1/anvil.md`](../research/systems/w1/anvil.md) (claims C1-C54) and
[`w1/smithing.md`](../research/systems/w1/smithing.md) (M1-M34, OQ1-OQ11) and Toolbox code at the pin, read on
2026-10-19. The current major patch is 2026-08-26 (`packages/knowledge/majors.yaml`); "post-patch" means a claimDate on
or after it. The parent's Two-Source rule (FR-2c) binds **orderings** (Priorities, Builds, Meta Path orders). A
Production Plan row is not an ordering when it follows from Demand and ADR 0005 arithmetic (a recipe needs N, the
account holds M, this producer makes R per hour). The one value-based **fallback** (the anvil's Smithing EXP, 7.4) is a
Check whose rule is tier-1 arithmetic; section 7.4 records why, and question C-Q6 lets the owner ship it display only.

**Fixture.** Every story runs on `packages/account-state/fixtures/public/first.json` (the only W4 public save:
`currentWorld` 4, W4-entry, 7 characters), on the parent's stage fixtures `stage-w1-early` and `stage-w3-mid`, or on a
mutation of one of them. `first.json`'s characters, in save order, are C1 Blood Berserker 96, C2 Bubonic Conjuror 87, C3
Siege Breaker 86, C4 Divine Knight 86, C5 Elemental Sorcerer 87, C6 Beast Master 87, C7 Maestro 73 (the golden's labels;
the Expected Return is the golden's 8 h). Values in stories were read on 2026-10-19 through the golden harness (`kb
golden` context: `parseSave` at the fixture's `now`, `toAccountState`, the golden modules) with a scratch probe that is
not committed. A `{x}` is asserted equal to the named field; a literal number is what that field holds on the fixture
today and is re-derived, never hand-typed, when the golden is recorded. Ratios print to one decimal, half up. No
character name appears anywhere.

**What `first.json` shows today (the evidence):**
- `account.anvilTabsOwned` = 3. Anvil Tab 4 (`EquipmentSmithingTabs4`) needs 1,000 Void Bar (0 held), 2,500 Frigid Soul
  (0), 10 Eternal Lord of The Undying Ember (0) and 400 Spontaneity Salts (4 held) (`crafts.json#Anvil_Tab_4`, dossier
  anvil C24). Nothing in the app says so: the gate appears only as the skills milestone label "Anvil Tab 4" at Smithing
  50 (`skills.facts.yaml`).
- Every character has 3 hammers (`AnvilPAselect_i` holds 3 entries each). No anvil product is in Demand (7.1): the
  account holds far more of each than anything it is working toward needs (for example 27,109 Chain Link, 32,269 Leather
  Hide and 19,592 Pinion Spur across storage and bags). 6 of 7 anvils would gain at least 10% Smithing EXP by switching
  (US-C6). C5's Chain Link is at its cap (1,202 of 1,195).
- The Gear Plan lights one slot on one character (C2's helmet: "Equip the Dementia Helmet from storage") and no craft:
  on a W4 account `buildGear` treats the stage as "beyond" (`packages/engine/src/gear/build.ts#L112`) and the Gear tab
  notes "The Gear Plan covers Worlds 1-3". Yet the slot views hold craftable targets: "Craft Iron Fishing Rod now (anvil
  tab 1)" on C3, C4 and C5, "Craft Golden Net now (anvil tab 2)" on C1, C2, C4 and C5, "Craft Gold Fishing Rod now
  (anvil tab 2)" on C2, "Craft The Ice Breaker now (anvil tab 3)" on C4 (it consumes the Enforced Slasher C4 wears; the
  gear views count worn copies, M18 FR-15).
- The Forge (Toolbox `account.forge`, not adapted) has 8 slots unlocked (New Forge Slot level 8), 2 smelting Dementia
  Ore (empty in about 1 h 22 min) and 6 empty, with 12,451 Dementia Ore and 2 Void Ore in storage.
- The Refinery has Spontaneity Salts unlocked at rank 2 and off. It burns Explosive Salts, which are also off (76 held;
  Toolbox `saltMaxSafeRank` for Spontaneity is 0). The live `refinery.check.salt-off` names Explosive Salts and nothing
  says that Anvil Tab 4 needs 396 more Spontaneity Salts, or that Explosive must run first.
- If Anvil Tab 4 became a Walkthrough today, all four leaves would come out **blocked** through the real engine
  (`expandTarget`, `suppliesOf`, `leafEffort`: no generated Supply for the critter or the salt, no hours for forge
  leaves in Phase 1, `supply.ts` header). `bottleneckOf` (`packages/engine/src/walkthrough/plan.ts#L91-L103`) drops
  blocked leaves and returns null, so the Walkthrough would name no Bottleneck and give no reason why.

## 1. Context

| Piece | Exists today (M14, M18, M19, M24) | F-C adds |
|---|---|---|
| Walkthrough, Requirement Tree, Demand, Supply, Bottleneck | `packages/engine/src/walkthrough/*`: trees from generated facts, Demand allocated by Goal rank, Supplies for drops, skill nodes, anvil, forge, shops, Liquid Shop, printer; Bottleneck = slowest rated leaf, unrated leaves sorted after rated ones | Walkthroughs for gate targets that are not shown Goals (an anvil tab) on the System page only; a Walkthrough tab any System page can host; hours for forge and Refinery leaves (Wave 2; anvil leaves are already rated, `plan.ts#L64-L66`); a Supply for critters and salts; one honest Bottleneck rule |
| Gate nodes | `Gate` = `anvil-tab`, `smithing`, `recipe`, `quest`, `world`, `free-slots`, `skill-efficiency` (`walkthrough/types.ts`), rendered as words ("anvil tab 3") | every gate is a structured span rendered as a link, through one registry that also covers producer gates (Refinery rank, building level, Lab node, bubble unlock, stamp cap, Breeding upgrade) |
| Gear Plan | M18: slot targets, ladders, the Smithy; one lit slot per character; lights no craft at W4 | **craft next** per character and items several characters want, at every stage |
| Bubble Plan | M19: the bubble to level, its target, "needs Water" | brewers as a producer; "when will bubble X unlock" from Toolbox's roll odds |
| Anvil | page: point split and "what each anvil makes" (M24); live Checks `caps-before-return`, `fill-time`, `spend-points`, `respec` | Production Plan, Recipes and Walkthrough tabs; `next-tab`, `hammers`, product switches |
| Parallel Slot Plan | M14: the 3D Printer sample plan (`printer.check.slot-plan`, Demand-driven, keeps every sample without Demand) | read into the Production Plan as the printer row |
| Production Plan | glossary only | engine module `production`, a section on each Character's Now tab, a `#production` page, a section on each producer's System page |

## 2. Goals and non-goals

**Goals**
- GC1. A gate never appears as bare text. **Test:** the gate-homes registry (FR-C1a) lists every gate a text template
  can emit; a render test over every public and stage fixture's Now, Gear, Systems, Walkthrough and Production Plan
  output fails when a registered gate's words appear outside a `gate` span.
- GC2. Every character with a producer shows what each producer should make now, why, and what would speed it up, on its
  Now tab and on the producer's System page. **Test:** US-C5 to US-C9.
- GC3. Every account producer shows the same on `#production` and on its System page, from its wave. **Test:** US-C12 to
  US-C18.
- GC4. Craft next exists at every stage, W4 included, and says so when nothing is left. **Test:** US-C10, US-C11.
- GC5. A Bottleneck is a time, "slowest known", or "can't tell yet", never a tie-break. **Test:** US-C2, US-C19.
- GC6. The tester's two bubble questions get an answer on the page he would open. **Test:** US-C16, US-C17.

**Non-goals**
- NC1. No gem-buy advice (parent N3). Infinity Hammer and Brimstone slots show as owned / not owned in a row's footer.
- NC2. No cauldron Boost order and no roll-vs-Boost switch point (parent FR-19, N4): `luck-odd` is the only Boost
  advice; other Boosts appear as display-only steps (FR-C8).
- NC3. No meal value order (parent FR-14), no salt rank order (FR-37), no ore or building value order.
- NC4. No automation and no write toward the game. "Switch" and "load" are instructions to the player.
- NC5. No W5+ producers. Anvil Tabs 5-7 recipes show greyed "later" (Tab 5 is the W5 gate, parent N1).

## 3. Scope, ownership and waves

The anvil and the gate links are what the tester hit, so they ship first, as **Wave C**, after the parent's Wave 0 items
it needs and before Wave 1 (owner decision 6). Every other producer joins the wave of its System's page (parent rule "a
hook lands with its home page"). Wave C is one release with one `SCHEMA_VERSION` bump (parent section 6).

| Wave | Piece | FRs | Needs first | Folders |
|---|---|---|---|---|
| 0 | gate-homes registry rows, route grammar for tabs and `#production` (no UI change) | FR-C1a, FR-C2 | parent FR-0b registry test | `packages/knowledge/systems/walkthrough.facts.yaml`, `apps/activeon/src/shell/route.ts` |
| **C.1** | adapter: `characters[].anvil.{hammers, stock, speedParts}`; the full recipe table; Anvil Recipes and Walkthrough tabs; `anvil.goal.next-tab` and `anvil.check.hammers` pulled forward from FR-57 | FR-C3, FR-C3a, FR-C4 | parent FR-1, FR-3, FR-10 (anvil, gear, walkthrough drafts converted); **V33**, V-C1, V-C9, V-C10, V-C11 | `packages/account-state/src/production*.ts`, `packages/engine/src/production/`, `apps/activeon/src/systems/pages/AnvilPage.tsx` |
| **C.2** | gate spans and the `GateLink` atom; the generic Walkthrough tab in `SystemFrame` | FR-C1, FR-C1b | C.1 | `packages/engine/src/now/`, `apps/activeon/src/design/atoms/GateLink.tsx`, `apps/activeon/src/systems/frame/` |
| **C.3** | Production Plan core (types, Demand sources, ranking, keep rule), the anvil producer and its speed-ups, the Character Now section, the Anvil Production Plan tab, `#production` | FR-C5 to FR-C9 | C.1 | `packages/engine/src/production/`, `apps/activeon/src/production/` |
| **C.4** | craft next, W4 included; a "craft next" badge on the Gear tab row | FR-C10 | C.3 | `packages/engine/src/gear/` |
| **C.5** | the printer row (read of M14's plan) | FR-C11 | C.3 | `packages/engine/src/production/printer.ts` |
| **C.6** | one Bottleneck rule (blocked, unrated, rated) | FR-C12 | C.3 | `packages/engine/src/walkthrough/plan.ts` |
| 1 | kitchens (with FR-14), Breeding territories (with FR-13), Lab speed-up steps attached to Wave C's printer row (with FR-12) | FR-C13, FR-C14, FR-C15 | Wave 1 adapters | `packages/engine/src/production/{kitchens,territories,lab}.ts` |
| 2 | Forge (with FR-25), Refinery and build slots (after FR-21b), brewers and the bubble-unlock estimate (with FR-19..22); forge and Refinery leaves rated; Lab steps on the Refinery row | FR-C16 to FR-C19 | Wave 2.0 salt slice, FR-25 forge adapter, FR-19 brew rates | `packages/engine/src/production/{forge,refinery,brewing,construction}.ts` |
| 5 | Cog Board flags (with FR-35), traps (with FR-38) | FR-C20, FR-C21 | Wave 5 adapters | `packages/engine/src/production/{cogs,traps}.ts` |

**Where account rows appear before their page's own wave.** A producer row shows on `#production` from its wave. It
shows on its System page only if that page exists then and is not rebuilt later (parent rule): the Refinery and
Construction pages exist today and are only extended in Wave 5, so their Production Plan section lands in Wave 2 above
their existing tabs; the Forge page is new in Wave 2 and gets its section with it.

**Size budget.** Wave C adds `characters[].anvil.hammers` (up to 3 numbers), `.stock` (11), `.speedParts` (9) per
character: about 1.5 KB on the largest public save, all kept in history (they are small and the Away card compares
them). `EngineResult.production` is about 3 KB on `first.json` (7 characters x 2-4 rows + account rows), inside M10's
200 KB `EngineResult` cap, measured in C.1. Parent section 6 gains the line "C: +2 KB".

## 4. User stories

Format as the parent: **[FR · Wave · Stage band · status]**, Given a CI fixture, Then the Check or view, how many, and
the exact text. "Now tab" is the Character page's Now tab (its Focus). A Check is unknown when its field is null, silent
while its System is locked (parent FR-6). Stories marked blocked record their golden after the V-item.

### Stage stories (asserted with every F-C wave)

- **US-C-S1 Early account.** [FR-C5, FR-C7 · C.3 · W1-early · blocked: V33] Given `stage-w1-early` (one character,
  `AnvilPAselect` a bare number, every W2+ key emptied), Then its Production Plan shows only an Anvil row and, when a
  Gear Plan target is closest to done, a Craft next row; no Forge, Refinery, kitchen, brewer, trap or territory row
  exists on any page; the bare-number select parses as one hammer (contract test).
- **US-C-S2 Late W3.** [FR-C13, FR-C14 · 1 · W3-mid · testable] Given `stage-w3-mid`, Then no kitchen or territory row
  exists (Cooking and Breeding locked), and the Anvil, craft-next and printer rows equal those of the same characters on
  `first.json` except where W4 items enter Demand.
- **US-C-S3 Null field.** [FR-C5 · C.3 · W4-entry · testable] Given `m:first-anvil-null` (C3's `AnvilPAselect_2`
  deleted), Then C3's Anvil row reads "Anvil: can't tell from this save" with no Check, and the other six rows are
  unchanged.

### Gate links (Wave C.2)

- **US-C1 A met tab is a place.** [FR-C1 · C.2 · W4-entry · testable] Given `first.json`, When I open Divine Knight Lv
  86's Gear tab, Then the weapon row reads "Craft The Ice Breaker now" followed by one gate chip "Anvil tab 3" whose
  link is `#system-anvil?tab=recipes&focus=EquipmentSword2` and whose accessible name is "Anvil tab 3: open The Ice
  Breaker's recipe". The words "(anvil tab 3)" no longer appear in that row, nor anywhere a `gear.yaml` value names a
  tab.
- **US-C2 An unmet tab opens its Walkthrough.** [FR-C1, FR-C4, FR-C12 · C.1/C.2/C.6 · W4-entry · blocked: V-C3] Given
  `first.json`, When I follow the "Anvil Tab 4" gate of the Skills milestone row or of `anvil.goal.next-tab`, Then
  `#system-anvil?tab=walkthrough&focus=EquipmentSmithingTabs4` opens the Anvil page's Walkthrough tab with the answer
  "Craft Anvil Tab 4: 0 of 4 materials ready" and the sub-line "slowest: can't tell yet (4 steps have no source or time
  estimate yet)". Steps, in tree order: "Get 1,000 more Void Bar (0 held)" with the sub-step "Get 99,998 more Void Ore
  (2 held) · Mining"; "Get 2,500 more Frigid Soul (0 held)"; "Get 10 more Eternal Lord of The Undying Ember (0 held)";
  "Get 396 more Spontaneity Salts (4 held)"; "Craft Anvil Tab 4 at the anvil" + gate chip "Anvil tab 3". No step is
  styled Bottleneck. Frigid Soul and the critter carry "where: check in game" until V-C3 and V-C2 trace their Supplies.

### Anvil Recipes and Walkthrough tabs (Wave C.1)

- **US-C3 Recipes by tab.** [FR-C3, FR-C3a · C.1 · W4-entry · blocked: V-C9, V-C11] Given `first.json`, When I open
  Anvil > Recipes, Then the tab strip reads "Tab 1 · Tab 2 · Tab 3 · Tab 4 locked · Tab 5 later" with Tab 3 open (the
  highest owned), and the Tab 3 header reads "8 crafted · 55 open · 9 locked", counted from `account.anvilRecipes[2]`
  (values 1, 0 and -1). The default filter "Wanted" lists the recipes some character wants (a Gear Plan target or
  craft-next piece), each with sprite, name, "#{n} on tab 3 · Smithing {lv}" from `anvil.fact.recipes`, its state chip,
  its materials as "{held} of {need}" pills and who wants it. The Tab 4 card reads "Craft Anvil Tab 4 once and every
  anvil gets it" with its four materials and "Smithing 50 (wiki)" (V-C6: `items.json` `lvReqToCraft` 15 is not the
  Smithing level, dossier smithing M11), and links to the Walkthrough tab. Tabs not owned read "locked" whatever their
  status values (the save holds rows for tabs 4-6 with 0s).
- **US-C4 Hammers.** [FR-C4 · C.1 · W4-entry · blocked: V33, V-C10] Given `m:first-two-hammers` (C2's `AnvilPAselect_1`
  shortened to 2 entries, Hammer Hammer still equipped), Then `anvil.check.hammers` fires once: "Pick a product for the
  free anvil hammer on your Bubonic Conjuror Lv 87" (draft `text-free`), detail "It has 2 of 3 hammers on a product; a
  free hammer makes nothing." Given `first.json`, Then silent on all seven, including Maestro Lv 73, who wears no big
  bubble: the companion bonus 4 is active on this save, so Hammer Hammer counts unequipped (Toolbox
  `getActiveBubbleBonus`, `alchemy.ts#L381-L385`) and the draft's `text-bubble` must not fire.

### The anvil Production Plan (Wave C.3)

- **US-C5 Nothing needs these products.** [FR-C5..C7 · C.3 · W4-entry · blocked: V-C1] Given `first.json`, When I open
  Divine Knight Lv 86's Now tab, Then its Production Plan section's first row reads "Anvil: switch to Trusty Nails,
  Boring Brick, Boring Brick" with the value chip "about 1.6x the Smithing EXP by your return" and the why "Nothing
  you're working toward needs Chain Link, Leather Hide or Pinion Spur (27,109, 32,269 and 19,592 held). Thread would
  fill this anvil (1,495) before you're back." The 1.6x is `sum U·exp(best) / sum U·exp(current)` of 7.2 over 8 h
  (29,053 / 18,464 base EXP on this save; one character's EXP multiplier cancels out of its own ratio; the stock of
  products without a hammer is 0 in raw `AnvilPA_3`, V-C1 confirms it stays so). Check
  `production-plan.check.anvil-switch`, one finding, claim `anvil:products@c3`.
- **US-C5b A full product leads.** [FR-C7 · C.3 · W4-entry · testable] Given `first.json`, Then Elemental Sorcerer Lv
  87's Anvil row reads "Anvil: collect Chain Link, it is full (1,202 of 1,195)", then its switch line, and the live
  `anvil.check.caps-before-return` finding for that character becomes the row's detail (claim `anvil:products@c4`). The
  Anvil page's answer frame leads with the same line; the Production Plan tab's answer (US-C6) does not change.
- **US-C6 Keep when the gain is small.** [FR-C6 · C.3 · W4-entry · blocked: V-C1] Given `first.json`, Then Maestro Lv
  73's Anvil row reads "Anvil: keep Thread, Trusty Nails, Boring Brick" in the done colour with no Check (best 31,747 vs
  current 30,897 base EXP: under 1.10x), and the Anvil Production Plan tab's answer reads "6 of 7 anvils should switch:
  about {x}x the Smithing EXP across the account by your return", {x} = the ratio of `sum U·exp·m_i` with `m_i` each
  character's `calcAnvilExp` multiplier (base EXP alone gives 298,914 / 170,557 = 1.8 on this save; the golden asserts
  the weighted value).
- **US-C6b Demand wins over EXP.** [FR-C5..C7 · C.3 · W1-mid · blocked: V33] Given `m:stage-w1-early-tab2`
  (`CYAnvilTabsOwned` 1, Chain Link held 40, the other Tab 2 materials held, the character at Smithing 17), Then
  `anvil.goal.next-tab` leads the account Goals and the Anvil row reads "Anvil: put 1 hammer on Chain Link for Anvil Tab
  2 (60 more, about {h} on 1 hammer)" with {h} = `60 / (anvilSpeed / requiredAmount(Chain Link))` hours rounded up to 15
  min; one hammer moves, because 60 Chain Link is covered by one hammer before the return, and the others keep their
  fallback assignment (7.3). Characters are filled in save order.
- **US-C7 Speed-ups as steps.** [FR-C8 · C.3 · W4-entry · testable] Given `first.json`, When I expand Divine Knight Lv
  86's Anvil row, Then its steps are: "1. Switch the three hammers as above"; "2. Anvil Zoomer Stamp is 25 of 25: raise
  its cap: each level adds about 0.3% anvil speed here" (the stamp adds inside `1 + (stamp + 2 x speedPoints)/100`,
  `anvil.ts#L22`: +1 over 329 with 102 speed points; computed with `getAnvilSpeed`) linking to the Stamps At-cap list;
  "3. Hammer Hammer is on: its extra hammer and speed count" (done; equipped, or the companion bonus 4 makes it count
  unequipped); "4. 1 anvil point unspent: put it in Speed" linking to the Points tab. Step 2 shows once on `#production`
  under "Anvils" and as a link "Anvil Zoomer Stamp: see the account plan" on the other six rows (claim
  `stamps:cap:StampB3`). Step 4 is the live `anvil.check.spend-points` finding (claim `anvil:points@c3`), not a second
  card.
- **US-C8 Unlock a missing speed-up bubble.** [FR-C8, FR-C19 · 2 · W2-mid · testable after FR-19] Given
  `m:first-no-hammer-hammer` (Hammer Hammer, Quicc bubble a2, not unlocked; Quicc at 1 unlocked bubble), Then the Anvil
  rows' speed-up step reads "Unlock Hammer Hammer in the Quicc cauldron: next to unlock, about {rolls} rolls ({brew}
  brew)" with {rolls} and {brew} from FR-C19's formula. Before Wave 2 the step reads "Hammer Hammer: not unlocked yet
  (Alchemy)" with a link and no estimate.

### Craft next (Wave C.4)

- **US-C9 Closest to done.** [FR-C10 · C.4 · W4-entry · testable] Given `first.json`, Then Divine Knight Lv 86's
  Production Plan has "Craft next: The Ice Breaker" + chip "Anvil tab 3", detail "every material held (it uses the
  Enforced Slasher you wear) · weapon 25 levels behind"; Blood Berserker Lv 96 has "Craft next: Golden Net" + chip
  "Anvil tab 2", detail "every material held · net 5 levels behind · with 3 others: see Craft 4 Golden Nets". The Gear
  tab marks the same slot with a "craft next" badge. The rows appear although the Gear Plan lights no craft on this save.
- **US-C10 Needed by several.** [FR-C10 · C.4 · W4-entry · testable] Given `first.json`, Then `#production` shows two
  `gear.goal.craft-shared` lines, most characters first: "Craft 4 Golden Nets (Anvil tab 2): Blood Berserker Lv 96,
  Bubonic Conjuror Lv 87, Divine Knight Lv 86 and Elemental Sorcerer Lv 87 need one each; you hold enough for 3 of 4
  (Butterfly: 10,109 of 12,550)" and "Craft 3 Iron Fishing Rods (Anvil tab 1): Siege Breaker Lv 86, Divine Knight Lv 86
  and Elemental Sorcerer Lv 87 need one each; you hold enough for all 3". A line exists for a target that 2 or more
  characters have as a slot target with every gate met and at least one copy fully held (Serrated Rex Ring, wanted by
  six, is left out: no Rex Ring is held). Sufficiency is tested on the pooled holdings, in the 7.1 order, counting the
  Reinforced Net that three of the Golden Nets need first (850 Butterfly each) and the Reinforced Net C1 wears (M18
  FR-15). Given `m:first-hermit-1000` (1,000 Hermit Can held), Then the second line ends "you hold enough for 1 of 3
  (Hermit Can: 1,000 of 1,950)".
- **US-C11 Nothing left.** [FR-C10 · C.4 · W4-entry · testable] Given `m:first-gear-done` (every C6 slot target removed
  by equipping its targets), Then Beast Master Lv 87's Craft next row reads "Craft next: nothing left on the Gear Plan
  (it covers Worlds 1-3)" in the done colour, with no Check.

### Printer, Lab and Bottleneck (Waves C.5, 1, C.6)

- **US-C12 Printer row.** [FR-C11 · C.5 · W4-entry · testable] Given `first.json` (no shown Walkthrough needs a
  printable item), Then Divine Knight Lv 86's Printer row reads "Printer: keep Dementia Ore in both slots" in the done
  colour, and no character has a printer Check. Given the M14 mutation that makes Megalodon Tooth a Demand item
  (`m:fourth-print-empty`, parent US-61), Then the row is `printer.check.slot-plan`'s rendered `swap` or `take-sample`
  text and claims `printer:slot@c{i}`: one card.
- **US-C13 A Lab step.** [FR-C15 · 1 · W4-entry · blocked: V-C8] Given `m:first-wired-off` (the Lab node for Wired In
  dark, C4 printing), Then the Printer row gains the step "Light Wired In in the Lab: printer output x2 ({lit} nodes lit
  now)" linking to the Lab Board tab; given `first.json` with the node lit, the step reads "Wired In is lit: printer
  output x2" (done).
- **US-C19 One Bottleneck rule.** [FR-C12 · C.6 · W2-mid · testable] Given `m:fourth-post-office` (the M14 Empty Box
  Walkthrough on `fourth.json`: Distilled Water rated by the Liquid Shop, Chain Link rated by the anvil, two other
  leaves unrated), Then the collapsed line reads "slowest known: {item} (2 steps have no source or time estimate)", that
  leaf is styled Bottleneck and starts first; with every leaf rated it reads "slowest: {item}"; with none rated,
  "slowest: can't tell yet ({n} steps have no source or time estimate)" (US-C2).

### Account producers (Waves 1, 2, 5)

- **US-C14 Forge.** [FR-C16 · 2 · W4-entry · testable after FR-25] Given `first.json`, Then the Forge row reads "Forge:
  Anvil Tab 4 needs 1,000 Void Bars and you hold 2 Void Ore: mine 100,000 Void Ore first" linking to the Anvil
  Walkthrough, and the parent's `forge.check.fill-empty-slots` keeps its own text for the 6 empty slots (no Demand
  covers Dementia Ore, so the Production Plan has nothing to add there; claim `forge:slots` stays with the parent
  Check). Given `m:first-void-ore` (150,000 Void Ore held), Then "Forge: load your Void Ore into 6 empty slots: Anvil
  Tab 4 needs 1,000 more Void Bars" with {slots} = `min(empty, ceil((held - room in slots already on that ore) /
  oreCapacity))`, and it claims `forge:slots`. Bar counts are "at least": Bar Bonanza's extra-bar chance (level 50 here)
  is not counted.
- **US-C15 Refinery.** [FR-C17 · 2 · W3-mid · testable after FR-21b] Given `first.json`, Then the Refinery row reads
  "Refinery: switch on Explosive Salts first, then Spontaneity Salts: Anvil Tab 4 needs 396 more (4 held)", because
  Spontaneity burns Explosive and Explosive is off; the live `refinery.check.salt-off` (which names Explosive) becomes
  its detail (one card, claim `refinery:salt-off`). Given `m:first-explosive-on` (Explosive active, its safe rank above
  Spontaneity's), Then "Refinery: switch on Spontaneity Salts: Anvil Tab 4 needs 396 more (4 held)". Given
  `m:first-tab4-owned`, Then `refinery.check.salt-off` keeps its own text (no Demand-backed salt, no fallback).
- **US-C16 When will a bubble unlock.** [FR-C19 · 2 · W2-mid · testable after FR-19] Given `first.json`, When I open
  Alchemy > Bubbles, Then the Quicc cauldron's next locked tile reads "Dollar Of Agility: next to unlock in Quicc ·
  about {rolls} rolls ({brew} brew, {hours} at your brew rate)" with {rolls} = `ceil(1 / p)`, p =
  `min(getBaseNewBubbleChance(unlocked) x multi / 100, 1)` (the chance of one roll, `multi` as Toolbox
  `applyNewBubbleChances`; the adapter's `expectedNewBubbles` is Toolbox `newBubble.expectedBubbles`, the bubbles the
  banked brew is expected to give, shown beside it), {brew} = `{rolls} x getMaxCauldron(unlocked)`, both Toolbox
  (`alchemy.ts`), {hours} = {brew} / the cauldron's brew per hour (parent FR-19). A Bubble Plan bubble two unlocks away
  sums both steps and reads "2nd to unlock".
- **US-C17 When to level a bubble.** [FR-C19 · 2 · W2-mid · testable] Given `m:first-water-brewer` (C2's
  `alchemy.activities` set to 4, Water; nobody brews a liquid on `first.json`), Then that character's Brewers row reads
  "Brewing: keep Water: Stable Jenius (Bubble Plan, 31 to 67) needs Water", the Bubble Plan's High-IQ row "needs Water"
  (golden `## Alchemy`) being its Demand, and the Bubbles page's answer stays the M19 pick "Roid Ragin 41 to 54": the
  level-now answer the tester asked for already exists and is linked from the row. Boost levels appear only as display
  steps ("Speed Boost {lv} of 170 · effect shown, no advice") or the `luck-odd` step.
- **US-C18 Kitchens, build slots, territories, flags, traps.** One story each, tagged with their wave:
  - [FR-C13 · 1 · W4-entry · testable] Given `m:first-kitchen-idle` (parent US-9), Then the kitchen row is the parent's
    "Kitchen 1 is idle: start {meal}" with the why "the fastest meal to its next level (meals are not ranked by value:
    no two Sources agree)", claim `cooking:kitchen@1`.
  - [FR-C18 · 2 · W3-mid · testable] Given `m:stage-w3-mid-saltlick` (parent US-49, Salt Lick level 0, its Goal shown),
    Then "Build slots: put the Salt Lick in a slot: its Goal needs level 1" and the live `construction.check.build-next`
    keeps its text as the detail (claim `construction:slots`).
  - [FR-C14 · 1 · W4-entry · blocked: V-C7] Given `m:first-spice-short`, Then "Breeding: forage {territory} for {spice}:
    kitchen {k}'s next speed level needs {n} more".
  - [FR-C20 · 5 · W3-mid · testable] Given `m:fourth-cog-free` (parent US-60), Then the Cog Board row reuses the
    parent's `flag-none` / `cog-fill-square` text (no new entry): flags have no Demand source in W1-W4.
  - [FR-C21 · 5 · W3-mid · blocked: V-C2] Given `m:first-traps-collected` (C1-C5's placed traps, Froge, Crabbo and
    Mousey on `first.json`, collected and removed), Then "Traps: place them for Eternal Lord of The Undying Ember: Anvil
    Tab 4 needs 10"; until V-C2, "Traps: Anvil Tab 4 needs 10 Eternal Lord of The Undying Ember (where to trap it: check
    in game)".

## 5. Functional requirements

### F-C1 Gate links (Wave 0 rows, Wave C.2 UI)

- **FR-C1a Gate homes.** A fact `walkthrough.fact.gate-homes` (authored, ActiveOn registry, no game fact) maps every
  gate a template can emit to the System and tab that explains it, with a fallback while that page does not exist:

  | Gate | Target | Fallback until the target ships | |---|---|---| | `anvil-tab`, unmet ("Craft Anvil Tab 4") | `anvil`
  > Walkthrough, focus `EquipmentSmithingTabs{n}` | none (Wave C) | | an anvil tab as a recipe's place ("on tab 3") |
  `anvil` > Recipes, focus the recipe rawName | none | | `smithing` (a level) | `anvil` > Recipes, focus the tab or
  recipe it gates | none | | `recipe` (Task Board unlock, Merit Shop, drop) | `task-board` > Walkthrough (Wave 2) |
  `anvil` > Recipes row naming the unlock | | `quest` | `quests` > Walkthrough (Wave 6) | the Goal's own Walkthrough
  sheet (M14) | | `skill-efficiency` | `skills` > Walkthrough (Wave 3) | the Character page's Skills tab | | `world` |
  `#map` | none | | `free-slots` | `storage` > Walkthrough (Wave 3) | the Character page's bag | | Refinery rank |
  `refinery` > Walkthrough (page exists; tab with FR-C17, Wave 2) | `refinery` page | | building level | `construction`
  > Walkthrough (Wave 2) | `construction` page | | Lab node | `lab` > Board, focus the node (Wave 1) | `lab` page | |
  bubble unlock or level | `alchemy` > Bubbles, focus the bubble | `alchemy` page | | stamp cap | `stamps` > At cap,
  focus the stamp | none (page exists) | | Breeding upgrade | `breeding` > Upgrades (Wave 1) | `breeding` page |

  A test fails when a template value names a gate kind with no row, or a row's target page and fallback are both missing
  from `pages.ts` (extends parent FR-0b). The GC1 render test reads this table.
- **FR-C1 Gate spans.** The engine's text layer emits a gate as `{ kind: 'gate', gate, label, href, focus, met }`
  instead of words, in Next Action text, Goal details, Walkthrough steps, Gear rows, the Systems text and the Production
  Plan. The UI renders it with one atom, `GateLink`: the gate's game sprite (`EquipmentSmithingTabs{n}` for a tab, the
  recipe's item, the skill icon), the label, a chevron; a real `<a>`; aria-label "{label}: open {what}". A met gate is a
  place (quiet chip); an unmet gate is a task (gold chip with "{ready} of {n} ready"). Plain-text renderers (goldens,
  copy) keep the words. `gear.yaml` values drop "(anvil tab {tab})" from the sentence and pass `tab` to the span.
- **FR-C1b A Walkthrough tab on any System page.** `SystemFrame` gains a generic Walkthrough tab, shown when the page's
  System owns a gate-homes row and at least one Walkthrough on screen (shown Goals) or in its own page scope (FR-C4)
  holds a gate of that System. It lists those Walkthroughs with the Requirement Tree, the Bottleneck line (FR-C12) and
  the focused node outlined. Pages built in later waves (`task-board`, `quests`, `skills`, `storage`) get the tab by
  being registered in gate-homes, with no FR of their own; their parent FRs (26, 56, 61, 66) are amended (section 16).
- **FR-C2 Routes.** `routeOfHash` accepts `#system-<id>?tab=<tabId>&focus=<key>` and `#production`. An unknown tab opens
  the first tab, an unknown focus is ignored; `focus` scrolls to the row, outlines it for 2 s and moves keyboard focus
  to it. `formatRoute` round-trips both (test). Back returns to the linking card. `SystemFrame` takes its tab from the
  route and writes tab changes back with `replace`.

### F-C2 Anvil Recipes and Walkthrough tabs (Wave C.1)

- **FR-C3 Recipes tab.** Per anvil tab 1-5: owned (`account.anvilTabsOwned`), its recipes in game order from FR-C3a,
  each recipe's state from `account.anvilRecipes[tab-1][n-1]` (`-1` locked, `0` open, `1` crafted; `2` per V-C9), its
  materials with pooled holdings (M14 `holdingsOf`), its Smithing level (`anvil.fact.recipes`, wiki), and who wants it
  (Gear Plan targets, craft next). Filters: "Wanted" (default), "Craftable now", "All". Tab and recipe Smithing gates
  are the wiki's levels, labelled "(wiki)": `items.json` `lvReqToCraft` is not the Smithing level (Copper Pickaxe 4 vs
  wiki 3, Platebody 55 vs wiki 7; dossier smithing M11, OQ1), so there is no game-data reading to set against them until
  V-C6 reads `ItemToCraftLV`. **Correctness fix (C.1):** M14's `expand.ts` uses `lvReqToCraft` as the Smithing gate
  (`smithingGate(ctx, data.recipe.lvReqToCraft)`); it switches to `anvil.fact.recipes` `lv`, unknown when missing. Tabs
  not owned read "locked" whatever their status values. Tabs past W4 greyed "later". The tab adds no advice (M17): its
  rows are reads.
- **FR-C3a The recipe table.** `crafts.json` holds every recipe but neither its tab nor its position on the tab (dossier
  smithing M11; its order matches the game only on tab 1, `anvil.facts.yaml` header). `anvil.fact.recipe-tabs` has 2
  rows and `gear.fact.recipes` 87 (Gear Plan pieces only). Wave C.1 adds `anvil.fact.recipes`: every W1-W4 recipe on
  tabs 1-4 with `tab`, `n` (its position, the index into `AnvilCraftStatus[tab-1]`), Smithing `lv` and unlock `from`,
  generated by `kb generate` from the idleon.wiki pages "Smithing/Anvil_Tab_1" to "_4" (tier 2, claimDate from each
  page's revision, post-patch checked) and merged with `gear.fact.recipes` (which it supersedes by id). A CI check
  asserts, on every public fixture, that each `n` indexes an existing entry of its tab's status array and that no two
  rows share a (tab, n). Until the table lands, the Recipes tab lists the `gear.fact.recipes` rows and shows the rest of
  each tab as counts only ("{n} other recipes: see in game").
- **FR-C4 Walkthrough tab and two Anvil entries.** The Anvil page hosts FR-C1b's tab and adds, in its page scope only,
  the next tab's Walkthrough built from `anvil.goal.next-tab`'s target even when that Goal is not among the shown Goals
  (M14 builds Walkthroughs for shown Goals; this exception never adds a Now card and never feeds Now's Demand). Answer:
  "Craft Anvil Tab {n}: {ready} of {m} materials ready" and the Bottleneck line. Entries pulled forward from FR-57:
  `anvil.goal.next-tab` (draft: account, compounding; values `ready`, `gather`, `level`; `doneWhen`
  `account.anvilTabsOwned` higher) and `anvil.check.hammers` (draft; reads the length of the raw `AnvilPAselect_i` list,
  never a recomputed count, dossier smithing M28; fires on a free hammer, or on Hammer Hammer owned, unequipped and not
  counted by the companion bonus 4, `isCompanionBonusActive(account, 4)`). The duplicate draft
  `anvil.check.empty-hammer` is retired into it. Both keep the drafts' Sources (re-tiered at conversion, parent FR-2)
  and confidence M.

### F-C3 The Production Plan (Wave C.3)

- **FR-C5 Producers.** A producer turns time into items: a character's anvil (its hammers), the Forge (unlocked slots),
  the Refinery (unlocked salts), a kitchen, a brewer, the build slots, the Cog Board flags, a character's traps, a
  character's 3D Printer slots, a Breeding territory team. Each producer module implements one interface
  (`packages/engine/src/production/types.ts`):
  ```
  interface Producer {
    id; system; scope: 'character' | 'account';
    slots(state): Slot[];                        // one per hammer, forge slot, salt, kitchen, trap ...
    current(state, slot): OptionId | null;       // what the slot makes now
    options(state, slot): Option[];              // what it could make now, gates met only
    rate(state, slot, option): number | null;    // items per hour, Toolbox numbers (ADR 0005); null = unrated
    room(state, slot, option): number | null;    // how much fits before a cap (shared by slots on one item)
    speedUps(state, slot, option): SpeedUp[];    // FR-C8, a closed list per producer
    fallback: EntryId | null;                    // 7.4
  }
  ```
  The module runs after Gear (M18), Walkthrough (M14), Alchemy (M19) and Spend, and writes `EngineResult.production: {
  rows: ProductionRow[]; demand: DemandLine[] }`. A producer whose System is locked yields no rows; one whose state
  field is null yields one "can't tell from this save" row and no Check (US-C-S3).
- **FR-C6 Ranking.** Section 7 is normative.
- **FR-C7 The anvil producer.** Slots = the raw `AnvilPAselect_i` entries, read by the adapter in save order (Toolbox
  `getPlayerAnvil` sorts `anvilSelected` in place, `anvil.ts#L191-L193`, so its output order is not slot order; parent
  V33). Options = products 0-10 with `levelReq <= smithingLevel` (`anvilProducts`, dossier anvil C1). Rate per hammer =
  `anvilSpeed / requiredAmount` items per hour (Toolbox `getPlayerAnvil` `stats.anvilSpeed`, C4). Room per product =
  `anvilCapacity - stock[p]`, shared by every hammer on that product (C29). Fallback `production-plan.fact.anvil-exp`
  (7.4). The comparison is on the product **multiset** of the anvil, never on slot positions. Text keys: `switch`,
  `keep`, `demand`, `capped-now` (a full product leads: "Anvil: collect {product}, it is full ({amount} of
  {capacity})"), `unknown`. This supersedes the draft `anvil.check.product-exp` ("switch to Thread" per hammer, no cap:
  on `first.json` it would send the Divine Knight's three hammers to a Thread stock that fills in about 2 h).
- **FR-C8 Speed-ups as steps.** For a row's chosen option, up to three steps from the producer's closed lever list:
  lever, now -> next, effect on this slot (Toolbox counterfactual where a function exists, else "effect: data {x}%"),
  cost and whether affordable, "done" when at its best. Order: affordable now, then hours saved on the row's Demand
  source's Bottleneck, then lever id. A lever that acts on the whole account (a stamp, a statue, a vault upgrade) is
  shown once, on its `#production` producer group, and as a link on the character rows, with a claim key
  `{system}:{kind}:{id}`; a lever that already has a live Check (anvil points) becomes that Check's row step and claims
  it. **Display-only steps** carry "effect shown, no advice" and no Check (cauldron Boosts other than `luck-odd`, NC2).
  Never a step: gem buys (NC1, footer "owned" / "not owned").

  | Producer | Levers (field; Source) | |---|---| | Anvil | anvil points (`afk.anvilPlan`, the live split, reused as is;
  C15); Anvil Zoomer stamp `StampB3` (+1 to the stamp term per level, effect computed with `getAnvilSpeed`;
  `stamps.json`, C16); Hammer Hammer on (equipped, or counted through the companion bonus 4) or not yet unlocked
  (`characters[].bigBubbles`, `alchemy.bubbles.quicc[2]`, companions; `cauldrons.json#HAMMER_HAMMER`, C11); Blacksmith
  Box speed (`postOffice`; C18); Anvil Statue (`statues[11]`; C17); Production Revolution, vault 24, from its unlock
  level (C19). Footer: Infinity Hammer owned / not (`gemShopPurchases[103]`, C12) | | Printer (C.5) | Wired In Lab node
  (FR-C15); Printer sample-size levers stay on the Printer page (parent FR-36) | | Kitchens (1) | kitchen speed and fire
  levels with their spice cost (parent FR-14 fields); Lab and meal links | | Territories (1) | none in W1-W4 beyond the
  team (parent FR-13 lists forage speed as display) | | Forge (2) | Forge Speed upgrade level/max (no cost, parent
  FR-25); speed barrels held. Footer: Brimstone owned / not | | Refinery (2) | Refinery Throttle effective level (parent
  FR-37, `classes/cast-ready`); Lab Refinery-cycle node (FR-C15) | | Build slots (2) | build rate sources as display
  (parent FR-27 `slotSources`) | | Brewers (2) | `luck-odd` (advice); Speed, Cost, 2x Extra Boosts (display only); vial
  and bubble rate terms (parent FR-19, FR-22) | | Flags, traps (5) | none beyond the parent FR-35 / FR-38 Checks |
- **FR-C9 Views.** Section 8.

### F-C4 Craft next (Wave C.4)

- **FR-C10 Craft next.** Candidates per character: each Gear Plan slot target (lit or not, any stage) whose recipe is
  craftable: its tab owned, its recipe state `0` or `1`, Smithing met (best on the account, V-C6). Pick: fewest missing
  materials as a share of the recipe (`sum(missing) / sum(need)` over its own recipe, after pooled holdings in the 7.1
  order, the slot's own worn item counted as held for its own upgrade, M18 FR-15), ties to the most `levelsBehind` (the
  Gear Plan slot field), then slot order. Rendered `gear.check.craft-next` (character, nice): "Craft next: {item}" +
  gate chip, detail "every material held" or "{missing} {item} short". A target that 2 or more characters have as a slot
  target, with every gate met and at least one copy fully held, also gets one `gear.goal.craft-shared` line on
  `#production` (account, compounding), sufficiency tested on the pooled holdings for all of them, ordered by characters
  waiting, then item; the character rows then add "with {n} others: see Craft {k} {item}". No candidate: "Craft next:
  nothing left on the Gear Plan (it covers Worlds 1-3)", done colour, no Check (question C-Q3). Claims
  `gear:craft@c{i}`, so M18's lit line and craft next never both show; the Gear tab marks the slot "craft next".

### F-C5 Printer and Bottleneck (Waves C.5, C.6)

- **FR-C11 Printer row.** Reads M14's `PrinterSlotPlan` as is, from M14's own Demand (shown Walkthroughs): a change is
  the plan's `swap` / `take-sample` text and claims `printer:slot@c{i}`; no change is "Printer: keep {item} in both
  slots" (or "in its slot"), no Check. F-C's wider Demand (7.1 (2)-(4)) does not feed the printer in Wave C (question
  C-Q8).
- **FR-C12 One Bottleneck rule.** A leaf is **blocked** when it has no Supply at all (today `bottleneckOf` drops these
  and may return null with no word to the player), **unrated** when it has a Supply without hours, **rated** otherwise;
  blocked and unrated both count in "{n} steps have no source or time estimate". For a Walkthrough's missing leaves: all
  rated -> "slowest: {item}", that leaf is the Bottleneck and starts first (unchanged); some rated, some not -> "slowest
  known: {item} ({n} steps have no source or time estimate)", the rated maximum is styled Bottleneck and starts first;
  none rated -> "slowest: can't tell yet ({n} steps have no source or time estimate)", no leaf styled. The rawName
  tie-break stays only for step order. Anvil leaves are already rated (`plan.ts#L64-L66`); forge bars (FR-C16) and salts
  (FR-C17) become rated in Wave 2; critters gain a Supply with FR-C21.

### F-C6 Other producers (their waves)

- **FR-C13 Kitchens** (Wave 1, with FR-14). Slots = kitchens; options = discovered meals below `mealMaxLevel`; rate =
  Toolbox `mealSpeed` / `cookReq` meals per hour; Demand = a meal a Cooking Goal names. No fallback: the row is the
  parent's time rule ("fastest to its next level", `cooking.check.idle-kitchen`) and says meals are not ranked by value.
- **FR-C14 Territories** (Wave 1, with FR-13). Slots = territories with a team; option = the territory's spice; Demand =
  the spice the next kitchen upgrade a Cooking Goal names needs (V-C7, parent V6); rate = Toolbox `forageSpeed`.
- **FR-C15 The Lab as a speed-up source** (Wave 1, steps attached in their host row's wave). The Lab makes no item; its
  bonuses are steps of the rows they multiply, read with Toolbox `getLabBonus(labBonuses, index)`: Wired In on the
  Printer row (Wave 1, the row exists from C.5), the Refinery-cycle node on the Refinery row (Wave 2), the vial and
  stamp nodes on Alchemy and Stamps (parent FR-12 chips). Indices pinned by contract test (V-C8).
- **FR-C16 Forge** (Wave 2, with FR-25). Slots = unlocked slots (New Forge Slot level, never Toolbox's 16). Options =
  ores held. Rate = bars per hour per slot from Toolbox's `list[].speed` and `ore.timeTillEmpty` (its helpers
  `getSpeed`, `getTimeTillEmpty` are module-private, `forge.ts#L205,#L219`) and the ore's `Cooldown` and `Amount`
  (dossier smithing M21, M23; V-C5); bar counts are lower bounds (Bar Bonanza not counted); room = `oreCapacity.value`.
  Demand = bars. When a bar is in Demand and its ore is not held, the row names the ore to get and links to the
  Walkthrough (US-C14). Claims `forge:slots` only when it proposes a load. No fallback.
- **FR-C17 Refinery** (Wave 2, after FR-21b). Slots = unlocked salts; options = on, off; rate = Toolbox
  `getRefineryCycles` / `getPowerPerCycle` (V-C4); Demand = salts in any 7.1 tree, building payments
  (`construction.check.bar-full-unpaid`) and Salt Lick Goals. It proposes "switch on" only when the salt's fuel salt is
  active and Toolbox `saltMaxSafeRank` is at least the salt's rank (the parent's `salt-deficit` covers active salts
  only); otherwise it leads with "switch on {fuel} first" (US-C15). Claims `refinery:salt-off`. No rank order, no
  fallback.
- **FR-C18 Build slots** (Wave 2). Slots = the open build slots (`construction.buildSlots`; 2 + gem row 117 + half the
  merit, 4 on `first.json`); options = buildings below max; Demand = building levels a shown Goal names; rate =
  `totalBuildRate`. Claims `construction:slots` with the live `build-next`.
- **FR-C19 Brewers and bubble unlocks** (Wave 2, with FR-19..22). Slots = each brewer (`alchemy.activities[i].activity`:
  0-3 cauldrons, 4-7 liquids). Options = the 4 cauldrons and unlocked liquids. Demand = the liquid shortfall of the
  Bubble Plan's first lit row and first unaffordable row per cauldron and of the vial pick; a cauldron is Demand-backed
  when the Bubble Plan's pick there is not unlocked yet. Rate = brew or liquid per hour (parent FR-19, FR-22). Unlock
  estimate: the k-th next bubble of a cauldron needs `sum over j<k of ceil(1/p_j)` rolls, `p_j =
  min(getBaseNewBubbleChance(u+j) x multi / 100, 1)`, each roll costing `getMaxCauldron(u+j)` brew, `multi` as Toolbox's
  `applyNewBubbleChances` (luck, P2W New Bubble, Bubble Breakthrough, Ivory). Text keys `keep`, `move`, `unlock-eta`
  (US-C16, US-C17).
- **FR-C20 Cog Board flags** (Wave 5, with FR-35). Reuses the parent's `flag-none`, `flag-done`, `cog-fill-square`; no
  W1-W4 Demand source names a flag square, so F-C adds only the row placement.
- **FR-C21 Traps** (Wave 5, with FR-38). Slots = a character's trap slots; options = critters on the trap's map with
  `getTrapsBonuses` timers; Demand = critters in any 7.1 tree. Needs a trapping Supply in the generated Acquisitions
  (`SupplyKind` gains `trap`); blocked on V-C2.

## 6. Data each producer needs

Toolbox paths are vendored parser output at the pin; "adapter" is Account State on `feat/M25-release` (`SCHEMA_VERSION`
25). New fields follow parent section 6.

| Producer | Toolbox fields (pin `6c37e3d`) | In the adapter today | Added by | Wave |
|---|---|---|---|---|
| Anvil hammers | raw `AnvilPAselect_i` (a list, or a bare number on single-slot saves); Toolbox `characters[i].anvil.anvilSelected` is the same list, sorted in place by `getPlayerAnvil` | only products in use, via `characters[].afk.anvil[] {item, name, hammers, amount, capacity, capAt, fromEmptyMs}` | **new** `characters[].anvil.hammers: number[]` (save order) | C |
| Anvil stock | `characters[i].anvil.anvilProduction[p] = [currentAmount, currentXP, currentProgress, totalProduced]` (`anvil.ts#getAnvil`, C28) | products in use only (`afk.anvil[].amount`) | **new** `characters[].anvil.stock: number[11]` | C |
| Anvil speed, capacity | `getPlayerAnvil(...).stats.{anvilSpeed, anvilCapacity}` | `characters[].anvilSpeed`; `afk.anvil[].capacity` | none | C |
| Anvil products | `shared-data.json#anvilProducts[p].{requiredAmount, exp, levelReq}` (C1) | `afk.anvilPlan.products[].required` (in use only) | generated `anvil.fact.products` (draft) | C |
| Smithing level | `characters[i].skillsInfo.smithing.level` | `characters[].smithingLevel` | none | C |
| Point plan | `anvilStats` (C28) | `characters[].afk.anvilPlan`, `characters[].unspent` | none | C |
| Tabs, recipes | raw `CYAnvilTabsOwned`, `AnvilCraftStatus[tab][i]` | `account.anvilTabsOwned`, `account.anvilRecipes` | `anvil.fact.recipes` (FR-C3a) | C |
| Anvil levers | `stamps` (`StampB3`), `alchemy.bubbles.quicc[2]`, `characters[i].equippedBubbles`, `postOffice` Blacksmith_Box, `statues[11]`, `upgradeVault.upgrades[24]`, `gemShopPurchases[103]` | `account.stampLevels`, `characters[].bigBubbles`, `account.gemPurchases`; post office, statues and vault in part | **new** `characters[].anvil.speedParts {stamp, speedPoints, box, statue, vault, hammerHammer, agility, starSign, brokenTime}` from `getPlayerAnvil`'s terms (`anvil.ts#L185-L187`), which reproduce `anvilSpeed` | C |
| Gear targets, holdings | engine M18; `storageItems`, `inventoryItems`, `forgeOutput` | yes | none | C |
| Printer | `account.printer` | `PrinterState` + M14 plan | none | C |
| Kitchens, meals | `account.cooking.kitchens[].{status, meal, mealSpeed, speedLv, fireLv, luckLv}`, `meals[].{level, amount, levelCost}`, `spices` | `CookingState` (`world4.ts`) | parent FR-14 (costs, `recipeSpices`) | 1 |
| Territories | `account.breeding.territories[].{team, forageSpeed, currentProgress, reqProgress}` | `index, name, battle, enemyHp, status` | parent FR-13 | 1 |
| Lab bonuses | `account.lab.labBonuses`, `getLabBonus` | `lab.characters`, `lineWidth` | parent FR-12 (`lab.bonuses[].value`) | 1 |
| Forge | `account.forge.list[].{ore.{rawName, quantity, timeTillEmpty}, bar.{rawName, quantity}, barrel, speed, isBrimestone}`, `upgrades[].level`, `oreCapacity.value` (`forge.ts#L99-L163`) | `account.forgeOutput` only | parent FR-25 (`account.forge`) | 2 |
| Refinery | `account.refinery.salts[].{rawName, rank, refined, active, powerCap, autoRefinePercentage, cost[]}`; `getRefineryCycles`, `getPowerPerCycle` (`refinery.ts#L42-L205`) | `account.refinery.salts` | parent FR-21b (`account.salts`), FR-37 | 2 |
| Build slots | `account.construction` | `ConstructionState` | parent FR-27 | 2 |
| Brewers | `account.alchemy.cauldrons` (`applyNewBubbleChances`, `applyBrewSpeeds`), `liquidCauldrons`, `alchemy.activities`; `getBaseNewBubbleChance`, `getMaxCauldron` (`alchemy.ts#L603-L640`; `newBubble.expectedBubbles` `#L674`) | `account.alchemy.cauldrons[] {id, expectedNewBubbles, unlockedBubbles, nextBubble}`, `account.liquids`, `characters[].slots` | parent FR-19, FR-22 (brew, rates, boosts) | 2 |
| Cog flags | `getFlags` (`construction.ts`) | `cogBoard.squares` | parent FR-35 | 5 |
| Traps | `account.traps[i]` (`index.ts#L183`), `getTrapsBonuses` (`traps.ts`) | `afk.traps.placed[{critter, endsAt}]` | parent FR-38 | 5 |

## 7. The ranking rule

Deterministic, `now` frozen, Expected Return `E` (the player's, M3).

**7.1 Demand.** One ordered list of Demand sources: (1) the shown Walkthroughs in Now rank (M14, unchanged); (2) the
next anvil tab's tree (`anvil.goal.next-tab`), when that Goal is not already among them; (3) each character's craft-next
target (FR-C10), in Visit Order; (4) Bubble Plan shortfalls (FR-C19). The order follows M14's existing rule (Goal rank
first) and puts the non-Goal sources after it from the account outward (a tab every anvil gets, then one character's
piece, then a bubble level); it is a design choice, not a game fact, recorded here and in question C-Q9. One
`HoldingsPool` serves all four in that order, so nothing is counted twice. Only craft-next targets (one per character)
enter Demand, never every Gear Plan target (on `first.json` the full Gear Plan would ask for 150,000 Wispy Lumber).
`D(x)` = still missing of item `x`; `src(x)` = the first source that misses it.

**7.2 Score of an option.** For slot `s`, option `x`, rate `r` per hour, room `R`: useful output by the return `U(s, x)
= min(r x E, R)`; several slots on one item share `R`. A Demand-backed option (`D(x) > 0`) is compared on, in order:
1. `src(x)`'s rank (higher source first);
2. whether `x` lies on the Bottleneck branch of `src(x)`'s Walkthrough (the Bottleneck leaf or its subtree): yes first;
3. hours saved on that Bottleneck, `t(x) - t'(x)` (`t` at today's Supply, `t'` with this slot added); unrated = 0;
4. `D(x) / U(s, x)`, larger first;
5. item index, then slot index.

**7.3 Assigning several slots.** First, Demand: slots are filled in save order with their best Demand-backed option,
each assignment subtracting its `U` from `D(x)` (US-C6b: 60 Chain Link takes one hammer). Then the fallback, if the
producer has one, over the remaining slots, with room reduced by the Demand slots' output. The result is a multiset.

**7.4 Fallbacks.**

| Producer | Fallback | Why it is allowed |
|---|---|---|
| Anvil | Smithing EXP: maximise `sum U x exp` over the remaining hammers, cap-aware, by brute force over the product multisets (at most 286 for 3 hammers over 11 products) | The anvil makes only two things, products and Smithing EXP (dossier anvil, "What it is"); with no product in Demand, EXP is the remaining output, and which product pays the most EXP per hour by the return is tier-1 arithmetic (`anvilProducts` exp and requiredAmount, C1, C30; Toolbox speed and capacity). Corroborated by idleon.wiki Beginner Guide ("start producing Thread", revision 2026-09-14, post-patch, tier 2; dossier C36 notes the wording may predate the patch). It is a Check, not an ordering, so FR-2c's two-Source rule does not apply; question C-Q6 lets the owner ship it display only instead |
| Every other producer | none | no two dated post-patch Sources rank their outputs by value (parent N4, FR-14, FR-25, FR-37) |
| Printer | M14's own rule | M14 |

**7.5 Keep.** A producer keeps its current multiset (done colour, no Check) unless the best is Demand-backed and the
current is not, or both are fallback and the best's `sum U x exp` is at least 1.10x the current's (question C-Q1).

**7.6 Never.** An option whose gate is unmet; a slot of a locked System; a slot whose state is null; a gem buy; a Boost
order.

**7.7 Interaction with the point plan.** The product choice uses today's anvil points. The points step reuses the live
`afk.anvilPlan` split as is (it scores materials, not EXP) and never re-scores it against the product choice; the two
can disagree only on the Exp-points share, which the live plan never moves.

**7.8 Cost.** At most 7 characters x 286 multisets per parse, in the worker; every number is Toolbox output or
arithmetic on it.

## 8. Views

The parent's section 9 rules apply (answer first, pictures before sentences, next three, colour meanings, class and
level never names). Game sprites via `<GameIcon>` (ADR 0009 as amended 2026-10-19) with the LavaFlame2 notice.

- **Gate link** (`GateLink` atom). Board `m26/GateLink.dc.html`: Gear row, Goal card and Walkthrough step, before and
  after, Daylight and dark, desktop and phone 390. On a phone the chip drops under its sentence and pads to 44 px.
- **Anvil page tabs:** Production Plan (replaces "What each anvil makes"), Points (the M24 split), Recipes (FR-C3),
  Walkthrough (FR-C4). Page answer frame, in order: a free hammer, a full product (US-C5b), the shared craft line with
  the most characters, the next tab. Board `m26/AnvilRecipes.dc.html`: Recipes (Daylight) and Walkthrough (dark) at
  1440, both at 390.
- **Character Now tab, Production Plan section**, under the Goals: one row per producer the character owns, ordered
  Demand-backed rows (7.2 order), then fallback switches, then keeps; the first three open, the rest behind "All
  producers". A row: sprite, "what", why, value chip, expandable steps; a keep is one quiet line. Board
  `m26/ProductionPlan.dc.html` (desktop, phone 390 Daylight and dark).
- **`#production` page** (account page like `#spend`, reached from Now's account section and the Systems hub's ActiveOn
  tiles): account producers (Anvils summary with its shared levers, craft-shared lines, Forge, Refinery, kitchens, build
  slots, territories as their waves land), then every character's rows in Visit Order. Registry: `production` as a
  `kind: activeon` System with a `SYSTEM_HOMES` entry. The ProductionPlan board's right column is its first screen; its
  own full board is drawn before C.3's build PR.
- **Producer System pages:** a "Production Plan" section directly under the answer frame, listing that producer's rows
  for every character or slot, before the page's existing tabs (Forge, Refinery, Construction, Cooking, Breeding,
  Alchemy, Printer, Trapping pages, each in its wave). Boards drawn with each wave's pages (parent section 9).
- **Gear tab:** the craft-next slot carries a "craft next" badge.

## 9. Knowledge Base entries

All `status: draft` until Wave C's red team; promoted in the PR that ships their Detector. New file
`packages/knowledge/systems/production-plan.yaml` and a `systems.yaml` row `production` (kind activeon); anvil and gear
ids stay in `anvil.yaml` and `gear.yaml`. Wiki claimDates are each page's revision date, checked post-patch at
conversion (parent FR-2).

| Id | Type, subject, category, effort, confidence | Detector | Text (main) | Sources |
|---|---|---|---|---|
| `production-plan.check.anvil-switch` | check, character, nice, 30 s, M | `production/anvil` | "Anvil: switch to {products}"; values `keep`, `capped-now`, `unknown`, `why-idle`, `why-cap` | Toolbox `anvil.ts` (tier 1); `shared-data.json#anvilProducts` (tier 1); idleon.wiki Beginner Guide (tier 2, claimDate 2026-09-14) |
| `production-plan.check.anvil-demand` | check, character, compounding, 30 s, H | `production/anvil` | "Anvil: put {n} hammer(s) on {product} for {target} ({missing} more, about {hours} on {n} hammer(s))" | Toolbox `anvil.ts#getTimeTillCap`, `crafts.json` (tier 1) |
| `production-plan.fact.anvil-exp` | fact (generated) | none | EXP per 1,000 work: Thread 60, Trusty Nails 50, Boring Brick 46, Chain Link 36, Leather Hide 29, Pinion Spur 25, Lugi Bracket 22, Purple Screw 19, Thingymabob 15, Tangled Cords 13, PVC Pipe 12 | `shared-data.json#anvilProducts` (tier 1, C30) |
| `production-plan.info.speed-ups` | info, values per lever, M | the producers' Detectors | "Raise {lever} to {next} ({effect}, {cost})", "Equip {bubble}", "Unlock {bubble} in the {cauldron} cauldron: {eta}", "{lever} {lvl} of {max}: raise its cap", "{lever} {lvl} of {max} · effect shown, no advice" | per lever: `stamps.json#StampB3`, `cauldrons.json#HAMMER_HAMMER`, `shared-data.json#postOffice`, `#statues`, `#upgradeVault` (tier 1; C11, C16-C19) |
| `anvil.goal.next-tab` | goal, account, compounding, 120 s, M | `anvil/next-tab` | draft values | draft Sources, re-tiered at conversion (`crafts.json` tier 1; idleon.wiki Smithing tier 2, revision 2026-10-05) |
| `anvil.check.hammers` | check, character, spendable, 30 s, M | `anvil/hammers` | draft values | draft Sources |
| `anvil.fact.recipes` | fact (generated from the wiki) | none | tab, n, lv, from per recipe | idleon.wiki Smithing/Anvil_Tab_1..4 (tier 2, revision dates) |
| `gear.check.craft-next` | check, character, nice, 60 s, H | `gear/craft-next` | "Craft next: {item}" + gate; values `held`, `short`, `shared`, `none` | `crafts.json` (tier 1); `anvil.fact.recipes` |
| `gear.goal.craft-shared` | goal, account, compounding, 120 s, H | `gear/craft-shared` | "Craft {n} {item} ({gate}): {who} need one each; {enough}" | as above |
| `walkthrough.fact.gate-homes` | fact (authored) | none | the FR-C1a table | ActiveOn registry (no game fact) |
| `production-plan.check.forge-load` | check, account, spendable, 60 s, H (Wave 2) | `production/forge` | "Forge: load your {ore} into {slots} empty slots: {target} needs {missing} more {bar}"; value `mine-first` | Toolbox `forge.ts` (tier 1; smithing M19-M23) |
| `production-plan.check.refinery-switch` | check, account, compounding, 30 s, H (Wave 2) | `production/refinery` | "Refinery: switch on {salt}: {target} needs {missing} more ({held} held)" | Toolbox `refinery.ts` (tier 1) |
| `production-plan.check.build-slot` | check, account, compounding, 30 s, H (Wave 2) | `production/build-slots` | "Build slots: put the {building} in a slot: {target} needs level {lv}" | Toolbox `construction.ts` (tier 1) |
| `production-plan.check.brewer` | check, character, compounding, 30 s, M (Wave 2) | `production/brewing` | values `keep` "Brewing: keep {liquid}: {bubble} (Bubble Plan, {from} to {to}) needs {liquid}", `move` "Brewing: move to {liquid}: ..." , `unlock-eta` | Toolbox `alchemy.ts` (tier 1) |
| `production-plan.check.kitchen` | claims `cooking.check.idle-kitchen` (Wave 1) | `production/kitchens` | the parent's text; value `why-time` | parent |
| `production-plan.check.territory` | check, account, compounding, 30 s, M (Wave 1) | `production/territories` | "Breeding: forage {territory} for {spice}: {target} needs {n} more" | Toolbox `breeding.ts` (tier 1) |
| `production-plan.check.traps` | check, character, spendable, 60 s, M (Wave 5) | `production/traps` | "Traps: place them for {critter}: {target} needs {n}" | Toolbox `traps.ts` (tier 1) |

Merges and edits (golden diff each): `production-plan.check.anvil-switch` absorbs the draft `anvil.check.product-exp`
(retired with a pointer, parent FR-10). Live entries gain claim keys: `anvil.check.caps-before-return`
(`anvil:products@c{i}`), `anvil.check.spend-points` (`anvil:points@c{i}`), `refinery.check.salt-off`
(`refinery:salt-off`), `construction.check.build-next` (`construction:slots`), `printer.check.slot-plan`
(`printer:slot@c{i}`); draft `forge.check.fill-empty-slots` (`forge:slots`) and `cooking.check.idle-kitchen`
(`cooking:kitchen@{k}`). Cog Board flags reuse the parent's entries (no new id).

## 10. Detectors

M11 contract: Account State and frozen `now` only, unknown on a null field, silent while locked, `claims` declared.

| Detector | Reads | Fires | Claims |
|---|---|---|---|
| `production/anvil` | `characters[].anvil.{hammers, stock, speedParts}`, `anvilSpeed`, `smithingLevel`, `afk.anvil`, the module's Demand | a multiset that beats keep (7.5), or a full product | `anvil:products@c{i}` |
| `anvil/next-tab` | `account.anvilTabsOwned`, holdings, `smithingLevel` | a next tab below Tab 5 | `anvil:tab` |
| `anvil/hammers` | `characters[].anvil.hammers`, `bigBubbles`, `alchemy` | free hammer; Hammer Hammer owned, unequipped | `anvil:hammers@c{i}` |
| `gear/craft-next` | engine Gear output, holdings, `anvilRecipes`, `anvilTabsOwned` | a craftable target | `gear:craft@c{i}` |
| `gear/craft-shared` | as above | a target 2+ characters want | `gear:craft-shared:{rawName}` |
| `production/forge` (2) | `account.forge`, Demand | Demand-backed bar with ore held and a free slot, or with no ore held | `forge:slots` (load only) |
| `production/refinery` (2) | `account.refinery`, `account.salts`, Demand | Demand-backed salt off, no deficit on its fuel | `refinery:salt-off` |
| `production/build-slots` (2) | `construction`, shown Goals | a Goal's building not in a slot | `construction:slots` |
| `production/brewing` (2) | `alchemy`, Bubble Plan | a brewer off the Demand liquid | `alchemy:brewer@c{i}` |
| `production/kitchens` (1) | `cooking` | the parent's idle-kitchen rule, or a Goal's meal | `cooking:kitchen@{k}` |
| `production/territories` (1) | `breeding`, `cooking` | a Demand spice not foraged | `breeding:territory@{t}` |
| `production/traps` (5) | `characters[].trapping`, Demand | a Demand critter with a free trap | `trapping:slots@c{i}` |

Engine changes, not Detectors: `bottleneckOf` (FR-C12) with a golden diff where a collapsed line changes; the printer
row (FR-C11) reads M14's plan.

## 11. Verification

- **Stories are the acceptance** (section 4), each its golden; blocked stories record goldens after their V-item.
- **Contract tests** for `characters[].anvil.{hammers, stock, speedParts}` over every public and stage fixture, with a
  bare-number `AnvilPAselect` case; for `anvil.fact.recipes` (FR-C3a CI check).
- **Ranking tests** (pure): 7.2 key order; 7.3 Demand-then-fallback split (one Demand hammer plus two EXP hammers); 7.5
  at 1.09x keeps and 1.10x switches; the cap clip (Thread on a 1,495-capacity anvil); multisets, not slots, compared.
- **Gate tests** (GC1, FR-C1a registry) and route round-trips (FR-C2).
- **No double advice:** the parent's R2 golden check covers every claim key of section 10, steps included.
- **Truth run (M22):** the anvil ratio, the craft-shared sufficiency and the bubble-unlock rolls are re-derived from the
  raw save under `?debug=truth`.
- **Layout:** every view at 390 and 1440, Daylight and dark, by Playwright screenshot in the PR Preview.

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| RC1 | Advice churns between saves | 1.10x keep threshold (7.5); multisets compared; keeps carry no Check |
| RC2 | Gear Plan Demand floods the plan on W4 | only craft-next targets enter Demand (7.1) |
| RC3 | The fallback reads as "always Thread" | cap-aware brute force; US-C5 asserts a non-Thread answer |
| RC4 | Producers ship before their page | per-wave placement (section 3); `#production` lists only producers whose wave shipped |
| RC5 | Unrated Bottlenecks mislead | FR-C12 wording; forge and Refinery rated in Wave 2 |
| RC6 | Two cards for one thing | claim keys (sections 9, 10) and the R2 golden check |
| RC7 | Gate targets that don't exist yet | FR-C1a fallbacks and its registry test |
| RC8 | Speed-ups drift into gem or Boost advice | closed lever lists (FR-C8), display-only step kind, NC1, NC2 |
| RC9 | The recipe table is authored from the wiki and drifts | FR-C3a CI check against every public fixture's status arrays; Stale on a new major |

## 13. Open questions (owner, batched)

Each has a recommended answer; a blanket yes accepts the recommendation.

1. **C-Q1** Keep threshold: switch only at 10% better (recommended), 5%, or always show the best?
2. **C-Q2** Wave C starts as soon as its Wave 0 needs (FR-1, FR-3, FR-10 for anvil/gear/walkthrough, V33) are in, in
   parallel with the rest of Wave 0 (recommended), or after all of Wave 0?
3. **C-Q3** Extend the Gear Plan to W4 sets (Lustre, Diabolical) in Wave C so craft next names W4 pieces on W4 accounts
   (needs two dated Sources per class line), or keep W1-W3 targets until FR-40 (Wave 5)? Recommended: keep W1-W3 now (on
   `first.json`, a W4-entry save like the tester's, these are the pieces still behind) and add W4 rows with FR-40.
4. **C-Q4** A dedicated `#production` page (recommended, "features need a home"), or only the per-character sections and
   the producers' pages?
5. **C-Q5** Pull the Refinery producer from Wave 2 into Wave C? It would pull the salt slice (FR-21b) too. Recommended:
   no; the Anvil Walkthrough names Spontaneity Salts and links the Refinery page meanwhile.
6. **C-Q6** The anvil EXP fallback ships as a Check (recommended: it is arithmetic on tier-1 data, corroborated by a
   post-patch wiki page), or display only until a second independent post-patch Source says idle hammers should make
   EXP?
7. **C-Q7** Show the wiki's Smithing levels for tabs and recipes labelled "(wiki)" until V-C6 finds the game's own value
   (recommended), or hide Smithing gates until then?
8. **C-Q8** Let F-C's wider Demand (next tab, craft next, Bubble Plan) feed M14's printer plan in a later wave
   (recommended: yes, in Wave 5 with FR-36), or keep the printer on shown Walkthroughs only?
9. **C-Q9** Demand source order: shown Walkthroughs, next tab, craft next, Bubble Plan (recommended), or craft next
   before the next tab?

## 14. Verify before build

| # | Wave | What | Where | Blocks |
|---|---|---|---|---|
| V33 | **C** (was 6) | `AnvilPAselect` as a bare number; Toolbox sorts `anvilSelected` in place (`anvil.ts#L135,#L191`) | Toolbox, raw saves | `characters[].anvil.hammers`, US-C-S1, US-C4, US-C6b |
| V-C1 | C | `anvilProduction[p][0]` is the on-anvil stock of products with no hammer | Toolbox `anvil.ts#getAnvil`, raw saves | `characters[].anvil.stock`, US-C5, US-C6 |
| V-C2 | 5 | Where Eternal Lord of The Undying Ember (`Critter6A`, the "A" variant of Pingy in `items.json`) is trapped | Toolbox `traps.ts`, `items.json`, N.js | FR-C21, US-C18 traps, US-C2 critter text |
| V-C3 | C | Frigid Soul (`Soul4`): the generated Acquisition lists a FIGHTING drop from "SoulCard4" with no map and a W5 chest; trace the real Supply (not asserted here) | Toolbox `monsterDrops.json`, N.js | US-C2's Frigid Soul step |
| V-C4 | 2 | Salt per hour from `getRefineryCycles` / `getPowerPerCycle` | Toolbox `refinery.ts#L85-L205` | FR-C17 rating |
| V-C5 | 2 | Bars per hour per forge slot from `getTimeTillEmpty` (ms, barrel phase) | Toolbox `forge.ts` | FR-C16 rating |
| V-C6 | C | The game's Smithing level per recipe (`ItemToCraftLV`), and whether it is the crafting character's or any character's (`expand.ts` uses the best, and wrongly reads `lvReqToCraft`) | N.js, wiki | FR-C3 gate line, FR-C10, smithing OQ1 |
| V-C7 | 1 | Spice cost per kitchen upgrade (parent V6) | N.js | FR-C14 |
| V-C8 | 1 | Lab bonus indices: Wired In, Refinery cycles, Certified Stamp Book | Toolbox `lab.ts#getLabBonus` | FR-C15, US-C13 |
| V-C9 | C | `AnvilCraftStatus` value 2 (seen on `first.json`, tab 1) | raw saves, N.js | FR-C3 state chip |
| V-C10 | C | Hammer count above 3 (dossier OQ10): confirm the list length is the count | raw saves | `anvil.check.hammers` "of 3" vs "of {n}" |
| V-C11 | C | The wiki tab pages' recipe order equals `AnvilCraftStatus` index order | public fixtures, wiki | FR-C3a |

## 15. Red-team log

Two reviewers ran on 2026-10-19 on the first draft: **completeness** (owner Q1-Q6, issue #159, every producer, the
required contents, conflicts with the parent spec) and **correctness** (against the dossiers, the vendored Toolbox code
and data, the adapter types and `first.json`). Rows are numbered RC-n (completeness) and RX-n (correctness).

| # | Sev | Finding (short) | Resolution | Where |
|---|---|---|---|---|
| RC-1 | P0 | Recipes tab had no data: `anvil.fact.recipe-tabs` has 2 rows, `gear.fact.recipes` 87; nothing maps `AnvilCraftStatus[tab][i]` to a recipe on tabs 2-5 | Fixed, verified. FR-C3a: generated `anvil.fact.recipes` from the wiki tab pages, CI check against public saves, V-C11; until then the tab lists the Gear Plan rows and counts | FR-C3, FR-C3a, §9, §14 |
| RC-2 | P0 | Wave C read `AnvilPAselect` though parent V33 (bare number; in-place sort) sat in Wave 6 | Fixed, verified (`anvil.ts#L135-L136,#L191-L193`). V33 moved to Wave C; hammers read from the raw key in save order; keep compares multisets | §3, FR-C7, 7.3, 7.5, §14 |
| RC-3 | P0 | Gate links mostly had no Walkthrough tab to land on; producer gates missing; GC1 regex narrow | Fixed. FR-C1b: a generic Walkthrough tab in `SystemFrame`, given to every page in gate-homes; producer gate rows added; GC1 reads the registry; parent FRs amended (§16) | FR-C1a, FR-C1b, GC1, §16 |
| RC-4 | P1 | Lab, build slots, cogs, printer missing a Detector, entry or exact story | Fixed: US-C12 (exact printer text), US-C13 (Lab step), US-C18 (build slots, cogs reuse parent entries, stated in §9); Lab has no Detector of its own by design (it makes no item) | §4, §9, §10 |
| RC-5 | P1 | Bubble Plan Demand from "next affordable row" is always 0 | Fixed: first lit row and first unaffordable row, shortfall | FR-C19, 7.1 |
| RC-6 | P1 | US-C11/C12 numbers (2,321 Dementia Bars, 596 salts) used every Gear Plan target, against 7.1 | Fixed: recomputed under 7.1; Forge story now says Void Ore is missing for Anvil Tab 4 and leaves Dementia to the parent Check; Refinery story 396 | US-C14, US-C15, evidence |
| RC-7 | P1 | "When to boost / unlock a bubble" unanswered; rolls undefined | Fixed: FR-C19 formula from Toolbox (`getBaseNewBubbleChance`, `getMaxCauldron`, `applyNewBubbleChances`); US-C16 (unlock ETA), US-C17 (level now: links the M19 answer; Boosts display only); strings aligned | FR-C19, US-C16, US-C17, GC6 |
| RC-8 | P1 | No step for an un-unlocked Hammer Hammer | Fixed: US-C8, `unlock-eta` value | US-C8, FR-C8 |
| RC-9 | P1 | Levers defined only for the anvil; no display-only step for Boosts | Fixed: closed lever table per producer and a display-only step kind | FR-C8 |
| RC-10 | P1 | Account-wide levers repeat on every row and overlap Spend Plan / spend-points | Fixed: shown once on `#production` with claim keys; spend-points claimed as a step | FR-C8, US-C7, §9 |
| RC-11 | P1 | Hook-lands-with-page conflicts (Anvil page Wave 6, Refinery tabs Wave 5, Lab steps Wave 1) | Fixed: Anvil page moves to Wave C (§16 amends FR-57 and the registry row); Refinery and Construction sections land in Wave 2 on pages that exist and are only extended; Lab steps attach in their host row's wave | §3, FR-C15, §16 |
| RC-12 | P1 | Parent Wave 2 already owns `characters[].anvil` | Fixed: ownership moves to Wave C (§16); Wave C is one release, one bump | §3, §6, §16 |
| RC-13 | P1 | Producer pages, `#production`, phone Recipes frames and row order undefined | Fixed: §8 placement rule and row order; phone 390 frames added to the AnvilRecipes board; `#production` first screen on the ProductionPlan board, full board before C.3 | §8, boards |
| RC-14 | P1 | Page answer contradicted by C5's full Chain Link | Fixed: page answer order defined; US-C5b | §8, US-C5b |
| RC-15 | P1 | Bottleneck rule self-contradictory | Fixed: one rule with three cases; US-C19 | FR-C12, US-C19 |
| RC-16 | P1 | EXP fallback may fail FR-2c (wiki date unknown; guide) | Checked: Beginner Guide revision 2026-09-14 (post-patch, wiki API); the 2026-05-26 guide is **pre-patch** (major 2026-08-26) and is dropped. Reframed as a Check on tier-1 arithmetic; owner choice C-Q6; Demand order recorded as a design choice, C-Q9 | 7.1, 7.4, §9, §13 |
| RC-17 | P1 | No stage-fixture story; band tags wrong | Fixed: US-C-S1..S3; tags corrected (US-C6b on `stage-w1-early`, US-C19 W2-mid on a mutation) | §4 |
| RC-18 | P1 | Craft next: craftability, "levels behind", pool order, empty case | Fixed: gated on tab, recipe state, Smithing; `levelsBehind` field; 7.1 pool order; US-C11 | FR-C10, US-C11 |
| RC-19 | P1 | Glossary terms widened without edits | Fixed: §17 lists the edits | §17 |
| RC-20 | P2 | "(tab 3)" left bare in a step | Fixed: chip | US-C2 |
| RC-21 | P2 | Hidden V-C1 dependency; hard-coded 700; rounding; unnamed fields | Fixed: tagged blocked V-C1; `requiredAmount(Chain Link)`; one decimal half up; US-C3 fields named | §4, Fixture |
| RC-22 | P2 | Greedy plus brute force composition undefined | Fixed: 7.3 Demand first, then fallback over the rest; ranking test | 7.3, §11 |
| RC-23 | P2 | Point plan vs EXP fallback | Fixed: 7.7 | 7.7 |
| RC-24 | P2 | Brimstone listed as a speed-up | Fixed: footer | FR-C8, FR-C16 |
| RC-25 | P2 | KB entries lacked confidence, category, effort, file | Fixed | §9 |
| RC-26 | P2 | Claim keys need live-entry edits | Fixed: listed with golden diffs; §16 amends FR-25, FR-37 ownership notes | §9, §16 |
| RC-27 | P2 | EngineResult and history size not budgeted | Fixed: EngineResult ~3 KB under M10's cap; fields kept in history, measured in C.1 | §3 |
| RC-28 | P2 | `#production` route; null-field story | Fixed: FR-C2; US-C-S3 | FR-C2, §4 |
| RC-29 | P2 | Status line ahead of the log; C-Q2 re-asked a decided question; no Gear-tab badge | Fixed: status line; C-Q2 now asks only the start condition; badge in FR-C10 and §8 | header, §13, §8 |

| RX-1 | P0 | EXP fallback's Two-Source basis false: the guide (2026-05-26) is pre-patch; the wiki date unknown | Partly accepted. Guide dropped (pre-patch, confirmed against `majors.yaml`). Wiki Beginner Guide revision read via the MediaWiki API: 2026-09-14, post-patch; dossier C36's "wording may be pre-patch" caveat kept in the entry notes. **Not accepted** that FR-2c binds it: FR-2c covers orderings; the fallback picks the product multiset with the most EXP by the return, which is tier-1 arithmetic once "no product is needed" holds. The disagreement goes to the owner as C-Q6, with display-only as the alternative | 7.4, §9, C-Q6 |
| RX-2 | P1 | Evidence "Bottleneck would be the critter" wrong: the real engine marks all four leaves blocked and returns no Bottleneck | Fixed, verified by the reviewer's run of `expandTarget`/`leafEffort`. Evidence restated; FR-C12 adds the blocked case | evidence, FR-C12 |
| RX-3 | P1 | US-C11/C12 numbers break 7.1 (only craft-next targets enter Demand) | Fixed (same as RC-6): Forge story names the missing Void Ore; Refinery 396 | US-C14, US-C15 |
| RX-4 | P1 | Companion bonus 4 makes Hammer Hammer count unequipped on `first.json`; the draft would tell C7 to equip it | Fixed: `anvil.check.hammers` and the lever are companion-aware; US-C4 asserts silence on C7 | US-C4, US-C7, FR-C4, FR-C8 |
| RX-5 | P1 | `craft-shared` "2 or more want" fires for Rex Ring, Dementia pieces | Fixed: wanted by 2+, every gate met, at least one copy fully held | FR-C10, US-C10 |
| RX-6 | P1 | Ice Breaker and Golden Net are "held" only through worn items | Fixed: the slot's own worn item counts for its upgrade (M18 FR-15) | FR-C10, evidence |
| RX-7 | P1 | Trap path is `account.traps[i]`; `first.json` has traps placed | Fixed, path corrected; story uses `m:first-traps-collected` | §6, US-C18 |
| RX-8 | P1 | `lvReqToCraft` is not the Smithing level, so "15 (game data)" is not a reading | Fixed: wiki level labelled "(wiki)"; M14 `expand.ts` misuse logged as a C.1 correctness fix; V-C6 extended; C-Q7 reworded | FR-C3, US-C3, V-C6, C-Q7 |
| RX-9 | P1 | Refinery guard cannot see an off fuel salt (Explosive off, Spontaneity safe rank 0) | Fixed: guard on fuel active and `saltMaxSafeRank`; row leads with "switch on Explosive Salts first" | FR-C17, US-C15, evidence |
| RX-10 | P1 | Nobody brews a liquid on `first.json` | Fixed: `m:first-water-brewer` | US-C17 |
| RX-11 | P1 | No recipe-to-index data; unowned tabs read 0 | Fixed with RC-1 (FR-C3a); unowned tabs always "locked" | FR-C3, FR-C3a |
| RX-12 | P1 | "+1% anvil speed" overstated about 3.4x (the stamp adds inside the speed-points term) | Fixed: effect computed with `getAnvilSpeed` ("about 0.3% here") | US-C7, FR-C8 |
| RX-13 | P2 | C2's helmet is lit; Golden Net and Gold Fishing Rod missing from the craft-now list | Fixed | evidence |
| RX-14 | P2 | "6 of 7 make unneeded products" mixed with "worth switching" | Fixed: two separate statements | evidence |
| RX-15 | P2 | `expectedNewBubbles` is the adapter's name; Toolbox's is `expectedBubbles`; rolls undefined | Fixed: both named; rolls defined | US-C16, §6 |
| RX-16 | P2 | `getSpeed`, `getTimeTillEmpty` are module-private | Fixed: read `list[].speed`, `ore.timeTillEmpty` | FR-C16 |
| RX-17 | P2 | Bar Bonanza ignored; in-use slots have room | Fixed: bar counts are lower bounds; slot count subtracts room on slots already on that ore | US-C14, FR-C16 |
| RX-18 | P2 | Void Ore sub-step wording and count | Fixed: "Get 99,998 more Void Ore (2 held)" | US-C2 |
| RX-19 | P2 | `speedParts` missed Broken Time and speed points | Fixed: 9 parts that reproduce `anvilSpeed` | §6, §3 size |
| RX-20 | P2 | Build slot count varies | Fixed | FR-C18 |
| RX-21 | P2 | Anvil leaves already rated | Fixed: C.6 scope reduced | §3, FR-C12 |
| RX-22 | P2 | Claim about a star-sign Walkthrough on `first.json` unsupported | Fixed: removed | §10 |
| RX-23 | P2 | Account 1.8x sums base EXP across different multipliers | Fixed: weighted by `calcAnvilExp`; 1.8 shown as the base-EXP value | US-C6 |
| RX-24 | P2 | Draft wiki tiers inconsistent (3 vs 2); dossiers use another numbering | Fixed: re-tiered at conversion (parent FR-2), stated in §9 | §9 |
| RX-25 | P2 | `anvil.check.empty-hammer` duplicates `hammers`; US text differed from the draft | Fixed: retired into `hammers`; US-C4 uses `text-free` | FR-C4, US-C4 |
| RX-26 | P2 | GC1 regex missed "(tab {n})", "Anvil Tab {n}", ladder keys; matched plain levels | Fixed with RC-3: GC1 reads the gate-homes registry, which lists every template key that emits a gate | GC1, FR-C1a |
| RX-27 | P2 | Hammer order scrambled by the in-place sort | Fixed with RC-2 (raw key, save order) | FR-C7 |
| RX-28 | P2 | US-C6b expected row wrong on C1 (already on Chain Link) | Fixed: story moved to `m:stage-w1-early-tab2`; fill order stated | US-C6b |
| RX-29 | P2 | Small text: 7x3x286; tester's stage; souls claim unsourced; glossary covers fallback; header total | Fixed: 7 x 286; C-Q3 says W4-entry; V-C3 asserts nothing about souls; §17 covers the fallback; Recipes header uses state counts | 7.8, C-Q3, V-C3, §17, US-C3 |

**Unresolved P0:** none. RX-1 is answered in part by evidence and in part by an owner question (C-Q6); until the owner
answers, the anvil switch rows are built as a Check and can be flipped to display only by one `ship` mark.

## 16. Amendments to the parent spec

Applied when this addendum is accepted; listed so the parent stays the single plan.
- Section 3 wave table: add Wave C between 0 and 1; FR-57 keeps `material-pouch`, `acme-trick`, `product-exp` is retired
  into FR-C7, `next-tab` and `hammers` move to Wave C; `check.mat-points` stays Wave 2.
- Section 6 schema table: `characters[].anvil` moves from the Wave 2 row to a new Wave C row (`hammers`, `stock`,
  `speedParts`); `account.anvil` stays Wave 2.
- Section 9 page registry: `anvil` moves from "extended, Wave 6" to "tabs rebuilt, Wave C" (Wave 6 builds onto them);
  add `production` (`#production`, kind activeon, Wave C).
- FR-26, FR-56, FR-61, FR-66: each page also hosts the generic Walkthrough tab (FR-C1b).
- FR-25, FR-37, FR-14: their `fill-empty-slots`, `salt-off`, `idle-kitchen` entries declare the F-C claim keys; the
  Production Plan row owns the card when it proposes something, else the parent Check does.
- Section 14: V33 moves to Wave C.

## 17. Glossary edits

- **Demand**: "What every shown Walkthrough still needs, plus the next anvil tab, each character's craft-next piece and
  the Bubble Plan's shortfalls, item by item, after subtracting what the account holds, with holdings given to the
  higher-ranked source first."
- **Production Plan**: add "a source of Demand first, then the Bottleneck it shortens, then Demand against what the
  producer makes by the Expected Return; when nothing is in Demand, a producer keeps what it makes unless its fallback
  is at least 10% better".
- New **Producer**: "Anything that turns time into items for the account: a character's anvil hammers, a Forge slot, a
  Refinery salt, a kitchen, a brewer, a build slot, a trap, a printer slot, a Breeding territory." _Avoid_: maker,
  machine.
- New **Craft next**: "The one Gear Plan piece a character is closest to crafting now, and the pieces several characters
  want, with whether the account holds enough for all of them." _Avoid_: next craft, craft queue.
- New **Gate link**: "A gate (an anvil tab, a level, a recipe, a quest, a rank) shown as a link to the tab that explains
  it: a place when met, a Walkthrough when not." _Avoid_: gate chip (that is the UI atom), unlock link.

## Sources

- Issue [#159](https://github.com/YassSoliman/idleon-forge/issues/159) and its reply (2026-10-19).
- Dossiers [`w1/anvil.md`](../research/systems/w1/anvil.md) (C1-C54) and
  [`w1/smithing.md`](../research/systems/w1/smithing.md) (M1-M34, OQ1-OQ11), verified 2026-10-19 at the pin.
- IdleOn Toolbox @ `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1` (game 2.3.540), vendored at
  `packages/toolbox-parsers/vendor/`: `parsers/world-1/anvil.ts#L105-L200`, `parsers/world-1/forge.ts#L30-L201`,
  `parsers/world-3/refinery.ts#L25-L205`, `parsers/world-3/construction.ts`, `parsers/world-3/traps.ts`,
  `parsers/world-4/cooking.ts`, `parsers/world-4/breeding.ts`, `parsers/world-4/lab.ts`,
  `parsers/world-2/alchemy.ts#L603-L680`, `parsers/index.ts#L204-L359`; data `crafts.json` (`Anvil_Tab_2..7`,
  `Iron_Fishing_Rod`, `Golden_Net`, `Reinforced_Net`, `The_Ice_Breaker`), `items.json` (`Critter6`, `Critter6A`,
  `EquipmentSmithingTabs4`), `cauldrons.json` (`HAMMER_HAMMER` a2, `ANVILNOMICS` a4), `shared-data.json`
  (`anvilProducts`). Read 2026-10-19.
- idleon.wiki revision timestamps via the MediaWiki API, read 2026-10-19: Beginner_Guide 2026-09-14, Smithing
  2026-10-05, Anvil 2025-02-10 (pre-patch). Major patch dates: `packages/knowledge/majors.yaml`.
- ActiveOn on `feat/M25-release` @ `9fb3b461`: `GLOSSARY.md`, `packages/engine/src/walkthrough/
  {types,expand,plan,build,supply,holdings,printer}.ts`, `packages/engine/src/gear/build.ts#L105-L113`,
  `packages/knowledge/systems/{gear,gear.facts,walkthrough,anvil,anvil.facts,refinery,construction,printer,
  skills.facts}.yaml`, `packages/knowledge/generated/items.json`, `packages/knowledge/golden/first.md`,
  `packages/account-state/src/{walkthrough,world4,depth,unspent,afk}-types.ts`, `apps/activeon/src/shell/route.ts`,
  `apps/activeon/src/systems/frame/SystemFrame.tsx`, `apps/activeon/src/systems/pages/AnvilPage.tsx`,
  `apps/activeon/src/design/tokens.css`.
- Draft entries `docs/research/systems/kb-drafts/anvil.yaml` (`next-tab`, `hammers`, `product-exp`).
