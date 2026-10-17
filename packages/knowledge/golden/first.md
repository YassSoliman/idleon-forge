# golden v1: first · knowledge #76ea6859 · parser 6c37e3d (game 2.3.540) · now 2024-06-07T21:16:34.518Z · return 8h · stage W4-entry

## Verdict changes

## Now
2 of 7 Ready · fix 2 before you leave · 3 Unknown

### C7 · Maestro 73 · Fix before you leave
1 · Doing nothing · YumYum Grotto · Send Maestro Lv 73 to an AFK Target before you leave

### C5 · Elemental Sorcerer 87 · Fix before you leave
2 · In the Lab · Outer World Town · Collect Chain Link from the anvil (time to cap: now; it refills about 1 d after you collect)

### C2 · Bubonic Conjuror 87 · Unknown
3 · In the Lab · Outer World Town · Not covered yet: AFK safety

### C6 · Beast Master 87 · Unknown
4 · In the Lab · Outer World Town · Not covered yet: AFK safety

### C3 · Siege Breaker 86 · Unknown
5 · In the Lab · Outer World Town · Not covered yet: AFK safety

### C1 · Blood Berserker 96 · Ready
6 · Fighting Purp Mushroom · Spaceway Raceway · Collect 2 boss keys

### C4 · Divine Knight 86 · Ready
7 · Fighting Purp Mushroom · Spaceway Raceway · Spend 1 anvil points on Speed

### Account · nothing to fix
- Grow · Switch on a Refinery salt: Switch on Explosive Salts in the Refinery [Toolbox hasMissingMats · 2.3.540]
- Spend · Collect banked Colosseum tickets: Collect 9 Colosseum tickets [Toolbox enhanceColoTickets: day counters, one a day, 3-day bank · 2.3.540]
- Spend · Play a round of Hoops: Play one round of Hoops (about 2 min) [Toolbox getHoopsData · 2.3.540]
- Spend · Use your vial attempts: Use your 13 vial attempts on the W2 town cauldron [Toolbox vialsAttempts alert: attempts left and a locked vial's item held · 2.3.540]
- Spend · Fill today's Post Office orders: Fill today's Post Office orders from storage [Toolbox dailyShipments alert · 2.3.540]
show more (4)

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
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C1 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C4 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C1 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C4 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C1 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C7 | fires |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | account | fires | attempts=13 |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C4 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C5 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C6 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C7 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C3 | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C4 | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C5 | fires | fromEmpty=117980523 fullIn=0 product=Chain_Link |
| anvil.check.caps-before-return | anvil/caps-before-return | C6 | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C7 | pass |  |
| anvil.check.spend-points | anvil/points | C4 | fires | points=1 |
| anvil.check.spend-points-capacity | anvil/points | — | silent |  |
| arcade.check.balls-cap | arcade/balls-cap | account | pass |  |
| boss-keys.check.collect | boss-keys/banked | C1 | fires | chizoar=0 daysLost=0 efaunt=2 forestVilla=0 total=2 |
| colosseum.check.collect-tickets | colosseum/tickets-banked | account | fires | cappedNpcs=2 daysLost=48 total=9 |
| death-note.check.build | death-note/build | — | silent |  |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | — | silent |  |
| gem-shop.check.unspent | gem-shop/unspent | account | fires | gems=304 price=875 |
| merit-shop.check.spend-w1 | merit-shop/unspent | account | fires | unspent=3 world=1 |
| merit-shop.check.spend-w2 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-afk-gains | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-arcade-balls | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-boss-gems | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-efaunt-recipes | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-obols | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-respawn | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w3 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w4 | merit-shop/unspent | account | fires | unspent=3 world=4 |
| minigames.check.daily-plays | minigames/daily-plays | account | pass |  |
| minigames.check.darts-play | minigames/cooldown-play | — | silent |  |
| minigames.check.darts-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.hoops-play | minigames/cooldown-play | account | fires |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.spiketrap | minigames/spiketrap | account | pass |  |
| pets.check.free-pull | pets/free-pull | account | pass |  |
| pets.check.mart-gems | pets/mart-gems | account | unknown (field-missing) |  |
| poppy.check.open | poppy/pending-fish | — | silent |  |
| post-office.check.daily-orders | post-office/state | account | fires | companies=1 |
| post-office.check.spend-boxes | post-office/state | C1 | fires | boxes=5 |
| post-office.check.spend-boxes | post-office/state | C2 | fires | boxes=7 |
| post-office.check.spend-boxes | post-office/state | C3 | fires | boxes=2 |
| post-office.check.spend-boxes | post-office/state | C4 | fires | boxes=4 |
| post-office.check.spend-boxes | post-office/state | C5 | fires | boxes=3 |
| post-office.check.spend-boxes | post-office/state | C6 | fires | boxes=3 |
| post-office.check.unlock | post-office/state | — | silent |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | pass |  |
| refinery.check.salt-fuel | refinery/salt-off | — | silent |  |
| refinery.check.salt-off | refinery/salt-off | account | fires | offSalts=2 salt=Explosive_Salts |
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
| task-unlocks.check.spend | task-unlocks/unspent | account | fires | points=15 |
| trapping.check.finishes-early | trapping/finishes-early | C1 | fires | finishesIn=16381026 |
| trapping.check.finishes-early | trapping/finishes-early | C2 | fires | finishesIn=16375026 |
| trapping.check.finishes-early | trapping/finishes-early | C3 | fires | finishesIn=16375026 |
| trapping.check.finishes-early | trapping/finishes-early | C4 | fires | finishesIn=16379026 |
| trapping.check.finishes-early | trapping/finishes-early | C5 | fires | finishesIn=16376026 |
| trapping.check.finishes-early | trapping/finishes-early | C6 | fires | finishesIn=16377026 |
| trapping.check.finishes-early | trapping/finishes-early | C7 | fires | finishesIn=765678 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | — | silent |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | — | silent |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C3 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C4 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C5 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C6 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C7 | pass |  |
