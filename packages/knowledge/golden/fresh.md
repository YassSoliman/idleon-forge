# golden v1: fresh · knowledge #94213751 · parser 6c37e3d (game 2.3.540) · now 2026-08-20T18:41:58.956Z · return 8h · stage W4-entry · stale: 4 of 328

## Verdict changes

## Now
0 of 3 Ready · fix 3 before you leave

### C2 · Blood Berserker 534 · Fix before you leave
1 · Doing nothing · Spirit Village · Send Blood Berserker Lv 534 to an AFK Target before you leave

### C1 · Siege Breaker 478 · Fix before you leave
2 · Doing nothing · Frostbite Towndra · Send Siege Breaker Lv 478 to an AFK Target before you leave

### C3 · Beginner 1 · Fix before you leave
3 · Doing nothing · Blunder Hills · [Traps idle in about 8 h] · Send Beginner Lv 1 to an AFK Target before you leave

### Account · Unknown
Unknown: can't tell from the save
- Spend · Collect banked Colosseum tickets: Collect 9 Colosseum tickets [IdleOn Wiki: Typhoon · Calculated by IdleOn Toolbox · 2.3.540]
- Extra · Play Spiketrap Surprise: Spiketrap starts at :00: up to 40 gems today [IdleOn Wiki: Secrets · Calculated by IdleOn Toolbox · 2.3.540]
- Extra · Claim the free Pet Mart gems: Claim today's free Pet Mart gems [IdleOn Wiki: Daily Checklist · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Use your vial attempts: Use your 18 vial attempts on the W2 town cauldron [IdleOn Wiki: Alchemy/Vials · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Fill today's Post Office orders: Fill today's Post Office orders from storage [IdleOn Wiki: Post Office, orders · Calculated by IdleOn Toolbox · 2.3.540]
show more (9)

## Not covered yet
Classes and subclasses
Portals and map doors
Skills, doors and tools
Upgrade Vault
Bribes
Forge
Quests
Statues
The Owl
Alchemy Pay 2 Win
Islands
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
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | — | silent |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | — | silent |  |
| afk.check.low-food-untimed | afk/low-food-untimed | — | silent |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | fires |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | fires |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | account | unknown (field-missing) |  |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | account | fires | bubbles=7 cauldrons=3 |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | account | unknown (field-missing) |  |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | account | fires | attempts=18 |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | unknown (field-missing) |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C3 | pass |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | unknown (field-missing) |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | unknown (field-missing) |  |
| anvil.check.fill-time | anvil/fill-time | C1 | unknown (field-missing) |  |
| anvil.check.fill-time | anvil/fill-time | C2 | unknown (field-missing) |  |
| anvil.check.respec | anvil/respec | — | silent |  |
| anvil.check.spend-points | anvil/points | C1 | unknown (field-missing) |  |
| anvil.check.spend-points | anvil/points | C2 | fires | capacity=0 points=4 speed=4 |
| anvil.check.spend-points | anvil/points | C3 | fires | capacity=0 points=1 speed=1 |
| anvil.check.spend-points | anvil/points | account | fires | count=2 hours=8 |
| arcade.check.balls-cap | arcade/balls-cap | account | unknown (field-missing) |  |
| boss-keys.check.collect | boss-keys/banked | C2 | fires | chizoar=6 daysLost=50 efaunt=6 forestVilla=6 total=18 |
| colosseum.check.collect-tickets | colosseum/tickets-banked | account | fires | cappedNpcs=3 daysLost=50 total=9 |
| death-note.check.build | death-note/build | — | silent |  |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | — | silent |  |
| gem-shop.check.unspent | gem-shop/unspent | account | fires | gems=4500 price=875 |
| merit-shop.check.spend-w1 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-afk-gains | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-arcade-balls | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-boss-gems | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-efaunt-recipes | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-obols | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-respawn | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w3 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w4 | merit-shop/unspent | account | fires | unspent=7 world=4 |
| minigames.check.daily-plays | minigames/daily-plays | — | silent |  |
| minigames.check.darts-play | minigames/cooldown-play | — | silent |  |
| minigames.check.darts-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.hoops-play | minigames/cooldown-play | — | silent |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.spiketrap | minigames/spiketrap | account | fires | gems=40 minutes=18 |
| pets.check.free-pull | pets/free-pull | account | unknown (field-missing) |  |
| pets.check.mart-gems | pets/mart-gems | account | fires | shopDay=183 |
| poppy.check.open | poppy/pending-fish | — | silent |  |
| post-office.check.daily-orders | post-office/state | account | fires | companies=6 |
| post-office.check.spend-boxes | post-office/state | C1 | fires | boxes=16630 |
| post-office.check.spend-boxes | post-office/state | C2 | fires | boxes=16127 |
| post-office.check.spend-boxes | post-office/state | C3 | fires | boxes=23430 |
| post-office.check.spend-boxes | post-office/state | account | fires | boxes=56187 count=3 |
| post-office.check.unlock | post-office/state | — | silent |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | fires | dryIn=19181 |
| refinery.check.salt-fuel | refinery/salt-off | — | silent |  |
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
| task-unlocks.check.spend | task-unlocks/unspent | account | fires | points=180 |
| trapping.check.finishes-early | trapping/finishes-early | C1 | unknown (field-missing) |  |
| trapping.check.finishes-early | trapping/finishes-early | C2 | pass |  |
| trapping.check.finishes-early | trapping/finishes-early | C3 | fires | finishesIn=28300723 |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | unknown (field-missing) |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C3 | pass |  |
