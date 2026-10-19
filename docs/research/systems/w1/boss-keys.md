# Dossier: Bosses and keys (W1-W4)

Topic id `boss-keys`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims are numbered [C1]..[C54]; every claim carries a confidence (H/M/L) after the adversarial verification pass (no claim was refuted by either lens; unverifiable ones are L); the Claims register at the end gives each one's Source and tier. Tier key: 1 game data / Toolbox code, 2 Toolbox dashboard or wiki, 3 earlier project research, 4 community. Where sources disagree both views are given with a confidence (H/M/L).

## Boss keys and world bosses

- **What it is:** Each world has a key-gated boss arena. Keys are an account currency [C1][C2]. The four bosses in scope are Amarok (W1), Efaunt (W2), Chizoar (W3) and Massive Troll (W4), each with three difficulties [C11][C12]. First kills hand out the crystal that opens the next world's portal [C14]. Around them sit the mini bosses (King Doot, Biggie Hours, Dilapidated Slush, Mutated Mush, Baba Yaga, Dr Defecaus) that drop keys, cards and Time Candy [C21][C28]. Kattlekruk (W5) and Emperor (W6) are the next two world bosses [C16].
- **Unlocks:**
  - **Arena entry:** keys only. Costs are Normal 1, Chaotic 5, third tier 30 (Amarok), 40 (Efaunt), 50 (Chizoar), 60 (Troll) [C10] (wiki only, not in the data: confidence M).
  - **Daily key NPCs:** Dog Bone (W1, after his quest) [C6], Djonnut (W2) [C7], Bellows (W3) [C8]. The code gates each on a dialogue index (> 5, > 6, > 8.5) [C3]. The wiki names the quest that unlocks each daily [C9].
  - **W4 has no daily key NPC.** Key4 has no entry in the daily table [C3] and no quest rewards it [C21]; the only sources are Mutated Mush (the W4 mini boss), Colosseum chests, rare Stilted Seeker drops and, per the wiki, Post Office shipments [C21][C22][C23].
  - **Mini bosses** need a crafted or dropped summon item and a day-gap [C26][C27][C29].
  - **Merit shop W1 #4** lets bosses drop keys (10 levels) and **W2 #4** lets world bosses drop gems (8 levels) [C24].
- **Scope:** Keys, mini-boss counts, merit levels and BossInfo difficulty are account-wide. Which characters count toward daily keys is per character (npcDialog thresholds) [C4]. Kills are per character in `characters[].kills`; the save does not record "has killed boss X" directly, so Toolbox infers progress from gatekeeper dialogue [C15].
- **Inputs -> outputs:**
  - **Per fight (Normal -> top tier):** coins (Amarok 500, Efaunt/Chizoar 4,000, Troll 1M/5M/20M), one boss card per tier, crafting slabs/tunics/spikes/scales, rare stamps, statues, obols, capes, talent books and reset fragments [C32][C33][C34][C35][C36].
  - **Card effects:** Amarok +2.5% Skill AFK, Chaotic Amarok +2.5% Fighting AFK, Radiant Amarok +3 Weapon Power; Efaunt +5% EXP, Chaotic +3.75% Skill EXP, Gilded +15 Star Talent Points (passive); Chizoar +8% Cog Build Speed, Chaotic +5% Shrine Effects, Blighted +1.5% All Stat; Troll +6% Kitchen Speed, Chaotic +10% All Skill Efficiency, Blitzkrieg +7% Total Damage [C32][C33][C34][C35][C36].
  - **Gem drop** from world bosses if the W2 merit is bought [C24][C25].
  - **Quest and achievement rewards** for first kills and chaotic/top-tier kills [C17][C18].
- **Goals and Milestones:**

| Milestone | Threshold | Reward | Claim |
|---|---|---|---|
| Kill Amarok | 1 key | Desert Topaz -> Builder Bird -> W2 portal; Scripticus 11; achievement | [C14][C17][C18] |
| Dog Bone Q1 / Q2 | 3 Wood Board Bone / 25 Amarok Slab | 6 / 5 keys, Q2 also a token; daily +1 key per character | [C6][C4] |
| Kill Efaunt | 1 key | Glacier Quartz -> Constructor Crow -> W3 portal | [C14] |
| Djonnut Q1-Q3 | 10 Shrapshell+food / 4000 Moonmen + ghost / 2500 x3 W3 mats | 5 keys each, Q3 a token | [C7] |
| Kill Chizoar | 1 key | Galaxial Amethyst -> Carpenter Cardinal -> W4 portal | [C14] |
| Bellows Q1-Q3 | 50 active Neyeptune kills / 3200 single-kill EXP / Giant Neyeptune with Tachion of the Titan prayer | 1 / 2 / 2 keys; Q3 unlocks the daily | [C8][C9] |
| Kill Massive Troll | 1 key | Magma Geode -> W5 portal; 3rd Troll task makes later fights start vulnerable | [C14][C38] |
| Chaotic Amarok / Efaunt | 5 keys each | 25 / 35 gems + Time Candy (Steam achievements), cards | [C18][C33][C34] |
| Mutant Massacrer | Slush then Mush | 30 gems + candy | [C18] |
| Merit W1 #4 | 10 levels | +4% boss key drop per level | [C24] |

- **Feeds / fed by:**
  - **Fed by:** Dog Bone/Djonnut/Bellows dailies, mini-boss drops, Colosseum chests (see the Colosseum dossier), Post Office (see the Post Office dossier), merit shop (Merit Shop dossier), and character damage (Stamps, Statues, Alchemy, Lab).
  - **Feeds:** world progression gates; Amarok Slabs for Dog Bone Q2 and Amarok gear [C45]; Cards (Cards dossier; boss cards sit in the "Bosses" category); Stamps and Statues via the drop tables [C32][C34][C35][C36]; Death Note mini-boss page -> Multikill per tier [C31]; Time Candy.
- **Per-session actions:**
  1. Collect banked keys on a character whose dialogue passes the NPC threshold, before the third missed day [C4][C41].
  2. Spend keys on the highest-tier boss the character can kill (see Min-max). Stockpiling has no benefit beyond the 3-day bank, but keys have no stated cap in the data.
  3. When a mini-boss count reaches 1 or more (Slush/Mush/Magmus/Spiritlord), fire the summon item [C26].
  4. Use any spare entry for a first-time clear when a quest wants a boss kill [C17].
  - **Idle or capped state:** bank at 3 days (lost keys beyond that) [C4]; a mini boss with `current >= cap` is wasting wait time [C26].
