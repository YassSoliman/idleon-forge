# Research: tab-4 (elite) and later talent Builds, every class

Date: 2026-10-19. Game 2.3.540 (Toolbox 6c37e3d). Status: research, feeds `kb-drafts/elite-builds.yaml` and its siblings.

**Why.** The W4 tester has a fresh Divine Knight and ActiveOn has no Build for it. Every live `talents.build.*` entry
stops at the third class and at `W4-entry`. M26 held tab-4 orders back until each had two dated Sources. On
2026-10-19 the owner widened the scope to every class and every reasonable stage, and changed the bar (below).

**Bottom line.**
- Every W4 elite now has a fighting and a skilling Build draft (14 entries).
- Every elite clears a two-source bar except the ES skilling preset (2, and both thin).
- **Divine Knight fighting** is the best supported: 6 independent dated authors, who agree on the tab-4 core, so
  confidence M.
- The weakest are Siege Breaker and Voidwalker. Their orders rest on one Toolbox author plus Gameslikefinder and a
  stale sheet.
- Everything is tier 3 (community), checked against tier 1 game data. Nothing is confidence H.

## Builds at a glance

**W4 elites (kb-drafts/elite-builds.yaml)**

| Build | Stages | Sources | Confidence | Label |
|---|---|---|---|---|
| `divine-knight-fighting` | W4-entry to W4-late | 6 | M | sources agree on tab 4 |
| `divine-knight-skilling` | W4-entry to W4-late (steps at W5) | 4 | L | sources disagree |
| `blood-berserker-fighting` | W4-entry to W4-late | 5 | L | sources disagree |
| `blood-berserker-skilling` | W4-entry to W4-late | 5 | M | sources disagree |
| `siege-breaker-fighting` | W4-entry to W4-late | 3 | L | sources disagree |
| `siege-breaker-skilling` | W4-entry to W4-late (steps at W5) | 3 | L | sources disagree |
| `beast-master-fighting` | W4-entry to W4-late | 5 | L | sources disagree |
| `beast-master-skilling` | W4-entry to W4-late | 4 | M | sources agree |
| `elemental-sorcerer-fighting` | W4-entry to W4-late (steps at W5) | 4 | L | sources disagree |
| `elemental-sorcerer-skilling` | W4-entry to W4-late (steps at W5) | 2 | L | few sources |
| `bubonic-conjuror-fighting` | W4-entry to W4-late | 3 | M | sources agree |
| `bubonic-conjuror-skilling` | W4-entry to W4-late | 4 | M | sources disagree |
| `voidwalker-fighting` | W4-entry to W4-late | 3 | L | few sources |
| `voidwalker-skilling` | W4-entry to W4-late | 4 | L | sources disagree |

## Source bar (owner ruling, 2026-10-19)

- **What counts:** the community meta, or the most upvoted / most recent build. One strong source is acceptable and
  ships with a `confidenceLabel` (for example "one source") instead of being dropped.
- **What to record:** the popularity signal (likes, views, upvotes) and the date for every Source.
- **Disagreements:** keep the most upvoted recent Build and note the alternative.
- **Precedence (ADR 0004):** talent effects come from `talents.json` (tier 1). Orders come from dated community
  sources (tier 3; the wiki is tier 2 but has no orders).

## Method

1. **Class list from game data.** `classPromotions.json` and `talents.json` at the pin, not assumed. See the next section.
2. **Toolbox community builds.** I read every build through the public API
   (`https://builds.idleontoolbox.workers.dev/api/builds`, the URL the earlier `research/character-builds` pass found).
   On 2026-10-19 it held 127 builds. I took each one's payload (talent levels per tab), written description, likes,
   views and created/updated dates.
   - Payload keys are `skillIndex`. Descriptions cite talents as `[[talent:N]]` (skillIndex) or as 1-based positions
     in the tab's `talents.json` order. Both were resolved per tab, so the shared rawNames
     (`SYMBOLS_OF_BEYOND_~R/~G/~P`, `THE_FAMILY_GUY`) land on the right tab.
   - Values like `MAX1`, `*2` or `2nd` are the author's footnote or rank markers; the notes keep them.
3. **Other channels.** Four parallel web passes covered the idleon.wiki class pages (MediaWiki last-edit dates), r/idleon,
   Steam guides, Google guide sheets and dated YouTube guides. Two sources turned up:
   - **Gameslikefinder** class build guides by one author (Samuel Franklin). One exists for every elite and master
     class, each with an ordered talent table and a `dateModified`; I fetched each one directly.
   - **The wiki-linked "Talents guide" sheet** (Fibster, later Tetsu). It is stale: its last changelog entry is
     2024-07-12.
   - **Reddit was blocked in every pass (HTTP 403), so there is no Reddit evidence.**
   - The session's web-search budget ran out early, and YouTube captions could not be read. Videos therefore count as
     leads, not Sources.
4. **Shape.** Each Build is written in the exact shape of the live `talents.build.*` entries (`schema.ts` BuildEntry),
   plus draft-only keys the converter maps (see "Converter and engine requirements").

"Legacy curated import" marks the Toolbox "Community Guide" builds. They were imported on 2026-04-26 from the old curated
`data/builds.json`, which carried v1.23/1.40b tags (the 2021-22 game). Their payloads were last edited 2026-08 to
2026-10. The earlier pass (`research/character-builds`) treated them as Stale; under the new bar they count as dated
sources, but they get less weight than a build first written in 2026.

## Classes in the game data

From `classPromotions.json` (index, `promotesFrom`, `talentTabs`):

| Line | Base | Subclass (tab 3) | Elite (tab 4) | Master (tab 5) |
|---|---|---|---|---|
| Beginner | Beginner (1), Journeyman (2) | Maestro (3) | Voidwalker (4) | Infinilyte (5, `released: false`) |
| Warrior | Warrior (7) | Barbarian (8) | Blood Berserker (10) | Death Bringer (14) |
| Warrior | Warrior (7) | Squire (9) | Divine Knight (12) | Royal Guardian (16) |
| Archer | Archer (19) | Bowman (20) | Siege Breaker (22) | none in data |
| Archer | Archer (19) | Hunter (21) | Beast Master (25) | Wind Walker (29) |
| Mage | Mage (31) | Wizard (32) | Elemental Sorcerer (34) | Spiritual Monk (35, `released: false`) |
| Mage | Mage (31) | Shaman (33) | Bubonic Conjuror (36) | Arcane Cultist (40) |

Notes on the table:
- **Siege Breaker** has no `promotesTo` in the data.
- **Journeyman line:** the Journeyman's tabs are Beginner + Journeyman, so its "tab 3" is the Maestro tab and the
  Voidwalker tab is tab 4.
