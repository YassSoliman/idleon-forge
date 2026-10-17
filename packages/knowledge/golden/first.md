# golden v1: first · knowledge #73181c3c · parser 6c37e3d (game 2.3.540) · now 2024-06-07T21:16:34.518Z · return 8h · stage W4-entry

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
6 · Fighting Purp Mushroom · Spaceway Raceway · Traps finish in about 5 h, then sit idle until you're back

### C4 · Divine Knight 86 · Ready
7 · Fighting Purp Mushroom · Spaceway Raceway · Traps finish in about 5 h, then sit idle until you're back

### Account · nothing to fix

## Not covered yet
Cards
Classes and subclasses
Companions and pets
Gem Shop
Merit Shop
Minigames
Obols
Portals and map doors
Skills, doors and tools
Spend Plan
Talent presets
Talents
Tasks
Upgrade Vault
Boss keys
Bribes
Colosseum
Forge
Poppy
Post Office
Quests
Stamps
Statues
The Owl
Alchemy bubbles
Alchemy Pay 2 Win
Alchemy vials
Islands
3D Printer
Atom Collider
Construction
Death Note
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
| arcade.check.balls-cap | arcade/balls-cap | account | pass |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | pass |  |
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
| systems.yaml#post-office | worlds/reached | account | reached yes |  |
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