- **AFK Setup implications:** none. Boss arenas are active play only. The only AFK link is cards: Amarok (+Skill AFK), Chaotic Amarok (+Fighting AFK) are boss cards useful for AFK presets [C32][C33].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:**
  - Daily-key quest done on one character only: `amountPerDay < #characters that finished the quest` [C4].
  - Letting `daysSincePickup` pass 3 [C4][C41].
  - Using the wrong threshold for collectors vs earners (ActiveOn already splits them) [C42].
  - Walking into top-tier fights for keys without the damage to finish; top-tier HP is 100M to 2B with Defence up to 25,000 [C12].
  - Assuming W4 has a daily key NPC: it does not [C3][C21].
  - Skipping the 3rd Troll task (it makes later Troll fights easier) [C38].
- **Save and Toolbox fields:** see the Mechanics catalogue.
- **Sources:** see the Claims register.

## Mechanics catalogue

Paths are Toolbox paths relative to `packages/toolbox-parsers/vendor/` unless stated. "Save" is the raw cloud-save key.

1. **Key currency (KeysAll).** Five account-wide key items, Key1..Key5; held amounts are `account.currencies.KeysAll[i].amount`. Save: `CurrenciesOwned.KeysAll` or `CYKeysAll` [C1][C2]. No cap in the data (not stated).
2. **Daily-key bank.** Per NPC: `amountPerDay = #characters with npcDialog[NPC] > threshold`; `totalAmount = min(daysSincePickup, 3) x amountPerDay`. Thresholds: Dog_Bone > 5 (OLA[16]), Djonnut > 6 (OLA[31]), Bellows > 8.5 (OLA[80]). Fields: `account.currencies.KeysAll[i].{amountPerDay,daysSincePickup,totalAmount}`, `characters[].npcDialog` (save `NPCdialogue`), `accountOptions[16|31|80]` (save `OptLacc`). Parser: `parsers/misc.ts#L602-L626` [C3][C4]. Cap: 3 days banked. Cost: free, one tap.
3. **Daily-key unlock quests.** Dog Bone Q1/Q2, Djonnut Q1-Q3, Bellows Q1-Q4; requirements and rewards in [C6][C7][C8]. Fields: `account.quests.<World>[]` / `characters[].quests.<NPC>.<n>` (-1 not started, 0 accepted, 1 done). Wiki says the daily starts after Dog Bone Q1, Djonnut Q2, Bellows Q3 [C9].
4. **Boss entry cost.** Normal 1, Chaotic 5, top tier 30/40/50/60 keys [C10]. Not parseable from the vendored data (open question O3).
5. **Boss difficulty selection (Normal/Chaotic/third tier; the Emperor pays on Kattlekruk's difficulty).** Save `BossInfo[n] = [difficulty, hp, defence]`, n = 0 Amarok .. 5 Emperor; parsed at `parsers/class-specific/speedrun.ts#L314` as `account.speedrun.bosses[]` [C11]. Difficulty 0/1/2.
6. **Boss stats and drops.** HP/defence/respawn from `data/website-data/monsters.json`; drops from `monsterDrops.json`; cards from `cards.json` [C12][C32]-[C36]. Respawn field is 86,400 s but arenas are re-entered with keys (not timer-gated).
7. **First-kill portal crystals.** Crystal1-4 -> gatekeeper quests [C14]; world completion flag `account.finishedWorlds.WorldN` via gatekeeper dialogue [C15]. Parser `parsers/quests.ts#L29`.
8. **Boss-kill quests.** Scripticus 11, Cowbo Jones 14, Hoggindaz 9, Bill Brr 6-7, Nebulyte 2, Tiki Chief 4, Royal Worm 7, Tired Mole 3 [C17]; status via the quest map.
9. **Boss achievements.** [C18]; achievements parsed under `account.achievements` (see the Achievements dossier).
10. **Boss-key EZ-Access.** Achievement-granted for W1-W3 (Platinum 200G, Skill Master, Top Cogs); no W4 one [C19]. Behaviour unverified [C20].
11. **Non-NPC key drops.** King Doot Key2, Slush Key3 x2, Mush Key4, Magmus Key5, Stilted Seeker Key4 (rare), W5 mobs Key5 [C21].
12. **Colosseum chest keys.** Bronze/Silver/Golden chests per world [C22][C50]. Colosseum tickets share the daily-pickup overdue alert [C48].
13. **Post Office keys.** Wiki only [C23].
14. **Merit shop: boss keys and boss gems.** `account.tasks.meritsDescriptions[0][4].level` (keys, max 10) and `[1][4].level` (gems, max 8); raw save `TaskZZ2`/`Tasks[2]` [C24][C25]. Merit cost per level `round(1 + floor(level/5))` for ranking tasks is separate; the shop item cost field is 1 (verify).
15. **Mini-boss summon schedule.** Count = `min(cap, floor((max(days,3)-3)^exp))`; Slush cap 10 exp .55 (OLA[96]), Mush cap 8 exp .5 (OLA[98]), Magmus cap 6 exp .5 (OLA[225]), Spiritlord cap 6 exp .5 (OLA[226]) [C26]. Parser `parsers/misc.ts#L1536` `getMiniBossesData`.
16. **Mini-boss summon items.** Slush: Bucket of Slush; Mush: Toxic Sludge / Radioactive Waste; King Doot: Dootjat Eye then Dootophone; Biggie Hours: Googley Eyes (no cooldown) [C27][C29].
17. **Mini-boss rewards.** Cards, 1-72 hr Time Candy, gems, upgrade stones, keys [C21][C28].
18. **Mini-boss Death Note page.** Kills `Ninja[105]` -> `account.deathNote.miniBosses.rank` -> Multikill per tier [C31].
19. **Baba Yaga and Dr Defecaus respawns.** Baba 80,400 s after a kill; Defecaus once per daily reset; both inferred client-side (not in the save) and kill-counted via `Ninja[105]` (needs Revenge_of_the_Pickle jade bonus) [C41].
20. **Troll mission mechanic.** Shield + random missions, failure heals, 3rd task grants vulnerability for 5 attacks [C38]. Task progress is a quest/achievement state, not a dedicated save key found.
21. **Chaotic Amarok / Radiant "Nightmare" naming.** Game data names Radiant Amarok; Toolbox and Royal Worm quest text say Nightmare. Treat as the same third tier [C11][C17].
22. **Speedrun boss portals.** BOSSING_VAIN talent: portals = difficulty + 1 per boss per run [C40].
23. **Weekly bosses** are a separate system (topic `weekly-battles`); not covered here.
25. **Missed-mechanic additions.** Per-difficulty cost model [C47]; Tired Mole key quests [C49]; NPC tokens and King Doot companion [C51]; Giant spawn chance for Bellows Q3 [C52]; boss respawns [C53]; merit gem daily cap [C54]; Glunko row [C31].
24. **W5+ one-liners.** Kattlekruk (Key5; HP 100G/2.5T/1,000T; Tired Mole W5 quests give 10 and 25 keys for 6M Biggole Moles and 10M Crawlers) [C17][C21]; Emperor (W6, Boss6A-C, 200T/75Q/5e21 HP); Domeo Magmus (Key5 @0.5) and Demented Spiritlord (W6 mini boss) follow the same schedule [C26]; Kattlekruk Spirit Diamond opens W6, Emperor opens W7 [C16].

## Min-max by stage

Honest note on evidence: no maintained community priority list for boss farming was found (searches returned only wiki pages, one Steam thread and a card guide). The rows below are derived from tier-1 data and flagged "inference"; community-sourced lines are tier 4. Confidence is M unless stated.

- **W1 early (before Amarok):** reach the boss room (Scripticus quest 10), complete Dog Bone Q1 for 6 keys (needs 3 Wood Board Bone) [C6]. Kill Amarok Normal for the Desert Topaz and Scripticus 11 [C14][C17]. Do Dog Bone Q1 on every character as it arrives: each adds 1 key per day [C4].
- **W1 mid:** farm Normal Amarok for Amarok Slabs (@0.3; 25 for Dog Bone Q2), and Amarok armor (4 pieces gives the Forest Villa Teleport achievement) [C6][C18][C32]. Use the Amarok card for Skill AFK [C32]. Inference: cheapest return on keys is Normal (1 key) for Slabs; Chaotic (5 keys) gives 3 Slabs @0.4 so about 1.2 Slabs per fight versus 0.3, i.e. 0.3 per key at Normal and 0.24 per key at Chaotic, so Normal is more key-efficient for Slabs [C33].
- **W1 late:** Chaotic Amarok once, for the Bad Doggy! achievement (25 gems) and the card [C18][C33]. Buy Merit W1 #4 if there is spare merit [C24].
- **W2 early:** Dog Bone and the new Djonnut Q1 (5 keys) and Q2 (Moonmen, 4000 kills, 1/2000 ghost) on every character [C7]. Kill Efaunt Normal for the Glacier Quartz [C14]. Cowbo Jones 14 asks for the same kill [C17].
- **W2 mid/late:** Efaunt Normal for Ripped Tunics (@0.3), Midnight Cookies, and the Efaunt card (+5% EXP) [C34]. Chaotic Efaunt (5 keys) for the Dumbo Destroyer achievement and the +3.75% Skill EXP card [C18][C34]. Buy the W2 merit for boss gems [C24][C25]. King Doot: craft the Dootjat Eye and summon with three classes (a key, a card with +6% Total Drop Rate, Time Candy) [C21][C29].
- **W3 early:** Bellows Q1 and Q2 on every character (3 keys) [C8]; Djonnut Q3 uses W3 materials [C7]. Kill Chizoar Normal for the Galaxial Amethyst [C14]. Bill Brr's 18-orb no-hit variant needs skill, not damage [C17].
- **W3 mid/late:** Bellows Q3 (Giant Neyeptune with the Tachion of the Titan prayer) to unlock the daily on each character [C8][C9]. Summon Dilapidated Slush (up to 10 stored; 2 Chizoar keys @0.8 each, a +12% money card) before Mush [C21][C26][C18]. Chaotic Chizoar for Nebulyte 2 and Chaotic card; Blighted (50 keys) for Chizoar Spike x7 and +1.5% All Stat card, only once damage supports 2B HP / 25,000 Defence [C12][C35].
- **W4 early:** Massive Troll is mission-based, so damage is less decisive than luck early on; the community says to do quests on two or more characters first (tier 4, 2025-01-27, pre-patch) [C43][C38]. Kill Normal for the Magma Geode [C14].
- **W4 mid/late:** Summon Mutated Mush after Slush (the only W4 key source plus Colosseum and Post Office), at most 8 stored [C21][C26][C18]. Chaotic Troll (+10% All Skill Efficiency card) and Blitzkrieg (+7% Total Damage card, 60 keys) are the strongest W4 card targets; the data says Troll cards are 1 in 250/500/333 but the wiki says 10x rarer, so keep expectations loose [C36][C37]. Complete the 3rd Troll task for the 5-attack vulnerability [C38].
- **Per class (inference from the wiki fight notes):** Warriors fight Amarok from the lower platform, Archers and Mages from the upper [C39]. No class build advice for Efaunt/Chizoar/Troll beyond fight patterns was found [C39].
- **Key-use priority (inference):** (1) first clears, (2) Normal runs for materials/cards a current Goal needs, (3) Chaotic for achievements and cards, (4) top tier only with damage to finish. The community has not published a stricter order in sources found.
- **W5+ outline:** Tired Mole's W5 quests supply Kruk keys (10 and 25); Domeo Magmus and Kattlekruk follow the same loop; Emperor (W6) opens W7 [C16][C21][C26].

## Unspent and idle rules (for ActiveOn)

- Existing detector `boss-keys/banked` handles Key1-Key3 only [C42]. Gaps to close: Key4 and Key5 stock, key stock held, boss difficulty, mini-boss counts, merit levels, EZ-Access state.
- Sprites needed (none exist beyond a generic key [C46]): Forest Villa Key, Efaunt's Tomb Key, Chizoar's Cavern Key, Troll's Enclave Key, Kruk's Volcano Key (five distinct key icons); Amarok, Efaunt, Chizoar, Massive Troll boss portraits; difficulty chips (Normal, Chaotic, third tier); mini-boss icons for King Doot, Biggie Hours, Dilapidated Slush, Mutated Mush; portal crystal icons (Desert Topaz, Glacier Quartz, Galaxial Amethyst, Magma Geode).

## Open questions

- O1: What does boss-key EZ-Access do exactly, and is there a W4 equivalent? [C19][C20]
- O2: Does Djonnut give 1 key per qualifying character per day (Toolbox) or 5 (wiki text)? [C9]
- O3: Where are per-difficulty key costs in the data or save (not found in `monsters.json`/`items.json`)? [C10]
- O4: Is the live HP of Normal Amarok/Efaunt 25,000/1,000,000 (data) or 60K/4M (wiki; `BossInfo[n][1]`)? [C13]
- O5: True Troll card and Mush key drop rates (data vs wiki 10x/100x apart)? [C30][C37]
- O6: Is the key drop merit +4% (text) or +7 (field `bonusPerLevel`)? What base rate does it modify? [C24]
- O7: Recommended levels or damage thresholds per boss/difficulty: none found in any source.
- O8: Which save key records world-boss kills or the Troll tasks? Only gatekeeper dialogue and `kills[]` were found [C15][C38].
- O9: Do Colosseum chest key chances mean per chest opened? [C22]

## Claims register

Each claim: text, Source (path#line or URL; Toolbox @6c37e3d / game 2.3.540 unless stated), tier. Dates verified 2026-10-19 unless stated.

- **[C1]** (tier 1, confidence H) Five boss-key items exist, Key1..Key5, all `Type: BOSS_KEY`, sell 50, added to the account by holding: Forest Villa (W1), Efaunt's Tomb (W2), Chizoar's Cavern (W3), Troll's Enclave (W4), Kruk's Volcano (W5). Toolbox indexes them 0..4 in `keysMap`.
  - Source: packages/toolbox-parsers/vendor/parsers/parseMaps.ts#L113; packages/toolbox-parsers/vendor/data/website-data/items.json Key1..Key5 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C2]** (tier 1, confidence H) Keys are an account currency read from the raw save `CurrenciesOwned.KeysAll` (or `CYKeysAll`); Toolbox exposes `account.currencies.KeysAll[i] = {amount, name, rawName, amountPerDay, daysSincePickup, totalAmount}`.
  - Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L517-L521, packages/toolbox-parsers/vendor/parsers/index.ts#L329 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C3]** (tier 1, confidence H) Daily-key NPC table in code: index 0 Dog_Bone (npcDialog > 5, day counter accountOptions[16]); index 1 Djonnut (> 6, accountOptions[31]); index 2 Bellows (> 8.5, accountOptions[80]); index 3 (Troll) and 4 (Kruk) have no entry, so amountPerDay/totalAmount are 0.
  - Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L602-L616 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C4]** (tier 1, confidence M) Rule: amountPerDay = number of characters whose `npcDialog[NPC]` exceeds the threshold (one key per qualifying character per day); totalAmount = min(daysSincePickup, 3) x amountPerDay. The bank is capped at 3 days; whether the day counter itself is capped could not be verified from this code (confidence L on that sub-claim).
  - Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L609-L626 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C5]** (tier 1, confidence L) Dog Bone's in-game text (as recorded in earlier research from the game client): talk daily for a key, he tracks up to 3 days, +1 key per day for every character that got this far, and he pays all banked keys the first time you tap him. Not re-verified against the client in this pass.
  - Source: docs/research/systems/w1-systems/amarok-and-quests.md on origin/research/w1-systems (N.js addDialogueFor Dog_Bone, v1.23, 2026-10-17)
