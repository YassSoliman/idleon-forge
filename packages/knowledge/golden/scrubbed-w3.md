# golden v1: scrubbed-w3 · knowledge #73181c3c · parser 6c37e3d (game 2.3.540) · now 2026-10-17T16:12:33.140Z · return 8h · stage W3-early

## Verdict changes

## Now
0 of 6 Ready · fix 6 before you leave

### C4 · Squire 85 · Fix before you leave
1 · Fighting Thermister · Thermonuclear Climb · Collect Thread from the anvil (time to cap: now; it refills about 5 h after you collect)

### C3 · Bowman 60 · Fix before you leave
2 · Fighting Sand Giant · Sands of Time · Collect Leather Hide from the anvil (time to cap: now; it refills about 8 h after you collect)

### C5 · Barbarian 56 · Fix before you leave
3 · Fishing Small Fish · Salty Shores · Collect Thread from the anvil (time to cap: now; it refills about 6 h after you collect)

### C6 · Shaman 54 · Fix before you leave
4 · Fighting Sand Castle · Shifty Sandbox · Collect Thread from the anvil (time to cap: now; it refills about 3 h after you collect)

### C2 · Squire 51 · Fix before you leave
5 · Mining Gold · Freefall Caverns · Collect Thread from the anvil (time to cap: now; it refills about 2 h after you collect)

### C1 · Wizard 73 · Fix before you leave
6 · Fighting Sir Stache · The Stache Split · Collect Thread from the anvil (time to cap: now; it refills about 5 h after you collect)

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

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C1 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C3 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C4 | pass |  |
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C6 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C1 | unknown (needs-history) |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C3 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C4 | unknown (needs-history) |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C6 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C1 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C3 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C4 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C6 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C2 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C5 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C4 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C5 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C6 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | fires | fromEmpty=17494310 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | fires | fromEmpty=8965705 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C3 | fires | fromEmpty=29437224 fullIn=0 product=Leather_Hide |
| anvil.check.caps-before-return | anvil/caps-before-return | C4 | fires | fromEmpty=18509032 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C5 | fires | fromEmpty=20337884 fullIn=0 product=Thread |
| anvil.check.caps-before-return | anvil/caps-before-return | C6 | fires | fromEmpty=9607482 fullIn=0 product=Thread |
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
| systems.yaml#breeding | worlds/reached | account | reached no |  |
| systems.yaml#bribes | worlds/reached | account | reached yes |  |
| systems.yaml#colosseum | worlds/reached | account | reached yes |  |
| systems.yaml#construction | worlds/reached | account | reached yes |  |
| systems.yaml#cooking | worlds/reached | account | reached no |  |
| systems.yaml#death-note | worlds/reached | account | reached yes |  |
| systems.yaml#equinox | worlds/reached | account | reached yes |  |
| systems.yaml#forge | worlds/reached | account | reached yes |  |
| systems.yaml#islands | worlds/reached | account | reached yes |  |
| systems.yaml#lab | worlds/reached | account | reached no |  |
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
| trapping.check.finishes-early | trapping/finishes-early | — | silent |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | — | silent |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C1 | pass |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C2 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C3 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C4 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C5 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C6 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | — | silent |  |