- **Tab 4 contents:** every elite tab has 15 talents, and five are shared across a line's elites:
  - the Skulls talent (Charred / Stacked / Memorial);
  - the Skill talent (Skill Strengthen / Ambidexterity / Wiz);
  - the stat talent (Overblown Testosterone / Adaptation Revelation / Utmost Intellect), which also raises the accuracy
    stat talent's max;
  - The Family Guy;
  - Symbols of Beyond (+1 level to every talent above level 1, plus 1 more per 20 levels: `intervalAdd(1,20)`).
- **Voidwalker exception:** Voidwalker has neither Symbols of Beyond nor The Family Guy (`talents.json`; the wiki's
  template agrees, `NoFamilyMan=y`).

## The W4 test account (aggregate only)

Read from the private fixture of 2026-10-19 (class index and `SL_`/`SLpre_` talent maps):
- **Characters:** seven. One Divine Knight (class level about 110) and six third-class characters at levels 69 to 88,
  one of each other subclass: Wizard, Squire, Bowman, Barbarian, Shaman and Hunter. There is no Journeyman-line
  character.
- **The Divine Knight's tab 4:** zero points spent on both presets.
- **Its fighting preset:** follows the live squire-fighting Build.
- **Its second preset:** a mining + refinery preset (Brute Efficiency, Idle Skilling, Big Pick, Refinery Throttle,
  Redox Rates and Sharper Saws at 100). This matches the DK skilling Build below.

So the next six promotions will each need their elite Build.

## Per class: the W4 elites

Each class below has:
- **Builds:** the entry ids in `kb-drafts/elite-builds.yaml`;
- **Sources:** independent dated authors (tier 1 data is not counted);
- **Confidence:** the entry's H/M/L, then the `confidenceLabel`.

"Bar" is the attack bar a source names.

### Divine Knight (Squire line), first priority

- **Sources: fighting 6, skilling 4. Confidence: fighting M (sources agree on tab 4); skilling L (sources disagree).**
  - BigRav01 "Divine Knight - Active - W4" (5vbgk0: 3 likes, 1,086 views, updated 2026-10-11).
  - Gameslikefinder's DK guide (updated 2026-03-09): Divine Intervention 1 > Orb of Remembrance max > Imbued
    Shockwaves > Knightly Disciple > Mega Mongorang > Symbols > King of the Remembered > Undying Passion > Overblown
    Testosterone > Gamer Strength > Charred Skulls > The Family Guy.
  - Community Guide "Active DK" (be7QEu: 11 likes, updated 2026-10-06, legacy import).
  - Airon420 "420 DV Aktiv" (KIfKZY: 1 like, 2026-08-25).
  - Anonymiss's Royal Guardian build, DK section (bO4Gxa: 0 likes, 2026-09-21).
  - The wiki-linked Talents guide sheet (stale, last changelog 2024-07-12).
- **Fighting Build.**
  - Tabs 1-3:
    - Tab 1: Gilded Sword > Sharpened Axe > Idle Brawling 50 (the KB core rule) > Meat Shank > Fist of Rage >
      Mana Booster > Critikill; Book of the Wise only for accuracy.
    - Tab 2: Carry A Big Stick > Firmly Grasp It > Double Strike 42 > Absolute Unit > Whirl > Strength In Numbers.
    - Tab 3: Shockwave Slash > Precision Power > Daggerang > Mastery Up; Bricky Skin 1.
  - Tab 4, in order:
    1. Orb of Remembrance = Imbued Shockwaves to max.
    2. 1 point each in Knightly Disciple, Mega Mongorang, Divine Intervention, Charred Skulls, The Family Guy and
       Symbols of Beyond.
    3. From W4-mid: Knightly Disciple, Mega Mongorang and King of the Remembered to max.
       BigRav01, Gameslikefinder and the sheet all lead tab 4 with Orb + Imbued and keep Divine Intervention small.
    4. From W4-late: Overblown Testosterone, Gamer Strength, and Symbols of Beyond in 20-level steps.
  - Bar (BigRav01): Orb, Knightly Disciple, Shockwave Slash, Whirl, Daggerang, Divine Intervention, Bricky Skin,
    Firmly Grasp It.
- **What changes on tabs 1-3 at promotion:**
  - Shockwave Slash and Daggerang go from 1 point to max. They are bar attacks now, and Imbued Shockwaves, Knightly
    Disciple and Mega Mongorang build on them (sheet: their "dmg/pierce scale with Squire's Shockwave").
  - Mastery Up is maxed.
  - Mana Booster and Critikill join tab 1.
  - Power Strike leaves the bar (BigRav01; be7QEu still keeps it at 100).
- **Skilling Build (mining + refinery, then Gaming).**
  - Tabs 1-3: the Squire mining + refinery order, unchanged.
  - Tab 4 at W4: 1 point each in Symbols, Skill Strengthen, Overblown Testosterone, The Family Guy and King of the
    Remembered.
  - From W4-mid: King of the Remembered to max. Gameslikefinder puts it first because it adds printer output, and the
    printer is live from W3. BigRav01 keeps it at 1.
  - Tab 4 from W5 (stageHint W5): Bitty Litty > 1000 Hours Played > Undying Passion. These scale on Gaming, a W5 skill.
  - Sources: BigRav01 "Divine Knight - Skilling - W5" (9Rr7r3: 1 like, 2026-10-06), Airon420's GZeKYl (3 likes,
    2026-06-21), Gameslikefinder's Gaming preset and the sheet.
  - **Note on GZeKYl:** its title and text are about the Elemental Sorcerer, but its payload is a DK mining + refinery
    preset with no tab 4. Counted for tabs 1-3 only.
- **Disagreements:**
  - **AFK DK:** bO4Gxa says an AFK DK takes Charred Skulls, Overblown Testosterone and Gamer Strength rather than the
    Orb.
  - **Skill Strengthen:** the sheet maxes it on the Gaming preset; BigRav01 keeps it at 1.
  - **Idle Brawling:** BigRav01 skips it entirely (an active build).
  - **The build is active:** every DK source is an active build, and no DK build is written for AFK fighting. The DK
    is "meant for farming rare bags drops like statues" (sheet), and Orb kills feed King of the Remembered's printer
    bonus.
- **Stages:** `W4-entry` to `W4-late`, with the Gaming steps at stageHint W5.

### Blood Berserker (Barbarian line)