- **[C6]** (tier 1, confidence H) Dog Bone quests: Q1 'Why he Die???' = 3 Wood Board Bone -> 6 Forest Villa Key; Q2 'Bow Wow going Dow..n!' = 25 Amarok Slab (not consumed) -> 5 Forest Villa Key + Dog Bone Token.
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json Dog_Bone.1, Dog_Bone.2 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C7]** (tier 1, confidence H) Djonnut quests: Q1 10 Shrapshell + 1 Kebab Stick + 1 Meat Pie -> 5 Efaunt's Tomb Key; Q2 kill 4000 Moonmen and get 1 ghost drop (1 in 2000 per kill) -> 5 keys, and the text promises keys every day; Q3 2500 each Melty Cube, Sticky Stick, Mamooth Tusk (W3 items) -> 5 keys + Djonnut Token.
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json Djonnut.1-3 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C8]** (tier 1, confidence H) Bellows quests: Q1 kill 50 Neyeptunes actively (no AFK) -> 1 Chizoar's Cavern Key; Q2 get 3200 EXP from one Neyeptune kill -> 2 keys; Q3 kill a Giant Neyeptune with the Tachion of the Titan prayer equipped -> 2 keys; Q4 hold 4 Black Lense + 14000 Contact Lense -> Bellows Token.
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json Bellows.1-4 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C9]** (tier 2, confidence M) Wiki: Djonnut's daily keys unlock after his 2nd quest, Bellows' after his 3rd ('Veyebing'), Dog Bone's after his 1st; all hold keys up to 3 days and more characters finishing the quest means more daily keys; one character can collect everything. The wiki says Djonnut hands out '5x Efaunt's Tomb Key' as a daily reward, which disagrees with Toolbox (one key per qualifying character per day; 5 is the quest reward). Confidence in Toolbox: M.
  - Source: https://idleon.wiki/wiki/Djonnut, https://idleon.wiki/wiki/Bellows, https://idleon.wiki/wiki/Dog_Bone_(NPC) (fetched 2026-10-19; Djonnut/Bellows pages state they are drawn from game data)
