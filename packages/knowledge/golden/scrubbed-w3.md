# golden v1: scrubbed-w3 · knowledge #98161ca1 · parser 6c37e3d (game 2.3.540) · now 2026-10-17T16:12:33.140Z · return 8h · stage W3-early

## Verdict changes

## Now
0 of 6 Ready · fix 6 before you leave

### C4 · Squire 85 · Fix before you leave
1 · Fighting Thermister · Thermonuclear Climb · Collect Thread from the anvil (time to cap: now; it refills about 5 h after you collect)

### C6 · Shaman 54 · Fix before you leave
2 · Fighting Sand Castle · Shifty Sandbox · Collect Thread from the anvil (time to cap: now; it refills about 3 h after you collect)

### C3 · Bowman 60 · Fix before you leave
3 · Fighting Sand Giant · Sands of Time · Collect Leather Hide from the anvil (time to cap: now; it refills about 8 h after you collect)

### C5 · Barbarian 56 · Fix before you leave
4 · Fishing Small Fish · Salty Shores · Collect Thread from the anvil (time to cap: now; it refills about 6 h after you collect)

### C2 · Squire 51 · Fix before you leave
5 · Mining Gold · Freefall Caverns · Collect Thread from the anvil (time to cap: now; it refills about 2 h after you collect)

### C1 · Wizard 73 · Fix before you leave
6 · Fighting Sir Stache · The Stache Split · Collect Thread from the anvil (time to cap: now; it refills about 5 h after you collect)

### Account · nothing to fix
- Grow · Get the fuel to run a Refinery salt: Get 1 more Bullfrog Horn to run Explosive Salts [IdleOn Wiki: Construction, Refinery · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Collect banked Colosseum tickets: Collect 4 Colosseum tickets [IdleOn Wiki: Typhoon · Calculated by IdleOn Toolbox · 2.3.540]
- Grow · Pay for the Death Note's first level: Refine 10 Explosive Salts for the Death Note's first level (have 0) [IdleOn Wiki: Construction · Calculated by IdleOn Toolbox · 2.3.540]
- Extra · Claim the free Pet Mart gems: Claim today's free Pet Mart gems [IdleOn Wiki: Daily Checklist · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Play a round of Darts: Play one round of Darts (about 2 min, from any map with the Darts item) [IdleOn Wiki: Minigames, Throwy Darts · Calculated by IdleOn Toolbox · 2.3.540]
show more (14)
If you have time
- Use today's 4 minigame plays · about 10m of hands-on play
- XxX Cattleprod XxX 2 on Squire 85: kill 30 Mafiosos and 18 Sand Castles before the timer runs out → Mason Jar Stamp and Fishhead Stamp · about 10m of hands-on play
- Crystalswine 1 on Squire 85: kill every Cryosnake on the map before time runs out → Hermes Stamp · about 10m of hands-on play
- Wellington 1 on Squire 85: find the 3 invisible platforms hidden around the game → Arcane Stamp and Brainstew Stamps; then: Wellington 2 gives Fly Intel Stamp and Holy Mackerel Stamp, and you already hold the 2,500 High Steaks, Wakka Cherry and Singlecle, but it needs 11 more free inventory slots · about 15m of hands-on play

## Not covered yet
Classes and subclasses
Portals and map doors
Skills, doors and tools
Spend Plan
Talent presets
Talents
Upgrade Vault
Bribes
Forge
Quests
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
| afk.check.low-food-untimed | afk/low-food-untimed | C1 | fires | left=153 threshold=251 |
| afk.check.low-food-untimed | afk/low-food-untimed | C3 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C4 | fires | left=146 threshold=188 |
| afk.check.low-food-untimed | afk/low-food-untimed | C6 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C6 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C2 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C5 | pass |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | C6 | fires | bubble=HAMMER_HAMMER empty=2 |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | C6 | fires | bubble=LEVEL_UP_GIFT empty=2 |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | account | fires | bubbles=7 cauldrons=4 |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | C1 | fires | bubble=HAMMER_HAMMER from=MOLTO_LOGGO |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | — | silent |  |
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
| anvil.check.fill-time | anvil/fill-time | — | silent |  |
| anvil.check.respec | anvil/respec | C1 | fires | capacity=23 morePct=30 speed=7 times=1.3 |
| anvil.check.respec | anvil/respec | account | fires | count=1 hours=8 mixedPct=1 morePct=30 times=1.3 |
| anvil.check.spend-points | anvil/points | C3 | fires | capacity=0 points=3 speed=3 |
| anvil.check.spend-points | anvil/points | account | fires | count=1 hours=8 oneSpeed=1 |
| arcade.check.balls-cap | arcade/balls-cap | account | pass |  |
| boss-keys.check.collect | boss-keys/banked | C4 | fires | chizoar=0 daysLost=0 efaunt=2 forestVilla=4 total=6 |
| colosseum.check.collect-tickets | colosseum/tickets-banked | account | fires | cappedNpcs=1 daysLost=2 total=4 |
| death-note.check.build | death-note/build | account | fires | cost=10 held=0 |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | account | fires | gems=365 price=875 |
| gem-shop.check.unspent | gem-shop/unspent | — | silent |  |
| merit-shop.check.spend-w1 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-afk-gains | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-arcade-balls | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-boss-gems | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-efaunt-recipes | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-obols | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-respawn | merit-shop/unspent | account | fires | unspent=1 world=2 |
| merit-shop.check.spend-w3 | merit-shop/unspent | account | fires | unspent=3 world=3 |
| merit-shop.check.spend-w4 | merit-shop/unspent | — | silent |  |
| minigames.check.daily-plays | minigames/daily-plays | account | fires | choppinTarget=125 plays=4 |
| minigames.check.darts-play | minigames/cooldown-play | account | fires |  |
| minigames.check.darts-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.hoops-play | minigames/cooldown-play | account | fires |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.spiketrap | minigames/spiketrap | account | pass |  |
| pets.check.free-pull | pets/free-pull | account | pass |  |
| pets.check.mart-gems | pets/mart-gems | account | fires | shopDay=241 |
| poppy.check.open | poppy/pending-fish | account | fires |  |
| post-office.check.daily-orders | post-office/state | — | silent |  |
| post-office.check.spend-boxes | post-office/state | — | silent |  |
| post-office.check.unlock | post-office/state | C4 | fires | boxes=4 |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | pass |  |
| refinery.check.salt-fuel | refinery/salt-off | account | fires | material=Bullfrog_Horn more=1 offSalts=1 salt=Explosive_Salts |
| refinery.check.salt-off | refinery/salt-off | — | silent |  |
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
| systems.yaml#post-office | post-office/unlocked | account | reached no |  |
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
| task-unlocks.check.spend | task-unlocks/unspent | account | fires | points=10 |
| trapping.check.finishes-early | trapping/finishes-early | — | silent |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | — | silent |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C1 | pass |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C2 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C3 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C4 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C5 | fires | charge=50 fullIn=0 max=50 |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C6 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | — | silent |  |
