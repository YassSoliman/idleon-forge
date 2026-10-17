# golden v1: scrubbed-w2 · knowledge #edf53166 · parser 6c37e3d (game 2.3.540) · now 2026-10-17T15:47:05.447Z · return 8h · stage W2-late

## Verdict changes

## Now
4 of 5 Ready · fix 1 before you leave · fix 2 in Account

### C1 · Barbarian 60 · Fix before you leave
1 · Fighting Poop · Poopy Sewers · Equip or swap in Meat Pie before you leave: Barbarian is at 78% survivability, and you own 105

### C2 · Squire 43 · Ready
2 · Mining Copper · Tunnels Entrance · Equip Wyoming blood in a big-bubble slot

### C5 · Wizard 56 · Ready
3 · Fighting Snelbie · Djonnuttown · Collect Thread from the anvil (time to cap: 6 h; it refills about 6 h after you collect)

### C4 · Bowman 54 · Ready
4 · Fighting Green Mushroom · Spore Meadows · Collect Thread from the anvil (time to cap: 2 h; it refills about 2 h after you collect)

### C3 · Shaman 44 · Ready
5 · Fighting Slime · Jungle Perimeter · Collect Thread from the anvil (time to cap: 2 h; it refills about 2 h after you collect)

### Account · fix 2 before you leave
Fix before you leave
- Fix · Water at cap: Spend Water (bubbles, vials or the Liquid Shop): it's at cap (32 of 32) and may refill before you're back [IdleOn Wiki: Alchemy, liquids · Calculated by IdleOn Toolbox · 2.3.540]
- Fix · Arcade balls stop building: Claim Arcade balls before you leave (time to the claim cap: now) [IdleOn Wiki: Arcade · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Claim the free pet pull: Claim your free pet pull at Doggy [IdleOn Wiki: Pets · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Collect banked Colosseum tickets: Collect 5 Colosseum tickets [IdleOn Wiki: Typhoon · Calculated by IdleOn Toolbox · 2.3.540]
- Extra · Play Spiketrap Surprise: Spiketrap starts at :00: up to 40 gems today [IdleOn Wiki: Secrets · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Play a round of Darts: Play one round of Darts (about 2 min, from any map with the Darts item) [IdleOn Wiki: Minigames, Throwy Darts · Calculated by IdleOn Toolbox · 2.3.540]
- Spend · Play a round of Hoops: Play one round of Hoops (about 2 min) [IdleOn Wiki: Minigames, Swishy Hoops · Calculated by IdleOn Toolbox · 2.3.540]
show more (8)

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

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.dies-fixable-by-food | afk/dies-fixable-by-food | C1 | fires | food=Meat_Pie owned=105 stockUp=0 survivability=78 |
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
| afk.check.low-food-untimed | afk/low-food-untimed | C5 | fires | left=88 threshold=110 |
| afk.check.no-afk-target | afk/no-afk-target | C1 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C2 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C3 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C4 | pass |  |
| afk.check.no-afk-target | afk/no-afk-target | C5 | pass |  |
| afk.check.skiller-carry | afk/skiller-carry | C2 | pass |  |
| alchemy-bubbles.check.fill-slot | alchemy-bubbles/big-bubbles | C2 | fires | bubble=WYOMING_BLOOD empty=2 |
| alchemy-bubbles.check.spend-brew | alchemy-bubbles/brew | — | silent |  |
| alchemy-bubbles.check.spend-brew-big | alchemy-bubbles/brew | account | fires | bigBubble=LEVEL_UP_GIFT bigFits=4 bubbles=10 cauldrons=3 |
| alchemy-bubbles.check.wrong-fit | alchemy-bubbles/big-bubbles | — | silent |  |
| alchemy-vials.check.daily-attempts | alchemy-vials/attempts | account | fires | attempts=11 |
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
| anvil.check.spend-points | anvil/points | — | silent |  |
| anvil.check.spend-points-capacity | anvil/points | — | silent |  |
| arcade.check.balls-cap | arcade/balls-cap | account | fires | capsIn=0 fullFor=173852724 |
| boss-keys.check.collect | boss-keys/banked | — | silent |  |
| colosseum.check.collect-tickets | colosseum/tickets-banked | account | fires | cappedNpcs=1 daysLost=1 total=5 |
| death-note.check.build | death-note/build | — | silent |  |
| death-note.check.build-slot | death-note/build | — | silent |  |
| gem-shop.check.printer-buy | gem-shop/unspent | — | silent |  |
| gem-shop.check.printer-progress | gem-shop/unspent | — | silent |  |
| gem-shop.check.unspent | gem-shop/unspent | account | fires | gems=628 price=875 |
| merit-shop.check.spend-w1 | merit-shop/unspent | account | fires | unspent=12 world=1 |
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
| minigames.check.darts-spend | minigames/cooldown-spend | account | fires | cost=2 points=29 |
| minigames.check.hoops-play | minigames/cooldown-play | account | fires |  |
| minigames.check.hoops-spend | minigames/cooldown-spend | account | fires | points=7 |
| minigames.check.spiketrap | minigames/spiketrap | account | fires | gems=40 minutes=13 |
| pets.check.free-pull | pets/free-pull | account | fires | hoursClaimable=15 |
| pets.check.mart-gems | pets/mart-gems | — | silent |  |
| poppy.check.open | poppy/pending-fish | account | fires |  |
| post-office.check.daily-orders | post-office/state | — | silent |  |
| post-office.check.spend-boxes | post-office/state | — | silent |  |
| post-office.check.unlock | post-office/state | C1 | fires | boxes=0 |
| refinery.check.fuel-runs-out | refinery/fuel-runs-out | — | silent |  |
| refinery.check.salt-fuel | refinery/salt-off | — | silent |  |
| refinery.check.salt-off | refinery/salt-off | — | silent |  |
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
| systems.yaml#post-office | post-office/unlocked | account | reached no |  |
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
| task-unlocks.check.spend | task-unlocks/unspent | account | fires | points=2 |
| trapping.check.finishes-early | trapping/finishes-early | — | silent |  |
| trapping.check.slots-and-timers | trapping/slots-and-timers | — | silent |  |
| worship.check.charge-caps-no-skull | worship/charge-caps-no-skull | — | silent |  |
| worship.check.charge-caps-skull | worship/charge-caps-skull | — | silent |  |
