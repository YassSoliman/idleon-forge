# Priority verification: the System Dossiers' priority orders against community Sources (2026-10-17)

Ticket: [#27](https://github.com/YassSoliman/idleon-forge/issues/27), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). It blocks the synthesis ticket [#26](https://github.com/YassSoliman/idleon-forge/issues/26). Precedence follows [ADR 0004](../adr/0004-source-precedence.md). Terms follow [GLOSSARY.md](../../GLOSSARY.md).

**This doc is an overlay.** It does not edit the eight dossier branches. Where a row here says *corrected*, the Knowledge Base takes this doc's order over the dossier's. Where it says *contested*, the Knowledge Base stores both orders, labelled as opinion.

**Current patch:** v1.23 "Lumi Menagerie" (2026-10-16/17). Royal Guardian (the Divine Knight master class) shipped 2026-08-25. Every community Source below is dated. Anything from before 2026-08-25 is flagged pre-RG wherever roster advice is involved.

## Answer

- **Sub Class Swap Token vs "2 Royal Guardians": the swap advice in `character-builds` is corrected.** Post-RG Reddit (2026-09-02 → 10-14) calls Royal Guardian "without a doubt the best class to have 2 of", and the 2nd Squire is the builder that becomes the 2nd RG. Commenters even swap *towards* a 2nd Squire/DK/RG with the token, never away from one. The dossier's case also has a wrong premise. The W3 fixture account already has a Barbarian. What it lacks is a **Hunter**, and the token cannot make one, because it only swaps within a base class (Squire ↔ Barbarian). **Ruling: keep both Squires, do not buy the token, and make a Hunter the next new character.** Details are in the adjudication section below.
- **"One of each subclass first" is confirmed** (Reddit 2026-09-22, "Your first priority is one of each subclass"; Idleon Academy 2025-09; Iacchus 2025-07). The duplicate slots are 2nd Squire → DK → RG first. 2nd Arcane Cultist and 2nd Death Bringer are argued both ways. 2nd Siege Breaker and 2nd Elemental Sorcerer are "deprecated" (2026-09-13). 2nd Voidwalker is useless (2026-10-08). The 11th slot stays a Beginner.
- **Three orders are corrected outright:**
  - **Refinery:** rank **Redox and Dioxide** (the first salt on each page) highest, with auto-refine *off* on them. The dossier named Explosive instead of Dioxide (Reddit 2026-06-07, 08-16, 09-22; gist 2026-09-18).
  - **Equinox:** **Liquidvestment** comes right after Dreams and Resources, and before Matching Scims. **Never put points into Food Lust or Laboratory Fuse** (Reddit 2026-09-30, 10-14; AutoReview marks both Optional; Incomplete Guide: Lab Fuse "NOT RECOMMENDED"). The W3 dossier recommended both for W4.
  - **Merit Shop:** in W1, Hemoglobin gets 3 points at once, then the Amarok gear. In W2, AFK gains for all characters comes 2nd and boss gems 4th. In W4, Spice Spillage ×1 comes first, then NBLB, then Egg Capacity before Lab range (Incomplete Guide merit lists).
- **Two orders get corrected against AutoReview, tier 3:**
  - **Construction buildings:** Cost Cruncher and Automation Arm are SS-tier next to the 3D Printer. Pulse Mage and Fireball Lobber are D-tier, needed only at low levels for the Hoggindaz quests.
  - **Sigil boosts:** AutoReview's first boosts are Envelope Pile, Odd Literature, Big Muscle and Pumped Kicks. The dossier skipped Big Muscle and Pumped Kicks and put Trove early.
- **The Gem Shop first buy is contested.** The dossier says Infinity Hammer is "the universal first buy". AutoReview (S tier) and the gist (2026-09-18) agree. Two 2026-10 Reddit answers put the **Crystal 3D Printer and card slots first** and call the hammer "not necessary nowadays". Ivory Bubble Cauldrons are only **D tier** in AutoReview, so they move well below Bleach Liquid Cauldrons.
- **The pusher is still contested.** For W1–W3, some Sources say Barbarian (Academy; Reddit 2026-06-27 and 08-06) and others say Squire (Incomplete Guide, gist). From W4 it is DK vs ES, by damage (Reddit 2026-07-01). The cross-cutting consensus is **push portals with one character until about W5/W6, then go back for Systems** (Reddit 2026-06-24, 06-27, 07-21). It reframes the "per-world system" orders as things to do *while* pushing, not gates on pushing.
- **Confirmed by current Sources:**
  - Anvil all into speed.
  - Owl: always buy Bonuses, and reset or mega-reset whenever possible.
  - Death Note is mandatory in W3.
  - Wax skull and traps for every character.
  - Killer's Brightside first in the Lab, and Gobo first in W4.
  - Obols: drop rate first.
  - Statues: deposit everything except the Power (and Kapow) statues once Onyx is the Goal.
  - Post Office: the character's class/skill boxes first.
  - Shiny-speed pets first.
  - Arcade: Gold Ball Gain first.
  - Hydrogen first in the Atom Collider.
  - DK/ES first among the elites.
  - Pets: Sheepie, Ram and Mr Pig as top value.
- **Many orders are unverified.** No dated community Source states them, so they stay dossier reasoning (L/O). This covers the Guild leader order, the Upgrade Vault table order, the per-stage card lists, the Salt Lick order, the W4 jewel order and the cooking discovery order. The synthesis should keep their low confidence.
- **Discord pins are not covered here.** The orchestrator is reading them through the user's browser and will append them below.

## Result legend and method

- **confirmed:** a dated Source from 2026 (or a tier-1/2 Source) states the same order.
- **corrected:** a Source states a different order and nothing current contradicts it. The corrected order is given.
- **contested:** Sources disagree. Both sides are cited.
- **unverified:** no community Source states an order for this. It remains the dossier's own reasoning.

Sources, in precedence order (ADR 0004):

1. **AutoReview** `mysite/consts/progression_tiers.py` (beta, commit `05ac449`, 2026-09-23; pre-v1.23). It is community-curated tiers over game data, so tier 3, but it is the most systematic one.
2. **Reddit r/idleon**, read through the [Arctic Shift](https://arctic-shift.photon-reddit.com/) archive. I pulled every post from 2026-06-01 to 2026-10-17 (3,270 posts) with a plain date-window listing. Full-text search timed out (HTTP 422) under load, so I filtered the titles locally. Then I read the comments of 80 relevant threads by `link_id`, sleeping 3–6 s between calls and backing off 60 s on 422.
3. **Community sheets and guides:**
   - The "Idleon Incomplete Guide" by shadowstorm2204, W1–W4 tabs read as CSV on 2026-10-17. It is undated, post-W7 and pre-RG.
   - shnaps' progression gist, last updated 2026-09-18 and post-RG.
   - Idleon Academy (Nekow, 2025-09-23) and Iacchus's class sheet (2025-07-06), both as summarised on `research/community-guides`.

Reddit dates below are comment dates. Links go to the thread, or to `thread/comment/<id>`.

## Adjudication: Sub Class Swap Token vs "2 Royal Guardians"

**The claim.** `character-builds` (Talent resets and class swaps, rule 4, L for advice) says to use one Sub Class Swap Token to turn "the extra Squire into a Barbarian" on an account with two Squires, citing the W3 fixture account. The same dossier's Squire note says a second Squire "does cost the Barbarian's fishing and ZOW roles". The construction and W4 dossiers say the opposite: two Squires/DKs is the builder meta.

**What the Royal Guardian era Sources say (all dated after 2026-08-25):**

| Date | Source | Says |
|---|---|---|
| 2026-09-02 | [1w59vpd](https://www.reddit.com/r/idleon/comments/1w59vpd/comment/p7dct62/) (top answer) | A player with 3 DB / 1 RG is told to "change a DB to a RG using class reset token, keep 11th as beginner". [p7dw1h0](https://www.reddit.com/r/idleon/comments/1w59vpd/comment/p7dw1h0/): "2 RG was choice prior to update, having 2 squires boosts construction significantly." [p7jm0t0](https://www.reddit.com/r/idleon/comments/1w59vpd/comment/p7jm0t0/): "The 2nd RG is more about having a second squire for construction. Which even in w7 is still a relevant skill" |
| 2026-09-05 | [1w7xfz2](https://www.reddit.com/r/idleon/comments/1w7xfz2/) | Every reply keeps 2 DK → 2 RG. They differ only on 2nd AC vs 2nd DB and on leaving 1–2 Beginners |
| 2026-09-12 | [1welinx "Two Royal Guardians"](https://www.reddit.com/r/idleon/comments/1welinx/) | Passive RG talents 1, 2 and 6 work from the 2nd RG, so one RG plays active while the other boosts collection |
| 2026-09-13 | [1we5y9c](https://www.reddit.com/r/idleon/comments/1we5y9c/comment/p9nvb0c/) | "you won't regret picking a Royal Guardian (Divine Knight)… second Siege Breaker or second Elemental Sorcerer are deprecated"; [p9b7knl](https://www.reddit.com/r/idleon/comments/1we5y9c/comment/p9b7knl/): "You want 2 DK/RG because construction is very important" |
| 2026-09-22 | [1wnq6ay "Squire or barbarian?"](https://www.reddit.com/r/idleon/comments/1wnq6ay/comment/pbgy0ai/) | A player who already has a Barbarian asks which to make. Answer: "Yes, squire. Your first priority is one of each subclass." [pbh9na5](https://www.reddit.com/r/idleon/comments/1wnq6ay/comment/pbh9na5/): the token exists, but "it would be better to not rely on this" |
| 2026-10-02 | [1ww0c2u](https://www.reddit.com/r/idleon/comments/1ww0c2u/comment/pdivfke/) | "Royal Guardian is without a doubt the best class to have 2 of, and it's not even close. They were the best class to have 2 of before they even got their masterclass." Also: RG talent points are scarce, so 2 RGs split active and passive roles |
| 2026-10-09 / 10-14 | [1x15zur](https://www.reddit.com/r/idleon/comments/1x15zur/comment/pgt4fkh/) | "ATM 2 DK are kinda busted"; "After you more or less complete Blood berserker, you definitely need to use subclass token to swap one to another DK/RG. You'll get lots of construction gain, and is pretty much necessary for RG" |
| 2026-09-18 | [shnaps gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa) | Slot 8 = "2nd Squire → Divine Knight"; "Cap Divine Knights at 2"; "Both DKs later become Royal Guardians" |
| 2025-07-06 (pre-RG) | Iacchus "Recommended Class Setups" | 8th slot = 2nd DK, "will heavily benefit Construction" |

**Facts that decide it:**

- The token only swaps a subclass to its sibling: 8 ↔ 9 (Barbarian ↔ Squire), 20 ↔ 21, 32 ↔ 33 (`character-builds`, from N.js `ClassSwap`, H). It cannot add a missing class line from another base class.
- The W3 fixture account's six characters are Wizard, Squire, Bowman, Squire, Barbarian and Shaman (class composition only, read from `characters[].class`). **It already has a Barbarian. Its missing subclass is Hunter**, an Archer line. The dossier's "a Squire and a Barbarian" premise does not match the save. Swapping a Squire would give two Barbarians and still no Hunter.
- Family bonuses take the best character per class line, so a duplicate adds nothing there (`account-wide`, H). The second Squire's value is Construction build rate and, later, the 2nd RG. That is exactly what the community values.

**Ruling (corrected):**

1. Do **not** spend 500 gems on a Sub Class Swap Token on an account whose duplicate is a Squire. Two Squires → two DKs (W4) → two RGs (W7-level) is the consensus duplicate, post-RG.
2. The real gap on the W3 fixture account is the **Hunter** (Trapping specialty, Eagle Eye, the W4 Beast Master and Breeding, the Wind Walker master line). Make it as the **next new character** (slot 7). The Journeyman then goes in slot 8. This bends the "Journeyman 7th" rule, which assumes the first six are already distinct. Academy, Iacchus and the 2026-09-22 thread all put "one of each subclass" ahead of slot order.
3. The swap token is only the right tool when the duplicate is one *Squire wanted, Barbarian present twice*, for example a 2nd Barbarian that should become the 2nd Squire/DK/RG (the 2026-10-14 advice). Its sibling-only rule must be checked against the account's actual class list before it is ever suggested. Course Correction should read `characters[].class`, not a template.
4. Note for #26: `account-wide/companions-guild-family` says "Only make it for a non-family reason, such as a second Barbarian for fishing". The community's non-family reason is a second **Squire** for Construction. Treat that sentence as corrected.

## Tables per dossier

### 1. character-builds (`origin/research/character-builds`)

| # | Claim (dossier, confidence) | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 1.1 | Wrong-subclass fix: swap the extra Squire to Barbarian with a Sub Class Swap Token (L advice) | **corrected** | See the adjudication above: Reddit 2026-09-02 → 10-14, gist 2026-09-18 | Keep 2 Squires (→ 2 DK → 2 RG). Make the missing subclass as a new character. Use the token only within a base class, and only towards a 2nd Squire |
| 1.2 | A second Squire "costs the Barbarian's fishing and ZOW roles" (L) | **corrected** | Same; fixture class list | Only true if the account has no Barbarian. The W3 fixture has one |
| 1.3 | Presets: preset A fighting, preset B the class's Skilling job (H mechanics; order M) | **confirmed** | Reddit [1uimple](https://www.reddit.com/r/idleon/comments/1uimple/comment/ouh6i2n/) 2026-06-29: "You want one combat preset and one skilling preset … that should never happen early on when you're so starved for points"; gist 2026-09-18 | n/a |
| 1.4 | Build core: Gilded Sword → Sharpened Axe → 50 in the AFK-fighting talent (Sir_Grimtide, Toolbox builds 2026-10) | **unverified** | No independent 2026 Reddit build order found. The Source itself is dated 2026-10 and current | Keep as tier 3, dated |
| 1.5 | Stat talents: main stat; accuracy stat only to 100% hit (H formula) | **confirmed** | Reddit [1wefifx](https://www.reddit.com/r/idleon/comments/1wefifx/comment/p9di7kp/) 2026-09-12 (DK talent needs 1.5× accuracy); gist (Precision Power needs 1.5×) | n/a |
| 1.6 | Star signs: A-2 → Chronus Cosmos first; then Hydron (L synthesis) | **unverified** | Reddit [1v7nja9](https://www.reddit.com/r/idleon/comments/1v7nja9/) 2026-07-26: "the most important thing is making sure you actually unlock them all"; Infinite Stars (Rift/shiny) later makes them moot | Not contradicted. Add "unlock every sign" as the standing Goal |
| 1.7 | Gear: W2 Platinum → Dementia → Efaunt; W3 Void → Chizoar (M) | **contested** | Incomplete Guide W1 tab: the Amarok set is used "until late w5 or even world 6"; Reddit [1vpxose](https://www.reddit.com/r/idleon/comments/1vpxose/comment/p44lrhn/) 2026-08-16 ("you can push all the way to w6 in amarok … recraft … use w6 stones") and [1v2eoid](https://www.reddit.com/r/idleon/comments/1v2eoid/comment/oyvgj5b/) 2026-07-21 ("switch back to full amarok with latest world stones") | Community: keep Amarok armor (set bonus, accuracy) with the newest stones, and build *sets* for their permanent bonus. Weapons and tools still follow the tier ladder. The dossier's armor ladder is the alternative view |
| 1.8 | Food: golden foods stacked; health food plus potions on fighters (H) | **confirmed** | Incomplete Guide W2/W4 ("equip potions on your main pusher"; W4 shop potions); Reddit 1vpxose 2026-08-16 | n/a |

### 2. cards-obols (`origin/research/cards-obols`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 2.1 | Early W1: 4 cards on every character; Blunder Hills set; base-damage/stat cards (O order) | **unverified** | No 2026 community card-order post for W1–W3 | Keep as reasoning |
| 2.2 | W2: Easy Resources set on every skiller; Yum Yum on fighters (O) | **unverified** | none found | Keep |
| 2.3 | W4+: gist picks, damage Chaotic Emperor > Doodlefish > Dr Defecaus; skilling Amarok > Chocco > Chaotic Troll (O) | **confirmed** (as the gist's) | [gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa) 2026-09-18, "Cards — damage / Skilling" | Single Source, W5+ cards |
| 2.4 | Card slots outrank card presets (O, AutoReview) | **confirmed** | AutoReview gem tiers: Extra Card Slot ×4 in S; Card Presets only at "Practical Max" | n/a |
| 2.5 | Obols: buy the W2 obol merit first; fill family slots first; any stat beats empty (O) | **confirmed** | Incomplete Guide W2 merit #1 ("One point into obols makes it possible for them to drop at all"); gist ("W2 Obol Drop Rate (1pt)"); Reddit [1uf24j9](https://www.reddit.com/r/idleon/comments/1uf24j9/comment/otofnsx/) 2026-06-25 ("some stat is better than no stat") | n/a |
| 2.6 | Mid W2: Bronze/Silver Pop at Gigafrog, reroll-then-combine (O) | **confirmed** | Reddit 1uf24j9 2026-06-25/30 ("Re-roll the bronze to +3 drop rate. Then combine…"; farm Gigafrogs on an Elemental Sorcerer) | Note: the community farms Gigafrog actively on ES, which is a W4+ class |
| 2.7 | W4+: drop-rate obols; skill/money obols can beat DR for some jobs (O, gist) | **contested** | Reddit [1uudu00](https://www.reddit.com/r/idleon/comments/1uudu00/comment/ox2ux1a/) 2026-07-12: "Just stick with drop rate obols. Drop rate is king" vs [ox2kb0v](https://www.reddit.com/r/idleon/comments/1uudu00/comment/ox2kb0v/): mining/chopping sets "much further down the road" | DR for ~90% of the game. Skill sets only late (atoms) |

### 3. W1 Systems (`origin/research/w1-systems`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 3.1 | Anvil: all points into Speed; produce Thread (community consensus) | **confirmed** | Incomplete Guide W1 ("investing ALL your points into speed"); AutoReview smithing tiers | The dossier's Capacity-if-it-fills counterpoint stays as a rule |
| 3.2 | Bribes: Insider Trading first, then the rest of set 1; buy each set as it opens (M) | **confirmed** | AutoReview `bribes_progressionTiers` lists Insider Trading first in tier 1 | n/a |
| 3.3 | Forge: New Forge Slot and Speed first, then Capacity; always smelting (L) | **unverified** | Incomplete Guide only says "always have ores smelting" | Keep |
| 3.4 | Owl: buy Feather Generation → Multiplier/Cheapener → Bonuses of Orion; restart whenever possible | **confirmed** | Incomplete Guide W1 tips: "Always buy Bonuses / Do normal resets everytime you can / Do Mega Reset everytime you can / Never stop farming more Fractal Feathers"; AutoReview owl tiers (MF 1/9/17/24) | n/a |
| 3.5 | Post Office: Civil War → main skill box → Civil War; first 25 boxes into the skill box (wiki "usual orders") | **confirmed** | Reddit [1tyi01h](https://www.reddit.com/r/idleon/comments/1tyi01h/comment/oq3xa0r/) 2026-06-06 ("Focus on class ones first … don't worry about spending them wrong"; "200 in combat, then 200 or 400 in the main skills, then 400 in combat again"); gist ("skill-specific boxes first") | n/a |
| 3.6 | Stamps: carry stamps first in late W1/W2; then Anvil Zoomer, Fishing Rod, Catch Net (L) | **unverified** | Reddit 2026-07-25 [1v627db](https://www.reddit.com/r/idleon/comments/1v627db/comment/oznbk4x/): "level up your stamps … You can do pretty much everything with stamps" (generic) | Keep |
| 3.7 | Statues: Power first before Gold; Gold in cost order; W4+ hold Power for Onyx, deposit the rest | **confirmed** | Reddit [1tuusil](https://www.reddit.com/r/idleon/comments/1tuusil/comment/opcd9eb/) 2026-06-02 ("Except POW statue … deposit all"); [opccbrj](https://www.reddit.com/r/idleon/comments/1tuusil/comment/opccbrj/) ("The only one you want to hold onto is the kapow statue"); [1uerrg9](https://www.reddit.com/r/idleon/comments/1uerrg9/comment/otmrt7f/) 2026-06-24 (also hold Kapow, Box, Twosoul; rare drops) | Add Kapow (and the rare W3 Box/Twosoul) to the "hold back" list |
| 3.8 | Amarok: Dog Bone quest on every character; Normal for slabs; Chaotic for the card (M) | **confirmed** | Incomplete Guide W1; dossier mechanics H | n/a |

### 4. W2 Systems (`origin/research/w2-systems`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 4.1 | Bubbles, early W2: unlock in all four cauldrons; class stat and multi bubbles, skill and Tools bubbles, FMJ, Shaquracy, Prowesessary; reach AutoReview tier 2 by W3 (L ordering) | **confirmed** | AutoReview `bubbles_progressionTiers` tier 1 = exactly these (Roid Ragin/Stable Jenius/Swift Steppin, Warriors Rule…, Hearty Diggy, Tools, FMJ 5, Shaquracy 5, Prowesessary 7, Hammer Hammer 6), "MINIMUM … for finishing W2"; tier 2 "for starting W3"; Academy: Shaquracy via the 3D printer | n/a |
| 4.2 | Laaarrrryyyy (Kazam #9) only at W4+ | **contested** | Late-game Reddit: [1tv3615](https://www.reddit.com/r/idleon/comments/1tv3615/comment/ope2biy/) 2026-06-02 "early game LARRY yellow bubble is a good priority"; [1tzseli](https://www.reddit.com/r/idleon/comments/1tzseli/) 2026-06-07 "priority number one". AutoReview tiers 1–5 never list it | Level Larry as soon as it is unlocked, if materials allow. Not a W2 gate |
| 4.3 | Sigils: nothing in W1–W3; don't do sigils before all bubbles are unlocked | **confirmed** | Mega Guide (via community-guides); Reddit [1vkea55](https://www.reddit.com/r/idleon/comments/1vkea55/comment/p2tatgp/) 2026-08-10 (keep characters on liquids; sigils late) | n/a |
| 4.4 | Liquids/P2W: Water regen/capacity early; N2 at Alchemy 20, Trench at 35 (M) | **unverified** | Reddit 1vkea55 2026-08-10 says to keep characters on liquids (late game) | Keep |
| 4.5 | Vials: unlock everything with ≥26% odds first; then the rare ones (L order) | **unverified** | Reddit 1v627db 2026-07-27 "you are missing a lots of vials get all the vials you can" (generic) | Keep |
| 4.6 | Arcade: Gold Ball Gain first, then Class XP / Liquid cap (L) | **confirmed** | Reddit [1txs94z](https://www.reddit.com/r/idleon/comments/1txs94z/comment/opy4tka/) 2026-06-05 ("Spend it on gold ball gain"; otherwise weapon power or Class XP for new players); gist ("Gold Ball Gain first") | When Gold Ball Gain is not in rotation, Weapon Power or Class XP multi is the new-player pick |
| 4.7 | Poppy, Killroy, Ballot, W2 quests orders (M/L) | **unverified** | Poppy's spiral split comes from a quoted Discord guide (dossier); no 2026 post on the rest | Keep |
| 4.8 | W2 push: Speccius subclass for every base character early; Djonnut on the pusher | **confirmed** | Incomplete Guide W2: "reach third map … and unlock all your subclasses"; Reddit 2026-09-22 "one of each subclass" | n/a |

### 5. W3 Systems (`origin/research/w3-systems`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 5.1 | Construction, early: 3D Printer → Pulse Mage/Fireball → Library → first shrines → Death Note, Salt Lick; Cost Cruncher only mid | **corrected** | AutoReview `buildingsPreBuffs`: **SS 3D Printer, Cost Cruncher, Automation Arm**; S Library, Death Note, Salt Lick, Trapper Drone, Boulder Roller, Kraken, Poisonic; Pulse Mage/Fireball **D**; Woodular/Isaccian/Crystal/Pantheon C; Primordial F | 3D Printer → Cost Cruncher → Automation Arm → Library → Death Note → Salt Lick → Trapper Drone. Pulse Mage and Fireball Lobber only to the levels the Hoggindaz/Worship quests need |
| 5.2 | Refinery: "Redox and Explosive; keep them ranked above the higher salts" | **corrected** | Reddit [1tzc5nw](https://www.reddit.com/r/idleon/comments/1tzc5nw/comment/oq9krtj/) 2026-06-07 "ALWAYS rank up Redox and Dioxide. NEVER refine them early"; [1vq7e2t](https://www.reddit.com/r/idleon/comments/1vq7e2t/comment/p43ea78/) 2026-08-16 "Always keep red and green levelling, keep all the others half"; [1v57r29](https://www.reddit.com/r/idleon/comments/1v57r29/comment/ozhwysj/) 2026-07-24 "never set red and green to auto"; gist "rank Red/Green salts highest"; Incomplete Guide-linked Discord picture guide (2026-08-23) | Rank **Redox (page 1) and Dioxide (page 2)** highest, with auto-refine **off** on both. Each other salt at about half the rank of the salt that feeds it, and every lower salt's power per cycle above the next salt's cost |
| 5.3 | 3D Printer: max to character count; sample Spore Cap and Copper for Redox first | **confirmed** | AutoReview `sampling_progressionTiers` (Oak, Copper, Goldfish, Fly, Spore Cap targets); Reddit 2026-07-06 [1uopts0](https://www.reddit.com/r/idleon/comments/1uopts0/comment/ovuiewk/) | n/a |
| 5.4 | Salt Lick: Printer Sample → Obol slots → Refinery Speed… (opinion) | **unverified** | none found | Keep |
| 5.5 | Cogs: early favour Build Rate cogs + Flaggy; mid EXP boosts around builders | **contested** | Build Rate early: gist 2026-09-18 ("focus Build Rate early (XP% later)"). EXP first: Incomplete Guide W3 ("You always want to have Exp cogs on board"), Reddit [1vq7e2t](https://www.reddit.com/r/idleon/comments/1vq7e2t/comment/p442rm3/) 2026-08-16 ("Prioritize %Exp boost cogs, the vast majority of your build rate will come from your Squires"), [1v627db](https://www.reddit.com/r/idleon/comments/1v627db/comment/p02uuck/) 2026-07-27 ("try to get exp cogs only"), 1vdlirv 2026-08-02 | The newer Reddit majority is EXP cogs around the Squires/DKs from the start. Store both |
| 5.6 | Two Squire/DK builders is the meta (opinion) | **confirmed** | See the adjudication: Reddit 2026-09-02 → 10-14 | n/a |
| 5.7 | Atom Collider: Hydrogen first, then Helium (M) | **confirmed** | AutoReview `atoms_progressionTiers` tier 1: Hydrogen 5, Helium 1 | n/a |
| 5.8 | Shrines: Woodular then Isaccian early; Clover/Summereading mid; Primordial negligible (opinion) | **contested** | AutoReview ranks Clover, Crescent, Undead **A**; Woodular, Isaccian, Crystal, Pantheon **C** (pre-buffs) / B (post); Primordial F; Summereading D pre-buffs | Early Woodular/Isaccian stays as the cheap first step. AutoReview values Clover/Crescent/Undead higher and Summereading lower than the dossier |
| 5.9 | Prayers: Tachion to Lv 2 → Skilled Dimwit → Big Brain Time; Royal Sampler only while sampling (opinion) | **contested** | AutoReview `prayers_progressionTiers`: tier 1 **Royal Sampler 1**, tier 2 Skilled Dimwit 20, tier 3 Balance of Pain 11, tier 5 Midas Minded | AutoReview wants Royal Sampler Lv 1 first and Balance of Pain early. Tachion for quests is a gate, not a priority, and not disputed |
| 5.10 | Equinox: Dreams ×5 → Resources → Matching Scims → Faux Jewels → Symbols; W4 Liquidvestment, **Laboratory Fuse**, **Food Lust** | **corrected** | Reddit [1x62lj2](https://www.reddit.com/r/idleon/comments/1x62lj2/comment/pgsbcio/) 2026-10-14 ("Never waste points in Food Lust or Laboratory Fuse"; "Liquidvestment is #1 priority for a while"; "max dreams, resources, liquidvestment, then either slow roast wiz or symbols"); [1wu9cmu](https://www.reddit.com/r/idleon/comments/1wu9cmu/comment/pd15rh0/) 2026-09-30 ("liquid investment is needed to be maxed before touching matching scims"); AutoReview Recommended vs **Optional (Laboratory Fuse, Food Lust, Shades of K)**; Incomplete Guide W4 ("Laboratory Fuse (NOT RECOMMENDED)") | Dreams → Resources → **Liquidvestment** (as soon as it unlocks) → Slow Roast Wiz / Symbols → Matching Scims → Faux Jewels. **Skip Food Lust and Laboratory Fuse.** Bonuses unlock in a fixed order (AutoReview), so this is a spending order |
| 5.11 | W3 quests: Hoggindaz first on the first W3 character; Bellows on every character (opinion) | **confirmed** | Incomplete Guide W3 ("talk with Hoggindaz and complete his quests … please dont ignore") | n/a |
| 5.12 | Worship: Wax Skull for every character first; Gorefest waves 10/25/51 (M) | **confirmed** | Incomplete Guide W3 ("buy skulls and traps for everyone and equip them") | n/a |
| 5.13 | Worship, W4+: Clash of Cans is the best EXP per charge (M) | **confirmed** | Reddit [1x2leem](https://www.reddit.com/r/idleon/comments/1x2leem/comment/pf37cog/) 2026-10-10 ("W4 worship totem is best value"; "push clash of cans (W4) to 150-190"); [1vdrtqi](https://www.reddit.com/r/idleon/comments/1vdrtqi/comment/p1cvd69/) 2026-08-02 | n/a |
| 5.14 | Trapping: Cardboard traps on every character; Call Me Ash; Hunter Eagle Eye preset (M) | **confirmed** | Incomplete Guide W3; Academy ("Hunter for trapping and TD") | n/a |
| 5.15 | Death Note: build it as soon as Explosive allows; it gates multikill (H gate, M order) | **confirmed** | Reddit [1uhgyv7](https://www.reddit.com/r/idleon/comments/1uhgyv7/comment/ou7uiqp/) 2026-06-27 ("you NEED to make death note to keep progressing (it's what unlocks multikill)"); AutoReview Death Note S tier; AutoReview death-note tiers (Voidwalker gate) | n/a |

### 6. W4 Systems (`origin/research/w4-systems`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 6.1 | Arrival: Gobo's quests first, then push everyone to map 4 for elites, everyone else in the Lab (C) | **confirmed** | Incomplete Guide W4 ("First thing … complete Gobo's questline (you cant progress portals without it)"; "push everyone to map 4 … get your elite classes. Throw everyone in lab") | n/a |
| 6.2 | Elite order: DK and ES first (Rift 8/9, best pushers), then BC, BB, BM, SB (M) | **confirmed** for DK/ES; the rest **unverified** | Incomplete Guide W4 ("best classes for pushing are Divine Knight and Elemental Sorcerer"); Reddit [1ukukng](https://www.reddit.com/r/idleon/comments/1ukukng/) 2026-07-01 (DK or ES; ES easier at low attack speed) | Which of DK/ES pushes is **contested**, by damage |
| 6.3 | Lab: Killer's Brightside, Certified Stamp Book and My 1st Chemistry Set first (O) | **confirmed** | Incomplete Guide W4 ("make sure every other character is afk in lab connected to Killer's Brightside"); Academy ("everyone else in the Lab on Killer's Brightside") | n/a |
| 6.4 | Lab jewels: Pyrite Rhombol → Sapphire Rhombol → Pyrite Pyramite → Amethyst Rhinestone (O) | **unverified** | Incomplete Guide lists Sapphire Rhombol and Pyrite Rhombol as Line Width / Connection Range sources, with no order | Keep |
| 6.5 | W4 shop: 3 Processor chips and 7 Strung Jewels as soon as possible (O) | **confirmed** | Incomplete Guide W4 ("buying Pile of Processors chips (need 3), Strung Jewels everyday (need 7) and Blue Tome Pages daily") | Add Blue Tome Pages daily |
| 6.6 | Breeding: Egg Capacity → Breedability → Fence → Rarity; first shinies = faster-shiny-level Mobs | **confirmed** | AutoReview breeding tiers (territories 3/7/10/14; arena 3/15/50/125); Reddit [1v9n2t3](https://www.reddit.com/r/idleon/comments/1v9n2t3/comment/p0f084r/) 2026-07-29 ("shiny rate and infinite stars are the priorities") | Add Infinite Star Signs as a co-priority shiny |
| 6.7 | Cooking: Egg/Cabbage speed meals → every meal to Lv 11 with Diamond Chef → damage, then Lab, then Breeding meals (M, "the exact order is ours") | **confirmed** for the shape | AutoReview `cooking_progressionTiers`: tier 2 Diamond Chef 15; tier 4 Fluoride + 500 meal levels; tier 10 no meals under 11, then under 30; gist "meals to … lvl 11" | Discovery and damage-meal order stays unverified |
| 6.8 | Rift: target 10 (Infinite Stars) and 15 (Skill Mastery); DK, ES, SB needed at 8/9/16 | **confirmed** | AutoReview rift tiers (5/10/15…); Incomplete Guide W4 Rift challenge classes | n/a |
| 6.9 | Sigils: boost Envelope Pile → Trove → Metal Exterior → Two Starz → Pea Pod → Plunging Sword; skip Big Muscle–Good Fortune (our reasoning) | **corrected** | AutoReview `sigils_progressionTiers`: tier 1 unlock Big Muscle, Pumped Kicks, Odd Literature, Good Fortune, Plunging Sword, Wizardly Hat, Envelope Pile; tier 2 unlock Shiny Beacon, Metal Exterior, Two Starz, Pipe Gauge, Trove, Pea Pod and **level Envelope Pile, Odd Literature, Big Muscle, Pumped Kicks**; tier 3 level Pea Pod, Pipe Gauge, Good Fortune, Plunging Sword; tier 4 level Peculiar Vial, Emoji Veggie, **Trove** | Unlock tiers in AutoReview order. First boosts: Envelope Pile, Odd Literature, Big Muscle, Pumped Kicks; then Pea Pod, Pipe Gauge, Good Fortune, Plunging Sword; Trove after. Late-game Reddit ([1wzak4x](https://www.reddit.com/r/idleon/comments/1wzak4x/comment/pea22qg/) 2026-10-06) also keeps characters on liquids, not sigils, until Sigil Syrup is farmable |
| 6.10 | Tome: buy the 2 Blue pages early (L) | **confirmed** | Incomplete Guide W4 ("Blue Tome Pages daily") | n/a |
| 6.11 | Duplicate subclasses get duplicate elites; 2 Squires are "not a dead end" | **confirmed** | Adjudication above | n/a |

### 7. account-wide (`origin/research/account-wide`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 7.1 | Merit Shop W1: Hemoglobin ×1 → Respawn 10 → EXP/Boss Keys → Amarok recipes → star talent → Goblet 5–10 → Bags | **corrected** | Incomplete Guide W1 "MERIT SHOP PRIORITY": 1 Hemoglobin ("3 points straight away with all 10 … by the start of W3"), 2 the first 3 Amarok gear recipes, 3 boss keys, 4 respawn, 5 last two Amarok recipes ("debatable"), 6 bags, 7 star talents (1 point when farming Baba Yaga); gist "W1 Amarok Equipment" | Hemoglobin ×3 → Amarok boots/pants/chest recipes → Boss Keys → Respawn → (Hemoglobin to 10 by W3) → Bags → star talents. The last two Amarok recipes are optional |
| 7.2 | Merit Shop W2: Obol ×1 → boss gems to 8 → AFK gains → Efaunt recipes → Respawn/Arcade/Convert/Star | **corrected** | Incomplete Guide W2: 1 Obols ×1, 2 **AFK gains for all characters** ("Purchase more every time you get a new character"), 3 Respawn, 4 boss gems, 5 obol drop rate, 6 arcade balls, 7 Efaunt gear ("Not much better than Amarok"), 8 EXP Converter "not worth using", 9 star talents | Obol ×1 → AFK gains (= character count) → Respawn → boss gems → obol DR → balls → Efaunt (optional). Skip Convert Better |
| 7.3 | Merit Shop W3: Build/Food slot → Library +2 to 5 → Printer Sample → Telekinetic ×1 → Salt row | **contested** | gist 2026-09-18: "W3 Telekinetic Storage (1pt) + Library" first; Incomplete Guide W3 has no merit list | Telekinetic ×1 and Library first (gist) vs the dossier's slots first |
| 7.4 | Merit Shop W4: NBLB ×3 → Lab range → Egg capacity → Crystal → Spice Spillage → Troll → Respawn | **corrected** | Incomplete Guide W4: 1 **Spice Spillage ×1**, 2 No Bubble Left Behind ("Only buy this if you can reach the … node"), 3 Egg capacity, 4 Lab range, 5 Respawn ("relatively low priority"), 6 Spice Spillage max, 7 Crystal ("3 crystal mobs per day is very little"), Troll recipes only if you can craft them; gist "W4 No Bubble Left Behind (early!)" | Spice Spillage ×1 → NBLB (once the node is reachable) → Egg Capacity → Lab range → Respawn → Spice Spillage max → Crystal; Troll recipes when craftable |
| 7.5 | Gem Shop F2P: Infinity Hammer first ("universal first buy") → Card Slots 1–2 → Carry → Card 3–4 → Bleach then **Ivory** cauldrons → Food Slot → Brimstone (contested) → Crystal 3D Printer at W3 entry | **contested** (first buy); **corrected** (Ivory) | Hammer first: AutoReview S (Infinity Hammer, Bleach ×1, Crystal 3D Printer, Card Slot ×4, Richelin), gist ("Infinity Hammer → Crystal 3D Printer (buy before Brimstone) → ~4 Brimstone → 1 Bleach → card slot (max)"). Printer/cards first: Reddit [1wxle7j](https://www.reddit.com/r/idleon/comments/1wxle7j/comment/pdw6ghp/) 2026-10-04 ("Card slots + 3d printer upgrade (world 3) are the 2 id go for first. Golden hammer is good, but its not necessary nowadays"), [pe11bxe](https://www.reddit.com/r/idleon/comments/1wxle7j/comment/pe11bxe/) 2026-10-05 (Crystal 3D printer "your first purchase"), [1uopts0](https://www.reddit.com/r/idleon/comments/1uopts0/comment/ovu2pju/) 2026-07-06 ("If you just made it to world 3, buy the 3D printer gem upgrade first"). Ivory: AutoReview **D** tier (4 at tier 5) vs Bleach in S | Two orders to store. Either way: **Ivory Bubble Cauldrons move to after Food Slot #2, Tower slots and Storage**, because AutoReview rates them D. Burning Bad Books stays skipped (Reddit [1wgpxqv](https://www.reddit.com/r/idleon/comments/1wgpxqv/comment/p9w9099/) 2026-09-15) |
| 7.6 | Upgrade Vault Spend Plan tables (M from formulas) | **unverified** (no Source orders the rows) | AutoReview `vault_progressionTiers` tier 1 lists which rows to max, with no order. Reddit: "Put all money into vault" (2026-06-24) | Keep. Consistent with AutoReview's tier-1 max list |
| 7.7 | Guild leader priority: Gifts 2 → Gold Charm → Star Dazzle → … (M) | **unverified** | none found | Keep as reasoning |
| 7.8 | Pet Crystal plan: Sheepie → Flying Worm → Gigafrog → Crystal Custard → Ram → … (M) | **confirmed** for Sheepie and Ram; the rest **unverified** | Reddit [1tyos8f](https://www.reddit.com/r/idleon/comments/1tyos8f/comment/oq7mhvl/) 2026-06-06 ("Ram (or pig) and Sheepie change how you get to play the most"); [1utda5f](https://www.reddit.com/r/idleon/comments/1utda5f/comment/owxgpwe/) 2026-07-11 ("biggest game-changers … autoloot, Sheepie, and Dedotated Ram") | Move Dedotated Ram up next to Sheepie |
| 7.9 | Pet Bonus Token: Glunko The Massive or Mr Pig; not King Doot before W5 | **confirmed** | Reddit [1tyos8f](https://www.reddit.com/r/idleon/comments/1tyos8f/comment/oq519ko/) 2026-06-06 ("If your f2p and only can get 1 pet, then Mr. Pig"); [1uc0ome](https://www.reddit.com/r/idleon/comments/1uc0ome/comment/ot2x7ct/) 2026-06-22 ("between massive glunko and king doot … glad i went glunko since im only on world 4"); several new-player threads 2026-06/07 | Mr Pig is the most-recommended F2P pick |
| 7.10 | Family: "a second character of a class line … only for a non-family reason, such as a second Barbarian for fishing" | **corrected** | Adjudication above | The non-family duplicate the community makes is a 2nd **Squire** (Construction, then 2nd RG) |
| 7.11 | Family: "Elites at Lv 70" | **conflict, flag for #26** | The W4 dossier (Eliteus, H) says there is **no level gate**: reach map 154 and kill 10 Greenie genies | Not a priority claim. #26 must pick the code reading |
| 7.12 | Achievements and Tasks orders by stage (M) | **unverified** | none found | Keep |
| 7.13 | Minigames: Owl to Fractal before W3; Poppy reset spiral split (Discord guide via Reddit 2025-03 and 2026-05) | **confirmed** (Owl), **unverified** (Poppy) | Incomplete Guide W1 ("at least Fractal 5 Megafeather") | n/a |
| 7.14 | Dailies: Dog Bone / Djonnut / Bellows quests on every character for keys (H) | **confirmed** | Game rule (H); Reddit [1wqeht2](https://www.reddit.com/r/idleon/comments/1wqeht2/) 2026-09-25 (repeatable-quest value is in specific rewards) | n/a |

### 8. skills (`origin/research/skills`)

| # | Claim | Result | Source and date | Corrected order / note |
|---|---|---|---|---|
| 8.1 | Alchemy early W2: all characters visit the cauldron; sigils only after all bubbles (L) | **confirmed** | Incomplete Guide W2 ("assign your characters to cauldrons to start unlocking bubbles"); Mega Guide; Reddit 2026-08-10 | n/a |
| 8.2 | Smithing: anvil points all into speed; Thread (community W1 sheet) | **confirmed** | Incomplete Guide W1 | n/a |
| 8.3 | Mining/Choppin/Fishing/Catching stage tables (mostly H game data; L where marked) | **unverified** as orders | Reddit 2026-07-25 ([1v627db](https://www.reddit.com/r/idleon/comments/1v627db/comment/ozna0r8/)): Archers on catching/trapping, Wizard and Shaman on Lab/Worship, the warrior line on mining/fishing | Class-to-skill mapping confirmed; tier tables keep their game-data confidence |
| 8.4 | Trapping early W3: traps for everyone; Hunter for Eagle Eye (L) | **confirmed** | Incomplete Guide W3; Academy | n/a |
| 8.5 | Construction early W3: 3D Printer → Library → rest of the top row | **corrected** in part | AutoReview SS: 3D Printer, **Cost Cruncher, Automation Arm** | See 5.1 |
| 8.6 | Construction per class: second DK "for construction" (L, flagged pre-RG Stale) | **confirmed, and no longer Stale** | Adjudication above (post-RG 2026-09/10) | Drop the Stale flag |
| 8.7 | Worship: Wax Skull for everyone; Wizard main; Clash of Cans W4 (L) | **confirmed** | 5.12, 5.13 | n/a |
| 8.8 | Lab: upload all spare characters; Killer's Brightside first (L) | **confirmed** | 6.3 | n/a |
| 8.9 | Divinity: Elemental Sorcerer is the Divinity class (W5) | **confirmed** | gist ("Divinity (Elemental Sorcerer specialty)") | n/a |
| 8.10 | Breeding: Beast Master hatches; Egg Capacity first (L) | **confirmed** for Egg Capacity (7.4, 6.6); BM hatching **unverified** | Incomplete Guide W4 merit #3 | n/a |

## Cross-cutting findings for #26

1. **Push first, Systems second.** Every 2026 new-player thread that answers "push or complete systems" says push portals with one character until about W5–W6, then go back:
   - [1uhgyv7](https://www.reddit.com/r/idleon/comments/1uhgyv7/comment/ou7u438/) 2026-06-27: "push and then go back whenever pushing gets slow". The exceptions it names are W3 salts (time-gated) and the Death Note.
   - [1ue96lq](https://www.reddit.com/r/idleon/comments/1ue96lq/comment/otjt8qz/) 2026-06-24: "everyone should be pushing portals till you hit w5".
   - [1v2eoid](https://www.reddit.com/r/idleon/comments/1v2eoid/comment/oyv8mok/) 2026-07-21.
   - [1v627db](https://www.reddit.com/r/idleon/comments/1v627db/comment/ozoen5n/) 2026-07-25: "Get accuracy, push boss … Access to systems > not having access to systems".

   The dossiers' per-world orders are still right *within* a System. The cross-System ranking should treat the pusher's next portal as the default top Goal, and time-gated Systems (salts, Death Note, Lab uploads, daily buys) as the things never to skip.
2. **The pusher is contested.** For W1–W3 it is Barbarian vs Squire:
   - Barbarian: Academy 2025-09; Reddit 2026-08-06 ([p20kc31](https://www.reddit.com/r/idleon/comments/1vgv4hu/comment/p20kc31/) "first with barbarian, then with elemental sorcerer") and [p24lt6c](https://www.reddit.com/r/idleon/comments/1vgv4hu/comment/p24lt6c/).
   - Squire: Incomplete Guide; gist 2026-09-18; [1uhgyv7](https://www.reddit.com/r/idleon/comments/1uhgyv7/comment/ou7vhtr/) 2026-06-27.
   - Split: "Squire better for active. Barbarian for afk" ([ouijar4](https://www.reddit.com/r/idleon/comments/1uhgyv7/comment/ouijar4/), 2026-06-29).

   For W4+, it is DK vs ES, by damage. Store both.
3. **Accuracy is the wall** from W1 to W6 (Academy; Reddit 2026-07-25, 2026-06-13 "alchemy and cards helps a lot for accuracy early"). This supports the dossiers' "buy combat rows when a wall needs them" rule. It is confirmed as a gate.
4. **AutoReview is what players actually follow.** Reddit answers repeatedly send players there (2026-06-02, 08-07, 09-10). Where this doc corrects a dossier from AutoReview, the Knowledge Base should prefer AutoReview's tiers, re-expressed in our own words (no licence: cite, never copy).

## Discord pins

*Reserved. The orchestrator is reading the official Discord's #tips-n-tricks and per-world pins through the user's browser and will append them here. One Discord pin is already known second-hand: a bubble Prisma priority image "from 3/11/26 on the discord pins" ([1wwfx3q](https://www.reddit.com/r/idleon/comments/1wwfx3q/comment/pdmal7w/), 2026-10-03). The Discord gem-shop tier list (shared on Reddit 2026-01-25 and 2026-09-15) is already used in `account-wide/gem-shop.md`.*

## Sources

Tier 3, systematic:
- AutoReview, `TwoSpookyBoos/IdleOnAutoReviewBot` beta @ `05ac449` (2026-09-23), [`mysite/consts/progression_tiers.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/consts/progression_tiers.py) (`gemShop`, `bribes`, `owl`, `vault`, `bubbles`, `sigils`, `deathNote`, `buildingsPreBuffs`/`PostBuffs`, `prayers`, `equinox`, `atoms`, `sampling`, `breeding`, `rift`, `cooking`) and [`mysite/w3/equinox.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/w3/equinox.py) (the Recommended/Optional split). No licence: cited, not copied.

Tier 3, guides:
- "Idleon Incomplete Guide" by shadowstorm2204 ([htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)), tabs WORLD 1 (gid 1908399039), WORLD 2 (1600175189), WORLD 3 (1135281522), WORLD 4 (1880636113), read as CSV export on 2026-10-17. Undated: after W7 (2025-11-06), before Royal Guardian (2026-08-25).
- shnaps, "IdleOn Progression Guide" [gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa), updated 2026-09-18 (via `gh api gists/…`).
- Idleon Academy (Nekow, 2025-09-23) and Iacchus "Recommended Class Setups" (2025-07-06), as summarised on [`research/community-guides`](https://github.com/YassSoliman/idleon-forge/blob/research/community-guides/docs/research/2026-10-17-community-guides.md).

Tier 3, Reddit r/idleon (thread id: title, post date). All are read via `https://arctic-shift.photon-reddit.com/api/comments/search?link_id=<id>`, and each thread is at `https://www.reddit.com/r/idleon/comments/<id>/`.

Roster and swap:
- 1w59vpd: "Advice for a possible mistake", 2026-09-02.
- 1w7xfz2: "What's the best class setup after the Royal Guardian release?", 2026-09-05.
- 1welinx: "Two Royal Guardians", 2026-09-12.
- 1we5y9c: "What should be my 8th character class", 2026-09-12.
- 1wnq6ay: "Squire or barbarian?", 2026-09-22.
- 1ww0c2u: "What should i promote my Characters to?", 2026-10-02.
- 1x15zur: "More than 1 Voidwalker?", 2026-10-08.
- 1uup998: "2nd DB question", 2026-07-12.
- 1uwqyx8 and 1u0sged: 11th character, 2026-07-14 and 2026-06-08.
- 1vdlirv: one DK for Construction, 2026-08-02.
- 1ukukng: "What class is recommended for pushing w4?", 2026-07-01.

Gem shop:
- 1wxle7j, 2026-10-04.
- 1uopts0, 2026-07-06.
- 1wgpxqv, 2026-09-15.
- 1u8zir5, 2026-06-18.

Alchemy:
- 1tv3615, 2026-06-02.
- 1tzseli, 2026-06-07.
- 1wwfx3q, 2026-10-03.
- 1vkea55, 2026-08-10.
- 1wzak4x, 2026-10-06.
- 1w1j2h4, 2026-08-29.

Refinery and Construction:
- 1tzc5nw, 2026-06-07.
- 1wn4d4p, 2026-09-22.
- 1v57r29, 2026-07-24.
- 1vw72bq, 2026-08-23.
- 1w14ok0, 2026-08-28.
- 1vq7e2t, 2026-08-16.
- 1v627db, 2026-07-25.

Equinox:
- 1x62lj2, 2026-10-14.
- 1wu9cmu, 2026-09-30.
- 1wmir9h, 2026-09-21.

Worship and Trapping:
- 1x2leem, 2026-10-10.
- 1vdrtqi, 2026-08-02.
- 1udx394, 2026-06-23.
- 1wrx3w1, 2026-09-27.

Statues and Post Office:
- 1tuusil, 2026-06-02.
- 1uerrg9, 2026-06-24.
- 1tyi01h, 2026-06-06.

Obols and pets:
- 1uf24j9, 2026-06-25.
- 1uudu00, 2026-07-12.
- 1tyos8f, 2026-06-06.
- 1uc0ome, 2026-06-21.
- 1utda5f, 2026-07-11.
- 1um9o82, 2026-07-03.

Breeding, Arcade and star signs:
- 1v9n2t3, 2026-07-29.
- 1vhj2uw, 2026-08-06.
- 1txs94z, 2026-06-05.
- 1v7nja9, 2026-07-26.

New-player and push:
- 1uhgyv7, 2026-06-27.
- 1ue96lq, 2026-06-24.
- 1v2eoid, 2026-07-21.
- 1vgv4hu, 2026-08-06.
- 1u2aqq5, 2026-06-10.
- 1uimple, 2026-06-29.
- 1vpxose, 2026-08-16.
- 1wqeht2, 2026-09-25.

Inputs (not edited): `origin/research/{character-builds,cards-obols,w1-systems,w2-systems,w3-systems,w4-systems,account-wide,skills}` (dossiers dated 2026-10-17), `origin/research/community-guides`, `origin/research/meta-sources`. Fixture use: the class list of the W3 fixture account only (`characters[].class`), with no names or values.

**Method limits:** Arctic Shift full-text search (`body=`) timed out with HTTP 422 for most phrases during this session. So coverage is the 3,270 post titles from 2026-06-01 to 2026-10-17 plus the comments of 80 threads, not a keyword sweep of every comment. Claims marked *unverified* may have community discussion that this method missed. Discord is excluded by design (see above).
