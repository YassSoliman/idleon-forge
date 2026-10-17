# Orion the Owl (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there.

## Orion the Great Horned Owl's Feather Enterprise

- **What it is:** an account-wide incremental ("clicker") minigame. Feathers generate every second, including while you are away. You spend them on 9 upgrades, two of which are prestige resets. The **Bonuses of Orion** upgrade gives permanent stats to the real game and never resets. **The Great Mega Reset** awards Megafeathers, which multiply everything. (H: Toolbox `parsers/world-1/owl.ts`, `shared-data.json` `owlData`; N.js `Summoning("OwlFeatherRate"…)`, `Owlz`; wiki [Orion…](https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise), rev. 2026-10-07)
- **Unlocks:** reach map 42, **Grand Owl Perch**, in Blunder Hills (W1). Follow the "HOOT" popups. The Incomplete Guide says the portal is on the Bored Beans map. Since 2025 it is also in the Codex, where you can switch instantly between Orion, Poppy and Bubba. (H for map 42: Toolbox `mapNames`; wiki; [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025) "Added ORION to the codex")
- **Scope:** account-wide (state in `OptionsListAccount[253–264]`). Its bonuses apply to every character. (H)
- **Inputs → outputs:**
  - **In:** time only. Feather rate = `(1 + 9·MF₀) · (1 + Fountain/100) · (1 + 4·PetArenaCruc₁) · (1 + Vault21/100) · (1 + Meritocracy12/100) · (1 + Gambit8/100) · (FeatherGen + 5·SuperProd + 2·MF₄·Cheap + 4·MF₄·SuperCheap) · (1 + 5·Multiplier/100) · (3 + 2·MF₆)^Restarts · (1 + Shiny·ShinyLv/100)`. (H: Toolbox `parseOwl` "Summoning2:OwlFeatherRate"; N.js away-time block adds `OwlFeatherRate × seconds away` to OLA[253] and OLA[263])
  - The "2hrOfOrionFeathers" item adds 7,200 s of feathers. (H: N.js item handler)

| # | Upgrade | Unlocks at total feathers | Cost (before cheapeners) | Effect | Resets on Restart? |
|---|---|---|---|---|---|
| 0 | Feather Generation | 100 | `5 · L · max(1.05, 1.1 − 0.025·MF₈)^L` | +1 feather/s per level | yes |
| 1 | **Bonuses of Orion** | 1K | `350 · 25^L` | +1 bonus step (cycle below) | **never** |
| 2 | Feather Multiplier | 2.5K | `500 · 1.11^L` | +5% feathers per level | yes |
| 3 | Feather Cheapener | 30K | `3000 · 1.16^L` | all costs −10%/level (÷(1+0.1L)) | yes |
| 4 | Feather Restart | 750K | `1e6 · 14^L` | resets almost all upgrades and feathers (Bonuses of Orion and the reset counters stay); ×3 feathers per restart (×5 with MF₆), compounding | — |
| 5 | Super Feather Production | 10M | `2e6 · 1.12^L` | +5 feathers/s per level | yes |
| 6 | Shiny Feathers | 250M | `5e6 · 1.4^L` | rare shiny drops; each +level% feather gen | yes |
| 7 | Super Feather Cheapener | 5B | `5e7 · 1.27^L` | all costs ÷(1+0.2L) | yes |
| 8 | The Great Mega Reset | 100B | `2.5e11 · 20^L` | resets almost everything; +1 Megafeather | — |

  (H: `owlData` x1/x2/x3 and the cost code in `parseOwl`. The Frostraven Megafeather adds a further ÷(1 + MF₂·FeatherGenLv/100). The Menagerie (W7) cheapens upgrade 0.)

  **Bonuses of Orion cycle.** Level k raises the stat at position (k−1) mod 6 by one step. Each step is the base × (1 + MegafeatherBonus/100) × (1 + Legend talent 26/100) × (1 + companion 51).

| Step | Base per step |
|---|---|
| 1st, 7th, 13th … | +5% Class EXP |
| 2nd, 8th … | +10 Base Damage |
| 3rd, 9th … | +2% Total Damage |
| 4th, 10th … | +4% Skill EXP |
| 5th, 11th … | +1% Drop Rate |
| 6th, 12th … | +2 All Stats |

  **Megafeathers** (from Mega Resets):
  1. Maple: ×10 feathers.
  2. Amethyst: bonuses +100%.
  3. Frostraven: −1% cost per Feather Generation level.
  4. Phoenix: +100%.
  5. Obsidian: the Cheapeners also give +2/+4 feathers/s per level.
  6. Evergreen: +100%.
  7. Pristine: Restart ×5 instead of ×3.
  8. Lavathian: +100%.
  9. Midas: Feather Generation cost grows 25% slower.
  10. Fractal: +100%, then **+50% for each further Mega Reset** (endless).

  The bonus multiplier is therefore 1 + 4 + 1 + 0.5·(MF − 10) for MF ≥ 10. That is ×6 at 10 MF, ×7 at 12 MF, ×12 at 22. (H: `parseOwl` `totalFeatherBonus`)

  The Santa's Little Helper pet (companion 51), W7 legend talent 26 and the W5 Gambit cavern also multiply Orion. That explains "Why are my friend's Orion bonuses so much higher at a lower level?" (r/idleon 2026-10-11).

- **Goals and Milestones:**