- **[C10]** (tier 2, confidence M) Entry cost per difficulty (wiki, not present in the vendored data): Amarok 1 / 5 / 30 keys (Normal / Chaotic / Radiant, shown as 'Nightmare'); Efaunt 1 / 5 / 40 (Gilded); Chizoar 1 / 5 / 50 (Blighted); Massive Troll 1 / 5 / 60 (Blitzkrieg). Kattlekruk/Emperor costs not collected.
  - Source: https://idleon.wiki/wiki/Amarok (rev. 2026-10-02), https://idleon.wiki/wiki/Efaunt, https://idleon.wiki/wiki/Chizoar, https://idleon.wiki/wiki/Massive_Troll (fetched 2026-10-19)
- **[C11]** (tier 1, confidence H) Save field `BossInfo[n] = [difficulty, hp, defence]` for the six world bosses n=0..5 (Amarok, Efaunt, Chizoar, Troll, Kattlekruk, Emperor); difficulty 0/1/2 = Normal / Chaotic / third tier (Toolbox labels it Nightmare). Arena map indices 29, 66, 114, 165, 214, 266. The Emperor pays out on Kattlekruk's difficulty.
  - Source: packages/toolbox-parsers/vendor/parsers/class-specific/speedrun.ts#L277-L292, L314-L328 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C12]** (tier 1, confidence H) World-boss stats in game data (HP / Defence): Amarok 25,000/105, Chaotic 8,000,000/1,750, Radiant 100,000,000/8,000; Efaunt 1,000,000/550, Chaotic 30,000,000/3,500, Gilded 400,000,000/15,000; Chizoar 20,000,000/2,250, Chaotic 250,000,000/7,500, Blighted 2,000,000,000/25,000; Massive Troll 80,000,000/600, Chaotic 350,000,000/600, Blitzkrieg 2,000,000,000/600. All 86,400 s respawn, 12,000 EXP field.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsters.json wolfA-C, Boss2A-C, Boss3A-C, Boss4A-C (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C13]** (tier 2, confidence M) Wiki lists different Normal HP for the first two bosses: Amarok 60K (data 25,000), Efaunt 4M (data 1,000,000); Chizoar and Troll agree with data. A runtime `BossInfo[n][1]` override is a plausible cause but unverified. Confidence in data: M.
  - Source: https://idleon.wiki/wiki/Amarok (rev. 2026-10-02), https://idleon.wiki/wiki/Efaunt (fetched 2026-10-19)
