# golden v1: latest · knowledge #76ea6859 · parser 6c37e3d (game 2.3.540) · now 2026-10-10T19:12:32.605Z · return 8h · stage W4-entry

## Verdict changes

## Now
0 of 11 Ready · fix 11 before you leave · fix 1 in Account

### C9 · Royal Guardian 1307 · Fix before you leave
1 · Doing nothing · Blunder Hills · Send Royal Guardian Lv 1,307 to an AFK Target before you leave

### C1 · Siege Breaker 1291 · Fix before you leave
2 · Cooking · Outer World Town · Collect Boring Brick from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C6 · Wind Walker 1280 · Fix before you leave
3 · Fighting Pirate Underling · Pirate Upper Deck · Collect Thread from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C10 · Bubonic Conjuror 1268 · Fix before you leave
4 · Fighting Green Mushroom · Spore Meadows · Collect Chain Link from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C8 · Siege Breaker 1261 · Fix before you leave
5 · Cooking · Outer World Town · Collect Lugi Bracket from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C4 · Divine Knight 1240 · Fix before you leave
6 · Cooking · Outer World Town · Collect Trusty Nails from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C5 · Arcane Cultist 1231 · Fix before you leave
7 · Cooking · Outer World Town · Collect Purple Screw from the anvil (time to cap: now; it refills about 60 min after you collect)

### C7 · Voidwalker 1158 · Fix before you leave
8 · Divinity · Magma Rivertown · Collect PVC Pipe from the anvil (time to cap: now; it refills about 2 h after you collect)

### C2 · Death Bringer 1292 · Fix before you leave
9 · Doing nothing · Shimmerfin Grove · Send Death Bringer Lv 1,292 to an AFK Target before you leave

### C11 · Beginner 1224 · Fix before you leave
10 · Cooking · Outer World Town · Collect Thread from the anvil (time to cap: now; it refills about under 10 min after you collect)

### C3 · Elemental Sorcerer 1259 · Fix before you leave
11 · Cooking · Outer World Town · Collect Purple Screw from the anvil (time to cap: now; it refills about 3 h after you collect)

### Account · fix 1 before you leave
Fix before you leave
- Fix · Arcade balls stop building: Claim Arcade balls before you leave (time to the claim cap: now) [IdleOn Toolbox, getMaxClaimTime and getArcadeBallsToClaim · 2.3.540]
- Spend · Claim the free pet pull: Claim your free pet pull at Doggy [Toolbox getNextCompanionClaim: anchor + period · 2.3.540]
- Grow · Get the fuel to run a Refinery salt: Get 50 more Magmaspike to run Anionic Salt [Toolbox hasMissingMats · 2.3.540]
- Spend · Play a round of Darts: Play one round of Darts (about 2 min, from any map with the Darts item) [Toolbox getDartsData · 2.3.540]
- Spend · Play a round of Hoops: Play one round of Hoops (about 2 min) [Toolbox getHoopsData · 2.3.540]
- Spend · Fill today's Post Office orders: Fill today's Post Office orders from storage [Toolbox dailyShipments alert · 2.3.540]
show more (5)