| Milestone | Why | Source |
|---|---|---|
| Unlock each upgrade (100 / 1K / 2.5K / 30K / 750K / 10M / 250M / 5B / 100B total feathers) | New mechanics | `owlData.x3` (H) |
| Bonuses of Orion 6 / 12 / 18 / 24 … | One full stat cycle each | `parseOwl` (H) |
| Megafeathers 1 → 10 (Fractal) | Each multiplies feathers or bonuses | wiki (H) |
| Restarts before each Megafeather: 6 (MF1), 6, 7, 8, 9, 11, 12, 11, 12, 14 (MF10), 16, 17, 18, 19, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32 (MF25) | AutoReview's pacing table | AutoReview `owl.py` `featherResetsDict` (L) |
| MF 1 → 9 → 17 → 24, with Bonuses of Orion 23 by MF 18 and 29 by MF 25 | AutoReview owl tiers. Their table says Bonuses of Orion 23 is about 40% Drop Rate and 29 about 67.5%, at those MF counts. | AutoReview (L) |
| "At least Fractal 5" (15 MF) | Incomplete Guide W1 target (**Stale**) | guide (L) |

- **Feeds / fed by:**
  - **Fed by:** time, Upgrade Vault 21, Meritocracy 12 (W2 ballot), the W5 Gambit, Hole fountain (W5), the Pet Arena (W4), the W7 Menagerie (cost), legend talents and the companion (W7).
  - **Feeds:** Class EXP and Skill EXP (every character's levelling, every skill), Drop Rate (statues, cards, rare drops: [statues.md](statues.md) and the cards dossier), Base and Total Damage, All Stats.
  - It also takes the same Codex slot as Poppy (W2) and Bubba, which only matters for active clicking.
- **Per-session actions:**
  1. Open Orion (from the Codex).
  2. Buy Bonuses of Orion whenever affordable ("Always buy Bonuses").
  3. Buy the cheap generators and cheapeners.
  4. **Restart** whenever Feather Restart is affordable ("Do normal resets everytime you can").
  5. **Mega Reset** whenever affordable ("Do Mega Reset everytime you can").
  - Toolbox raises `featherRestart` and `megaFeatherRestart` alerts, which are ready Next Action triggers. AutoReview alerts when `feather_generation < 1` ("You aren't generating any Owl Feathers!").
  - **Idle state:** a Restart or Mega Reset sitting affordable; zero generation.
- **AFK Setup implications:** none. It runs on its own while you are away, and no character needs to be anywhere.
- **Min-max by stage:**
  - **Early W1:** unlock it as soon as map 42 is reachable (the Incomplete Guide calls this the "main goal" after your first class). Buy Feather Generation, then Multiplier and Cheapener, then Bonuses of Orion when affordable. Restart as soon as you can.
  - **W1–W3:** chase Megafeathers. Every Mega Reset multiplies feathers (Maple ×10) or the bonuses. Keep buying Bonuses of Orion, which survives everything.
  - **Late:** endless Fractal Megafeathers (+50% each). AutoReview targets 24+ MF.
  - **Per class:** none (account-wide).
  - **Reality check:** both MVP fixtures (W2 and W3) already hold 12 Megafeathers, Bonuses of Orion 24 and 28, and 25 and 30 restarts. Orion is the most-developed W1 System on both accounts. For them, ActiveOn's value here is the restart and mega-reset reminders, not a plan.
- **Common mistakes:**
  - **Not restarting or mega-resetting when affordable.** Detect with Toolbox's alerts.
  - **Never unlocking it.** Detect `accountOptions[254] == 0`.
  - **Leaving feathers unspent on Bonuses of Orion before a reset.** Those feathers vanish on reset, and Bonuses of Orion is the only upgrade that persists.
- **Save and Toolbox fields:**
  - `accountOptions[253]` (current feathers), `[254]` (Feather Generation level), `[255]` (Bonuses of Orion), `[256]` (Multiplier), `[257]` (Cheapener), `[258]` (Restarts), `[259]` (Super Production), `[260]` (Shiny Feathers level), `[261]` (Super Cheapener), `[262]` (Mega Resets / Megafeathers), `[263]` (feathers this run, which gates unlocks), `[264]` (shiny feathers owned).
  - Parsed `account.owl.{upgrades[] {name, level, cost, unlocked}, bonuses[] {name, bonus}, feathers, progress, featherRate, megaFeathers[] {unlocked}, restartMulti}`.
  - Helper `getOwlBonus(account.owl.bonuses, 'Drop Rate' | 'Class XP' | 'Skill XP' | …)`.
- **Sources:** N.js v1.23 (2026-10-17): `_customBlock_Summoning("OwlFeatherRate" / "OwlFeatherShinyGen" / "OwlBonuses" / "OwlMegafeather")`, the away-time feather credit, the "2hrOfOrionFeathers" item. Toolbox @ 6827d3f: [`parsers/world-1/owl.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/owl.ts), `shared-data.json` `owlData` and `mapNames` (42 Grand_Owl_Perch), `baseTrackers.js` (World 1 → owl). Wiki: [Orion the Great Horned Owl's Feather Enterprise](https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise) (rev. 2026-10-07). AutoReview @ 05ac449 [`mysite/w1/owl.py`](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/w1/owl.py), `owl_progressionTiers`. Idleon Incomplete Guide W1 tab (**Stale**). r/idleon [1x3h8su](https://www.reddit.com/r/idleon/comments/1x3h8su/) (2026-10-11), "What's the optimal amount of fractal megafeathers?" [1sk0wyq](https://www.reddit.com/r/idleon/comments/1sk0wyq/) (2026-04-13; comments not retrieved, rate-limited).