- **[C14]** (tier 1, confidence M) First kill of each world boss yields a portal crystal item: Crystal1 Desert Topaz (W1->W2), Crystal2 Glacier Quartz (W2->W3), Crystal3 Galaxial Amethyst (W3->W4), Crystal4 Magma Geode (W4->W5). Crystal1-3 are turned in at the gatekeeper NPC: Builder Bird, Constructor Crow, Carpenter Cardinal (each quest 1 itemReq). Magma_Geode (Crystal4) has no turn-in in quests.json, so its recipient is unverified (confidence L for that part).
  - Source: packages/toolbox-parsers/vendor/data/website-data/items.json Crystal1-4; packages/toolbox-parsers/vendor/data/website-data/quests.json Builder_Bird.1, Constructor_Crow.1, Carpenter_Cardinal.1 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C15]** (tier 1, confidence H) A world counts as finished (`account.finishedWorlds.WorldN`) once any character has talked to its gatekeeper: Builder_Bird (1), Constructor_Crow (2), Carpenter_Cardinal (3), Muhmuguh (4), Lafu_Shi (5), account option 408 (6). So world-boss kills are inferred, not read.
  - Source: packages/toolbox-parsers/vendor/parsers/quests.ts#L29-L44 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C16]** (tier 2, confidence L) Wiki Boss page: Kattlekruk (W5) drops the Spirit Diamond (W6 portal), the Emperor (W6) a gem for the W7 portal. Optional/secret bosses: Glunko the Massive, Baba Yaga, Dr Defecaus, Biggie Hours, King Doot, Dilapidated Slush, Mutated Mush, Domeo Magmus, Demented Spiritlord.
  - Source: https://idleon.wiki/wiki/Boss (fetched 2026-10-19)
- **[C17]** (tier 1, confidence L) Boss-kill quests in game data: Scripticus 11 (kill Amarok, recover Town Gem), Cowbo Jones 14 'Tomb Raid' (kill Efaunt, steal crystal), Hoggindaz 9 (Chizoar), Bill Brr 6 (18 ice orbs while fighting Chizoar without being hit) and 7 (Chaotic Chizoar), Nebulyte 2 (Chaotic Chizoar), Tiki Chief 4 (5 boss kills + one speedy kill), Royal Worm 7 (Blitzkrieg Troll 100 times), Tired Mole 3 (Kattlekruk cape on Nightmare, needs Divine Scarf).
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json (customArray / DialogueText of the named quests) (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C18]** (tier 1, confidence L) Boss-kill achievements in data: Shut it Poochy (Amarok, unlocks an RNG item), Bad Doggy! (Chaotic Amarok, 25 gems + 2 x 2hr candy, Steam-exclusive), Efaunt Trumped, Dumbo Destroyer (Chaotic Efaunt, 35 gems + candy, Steam-exclusive), Boss Buster (both Blunder Hills minibosses, 15 gems), Mutant Massacrer (Slush then Mush in that order, 30 gems + candy), Nice Fur Suit (4 Amarok armor pieces -> Forest Villa Teleport), Your Skin My Skin (Efaunt set + obol -> Djonnuttown Teleport), House Flipper (Baba Yaga in under 25 s).
  - Source: packages/toolbox-parsers/vendor/data/website-data/achievements.json TaskAchA19, A34, A37, A42, A44, B18, B37, B45, D28 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C19]** (tier 1, confidence H) Boss-key EZ-Access exists as an achievement reward for W1-W3 only: Platinum 200G (TaskAchA35: exactly 200,000 Platinum Ore in the Storage Chest) = W1 Boss Key EZ-Access; Skill Master (TaskAchB49, secret, peanut hint) = W2; Top Cogs (TaskAchC34: 78 purple cogs) = W3. No W4 boss-key EZ-Access achievement exists in the data (W4's Good Plate gives Shops EZ-Access only).
  - Source: packages/toolbox-parsers/vendor/data/website-data/achievements.json (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C20]** (tier 4, confidence L) What EZ-Access does for keys is not specified in the data or the wiki pages fetched. An r/idleon reply (2026-09-19) said keys can be claimed from the Ez Access shops tab; unverified.
  - Source: https://www.reddit.com/r/idleon/comments/1wkqz14/ via docs/research/systems/w1-systems/amarok-and-quests.md (origin/research/w1-systems)
- **[C21]** (tier 1, confidence H) Non-NPC key drop sources in game data: King Doot -> 1 Efaunt's Tomb Key @0.8; Dilapidated Slush -> 2 Chizoar's Cavern Keys @0.8; Mutated Mush -> 1 Troll's Enclave Key @0.5; Domeo Magmus -> 1 Kruk's Volcano Key @0.5; Stilted Seeker (w4c4) -> Key4 @6.667e-5; W5 mobs Biggole Mole, Crawler, Tremor Wurm -> Key5 (1.3e-5..4e-5). No monster in the data drops Key1 except Colosseum chests.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json (babaMummy, mini3a, mini4a, mini5a, w4c4, w5b6, w5c1, w5c2) (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C22]** (tier 1, confidence H) Colosseum chest monsters carry key drops: ChestA/B/C (bronze/silver/golden) W1-W3 drop their world key at 0.04 / 0.10 / 0.18; W4 chests at 0.006 / 0.012 / 0.04. Chance semantics (per chest opened) not independently confirmed.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json ChestA1..ChestC4 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C23]** (tier 2, confidence H) Wiki: Post Office shipments also give Efaunt's Tomb and Chizoar's Cavern keys; Chizoar keys also come from Chillsnap Colosseum chests and Dilapidated Slush; Efaunt keys from Sandstone Colosseum chests. Post Office keys are not encoded in the vendored data.
  - Source: https://idleon.wiki/wiki/Efaunt, https://idleon.wiki/wiki/Chizoar (fetched 2026-10-19)