- **Sources: fighting 5, skilling 5. Confidence: fighting L (sources disagree); skilling M (sources disagree).**
- **Fighting Build** (BigRav01 "Blood Berserker - AFK - W4", cWwA3M: 1 like, updated 2026-10-12, the only dated
  AFK order).
  - Tabs 1-3:
    - Tab 1: Gilded Sword > Sharpened Axe > Idle Brawling > Meat Shank > Health Booster.
    - Tab 2: Carry A Big Stick > Strength In Numbers > Firmly Grasp It > Whirl; Double Strike 30.
    - Tab 3: Monster Decimator > Axe Hurl > Bear Swipe.
  - Tab 4: Ember Bear to max, then Ferocity Strike 20, then 1 point each in Fired Up, Combustion, Serrated Swipe,
    Charred Skulls and Symbols.
- **What changes on tabs 1-3 at promotion:**
  - Bear Swipe and Axe Hurl go from 25 to max. Ember Bear boosts the bear claw to 12 mobs (data).
  - No Pain No Gain, Apocalypse Zow and Str Summore drop out.
- **Alternatives:**
  - The Barbarian ~150 guide (3HAFdX: 25 likes) keeps No Pain No Gain 160 and Zow 132.
  - Gameslikefinder (2026-03-28) leads with Charred Skulls > Fired Up > Combustion > Serrated Swipe, with Ember Bear
    fifth.
  - The stale sheet leads with Overblown Testosterone and Charred Skulls maxed.
  - So two of the five sources rank Charred Skulls first; the newest W4 order (BigRav01) ranks Ember Bear first.
  - The active ~150 guide (AeQ0Hx: 9 likes) maxes Combustion and Serrated Swipe.
  - A Death Bringer's preset (DLZQRu) shows every BB talent at about 141.
- **Skilling Build (fishing).**
  - Tabs 1-3: Sir_Grimtide's Barbarian fishing preset, the live barbarian-skilling Build.
  - Tab 4: Symbols of Beyond > Overblown Testosterone > Skill Strengthen, then the cooking talents Waiting To Cool >
    Overflowing Ladle > Apocalypse Chow.
  - Sources:
    - Sir_Grimtide's tab 4 (ih5wAK: 41 likes, updated 2026-10-19, the most liked and newest; "optional from here:
      mostly Cooking skills").
    - BigRav01's cooking order (SzHDi5: 1 like, 2026-10-12), which the stale sheet's Cooking preset shares.
    - Gameslikefinder's cooking build (2026-03-28): Overflowing Ladle > Waiting To Cool > Apocalypse Chow >
      Symbols > Skill Strengthen > Overblown > Taste Test.
- **Alternative:** the Community Guide 200+ skiller (RF2TZ7: 10 likes) puts Apocalypse Chow first and adds Taste Test.
  Apocalypse Chow pays per map at 1M kills, so it rises late.
- **One skilling Build per class:** a separate cooking preset would need a second skilling Build per line, which
  `kb.build(line, role)` does not allow. The sheet calls the BB "meant to stay in kitchen", so this is an open question
  (Q2).
- **Supersedes** the tab-4-only `talents.build.blood-berserker-skilling` draft in `kb-drafts/talents.yaml`.

### Siege Breaker (Bowman line)

- **Sources: fighting 3, skilling 3. Confidence: L (sources disagree).**
- **Fighting Build** (BigRav01 "Siege Breaker - AFK - W4", Z7fjwI: 1 like, 613 views, updated 2026-10-17).
  - Tabs 1-3:
    - Tab 1: Gilded Sword > Sharpened Axe > Idle Shooting > Mana Booster > Quickness Boots; Fist of Rage as accuracy
      needs.
    - Tab 2: High Polymer Limbs > Veins > Have Another! 14 > Strafe > Piercing Arrow > Sanic Speed.
    - Tab 3: Speedna > Homing Arrows > Flax Instastring > Extendo Rangeo; Magic Shortbow 1.
  - Tab 4: Suppressing Fire > Archlord of the Pirates (max), then 1 point each in Pirate Flag, Cannonball, Firebomb,
    Plunder Ye Deceased, Stacked Skulls, The Family Guy and Symbols.
  - Bar: Pirate Flag, Homing Arrows, Suppressing Fire, Cannonball, Piercing Arrow, Firebomb, Extendo, Strafe.
  - **Discrepancy:** the build's written tab-1 order starts with Gilded Sword, but its payload leaves Gilded Sword out.
    The written order is kept.
  - **All three sources agree:** Suppressing Fire is the main attack, and Archlord of the Pirates is the long-term
    talent.
  - **Disagreement on Plunder Ye Deceased:** Gameslikefinder (2026-05-26) and the stale sheet max it early; BigRav01
    keeps it at 1. The Build places it at W4-mid, then Adaptation Revelation, then Symbols in 20s.
  - **Super talents (leads only, URLs not captured):**
    - GriffyBit "best super talents" video (2025-11-28, 91k views): yes to Pirate Flag, Suppressing Fire, Stacked
      Skulls and Archlord; no to Plunder. It also says SB move speed is now capped, so Speedna loses value late.
    - IdleManeZed (2025-11-13): about 300 levels of Plunder is enough.
- **What changes on tabs 1-3 at promotion:**
  - Homing Arrows (20 before), Flax Instastring and Extendo Rangeo go to max.
  - Velocity Vessels, Shwifty Statues and Previous Points drop out of the order.
- **Skilling Build (catching).**
  - Tabs 1-3: the live bowman-skilling Build.
  - Tab 4: Symbols of Beyond > Adaptation Revelation > Skill Ambidexterity.
  - Source: Sir_Grimtide's tab 4 (b0sGrY: 29 likes, 2026-10-12). The stale sheet puts Skill Ambidexterity first.
  - Sailing (W5) steps at stageHint W5: Expertly Sailed > Captain Peptalk > The Family Guy. This is Gameslikefinder's
    Sailing preset, which it pairs with the catching preset.
  - Unending Loot Search is left to the player: off while hunting artifacts (wiki Tips and Tricks; Jehdrid, 2025-06-03).

### Beast Master (Hunter line)

- **Sources: fighting 5, skilling 4. Confidence: fighting L (sources disagree); skilling M (sources agree).**
- **Fighting Build** (BigRav01 "Beast Master - AFK - W4", MDGrBz: 1 like, updated 2026-10-13).
  - Tabs 1-3 are exactly the live hunter-fighting Build, which was transcribed from this same build.
  - Tab 4: Whale Wallop to max, then Have Yet Anotha One 14, then 1 point each in Ballista, Boar Rush, Nacho Party and
    Symbols.
  - Bar: Uwu Rawrrr, Whale Wallop, Bear Trap, Piercing Arrow, Ballista, Nacho Party, Boar Rush, Strafe.
