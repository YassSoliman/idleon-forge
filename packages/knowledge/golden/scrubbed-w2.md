# golden v1: scrubbed-w2 · knowledge #3f060777 · parser 6c37e3d (game 2.3.540) · now 2026-10-17T15:47:05.447Z · return 8h · stage (engine not built)

## Verdict changes

## Now
! Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet

### C1 · Barbarian 60 · Unknown
1 · Fighting Poop · Poopy Sewers · Not covered yet: AFK safety

### C5 · Wizard 56 · Unknown
2 · Fighting Snelbie · Djonnuttown · Not covered yet: AFK safety

### C4 · Bowman 54 · Unknown
3 · Fighting Green Mushroom · Spore Meadows · Not covered yet: AFK safety

### C3 · Shaman 44 · Unknown
4 · Fighting Slime · Jungle Perimeter · Not covered yet: AFK safety

### C2 · Squire 43 · Unknown
5 · Mining Copper · Tunnels Entrance · Not covered yet: AFK safety

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

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C1 | fires | food=Meat_Pie owned=105 survivability=78 |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C3 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C4 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C5 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C1 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C3 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C4 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C5 | unknown (needs-history) |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C1 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C3 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C4 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C4 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C5 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | fires | current=32 max=32 |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | fires | fromEmpty=9921071 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | fires | fromEmpty=5478419 fullIn=4895608 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C3 | fires | fromEmpty=6352294 fullIn=5716316 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C4 | fires | fromEmpty=7355512 fullIn=6511814 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C5 | fires | fromEmpty=21754983 fullIn=20847580 product=Thread |
| arcade.check.balls-cap | arcade/balls-cap | account | fires | capsIn=0 fullFor=173852724 |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | — | silent |  |
| systems.yaml#alchemy | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-bubbles | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-p2w | worlds/reached | account | reached yes |  |
| systems.yaml#alchemy-vials | worlds/reached | account | reached yes |  |
| systems.yaml#anvil | worlds/reached | account | reached yes |  |
| systems.yaml#arcade | worlds/reached | account | reached yes |  |
| systems.yaml#atom-collider | worlds/reached | account | reached no |  |
| systems.yaml#boss-keys | worlds/reached | account | reached yes |  |
| systems.yaml#breeding | worlds/reached | account | reached no |  |
| systems.yaml#bribes | worlds/reached | account | reached yes |  |
| systems.yaml#colosseum | worlds/reached | account | reached yes |  |
| systems.yaml#construction | worlds/reached | account | reached no |  |
| systems.yaml#cooking | worlds/reached | account | reached no |  |
| systems.yaml#death-note | worlds/reached | account | reached no |  |
| systems.yaml#equinox | worlds/reached | account | reached no |  |
| systems.yaml#forge | worlds/reached | account | reached yes |  |
| systems.yaml#islands | worlds/reached | account | reached yes |  |
| systems.yaml#lab | worlds/reached | account | reached no |  |
| systems.yaml#owl | worlds/reached | account | reached yes |  |
| systems.yaml#poppy | worlds/reached | account | reached yes |  |
| systems.yaml#post-office | worlds/reached | account | reached yes |  |
| systems.yaml#prayers | worlds/reached | account | reached no |  |
| systems.yaml#printer | worlds/reached | account | reached no |  |
| systems.yaml#quests | worlds/reached | account | reached yes |  |
| systems.yaml#refinery | worlds/reached | account | reached no |  |
| systems.yaml#salt-lick | worlds/reached | account | reached no |  |
| systems.yaml#shrines | worlds/reached | account | reached no |  |
| systems.yaml#stamps | worlds/reached | account | reached yes |  |
| systems.yaml#statues | worlds/reached | account | reached yes |  |
| systems.yaml#trapping | worlds/reached | account | reached no |  |
| systems.yaml#worship | worlds/reached | account | reached no |  |
| trapping.check.finishes-early | trapping/finishes-early | — | silent |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | — | silent |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | — | silent |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | — | silent |  |