- **[C24]** (tier 1, confidence M) Merit shop (Task Shop) W1 item index 4: 'Bosses can now drop Boss Keys. 4% higher key drop chance per purchase', 10 levels, 1 merit each (the data's `bonusPerLevel` field reads 7, text says 4%). W2 item index 4: 'World bosses can now drop gems, +7% per purchase', 8 levels (max 56%). Correction: tasks.ts reads the level from `tasksRaw[2][world][index]` (raw save `Tasks[2]`) and exposes it on the merit description; treat `meritsDescriptions[world][index].level` as the exposed form.
  - Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json merits[0][4], merits[1][4]; packages/toolbox-parsers/vendor/parsers/tasks.ts#L67-L75 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C25]** (tier 2, confidence L) Wiki: world bosses can drop gems if the W2 merit is bought, up to 56%, for the first 150 bosses each day.
  - Source: https://idleon.wiki/wiki/Boss (fetched 2026-10-19)
- **[C26]** (tier 1, confidence H) Mini-boss availability is time-gated by days since last kill (account options 96 Slush, 98 Mush, 225 Magmus, 226 Spiritlord): count = min(cap, floor((max(days,3) - 3)^exp)); Slush cap 10 exp 0.55, Mush cap 8 exp 0.5, Magmus cap 6 exp 0.5, Spiritlord cap 6 exp 0.5. Toolbox lists a mini boss only if its `finishedWorlds` flag is true (Slush World3, Mush World2, Magmus World4, Spiritlord World5).
  - Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L1518-L1581 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C27]** (tier 2, confidence L) Wiki mini-boss schedules agree with the formula: Slush needs at least 4 login days between spawns (1-5 spawns at 4-22 days, 6-10 at 29-69); Mush the same 4 day minimum, 8 spawns at 67 days. Slush is summoned with a Bucket of Slush dropped on the Refrigeration Station snow pile; Mush with a Toxic Sludge or Radioactive Waste barrel dropped on mushrooms at Spaceway Raceway (one Mush per mushroom).
  - Source: https://idleon.wiki/wiki/Dilapidated_Slush, https://idleon.wiki/wiki/Mutated_Mush (fetched 2026-10-19)
- **[C28]** (tier 1, confidence M) Mini-boss stats: King Doot 3,000,000 HP / 1,000 def; Biggie Hours 800,000 / 600; Dilapidated Slush 12,500,000 / 2,000; Mutated Mush 120,000,000 / 4,500; Domeo Magmus 1,000,000,000 / 4,500; Demented Spiritlord 25e12 / 4,500; Baba Yaga 150,000 / 300 (respawn 80,400 s); Dr Defecaus 750,000 / 600 (respawn 745,000 s). Each mini boss also rolls Gem x4 and 1-72 hr Time Candy (1 hr @0.6 ... 72 hr @0.0003).
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsters.json, monsterDrops.json (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C29]** (tier 2, confidence L) King Doot needs the Dootjat Eye (recipe from Sand Giants; 1 Silver Antique, 80 Gold Bars, 5 Ghosts, Smithing 21) and a first multiplayer summon with at least one of each basic class; the Dootophone then allows solo summons. Biggie Hours needs Googley Eyes (recipe from Crabcakes; 2 Woodular Circles, 5 Distilled Water, 1 Capitalist Case) dropped on the broken hourglass at the Mimic Hole, with no cooldown.
  - Source: https://idleon.wiki/wiki/King_Doot, https://idleon.wiki/wiki/Biggie_Hours (fetched 2026-10-19)
- **[C30]** (tier 2, confidence L) Wiki quotes Mutated Mush's Troll's Enclave Key at 1 in 250 and Slush's Chizoar key at 1 in 1.25 (0.8); data says Mush 0.5 per kill. The Mush figure disagrees by ~100x between sources. Confidence: L either way.
  - Source: https://idleon.wiki/wiki/Mutated_Mush vs packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json mini4a (2026-10-19)