- **Alternatives:**
  - DeathZon3's damage preset (jcQXsb: 7 likes, the most liked) gives levels only: 25 in each of the four summons.
    The ordered source is kept, and 25-each is recorded as the alternative.
  - The Colosseum 200+ guide (pNfw12) puts 100 in Ballista, Boar Rush and Whale Wallop.
  - The W4-mid steps (Adaptation Revelation > Animalistic Ferocity, then Stacked Skulls) are where Gameslikefinder
    (2026-05-26) and the stale sheet agree. They disagree on the summons: the sheet maxes all four, Gameslikefinder
    keeps three at 1.
- **Correction found:** MDGrBz's payload reads `STRAFE: "MAX1"` and `PIERCING_ARROW: "MAX1"`, where "MAX1" means max
  with footnote 1, "split between 1 & 4 & 5". The `kb-drafts/talents.patch.yaml` change to Strafe 1 therefore misreads
  the build. The live Strafe max stands. (Whether Strafe adds anything AFK is a separate data question.)
- **Skilling Build (trapping + breeding)** (BigRav01 3gARZB: 2 likes, 2026-10-13).
  - Tabs 1-3: the live hunter-skilling Build.
  - Tab 4, in order:
    1. Symbols 1.
    2. Trapping: Skill Ambidexterity > The Family Guy.
    3. Breeding: Curviture of the Paw > Arena Spirit 1 > Shining Beacon of Egg.
    4. Arena Spirit to max from W4-mid (Gameslikefinder, sheet).
    5. I Dream of Peace and Egg = Adaptation Revelation (DeathZon3 6w55Am, levels only). A Cinderbane breeding video
       (2025-03-22, 68k views, URL not captured) rates I Dream of Peace and Egg low.
  - Every source puts Curviture of the Paw, Shining Beacon of Egg and Arena Spirit at the top of the breeding talents.
  - Breeding talents work "no matter which player you hatch eggs on" (data), so one BM per account covers them.

### Elemental Sorcerer (Wizard line)

- **Sources: fighting 4, skilling 2. Confidence: L (sources disagree).**
- **Fighting Build.** The most-liked ES build is "Combat ES (Mostly Active)" (sAE4oV: 10 likes, updated 2026-10-07,
  legacy import). It gives levels (Max / High / 1), not an order, so the steps are ties by its own marks.
  "Active ES" (O7MPbO) defines MAX before HIGH.
  - Tabs 1-3:
    - Tab 1: Gilded = Axe; Idle Casting 50 (core); Overclocked Energy = Mana Booster = Book of the Wise; Farsight and
      Lucky Clover 1.
    - Tab 2: Power Overwhelming = Knowledge Is Power = Mana Overdrive = Robes = Individual Insight; then 1 point in
      Mini Fireball, You're Next and Choppin.
    - Tab 3: Paperwork = Wis Wumbo = Mana Is Life = Floor Is Lava; then Tornado; Earlier Education 1.
  - Tab 4, in order:
    1. Dimensional Wormhole = Utmost Intellect.
    2. Meteor Shower = Lightning Barrage.
    3. 1 point each in Chainbolt, Chaotic Force, Believer Strength, Memorial Skulls, Skill Wiz, The Family Guy and
       Symbols.
    4. Symbols in 20s from W4-late.
    5. Polytheism, Wormhole Emperor and God's Chosen Children at stageHint W5. They need Divinity gods or many
       wormhole kills.
- **Alternatives:**
  - Gameslikefinder's ES guide (updated 2026-03-09, one author) leads with Polytheism and keeps Meteor Shower at 1.
  - Airon420's active build (Rqcctu) maxes Meteor, Lightning and Chainbolt and puts Chaotic Force at 17.
- **What changes on tabs 1-3 at promotion:**
  - Floor Is Lava and Tornado stay on the bar (Gameslikefinder).
  - Speedy Book gains value because ES is played active (Gameslikefinder Wizard guide).
