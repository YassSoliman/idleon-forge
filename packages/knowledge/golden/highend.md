# golden v1: highend · knowledge #6f7605ea · parser 6c37e3d (game 2.3.540) · now 2026-08-10T21:25:42.904Z · return 8h · stage (engine not built)

## Verdict changes

## Now
! Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet

### C4 · Divine Knight 1819 · Unknown
1 · Doing nothing · Shimmerfin Grove · Not covered yet: AFK safety

### C8 · Voidwalker 1764 · Unknown
2 · Spelunking C1 Way Opening · Coralcave Perimeter · Not covered yet: AFK safety

### C5 · Arcane Cultist 1762 · Unknown
3 · Fighting Trench Fish · Deep End of the Koipond · Not covered yet: AFK safety

### C6 · Wind Walker 1744 · Unknown
4 · Fighting Trench Fish · Deep End of the Koipond · Not covered yet: AFK safety

### C9 · Arcane Cultist 1743 · Unknown
5 · Fighting Trench Fish · Deep End of the Koipond · Not covered yet: AFK safety

### C10 · Wind Walker 1742 · Unknown
6 · Fighting Trench Fish · Deep End of the Koipond · Not covered yet: AFK safety

### C3 · Elemental Sorcerer 1734 · Unknown
7 · Spelunking Buried Church · Middle of Nowhere · Not covered yet: AFK safety

### C7 · Divine Knight 1734 · Unknown
8 · Doing nothing · Blunder Hills · Not covered yet: AFK safety

### C2 · Siege Breaker 1725 · Unknown
9 · Spelunking Buried Church · Middle of Nowhere · Not covered yet: AFK safety

### C11 · Beginner 1717 · Unknown
10 · Paying respect Bravery · The Hole · Not covered yet: AFK safety

### C1 · Death Bringer 1701 · Unknown
11 · Cooking · Outer World Town · Not covered yet: AFK safety

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
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C10 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C5 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C6 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C9 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C10 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C5 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C6 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C9 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C10 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C5 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C6 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C9 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C10 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C11 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C7 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C8 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C9 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
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
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | fires | fromEmpty=182625 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C10 | fires | fromEmpty=73635 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C11 | fires | fromEmpty=36425 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | fires | fromEmpty=38743 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C3 | fires | fromEmpty=156003 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C4 | fires | fromEmpty=454036 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C5 | fires | fromEmpty=250828 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C6 | fires | fromEmpty=150361 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C7 | fires | fromEmpty=158223 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C8 | fires | fromEmpty=411744 fullIn=0 product=Thingymabob |
| anvil.check.caps-before-return | anvil/caps-before-return | C9 | fires | fromEmpty=129118 fullIn=0 product=Thingymabob |
| arcade.check.balls-cap | arcade/balls-cap | account | pass |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | fires | dryIn=0 |
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
| trapping.check.finishes-early | trapping/finishes-early | C1 | fires | finishesIn=11364853 |
| trapping.check.finishes-early | trapping/finishes-early | C10 | fires | finishesIn=11364853 |
| trapping.check.finishes-early | trapping/finishes-early | C11 | fires | finishesIn=11360853 |
| trapping.check.finishes-early | trapping/finishes-early | C2 | fires | finishesIn=11360853 |
| trapping.check.finishes-early | trapping/finishes-early | C3 | fires | finishesIn=11364853 |
| trapping.check.finishes-early | trapping/finishes-early | C4 | fires | finishesIn=11352853 |
| trapping.check.finishes-early | trapping/finishes-early | C5 | fires | finishesIn=11360853 |
| trapping.check.finishes-early | trapping/finishes-early | C6 | fires | finishesIn=11364853 |
| trapping.check.finishes-early | trapping/finishes-early | C7 | fires | finishesIn=11364853 |
| trapping.check.finishes-early | trapping/finishes-early | C8 | fires | finishesIn=11362853 |
| trapping.check.finishes-early | trapping/finishes-early | C9 | fires | finishesIn=11360853 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C10 | fires | idleFor=16235147 traps=1 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C11 | fires | idleFor=16239147 traps=1 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | — | silent |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | fires | charge=31307 fullIn=0 max=31307 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C10 | fires | charge=31307 fullIn=0 max=31307 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C11 | fires | charge=31176 fullIn=0 max=31176 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | fires | charge=31307 fullIn=0 max=31307 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C3 | fires | charge=135228 fullIn=0 max=135228 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C4 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C5 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C6 | fires | charge=31307 fullIn=0 max=31307 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C7 | fires | charge=31307 fullIn=0 max=31307 |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C8 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C9 | pass |  |