- **[C31]** (tier 1, confidence M) Death Note has a mini-boss page, rows slimeB, poopBig, babayaga, babaHour, babaMummy, mini3a, mini4a, mini5a, mini6a, fm_rat, kills read from raw `Ninja[105]`; its rank adds directly to Multikill per tier (`account.deathNote.miniBosses.rank`). Gate: `Ninja[105]` kills only count once the Revenge_of_the_Pickle jade emporium bonus is unlocked (bossRespawns.js#L11-L12). Glunko_The_Massive (slimeB, optional W1 boss) is the first row: 10,000 HP, 5 defence, 1,200 s respawn, 1,000 EXP (monsters.json).
  - Source: packages/toolbox-parsers/vendor/parsers/world-3/deathNote.ts#L8-L36; packages/toolbox-parsers/vendor/parsers/damage.ts#L1661-L1681; packages/toolbox-parsers/vendor/data/website-data/shared-data.json ninjaExtraInfo[30] (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C32]** (tier 1, confidence L) Amarok (Normal) drops: 500 coins; Amarok Slab 1x @0.3; Magic Meatloaf @0.05; Amarok Card @0.04 (+2.5% Skill AFK gain rate); Anvil Zoomer Stamp @0.0012; Granite Obol of Amarok's Stare @0.0007; Grandma Disguise hat @0.001; plus a Super Drop Table (Power Statue @0.12, Health Statue @0.12, Silver Pen @0.07, Talent Book @0.1, Talent Point Reset Fragment @0.1, Mystery Upgrade Stone I x2 @0.85, Golden Nomwich @0.5).
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json wolfA; packages/toolbox-parsers/vendor/data/website-data/cards.json wolfA (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C33]** (tier 1, confidence L) Chaotic Amarok: Slab x3 @0.4, Chaotic Amarok Slab @0.2, Meatloaf x3 @0.1, card @0.02 (+2.5% Fighting AFK gain), Grandma Disguise @0.004. Radiant Amarok: Slab x6 @0.5, Chaotic Slab x2 @0.5, Mystery Upgrade Stone I @0.25, card @0.02 (+3 Weapon Power), Grandma Disguise @0.012, Radiant Amarok Backstabber cape @0.001.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json wolfB, wolfC; cards.json wolfB, wolfC (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C34]** (tier 1, confidence H) Efaunt drops: 4,000 coins; Efaunt Card @0.025 (+5% EXP from monsters); Midnight Cookie @0.07; Ripped Tunic @0.3; Skeletal Obol @0.001; Royal Turban @0.000667; Super Drop Table incl. Drippy Drop Stamp @0.0006, Droplots Stamp @0.0004, Bullseye Stamp @0.01, Buzz Buzz Stamp @0.00015, Anvil/Exp Book/Cauldron Statues @0.07/0.04/0.07, Storage Chest 14 @0.0012, Inventory Bag G @0.0018. Chaotic: card @0.016 (+3.75% Skill EXP), Ripped Tunic x3 @0.4, Ribbed Tunic @0.2. Gilded: card @0.02 (+15 Star Talent Pts, passive), Ripped Tunic x12 @0.9, Ribbed Tunic x4 @0.5, Gilded Efaunt Dislodged Tusks cape @0.0007.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json Boss2A-C; cards.json Boss2A-C (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C35]** (tier 1, confidence L) Chizoar drops: card @0.007 (+8% Cog Build Spd, passive); Chizoar Spike @0.3; Chizoars Blankie pendant @0.001; Frozen Obol @0.0008; Distilled Water ~@0.025 per table roll; Super Drop Table stamps (Stample @0.001, Banked Pts @0.0006, Saw @0.015, Multikill @0.0003, Violence @0.00015, Flowin @0.0001, Blover @0.00008) and statues (EhExPee, Speed, Feasty). Chaotic: card @0.004 (+5% Shrine Effects, passive), Spike x3 @0.4, Stalagmite @0.2. Blighted: card @0.002 (+1.5% All Stat), Spike x7 @0.5, Stalagmite x2 @0.5, Blighted Chizoar Shard Cape @0.0003.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json Boss3A-C; cards.json Boss3A-C (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C36]** (tier 1, confidence L) Massive Troll drops: coins 1,000,000 / 5,000,000 / 20,000,000 (Normal / Chaotic / Blitzkrieg); Troll Scales 1x @0.13 / 2x @0.3 / 4x @0.5; cards @0.004 (+6% Kitchen Speed, passive) / @0.002 (+10% All Skill Efficiency) / @0.003 (+7% Total Damage); Jagged Obol @0.0002 / @0.0008 / @0.007; Blitzkrieg also Cascading Scaled Cape of Krieg @0.00025; Super Drop Table incl. Tripleshot Stamp @0.00027, Blackheart Stamp @0.00018, Pecunia/Mutton/Egg Statues @0.025.
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json Boss4A-C; cards.json Boss4A-C (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C37]** (tier 2, confidence L) Wiki quotes Troll card odds of 1 in 2500 / 5000 / 3330, ten times rarer than the data (0.004 / 0.002 / 0.003 = 1 in 250 / 500 / 333). Which is live is unresolved. Confidence in data: M.
  - Source: https://idleon.wiki/wiki/Massive_Troll vs packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json Boss4A-C (2026-10-19)
- **[C38]** (tier 2, confidence L) Massive Troll does not attack: it has a shield and gives random 'missions' for a chance to deal damage; failing a mission heals it. After the 3rd Troll-kill task (kill without failing a minigame) it starts vulnerable for 5 attacks in later fights.
  - Source: https://idleon.wiki/wiki/Massive_Troll (fetched 2026-10-19)
- **[C39]** (tier 2, confidence L) Fight notes (wiki): Amarok has seven attack patterns, Warriors prefer the lower platform, Archers/Mages the upper, destroy shield totems first; Efaunt has six arms, kill arms in descending order of damage, the bottom-left arm is a ranged one-hit KO; Chizoar has five attacks plus a shield-crystal phase.
  - Source: https://idleon.wiki/wiki/Amarok (rev. 2026-10-02), https://idleon.wiki/wiki/Efaunt, https://idleon.wiki/wiki/Chizoar (fetched 2026-10-19)
- **[C40]** (tier 1, confidence H) Speedrun class: BOSSING_VAIN talent grants round(BossInfo[n][0]+1) speedrun portals per boss per run (Normal 1, Chaotic 2, third tier 3), once per boss per run, and boss kills speed mob respawn for the rest of the run.
  - Source: packages/toolbox-parsers/vendor/parsers/class-specific/speedrun.ts#L304-L312, L340-L352 (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C41]** (tier 2, confidence H) Toolbox 'keys' alert fires when a key row has daysSincePickup >= 3 and totalAmount > 0 (colosseum tickets share the alert); a separate 'miniBosses' alert fires when a mini-boss count reaches a user threshold; 'bossRespawns' tracks Dr Defecaus (re-armed each daily reset) and Baba Yaga (80,400 s after a kill; kills come from Ninja[105], only counted with the Revenge_of_the_Pickle jade bonus).
  - Source: packages/toolbox-parsers/vendor/utility/dashboard/account.js#L199-L220, L2100-L2110; packages/toolbox-parsers/vendor/utility/dashboard/bossRespawns.js (Toolbox @6c37e3d, game 2.3.540, verified 2026-10-19)
- **[C42]** (tier 1, confidence M) ActiveOn today: `boss-keys/banked` covers only Key1-Key3 (Dog Bone > 5, Djonnut > 6, Bellows > 8.5), fires at 2 banked days, reads `account.keys[]` (perDay, daysSincePickup, banked). It does not read key stock (`KeysAll[i].amount`), Troll/Kruk keys, boss difficulty (`BossInfo`), mini-boss counts, merit levels or kill counts, and the system has no dedicated home view.
  - Source: packages/knowledge/detectors/boss-keys/banked.ts; packages/account-state/src/unspent.ts#L203-L226; packages/account-state/src/unspent-types.ts#L34-L45; packages/engine/src/now/system-homes.ts (no boss-keys entry) (checked 2026-10-19)
- **[C43]** (tier 4, confidence L) Steam thread (2025-01-27, pre-2026 patches): a W4 player stuck on the Troll boss; replies call it highly RNG-dependent (mission minigames), say to do all quests on at least 2 characters, and that the coin-flip minigame can be skipped with rope. Dungeon rings and Lab/Alchemy damage scaling are named as the usual bottlenecks.
  - Source: https://steamcommunity.com/app/1476970/discussions/0/603020634641973267 (thread 2025-01-27; fetched 2026-10-19)
- **[C44]** (tier 4, confidence L) gameslikefinder card guide (2026-10-12) calls the 'Bosses and Nightmares' card set (+% Dmg, Drop, EXP at 6/12/18/24/30/36 cards) a great set from early to end game; it gives no per-boss advice.
  - Source: https://gameslikefinder.com/article/idleon-card-builds/ (published 2026-10-12; fetched 2026-10-19)
- **[C45]** (tier 3, confidence L) Equipment and crafting materials from W1-W4 bosses: Amarok Slab (Dog Bone Q2, Amarok gear), Chaotic Amarok Slab (pendant), Ripped/Ribbed Tunic (Efaunt gear), Chizoar Spike/Stalagmite, Troll Scales; earlier research recommends the Amarok armor for use until late W5/W6 (flagged stale).
  - Source: docs/research/systems/w1-systems/amarok-and-quests.md on origin/research/w1-systems (Idleon Incomplete Guide W1 tab, stale); packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json
- **[C46]** (tier 1, confidence H) Existing sprites: only a generic `item-key` sprite exists (apps/activeon/src/art/sprites/grids/items.ts); no per-key, boss or mini-boss sprites.
  - Source: apps/activeon/src/art/sprites/grids/items.ts#L243; grep over grids/*.ts for boss/amarok (2026-10-19)

- **[C47]** (tier 1, confidence H) Per-difficulty key costs are not in the vendored data (no cost field in monsters.json or items.json). The wiki figures in [C10] cover Amarok, Efaunt (1/5/40, rechecked), Chizoar and Troll; Gilded and Blighted costs rest on the wiki alone (confidence M).
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsters.json, items.json (searched 2026-10-19); https://idleon.wiki/wiki/Efaunt
- **[C48]** (tier 1, confidence H) Colosseum tickets are the sibling daily-pickup currency: they carry `daysSincePickup` and share the `areKeysOverdue` rule (daysSincePickup >= 3 and totalAmount > 0), so the keys alert also fires for them.
  - Source: packages/toolbox-parsers/vendor/utility/dashboard/account.js#L199-L220 (Toolbox @6c37e3d, verified 2026-10-19)
- **[C49]** (tier 1, confidence H) Tired Mole (W5) quests pay Boss Keys: Q1 defeat Biggole Moles (AFK kills count) -> 10 Kruk's Volcano Key + 2 Divinity Pearl; Q2 defeat Crawlers (AFK counts) -> 25 keys + 5 Holy Pearl; Q3 needs Kattlekruk's cape dropped on Nightmare (trophy One of the Divine).
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json Tired_Mole.1-3 (verified 2026-10-19)
- **[C50]** (tier 1, confidence H) Colosseum chests ChestB2/C2 (W2) drop Key2 at 0.10 / 0.18 and ChestB3/C3 (W3) drop Key3 at 0.10 / 0.18 (1 key each), matching [C22].
  - Source: packages/toolbox-parsers/vendor/data/website-data/monsterDrops.json ChestB2, C2, B3, C3 (verified 2026-10-19)
- **[C51]** (tier 1, confidence H) Dog Bone Q2, Djonnut Q3 and Bellows Q4 each reward an NPC token (rawName NPCtoken13, NPCtoken25, NPCtoken33 respectively in quests.json order), which feed the NPC token / companion systems (see those dossiers). King Doot (babaMummy) is also listed in companions.json.
  - Source: packages/toolbox-parsers/vendor/data/website-data/quests.json (lines 2808, 4062, 6940); companions.json (verified 2026-10-19)
- **[C52]** (tier 1, confidence M) Giant monster spawns (needed for Bellows Q3): chance per spawn roll = 1/((100 + 50 x (giants+1)^2) x (1 + Glitterbug curse/100)) x (1 + (Crescent Shrine + GiantMob vial)/100) while `accountOptions[57]` (giants already spawned) < 5, a steeper formula after. The Tachion of the Titans prayer is referenced in a commented-out line, so its effect on spawn chance is not confirmed in code (the quest text requires it equipped).
  - Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L898-L918 (verified 2026-10-19)
- **[C53]** (tier 1, confidence H) Boss respawn tracking: Baba Yaga 80,400 s after a kill, Dr Defecaus re-armed at each daily reset; both client-side only (see [C41]).
  - Source: packages/toolbox-parsers/vendor/utility/dashboard/bossRespawns.js (verified 2026-10-19)
- **[C54]** (tier 3, confidence L) The W2 merit boss-gem drop is capped by a daily limit (wiki: first 150 bosses a day, see [C25]); the vendored data holds no such counter.
  - Source: https://idleon.wiki/wiki/Boss (fetched 2026-10-19)
