# golden v1: fourth · knowledge #d1633f9f · parser 6c37e3d (game 2.3.540) · now 2024-05-17T07:51:22.362Z · return 8h · stage W4-entry · stale: 8 of 329

## Verdict changes

## Now
1 of 2 Ready · fix 1 before you leave

### C2 · Beginner 1 · Fix before you leave
1 · Doing nothing · Blunder Hills · Send Beginner Lv 1 to an AFK Target before you leave

### C1 · Voidwalker 476 · Ready
2 · Fighting Woodlin Spirit · Edge of the Valley · Nothing to do here

### Account · nothing to fix
- Extra · Play Spiketrap Surprise: Spiketrap starts at :00: up to 40 gems today [IdleOn Wiki: Secrets · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Play a round of Hoops: Play one round of Hoops (about 2 min) [IdleOn Wiki: Minigames, Swishy Hoops · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Fill today's Post Office orders: Fill today's Post Office orders from storage [IdleOn Wiki: Post Office, orders · Calculated by IdleOn Toolbox · 2.3.540]
- Extra · Gems unspent: 999 gems unspent [IdleOn Wiki: Gem Shop]
  sources disagree: Infinity Hammer first: the universal first buy. | Extra Card Slots and the Crystal 3D Printer first; the hammer is no longer necessary.
- Spend · Spend W1 merits: Spend 12 W1 merits [IdleOn Wiki: Tasks/Blunder Hills, Merit Shop tab · Calculated by IdleOn Toolbox · 2.3.540]
show more (8)

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
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C1 | pass |  |
| afk.check.health-food-runs-out | afk/health-food-runs-out | C1 | pass |  |
| afk.check.low-food-untimed | afk/low-food-untimed | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | fires |  |
| afk.check.skiller-carry | afk/skiller-carry | — | silent |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | — | silent |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C1 | pass |  |
| alchemy.check.cauldron-unassigned | alchemy/cauldron-unassigned | C2 | unknown (field-missing) |  |
| alchemy.check.liquid-cap | alchemy/liquid-cap | — | silent |  |
| alchemy.check.liquid-cap-line | alchemy/liquid-cap | account | pass |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C1 | unknown (field-missing) |  |
| anvil.check.caps-before-return | anvil/caps-before-return | C2 | unknown (field-missing) |  |
| anvil.check.fill-time | anvil/fill-time | C1 | unknown (field-missing) |  |
| anvil.check.fill-time | anvil/fill-time | C2 | unknown (field-missing) |  |
| anvil.check.respec | anvil/respec | — | silent |  |
| anvil.check.spend-points | anvil/points | C2 | unknown (field-missing) |  |
| arcade.check.balls-cap | arcade/balls-cap | account | pass |  |
| boss-keys.check.collect | boss-keys/banked | — | silent |  |
| colosseum.check.collect-tickets | colosseum/tickets-banked | — | silent |  |
| death-note.check.build | death-note/build | — | silent |  |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | — | silent |  |
| gem-shop.check.unspent | gem-shop/unspent | account | fires | gems=999 price=875 |
| merit-shop.check.spend-w1 | merit-shop/unspent | account | fires | unspent=12 world=1 |
| merit-shop.check.spend-w2 | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-afk-gains | merit-shop/unspent | account | fires | unspent=17 world=2 |
| merit-shop.check.spend-w2-arcade-balls | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-boss-gems | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-efaunt-recipes | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-obols | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w2-respawn | merit-shop/unspent | — | silent |  |
| merit-shop.check.spend-w3 | merit-shop/unspent | account | fires | unspent=27 world=3 |
| merit-shop.check.spend-w4 | merit-shop/unspent | account | fires | unspent=4 world=4 |
| minigames.check.daily-plays | minigames/daily-plays | account | pass |  |
| minigames.check.darts-play | minigames/cooldown-play | — | silent |  |
| minigames.check.darts-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.hoops-play | minigames/cooldown-play | account | fires |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | — | silent |  |
| minigames.check.spiketrap | minigames/spiketrap | account | fires | gems=40 minutes=9 |
| pets.check.free-pull | pets/free-pull | account | pass |  |
| pets.check.mart-gems | pets/mart-gems | account | unknown (field-missing) |  |
| poppy.check.open | poppy/pending-fish | — | silent |  |
| post-office.check.daily-orders | post-office/state | account | fires | companies=3 |
| post-office.check.spend-boxes | post-office/state | C1 | fires | boxes=4116 |
| post-office.check.spend-boxes | post-office/state | C2 | fires | boxes=29516 |
| post-office.check.spend-boxes | post-office/state | account | fires | boxes=33632 count=2 |
| post-office.check.unlock | post-office/state | — | silent |  |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | account | fires | dryIn=3382000 |
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
| task-unlocks.check.spend | task-unlocks/unspent | account | fires | points=265 |
| trapping.check.finishes-early | trapping/finishes-early | C1 | pass |  |
| trapping.check.finishes-early | trapping/finishes-early | C2 | unknown (field-missing) |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | C2 | unknown (field-missing) |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | C2 | unknown (field-missing) |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C1 | pass |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | C2 | unknown (field-missing) |  |
