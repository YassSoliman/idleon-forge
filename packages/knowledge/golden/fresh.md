# golden v1: fresh · knowledge #3f060777 · parser 6c37e3d (game 2.3.540) · now 2026-08-20T18:41:58.956Z · return 8h · stage (engine not built)

## Verdict changes

## Now
! Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet

### C2 · Blood Berserker 534 · Unknown
1 · Doing nothing · Spirit Village · Not covered yet: AFK safety

### C1 · Siege Breaker 478 · Unknown
2 · Doing nothing · Frostbite Towndra · Not covered yet: AFK safety

### C3 · Beginner 1 · Unknown
3 · Doing nothing · Blunder Hills · Not covered yet: AFK safety

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
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | — | silent |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | — | silent |  |
| afk.check.low-food-untimed | afk/low-food-untimed | — | silent |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | fires |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | unknown (field-missing) |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | unknown (field-missing) |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | unknown (field-missing) |  |
| arcade.check.balls-cap | arcade/balls-cap | account | unknown (field-missing) |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | fires | dryIn=19181 |
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
| trapping.check.finishes-early | trapping/finishes-early | C1 | unknown (field-missing) |  |
| trapping.check.finishes-early | trapping/finishes-early | C2 | pass |  |
| trapping.check.finishes-early | trapping/finishes-early | C3 | fires | finishesIn=28300723 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C3 | pass |  |
