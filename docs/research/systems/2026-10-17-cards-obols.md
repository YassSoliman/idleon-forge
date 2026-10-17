# System Dossiers: Cards, Card presets, Obols (2026-10-17)

Ticket: [#19](https://github.com/YassSoliman/idleon-forge/issues/19), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [`SYSTEM-DOSSIER.md`](../SYSTEM-DOSSIER.md). Terms: [`GLOSSARY.md`](../../../GLOSSARY.md). Source precedence: [ADR 0004](../../adr/0004-source-precedence.md). Numbers we may use: [ADR 0005](../../adr/0005-toolbox-numbers-not-our-formulas.md).

**Current patch:** game v1.23 "Luminous Menagerie" (2026-10-16/17).

**Sources read, highest trust first:**

- **Game client `N.js`:** `https://www.legendsofidleon.com/ytGl5oc/N.js`, Last-Modified **2026-10-17 01:42 GMT**, sha256 prefix `42da3130082762cf`. The newest patch-notes entry inside it is `Luminous_Menagerie_v1.23`. This is the same file the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) used. N.js is minified, so I cite **symbol name plus character offset** (`@offset`). Offsets shift every patch; the names are stable.
- **IdleOn Toolbox:** [Morta1/IdleonToolbox @ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1), gameVer **2.3.540** (`data/patch-notes.js`). Below, `TB:` means a path at that commit.
- **idleon.wiki** pages: [Cards](https://idleon.wiki/wiki/Cards) (last edit 2026-10-12), [Obols](https://idleon.wiki/wiki/Obols) (2026-10-07), [Alchemy](https://idleon.wiki/wiki/Alchemy), [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026). Those recent edits were table and layout bot work, so **the prose may be older than the edit date** (see [meta-sources](https://github.com/YassSoliman/idleon-forge/blob/research/meta-sources/docs/research/2026-10-16-meta-sources.md)). I used wiki prose only where code or data agrees with it, or I flag it.
- **Tier 3:** AutoReview (Scoli) @ `05ac449` (2026-09-23), shnaps' progression gist (rev. 2026-09-18) and r/idleon threads via the Arctic Shift API. These are opinion only. Every opinion row is flagged.
- **Saves:** the two private fixtures (a W2 account and a W3 account), used **only** for field names and aggregate checks. No names are quoted.

**Confidence labels:** **H** means read directly in code or data. **M** means my reading of minified control flow, or wiki prose that nothing contradicts. **O** means community opinion (tier 3).

## Answer

- **Cards are account-wide; equipping is per character.** A character has **4 card slots, +1 per Gem Shop "Extra Card Slot" (max 4, so 8)**, plus **one card set**. A card's bonus is `bonus × level`. Level goes up when your copy count passes **perTier × 1, 4, 9 and 25** (Lv 2 to 5). Lv 6 needs Rift 45 and **×484**. Lv 7 needs the W5 Spelunking lore boss and **×15,129**. (H, N.js `CardLv`, TB `cards.ts`)
- **Unowned cards drop 5× more often.** On top of that, every card chance is multiplied by `1.2 + Σ(card-drop bonuses)/100 × (1 + Cardiovascular%)`. **Toolbox does not compute this multiplier**, so ActiveOn can only show card ETAs at the base rate, which is a conservative floor. (H code, M on the 1.2 base)
- **A card set's tier is the sum of its cards' levels divided by the set size, rounded down.** Set bonuses for W1–W3: Blunder Hills +8% EXP **below Lv 50 only**; Yum Yum +10% food effect; Easy Resources +8% skill efficiency; Frostbite +5% DEF and ACC (each per tier). **Hard Resources now has 36 cards, including 7 W5 Spelunking cards**, so a W1–W3 account cannot reach its first tier. (H)
- **Card presets:** 2 per character from Lv 15, up to 7 with Gem Shop purchases. A preset stores the cards only. The card set is a separate per-character key. The rule ActiveOn can check is simple: **the active cards and set must match the character's `afkType`**. Toolbox already has those set-vs-activity alerts and a "passive card equipped" alert. (H for the data, M for the Lv 15 gate)
- **Obols:** unlocked by the W2 town Obol Altar. The NPC appears once your highest character is **Lv 30**; you give it a Bob Joe Pickle to finish its quest. **Obols only drop after you buy the W2 merit "Monsters now drop Obols"** (+5% obol drop rate per level, 7 levels). Before that, the only sources are the Alchemy Liquid Shop's daily Mediocre, Decent and Grand Obols, plus gems. (H)
- **There are 21 personal slots**, gated by **character level** (0 to 250), and **24 family slots**, gated by **family level** (`account.accountLevel`, 60 to 5000). Family obols apply to every character, so **fill the family slots first**. (H data, O priority)
- **Combining two identical obols:** succeeds 1 in (4 + tier), from 25% for Bronze down to 12.5% for Dementia. A failed Bronze combine loses the right-hand obol 10% of the time, Silver 5%, Gold and above never. **The left-hand obol's rerolled stats carry over to the result.** A reroll costs `ceil(0.8 × sellPrice)` fragments plus coins. Destroying an obol gives `sellPrice × (1 + 20% from Golden Obolen)` fragments. (H)
- **The min-max is drop rate in every slot** (O, broad consensus): Silver Pop Pop rerolled to 4% in circles, Gold Triple Sixes rerolled to 8% in squares, then hexagons and sparkles. Exceptions: skillers want Platinum or better skill obols, the card farmer wants Card obols, and fighters can use the W2/W3 boss hexagons.
- **Both fixtures leave free power on the table.** Across 11 characters: **0 family obols** on both accounts, with **6 open family slots each**. Only **1 personal obol** is equipped, against 4–8 open slots per character. A W3 account with the obol merit maxed has **4 obols sitting in storage**. **4 characters equip no cards at all.** **10 of 11 equip no card set**, even though tier-1 sets are available. One fighter is still on a choppin preset, and one equips a passive card, which does nothing in a slot. **These are the top Next Actions this cluster yields.**
- **Possibly outdated:** the W1–W3 card drop buff in v1.08 (2026-03-13) makes older drop-rate guides wrong; use Toolbox `monsterDrops.json`. v1.23 (Menagerie) adds a W7 card and a W7 fragment sink, but changes nothing in W1–W3 cards or obols that I could find.

---

## Cards

- **What it is:** Monsters, resources, bosses, dungeons, critters, souls and events drop collectible cards. Duplicates level a card up (more stars). Each equipped card gives `bonus × level` of one stat, and passive cards give their bonus without being equipped. (H, TB `parsers/cardMath.ts` L13-16 `calcCardBonus`; [wiki Cards](https://idleon.wiki/wiki/Cards))
- **Unlocks:** available from the start. Cards are viewed and equipped from the Codex Cards tab. Card drops need no unlock. **Lv 6 (5★, "Ruby")** unlocks at Rift 45 (`Rift[0] >= 45`). **Lv 7 (6★, "Majestic")** unlocks from the Spelunking lore boss index 2. Both are past W3. (H, TB `parsers/cards.ts` L52-56; N.js `"CardLv"==d` @4079185 uses `RiftStuff("5starCards")` and `Spelunk("6starCards")`)
- **Scope:** the collection (`Cards0` counts) is **account-wide**. Equipped cards and the equipped card set are **per character**. Passive cards are account-wide in effect. (H)

### Inputs → outputs

| Input | How it turns into cards | Conf | Source |
|---|---|---|---|
| Monster kills (active and AFK) | Each monster has a card entry in its drop table with a base chance (e.g. Red Mushroom 1 in 10, Poop 1 in 16,667). At load, the game multiplies every card entry by **×5 if you own 0 copies** (event "CardsZ" cards excluded), then by `CardChanceMulti`. | H | N.js `LootDropOddsReset` @6512451; TB `data/website-data/monsterDrops.json` |
| Skilling (mining, choppin, catching) | Resource nodes carry card entries the same way, e.g. Copper 1 in 5,000, Birch 1 in 3,448. | H | TB `monsterDrops.json` |
| Fishing | The AFK info shows "1 in X hr" from `.0015 × CardChanceMulti × kills/hr × AFK rate`. | H | N.js @3814937 |
| Trapping (critter cards) | On collect: `(4 × hours)^0.62 × CardChanceMulti > 100 × rand`, so longer traps roll better, but less than linearly. | H | N.js @8036646 |
| Worship (soul cards) | Each tower-defence wave gives a 5–7% / `CardChanceMulti` roll. | H | N.js @7589965, @7706303 |
| Dungeons | Their own chance × Card Champ bubble × dungeon card bonus. | H | N.js @4605700 |
| Gem Shop card packs, event shops | Newbie Pack: 3 cards (50% Lv 1, 35% Lv 2, 15% Lv 3). Ancient Pack: 4 cards. 4★, 5★ and 6★ Cardifiers lift one chosen card a star. | H | TB `data/website-data/gemShop.json` (`CardPack1`, `GemQ17-19`) |

**`CardChanceMulti`** = `1.2 + (Five Aces bribe + star sign pctCardDrop + equipped "Card Drop Chance" cards + Anearful vial + Card Stamp + Cards Galore talent + guild Card Spotter + equipment and obol card-drop % + Card Champ bubble) / 100 × (1 + Cardiovascular!/100)` (H, N.js `"CardChanceMulti"==d` @4055229). AutoReview models it the same way, as a 20% passive base plus group A × group B (O, AutoReview `mysite/general/cards.py`).

| Card-drop source | Where (world) | Notes | Source |
|---|---|---|---|
| Gigafrog card (+5%/Lv), Snelbie (+8%/Lv), Sir Stache (+9%/Lv), Egggulyte (+1%/Lv) | W1, W2, W3, event | They must be **equipped** on the character that kills. | TB `cards.json` |
| Obols of Cards (1%, 3%, 5%, 7%, 10%) | Liquid shop, combining | Personal and family slots | TB `items.json` |
| Card Stamp | W1 stamps (`StampC9`) | +1 per level, additive | TB `stamps.json` |
| Anearful vial (Glublin Ear) | W2 alchemy | +2 per level | TB `vials.json` |
| Five Aces in the Deck bribe | W1 bribes | +20 | TB `shared-data.json` `bribes[10]` |
| C2 Card Spotter | Guild | decay, x1 = 60 | TB `shared-data.json` `guildBonuses[12]` |
| Cards Galore | Journeyman talent 28 | Journeyman only | TB `talents.json` |
| Cardiovascular! | Star talent 628 | **Multiplicative** | TB `talents.json` |
| Pokaminni star sign | +15% (AutoReview) | | AutoReview `cards.py` (O for the value) |
| Card Champ bubble | Kazam cauldron, costs **Strung Jewels (W5 spice)** | Post-W3 | TB `cauldrons.json` `kazam[18]` |

### Card level thresholds (all cards)

Level `L` (1 to 7, where `stars = L − 1`) is reached when **copies > perTier × k**. The comparison is strict: N.js uses `>` and Toolbox mirrors it (H, N.js `CardLv` @4079185; TB `cards.ts` L17-29).

| Level | Border | k (× perTier) | Example, perTier 10 | Gate |
|---|---|---|---|---|
| 1 | none | owned (≥ 1) | 1 | none |
| 2 | Bronze ★1 | 1 | > 10 | none |
| 3 | Silver ★2 | 4 | > 40 | none |
| 4 | Gold ★3 | 9 | > 90 | none |
| 5 | Platinum ★4 | 25 | > 250 | none (or 4★ Cardifier) |
| 6 | Ruby ★5 | 484 | > 4,840 | Rift 45 (or 5★ Cardifier) |
| 7 | Majestic ★6 | 15,129 | > 151,290 | Spelunking lore boss (or 6★ Cardifier) |

- **Exception:** the W3 boss **Chaotic Chizoar** (`Boss3B`) uses `1.5 × (i + 1 + floor(i/3))²` instead (H, N.js `CardLv`).
- The wiki shows **increments** between levels (5/15/25/80/2.3K/73.3K for perTier 5), not totals. Toolbox's totals are `5 / 20 / 45 / 125 / 2,420 / 75,645`. They agree (H).
- Cardifier picks are stored in `accountOptions[155]` (5★) and `[603]` (6★), which floor that card's level (H, TB `cards.ts` L30-44).

### Goals and Milestones: card sets

Set tier = `floor(Σ card levels in the set / number of cards in set)`, and its bonus is `base × tier` (H, TB `cards.ts` L92-115 `getCardSets`; [wiki Cards § Card Sets](https://idleon.wiki/wiki/Cards)). Set sizes are from N.js `CardStuff` @14382220 (H).

| Set (raw) | Bonus per tier | Cards | Σ levels for tier 1 / 2 / 3 / 4 / 5 → bonus |
|---|---|---|---|
| Blunder Hills (CardSet0) | % EXP **if below Lv 50** | 16 | 16 → 8% / 32 → 16% / 48 → 24% / 64 → 32% / 80 → 40% |
| Yum Yum Desert (CardSet1) | % All Food Effect | 14 | 14 → 10% / 28 → 20% / 42 → 30% / 56 → 40% / 70 → 50% |
| Easy Resources (CardSet2) | % Skill Efficiency | 13 | 13 → 8% / 26 → 16% / 39 → 24% / 52 → 32% / 65 → 40% |
| Medium Resources (CardSet3) | % Skill EXP Gain | 31 | 31 → 5% / 62 → 10% / 93 → 15% / 124 → 20% / 155 → 25% |
| Frostbite Tundra (CardSet4) | % DEF and ACC | 16 | 16 → 5% / 32 → 10% / 48 → 15% / 64 → 20% / 80 → 25% |
| Hard Resources (CardSet5) | % Skill AFK Gain Rate | **36** (includes 7 W5 Spelunking cards) | 36 → 2% / 72 → 4% / … / 180 → 10% |
| Dungeons (CardSet7) | % more Dungeon Credits | 23 | 23 → 5% / 46 → 10% / … |
| Bosses (CardSet26) | % Dmg, Drop and EXP | 29 (W1–W7 bosses) | 29 → 6% / 58 → 12% / … |
| Events (CardSet25) | % Drop Rate | 25 | 25 → 7% / 50 → 14% / … |

The tier caps at the max card level: 5 normally, 6 or 7 after the Rift and Spelunking unlocks. W4+ sets (Hyperion Nebula, Smolderin' Plateau, Spirited Valley, Shimmerfin Deep) follow the same rule and are out of W1–W3 scope.

**Per-card Milestones** are the thresholds above, applied to the cards that matter. The full W1–W3 table (effect, perTier, copies per level, base drop) is in the [appendix](#appendix-a-w1w3-card-table).

### Feeds / fed by

- **Fed by:** fighting kills (every map), skilling nodes (Mining, Choppin, Fishing, Catching), Trapping, Worship, Dungeons, bosses (Amarok, Efaunt, Chizoar and their chaotic versions via keys), Crystal mobs (one card each, cheap perTier 3 to 10), Gem Shop packs and Cardifiers, and event shops. Drop-chance boosters: Stamps (Card Stamp), Alchemy vials (Anearful), Bribes (Five Aces), Guild, Star Signs (Pokaminni), talents (Cards Galore, Cardiovascular!), Obols of Cards.
- **Feeds:** character stats and damage (base STR/AGI/WIS/LUK, base damage, weapon power, % total damage, crit), AFK gain rates (Boop, Chaotic Amarok: fighting AFK; Amarok, Bunny: skill AFK), drop rate (Mimic, Crystal Carrot, King Doot, Bop Box), skill efficiency, speed and away gains (resource cards), Crystal Mob spawn (Poop card), Smithing EXP and Forge (passive forge cards), Worship (soul cards), Trapping (critter cards), and Dungeons. Later systems scale cards further: W4 Lab chips (`chipBoost`), legend talents (`legendBonus`), the Rift (5★, passive skill cards at Skill Mastery) and Spelunking (6★). (H, TB `cardMath.ts`; card effects from TB `cards.json`)

### Per-session actions

1. **Did any card cross a level?** Compare `account.cards[*].stars` with the previous save. If a card in an equipped preset went up a level, nothing needs doing; the bonus applies automatically. (H)
2. **Is a new card set tier available?** For each set, check `Σ levels ≥ (tier + 1) × size` and whether the set equipped on each character is still the best for its activity. (H arithmetic, ADR 0005)
3. **Are there empty slots?** Any character with fewer equipped cards than `4 + gemShopPurchases[63]` has free power to claim. (H)
4. **Is a passive card equipped?** It is a wasted slot (Toolbox alert `passiveCards`). (H)
5. **Idle state:** a character AFK-fighting a map whose card is already at the max level for this account gains no card progress there. That is fine if its Purpose is something else (EXP, drops, Death Note kills); it only matters when cards *are* its Purpose. (M)

### AFK Setup implications

- **Card Purpose:** a map is worth parking on for cards when (a) you **own 0 copies** (5× chance; the first copy is usually quick) or (b) a card you want in a preset is close to its next threshold. ETA = `(nextLevelReq − amount) / (kills/hr × base chance)`. Toolbox gives kills/hr and `nextLevelReq`, which keeps this inside ADR 0005. It **under**-estimates the drop rate, because `CardChanceMulti` is at least 1.2 and is not in Toolbox. (H inputs, M on the floor)
- A **card farmer** (often the strongest killer, later an Elemental Sorcerer per the gist, O) should equip the card-drop cards (Gigafrog, Snelbie, Sir Stache) and Obols of Cards. (O, [gist "Key cards"](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa))
- **Trapping:** card odds rise with trap duration (`hours^0.62`), so for card hunting use long traps over many short ones. (H)

### Min-max by stage

| Stage | Priority (in order) | Conf | Source |
|---|---|---|---|
| Early W1 (Lv 1–30) | Equip 4 cards on **every** character (any bonus beats none). Blunder Hills set as soon as Σ ≥ 16 (+8% EXP while under Lv 50). Bored Bean (base damage), Wode Board, Carrotman and Slime (base stats by class), Glublin (% HP). Kill each new map's mobs until you own their card (5× first copy). | H (effects), O (order) | TB `cards.json`; Toolbox alert `cardSet` Lv 50 rule |
| Late W1 / W2 entry | Crystal Carrot (+5% DR, perTier 3, easy). Gigafrog on whoever hunts cards. Boss cards: Amarok (+2.5% **skill** AFK, on skillers), Chaotic Amarok and Boop (**fighting** AFK, on fighters). Dr Defecaus (+5% total damage). Glunko (+2 WP). | H, O | TB `cards.json`; gist "Key cards" |
| W2 | Yum Yum set for fighters at Lv 50+ (Σ ≥ 14 → +10% food effect; 28 → 20%). Mimic (+2% DR), Pincermin (+1 WP), Mashed Potato (+3% crit damage), Crystal Crabal (+2% EXP, perTier 3). **Easy Resources set (+8% skill efficiency) on every skiller** once Σ ≥ 13. Iron, Birch, Hermit Can and Butterflies efficiency cards in skill presets. | H, O | TB `cards.json`, Toolbox `cardsAlert` |
| W3 | Frostbite set for pushers (DEF and ACC; accuracy gates W3/W4 maps). Snowman and Bloodbone (+3% total damage each), Xylobone (+1% crit), Dedotated Ram (+2 WP), Bop Box (+3.5% DR), Sir Stache (card drop). Away-gain cards (Plat, Palm Tree, Saharan Foal, Bloach, Fruitflies) for long AFK skilling. Trapping (Crabbo, Dung Beat) and Worship souls (Dune and Rooted for starting points, Frigid and Oozie for max charge) on those activities. Efaunt and Chizoar boss cards. | H, O | TB `cards.json` |
| W4+ outline | Extra card slots (Gem Shop, top tier in AutoReview's gem list). Lab chips double chosen cards. Rift 45 → 5★ Ruby. Rift Skill Mastery makes skill cards passive, which frees slots. Gist late-game pick: damage Chaotic Emperor > Doodlefish > Dr Defecaus; skilling Amarok > Chocco Box > Chaotic Troll. | O | AutoReview `progression_tiers.py` gemShop tier S; [gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa) |

**Per class:** card *effects* are class-neutral, but base-stat cards should match the class's main stat: Warrior STR (Wode Board, Tyson, Frost Flake), Archer AGI (Carrotman, Mafioso, Bloque), Mage WIS (Slime, Walking Stick, Penguin), Journeyman LUK (Red Mushroom, Dig Doug, Quenchie). (H effects; class stats per the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md))

### Common mistakes (and how to detect them)

| Mistake | Detect from the save | Seen in fixtures (aggregate) | Conf |
|---|---|---|---|
| Characters with **no cards equipped** | `characters[].cards.equippedCards` has no `rawName` | 4 of 11 characters | H |
| **No card set** equipped although a tier-1 set is available | `characters[].cards.cardSet.name` empty, and some set has Σ ≥ size | 10 of 11. Both accounts have Blunder Hills and Yum Yum at tier ≥ 1, and the W3 account also has Easy Resources and Frostbite | H |
| Blunder Hills set kept past Lv 50 (it gives 0) | `cardSet.rawName == 'CardSet0'` and level ≥ 50 | – | H (Toolbox alert) |
| Fighting with a skill set (CardSet2/3/5/7), or skilling with a fight set (4/6/8/7/26) | `afkType` vs `cardSet.rawName` | – | H (Toolbox alert `cardsAlert`, TB `utility/dashboard/characters.js` L340-380) |
| **A passive card in a slot** (it gives nothing extra) | `effect` contains `(Passive)` or `(P)` | 1 character (a forge card) | H |
| Cards that don't match the activity, e.g. choppin cards on a fighter | `afkType` vs the equipped cards' effect keywords | 2 characters (a fighter on a choppin preset, a miner on combat cards) | M (keyword rule) |
| Farming old drop-rate advice | – | v1.08 (2026-03-13) buffed W1–W3 card drop "tremendously" | H ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)) |

### Save and Toolbox fields

| Field | Meaning | Source |
|---|---|---|
| `account.cards[displayName]` → `{rawName, cardIndex, category, effect, bonus, perTier, amount, stars, nextLevelReq}` | Collection. `stars` is 0-based (level = stars + 1); `amount` 0 means not owned (the catalog still lists it). | TB `parsers/cards.ts` L11-79 |
| `characters[].cards.equippedCards[]` (first 8) | Equipped cards with `legendBonus` / `chipBoost` | TB `cards.ts` L149-169 |
| `characters[].cards.cardSet` → `{name, rawName, effect, bonus, stars}` | Equipped set. `stars = bonus/base − 1`, `null` if none | TB `cards.ts` L81-84 |
| `getCardSets(account)` (helper, not stored) | Per set: `totalStars` (Σ levels), `stars` (tier − 1) | TB `cards.ts` L92-115 |
| `getCardBonusByEffect`, `calcCardsLevels` | Bonus of one effect; total card levels | TB `cards.ts` L129-141, L171-174 |
| `account.gemShopPurchases[63]` | Extra Card Slots (slots = 4 + this) | N.js `GemItemsPurchased[63]` @ the card UI init; TB `gemShop.json` `globalIndex: 63` |
| `account.rift`, `accountOptions[155]`, `[603]` | 5★ / 6★ unlock and Cardifier lists | TB `cards.ts` L52-56 |
| Raw `Cards0`, `Cards1`, `CardEquip_N`, `CSetEq_N` | Counts, the cards ever found, equip, set | fixtures (field names only) |

Toolbox numbers ActiveOn may use (ADR 0005): `stars`, `nextLevelReq`, card bonus, set totals, kills/hr. **Not available:** `CardChanceMulti` (no Toolbox function). Don't re-implement it. A later ADR could allow it as an upstream contribution to Toolbox.

---

## Card presets

- **What it is:** saved card loadouts per character, so a character can swap all its cards in one click when it changes activity. (H, TB `gemShop.json` `GemQ9` description)
- **Unlocks:** **2 presets** at character **Lv 15**, plus 1 per Gem Shop "Card Presets" purchase (250 gems, +160 each time, max 5, for all characters), up to **7**. The save always has 7 preset arrays of 12 entries. Presets have been cloud-saved across platforms since v2.03 (2024-03-08). (Lv 15 is M from the [wiki](https://idleon.wiki/wiki/Cards). The 7 arrays are H, N.js `CardPreset` init @6226156. Gem data is H, TB `gemShop.json`.)
- **Scope:** per character. Purchases are account-wide. (H)
- **Inputs → outputs:** it costs nothing to use. It gives the right card bonuses for the current activity. The **card set is not stored in the preset** (it is a separate per-character key, `CSetEq_N`), so swapping a preset does not swap the set. (M, from the save shape)
- **Goals and Milestones:**

| Milestone | Effect | Source |
|---|---|---|
| Character Lv 15 | 2 presets | wiki (M) |
| Gem Shop Card Presets ×1 | 3 presets. AutoReview's "Practical Max" stops here. | AutoReview `progression_tiers.py` (O) |
| ×5 | 7 presets ("True Max") | AutoReview (O); TB `gemShop.json` (H) |
| Gem Shop Extra Card Slot ×1–4 | 5–8 slots in every preset. AutoReview's **S tier**; the gist says "max it". | TB `gemShop.json`; AutoReview; gist (O) |

- **Feeds / fed by:** fed by Cards (the collection) and Gem Shop purchases. Feeds every system the cards boost, and the AFK Setup.
- **Per-session actions:** for each character whose activity changed this session, switch to the matching preset **and** card set before leaving. (H rule, from the alerts)
- **AFK Setup implications, preset matrix** (W1–W3; the effects are H from TB `cards.json`, the choice of card is O):

| Activity (`afkType`) | Card set | Cards to prefer (fill 4–8 slots, best owned level first) |
|---|---|---|
| FIGHTING, under Lv 50 | Blunder Hills | Main-stat card for the class, Bored Bean, Dr Defecaus, Chaotic Amarok or Boop (fight AFK), Mimic or Crystal Carrot (DR) |
| FIGHTING (push or EXP), Lv 50+ | Yum Yum (W2), then Frostbite (W3, accuracy) | Dr Defecaus, Snowman, Bloodbone (% damage), Glunko, Pincermin, Dedotated Ram (WP), Mashed Potato, Thermister (crit damage), Xylobone, Rat (crit), Chaotic Amarok or Boop (fight AFK), Crystal Crabal or Crystal Cattle (EXP) |
| FIGHTING (card or drop farm) | Yum Yum or Frostbite (a skill set would trigger the alert) | Gigafrog, Snelbie, Sir Stache (card drop), Mimic, Crystal Carrot, Bop Box, King Doot (DR) |
| MINING | Easy Resources | Iron, Void (efficiency), Plat, Dreadlo (away gains), Lustre, Dementia (speed), Gold (EXP), Amarok (skill AFK) |
| CHOPPIN | Easy Resources | Birch, Alien Tree (efficiency), Palm Tree, Saharan Foal, Maple (away), Toilet, Wispy, Cubed (speed), Jungle (EXP), Amarok |
| FISHING | Easy Resources | Hermit Can, Skelefish, Shellfish (efficiency), Bloach, Kraken, Jumbo Shrimp (away), Shark (speed), Jellyfish, Manta Ray (EXP), Amarok |
| CATCHING | Easy Resources | Butterflies, Mosquisnow, Bumble Bee, Scarab (efficiency), Fruitflies, Flycicle (away), Fairy (speed), Sentient Cereal (EXP), Amarok |
| Leveling a skill (EXP over output) | Medium Resources (Skill EXP; 31 cards, a slow first tier) | the skill's EXP card, Sandy Pot or Forest Tree (EXP conversion from talent, for talent-based EXP conversion builds) |
| Trapping (when setting **and** collecting) | Easy Resources | Crabbo, Dung Beat (efficiency), Scorpie, Honker (EXP), Froge, Mousey, Pingy, Blobfish (shiny) |
| Worship | – | Dune and Rooted Soul (starting points), Frigid and Oozie Soul (max charge), Squishy and Breezy Soul (charge rate), Forest Soul |

  - Trapping: per the gist, only card bonuses (and Critter Numnum) apply at collect. Quantity, EXP and shiny are fixed when the trap is set. (O)
  - Also on Worship characters: Chaotic Chizoar (passive shrines) gives its bonus anyway, so it does not need a slot.

- **Min-max by stage:** early on, 2 presets per character (fight and skill) are enough. Once a character rotates through 3 or more activities, the third preset (1 purchase) is the practical max. Extra card slots outrank presets. (O, AutoReview gem tiers)
- **Common mistakes:** the wrong preset left active after changing activity (detect: `afkType` vs `cardPresets[selectedCardPreset]` effects; seen on 2 fixture characters). An empty preset 2. Changing the preset but not the set. (H/M)
- **Save and Toolbox fields:** `characters[].selectedCardPreset` (from `PlayerStuff[2]`), `characters[].cardPresets[i][]` (the same shape as equippedCards), `characters[].afkType` and `afkTarget`, `account.gemShopPurchases[66]` (presets bought). (H, TB `parsers/character.ts` L407, L432-434)

---

## Obols

- **What it is:** shaped tokens (Circle, Square, Hexagon, Sparkle) placed in **personal** slots (that character only) or **family** slots (every character) at the Obol Altar. They give stats, % drop rate, damage, multikill, EXP, card drop chance, skill power and efficiency. Unequipped obols live in a separate Obol Storage. They can be **rerolled**, **combined** up a rarity, or **destroyed** for Obol Fragments. (H, TB `parsers/obols.ts`; [wiki Obols](https://idleon.wiki/wiki/Obols))
- **Unlocks:**
  1. The **Obol Altar NPC in W2 town** is hidden until your **highest character is Lv ≥ 30**. (H, N.js scene NPC filter `"Obol_Altar"==…&&30>Summoning("HighestLvPlayer")` @13746496)
  2. Its quest `Obol_Altar1`: bring **1 Bob Joe Pickle** (consumed; "Maybe from the Town Shop?"). Reward: Bronze Obol of Puny Damage. The quest is account-wide. (H, N.js `addDialogueFor("Obol_Altar")` @15308642, `AccountWideQuests` @14925060.) The wiki says it is completable "only after defeating Amarok" (M, not found in code).
  3. **Monster and skilling obol drops** require the **W2 Merit "Monsters now drop Obols. +5% drop rate per purchase"** (7 levels, 1 merit each, `tasks[2][1][0]`). When it is above 0, the game injects bronze and silver obols (and silver Money, Damage and Luck obols, plus Gold LUK) into the shared drop tables, at `base × (1 + level/20)`. (H, N.js @6519079; TB `shared-data.json` `merits`)
- **Scope:** personal obols are **per character**. Family obols, storage and fragments are **account-wide**. (H)

### Inputs → outputs

| Source of obols | What | Conf | Source |
|---|---|---|---|
| Rare drop tables of monsters and AFK skills (after the merit) | Bronze 0.11%, Silver 0.07% (each ×(1 + merit/20)) into the table. Silver Money 3%, Silver Damage 3.1%, Gold LUK 1.5%, Silver Double Sixes 2.5% (as table entries; the effective chance is that times the table's own odds). Wiki: "any enemy or boss with a Rare Drop table, any AFK-able skill". | H (entries), M (effective odds) | N.js @6519079; [wiki Obols](https://idleon.wiki/wiki/Obols) |
| **Gigafrog** (W1) | The only Bronze Obol of **Pop** source, 1 in 100,000 base | H | TB `monsterDrops.json` (`frogBIG`) |
| Bosses | Amarok → Granite (hex, 4% DEF). Efaunt → Skeletal (hex, +5 all stats, WP 2, 5% boss damage), 1 in 1,000 base, 1 in 333 chaotic. Chizoar → Frozen (hex, WP 4, 4% total damage). Dilapidated Slush (W3 miniboss) → Slushy (hex, +4 all stats, 3% skill efficiency), 1 in 250. Later: Troll, Domeo, Kruk, Emperor. | H | TB `monsterDrops.json`, `items.json` |
| **Alchemy Liquid Shop** (daily price reset) | **Mediocre Obols** (10 Water Droplets ×2.2 per buy): 18% each STR/AGI/WIS, 10% LUK, 10% Mining, 17% Choppin, 2% Cards, 7% Damage, all Bronze. **Decent Obols** (20 droplets + 3 Liquid Nitrogen, ×2.5): Bronze plus ~26% Silver, 2% Silver Damage. **Grand Obols** (Liquid Shop 2, Alchemy Lv 35; 5 Nitrogen + 3 Trench): ~7.7% Gold, 0.3% Gold Card. | H (tables), M (costs, from the wiki) | N.js `_customEvent_AlchShopPurchase` @6048083; TB `shared-data.json` `liquidsShop`; [wiki Alchemy](https://idleon.wiki/wiki/Alchemy) |
| Gem Shop | Quality Obol Stack (3 obols, 70% Silver, 30% Gold, at least 1 Gold; 250 gems). Marvelous Obol Stack (Gold, Platinum or Dementia; 550). Random Hyper Obol (circle, 425, max 6). Square Hyper Obol (625, max 8). Obol Storage Space (125, max 12). | H | TB `gemShop.json` |
| Arcade rewards (Clown, W2) | Obol Fragments | M | wiki Obols |

**Outputs:** the stat sums. Toolbox adds an obol's stat **only when it is positive**, so a negative reroll costs nothing (H, TB `obols.ts` L58-75). Obols give character stats (STR/AGI/WIS/LUK, which in turn give damage, accuracy and so on), drop rate, damage, multikill, money, card drop, EXP, skill power and efficiency, and build speed (Construction).

### Slot unlocks (Goals and Milestones)

**Personal**, by **character level** (H, TB `shared-data.json` `obols.character`; matches the wiki and AutoReview):

| Lv | 0 | 25 | 32 | 40 | 48 | 60 | 70 | 80 | 90 | 98 | 105 | 112 | 120 | 130 | 140 | 152 | 170 | 180 | 190 | 210 | 250 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shape | C | C | **S** | C | C | **S** | C | C | **S** | C | **H** | C | **S** | C | **S** | C | C | **H** | **S** | C | **Sp** |

**Family**, by **family level** = `account.accountLevel` (Toolbox's `familyObols` alert compares `levelReq` with `accountLevel`) (H, TB `obols.family`, `utility/dashboard/account.js` L249-256):

| Family Lv | 60 | 80 | 100 | 160 | 200 | 250 | 350 | 400 | 400 | 470 | 650 | 700 | 875 | 900 | 1150 | 1200 | 1250 | 1500 | 1750 | 2000 | 2100 | 2500 | 3000 | 5000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shape | C | C | C | C | **S** | C | C | C | **H** | C | **Sp** | **S** | C | **H** | **S** | **Sp** | C | C | **H** | **S** | C | **Sp** | **H** | **Sp** |

(C circle, S square, H hexagon, Sp sparkle.) Within W1–W3, characters reach about Lv 60–120 and family levels about 250–1,000, so the realistic target is about 6–13 personal slots per character and 6–14 family slots.

### Altar operations (combine, reroll, destroy)

| Operation | Rule | Conf | Source |
|---|---|---|---|
| **Combine** two identical obols → next rarity | Success = `1 / (4 + tier ID)`: Bronze 25%, Silver 20%, Gold 16.7%, Platinum 14.3%, Dementia 12.5% (to Hyper). On failure the **right-hand** obol is lost with chance `1 / randInt(1 + floor(ID/2), 10 + 10·ID)`: Bronze 10%, Silver 5%, Gold and above 0%. The left obol and its rerolls are kept. Boss obols cannot combine. Some families change shape on upgrade (e.g. Pop: circle → square at Gold). | H | N.js @6762045 (`ObolRarities[ID+1]`) |
| Combine cost | Fragments 2 / 6 / 14 / 32 / 80, plus coins (wiki table) | M | [wiki Obols § Combining](https://idleon.wiki/wiki/Obols) |
| **Reroll** | Fragments `ceil(0.8 × sellPrice)` (Bronze 1, Silver 3, Gold 7, Platinum 16, Dementia 40). Coins `round(2 × (50 × sellPrice^1.5)^1.5)` (Bronze ≈ 707, Silver ≈ 8.4k, Gold ≈ 76k, Platinum ≈ 598k). Two independent rolls re-pick the bonus stats. A misc stat (DR etc.) can roll −1 to +1, base stats −1 to +(1 + tier). | H (cost), M (roll table, wiki) | N.js `ObolRerollCostMoney`, `ObolRerollCostFrag`; wiki |
| **Destroy** (in W2 town) | Fragments `floor(frags + sellPrice × (1 + Golden Obolen%/100))`: Bronze 1, Silver 3, Gold 8 (9), Platinum 20 (24), Dementia 50 (60). The achievement bonus rounds down, so it only helps Gold and above. | H | N.js @8331721, @8356901 (`AchieveStatus(99)`); wiki |
| Full-storage drops (W7 Menagerie side-jelly, v1.22/1.23) | Overflow non-Hyper obols turn into fragments automatically. W7 Silver Jelly upgrades **spend** Obol Fragments. Out of W1–W3 scope, but it is a new fragment sink. | H | N.js @8618198, @12471166 |

### Best-in-slot by drop rate (the consensus min-max)

| Slot | Practical BiS (DR) | DR | How | Conf |
|---|---|---|---|---|
| Circle | Silver Obol of Pop Pop, rerolled | 4% (3 + 1) | Reroll a Bronze Pop to 3%, put it on the **left**, combine → Silver 4% | H (stats), M (wiki method), O (choice) |
| Square | Golden Obol of Triple Sixes, rerolled | 8% (7 + 1) | Silver Double Sixes (W2 desert mob drops) → combine | H, O |
| Hexagon | Platinum Yahtzee Sixes, rerolled (11%), or Magma (W5, 14%) | 10–14% | combine Gold Sixes | H, O |
| Sparkle | Dementia Infinisixes, rerolled | 16% | combine | H, O |

AutoReview's "practical" totals: personal 134% DR, family 188% DR (O, AutoReview `consts_w2.py` `obols_max_bonuses_dict`). Reddit agrees (2025-03 and 2025-10 threads): "silver pops for the circle slots and then dice for square and above", and "fill the circle/square slots for family … first" (O, [r/idleon 1jjrznl](https://reddit.com/r/idleon/comments/1jjrznl/why_do_people_prefer_pop_obol/), [r/idleon 1o2djl4](https://reddit.com/r/idleon/comments/1o2djl4/when_should_i_start_obol_farming/)).

### Feeds / fed by

- **Fed by:** monster and skill drops (the W2 Merit Shop), bosses (W1–W3: Amarok, Efaunt, Chizoar, Slush), Alchemy Liquid Shop (water, nitrogen, trench liquids), Gem Shop, Arcade (fragments), Achievements (Golden Obolen), Salt Lick and Gem Shop (storage).
- **Feeds:** character stats → damage, accuracy and so on (`TotalStats` sums equipment **and obols**, per the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md)); drop rate (and so every drop-based Goal); multikill; card drop chance (and so Cards); skill efficiency and power (skilling); Construction build speed; Worship; Trapping. Late game: the W5 Slab counts obols as items (O, Reddit), and W7 Menagerie fragments.

### Per-session actions

1. **Any obol in storage with an empty slot of that shape is a Next Action.** Detect: `account.obols.inventory` holds non-`Blank` items while some `characters[].obols.list[]` or `account.obols.list[]` entry is `Blank`. `Blank` already excludes slots above the level gate, which show as `ObolLocked1-4`. Toolbox raises `missingObols` and `familyObols`. (H)
2. **Liquid Shop:** buy the cheap first Mediocre and Decent Obols each day (the price resets daily). (M, wiki reset rule; O value)
3. **Upgrade loop**, when fragments allow: reroll fresh Bronze or Silver DR obols until the misc stat is +1, then combine with the rerolled one on the **left**. Destroy surplus off-family obols for fragments. (H mechanics, O loop)
4. **Idle or capped:** Obol Storage full (`ObolInvOwn` rows are full) means new drops are lost before W7. Fragments sitting unspent are fine. (M)

### AFK Setup implications

Obols are static. **There are no obol presets in the game** (the save has no preset key; the only obol keys are `ObolEqO*`, `ObolEqMAP*` and `ObolInv*`). So pick personal obols for the character's **main** job: DR and damage for fighters, skill obols (Platinum hexagon or better for efficiency) for dedicated skillers, Card obols for the card farmer. Family slots should hold universally useful stats: DR, and for W1–W3 also EXP and damage. (H for the save, O for the advice)

### Min-max by stage

| Stage | Priority | Conf |
|---|---|---|
| W2 entry (highest char Lv 30) | Unlock the Altar (Bob Joe Pickle). **Buy the W2 obol merit first** (the gist: "W2 Obol Drop Rate (1pt)"). Fill every unlocked slot, **family first**, with anything; any stat beats empty. Buy daily Mediocre Obols. | H, O (gist "Merit Shop by world") |
| Mid W2 | Farm Bronze Pop at Gigafrog for circles (very rare, so mostly AFK). Silver Double Sixes from Yum-Yum mobs (e.g. Sandy Pot or Crystal Crabal per Reddit) for squares. Begin the reroll-then-combine loop. Earn Golden Obolen before destroying Gold+. | O |
| W3 | Hexagon slots open (personal Lv 105, family 400). Platinum Sixes for DR; fighters can use the Efaunt and Chizoar boss hexagons for damage and stats. Skillers' first hexagon takes a Platinum skill obol (2% efficiency + skill power). Card farmer: Obols of Cards. | H (slots), O |
| W4+ outline | Sparkles (personal Lv 250, family 650): Dementia Sixes 15–16%, boss sparkles (Troll, Kruk, Emperor). Later, Class EXP, Skill Efficiency or Money obols can beat DR for some jobs (gist). | O |

**Per class:** STR/AGI/WIS/LUK obols should follow the class's main stat (Warrior STR, Archer AGI, Mage WIS, Journeyman LUK). Skill obols carry the stat of their skill (Mining and Fishing STR, Choppin WIS, Catching AGI). (H data)

### Common mistakes

| Mistake | Detect | Seen in fixtures (aggregate) | Conf |
|---|---|---|---|
| **Empty family slots** | `account.obols.list` `Blank` with `levelReq ≤ accountLevel` | 6 open family slots on **each** account, 0 family obols equipped | H |
| **Empty personal slots** | `characters[].obols.list` `Blank` | 4–8 open slots per character. 1 personal obol across 11 characters | H |
| Obols left in storage | `account.obols.inventory` non-`Blank` | W3 account: 4 Silver stat obols unused, with the merit at 7/7 | H |
| The obol merit never bought | `account.tasks[2][1][0] == 0` | W2 account: 0 | H |
| Combining a rerolled obol on the right, or upgrading into a shape you have no slot for | the shape after the upgrade | – | M (wiki) |
| Destroying Gold+ before Golden Obolen | achievement 99 | – | H |

### Save and Toolbox fields

| Field | Meaning | Source |
|---|---|---|
| `characters[].obols.list[]` → `{rawName, displayName, index, shape, levelReq, rerolled, …item stats}` | Personal slots (`Blank` = open; `ObolLocked1-4` = level-locked) | TB `obols.ts` L14-56 |
| `characters[].obols.stats[stat].personalBonus` | Summed positive stats | TB `obols.ts` L58-75 |
| `account.obols.list[]`, `.stats[stat].familyBonus`, `.inventory[4 rows]` | Family slots, family sums, storage (rows by shape) | TB `obols.ts` |
| `mergeCharacterAndAccountObols`, `getObolsBonus(obols, bonus)` | Personal + family bonus | TB `obols.ts` L77-116 |
| `account.accountLevel` | Family level (family slot gate) | TB `utility/dashboard/account.js` L249-256 |
| `account.currencies.ObolFragments` | Fragments (raw `CYObolFragments`) | fixtures (field name) |
| `account.tasks[2][1][0]` | W2 obol merit level (0–7) | N.js @6519079; Toolbox alert pattern `tasks[2][1][4]` |
| `account.gemShopPurchases` (Obol Storage Space), raw `ObolInvOwn` | Storage size | TB `gemShop.json` |
| Raw `ObolEqO0_N` / `ObolEqMAP_N` (personal), `ObolEqO1` / `ObolEqMAPz1` (family), `ObolEqO2` / `ObolEqMAPz2` (3-slot altar workbench) | Order and reroll maps | fixtures; N.js @6762045 |

---

## Which cards each character should grind next (deterministic rule for the Knowledge Base)

This rule only ranks Toolbox numbers with arithmetic (ADR 0005). Weights are opinion (O) until a grilling ticket fixes them.

1. **The activity filter:** only cards that drop from the character's current or reachable maps or nodes (`afkTarget`, maps it can clear), or from the skill it does.
2. **First copies first:** `amount == 0` cards on those maps. Owning one immediately helps set totals, and the 5× rule makes them fast. (H)
3. **Preset cards near a threshold:** cards already in this character's preset for this activity, ranked by `(nextLevelReq − amount) / (kills/hr × base chance)` (hours to next level, a conservative floor). (H inputs)
4. **Set completion:** cards whose next level pushes a set the character uses over its next tier. (H)
5. **Stop rule (Milestone):** stop once the card reaches level 5 (or 4 if the next 5★ step is more than the Expected Return × 10). Past that, the "Purpose: cards" for that map ends, and the map is only worth it for other Goals. (O)

Toolbox has no "next card" helper. AutoReview's card section only lists unowned cards and diff-to-next per set (O, AutoReview `cards.py`). So this rule is ours to own.

---

## Appendix A: W1–W3 card table

Generated from TB `data/website-data/cards.json` and `monsterDrops.json` @6827d3f. "Copies for Lv 2 / 3 / 4 / 5" is perTier × 1 / 4 / 9 / 25, and you need **more than** that number. "Base drop" is the drop-table chance **before** the ×5 unowned bonus and `CardChanceMulti`. "–" means the card comes from a source outside the monster tables (fishing, trapping, worship, dungeons, forge, events). The Hard Resources category includes W5 Spelunking cards (they are in that set in the game data). The Bosses category spans W1–W7. W1–W3 bosses: Glunko, Baba Yaga, Dr Defecaus, Boop, the Amaroks, Biggie Hours, King Doot, the Efaunts, Dilapidated Slush, the Chizoars. Mutated Mush is W4.


#### Blunder Hills

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Green Mushroom | +12 Base HP | 5 | 5 / 20 / 45 / 125 | 1 in 500 |  |
| Red Mushroom | +3 Base LUK | 10 | 10 / 40 / 90 / 250 | 1 in 10 |  |
| Frog | +10 Base MP | 6 | 6 / 24 / 54 / 150 | 1 in 333 |  |
| Bored Bean | +7 Base Damage | 7 | 7 / 28 / 63 / 175 | 1 in 250 |  |
| Slime | +2 Base WIS | 8 | 8 / 32 / 72 / 200 | 1 in 20 |  |
| Baby Boa | +1 Move Spd | 9 | 9 / 36 / 81 / 225 | 1 in 43 |  |
| Carrotman | +2 Base AGI | 10 | 10 / 40 / 90 / 250 | 1 in 50 |  |
| Glublin | +2% Total HP | 10 | 10 / 40 / 90 / 250 | 1 in 56 |  |
| Wode Board | +2 Base STR | 10 | 10 / 40 / 90 / 250 | 1 in 50 |  |
| Gigafrog | +5% Card Drop Chance | 10 | 10 / 40 / 90 / 250 | 1 in 100 |  |
| Poop | +10% Crystal Mob Spawn Chance | 10 | 10 / 40 / 90 / 250 | 1 in 16,667 |  |
| Rat | +1% Critical Chance | 10 | 10 / 40 / 90 / 250 | 1 in 20,000 |  |
| Walking Stick | +5 Base WIS | 10 | 10 / 40 / 90 / 250 | 1 in 16,667 |  |
| Nutto | +5% Money from Monsters | 10 | 10 / 40 / 90 / 250 | 1 in 20,000 |  |
| Crystal Carrot | +5% Total Drop Rate | 3 | 3 / 12 / 27 / 75 | 1 in 100 |  |
| Wood Mushroom | +5% Total Accuracy | 10 | 10 / 40 / 90 / 250 | 1 in 10,000 |  |

#### Yum Yum Desert

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Sandy Pot | +12% EXP Conversion from Talent | 10 | 10 / 40 / 90 / 250 | 1 in 100 |  |
| Mimic | +2% Total Drop Rate | 10 | 10 / 40 / 90 / 250 | 1 in 111 |  |
| Crabcake | +5% To not consume Food | 10 | 10 / 40 / 90 / 250 | 1 in 125 |  |
| Mafioso | +5 Base AGI | 10 | 10 / 40 / 90 / 250 | 1 in 143 |  |
| Sand Castle | +4% Total Accuracy | 10 | 10 / 40 / 90 / 250 | 1 in 167 |  |
| Pincermin | +1 Weapon Power | 10 | 10 / 40 / 90 / 250 | 1 in 200 |  |
| Mashed Potato | +3% Critical Damage | 10 | 10 / 40 / 90 / 250 | 1 in 250 |  |
| Tyson | +5 Base STR | 10 | 10 / 40 / 90 / 250 | 1 in 500 |  |
| Moonmoon | +8% Monster EXP While Active | 10 | 10 / 40 / 90 / 250 | 1 in 1,000 |  |
| Sand Giant | +2% Minimum Damage | 10 | 10 / 40 / 90 / 250 | 1 in 1,000 |  |
| Snelbie | +8% Card Drop Chance | 10 | 10 / 40 / 90 / 250 | 1 in 1,000 |  |
| Dig Doug | +6 Base LUK | 10 | 10 / 40 / 90 / 250 | 1 in 25 |  |
| Crystal Crabal | +2% EXP from monsters | 3 | 3 / 12 / 27 / 75 | 1 in 125 |  |
| Bandit Bob | +1% Money from Monsters | 1 | 1 / 4 / 9 / 25 | – |  |

#### Easy Resources

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Copper | +4 Base accuracy | 10 | 10 / 40 / 90 / 250 | 1 in 5,000 |  |
| Iron | +5% Total Mining Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 7,692 |  |
| Gold | +5% Mining EXP | 10 | 10 / 40 / 90 / 250 | 1 in 9,091 |  |
| Fire Forge | +4% Smithing EXP (Passive) | 10 | 10 / 40 / 90 / 250 | – | yes |
| Oak Tree | +3 Base Defence | 10 | 10 / 40 / 90 / 250 | 1 in 2,500 |  |
| Birch Tree | +5% Total Choppin Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 3,448 |  |
| Jungle Tree | +5% Choppin EXP | 10 | 10 / 40 / 90 / 250 | 1 in 4,762 |  |
| Forest Tree | +8% EXP Conversion from Talent | 10 | 10 / 40 / 90 / 250 | 1 in 5,882 |  |
| Goldfish | +3% Total MP | 10 | 10 / 40 / 90 / 250 | – |  |
| Hermit Can | +5% Total Fishing Efficiency | 10 | 10 / 40 / 90 / 250 | – |  |
| Jellyfish | +5% Fishing EXP | 10 | 10 / 40 / 90 / 250 | – |  |
| Flies | +4% Monster EXP While Active | 10 | 10 / 40 / 90 / 250 | 1 in 2,381 |  |
| Butterflies | +5% Total Catching Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 3,333 |  |

#### Medium Resources

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Plat | +2% Mining Away Gains | 10 | 10 / 40 / 90 / 250 | 1 in 12,500 |  |
| Dementia | +4% Mining Speed | 10 | 10 / 40 / 90 / 250 | 1 in 16,667 |  |
| Void | +6% Total Mining Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 16,667 |  |
| Lustre | +5% Mining Speed | 10 | 10 / 40 / 90 / 250 | 1 in 16,667 |  |
| Cinder Forge | +7% Smithing EXP (Passive) | 10 | 10 / 40 / 90 / 250 | – | yes |
| Palm Tree | +2% Choppin Away Gains | 10 | 10 / 40 / 90 / 250 | 1 in 9,091 |  |
| Toilet Tree | +4% Choppin Speed | 10 | 10 / 40 / 90 / 250 | 1 in 8,333 |  |
| Stump Tree | +3% Total Accuracy | 10 | 10 / 40 / 90 / 250 | 1 in 7,692 |  |
| Saharan Foal | +2.5% Choppin Away Gains | 10 | 10 / 40 / 90 / 250 | 1 in 10,000 |  |
| Wispy Tree | +6% Choppin Speed | 10 | 10 / 40 / 90 / 250 | 1 in 10,000 |  |
| Alien Tree | +8% Total Choppin Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 100,000 |  |
| Cubed Tree | +7% Choppin Speed | 10 | 10 / 40 / 90 / 250 | 1 in 25,000 |  |
| Bloach | +2% Fishing Away Gains | 10 | 10 / 40 / 90 / 250 | – |  |
| Skelefish | +8% Total Fishing Efficiency | 8 | 8 / 32 / 72 / 200 | – |  |
| Shark | +4% Fishing Speed | 10 | 10 / 40 / 90 / 250 | – |  |
| Manta Ray | +10% Fishing EXP | 10 | 10 / 40 / 90 / 250 | – |  |
| Kraken | +3% Fishing Away Gains | 10 | 10 / 40 / 90 / 250 | – |  |
| Sentient Cereal | +5% Catching EXP | 10 | 10 / 40 / 90 / 250 | 1 in 3,571 |  |
| Fruitflies | +2% Catching Away Gains | 10 | 10 / 40 / 90 / 250 | 1 in 4,000 |  |
| Mosquisnow | +7% Total Catching Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 4,000 |  |
| Flycicle | +2.5% Catching Away Gains | 10 | 10 / 40 / 90 / 250 | 1 in 4,000 |  |
| Bumble Bee | +8% Total Catching Efficiency | 10 | 10 / 40 / 90 / 250 | 1 in 20,000 |  |
| Forest Soul | +3% Defence from Equipment | 3 | 3 / 12 / 27 / 75 | – |  |
| Dune Soul | +4 Starting Pts in Worship | 3 | 3 / 12 / 27 / 75 | – |  |
| Rooted Soul | +6 Starting Pts in Worship | 3 | 3 / 12 / 27 / 75 | – |  |
| Frigid Soul | +7% Max Charge | 4 | 4 / 16 / 36 / 100 | – |  |
| Froge | +3% Shiny Critter Chance | 4 | 4 / 16 / 36 / 100 | – |  |
| Crabbo | +5% Trapping Efficiency | 4 | 4 / 16 / 36 / 100 | – |  |
| Scorpie | +5% Trapping EXP | 4 | 4 / 16 / 36 / 100 | – |  |
| Mousey | +5% Shiny Critter Chance | 4 | 4 / 16 / 36 / 100 | – |  |
| Owlio | +1.25% EXP from monsters | 4 | 4 / 16 / 36 / 100 | – |  |

#### Frostbite Tundra

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Sheepie | +3% Defence from Equipment | 11 | 11 / 44 / 99 / 275 | 1 in 100 |  |
| Frost Flake | +7 Base STR | 12 | 12 / 48 / 108 / 300 | 1 in 125 |  |
| Sir Stache | +9% Card Drop Chance | 13 | 13 / 52 / 117 / 325 | 1 in 250 |  |
| Bloque | +7 Base AGI | 14 | 14 / 56 / 126 / 350 | 1 in 500 |  |
| Mamooth | +3.5% Total HP | 15 | 15 / 60 / 135 / 375 | 1 in 1,000 |  |
| Snowman | +3% Total Damage | 15 | 15 / 60 / 135 / 375 | 1 in 2,000 |  |
| Penguin | +7 Base WIS | 15 | 15 / 60 / 135 / 375 | 1 in 3,333 |  |
| Thermister | +4% Critical Damage | 15 | 15 / 60 / 135 / 375 | 1 in 10,000 |  |
| Quenchie | +7 Base LUK | 17 | 17 / 68 / 153 / 425 | 1 in 10,000 |  |
| Cryosnake | +5% MP regen rate | 17 | 17 / 68 / 153 / 425 | 1 in 10,000 |  |
| Bop Box | +3.5% Total Drop Rate | 17 | 17 / 68 / 153 / 425 | 1 in 10,000 |  |
| Neyeptune | +5% Total Accuracy | 17 | 17 / 68 / 153 / 425 | 1 in 10,000 |  |
| Dedotated Ram | +2 Weapon Power | 20 | 20 / 80 / 180 / 500 | 1 in 10,000 |  |
| Xylobone | +1% Critical Chance | 15 | 15 / 60 / 135 / 375 | 1 in 100 |  |
| Bloodbone | +3% Total Damage | 15 | 15 / 60 / 135 / 375 | 1 in 10,000 |  |
| Crystal Cattle | +3% EXP from monsters | 10 | 10 / 40 / 90 / 250 | 1 in 125 |  |

#### Hard Resources

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Starfire | +8% Mining EXP | 12 | 12 / 48 / 108 / 300 | 1 in 33,333 |  |
| Dreadlo | +3% Mining Away Gains | 15 | 15 / 60 / 135 / 375 | 1 in 33,333 |  |
| Godshard | +30% Forge Cap and SPD (Passive) | 400 | 400 / 1600 / 3600 / 10000 | 1 in 500,000 | yes |
| Prehistrium | +5% Mining Away Gains | 5000 | 5000 / 20000 / 45000 / 125000 | 1 in 1,000,000 |  |
| Maple Tree | +3% Choppin Away Gains | 12 | 12 / 48 / 108 / 300 | 1 in 100,000 |  |
| Dandelioli Tree | +8% Choppin Speed | 15 | 15 / 60 / 135 / 375 | 1 in 200,000 |  |
| Bamboo | +10% Total Choppin Efficiency | 15 | 15 / 60 / 135 / 375 | 1 in 25,000,000 |  |
| Effervescent Eucalyptus | +4% Choppin Away Gains | 15 | 15 / 60 / 135 / 375 | 1 in 25,000,000 |  |
| Ancient Seaweed | +5% Choppin Away Gains | 1000 | 1000 / 4000 / 9000 / 25000 | 1 in 100,000,000 |  |
| Icefish | +15% Fishing EXP | 15 | 15 / 60 / 135 / 375 | – |  |
| Shellfish | +12% Total Fishing Efficiency | 18 | 18 / 72 / 162 / 450 | – |  |
| Jumbo Shrimp | +3.5% Fishing Away Gains | 24 | 24 / 96 / 216 / 600 | – |  |
| Caulifish | +7% Fishing Speed | 30 | 30 / 120 / 270 / 750 | – |  |
| Fairy | +4% Catching Speed | 10 | 10 / 40 / 90 / 250 | 1 in 50,000 |  |
| Scarab | +10% Total Catching Efficiency | 12 | 12 / 48 / 108 / 300 | 1 in 50,000 |  |
| Dust Mote | +3% Catching Away Gains | 15 | 15 / 60 / 135 / 375 | 1 in 50,000 |  |
| Ladybug | +5% Total Catching Efficiency | 15 | 15 / 60 / 135 / 375 | 1 in 200,000 |  |
| Firefly | +5% Catching Speed | 15 | 15 / 60 / 135 / 375 | 1 in 1,000,000 |  |
| Fractalfly | +8% Total Catching Efficiency | 1000 | 1000 / 4000 / 9000 / 25000 | 1 in 1,000,000 |  |
| Pingy | +6% Shiny Critter Chance | 5 | 5 / 20 / 45 / 125 | – |  |
| Bunny | +1% Skill AFK gain rate | 6 | 6 / 24 / 54 / 150 | – |  |
| Dung Beat | +7% Trapping Efficiency | 7 | 7 / 28 / 63 / 175 | – |  |
| Honker | +8% Trapping EXP | 9 | 9 / 36 / 81 / 225 | – |  |
| Blobfish | +8% Shiny Critter Chance | 12 | 12 / 48 / 108 / 300 | – |  |
| Tuttle | +15% Shiny Critter Chance | 50 | 50 / 200 / 450 / 1250 | – |  |
| Squishy Soul | +5% Charge Rate | 5 | 5 / 20 / 45 / 125 | – |  |
| Oozie Soul | +10% Max Charge | 7 | 7 / 28 / 63 / 175 | – |  |
| Breezy Soul | +7% Charge Rate | 7 | 7 / 28 / 63 / 175 | – |  |
| Deepsea Soul | +50 Starting Pts in Worship | 250 | 250 / 1000 / 2250 / 6250 | – |  |
| Fearful Tunnel | +4% Spelunking EXP | 100 | 100 / 400 / 900 / 2500 | 1 in 5,000 |  |
| Decaying Crevasse | +8% Spelunking Efficiency | 300 | 300 / 1200 / 2700 / 7500 | 1 in 12,500 |  |
| Buried Church | +2% Spelunking AFK Gain | 3000 | 3000 / 12000 / 27000 / 75000 | 1 in 33,333 |  |
| One Way Opening | +8% Spelunking EXP | 40000 | 40000 / 160000 / 360000 / 1e+06 | 1 in 200,000 |  |
| Plunder Cranny | +2% Spelunking AFK Gain | 150000 | 150000 / 600000 / 1.35e+06 / 3.75e+06 | 1 in 1,000,000 |  |
| Kelp Forest | +15% Spelunking EXP | 2.5e+06 | 2.5e+06 / 1e+07 / 2.25e+07 / 6.25e+07 | 1 in 3,333,333 |  |
| Burned Tunnel | +30% Spelunking EXP | 4e+06 | 4e+06 / 1.6e+07 / 3.6e+07 / 1e+08 | 1 in 5,000,000 |  |

#### Dungeons

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Poisonic Frog | +2 Base Dungeon MP | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Globohopper | +2% Block Chance | 2 | 2 / 8 / 18 / 50 | – |  |
| King Frog | +1.5 Base Dungeon Damage | 2 | 2 / 8 / 18 / 50 | – |  |
| Lava Slimer | +6% Dungeon Card Chance | 2 | 2 / 8 / 18 / 50 | – |  |
| Chromatium Frog | +2.5% Dungeon Credits | 3 | 3 / 12 / 27 / 75 | – |  |
| Eldritch Croaker | 20% to start with RNG orb (Passive) | 5 | 5 / 20 / 45 / 125 | – | yes |
| Grandfrogger | 15% to start with RNG orb (Passive) | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – | yes |
| Rotting Grandfrogger | +4% Dungeon Flurbos | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Forlorn Grandfrogger | +5% Dungeon Credits | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Vengeful Grandfrogger | +7% Dungeon Move Speed | 1 | 1 / 4 / 9 / 25 | – |  |
| Target | +2 Base Dungeon HP | 2 | 2 / 8 / 18 / 50 | – |  |
| Grumblo | +8% Dungeon Card Chance | 2 | 2 / 8 / 18 / 50 | – |  |
| Beefie | +6% Dungeon Money | 2 | 2 / 8 / 18 / 50 | – |  |
| Lazlo | +10% RNG item rarity | 2 | 2 / 8 / 18 / 50 | – |  |
| Cactopunk | +3% Dungeon Boss Dmg | 2 | 2 / 8 / 18 / 50 | – |  |
| Crescent Spud | +5% Dungeon MP regen | 5 | 5 / 20 / 45 / 125 | – |  |
| Snakenhotep | +4% Dungeon Drop Rate | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Enraged Snakenhotep | +5% Total Dungeon Dmg | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Inevitable Snakenhotep | +5% Dungeon Flurbos | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Ice Guard | +8% Dungeon MP regen | 8 | 8 / 32 / 72 / 200 | – |  |
| Glaciaxus | +15% Dungeon Card Chance | 2 | 2 / 8 / 18 / 50 | – |  |
| Golden Glaciaxus | +8% Dungeon Credits | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Caustic Glaciaxus | +8% Total Dungeon Dmg | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |

#### Bosses

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Glunko The Massive | +2 Weapon Power | 2 | 2 / 8 / 18 / 50 | 99% |  |
| Baba Yaga | +10% Money from Monsters | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 33 |  |
| Dr Defecaus | +5% Total Damage | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 33 |  |
| Boop | +1% Fighting AFK gain rate | 1 | 1 / 4 / 9 / 25 | 1 in 667 |  |
| Amarok | +2.5% Skill AFK gain rate | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 25 |  |
| Chaotic Amarok | +2.5% Fighting AFK gain rate | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 50 |  |
| Radiant Amarok | +3 Weapon Power | 10 | 10 / 40 / 90 / 250 | 1 in 50 |  |
| Biggie Hours | +3% Double AFK claim chance | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 42 |  |
| King Doot | +6% Total Drop Rate | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 25 |  |
| Efaunt | +5% EXP from monsters | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 40 |  |
| Chaotic Efaunt | +3.75% Skill EXP | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 62 |  |
| Gilded Efaunt | +15 Star Talent Pts (Passive) | 11 | 11 / 44 / 99 / 275 | 1 in 50 | yes |
| Dilapidated Slush | +12% Money from Monsters | 5 | 5 / 20 / 45 / 125 | 1 in 5 |  |
| Chizoar | +8% Cog Build Spd (Passive) | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 143 | yes |
| Chaotic Chizoar | +5% Shrine Effects (Passive) | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 250 | yes |
| Blighted Chizoar | +1.5% All Stat | 12 | 12 / 48 / 108 / 300 | 1 in 500 |  |
| Mutated Mush | +6% Cooking EXP gain | 5 | 5 / 20 / 45 / 125 | 1 in 5 |  |
| Massive Troll | +6% Kitchen Speed (Passive) | 2 | 2 / 8 / 18 / 50 | 1 in 250 | yes |
| Chaotic Troll | +10% All Skill Efficiency | 2 | 2 / 8 / 18 / 50 | 1 in 500 |  |
| Blitzkrieg Troll | +7% Total Damage | 4 | 4 / 16 / 36 / 100 | 1 in 333 |  |
| Domeo Magmus | +1.5% Total Drop Rate (Passive) | 4 | 4 / 16 / 36 / 100 | 1 in 1,000 | yes |
| Kattlekruk | +6% Sailing Speed (Passive) | 3 | 3 / 12 / 27 / 75 | 1 in 1,250 | yes |
| Chaotic Kattlekruk | +8% EXP from monsters | 4 | 4 / 16 / 36 / 100 | 1 in 1,250 |  |
| Sacrilegious Kattlekruk | +18% Money from Monsters | 5 | 5 / 20 / 45 / 125 | 1 in 1,250 |  |
| Demented Spiritlord | +2.5% Fighting AFK gain rate | 5 | 5 / 20 / 45 / 125 | 1 in 1,000 |  |
| Emperor | +12% Total Drop Rate | 6 | 6 / 24 / 54 / 150 | 1 in 1,000 |  |
| Chaotic Emperor | +8% Total Damage Multi | 9 | 9 / 36 / 81 / 225 | 1 in 2,000 |  |
| Sovereign Emperor | +20% Multikill per tier | 13 | 13 / 52 / 117 / 325 | 1 in 10,000 |  |
| Verminous | +1% Masterclass Drops (Passive) | 1e+08 | 1e+08 / 4e+08 / 9e+08 / 2.5e+09 | 1 in 10,000,000 | yes |

#### Events

| Card | Effect (per level) | perTier | Copies for Lv 2 / 3 / 4 / 5 (more than) | Base drop | Passive |
|---|---|---|---|---|---|
| Ghost | +3% Monster EXP While Active | 2 | 2 / 8 / 18 / 50 | 1 in 20 |  |
| Giftmas Blobulyte | +3% Total Drop Rate | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Meaning of Giftmas | +3% Money from Monsters | 1.5 | 1.5 / 6 / 13.5 / 37.5 | 1 in 20 |  |
| Valenslime | +3% Defence from Equipment | 2 | 2 / 8 / 18 / 50 | 1 in 12 |  |
| Loveulyte | +5% Total HP | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Chocco Box | +4% Boost Food Effect | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Giant Rose | +3% EXP from monsters | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Floofie | +3% MP regen rate | 3 | 3 / 12 / 27 / 75 | 1 in 20 |  |
| Shell Snake | +3 Base LUK | 3 | 3 / 12 / 27 / 75 | 1 in 20 |  |
| Egggulyte | +1% Card Drop Chance | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Egg Capsule | +1% Critical Damage | 1.5 | 1.5 / 6 / 13.5 / 37.5 | – |  |
| Plasti Doug | +2 Base Defence | 4 | 4 / 16 / 36 / 100 | 1 in 33 |  |
| Mr Blueberry | +3% Total Drop Rate | 4 | 4 / 16 / 36 / 100 | 1 in 33 |  |
| Coastiolyte | +1% Fishing Away Gains | 8 | 8 / 32 / 72 / 200 | 1 in 20 |  |
| Summer Spirit | +4% Catching EXP | 8 | 8 / 32 / 72 / 200 | – |  |
| Golden Giftmas Box | +3% Defence from Equipment | 1 | 1 / 4 / 9 / 25 | – |  |
| Bubbulyte | +2% Class EXP (Passive) | 1 | 1 / 4 / 9 / 25 | – | yes |
| Spring Splendor | +2% All Skill EXP (Passive) | 1 | 1 / 4 / 9 / 25 | – | yes |
| Falloween Pumpkin | +4 Star Talent Pts (Passive) | 3 | 3 / 12 / 27 / 75 | – | yes |
| IdleOn 4th Anniversary | +2% Drop Rate (Passive) | 4 | 4 / 16 / 36 / 100 | – | yes |
| Bort The Cornhusk | +4% Gold Food Effect (Passive) | 6 | 6 / 24 / 54 / 150 | – | yes |
| Big Ol Giftmas Box | +2% Catching Away Gains | 1 | 1 / 4 / 9 / 25 | ? |  |
| Luckulyte | +3% Drop Rate (Passive) | 5 | 5 / 20 / 45 / 125 | – | yes |
| Potluck | +4% Money from Monsters | 5 | 5 / 20 / 45 / 125 | – |  |
| IdleOn 5th Anniversary | +5% Gold Food Effect (Passive) | 6 | 6 / 24 / 54 / 150 | – | yes |


## Appendix B: Obol catalog (standard families)

From TB `data/website-data/items.json` @6827d3f (H). The skill obols (Mining, Choppin, Fishing, Catching) also carry **Skill Power** 1 / 2 / 3 / 4 by rarity, from Bronze to Platinum. Toolbox's item table does not hold it; the figures are from the [wiki](https://idleon.wiki/wiki/Obols) (M). Boss and special obols are listed under Obols § Inputs. Hyper obols: circle 4% DR, 2% all stats, 3% damage or 2% multikill per tier; square 10%, 5%, 12% or 6%. They come from the Gem Shop.

| Family | Bronze | Silver | Gold | Platinum | Dementia |
|---|---|---|---|---|---|
| STR | Circle: STR 1 | Circle: STR 2 | Circle: STR 4 | Circle: STR 7 | Square: STR 12, WP 1 |
| AGI | Circle: AGI 1 | Circle: AGI 2 | Circle: AGI 4 | Circle: AGI 7 | Square: AGI 12, WP 1 |
| WIS | Circle: WIS 1 | Circle: WIS 2 | Circle: WIS 4 | Circle: WIS 7 | Square: WIS 12, WP 1 |
| LUK | Circle: LUK 1 | Circle: LUK 2 | Circle: LUK 4 | Circle: LUK 7 | Square: LUK 12, WP 1 |
| Damage | Circle: 5 base damage | Circle: STR 1, AGI 1, WIS 1, 10 base damage | Circle: STR 1, AGI 1, WIS 1, WP 1, 20 base damage | Square: STR 2, AGI 3, WIS 3, LUK 3, WP 2, 50 base damage | Hexagon: STR 5, AGI 5, WIS 5, LUK 5, WP 3, 100 base damage |
| Pop | Circle: LUK 1, DEF 1, 2% drop rate | Circle: LUK 3, DEF 2, 3% drop rate | Square: LUK 6, DEF 3, 4% drop rate | Hexagon: LUK 9, DEF 4, 6% drop rate | Sparkle: LUK 12, DEF 5, 9% drop rate |
| Sixes (Luck) | – | Square: LUK 2, 5% drop rate | Square: LUK 3, 7% drop rate | Hexagon: LUK 5, 10% drop rate | Sparkle: LUK 7, 15% drop rate |
| Cards | Circle: 1% card drop chance | Square: STR 1, AGI 1, WIS 1, 3% card drop chance | Hexagon: STR 2, AGI 2, WIS 2, 5% card drop chance | Hexagon: STR 3, AGI 3, WIS 3, 7% card drop chance | Sparkle: STR 5, AGI 5, WIS 5, WP 1, 10% card drop chance |
| Multikill | Circle: 1% multikill | Circle: 2% multikill | Square: WP 1, 3% multikill | Hexagon: WP 1, 5% multikill | Sparkle: WP 2, 10% multikill |
| Experience | Circle: 1% xp from monsters | Circle: STR 1, AGI 1, WIS 1, 1% xp from monsters | Square: STR 2, AGI 2, WIS 2, 2% xp from monsters | Hexagon: STR 3, AGI 3, WIS 3, 3% xp from monsters | Sparkle: STR 5, AGI 5, WIS 5, WP 1, 4% xp from monsters |
| Money | – | Square: 6% money | Square: 10% money | – | – |
| Defence | Circle: DEF 1 | Circle: DEF 3 | Square: DEF 6 | Hexagon: DEF 15 | Sparkle: DEF 25 |
| Mining | Circle: skill power only | Circle: STR 1 | Square: STR 2 | Hexagon: STR 3, 2% mining efficincy | Sparkle: STR 5, 8% mining efficincy |
| Choppin | Circle: skill power only | Circle: WIS 1 | Square: WIS 2 | Hexagon: WIS 3, WP 4, 2% chop efficiency | Sparkle: WIS 5, WP 5, 8% chop efficiency |
| Fishing | Circle: skill power only | Circle: STR 1 | Square: STR 2 | Hexagon: STR 3, 2% fishin efficincy | Sparkle: STR 5, 8% fishin efficincy |
| Catching | Circle: skill power only | Circle: AGI 1 | Square: AGI 2 | Hexagon: AGI 3, 2% catch efficincy | Sparkle: AGI 5, 8% catch efficincy |
| Trapping | Circle: WP 1 | Circle: AGI 1, WP 2 | Square: AGI 2, WP 3 | Hexagon: AGI 3, WP 5 | Sparkle: AGI 5, WP 7 |
| Construction | Circle: 1% build spd | Circle: STR 1, 2% build spd | Square: STR 2, 5% build spd | Hexagon: STR 3, 12% build spd | Sparkle: STR 5, 20% build spd |
| Worship | Circle: WP 1 | Circle: WIS 1, WP 2 | Square: WIS 2, WP 3 | Hexagon: WIS 3, WP 5 | Sparkle: WIS 5, WP 7 |


## Sources

All accessed 2026-10-17 unless noted.

**Tier 1, game code and data**

- N.js, `https://www.legendsofidleon.com/ytGl5oc/N.js` (Last-Modified 2026-10-17 01:42 GMT, v1.23). Symbols used: `"CardLv"` @4079185, `"CardChanceMulti"` @4055229, `LootDropOddsReset` @6512451, fishing card odds @3814937, trapping card odds @8036646, worship card odds @7589965, dungeon cards @4605700, `CardStuff` @14382220, `CardPreset` init @6226156, card slot count `4+GemItemsPurchased[63]`, `_customEvent_AlchShopPurchase` @6048083, obol drop-table injection @6519079, Obol Altar NPC gate @13746496, `addDialogueFor("Obol_Altar")` @15308642, `AccountWideQuests` @14925060, combine logic @6762045, `ObolRerollCostMoney` and `ObolRerollCostFrag`, destroy-for-fragments @8331721 and @8356901, Menagerie fragment sinks @8618198 and @12471166, the v1.23 patch-notes string.
- IdleOn Toolbox @ [6827d3f](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1) (2026-10-17, gameVer 2.3.540):
  - [`parsers/cards.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/cards.ts), [`parsers/cardMath.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/cardMath.ts), [`parsers/obols.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/obols.ts), [`parsers/character.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts) L407-449
  - [`utility/dashboard/characters.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js) (`obolsAlerts` L127, `cardsAlert` L340), [`utility/dashboard/account.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js) L249-256
  - `data/website-data/`: [`cards.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/cards.json), [`monsterDrops.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/monsterDrops.json), [`items.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/items.json), [`gemShop.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/gemShop.json), [`shared-data.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json) (`cardSets`, `obols`, `liquidsShop`, `merits`, `bribes`, `guildBonuses`), [`stamps.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/stamps.json), [`vials.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/vials.json), [`cauldrons.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/cauldrons.json), [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/talents.json)

**Tier 2, wiki** (page edits are bot or layout work; the prose may predate them)

- [Cards](https://idleon.wiki/wiki/Cards) (last edit 2026-10-12): presets at Lv 15, the set-tier explanation, per-level increments.
- [Obols](https://idleon.wiki/wiki/Obols) (2026-10-07): Amarok gate, the reroll roll table, combine fragment and coin costs, Golden Obolen, sources per obol.
- [Obol Altar](https://idleon.wiki/wiki/Obol_Altar) (2026-09-27).
- [Alchemy](https://idleon.wiki/wiki/Alchemy): Liquid Shop costs and the daily reset.
- [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026): v1.08 2026-03-13 card drop buff, v1.07 card UI, v1.18 6★ Cardifiers. The v2.03 2024-03-08 preset cloud-save is on [Changelog/2024](https://idleon.wiki/wiki/Changelog/2024).
- **Possibly outdated:** none of these pages covers v1.23. I found no v1.23 change to W1–W3 cards or obols in the N.js patch notes.

**Tier 3, community (opinion; flagged O)**

- AutoReview [`progression_tiers.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/main/mysite/consts/progression_tiers.py) (gem shop tiers, obol slot levels), [`general/cards.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/main/mysite/general/cards.py) (card drop groups), `consts_w2.py` `obols_max_bonuses_dict`. Main @05ac449, 2026-09-23. No licence: cite only.
- shnaps' [progression gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa) (rev. 2026-09-18): "Key cards & stamps", "Obols", W2 merit priority, late card picks.
- r/idleon via the Arctic Shift API: [Why do people prefer pop obol? (2025-03-25)](https://reddit.com/r/idleon/comments/1jjrznl/why_do_people_prefer_pop_obol/), [When should I start obol farming? (2025-10-09)](https://reddit.com/r/idleon/comments/1o2djl4/when_should_i_start_obol_farming/). I found others but could not read them because of rate limits: [Is this still the best lazy obol setup? (2026-07-12)](https://reddit.com/r/idleon/comments/1uudu00/just_checking_is_this_still_the_best_lazy_obol/) and [Card Preset Labels/Naming (2026-04-29)](https://reddit.com/r/idleon/comments/1syjnwp/card_preset_labelsnaming/). **A human pass on the 2026-07 obol thread is advised.**

**Fixtures:** `fixtures/private/yasser.parsed.json` (W2) and `joseph.parsed.json` (W3), used only for field names and the aggregate counts above.
