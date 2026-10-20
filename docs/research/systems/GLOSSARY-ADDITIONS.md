# M26 glossary additions

Proposed entries for `GLOSSARY.md`, in its format (`**Term**:`, a one- or two-line definition, then `_Avoid_:` where a
wrong word is common). Collected from the glossary sections of `synth/W1.md`, `W2.md`, `W3.md`, `W4.md`, `AW.md` and
`CL.md`, deduplicated, and checked against the 72 terms already in `GLOSSARY.md` (none is redefined). Verified
2026-10-19 against IdleOn Toolbox @6c37e3d (game 2.3.540); each definition rests on the map and dossier rows cited in
those files.

Where to put them: the game terms go under `## Playing`, grouped as below (the groups are for review only; merge them
into the section in the order that reads best). The last group goes under `## Knowledge Base entries` and `## Views`.

**Merges made here.** Three areas each defined Skill Mastery; W4 and CL both defined Elite class; W2, W4 and AW each
named the shown Rift number (Displayed Rift, Rift level, Rift label). Each now has one entry. AW proposed **Lever**,
which sits too close to the existing **Leverage**; it is entered as **Multiplier source** instead. No term is added
for "disputed": the glossary already says to use **Contested**.

## Playing: account-wide

**Mechanic**:
One thing a System does that a player can see or act on (a slot, a cost curve, a reset, a cap); the unit of the M26 system x mechanic matrix.
_Avoid_: feature (that is ActiveOn's side)

**Class line**:
A base class and the classes it promotes into, for example Warrior -> Squire -> Divine Knight; the Beginner line is Beginner -> Journeyman -> Maestro -> Voidwalker.
_Avoid_: class tree, branch

**Promotion**:
Moving a character to the next class in its line (subclass at Speccius, elite class at Eliteus; Rocklyte, Cactolyte and Nebulyte for the Beginner line). ActiveOn reads it from `classIndex`, never from quest flags.
_Avoid_: class up, rank up

**Elite class**:
The third class of a base line (Blood Berserker, Divine Knight, Siege Breaker, Beast Master, Elemental Sorcerer, Bubonic Conjuror), granted by Eliteus after the Greenie Gang fight; it opens talent tab 4 and a family bonus.
_Avoid_: subclass (for the elite), master class

**Class kit**:
The talents and counters specific to one class line whose value depends on another System (a bubble cap, a skill level, accuracy, move speed); shown in the Build tab's Class kit section.
_Avoid_: class build

**Effective talent level**:
A talent's base level plus its added levels; the level the game uses for the talent's value.
_Avoid_: real level, true level

**Added levels**:
Levels a talent gains from outside sources (Symbols of Beyond, family, achievements and others) on talents with base level 1 or more.
_Avoid_: bonus levels, free levels

**Bubble-capped talent**:
A talent whose useful level is limited by an Alchemy bubble's level (Fuscia and Fantasia Flasks by Mage Is Best, Velocity Vessels by Archer or Bust, Blocky Bottles by Warriors Rule).
_Avoid_: bottle talent

**Cap raiser**:
A talent or bubble that raises another talent's max level.

**Breakpoint talent**:
A talent whose effect steps only at fixed level intervals (Refinery Throttle every 8 levels, Apocalypse Zow); levels between steps add nothing.

**Cast**:
An active talent with a long cooldown whose value comes from using it (It's Your Birthday!, Printer Go Brrr, Void Trial Rerun, Cranium Cooking, Refinery Throttle); "cast ready" is its Check.
_Avoid_: skill, ability

**Buff (talent)**:
A talent that counts only while active (Strafe, Extendo Rangeo, Pirate Flag); it adds nothing to AFK kills from the attack bar.

**Speedna step**:
Each band of move speed that Bowman's Speedna turns into damage; the steps fall at 116%, 130% and 145%, and 115% exactly gives none.
_Avoid_: speed tier

**Zow map / Chow map**:
A fighting map where one character has at least 100k (Zow) or 1M (Chow) kills, counted by Apocalypse Zow / Chow.

**Hands (Maestro)**:
Left Hand of Learning and Right Hand of Action, which give skill EXP and efficiency to characters below the Maestro's level in each skill.

**Main stat / Accuracy stat**:
The class's damage stat, and the stat that raises its accuracy (a STR class needs WIS, an AGI class STR, a WIS class AGI).
_Avoid_: primary, secondary stat

**Stat snapshot**:
The STR, AGI, WIS and LUK the save last stored for a character, with the level they were taken at; a snapshot older than the current level is stale.

**Hit chance**:
A character's chance to hit its current monster; 100% once accuracy reaches the monster's need.
_Avoid_: accuracy % (accuracy is the stat)

**Class EXP multiplier**:
The total multiplier on a character's Class EXP from every source.
_Avoid_: EXP rate, EXP multi (bare)

**Level band**:
The level-limited Class EXP bonus: +150% below level 10, +100% below 30, +50% below 50.

**Lowest-level bonus**:
The Class EXP bonus that goes only to the single lowest-level character; a tie gives it to nobody.

**Family bonus**:
The account bonus each class gives once a character of it reaches a level threshold; a second character of the same class adds nothing.
_Avoid_: class bonus

**Food slot**:
One of a character's 16 food entries; some are locked, and ActiveOn only knows a lower bound ("at least N").
_Avoid_: food bar, food buffer

**Golden Food**:
A food that is never eaten; in a Food slot it gives a permanent bonus that grows with the stack on a log curve.
_Avoid_: gold food

**Health food / Boost food**:
Food eaten automatically under an HP threshold / food whose effect boosts a stat or skill while equipped.

**Golden Food multiplier**:
The per-character multiplier on every Golden Food bonus (family bonus, talents, gear, stamp, achievement).
_Avoid_: golden food multi (bare)

**Storage Chest**:
The account-wide storage; its slot count comes from quests, chests, the Chest Space tower, shops and the Upgrade Vault.
_Avoid_: bank (that is the coin bank)

**Carry cap / Carry pouch**:
How many of one item type a single inventory slot holds, per character and carry class / the item that sets a class's base carry cap.
_Avoid_: stack size

**Greenstack**:
A stack of 10,000,000 of one item in storage.

**Cash multi**:
A character's multiplier on monster coins. The **coin farmer** is the AFK fighter with the highest estimated coins per hour.
_Avoid_: money multi

**Drop rate / Loot farmer**:
A character's total drop multiplier / the best fighting character by drop rate (never a skiller), who farms loot.
_Avoid_: luck (for drop rate)

**Multiplier source**:
One source that raises a multiplier (cash or drop rate), ranked by the computed gain of its next step.
_Avoid_: lever (too close to Leverage), boost (bare)

**Chip cap**:
The 5x line the Grounded Processor Lab chip tests the drop rate against, before the chip's own bonus.

**Friend Bonus slot / Sender level**:
One received friend bonus (a stat and the sender's level; the sender is never named) / the level that scales it.
_Avoid_: friend name, friend list

**Event Points / Event Shop**:
The currency earned in seasonal events / the shop that spends it on permanent items.

**Trophy / Nametag / Premium hat**:
The three cosmetic equipment slots that carry stats.
_Avoid_: trophy (for the Weekly Battles currency, say Weekly trophies)

**Hat Rack**:
The account bonus from owned premium hats, which applies to a character once it has cleared YumYum Grotto.

**Gallery**:
The W7 successor of trophies and nametags as an account bonus; out of W1-W4 scope.

**Town shop / Daily stock / Stock bonus**:
A town's vendor / what it still sells today / the extra stock from the Overstock bribe plus the Vendor Stamp, added.
_Avoid_: store

**Achievement task**:
A world's Task Board task whose tiers count completed achievements in that world.

**Exact-stack achievement**:
An achievement that needs exactly N of an item in one storage stack; a larger stack must be split.

**Merit / Task tier**:
The Task Board currency spent in the Merit Shop / one claimable step of a Task Board task.
_Avoid_: task points (that is the Task Unlocks currency)

**Dungeon rank / Flurbo / Trait**:
The rank lifetime dungeon credits buy / the dungeon currency spent on the Flurbo Shop stats / one pick per trait set that rank opens.

**Pet Park**:
ActiveOn's page for the account's companion pets, the Pet Mart and the Pet Tournament.
_Avoid_: pets (bare, clashes with Breeding's Mobs)

**Server week / Ballot week**:
The week Weekly Battles and the Trophy Shop run on (ends Thursday 00:00 UTC) / the voting week (ends Monday about 17:00 UTC).
_Avoid_: week (alone, when the two differ)

**Skill Mastery**:
The Rift bonus, from displayed Rift 16, keyed on each skill's account total (the skill's levels summed over every character) at 150, 200, 300, 400, 500, 750 and 1000; at a skill total of 300 every owned card of that skill counts as equipped.
_Avoid_: mastery (alone: Vial, Stamp and Construct Mastery are other Rift bonuses)

**Account skill total**:
One skill's levels summed over every character; the number Skill Mastery reads.

**Displayed Rift**:
The Rift number the game shows: the stored Rift level plus 1 (Gilded Stamps at displayed Rift 26 is stored 25). UI text uses displayed numbers; Detectors compare stored ones.
_Avoid_: Rift N without saying which

## Playing: World 1

**Forge System**:
The game's W1 smelter (ore in, bars out), System id `forge`. Needed because **Forge** already means this project; player-facing copy may say "Forge".
_Avoid_: the Forge (unqualified, in docs and code)

**Cap raise**:
Raising a stamp's max level with its material and coins, in fixed steps.
_Avoid_: upgrade, max-up

**Carry wall**:
A cap raise whose material cost is more than the best character can carry.

**Gilded Stamp**:
A banked stamp cap-raise discount, rolled daily from displayed Rift 26.
_Avoid_: gold stamp

**Skill falloff**:
A skill stamp's bonus scaled down by a low skill level on the character it acts on.

**Expansion bribe**:
The last bribe of a set ("The Art of the ..."), which opens the next set.
_Avoid_: unlock bribe

**Statue grade / Deposit**:
Stone, Gold, Onyx or Zenith, each multiplying a statue's bonus / turning held statue items into statue EXP (needs Town Marble's quest, per character).
_Avoid_: statue tier, level up statue

**Claim-ready constellation**:
A constellation with every letter recorded that pays nothing until a character clicks its star.
_Avoid_: complete constellation

**Star Chart Points (SCP)**:
The currency constellations pay, spent in the Star Chart trees.
_Avoid_: star points

**Infinite sign**:
A star sign counted as worn on every character (Infinite Stars); wearing it again wastes a slot.

**Box threshold / Streak (Post Office)**:
A Post Office box level (26, 101) where a further bonus row starts / consecutive days a company's order was filled.
_Avoid_: breakpoint, combo

**Feather Restart / Mega Reset / Bonuses of Orion**:
The Owl's two resets (Restart multiplies feather generation; Mega Reset grants a Megafeather) / the Owl upgrade that gives permanent stats and never resets.
_Avoid_: prestige (alone)

**Unique quest count / Missable drop**:
Distinct quests finished by any character / an item that drops only while a specific quest is in progress on some character.
_Avoid_: total quests

**Key earner / First clear / Mini-boss count**:
A character past an NPC's key quest (each adds one key a day to the shared bank) / the first kill of a world boss, which drops the crystal that opens the next world / banked summons of a mini boss, growing daily to a cap.

**Ticket bank / Centurion rank**:
A Colosseum NPC's daily tickets, banked up to 3 days / the Colosseum score ladder.

**Unlock ladder / Tome highscore**:
Hoops or Darts total-level thresholds that open new upgrades / the five minigame highscores the Tome counts (450 = full credit).

**Fisheroo Reset / Greatest Catch**:
Poppy's small and large resets; Greatest Catch grants a Megafish.

**Knockout ladder**:
The 78-target sequence of Upgrade Vault row 15; each one-hit kill with no weapon equipped adds damage.

**Hammer slot / Anvil Expansion / Brimstone slot**:
One anvil production line on a character (base 1, plus Infinity Hammer and Hammer Hammer) / a crafted Anvil Tab (2-7) that opens more recipes / a gem-bought Forge slot that smelts faster.
_Avoid_: anvil slot

## Playing: World 2

**Brew / New-bubble roll**:
The currency a bubble cauldron fills while characters sit in it / one attempt at unlocking the cauldron's next bubble, paid in brew, at the cauldron's odds.
_Avoid_: bubble progress, attempt (alone: clashes with vial attempts)

**Cauldron Boost**:
One of four per-cauldron upgrades bought with brew (Speed, Luck, Cost, 2x Extra), max level 170.
_Avoid_: cauldron upgrade (that is Pay 2 Win)

**Big bubble**:
An equip-only bubble that works only in a character's big-bubble slot (1 to 3).
_Avoid_: active bubble (in UI text)

**Green vial / Vial multiplier**:
A vial at level 4 or higher, the count Virile Vials uses / the factor on every vial's bonus (Lab Chemistry Set, Vault Vial Overtune, Rift Vial Mastery, Ballot Meritocracy).

**Decant / Liquid Shop**:
The per-liquid Cap and Rate tracks fed by spare liquid / the Alchemy shop paid in liquids, with daily and permanent items.

**Gold Balls / Arcade rotation / Ball rate floor**:
The Arcade shop currency won from launched balls / the nine shop bonuses buyable this period (server-wide) / the 122.2% bonus at which seconds per ball stop improving.

**Message Bottles**:
The currency that unlocks islands.

**Run upgrade / Skull Shop / Killroy Prime**:
One of Killroy's six permanent post-run picks / Killroy's shop paid in skulls / the Rift-gated Total Damage multiplier from best Killroy kills.

**Active bonus / Locked fallback**:
The Ballot bonus in force now (last vote's winner) / what an account gets when that bonus is above its world (1.25x damage).
_Avoid_: leading (that means this week's vote)

**Obol shape / Family obols / Personal obols**:
Circle, square, hexagon or sparkle (an obol fits only its own shape) / the account-wide 24 obol slots / a character's 21.

**Strict dominance**:
The obol swap rule: at least as much of every stat and more of one.

**Star cap / Set tier**:
The highest card level reachable now (5; 6 with Ruby Cards; 7 later) / floor(total set levels / set size).

## Playing: World 3

**Salt chain / Salt balance / Safe rank**:
The Refinery order in which each salt burns the previous one as fuel / per salt, the previous salt made per hour against burned per hour (in **deficit** when it burns more) / the highest rank a salt can reach before it burns more than is made.
_Avoid_: salt tree

**Refinery cycle / Refinery Throttle**:
One tick of a Refinery group (Combustion, Synthesis, Polymerize) that adds Power to every active salt / the Squire-line Cast that grants extra cycles.

**Build slot / Unpaid level**:
One of the Construction Table's slots a building levels in (2 base, up to 8; **trimmed** slots build faster) / a building whose bar is full and whose level waits for its salt payment.
_Avoid_: queue

**Construct Mastery**:
The Rift bonus ladder keyed on total building levels.

**Cog Board / Cog Shelf / Cog inventory**:
The Construction grid of cogs and characters / the save slots that hold new cogs / the spare-cog store.
_Avoid_: rack

**Flag / Flaggy rate**:
A flaggy placed on a locked Cog Board square, which opens it over time / the speed it does so.

**Boost cog / Excogia**:
A cog whose shape boosts the squares it reaches / the four-piece cog that works only assembled in a 2x2 square.

**Sample size / Wired In / Printer Go Brrr**:
The share of a character's AFK gains the 3D Printer copies per sample (capped at 90%) / a Lab connection that multiplies what a character prints / the Maestro-line Cast that prints on demand.

**Charge / Skull (Worship)**:
A character's Worship pool, spent at a totem / the Worship tool that sets max charge and charge rate.

**Totem / Best wave**:
One of the five W1-W4 Tower Defense maps (Goblin Gorefest, Wakawaka War, Acorn Assault, Frosty Firefight, Clash of Cans) / a totem's record, which gates prayers and sets claim value.

**Soul / Prayer slot / Curse**:
The Worship currency that buys and levels prayers (Forest, Dune, Rooted, Frigid, Squishy in W1-W4) / a per-character prayer socket / a prayer's downside.

**Idle shrine / World Tour**:
A built shrine on a map with no AFK character, which never levels / the W4 Lab effect that applies a shrine beyond its own map.

**Trap set / Shiny critter / Lord of the Hunt**:
The trapping tool that sets how many traps a character can place and which durations it offers / the rare critter row / the Trapping quest line (quests 1-11).

**Death Note rank / Overkill / Multikill / Kill-per-Kill**:
A monster's rank from its kills, drawn as a skull / hitting a monster for a multiple of its HP / extra kills per kill from overkill tiers / how many Death Note kills each kill counts for.

**Equinox Mirror / Dream bar / Dream Upgrade / Cloud**:
The Bloodbone drop that unlocks Equinox / its charge meter / one of 14 upgrades bought with a full bar / an Equinox challenge whose reward unlocks or raises upgrades.

**Particle / Atom / Collider threshold**:
The Atom Collider currency / one of 17 collider upgrades / the storage stack size above which the collider turns items into particles.

**Checkout / Book range**:
A stored Library talent book / the min-max level a checked-out book rolls.

**Registered set / Worn in full**:
An armour set logged at the Armor Smithy, whose bonus applies without wearing it / the fallback where wearing every part on one character gives the bonus.
_Avoid_: complete (for parts spread over characters)

**Smoked meat / Spare Coins / Fun Gifts / Frozen Dice / Emulsify**:
Bubba run mechanics next to the existing Megaflesh, Bubba Boon and Charisma Chart.

## Playing: World 4

**Laboratory (Lab)**:
The W4 account-wide board: characters whose AFK Target is the Lab sit in tubes and send beams that light Mainframe nodes and jewels.

**Line Width / Connection Range**:
A Lab character's beam reach (two characters link when their distance is strictly below it) / how far a connected character lights nodes and jewels.
_Avoid_: range (alone)

**Mainframe node**:
One of the 14 W4 Lab bonuses; lit when a connected character is in range.

**Chip Repository / Jewel Spinner / Weekly Lab shop**:
The Lab's chip store / its jewel store / the two chips and one jewel that rotate every Thursday 00:00 UTC.

**Kitchen / Meal / Spice / Ladle**:
Cooking's stations / a meal's level is a permanent account bonus / the ingredient Breeding territories gather / an item that adds 1 hour of cooking to every kitchen.

**Diamond plate / Void plate**:
Our labels for meals at level 11+ (counted by Diamond Chef) and at the level cap.

**Nest / Egg rarity / Dead DNA**:
Breeding's egg slots / an egg's tier (Normal to Godshard) / the upgrade currency from trashed Mobs.

**Territory / Fence Yard / Pet Arena**:
A Breeding fight whose forage team then gathers its spice / where Mobs level hearts and shiny levels / the W4 Breeding wave fight.
_Avoid_: arena (alone: the W2 Wakawaka War totem is not it)

**Sigil / Sigil seat / Sigil tier**:
An Alchemy sigil / a character assigned to charge it / its level (locked, then Unlock, Boost and later tiers).

**Rift level / Rift task / Rift bonus**:
The Rift progress as stored (see Displayed Rift) / the quota for the current level / the account bonus every 5 levels (12 in all).

**Tome score / Tome metric / Tome pages**:
The Tome's point total / one of its 124 tracked account stats, counted once Account LV reaches its gate / the purple (damage), blue (Skill Efficiency) and red (drop rate) bonus pages.

**Begone Troll!**:
The W4 Massive Troll task, 10 tiers.

## Knowledge Base entries and Views (ActiveOn terms)

**Unlock guard**:
A Detector precondition that the System (or island) is open, required because raw counters tick on locked accounts.
_Avoid_: gate (alone)

**Claimed by**:
The engine rule that a thing two Checks could name is shown once, by the Check that owns it.
_Avoid_: dedupe (in docs for players)

**Class lines page / Class kit section**:
The account page with one card per base line (where each character sits, the next promotion) / the Build-tab section that draws one character's class kit.