## Not covered yet
Cards
Classes and subclasses
Obols
Portals and map doors
Skills, doors and tools
Spend Plan
Talent presets
Talents
Upgrade Vault
Bribes
Forge
Quests
Stamps
Statues
The Owl
Alchemy Pay 2 Win
Islands
3D Printer
Atom Collider
Construction
Equinox
Prayers
Salt Lick
Shrines
Breeding
Cooking
Laboratory

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C10 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C6 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C10 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C6 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C10 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C10 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C11 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C7 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C8 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C9 | fires |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | account | fires | bubbles=19 cauldrons=4 |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | — | silent |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C10 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C11 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C4 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C5 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C6 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C7 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C8 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C9 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | fires | fromEmpty=84098 fullIn=0 product=Boring_Brick |
| anvil.check.caps-before-return | anvil/caps-before-return | C10 | fires | fromEmpty=205400 fullIn=0 product=Chain_Link |
| anvil.check.caps-before-return | anvil/caps-before-return | C11 | fires | fromEmpty=115685 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | fires | fromEmpty=6797845 fullIn=0 product=Purple_Screw |
| anvil.check.caps-before-return | anvil/caps-before-return | C3 | fires | fromEmpty=9188453 fullIn=0 product=Purple_Screw |
| anvil.check.caps-before-return | anvil/caps-before-return | C4 | fires | fromEmpty=459286 fullIn=0 product=Trusty_Nails |
| anvil.check.caps-before-return | anvil/caps-before-return | C5 | fires | fromEmpty=3384226 fullIn=0 product=Purple_Screw |
| anvil.check.caps-before-return | anvil/caps-before-return | C6 | fires | fromEmpty=16121 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C7 | fires | fromEmpty=5937236 fullIn=0 product=PVC_Pipe |
| anvil.check.caps-before-return | anvil/caps-before-return | C8 | fires | fromEmpty=591510 fullIn=0 product=Lugi_Bracket |
| anvil.check.caps-before-return | anvil/caps-before-return | C9 | fires | fromEmpty=4358149 fullIn=0 product=Purple_Screw |
| anvil.check.spend-points | anvil/points | — | silent |  |
| anvil.check.spend-points-capacity | anvil/points | C1 | fires | points=157 product=Boring_Brick |
| anvil.check.spend-points-capacity | anvil/points | C10 | fires | points=16 product=Chain_Link |
| anvil.check.spend-points-capacity | anvil/points | C3 | fires | points=31 product=Purple_Screw |
| anvil.check.spend-points-capacity | anvil/points | C4 | fires | points=4 product=Trusty_Nails |
| anvil.check.spend-points-capacity | anvil/points | C5 | fires | points=66 product=Purple_Screw |
| anvil.check.spend-points-capacity | anvil/points | C6 | fires | points=1 product=Thread |
| anvil.check.spend-points-capacity | anvil/points | C7 | fires | points=21 product=PVC_Pipe |
| anvil.check.spend-points-capacity | anvil/points | C8 | fires | points=159 product=Lugi_Bracket |
| anvil.check.spend-points-capacity | anvil/points | C9 | fires | points=2 product=Purple_Screw |
| arcade.check.balls-cap | arcade/balls-cap | account | fires | capsIn=0 fullFor=662513255 |
| boss-keys.check.collect | boss-keys/banked | — | silent |  |
| colosseum.check.collect-tickets | colosseum/tickets-banked | — | silent |  |
| death-note.check.build | death-note/build | — | silent |  |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | — | silent |  |
| gem-shop.check.unspent | gem-shop/unspent | account | fires | gems=29763382 price=875 |
| merit-shop.check.spend-w1 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-afk-gains | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-arcade-balls | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-boss-gems | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-efaunt-recipes | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-obols | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-respawn | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w3 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w4 | merit-shop/unspent | — | silent |  |
| minigames.check.daily-plays | minigames/daily-plays | account | pass |  |
| minigames.check.darts-play | minigames/cooldown-play | account | fires |  |
| minigames.check.darts-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.hoops-play | minigames/cooldown-play | account | fires |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | account | fires | points=12 |
| minigames.check.spiketrap | minigames/spiketrap | account | pass |  |
| pets.check.free-pull | pets/free-pull | account | fires | hoursClaimable=4 |
| pets.check.mart-gems | pets/mart-gems | — | silent |  |
| poppy.check.open | poppy/pending-fish | account | fires |  |
| post-office.check.daily-orders | post-office/state | account | fires | companies=6 |
| post-office.check.spend-boxes | post-office/state | C1 | fires | boxes=484039 |
| post-office.check.spend-boxes | post-office/state | C10 | fires | boxes=476673 |
| post-office.check.spend-boxes | post-office/state | C11 | fires | boxes=490839 |
| post-office.check.spend-boxes | post-office/state | C2 | fires | boxes=483536 |
| post-office.check.spend-boxes | post-office/state | C3 | fires | boxes=483489 |
| post-office.check.spend-boxes | post-office/state | C4 | fires | boxes=483478 |
| post-office.check.spend-boxes | post-office/state | C5 | fires | boxes=483315 |
| post-office.check.spend-boxes | post-office/state | C6 | fires | boxes=483378 |
| post-office.check.spend-boxes | post-office/state | C7 | fires | boxes=482608 |
| post-office.check.spend-boxes | post-office/state | C8 | fires | boxes=482514 |
| post-office.check.spend-boxes | post-office/state | C9 | fires | boxes=456865 |
| post-office.check.unlock | post-office/state | — | silent |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | fires | dryIn=398 |
| refinery.check.salt-fuel | refinery/salt-off | account | fires | material=Magmaspike more=50 offSalts=1 salt=Anionic_Salt |
| refinery.check.salt-off | refinery/salt-off | — | silent |  |
| systems.yaml#alchemy | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-bubbles | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-p2w | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-vials | worlds/reached | account | reached yes |  |
| systems.yaml#anvil | worlds/reached | account | reached yes |  |
| systems.yaml#arcade | worlds/reached | account | reached yes |  |
| systems.yaml#atom-collider | worlds/reached | account | reached yes |  |
| systems.yaml#boss-keys | worlds/reached | account | reached yes |  |
| systems.yaml#breeding | worlds/reached | account | reached yes |  |
| systems.yaml#bribes | worlds/reached | account | reached yes |  |
| systems.yaml#colosseum | worlds/reached | account | reached yes |  |
| systems.yaml#construction | worlds/reached | account | reached yes |  |
| systems.yaml#cooking | worlds/reached | account | reached yes |  |
| systems.yaml#death-note | worlds/reached | account | reached yes |  |
| systems.yaml#equinox | worlds/reached | account | reached yes |  |
| systems.yaml#forge | worlds/reached | account | reached yes |  |
| systems.yaml#islands | worlds/reached | account | reached yes |  |
| systems.yaml#lab | worlds/reached | account | reached yes |  |
| systems.yaml#owl | worlds/reached | account | reached yes |  |
| systems.yaml#poppy | worlds/reached | account | reached yes |  |
| systems.yaml#post-office | post-office/unlocked | account | reached yes |  |
| systems.yaml#prayers | worlds/reached | account | reached yes |  |
| systems.yaml#printer | worlds/reached | account | reached yes |  |
| systems.yaml#quests | worlds/reached | account | reached yes |  |
| systems.yaml#refinery | worlds/reached | account | reached yes |  |
| systems.yaml#salt-lick | worlds/reached | account | reached yes |  |
| systems.yaml#shrines | worlds/reached | account | reached yes |  |
| systems.yaml#stamps | worlds/reached | account | reached yes |  |
| systems.yaml#statues | worlds/reached | account | reached yes |  |
| systems.yaml#trapping | worlds/reached | account | reached yes |  |
| systems.yaml#worship | worlds/reached | account | reached yes |  |
| task-unlocks.check.spend | task-unlocks/unspent | — | silent |  |
| trapping.check.finishes-early | trapping/finishes-early | C2 | pass |  |
| trapping.check.finishes-early | trapping/finishes-early | C9 | pass |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C1 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C10 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C3 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C4 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C5 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C6 | fires | idleFor=1138240 traps=7 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C7 | fires | idleFor=1138240 traps=6 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C8 | fires | idleFor=1138240 traps=6 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C11 | fires | charge=85 fullIn=0 max=85 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | fires | charge=6781 fullIn=0 max=6781 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C10 | fires | charge=41551 fullIn=0 max=41551 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | fires | charge=6804 fullIn=0 max=6804 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C3 | fires | charge=62717 fullIn=0 max=62717 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C4 | fires | charge=6017 fullIn=0 max=6017 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C5 | fires | charge=48218 fullIn=0 max=48218 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C6 | fires | charge=7807 fullIn=0 max=7807 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C7 | fires | charge=9559 fullIn=0 max=9559 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C8 | fires | charge=6875 fullIn=0 max=6875 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C9 | fires | charge=22014 fullIn=0 max=22014 |
