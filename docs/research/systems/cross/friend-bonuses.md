## Friend bonuses

Revised 2026-10-19 after two adversarial verification passes (source lens, game-data lens). Confidence tags H/M/L follow each claim. Verified against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` in the reference checkout. "misc.ts" = `parsers/misc.ts`.

- **What it is:** A Codex "Friends" tab feature. Each friend can send you one Friend Bonus (one of 7 stats); you hold a limited number of slots, and each filled slot adds a flat percent to one account stat, scaled by the sender's account level. [C1][C2] (H for the code side; M for the wiki-only framing)
- **Unlocks:** Feature launched 2025-11-06; scaling formula changed 2026-06-21 (wiki, M). The offered bonus set is server-driven: More Coins offered 2025-11-06 to 2026-06-21 and again from 2026-10-12; Extra Kills offered 2026-06-21 to 2026-10-12 (ended). Not all 7 stats are necessarily offered at once. [C3][C8] Two Spend-free achievements touch it: "Here Friend!" (send a bonus to a friend) and "Best Friend Forever!" (add someone to the friends list). [C4] Needs a real friend who plays; this is the only ActiveOn input that depends on another human. Base 2 slots from the start. The achievement path is sending a bonus to a friend from the Codex Friends tab and the 2x-tap add-friend option (wiki, M/L, not in code). [C5][C4]
- **Scope:** Account-wide. Stored in account option 476, not per character. [C6]
- **Inputs -> outputs:** Input: a list of `stat,level,friendName` entries (the friends' bonuses you currently hold) plus slot and multiplier modifiers from companions/Event Shop. Output: 7 account-wide bonuses (see Goals table) feeding damage, class EXP, skill efficiency, drop rate, skill EXP, coins and kills. [C6][C7][C8]
- **Goals and Milestones (value per slot, before the multiplier):** base x scaling s(L)

| Index | Stat | Base | Value at s=1.0 (L=12000) | Value at cap (L=30000, s=1.3214) |
|---|---|---|---|---|
| 0 | % Total Damage | 100 | 100 | 132.1 |
| 1 | % Class EXP gain | 30 | 30 | 39.6 |
| 2 | % Skill Efficiency | 50 | 50 | 66.1 |
| 3 | % Drop Rate | 25 | 25 | 33.0 |
| 4 | % Skill EXP gain | 30 | 30 | 39.6 |
| 5 | % more Coins | 40 | 40 | 52.9 |
| 6 | % Extra Kills | 10 | 10 | 13.2 |

  s(L) = min(1.5, 0.25 + L/(L+12000) * 1.5), L clamped to [0, 30000]. Floor is 0.25: a level-0 entry still yields 25% of base. Pre-2026-06-21 formula per the source lens: min(1, 0.2 + L/(L+3000)) with a 12K level cap (wiki-derived, L confidence; useful only to detect stale guide numbers). The table above is before the multiplier. Sample s: L=0 -> 0.25, 100 -> 0.262, 1000 -> 0.365, 5000 -> 0.691, 12000 -> 1.0, 30000 -> 1.321. The 1.5 cap never binds (max reachable 1.3214). [C9] Slot milestones: 2 base, up to 20 max (see catalogue). [C5] Values are then multiplied by the companion multiplier (M3).
- **Feeds / fed by:** Fed by: Companions (Mr Pig #30, Spearfish #44), Event Shop item 22 (Friendly Slot), friends' account levels. Feeds: Total Damage (damage.ts), Class EXP (character.ts), Skill Efficiency (efficiency.ts), Drop Rate and Coins (character.ts), Extra Kills (damage.ts, a KPK input and so a Death Note / monster-afk input). [C10]
- **Per-session actions:** Check that every slot holds a bonus; replace weak (low-level sender) entries with higher-level friends' bonuses and prefer the stat you value most (see Min-max). Idle state: `entries < slots` (entries beyond `slots` are ignored, so order matters: put the stat you value most earliest), i.e. free slots. Capped state: slots at 20 and all senders at L>=30000 (practically unreachable).
- **AFK Setup implications:** None directly; it is a passive multiplier. Raises AFK kill rate (Extra Kills), drops and EXP across every AFK Target.
- **Min-max by stage:** see below (section "Min-max by stage").
- **Common mistakes:** (1) Filling slots with low-level friends: s(L) is steep at low L (L=1000 gives 36.5% of base). (2) Putting the same stat in two slots: Toolbox keeps only the LAST entry per stat, so a duplicate wastes a slot (flag: in-game behaviour unverifiable, confidence L). [C11] (3) Ignoring Mr Pig's upgrade (Pet Mart+): 2.5x multiplier and +3 slots instead of 2x/+2. [C12] (4) Not buying Event Shop Friendly Slot. Detect from save: `account.friendBonusStats.slots` vs `bonuses.filter(value>0).length`.

### Mechanics catalogue

M1. **Entry storage.** `accountOptions[476]` is a string `"stat,level,name;stat,level,name;..."`; `"0"`/empty means none. Entry order = slot order. Parser: `getFriendBonusStats`, misc.ts#L132-L227; wired at `parsers/index.ts#L385` as `accountData.friendBonusStats`. [C6]
M2. **Slot count.** `slots = round(min(20, 2 + (Spearfish acquired ? companions[44].bonus : 0) + 2*(Mr Pig acquired ? companions[30].bonus : 0) + (EventShop 22 ? 1 : 0)))`. Only the first `slots` entries of the list are read (`min(slots, entries)`). Cap 20; the rounding means fractional bonuses are rounded to whole slots. `Slots` here is total slots, while Mr Pig adds 2*bonus (2, or 3 upgraded) and Spearfish adds its bonus (1). Spearfish bonus 1 (upgraded also 1); Mr Pig bonus 1 (upgraded 1.5 -> +3 slots). Max from these sources = 2+1+3+1 = 7, so the cap of 20 is currently unreachable (future-proofing or W5+ sources; open question). [C5][C12][C13] (H)
M3. **Multiplier.** `multiplier = 1 + (100*MrPigBonus + (Spearfish upgraded ? 25 : 0))/100`. Mr Pig base 1 -> 2.0x; upgraded 1.5 -> 2.5x; Spearfish Pet Mart+ (level>=1) adds +0.25. Max 2.75x. The multiplier is additive across Mr Pig and Spearfish (1 + sum) and applied to every stat value. Both bonuses are gated by `isCompanionBonusActive` (companions 30 and 44). Spearfish upgraded needs `isCompanionLvl2Active`: acquired and level >= 1 (misc.ts#L1506-L1509); the multiplier itself is computed at misc.ts#L157-L158. [C12][C13]
M4. **Per-entry value.** `value = base[stat] * s(L) * multiplier`, `base = [100,30,50,25,30,40,10]`, stat index must be < 7. misc.ts#L199-L223. [C9]
M5. **Level scaling.** s(L) as above, L capped at 30000, floor 0. Sender's Account Level (wiki). Sender level is capped at 30000; stat indexes above 6 yield 0. The pre-2026-06-21 formula is not in the pinned code; flag any pre-patch guide numbers. [C3][C9]
M6. **Result shape.** `bonuses[statIndex] = {statIndex,name,level,friendName,value}` array of length 7, defaulting to value 0; a later entry with the same stat overwrites an earlier one. `getFriendBonus(account, index)` returns `bonuses[index].value`. Type: `generated-types.ts#L4999`. [C11]
M7. **Consumers.** Total Damage: `damage.ts#L320` inside the star-sign/talent multiplier group (added with active buff and star sign, `#L423`). Extra Kills: `damage.ts#L1558`, added to the kill additive total (`#L1563`). Class EXP: `character.ts#L2126` (index 1), summed in the expGain chain (`#L2143`). Drop Rate: `character.ts#L2444` (index 3). Coins: `character.ts#L2782` (index 5). Skill Efficiency: `efficiency.ts#L160`, shown as 'Friend' at `#L193` (index 2). Skill EXP (index 4): no consumer in Toolbox (confirmed by both lenses; L confidence on whether the game applies it). Coins caveat (Toolbox inconsistency, L): `character.ts#L2868` adds `friendBonus` raw into the Pet Arena group while the breakdown at `#L2926` shows `100 * friendBonus`; since `value` is already in percent units (e.g. 40*s*mult), one of the two treatments is likely wrong. Do not copy Toolbox's coins math without checking. [C10]
M8. **Companion dependency.** `isCompanionBonusActive` = `companions.list[i].acquired`, which includes Pet Bonus Token and "simulated" ownership (misc.ts#L1385-L1502). So a token spent on Mr Pig or Spearfish grants slots and the multiplier. [C13]
M9. **Event Shop item 22.** `getEventShopBonus(account,22)` tests whether letter `number2letter[22]` ('v') is in `accountOptions[311]`. Item text: "Friendly Slot: Adds +1 more slot for your Friend Bonuses in Codex!", cost 12 (shared-data.json ninjaExtraInfo[39], pair index 22). Is a one-time purchase. Ownership is a letter lookup in `accountOptions[311]`. [C14]
M10. **Unlock gates.** None found in code beyond base 2 slots; no level requirement for the Codex tab in the parser. [C5]
M11. **Achievements.** "Here Friend!" and "Best Friend Forever!" (tasks.json lines 345-363), one-off. [C4]
M12. **Offered-set rotation.** Wiki: Extra Kills (index 6) was offered 2026-06-21 to 2026-10-12 and More Coins (index 5) again from 2026-10-12; the offered set is server-driven and changes without a patch, so ActiveOn must not assume all 7 stats are selectable. Toolbox (M confidence, wiki-only dates) @6c37e3d (2.3.540) still parses and consumes index 6. [C3][C10]
M13. **Event Shop and companion state gates.** Mr Pig and Spearfish bonuses only count when acquired (including Pet Bonus Token / simulated ownership). [C13]
W5+ extensions: none found in the pinned parsers; no W5-W7 code reads `friendBonusStats` beyond the consumers above (verified by grep over parsers/, 2026-10-19). [C15]

### Min-max by stage

No community priority guide was retrievable this session (web search budget exhausted; only one wiki page fetched). Lines below are derived from the code formulas (tier 1 maths) and marked as derived, not community meta.

- **W1 early:** 2 slots, no multiplier unless Mr Pig owned. Take the highest-level friends; pick Total Damage (100 base, largest absolute) then Drop Rate or Class EXP. Derived from the base table. [C9]
- **W1 mid/late, W2:** Buy Event Shop "Friendly Slot" (12 points) for the 3rd slot. [C14] Fill remaining slots with the highest-level senders; value is proportional to s(L), so a L=12000 friend is worth ~2.7x a L=1000 friend. [C9]
- **W3:** Mr Pig is the dominant lever: 2.0x multiplier and +2 slots, upgraded 2.5x and +3 (Pet Mart+ cost 3500 per companions.json). Spearfish adds +1 slot and (upgraded, cost 1800) +25%. [C12][C13]
- **W4:** Same plan; Extra Kills (10 base, scaled) feeds KPK for monsters you farm AFK (Death Note rank speed). With full 7 slots, one stat per slot, order by your bottleneck. [C10]
- **Late (all worlds):** Max theoretical per slot: Total Damage 132.1 x 2.75 = 363.4%. [C9][C13]

### Save and Toolbox fields

- Raw: `accountOptions[476]` (string), `accountOptions[311]` (Event Shop letters), companion data `companion.l` / `.e` via `account.companions.list[30|44]` (`acquired`, `bonus`, `level`, `upgraded`). [C6][C13]
- Computed: `account.friendBonusStats = { slots, multiplier, bonuses[7]{statIndex,name,level,friendName,value} }` (parsers/index.ts#L385, misc.ts#L132). Friend names must be scrubbed from fixtures (`packages/kb-tools/src/scrub/policy.ts` already treats 476 as 'friends').
- ActiveOn state: no KB system file or detector mentions friend bonuses today (grep over packages/knowledge/systems and detectors, 2026-10-19), contrary to the brief, which says death-note and monster-afk list friend bonus 6. Not confirmed; see open questions.

### Sources

Tier 1: Toolbox code and data paths above (pin 6c37e3d, game 2.3.540, verified 2026-10-19). Tier 3: https://idleon.wiki/wiki/Friend_Bonuses (fetched 2026-10-19). No tier-4 sources obtained.

### Claims

[C1] Friend Bonuses are one of 7 account stats from friends. Source: misc.ts#L133-L141 (tier 1).
[C2] A friend sends one bonus at a time; value scales with sender's Account Level. Source: https://idleon.wiki/wiki/Friend_Bonuses (tier 3, 2026-10-19; page edited 2026-10-14). Confidence M; the code side (level scaling) is H.
[C3] Feature launched 2025-11-06; scaling formula changed 2026-06-21; Extra Kills offered 2026-06-21 to 2026-10-12 (ended); More Coins offered 2025-11-06 to 2026-06-21 and again from 2026-10-12. Source: idleon.wiki Friend_Bonuses (tier 3), dates wiki-only. Confidence M.
[C4] Achievements "Here Friend!" and "Best Friend Forever!" exist. Source: data/website-data/tasks.json#L345-L363 (tier 1; names are underscored in data). Confidence H.
[C5] Base slots 2, max 20. Source: misc.ts#L146-L154 (tier 1). Confidence H.
[C6] State is `accountOptions[476]` string `stat,level,name;...`. Source: misc.ts#L159-L175 (tier 1). Confidence H.
[C7] Output shape {slots, multiplier, bonuses}. Source: generated-types.ts#L4999 (tier 1).
[C8] Seven stats and their names. Source: misc.ts#L133-L141 (tier 1).
[C9] Base values [100,30,50,25,30,40,10] times min(1.5, 0.25+L/(L+12000)*1.5), L capped 30000. Source: misc.ts#L199-L223 (tier 1); wiki max values 132/39.6/66.1/33/39.6/52.9/13.2 agree (tier 3).
[C10] Consumers: damage.ts#L320,#L1558; character.ts#L2126,#L2444,#L2782; efficiency.ts#L160. Source: those paths (tier 1). Confidence H; idx 4 has no consumer.
[C11] Same-stat later entries overwrite earlier ones in `bonuses`. Source: misc.ts#L165-L175 (tier 1). Confidence H for Toolbox, L for in-game.
[C12] Mr Pig (#30): bonus 1, upgraded 1.5; text "2x Friend Bonuses, 2 slots" / upgraded "2.5x, 3 slots"; upgrade cost 3500. Source: data/website-data/companions.json (tier 1). Confidence H.
[C13] Spearfish (#44): +1 slot, upgraded also +25% Friend Bonuses, cost 1800; multiplier formula 1+(100*MrPig+25 if Spearfish lvl>=1)/100. Source: companions.json[44]; misc.ts#L157-L158 (multiplier), #L1506 (isCompanionLvl2Active) (tier 1). Confidence H.
[C14] Event Shop item 22 "Friendly Slot" (+1 slot, cost 12). Source: shared-data.json ninjaExtraInfo[39] list index 22 (tier 1); misc.ts#L1938-L1941.
[C15] No W5+ code reads friendBonusStats beyond listed consumers. Source: grep of parsers/ (tier 1, 2026-10-19).
[C16] Pre-2026-06-21 formula min(1, 0.2+L/(L+3000)) with 12K level cap. Source: verifier summary of wiki history (tier 3, unverified). Confidence L.
[C17] Offered bonus set is server-driven and rotates without a patch. Source: idleon.wiki Friend_Bonuses (tier 3). Confidence M.
[C18] Coins friend bonus raw-vs-percent inconsistency in Toolbox. Source: character.ts#L2868 vs #L2926 (tier 1). Confidence L (needs in-game check).
