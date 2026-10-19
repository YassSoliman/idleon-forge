# The Owl (Orion): System dossier (M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/`. "MF" = Megafeathers owned (`accountOptions[262]`). Parser index `getMegaFeather(account, i)` is 1 when MF > i (i is the 0-based Megafeather slot).

## The Owl (Orion the Great Horned Owl's Feather Enterprise)

- **What it is:** an account-wide incremental minigame (a passive feather generator, not an active clicker; Toolbox's "clicker" naming is internal). Feathers accrue every second (away-time credit is unverified, see M14) and buy 9 upgrades; two are prestige resets (Restart, Mega Reset). One upgrade, Bonuses of Orion, gives permanent stats to the real game and never resets. [C1] [C2]
- **Unlocks:** reach the Grand Owl Perch map in Blunder Hills (W1, map 42) and follow the "HOOT" popups; Codex access is **Disputed** [C4]. Upgrades unlock by total feathers this run (`accountOptions[263]`): 100 / 1K / 2.5K / 30K / 750K / 10M / 250M / 5B / 100B. [C3] [C4] [C5]
- **Scope:** account-wide; state in `accountOptions[253..264]`. Bonuses apply to every character. [C6]
- **Inputs → outputs:** In: time only. Out: feathers (for upgrades), and permanent Class XP, Base DMG, Total DMG, Skill XP, Drop Rate, All Stats. Feather rate formula in the Mechanics catalogue (M1). [C7] [C8]
- **Goals and Milestones:**

| Milestone | Why | Source |
|---|---|---|
| Upgrade unlock thresholds 100 ... 100B | new mechanic each | [C5] |
| Bonuses of Orion 6/12/18/24/... | each 6 levels = one full stat cycle | [C16] |
| MF 1..10 | each adds a named effect | [C18]-[C21] |
| Restarts per MF (pacing) | community pacing table | [C36] |
| MF 1 / 9 / 17 / 24 tiers; BoO 23 by MF18 (~40% Drop), 29 by MF25 (~67.5%) | AutoReview tiers (arithmetic consistent: Drop = 1%·mult·ceil((L-4)/6)) | [C37] |
| Great Mega Reset gate: `nextLvReq === 0` (all 9 unlocked) and cost `2.5e11·20^L` | grants +1 Megafeather | [C11] [C41] |

- **Feeds / fed by:** Fed by: Upgrade Vault 21, Meritocracy 12 (W2), Pet Arena crucible 1 (W4), Hole Fountain upgrade 18 (W5), Gambit 8 (W5), Legend talent 26 and Menagerie boost 16 (W7), companion 51. Feeds: Class XP, Skill XP, Drop Rate, Base/Total DMG, All Stats (damage and XP calcs). [C9] [C10] [C23]
- **Per-session actions:** buy Bonuses of Orion when affordable; buy cheap generators/cheapeners; Restart when affordable; Mega Reset when affordable (spend leftover feathers on Bonuses of Orion first, it is the only non-resetting spend). Idle/capped state: a Restart or Mega Reset affordable but unused, or zero Feather Generation. [C34] [C35] [C38]
- **AFK Setup implications:** none; no character needs to be anywhere. [C7]
- **Min-max by stage:** see below.
- **Common mistakes:** not unlocking it (`accountOptions[254]` = 0 and `[263]` = 0); resetting with unspent feathers that could have gone to Bonuses of Orion; delaying resets while sitting at cap. [C34] [C35]
- **Save and Toolbox fields:** see M-catalogue; parsed output `account.owl` = `{upgrades[], bonuses[], feathers, progress, nextLvReq, megaFeathers[], featherRate, restartMulti}`. [C6] [C22]
- **Sprites:** `sys-owl` already exists in `apps/activeon/src/art/sprites/grids/systems.ts`. New sprites needed for a dedicated view: feather (currency), shiny feather, six stat-cycle icons reuse existing stat sprites, and 10 Megafeather badges (Maple, Amethyst, Frostraven, Phoenix, Obsidian, Evergreen, Pristine, Lavathian, Midas, Fractal). [C39]

## Mechanics catalogue

M1. **Feather rate (per second)** = `(1+9·MF0) · (1+Fountain18/100) · (1+4·PetArenaCruc1) [PetArenaCruc1 is 1 when crucible count > 1, else 0, so the net factor is x5, not an extra x4] · (1+Vault21/100) · (1+Meritocracy12/100) · (1+Gambit8/100) · (L0 + 5·L5 + 2·MF4·L3 + 4·MF4·L7) · (1+5·L2/100) · (3+2·MF6)^Restarts · (1+ShinyOwned·L6/100)`, where Li is the level at `accountOptions[254+i]`, Restarts = `[258]`, ShinyOwned = `[264]`. Path: `parsers/world-1/owl.ts` `parseOwl` (game fn "Summoning2:OwlFeatherRate"). [C7]

M2. **Upgrade costs.** Common factor = `x1 / (1+10·L3/100) / (1+20·L7/100) / (1+MF2·L0/100) · MenagerieBoost16 (upgrade 0 only)`. Upgrade 0: `5·L0·max(1.05, 1.1−0.025·MF8)^L0` times common factor; upgrades 1-8: `x1·x2^L` times common factor. Base table (x1, x2, unlock x3): FeatherGen 5/1.1/100; BoO 350/25/1K; Multiplier 500/1.11/2.5K; Cheapener 3000/1.16/30K; Restart 1e6/14/750K; SuperProd 2e6/1.12/10M; Shiny 5e6/1.4/250M; SuperCheap 5e7/1.27/5B; MegaReset 2.5e11/20/100B. Path: `data/website-data/shared-data.json` `owlData`; `owl.ts`. [C5] [C11]

M3. **Feather Generation (idx0, `[254]`):** +1 feather/s per level (`owlBonusPerFeather[0]=1`). No level cap in the parser. Its cost is uniquely `level·x1·base^level` (not plain `base^level`), base = `max(1.05, 1.1−0.025·MF8)` where MF8 is the 0-based slot (Midas), and it is the only upgrade Menagerie boost 16 cheapens (`getClickerCheapener` with upgradeIndex < 1). [C11] [C12] [C42]

M4. **Bonuses of Orion (idx1, `[255]`):** each level adds one step to a 6-stat cycle; never resets. Bonus for stat s with offset o: `base · multiplier · max(0, ceil((L1 − o)/6))`. Bases/offsets: Class XP 5%/0, Base DMG 10/1, Total DMG 2%/2, Skill XP 4%/3, Drop Rate 1%/4, All Stats 2/5. `multiplier = (1+MegafeatherBonus/100)·(1+LegendTalent26/100)·(1+Companion51)`. [C13] [C14] [C15] [C16]

M5. **Feather Multiplier (idx2, `[256]`):** +5% feather generation per level, factor `(1+5·L2/100)`. [C12] [C43]

M6. **Feather Cheapener (idx3, `[257]`):** all costs ÷(1+0.1·L) (10%/level; `owlBonusPerFeather[3]=10`). With MF5 (Obsidian) also +2 feathers/s per level. [C12] [C20]

M7. **Feather Restart (idx4, `[258]` = restart count):** resets almost all upgrades and feathers (except Bonuses of Orion and counters); feather multiplier `(3+2·MF6)^Restarts` (×3 per restart, ×5 with Pristine). Displayed next value = `(3+2·MF6)^(Restarts+1)`. What exactly resets is game-side (not in the parser). [C7] [C12] [C31]

M8. **Super Feather Production (idx5, `[259]`):** +5 feathers/s per level, added into the base sum with L0 (before multiplicative factors). [C12] [C43]

M9. **Shiny Feathers (idx6, `[260]` level, `[264]` owned):** rare shiny drops; each owned shiny gives +Level% feather generation (`ShinyOwned·L6/100`). Shiny count `[264]` is also returned as the last `bonuses` entry ("Shiny Feather"). Drop chance is game-side (unverified, L). [C7] [C12] [C44]

M10. **Super Feather Cheapener (idx7, `[261]`):** all costs ÷(1+0.2·L) (20%/level; `owlBonusPerFeather[7]=20`); with Obsidian also +4 feathers/s per level. [C12] [C20]

M11. **The Great Mega Reset (idx8, `[262]` = MF):** resets almost everything, +1 Megafeather. Unlock at 100B total feathers (progress `[263]`, strict `>`); cost `2.5e11·20^L`; its level IS the Megafeather count (`[262]`). The Button system also exposes feathers `[253]` as a goal counter (`button.ts` case 23). [C5] [C11] [C41]

M12. **Megafeathers (10 named, then endless):** 1 Maple ×10 feathers; 2 Amethyst Orion bonuses +100%; 3 Frostraven all costs −1% per Feather Generation level (divisor `1+L0/100`); 4 Phoenix +100% more; 5 Obsidian cheapeners +2/+4 feathers/s per level; 6 Evergreen +100% more; 7 Pristine Restart ×5; 8 Lavathian +100% more; 9 Midas FeatherGen growth 1.1 → 1.075; 10 Fractal +100% and +50% for each MF beyond the 10th. `MegafeatherBonus% = 100·MF1 + 100·MF3 + 100·MF5 + 100·MF7 + 100·min(1,MF9) + 50·max(0, MF9−1)`; with the 10th slot's count = MF−9, so ×6 at MF10, ×6.5 at MF11, ×10 at MF18. [C18] [C19] [C20] [C21]

M13. **Cross-system multipliers on rate:** Upgrade Vault 21, Meritocracy 12, Pet Arena crucible >1 (W4, net x5 rate), Fountain upg 18 (W5), Gambit 8 (W5). Bonus multipliers: Legend talent 26 (W7), companion 51. Cheapener: Menagerie boost 16 (W7, upgrade 0 only). The Fountain term is `Orion_Boost` (tier 0, index 18): `round(level·5·marbleMulti)`, marbleMulti = 1 at tier 0 else 1.5+0.5·tier. Menagerie boost 16 does not affect rate. [C9] [C10] [C23] [C24] [C42]

M14. **Away time and items:** **Unverified (L).** A prior dossier claimed away seconds × rate are credited to `[253]`/`[263]` and that a "2hrOfOrionFeathers" item adds 7,200 s of feathers; neither appears in the vendored parser. Treat as an open question. [C8]

M15. **Alerts (Toolbox):** `featherRestart` and `megaFeatherRestart` next-action triggers; verified in `baseTrackers.js` (L122/L972) and `account.js` (L408-421). Use these as the detector spec: fire when the upgrade is unlocked and affordable (feathers >= cost). [C38]

M16. **Unlock gate and progress:** `[263]` is the unlock gate (strict `progress > x3`) and source of `nextLvReq`; `nextLvReq` is the x3 of the first locked upgrade, 0 when all are unlocked. [C5] [C41]

## Min-max by stage

- **W1 early:** unlock at the Grand Owl Perch as soon as reachable; buy Feather Generation, Multiplier, Cheapener, then Bonuses of Orion whenever affordable; Restart as soon as affordable. [C34] [C35]
- **W1 mid/late:** push to MF1 (Maple ×10); community pacing (pre-2.3.540, tier 4, numbers not line-checked): 6 restarts before MF1, then 6, 7, 8, 9 before MF2..MF5. [C36]
- **W2:** Meritocracy 12 and Upgrade Vault 21 add rate multipliers; keep Restarting and Mega Resetting each time affordable; target MF ~9 (AutoReview tier). [C9] [C37]
- **W3:** MF 10+ makes each extra MF worth +50% of base on the bonus multiplier; aim for AutoReview tier MF17 with Bonuses of Orion 23 by MF18 (~40% Drop Rate). [C37]
- **W4:** Pet Arena crucible 1 gives a net x5 feather-rate step ((1+4·1); needs crucible count > 1). Continue to MF24+ with BoO 29 by MF25 (~67.5% Drop). [C10] [C37]
- **Late (W5+):** Fountain, Gambit, Menagerie, Legend talent 26 and companion 51 compound; reset cadence slows to days or weeks; community says past ~15 MF fixing party/other systems is often more efficient than grinding more MF. [C23] [C40]
- **Stat-order priority:** none exists (the cycle order is fixed); the only choice is spending, and Bonuses of Orion first before a reset. [C16] [C35]
- **Per class:** none.

## Open questions

- What exactly Restart and Mega Reset reset, and the shiny drop chance, are game-side and not in the parser (only prior dossier / wiki wording).
- Away-time credit and the 2hrOfOrionFeathers item (unverified).
- Whether the 2.3.540 change from MF10 to "MF−9" for the Fractal count shifts any community tables written pre-patch (AutoReview @05ac449 predates it; flagged pre-patch).
- Community optimal reset cadence per MF has no retrievable authoritative source (Reddit/Steam threads only partially retrievable).
- The `unlocked` flag uses `progress > x3` (strict), so exactly-100 feathers does not unlock; confirm in game.

## Sources (verified 2026-10-19)

Listed inline per claim below.

## Claims

Confidence: H/M/L. **Disputed** = one verifier lens refuted; both views stated.

- [C1] Account-wide incremental (passive) feather generator, spent on upgrades. Wiki describes it as passive, not a clicker; "clicker" appears only in Toolbox `getClickerCheapener`. Source: https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise (tier 3, 2026-10-19). Confidence M
- [C2] 9 upgrades; Bonuses of Orion never resets. Source: `data/website-data/shared-data.json` owlData + its description (tier 1). Confidence H
- [C3] Unlock: Grand Owl Perch map in Blunder Hills, follow HOOT popups. Source: wiki URL above (tier 3; not verifiable in code). Confidence M
- [C4] **Disputed.** Claim: Codex access added 2025. Source lens: cited changelog URL (idleon.wiki Changelog_2025) returns 404 and the Orion page has no Codex mention, so unsupported. Gamedata lens: unverifiable. Correction: removed from Unlocks as a fact; kept only as an unverified claim. Confidence L
- [C5] Unlock thresholds 100/1K/2.5K/30K/750K/10M/250M/5B/100B, gate `progress > x3` (strict), progress = `[263]`. Source: `shared-data.json` owlData x3; `owl.ts` `unlocked` (tier 1). Confidence H
- [C6] State in `accountOptions[253..264]` (253 feathers, 254+i upgrade levels with 262 doubling as Megafeather count, 263 progress, 264 shiny owned). Source: `owl.ts` (tier 1). Confidence H
- [C7] Feather rate formula (M1). Terms: MF1 (1+9x), fountain, crucible, vault, meritocracy, gambit, (L254 + 5·L259 + obsidian terms), (1+5·L256/100), (3+2·MF7)^L258, (1+shiny·L260/100); MF indices are 0-based. Source: `owl.ts` featherRate (tier 1). Confidence H
- [C8] Away-time credit and 2hrOfOrionFeathers item. Source: prior dossier research/w1-systems citing N.js v1.23 (tier 2); not found in vendored files by either lens. Confidence L
- [C9] Rate multipliers Vault 21, Meritocracy 12, Gambit 8, Fountain (tier 0, idx 18). Source: `owl.ts` (tier 1). Confidence H
- [C10] **Disputed (corrected).** Original: crucible gives a 4x add. Gamedata lens: `owl.ts` uses `(1 + 4*getPetArenaCrucBonus(account,1))` and the bonus is 1 when crucible count > 1, so the net multiplier is x5. Correction applied. Source: `owl.ts` L98; `parsers/world-4/breeding.ts#L35` (tier 1). Confidence H
- [C11] Cost formulas and x1/x2/x3 table. Upgrade 0: `level·x1·max(1.05, x2−0.025·MF8)^level`; others `x1·x2^level`; common factor x1 times three cheapener divisors (Cheapener, Super Cheapener, MF3 `1/(1+L254/100)`) times Menagerie cheapener (upgrade 0 only). Source: `owl.ts` + `shared-data.json` owlData (tier 1). Confidence H
- [C12] Per-level effects via `owlBonusPerFeather` [1,0,5,10,0,5,1,20,0]; upgrades 3 and 7 are cost reductions. Source: `shared-data.json`, `owl.ts` (tier 1). Confidence H
- [C13] BoO stat bases and offsets (Base DMG and All Stats flat, others percent). Source: `owl.ts` owlStats (tier 1). Confidence H
- [C14] BoO multiplier = (1+MFbonus/100)(1+legend26/100)(1+companion51 bonus); companion not divided by 100. Source: `owl.ts` (tier 1). Confidence H
- [C15] BoO bonus = base·multiplier·max(0, ceil((L−offset)/6)), L = `[255]`. Source: `owl.ts` (tier 1). Confidence H
- [C16] 6-level full cycle, offsets 0..5. Source: derived from [C15] (tier 1). Confidence H
- [C18] Megafeather effects 1-10 (descriptions in `megaFeathersDesc`). Names (Maple, Amethyst, ...) come only from the wiki and are not in code. Source: `owl.ts` + wiki (tier 1/3). Confidence M (effects H, names M)
- [C19] MF bonus % = 100 per MF idx 1,3,5,7 + 100·min(1,idx9) + 50·max(0,idx9−1), idx9 value = MF−9. MF10 = 500 (x6), MF11 x6.5, MF18 x10. Source: `owl.ts` totalFeatherBonus (tier 1). Confidence H
- [C20] Obsidian adds 2·MF5·L257 + 4·MF5·L261 inside the base sum, before multiplicative factors. Source: `owl.ts` (tier 1). Confidence H
- [C21] 2.3.540: Fractal count is MF−9 (was 10). Source: `owl.ts` comment "ActorEvents_670 (2.3.540, was 10)" (tier 1). Confidence H
- [C22] Parsed shape of `account.owl`; `bonuses[0]` is Feather/sec, last entry Shiny Feather. Source: `owl.ts` return (tier 1). Confidence H
- [C23] Legend talent 26 and companion 51 feed the BoO multiplier (not feather rate); Menagerie boost 16 only cheapens upgrade 0. Source: `owl.ts`; `parsers/world-7/menagerie.ts#L131` (tier 1). Confidence H
- [C24] Fountain bonus = round(level·bonusPerLevel·marbleMulti), marbleMulti 1 at tier 0 else 1.5+0.5·tier. Source: `parsers/world-5/caverns/the-fountain.ts#L45` (tier 1). Confidence H
- [C31] Restart factor `(3+2·MF7)^L258` (x3 base, x5 with MF idx6); displayed restartMulti is that to the power L258+1. Source: `owl.ts` (tier 1). Confidence H
- [C34] Community: do resets whenever possible; always buy Bonuses. Source: Idleon Incomplete Guide W1 / prior dossier (tier 4, may be stale). Confidence L (unverifiable)
- [C35] Reset wipes upgrades and feathers except Bonuses of Orion (and counters). Support is the owlData descriptions ("Reset almost all Upgrades and Feathers"; BoO never resets), tier 1, not the wiki; the actual reset is game-side. Source: `shared-data.json` owlData, `owl.ts` (tier 1). Confidence M
- [C36] AutoReview restart pacing per MF band. Source: https://raw.githubusercontent.com/TwoSpookyBoos/IdleOnAutoReviewBot/05ac4496c335644dedd68e0be65ac893971efc73/mysite/w1/owl.py (tier 4, pre-2.3.540; numbers via summarizer, not line-checked). Confidence L
- [C37] AutoReview tiers: MF 1/9/17/24 boundaries and orionDRValues {23:40, 29:67.5} confirmed in the pinned file; BoO arithmetic consistent with code. Source: same file (tier 4, pre-2.3.540). Confidence M
- [C38] Toolbox alerts featherRestart / megaFeatherRestart, verified in `baseTrackers.js` L122/L972 and `account.js` L408-421. Source: Toolbox vendored (tier 1/2). Confidence H
- [C39] Existing sprite `sys-owl`. Source: `apps/activeon/src/art/sprites/grids/systems.ts#L511` (tier 1, repo). Confidence H
- [C40] **Disputed (source dead).** Claim: past ~15 MF fixing party is more efficient; resets days to weeks apart. Source lens: the cited reddit.birdcat.cafe URL returns 404 (search snippet only). Gamedata lens: unverifiable. Kept only as unverified community opinion. Confidence L
- [C41] Great Mega Reset: gate `nextLvReq === 0`, cost 250e9·20^L, its level `[262]` is the MF count; progress `[263]` is the unlock gate; feathers `[253]` also a Button goal counter (`button.ts` case 23). Source: `owl.ts` L78-L89, L148; `shared-data.json` (tier 1). Confidence H
- [C42] Menagerie boost 16 cheapens only upgrade 0 (`getClickerCheapener`, upgradeIndex < 1); Midas MF lowers upgrade 0 cost growth 1.1 to 1.075, floored 1.05. Source: `owl.ts` L14, L41; `world-7/menagerie.ts` (tier 1). Confidence H
- [C43] Per-upgrade effects: Feather Multiplier +5%/lvl, Super Feather Production +5/s per lvl, Cheapener 10%/lvl, Super Cheapener 20%/lvl. Source: `owlBonusPerFeather`, `owl.ts` (tier 1). Confidence H
- [C44] Shiny Feathers: drops in `[264]`, each adds feather-rate % scaled by Shiny upgrade level `[260]`: `(1+shiny·L260/100)`. Drop chance not in code. Source: `owl.ts` (tier 1). Confidence H (formula), L (drop chance)