- **Skilling Build (choppin + worship; Divinity from W5).**
  - Tabs 1-4 from Airon420's "420 ES AFK" (dJLLSZ: 7 likes, 2026-10-09). Despite its title, it is a choppin + worship
    preset.
  - Its 100-level talents are tie a and its "late game" talents tie b.
  - Tab 4: Skill Wiz > Symbols 1 > Utmost Intellect = The Family Guy, then Shared Beliefs and Polytheism at
    stageHint W5 (Gameslikefinder's Divinity preset).
  - The M26 brief guessed Lab/Alchemy for ES. No source supports that (Lab is the BC's job), so the Build serves
    CHOPPIN.

### Bubonic Conjuror (Shaman line)

- **Sources: fighting 3, skilling 4. Confidence: M (fighting: sources agree; skilling: sources disagree on the first
  tube).**
- **Fighting Build** (BigRav01 "Bubonic Conjuror - AFK - W4", 6zw0dv: 0 likes, 2026-09-20).
  - Tabs 1-3:
    - Tab 1: Gilded > Axe > Idle Casting > Overclocked Energy > Mana Booster.
    - Tab 2: Power Overwhelming > Knowledge Is Power > Mana Overdrive > Choppin > Mini Fireball.
    - Tab 3: Virile Vials > Tenteyecle > Sizzling Skull > Auspicious Aura.
  - Tab 4: Symbols 1, then Chemical Warfare = Flatulent Spirit = Raise Dead to max, then Plague Stricken 10.
  - Excess goes to Wired In Power, then Memorial Skulls (7wR1WU).
  - **Sources agree on the tab-4 core:** "Active Bubo" (7wR1WU: 7 likes, 2026-10-12) and Gameslikefinder's BC guide
    (2026-05-05). Gameslikefinder: put Raise Dead first on the bar so it is cast first.
  - At promotion, Tenteyecle goes to max; it "grows much stronger after promoting to BC" (Gameslikefinder).
- **Skilling Build (Lab + alchemy + choppin).**
  - Tab 4: Purple Tube > Upload Squared > Essence Transferral > Green Tube, then Utmost Intellect > Skill Wiz > Symbols.
  - Sources: Sir_Grimtide (K4c9A0: 28 likes, 2026-10-15), and the Community Guide 200+ skiller (IGObdE: 14 likes),
    which matches exactly.
  - **Alternative:** BigRav01 (eYmHZr) and Gameslikefinder lead with Green Tube for Lab EXP.
  - Which tube pays depends on where the BC stands in the Lab (`lab.ts`; `elite-classes.check.lab-tubes`). Purple
    Tube reaches players to the right of the BC; Green Tube reaches those to the left.

### Voidwalker (Journeyman line; promoted through Nebulyte, not Eliteus)

- **Sources: fighting 3, skilling 4. Confidence: L.**
- **Fighting Build (the speedrun setup).** From 102939's "Speedrun talent setup" (rR2fuk: 5 likes, updated
  2026-10-02), whose 1st/2nd/3rd marks become ties. The stale sheet sets the order inside tab 4.
  - Tab 4, in order:
    1. Void Trial Rerun 1 ("spend 1 point to get any points from speedrun").
    2. Void Trial Rerun = Void Radius = Bossing Vain = Master of the System to max.
    3. Voodoo Statufication.
    4. Enhancement Eclipse to 250 in 25-point steps (each 25 enhances one talent of another class, data).
    5. Eternal LUK.
    6. Eternal STR = AGI = WIS.
    7. Power Orb.
    8. Quad Jab 1.
  - Tab 3: One Step Ahead first.
  - Gameslikefinder (2026-05-26) and the sheet level Quad Jab right after the first three talents; rR2fuk keeps it at 1.
  - No source gives an AFK fighting order for a Voidwalker.
- **Skilling Build (account boosts).**
  - Tab 4 from Gameslikefinder (2026-05-26), the newest ordered source: Void Trial Rerun 1 > Blood Marrow > Species
    Epoch > Voodoo Statufication > Master of the System > Enhancement Eclipse in 25s > Exp Cultivation > the Eternals.
  - The stale sheet puts Enhancement Eclipse second.
  - Tabs 1-3 come from the sheet and the Maestro Skilling guide (mlZMaQ). The Toolbox trapping preset (MNcLvz) agrees.
  - Blood Marrow should stay maxed for cooking (wiki Tips and Tricks).
- **Engine prerequisite:** `lineOf()` returns null for the whole Journeyman line today, so these Builds need that fixed.

## Claims register

One row per (Build, Source); tier 1 game data omitted (it backs every Build). No community source states a patch; each was checked against talents.json at 2.3.540. Popularity is the Toolbox like and view count on 2026-10-19.

| # | Build | Claim | Source | Date | Patch stated | Popularity | Tier |
|---|---|---|---|---|---|---|---|
| C1 | `divine-knight-fighting` | W4; skill bar Orb, Knightly Disciple, Shockwave Slash, Whirl, Daggerang, Divine Intervention, Bricky Skin, Firmly Grasp It | [5vbgk0](https://idleontoolbox.com/tools/builds/view?id=5vbgk0) | 2026-10-11 | none | 3 likes, 1086 views | 3 |
| C2 | `divine-knight-fighting` | legacy curated import; Knightly Disciple, Mega Mongorang, Imbued Shockwaves 100, excess to Gamer Strength | [be7QEu](https://idleontoolbox.com/tools/builds/view?id=be7QEu) | 2026-10-06 | none | 11 likes, 4140 views | 3 |
| C3 | `divine-knight-fighting` | Orb and King of the Remembered are mid-late game; Symbols of Beyond 1, then in 20-level steps | [KIfKZY](https://idleontoolbox.com/tools/builds/view?id=KIfKZY) | 2026-08-25 | none | 1 likes, 2714 views | 3 |
| C4 | `divine-knight-fighting` | Royal Guardian build; its DK section: AFK takes Charred Skulls, Overblown Testosterone, Gamer Strength, Symbols | [bO4Gxa](https://idleontoolbox.com/tools/builds/view?id=bO4Gxa) | 2026-09-21 | none | 0 likes, 752 views | 3 |
| C5 | `divine-knight-fighting` | stale; DK fighting: Symbols 1, Divine Intervention 5, Knightly Disciple 5, Imbued 60, Mega 25, Orb max; then Knightly, King, Mega, Imbued max | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C6 | `divine-knight-fighting` | Divine Intervention 1 > Orb of Remembrance max > Imbued Shockwaves > Knightly Disciple > Mega Mongorang > Symbols > King of the Remembered > Undying Passion | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-divine-knight-build-guide/) | 2026-03-09 | none | n/a | 3 |
| C7 | `divine-knight-skilling` | titled W5; tab 4 Bitty Litty > 1000 Hours Played > Undying Passion, 1 point in the other skill talents | [9Rr7r3](https://idleontoolbox.com/tools/builds/view?id=9Rr7r3) | 2026-10-06 | none | 1 likes, 432 views | 3 |
| C8 | `divine-knight-skilling` | payload is a DK mining + refinery preset (its text is about ES); tabs 1-3 only | [GZeKYl](https://idleontoolbox.com/tools/builds/view?id=GZeKYl) | 2026-06-21 | none | 3 likes, 4134 views | 3 |
| C9 | `divine-knight-skilling` | Squire skilling preset the DK keeps on tabs 1-3 | [CngknO](https://idleontoolbox.com/tools/builds/view?id=CngknO) | 2026-10-19 | none | 25 likes, 2965 views | 3 |
| C10 | `divine-knight-skilling` | stale; DK Gaming preset: Symbols 1 > Bitty Litty > Skill Strengthen; then Overblown, Symbols x20, Undying Passion; extra King, 1000 Hours, Family Guy | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C11 | `divine-knight-skilling` | King of the Remembered (max once you have Orb kills) > Bitty Litty > 1000 Hours Played > Symbols > Undying Passion > Skill Strengthen > Overblown | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-divine-knight-build-guide/) | 2026-03-09 | none | n/a | 3 |
| C12 | `blood-berserker-fighting` | W4 AFK; written order per tab, Ember Bear the only tab-4 talent past 20 | [cWwA3M](https://idleontoolbox.com/tools/builds/view?id=cWwA3M) | 2026-10-12 | none | 1 likes, 500 views | 3 |
| C13 | `blood-berserker-fighting` | active ~150, legacy curated import: Ferocity Strike > Fired Up > attacks; Combustion, Serrated Swipe, Ember Bear max | [AeQ0Hx](https://idleontoolbox.com/tools/builds/view?id=AeQ0Hx) | 2026-10-06 | none | 9 likes, 3516 views | 3 |
| C14 | `blood-berserker-fighting` | a Death Bringer's levels: every BB talent about 141, Charred Skulls 97, Tough Steaks 42 | [DLZQRu](https://idleontoolbox.com/tools/builds/view?id=DLZQRu) | 2026-10-11 | none | 1 likes, 532 views | 3 |
| C15 | `blood-berserker-fighting` | stale; BB fighting: Symbols 1 > Fired Up, Serrated Swipe, Combustion 5 > Overblown, Charred Skulls max; then Serrated, Fired Up max, Ember Bear 30 | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C16 | `blood-berserker-fighting` | Charred Skulls > Fired Up > Combustion > Serrated Swipe > Ember Bear > Symbols > Overblown Testosterone > Tough Steaks > Ferocity Strike | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-blood-berserker-build-guide/) | 2026-03-28 | none | n/a | 3 |
| C17 | `blood-berserker-skilling` | skilling preset TAB 4: Symbols of Beyond > Overblown Testosterone > Skill Strengthen; then optional, mostly cooking | [ih5wAK](https://idleontoolbox.com/tools/builds/view?id=ih5wAK) | 2026-10-19 | none | 41 likes, 5507 views | 3 |
| C18 | `blood-berserker-skilling` | W4 skilling: tab 4 Waiting To Cool > Overflowing Ladle; Apocalypse Chow once many maps have 1M kills | [SzHDi5](https://idleontoolbox.com/tools/builds/view?id=SzHDi5) | 2026-10-12 | none | 1 likes, 427 views | 3 |
| C19 | `blood-berserker-skilling` | 200+ skiller, legacy curated import: tab 4 Apocalypse Chow > Waiting To Cool > Taste Test > Overflowing Ladle | [RF2TZ7](https://idleontoolbox.com/tools/builds/view?id=RF2TZ7) | 2026-10-06 | none | 10 likes, 2338 views | 3 |
| C20 | `blood-berserker-skilling` | stale; BB Cooking preset: Symbols 1 > Waiting To Cool 60 > Overflowing Ladle max > Apocalypse Chow 60; 'this class is meant to stay in kitchen' | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C21 | `blood-berserker-skilling` | Overflowing Ladle > Waiting To Cool > Apocalypse Chow > Symbols > Skill Strengthen > Overblown Testosterone > Taste Test | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-blood-berserker-build-guide/) | 2026-03-28 | none | n/a | 3 |
| C22 | `siege-breaker-fighting` | W4 AFK; skill bar Pirate Flag, Homing Arrows, Suppressing Fire, Cannonball, Piercing Arrow, Firebomb, Extendo, Strafe | [Z7fjwI](https://idleontoolbox.com/tools/builds/view?id=Z7fjwI) | 2026-10-17 | none | 1 likes, 613 views | 3 |
| C23 | `siege-breaker-fighting` | Pirate Flag 1, Plunder Ye Deceased max, attacks 1 then the rest into Suppressing Fire; Symbols 1 > Archlord > Adaptation Revelation > Stacked Skulls | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-siege-breaker-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C24 | `siege-breaker-fighting` | stale; SB fighting: Symbols 1 > Pirate Flag 1 > Cannonball = Suppressing Fire = Firebomb 5 > Plunder max; then Archlord max, Symbols x20 | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C25 | `siege-breaker-skilling` | skilling preset TAB 4: Symbols of Beyond > Adaptation Revelation > Skill Ambidexterity | [b0sGrY](https://idleontoolbox.com/tools/builds/view?id=b0sGrY) | 2026-10-12 | none | 29 likes, 5223 views | 3 |
| C26 | `siege-breaker-skilling` | Sailing preset, paired with the catching preset: Unending Loot Search 0 or max; Expertly Sailed > Captain Peptalk > Symbols > Family Guy > Skill Ambidexterity | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-siege-breaker-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C27 | `siege-breaker-skilling` | stale; SB skilling: Symbols 1 > Skill Ambidexterity max; then Symbols x20 > Agi Again > Archlord > Family Guy; extra Peptalk, Expertly Sailed | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C28 | `beast-master-fighting` | W4 AFK; payload Strafe 'MAX1' (max, in the split with Piercing Arrow and Have Another!), Kung Fu Kick 1 | [MDGrBz](https://idleontoolbox.com/tools/builds/view?id=MDGrBz) | 2026-10-13 | none | 1 likes, 461 views | 3 |
| C29 | `beast-master-fighting` | damage preset, no written order: Ballista, Boar Rush, Whale Wallop, Nacho Party 25 each | [jcQXsb](https://idleontoolbox.com/tools/builds/view?id=jcQXsb) | 2026-10-06 | none | 7 likes, 2553 views | 3 |
| C30 | `beast-master-fighting` | Colosseum 200+, legacy curated import: Ballista, Boar Rush, Whale Wallop 100, Nacho Party 1 | [pNfw12](https://idleontoolbox.com/tools/builds/view?id=pNfw12) | 2026-09-06 | none | 2 likes, 2042 views | 3 |
| C31 | `beast-master-fighting` | Whale Wallop at least 1 (more if active), Ballista, Boar Rush, Nacho Party 1; then Symbols > Adaptation Revelation > Animalistic Ferocity > Stacked Skulls | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-beast-master-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C32 | `beast-master-fighting` | stale; BM fighting: Symbols 1 > the four summons 5 each > Adaptation max; then Boar Rush, Whale, Nacho, Animalistic Ferocity max, Symbols x20 | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C33 | `beast-master-skilling` | W4 skilling; tab 4 trapping: Skill Ambidexterity > The Family Guy; breeding: Curviture of the Paw > Arena Spirit > Shining Beacon | [3gARZB](https://idleontoolbox.com/tools/builds/view?id=3gARZB) | 2026-10-13 | none | 2 likes, 397 views | 3 |
| C34 | `beast-master-skilling` | trapping + breeding preset, levels only: also maxes I Dream of Peace and Egg and Adaptation Revelation | [6w55Am](https://idleontoolbox.com/tools/builds/view?id=6w55Am) | 2026-10-06 | none | 3 likes, 1220 views | 3 |
| C35 | `beast-master-skilling` | on the trapping preset: Shining Beacon > Curviture of the Paw > Arena Spirit 1, max Symbols, then finish Arena Spirit > Skill Ambidexterity > Adaptation | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-beast-master-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C36 | `beast-master-skilling` | stale; BM skilling: Symbols 1 > Curviture max > Arena Spirit max; then Symbols x20 > Shining Beacon > Skill Ambidexterity > Adaptation | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C37 | `elemental-sorcerer-fighting` | mostly active, legacy curated import; levels Max / High / 1, Symbols 1 then multiples of 20, God's Chosen Children only with God Rank | [sAE4oV](https://idleontoolbox.com/tools/builds/view?id=sAE4oV) | 2026-10-07 | none | 10 likes, 3964 views | 3 |
| C38 | `elemental-sorcerer-fighting` | MAX first, HIGH unlocked then maxed later: Wormhole, Utmost Intellect, Symbols MAX; Meteor, Lightning, Chainbolt, Chaotic Force HIGH | [O7MPbO](https://idleontoolbox.com/tools/builds/view?id=O7MPbO) | 2026-10-06 | none | 1 likes, 1459 views | 3 |
| C39 | `elemental-sorcerer-fighting` | active: Meteor, Lightning, Chainbolt 100; Chaotic Force 17; cast order Wormhole then Chainbolt | [Rqcctu](https://idleontoolbox.com/tools/builds/view?id=Rqcctu) | 2026-06-21 | none | 1 likes, 1737 views | 3 |
| C40 | `elemental-sorcerer-fighting` | damage preset: Polytheism > Wormhole > Lightning Barrage > Radiant Chainbolt > Meteor 1 > Symbols > Utmost Intellect > Believer Strength | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-elemental-sorcerer-build-guide/) | 2026-03-09 | none | n/a | 3 |
| C41 | `elemental-sorcerer-skilling` | titled AFK but a choppin + worship skilling preset: 100s first, *1 MP > WIS, *2 late game; Symbols 1 then 20-level steps | [dJLLSZ](https://idleontoolbox.com/tools/builds/view?id=dJLLSZ) | 2026-10-09 | none | 7 likes, 2853 views | 3 |
| C42 | `elemental-sorcerer-skilling` | Divinity preset on the choppin/worship preset: Polytheism > Shared Beliefs > Symbols > Skill Wiz > Utmost Intellect > The Family Guy | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-elemental-sorcerer-build-guide/) | 2026-03-09 | none | n/a | 3 |
| C43 | `bubonic-conjuror-fighting` | W4 AFK: tab 4 Chemical Warfare = Flatulent Spirit = Raise Dead, Plague Stricken 10, Symbols 1 | [6zw0dv](https://idleontoolbox.com/tools/builds/view?id=6zw0dv) | 2026-09-20 | none | 0 likes, 563 views | 3 |
| C44 | `bubonic-conjuror-fighting` | active, legacy curated import: the same three at 100, excess to Wired In Power, then Memorial Skulls; Symbols 1 | [7wR1WU](https://idleontoolbox.com/tools/builds/view?id=7wR1WU) | 2026-10-12 | none | 7 likes, 3286 views | 3 |
| C45 | `bubonic-conjuror-fighting` | Symbols 1 > Raise Dead (about 50 on small maps, 100+ elsewhere) > Chemical Warfare > Flatulent Spirit > Utmost Intellect > Wired In Power; bar Raise Dead first | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-bubonic-conjuror-build-guide/) | 2026-05-05 | none | n/a | 3 |
| C46 | `bubonic-conjuror-skilling` | skilling preset TAB 4: Purple Tube > Upload Squared > Essence Transferral > Green Tube; Utmost Intellect > Skill Wiz > Symbols | [K4c9A0](https://idleontoolbox.com/tools/builds/view?id=K4c9A0) | 2026-10-15 | none | 28 likes, 3545 views | 3 |
| C47 | `bubonic-conjuror-skilling` | 200+ skiller, legacy curated import: tab 4 Purple Tube > Upload Squared > Essence Transferral > Green Tube | [IGObdE](https://idleontoolbox.com/tools/builds/view?id=IGObdE) | 2026-10-12 | none | 14 likes, 2555 views | 3 |
| C48 | `bubonic-conjuror-skilling` | W4 skilling: Purple or Green Tube (Green to push Lab EXP, Purple to reach nodes) > Essence Transferral > Upload Squared | [eYmHZr](https://idleontoolbox.com/tools/builds/view?id=eYmHZr) | 2026-10-11 | none | 2 likes, 379 views | 3 |
| C49 | `bubonic-conjuror-skilling` | Lab preset: Green Tube (BC at the far right) > Upload Squared > Essence Transferral > Symbols > Skill Wiz > Utmost Intellect > Purple Tube last | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-bubonic-conjuror-build-guide/) | 2026-05-05 | none | n/a | 3 |
| C50 | `voidwalker-fighting` | 1st/2nd/3rd/4th ranks per talent; Void Trial Rerun, Void Radius, Bossing Vain MAX; Enhancement Eclipse 250; Quad Jab 1 (max if extra) | [rR2fuk](https://idleontoolbox.com/tools/builds/view?id=rR2fuk) | 2026-10-02 | none | 5 likes, 3534 views | 3 |
| C51 | `voidwalker-fighting` | trapping preset: Enhancement Eclipse 220; Eternal AGI, Voodoo Statufication, Species Epoch 231 | [MNcLvz](https://idleontoolbox.com/tools/builds/view?id=MNcLvz) | 2026-09-20 | none | 0 likes, 346 views | 3 |
| C52 | `voidwalker-fighting` | stale (last changelog 2024-07-12): speedrun starts Void Trial Rerun 1, One Step Ahead, Void Trial Rerun, Void Radius, Master of the System, Bossing Vain max | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C53 | `voidwalker-fighting` | Void Trial Rerun > Void Radius > Bossing Vain > Quad Jab > Voodoo Statufication > Master of the System > Eternal STR/AGI/WIS/LUK > Power Orb | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-voidwalker-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C54 | `voidwalker-skilling` | stale: skilling Void Trial Rerun 1, One Step Ahead, Enhancement Eclipse x25, Species Epoch; then Voodoo, Blood Marrow; then Exp Cultivation, Eternals | [Talents guide sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml) | 2024-07-12 | none | n/a | 3 |
| C55 | `voidwalker-skilling` | trapping preset, 0 likes: Enhancement Eclipse 220; Eternal AGI, Voodoo Statufication, Species Epoch 231; Hands and Transfusion | [MNcLvz](https://idleontoolbox.com/tools/builds/view?id=MNcLvz) | 2026-09-20 | none | 0 likes, 346 views | 3 |
| C56 | `voidwalker-skilling` | Maestro skilling ~100, legacy curated import: Happy Dude, Birthday, Looty Booty, Rares, Bliss N Chips, Hands, Printer | [mlZMaQ](https://idleontoolbox.com/tools/builds/view?id=mlZMaQ) | 2026-10-13 | none | 7 likes, 1704 views | 3 |
| C57 | `voidwalker-skilling` | Blood Marrow > Species Epoch > Voodoo Statufication > Master of the System > Enhancement Eclipse (25-point steps up to 250) | [gameslikefinder.com](https://gameslikefinder.com/article/idleon-voidwalker-build-guide/) | 2026-05-26 | none | n/a | 3 |
| C58 | `voidwalker-skilling` | IdleOn Wiki: Tips and Tricks (keep the Voidwalker on a preset with Blood Marrow maxed) | [idleon.wiki](https://idleon.wiki/wiki/Tips_and_Tricks) | 2025-12-24 | none | n/a | 2 |

## Converter and engine requirements

These are needed before any of these drafts can be promoted:
1. **Schema:** `BuildEntry.tabs[].tab` accepts 4 and 5. Status `draft` and stages `W4-mid` / `W4-late` come from M26
   FR-1 and FR-3.
2. **lineOf():** `packages/engine/src/builds/knowledge.ts` `lineOf()` returns the elite or master class when a Build
   exists for it.
   - Today it walks up to the subclass, so a Divine Knight gets the Squire Build.
   - It returns null for the Journeyman line, so that line has no Builds at all.
3. **rawName resolution:** rawName to skillIndex is resolved within the character's own tabs. Symbols of Beyond
   (149 / 374 / 539) and The Family Guy (144) repeat across elite tabs.
4. **Draft-only keys** to map or drop:
   - `stageHint`: the world a Build or step applies from (W5, W6, W7); no W5+ stage may be named yet (FR-3).
   - `sourceCount`, `confidenceLabel`, `supersedes`.
   - `inherits`: master-class Builds hold tab 5 only and take tabs 1-4 from the named Build.
   - `patch`: third-class Builds extended past `W4-entry`.

## Open questions

- **Q1:** Re-run Reddit and YouTube captions once they are reachable. Leads:
  - DK: Nocturne "Divine Knight Crystal Farming Build" (2024-03-09, 70.6k views, stale) and jbf "Divine Knight pushing
    guide" (2025-09-21).
  - VW: Titanicllama "Voidwalker Class Guide" (2025-02-15, 62.9k views, "Important Talents" at 8:33).
- **Q2:** A second skilling Build per class (BB cooking vs fishing, BM trapping vs breeding) needs a schema decision.

## Sources

- Toolbox community builds API, read 2026-10-19 (likes, views and dates inline above and in the YAML `note` fields):
  [5vbgk0](https://idleontoolbox.com/tools/builds/view?id=5vbgk0),
  [be7QEu](https://idleontoolbox.com/tools/builds/view?id=be7QEu),
  [KIfKZY](https://idleontoolbox.com/tools/builds/view?id=KIfKZY),
  [bO4Gxa](https://idleontoolbox.com/tools/builds/view?id=bO4Gxa),
  [9Rr7r3](https://idleontoolbox.com/tools/builds/view?id=9Rr7r3),
  [GZeKYl](https://idleontoolbox.com/tools/builds/view?id=GZeKYl),
  [cWwA3M](https://idleontoolbox.com/tools/builds/view?id=cWwA3M),
  [AeQ0Hx](https://idleontoolbox.com/tools/builds/view?id=AeQ0Hx),
  [SzHDi5](https://idleontoolbox.com/tools/builds/view?id=SzHDi5),
  [RF2TZ7](https://idleontoolbox.com/tools/builds/view?id=RF2TZ7),
  [ih5wAK](https://idleontoolbox.com/tools/builds/view?id=ih5wAK),
  [DLZQRu](https://idleontoolbox.com/tools/builds/view?id=DLZQRu),
  [Z7fjwI](https://idleontoolbox.com/tools/builds/view?id=Z7fjwI),
  [b0sGrY](https://idleontoolbox.com/tools/builds/view?id=b0sGrY),
  [MDGrBz](https://idleontoolbox.com/tools/builds/view?id=MDGrBz),
  [jcQXsb](https://idleontoolbox.com/tools/builds/view?id=jcQXsb),
  [pNfw12](https://idleontoolbox.com/tools/builds/view?id=pNfw12),
  [3gARZB](https://idleontoolbox.com/tools/builds/view?id=3gARZB),
  [6w55Am](https://idleontoolbox.com/tools/builds/view?id=6w55Am),
  [sAE4oV](https://idleontoolbox.com/tools/builds/view?id=sAE4oV),
  [O7MPbO](https://idleontoolbox.com/tools/builds/view?id=O7MPbO),
  [Rqcctu](https://idleontoolbox.com/tools/builds/view?id=Rqcctu),
  [dJLLSZ](https://idleontoolbox.com/tools/builds/view?id=dJLLSZ),
  [6zw0dv](https://idleontoolbox.com/tools/builds/view?id=6zw0dv),
  [7wR1WU](https://idleontoolbox.com/tools/builds/view?id=7wR1WU),
  [K4c9A0](https://idleontoolbox.com/tools/builds/view?id=K4c9A0),
  [IGObdE](https://idleontoolbox.com/tools/builds/view?id=IGObdE),
  [eYmHZr](https://idleontoolbox.com/tools/builds/view?id=eYmHZr),
  [rR2fuk](https://idleontoolbox.com/tools/builds/view?id=rR2fuk),
  [MNcLvz](https://idleontoolbox.com/tools/builds/view?id=MNcLvz),
  [mlZMaQ](https://idleontoolbox.com/tools/builds/view?id=mlZMaQ).
- Talents guide sheet (Fibster, later Tetsu; last changelog 2024-07-12, stale; linked from the wiki Builds page, edited
  2025-06-02): https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml.
  Talents are icons only, read by eye against the wiki icons (about 90% reliable per the pass).
- Gameslikefinder (Samuel Franklin), class build guides; `dateModified` read 2026-10-19; no popularity signal:
  - [Divine Knight](https://gameslikefinder.com/article/idleon-divine-knight-build-guide/) (2026-03-09)
  - [Blood Berserker](https://gameslikefinder.com/article/idleon-blood-berserker-build-guide/) (2026-03-28)
  - [Siege Breaker](https://gameslikefinder.com/article/idleon-siege-breaker-build-guide/) (2026-05-26)
  - [Beast Master](https://gameslikefinder.com/article/idleon-beast-master-build-guide/) (2026-05-26)
  - [Elemental Sorcerer](https://gameslikefinder.com/article/idleon-elemental-sorcerer-build-guide/) (2026-03-09)
  - [Bubonic Conjuror](https://gameslikefinder.com/article/idleon-bubonic-conjuror-build-guide/) (2026-05-05)
  - [Voidwalker](https://gameslikefinder.com/article/idleon-voidwalker-build-guide/) (2026-05-26)
  - [Wizard](https://gameslikefinder.com/article/idleon-wizard-build-guide/) (2026-03-09)
- idleon.wiki: [Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks) (2025-12-24). The class pages have no
  priority sections; last edits 2026-09-03 to 2026-10-12.
- Game data: IdleOn Toolbox
  [talents.json](https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/talents.json)
  and
  [classPromotions.json](https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/classPromotions.json)
  at 6c37e3d (game 2.3.540); `packages/engine/src/builds/knowledge.ts` (`lineOf`).
