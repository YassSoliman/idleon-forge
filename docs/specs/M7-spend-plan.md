# M7 Spend Plan

Spec for [#35](https://github.com/YassSoliman/idleon-forge/issues/35), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft**, waiting on the grilling of section 8 and a red-team pass. Build order slot: after M4, before M8 ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).

Terms follow [GLOSSARY.md](../../GLOSSARY.md). Binding decisions: [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [ADR 0004](../adr/0004-source-precedence.md) (source precedence), [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic, no formulas of our own), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (parsing in a Web Worker), [ADR 0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment). Inputs: the Now-screen rulings ([#10](https://github.com/YassSoliman/idleon-forge/issues/10), [#12](https://github.com/YassSoliman/idleon-forge/issues/12)), the Knowledge Base shape ([#11](https://github.com/YassSoliman/idleon-forge/issues/11)), the architecture ([#14](https://github.com/YassSoliman/idleon-forge/issues/14)), the hypothetical-math spike ([#16](https://github.com/YassSoliman/idleon-forge/issues/16)), and the Leverage model ([#26](https://github.com/YassSoliman/idleon-forge/issues/26), `research/leverage-model`). Facts come from the dossiers on `research/w1-systems` (stamps, bribes, statues, anvil, forge), `research/account-wide` (Upgrade Vault) and `research/w2-systems` (Alchemy Pay 2 Win). Orders come from `research/priority-verification` (PV), which wins on conflicts.

Patch: game v1.23 "Lumi Menagerie" (2026-10-16/17). Toolbox pins read for this spec: `6827d3f` (dossiers) and `6c37e3d` (the slice-1 vendored copy on `feat/slice-1-live-sync`). Fixture facts below are aggregates from `fixtures/private/*.parsed.json`, read 2026-10-17. Characters are named by class and level only.

## 1. Purpose

A player arrives at a Play Session with coins piled up on several characters and no idea which of a dozen coin sinks deserves them. The Spend Plan answers "what do I buy, in what order, and on which character" in one short list: Upgrade Vault rows, stamp levels (and the cap raises that unlock them), bribes, statue Gold and Alchemy Pay 2 Win upgrades. Each line says what to buy, which character holds the coins for it, what it costs, and why it comes before the next line. Every cost is a Toolbox number checked against the coins that character actually holds. The plan also protects the player from the mistakes that waste coins or progress for good: raising stamp caps one at a time and wiping the Hydrogen discount, redeeming Colosseum tickets before Duplicate Entries, and leaving coins idle while cheap permanent upgrades sit unbought.

## 2. Scope

**In scope (MVP, W1–W3 plus W4 entry):**

- **Currency:** coins only, per character, plus the coins stored in the bank (storage).
- **Sinks:**
  - Upgrade Vault, rows 0–61 (W1–W4).
  - Stamps: coin levels below the cap, plus the material cap raise that has to come first when a stamp is at its cap.
  - Bribes, sets 1–4.
  - Statue Gold (see D3 for its cost).
  - Alchemy Pay 2 Win: cauldron, liquid and vial upgrades. Player upgrades are covered by D3.
- **Arithmetic** on Toolbox-computed costs ([ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md)): sums, running balances per wallet, shortfalls, levels to the next Vault unlock, and days until the Hydrogen discount reaches a level.
- **Batching rules:** stamp cap raises under the Hydrogen discount; one-off buys that must come before an irreversible action (Duplicate Entries before redeeming tickets).
- **The Knowledge Base entries** the plan needs: generated facts and authored Spend Priority Lists per Stage, plus the Detectors that read them.
- **The engine output** (`SpendPlan`) that M10 renders, plus the per-character "to spend" totals that Visit Order needs.

**Out of scope:**

- **Other currencies:** gems, merits, star talent points, anvil points from levels, Post Office boxes, talent points and so on. "You have unspent X" belongs to M6 Unspent & idle. The Gem Shop first buy is also Contested (PV 7.5).
- **Material spends other than stamp cap raises** (vials, bubbles, Construction salts, Post Office). These are other modules' Goals.
- **Sinks Toolbox does not price and that are not covered by D3:** Forge upgrades (Toolbox gives no cost), Town shop items and consumables (food, upgrade stones), Obol shop, Colosseum and Arcade shops (non-coin currencies).
- **Bribe sets 5–6** (Garbage Tuna and Jade Emporium, W5+). **Vault rows 62–89** (W5–W6).
- **W4+ coin sinks** (kitchens, Lab, Breeding). Gilded and Exalted Stamps (Rift 26, W6).
- **Coin income forecasting,** for example "you will afford X in 3 h". Toolbox has no coins-per-hour number, and we will not write one. A later version may use the observed coin delta between saves; see Red-team 7.
- **Kill-scaled Vault row steps** (powers of 10 of kills on Bean, Carrot, Branch, Poop and Sheepie). They are Milestones, so they belong to M4 Purpose & Milestones.
- **Knockouts** need active play, so they belong to the Active Play suggestions.
- **Moving coins in the game for the player.** ActiveOn is read-only, always.

## 3. Functional requirements

- **FR-1 Plan per save.** On every successful parse the engine produces exactly one `SpendPlan` for the account, as part of the engine's pure function `(Account State, save history, Knowledge Base, now)` ([#14](https://github.com/YassSoliman/idleon-forge/issues/14)). A failed parse produces no plan, never a stale or partial one ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 13).
- **FR-2 Wallets.** The plan lists every character's coins (`characters[].money`) as a wallet, plus the bank (`currencies.bankMoney`) as one more. The plan never uses Toolbox's `currencies.rawMoney` or `stamps[].hasMoney` for affordability. Both are account-wide sums that include the bank, and the game spends from the character being played (Vault dossier, Scope).
- **FR-3 Lines.** Each line names:
  - one purchase or one grouped purchase (FR-9);
  - the sink, and the item with its current and target level;
  - the coin cost (a Toolbox number, or the sum or difference of Toolbox numbers);
  - the wallet that pays, as class and level;
  - a status: `buy`, `move-coins`, `save-for`, `hold` or `unpriced`;
  - a one-line why, the Source label, confidence, and Contested and Stale flags;
  - provenance (the save fields and Knowledge Base entry ids used).
- **FR-4 Order.** Lines are ordered by their position in the Stage's Spend Priority List. Ties are broken by #11 item 6's arithmetic: cheapest first, then closest Milestone, then most Goals. A Contested line is never the first line ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 5). A Stale line ranks below a fresh one at the same position ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 10).
- **FR-5 Affordability.** The allocator walks the lines in order and keeps a running balance per wallet. A line gets status `buy` only if one wallet covers its full cost at that point. The sum of `buy` costs per wallet never exceeds that wallet's coins.
- **FR-6 Wallet choice.** A `buy` line goes to the first wallet in this order that covers it:
  1. a wallet already used by an earlier line, so the player switches characters less;
  2. for stamps, the character who will do the cap raise (FR-10);
  3. the smallest wallet that covers the cost, which keeps big wallets for big buys.

  The rule is deterministic. Ties go to the lower character index.
- **FR-7 Pooling** (depends on D1). If no wallet covers a line but the bank plus one wallet does, the line becomes `move-coins`: "withdraw N from storage on <class Lv>, then buy". Moving coins between two characters through the bank is suggested only for lines flagged `reserve` (D2).
- **FR-8 Done and filtering.** A candidate is dropped when its target is already met (`level >= target`, `level >= maxLevel`, or bribe `done`), or its sink or row is not yet unlocked. This applies even when Toolbox still reports a non-zero `cost` for it: on both fixtures, maxed Vault rows such as Weapon Craft 5/5 and Knockout! 5/5 still carry a `cost`. A line also disappears once a later save shows it bought. There is no manual "done" ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8).
- **FR-9 Grouping.** Lines of the same sink, at the same list position, paid from the same wallet, are shown as one expandable line ("Raise 7 stamp caps, then buy their new levels, about 10.1M"). The group's cost is the sum of its parts.
- **FR-10 Stamp cap raises.** For a stamp at its cap, the plan emits the material step before the coin step:
  - **Material step:** "raise the cap: carry N <material> on <class Lv>". It is ready only when all of these hold:
    - Toolbox `hasMaterials` is true;
    - Toolbox `enoughPlayerStorage` is true;
    - for materials of type `Equip`, the count held in storage plus inventories is ≥ the cost. Toolbox's `checkHasMaterials` returns true for Equip materials without counting them.
  - **Doer:** the character who carries the material. That is the line's wallet if its carry capacity for the material (Toolbox `bestCharacter.topCharacters`) is ≥ the material cost, else Toolbox's `bestCharacter`.
  - **Coin step:** the new levels, priced with Toolbox `futureCosts[0].goldCost`.
  - **Not ready:** a stamp whose material is missing, or too big for any character to carry, is not a Spend line. It is reported to M6 and M4 as a Goal (farm the material, or raise carry capacity).
- **FR-11 Hydrogen batching.** When the Hydrogen atom is above Lv 0 (`atoms.atoms[0].level > 0`) and the discount (`atoms.stampReducer`) is above 0:
  - All ready cap raises collapse into one batch line. The engine never emits a single cap raise on its own while other raises are ready.
  - If the hold rule (D4) applies, the batch line has status `hold`. It shows the current discount, the discount needed, and the days to reach it: `ceil((needed − current) / Hydrogen level)`, by arithmetic.
  - While raises are on hold, stamp coin levels below the cap stay buyable (they do not reset the discount).
- **FR-12 Irreversible-order guard.** While Vault row 52 (Duplicate Entries) is unlocked, at Lv 0, and the account holds Colosseum tickets (`currencies.ColosseumTickets.totalAmount > 0`), Duplicate Entries is position 1. Its line reads "buy Duplicate Entries before you redeem tickets". It is flagged `reserve` (D2).
- **FR-13 Unlock fuel.** After the authored lines, one final line says how many Vault levels remain to the next unlock (`nextUnlock.unlockLevel − totalUpgradeLevels`). It also gives the cheapest-first coin estimate for them from the cost ladders (TR-4), labelled "about".
- **FR-14 Unpriced sinks** (D3). A sink Toolbox does not price shows as `unpriced`: "cost not checked, see the price in game". It is never deducted from a wallet and never counted as affordable. At the same list position it ranks below priced lines.
- **FR-15 Visible length.**
  - At most 5 lines are visible, then "show more", matching the Account cap in [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 5. Grouped lines count as one.
  - Lines with status `save-for` or `unpriced` do not take a visible slot ahead of a `buy` line at the same position.
- **FR-16 Per-character totals.** The plan exports, per character, the number of `buy` lines and their summed cost. Visit Order uses it ("then most to spend", glossary; Leverage model §4.3 item 2: coin holders first in the spend phase).
- **FR-17 Empty states.**
  - **No priced line affordable:** "Nothing worth buying yet", with the cheapest next line, its shortfall, and the character closest to affording it.
  - **No sink unlocked yet** (highest class level < 14 and the Vault untouched): only the Vault, which is open from the start.
  - **Nothing left to buy:** "Spend Plan empty".
- **FR-18 Skip and Not for me.** Each line supports the two manual controls from [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8, keyed by the line's entry id and target:
  - **Skip today** hides it until the account's daily reset.
  - **Not for me** hides it until the next patch.

  Hiding a line frees its coins for the lines below it. Both controls stay in the browser.
- **FR-19 Report this.** Each line's Report this ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 9; [#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 15) sends:
  - the entry id and line id;
  - the Knowledge Base version and game version;
  - the Stage;
  - the paying character's class and level;
  - the line's cost, rounded to 2 significant figures.

  It never sends names, wallet balances or save data.
- **FR-20 Not covered.** Out-of-scope sinks that hold value on this account (for example, Forge upgrades) show in the "Not covered yet" list ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 14). They never become a line.
- **FR-21 Combat-row gate.** Vault combat rows (Bullseye 4, Steel Guard 5, All Armoured Up 46) enter the engine-row position only when their gate Check fires. For Bullseye, the gate is the pusher's Toolbox hit chance below 100% on the next map (M2 pusher; Leverage model W1-late 10; PV cross-cutting 3). Otherwise they sit in the band-table position.

## 4. User stories

Every acceptance criterion doubles as a golden test ([#13](https://github.com/YassSoliman/idleon-forge/issues/13) item 4). "W2-late account" and "W3-early account" are the two private fixtures: the Stage comes from M2, and the Leverage model §1.3 confirms both. **Synthetic** fixtures are those private fixtures with named fields edited in the test. Their edits are listed in each criterion, and they are committed only as field patches, never as saves.

Coin figures are Toolbox numbers from the fixtures, rounded.

| | W2-late account | W3-early account |
|---|---|---|
| Wallets | Barbarian Lv 60: ~91.7M; Wizard Lv 56: ~0.72M; Shaman Lv 44: ~0.69M; Squire Lv 43: ~0.18M; Bowman Lv 54: 705 coins. Bank: ~105M | Squire Lv 85: ~2.76B; Wizard Lv 73: ~2.22B; Shaman Lv 54: ~0.87B; Bowman Lv 60: ~0.66B; Barbarian Lv 56: ~2K; Squire Lv 51: 0. Bank: 0 |
| Vault | total levels 1,724; next unlock at 1,780 | total levels 2,497; next unlock at 2,530 |
| Stamps | 7 levelled, all at cap | 17 levelled, all at cap |
| Bribes | 20 bought (sets 1–3 complete) | 22 bought |
| Statue Gold | 5 statues | 13 statues |
| Hydrogen | 0 (no Atom Collider) | 0 (no Atom Collider) |
| Colosseum tickets | 6 | 12 |

### US-1 See what to buy, in order

As a player in a Play Session, I want one ordered list of what to buy with my coins, so that I stop guessing between the Vault, stamps, bribes and statues.

- **AC-1.1** Given the W3-early account / When the engine runs / Then the first line is "Buy Duplicate Entries (Vault) before you redeem tickets", costing ~100M, with status `buy`. This holds because row 52 is unlocked at Lv 0 and the account holds 12 tickets (FR-12).
- **AC-1.2** Given the W2-late account / When the engine runs / Then Duplicate Entries does not appear, because the row is locked (1,724 < 2,470 total levels).
- **AC-1.3** Given either fixture / When the engine runs / Then no line targets a Vault row already at its max level, even where Toolbox reports a non-zero `cost` for it (FR-8).
  - On the W2-late account that excludes Weapon Craft 5/5, Knockout! 5/5, Boss Decimation 25/25, Dirty Money 25/25, Baby on Board 50/50, Stick Snapping 50/50 and the three 777-coin skill rows.
  - On the W3-early account it also excludes Sleepy Time 20/20, Drops for Days 50/50, Bubble Money 10/10, Drip Drip Drip 20/20 and Card Retirement 1/1.
- **AC-1.4** Given the W2-late account / When the engine runs / Then the lines include, among the capped-rows and engine items:
  - Sleepy Time 18→20 (Toolbox `costToMax` ~3.0M);
  - Drops for Days 29→50 (~3.9M);
  - Bubble Money 7→10 (~8.3M).

  Each is paid by the Barbarian Lv 60.
- **AC-1.5** Given either fixture / When the engine runs / Then the last line is unlock fuel: "56 more Vault levels to unlock Active Murdering" on the W2-late account, and "33 more Vault levels to unlock Special Talent" on the W3-early account, each with an "about N coins" estimate (FR-13).
- **AC-1.6** Given either fixture / When the engine runs / Then at most 5 lines are visible and the rest sit behind "show more" (FR-15). The golden snapshot records the full ordered list.

### US-2 Know which character to buy on

As a player in a Play Session, I want each purchase tied to the character who holds the coins, so that I switch to the right character once and buy everything there.

- **AC-2.1** Given the W2-late account / When the engine runs / Then every `buy` line above 1M is paid by the Barbarian Lv 60, the only character holding more than ~0.72M. The Bowman Lv 54 (705 coins) pays for no line.
- **AC-2.2** Given the W3-early account / When the engine runs / Then the Barbarian Lv 56 (~2K) and the Squire Lv 51 (0) pay for no line. The planned total per wallet never exceeds that wallet's coins (FR-5).
- **AC-2.3** Given the W3-early account / When the engine runs / Then Duplicate Entries (~100M) is paid by the Bowman Lv 60 (~0.66B). It is the first line, so no wallet is in use yet, and the Bowman is the smallest wallet that covers it (FR-6).
- **AC-2.4** Given either fixture / When the engine runs / Then the per-character totals (FR-16) list the paying characters in descending total. The W2-late account's list starts with the Barbarian Lv 60.
- **AC-2.5** Given the W2-late account / When the engine runs / Then the bank (~105M) is shown as "Coins in storage" and is never counted as affordable for a `buy` line. Whether it can make a `move-coins` line depends on D1.

### US-3 Raise stamp caps, then buy the levels

As a player in a Play Session, I want to know which stamp caps I can raise now and what the new levels cost, so that my stamps keep levelling instead of sitting at their caps.

- **AC-3.1** Given the W2-late account / When the engine runs / Then the stamp lines contain no coin-only level buy, because all 7 levelled stamps are at their cap.
- **AC-3.2** Given the W2-late account / When the engine runs / Then one grouped line reads "Raise 7 stamp caps, then buy their new levels". Its coin cost is the sum of Toolbox `futureCosts[0].goldCost`, about 10.1M, mostly Target Stamp (~8.8M) and Shield Stamp (~1.3M). It expands to 7 material steps with amounts (for example, 457 Thread for Target Stamp).
- **AC-3.3** Given the W3-early account / When the engine runs / Then the stamp lines are split three ways:
  - **Ready (14 stamps):** the materials are in storage and fit one character's carry capacity.
  - **Twin Ores Stamp and Cool Diggy Tool Stamp:** these need an equipment item (Thief Hood, Iron Hatchet). Toolbox reports `hasMaterials` true for them with 0 counted. They are not marked ready unless storage plus inventories hold the item (FR-10).
  - **Vendor Stamp:** it lacks 5 Cue Tape, so it is not a Spend line. It is handed to M6 and M4 as a Goal.
- **AC-3.4** Given the W3-early account / When the engine runs / Then the doers of the material steps are the Wizard Lv 73 or the Squire Lv 85 (Toolbox's highest-capacity characters for those materials), unless the line's wallet can carry the amount itself (FR-10).

### US-4 Don't waste the Hydrogen discount

As a player in a Play Session in late W3, I want cap raises batched around the Hydrogen discount, so that one cheap raise doesn't wipe a discount that took days to build.

- **AC-4.1** Given a synthetic W3-early account with `atoms.atoms[0].level = 5` and `atoms.stampReducer = 40` / When the engine runs / Then all ready cap raises are one batch line. The engine never emits a single cap raise as its own line (FR-11).
- **AC-4.2** Given the same synthetic account, plus one at-cap stamp whose Toolbox `minReduction` is 55 / When the engine runs under D4's recommended rule / Then the batch line has status `hold` and reads "Hold stamp cap raises: discount 40%, 55% needed for <stamp>, about 3 days". The 3 days is `ceil((55 − 40) / 5)`. Stamp coin levels below the cap stay buyable.
- **AC-4.3** Given the same synthetic account with `stampReducer = 90` / When the engine runs / Then the batch line is `buy`, with no hold, because the discount is at its 90% cap.
- **AC-4.4** Given either real fixture (Hydrogen Lv 0) / When the engine runs / Then no hold notice appears.

### US-5 Don't make an irreversible spending mistake

As a player in a Play Session, I want a warning before I lose value permanently, so that one wrong click doesn't cost me days.

- **AC-5.1** Given the W3-early account / When the engine runs / Then the Duplicate Entries line carries the why "doubles every Colosseum ticket you receive; you hold 12 unredeemed". It cites the Vault dossier (game data: row 52) and the community advice to buy it before redeeming tickets.
- **AC-5.2** Given a synthetic W3-early account with every wallet below 100M and the bank at 0 / When the engine runs / Then Duplicate Entries is a `save-for` line showing its shortfall against the character closest to it, and (under D2's recommendation) lines below it at positions ≥ 3 do not spend that character's coins.

### US-6 Trust each line

As a player in a Play Session, I want to see why a purchase is ranked where it is and where that comes from, so that I can trust the plan or report it when it's wrong.

- **AC-6.1** Given either fixture / When the engine runs / Then every line has a Source label linking to its Source with the patch it was verified on. Lines from unverified orders (PV 7.6 Vault order, PV 3.6 stamp order) show confidence L.
- **AC-6.2** Given either fixture / When the engine runs / Then no Contested line is first in the plan.
- **AC-6.3** Given a line / When the player taps Report this / Then the pre-filled issue contains the entry id, line id, Knowledge Base version, game version, Stage, the paying character's class and level, and the cost rounded to 2 significant figures. It contains no names and no balances (FR-19).

### US-7 The plan keeps up with what I bought

As a player in a Play Session, I want bought items to drop off without ticking anything, so that the list always reflects my account.

- **AC-7.1** Given a synthetic W2-late account where Sleepy Time is raised from 18 to 20 and the Barbarian's coins drop by ~3.0M / When the engine runs on that save / Then the Sleepy Time line is gone and no other line's wallet assignment exceeds the new balance.
- **AC-7.2** Given the W3-early account, then a synthetic next save with Duplicate Entries at Lv 1 / When the engine runs / Then the first line is no longer Duplicate Entries, and the Bowman Lv 60's ~100M is free for the lines below.
- **AC-7.3** Given a line marked Skip today / When the engine runs again before the daily reset / Then the line is hidden and the coins it would have used go to the next lines (FR-18).

### US-8 Know what is not priced or not covered

As a player in a Play Session, I want the plan to say when it can't check a price, so that I don't take an unchecked number as fact.

- **AC-8.1** Given the W2-late account / When the engine runs under D3's recommendation / Then a statue Gold line for the 6th statue (Kachow) appears with status `unpriced`, "cost not checked". It is never deducted from a wallet and ranks below the priced lines at its position.
- **AC-8.2** Given either fixture / When the engine runs / Then the Alchemy Pay 2 Win lines exclude the liquids Toolbox reports at level −1 (locked). On the W2-late account that means N2, Trench and Toxic Mercury, which Toolbox prices at ~2.1K each.
- **AC-8.3** Given either fixture / When the engine runs / Then Forge upgrades appear only in "Not covered yet".

### US-9 Empty and edge states

As a player in a Play Session, I want an honest message when there is nothing worth buying, so that I don't hunt for a list that isn't there.

- **AC-9.1** Given a synthetic W2-late account with every wallet at 0 and the bank at 0 / When the engine runs / Then the plan shows "Nothing worth buying yet". It names the cheapest next line and its shortfall, and no line has status `buy`.
- **AC-9.2** Given a public Toolbox fixture with highest class level < 14 / When the engine runs / Then the plan has only Vault lines (stamps and bribes are locked until Mr Pigibank).
- **AC-9.3** Given a parse that fails or returns an empty account / When the engine runs / Then no Spend Plan is produced and the Now screen shows "Can't read your save right now" ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 13).

## 5. Technical requirements

### TR-1 Package boundaries

| Package | M7 responsibility |
|---|---|
| `packages/account-state` | Adds the typed `SpendInputs` projection (TR-2) to the Account State. It is the only code that reads Toolbox's coin, Vault, stamp, bribe, statue, Pay 2 Win and atom fields. Contract tests fail loudly when Toolbox renames a field. |
| `packages/toolbox-parsers` (worker side) | Computes the Vault cost ladders (TR-4) by re-running Toolbox's exported `parseUpgradeVault` on cloned levels. This happens in the parse Web Worker, because the engine cannot call Toolbox. |
| `packages/engine` | `spend/` module: a pure `buildSpendPlan(state, history, kb, now): SpendPlan`. No I/O, no clock, no Toolbox imports. |
| `packages/knowledge` | Generated fact files and the authored Spend Priority Lists (TR-6). The schema extends #11's Priority List item with a `spend` block. |
| `apps/activeon` | Renders the plan (M10) and stores Skip today and Not for me state in localStorage. |

### TR-2 Account State additions (owned by M1, specified here)

```ts
// packages/account-state/src/types.ts (additions)
export interface Wallet {
  /** Character index (stable across saves), or 'bank' for coins kept in storage (MoneyBANK). */
  holder: number | 'bank';
  coins: number;
}

export interface VaultRow {
  index: number;            // 0-based row index, also the generated fact id `vault.row.<index>`
  level: number;
  maxLevel: number;         // Toolbox `maxLevel` (includes bundle and Glimbo)
  /** Game rule, not Toolbox's `unlocked`: row i is buyable when at least i+1 rows have unlockLevel <= total. */
  buyable: boolean;
  nextCost: number;         // Toolbox `cost`; meaningless when level >= maxLevel
  costToMax: number;        // Toolbox `costToMax`
  /** Cumulative coins for +k levels, at the checkpoints in TR-4. ladder[0] = { k: 1, coins: nextCost }. */
  ladder: { k: number; coins: number }[];
}

export interface VaultState {
  totalLevels: number;
  nextUnlock: { index: number; at: number } | null;
  rows: VaultRow[];
}

export interface StampState {
  id: string;               // Toolbox rawName, e.g. "StampA1"
  level: number;
  cap: number;              // Toolbox maxLevel
  capStep: number;          // reqItemMultiplicationLevel
  /** Coins for the next level below the cap (Toolbox goldCost); null at cap. */
  nextCoinCost: number | null;
  /** Coins from level to cap (Toolbox getGoldCostToMaxLevel); 0 at cap. */
  coinsToCap: number;
  raise: {
    material: string;       // item rawName
    materialType: 'Material' | 'Equip' | (string & {});
    cost: number;           // Toolbox materialCost (after reducers)
    ownedInStorage: number; // Toolbox ownedMats
    ownedAnywhere: number;  // storage + inventories, for Equip materials (ActiveOn count, plain arithmetic)
    carryOk: boolean;       // Toolbox enoughPlayerStorage
    carriers: { characterIndex: number; capacity: number }[]; // Toolbox bestCharacter.topCharacters
    minReduction: number | null; // Toolbox getMinReduction (withMinReduction = true)
    coinsAfterRaise: number; // Toolbox futureCosts[0].goldCost
  } | null;                 // null when below cap
}

export interface BribeState { index: number; bought: boolean; price: number }
export interface StatueGoldState { index: number; grade: number }   // 0 none, 1 Gold, 2 Onyx, 3 Zenith
export interface P2wUpgrade {
  key: string;              // e.g. "cauldron.power.speed", "liquid.water.regen", "vials.attempts"
  level: number;            // -1 = locked liquid
  maxLevel: number;         // Toolbox CAULDRONS_MAX_LEVELS
  nextCost: number;
  costToMax: number;
}

export interface SpendInputs {
  wallets: Wallet[];
  vault: VaultState;
  stamps: StampState[];     // owned stamps only (level > 0)
  bribes: BribeState[];
  statueGold: StatueGoldState[];
  p2w: P2wUpgrade[];
  hydrogen: { level: number; discountPct: number }; // atoms.atoms[0].level, atoms.stampReducer
  colosseumTickets: number; // currencies.ColosseumTickets.totalAmount
  highestClassLevel: number;
}
```

- **Character names:** `characterIndex` is the only character key in M7 data. Names stay in the Account State's existing `name` field and never enter `SpendPlan`.

### TR-3 Engine output

```ts
// packages/engine/src/spend/types.ts
export type SpendSink = 'vault' | 'stamp' | 'bribe' | 'statue-gold' | 'p2w';
export type SpendStatus = 'buy' | 'move-coins' | 'save-for' | 'hold' | 'unpriced';

export interface SpendStep {           // one purchase inside a line (a group has several)
  sink: SpendSink;
  ref: string;                          // generated fact id, e.g. "vault.row.23", "stamp.StampA4", "bribe.20"
  fromLevel: number | null;
  toLevel: number | null;
  coins: number | null;                 // null when unpriced
  material?: { item: string; amount: number; doer: number }; // stamp cap raise
}

export interface SpendLine {
  id: string;                           // `${entryId}:${ref}:${fromLevel}->${toLevel}`, stable across saves
  entryId: string;                      // Spend Priority List item id
  position: number;                     // list position (ties share a number)
  status: SpendStatus;
  steps: SpendStep[];
  coins: number | null;                 // sum of steps, null if any step is unpriced
  payer: number | null;                 // character index; null for unpriced or save-for with no candidate
  transfer?: { fromBank: number };      // move-coins only (D1)
  shortfall?: { coins: number; closest: number }; // save-for only
  hold?: { discountPct: number; neededPct: number; days: number }; // Hydrogen hold (D4)
  text: string;                         // rendered from the entry's template, no names
  why: string;
  sources: { label: string; url: string; tier: 1 | 2 | 3 | 4; verifiedOn: string; gameVersion: string }[];
  confidence: 'H' | 'M' | 'L';
  contested: boolean;
  stale: boolean;
  provenance: { fields: string[]; entries: string[] };
}

export interface SpendPlan {
  stage: string;                        // from M2
  wallets: { holder: number | 'bank'; coins: number; planned: number }[];
  lines: SpendLine[];                   // full ordered list
  visibleCount: number;                 // <= 5 (FR-15)
  perCharacter: { characterIndex: number; lines: number; coins: number }[]; // FR-16
  unlockFuel: { levels: number; coinsAbout: number; unlocks: string } | null; // FR-13
  notCovered: string[];                 // FR-20, e.g. ["forge.upgrades"]
  empty: null | { reason: 'nothing-affordable' | 'nothing-unlocked' | 'nothing-left'; cheapest?: SpendLine };
}
```

### TR-4 Cost arithmetic (ADR 0005)

- **Toolbox numbers only.** Every coin figure is a Toolbox value or a sum or difference of Toolbox values. We write no cost formula.
- **Vault cost ladders.** Toolbox exposes only `cost` (the next level) and `costToMax`. Multi-level targets use the clone trick from [#16](https://github.com/YassSoliman/idleon-forge/issues/16): in the parse worker, re-run Toolbox's exported `parseUpgradeVault(levels', account, characters)` with cloned levels, then read `costToMax`. The cumulative cost of +k levels is `costToMax(L) − costToMax(L + k)`.
  - **Pass A:** every row except 13 moved by +k, with row 13 (Major Discount) held at its level, because Major Discount changes the price of rows 0–32.
  - **Pass B:** row 13 alone moved by +k.
  - **Checkpoints:** k ∈ {1, 2, 3, 5, 10, 15, 20, 25}, capped at `maxLevel − level`. That is at most 16 re-parses.
- **Ladder contract test** (identity check, as in #16): on both fixtures and the public saves, `ladder[k=1] === cost` and `costToMax(L) − costToMax(maxLevel) === costToMax(L)`. A re-sync that breaks this fails CI.
- **No re-pricing inside one plan.** A Major Discount buy makes the later rows 0–32 cheaper, but the plan keeps the pre-purchase prices. That overstates costs, which is the safe direction. The next save reprices.
- **Partial fill.** A "to level N" item that a wallet cannot fully cover is bought to the largest ladder checkpoint the wallet covers. The rest stays a later line.
- **Stamps:**
  - Coin levels: `nextCoinCost`, `coinsToCap` (Toolbox `getGoldCostToMaxLevel`, exported).
  - After a cap raise: `futureCosts[0].goldCost`. This Toolbox helper counts the first level twice (`getGoldCostToLevel`), so it overstates, again the safe direction. Recorded as a known quirk.
- **Bribes:** Toolbox `price`. A bribe is available when it is not bought and its set is open: set 1 needs Mr Pigibank, and sets 2–4 need the previous set's "The Art of the …" bribe (indices 5, 12, 19) bought. Toolbox does not expose locked vs available, so this generated-fact rule stands in for it.
- **Pay 2 Win:** Toolbox `cost` and `costToMax`. Upgrades at level −1 (locked liquids) and at `maxLevel` are dropped.
- **Statue Gold, P2W Player upgrades, Anvil coin points:** see D3. Toolbox's parsed output prices none of them (`p2w.player` has no cost; `anvilStats` has no `anvilCost` in the parsed save; statue Gold has no Toolbox function).
- **Display:** all sums are plain floating-point; the display is rounded by M10.

### TR-5 Detectors (typed TypeScript, [#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 2)

Every Detector receives `(state, history, now)` and returns typed facts. None returns words; words live in the entries.

| Detector id | Inputs (Account State fields) | Output |
|---|---|---|
| `spend.wallets` | `characters[].money`, `currencies.bankMoney` | `Wallet[]`, sorted by index, bank last |
| `spend.vault.candidates` | `vault.rows`, `vault.totalLevels` | buyable, not-maxed rows with ladder |
| `spend.vault.unlockFuel` | `vault.nextUnlock`, `vault.totalLevels`, ladders | levels remaining, cheapest-first coin estimate (greedy on ladder marginals) |
| `spend.stamp.coinLevels` | `stamps[]` with `level < cap` | stamps with coin levels to buy |
| `spend.stamp.raiseReady` | `stamps[].raise` | ready raises, doer index, Equip check result (FR-10) |
| `spend.stamp.hydrogen` | `hydrogen`, `stamps[].raise.minReduction` | `{ batching: boolean, hold: { neededPct, days } \| null }` (D4) |
| `spend.bribe.available` | `bribes[]`, generated set membership, `highestClassLevel` | available, unbought bribes in sets 1–4, with their set |
| `spend.statueGold.next` | `statueGold[]`, Guilding Tools owned (any grade ≥ 1, or the item in storage) | next statue index without Gold |
| `spend.p2w.candidates` | `p2w[]` | unlocked, not-maxed upgrades |
| `spend.guard.duplicateEntries` | `vault.rows[52]`, `colosseumTickets` | fires when unlocked, Lv 0 and tickets > 0 |
| `spend.gate.combatRow` | M2 pusher id; Toolbox hit chance on the pusher's next map (M2/M5) | `{ bullseye: boolean, defence: boolean }` |

Each Detector has a fires / doesn't-fire test on both private fixtures and on at least one public save ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 12). The private-fixture tests run locally only ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 7). CI runs on the public saves and the scrubbed W2 save.

### TR-6 Knowledge Base entries ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) shape)

**Generated (ADR 0007),** rebuilt at every parser re-sync from Toolbox data. Never hand-edited.

| File | Entry ids | Fields (beyond #11's required set) | Generated from |
|---|---|---|---|
| `systems/upgrade-vault.generated.yaml` | `vault.row.<0..89>` | `name`, `unlockLevel`, `maxLevel`, `oneOff` (maxLevel == 1), `majorDiscountApplies` (index < 33), `masteryTier` | Toolbox `shared-data.json` `upgradeVault` |
| `systems/bribes.generated.yaml` | `bribe.<0..40>` | `name`, `set`, `price`, `codeValue` (e.g. 8 for Insider Trading, not the 5 in its text), `opensSet` | Toolbox `shared-data.json` `bribes` |
| `systems/stamps.generated.yaml` | `stamp.<rawName>` | `capStep`, `material`, `tab`, `obtainable` (the wiki's 7-stamp unobtainable list overrides Toolbox's typo'd list) | Toolbox `stamps.json` |
| `systems/statues.generated.yaml` | `statue.<0..31>` | `name`, `goldOrder` (index order) | Toolbox `statues` |
| `systems/alchemy-p2w.generated.yaml` | `p2w.<group>.<upgrade>` | `maxLevel`, `unlockAlchemyLevel` (20/35/80 for the liquids) | Toolbox `CAULDRONS_MAX_LEVELS`, alchemy data |

**Authored (judgment):** one Spend Priority List per Stage, in `packages/knowledge/priority-lists/spend.yaml`. M11 owns the final path.

Each item is a #11 Priority List item plus a `spend` block:

```yaml
- id: spend.w2-late.vault.sleepy-time
  type: priority-list-item
  list: spend.w2-late
  position: 5
  spend:
    sink: vault
    ref: vault.row.23            # generated id
    target: { kind: max }        # once | to-level | to-max | levels | next | cheapest-until-unlock
    reserve: false               # D2
    gate: null                   # e.g. spend.gate.combatRow.bullseye
    shareCap: null               # D6, e.g. 0.33 of the account's coins
  text: "Max Sleepy Time ({from}→{to}) on {payer}: {coins}"
  why: "+1% AFK gains per level, for fighting and skilling; cheap to max"
  sources:
    - { url: "https://github.com/YassSoliman/idleon-forge/blob/research/account-wide/docs/research/systems/account-wide/upgrade-vault.md", tier: 4, verified: 2026-10-17, gameVersion: "2.3.540" }
  appliesTo: { stage: [W2-early, W2-mid, W2-late] }
  confidence: L                  # PV 7.6: Vault order unverified
  status: active
```

**The shared Spend frame** (every Stage; an item fires only once its sink is unlocked). It mirrors the Leverage model's shared frame, applied to coins:

| Pos | Item | Status of the order |
|---|---|---|
| 1 | **Irreversible-order guards:** Duplicate Entries before redeeming tickets (FR-12, `reserve`) | mechanics H (Vault dossier); advice is community (W1 guide dossier) |
| 2 | **One-off unlocks:** Vault rows with max Lv 1 (7, 8, 9, 36, 44); the bribes of every open set labelled for the current world or earlier (AutoReview set labels W1–W4), with Insider Trading first and Changing the Code flagged `reserve` | bribes confirmed (PV 3.2); Vault one-offs unverified (PV 7.6) |
| 3 | **Stamps:** raise every ready cap, then buy the new levels; carry stamps first (Lil' Mining Baggy, Matty Bag, Mason Jar) | unverified (PV 3.6); batching H (game code) |
| 4 | **Engine rows, to the Stage's checkpoint:** Major Discount, Vault Mastery, the coin rows (Monster Tax, Bubble Money, Recipe for Profit, Dirty Money, Bored to Death); gated combat rows (FR-21) | unverified (PV 7.6); combat gate confirmed (PV cross-cutting 3) |
| 5 | **Cheap capped rows to max:** Sleepy Time, Drops for Days, Boss Decimation, Baby on Board, Weapon Craft, Knockout! | unverified (PV 7.6) |
| 6 | **Statue Gold,** in index order (W2+, Guilding Tools) | confirmed (PV 3.7) |
| 7 | **The Stage's band table:** the remaining Vault rows from the dossier's stage tables; Pay 2 Win basics (cauldron Speed and New Bubble, Water Regen and Capacity, vial Attempts); bribes of later-labelled sets | unverified (PV 7.6, 4.4) |
| 8 | **Unlock fuel** (FR-13) | rule 1 of the Vault dossier (M) |

The per-Stage lists fill this frame with targets from the Vault dossier's stage tables: early W1 → `W1-*`, mid W1 to early W2 → `W1-late`/`W2-early`, late W2 → `W2-mid`/`W2-late`, W3 → `W3-*`. Earlier bands' unfinished items carry forward. **Never-buy rule:** Happy Doggy (row 19) is never an authored item. It can only be bought as unlock fuel (no gameplay read in N.js v1.23).

**Authored Checks:**

| Check | Detector | Purpose |
|---|---|---|
| `spend.guard.duplicate-entries` | `spend.guard.duplicateEntries` | FR-12 line plus the why |
| `spend.hydrogen.hold` | `spend.stamp.hydrogen` | FR-11 hold notice (D4) |
| `spend.stamp.not-ready` | `spend.stamp.raiseReady` (negative) | hands "farm the material" or "raise carry capacity" Goals to M6/M4 |

Coins sitting idle is **not** an M7 Check. M6 owns `unspent.coins-idle`, whose Next Action is "Open the Spend Plan: N buys on <class Lv>" (section 7).

### TR-7 Storage

- **No new persistent store.** The plan is recomputed from each save.
- **localStorage keys** (per account, [#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 5):
  - `spend.skipToday`: line ids plus the daily-reset timestamp they expire at.
  - `spend.notForMe`: entry ids plus the patch they expire at.
- Both are cleared by "clear my data".

### TR-8 Performance budgets

These are measured on both private fixtures and the largest public save, on a 2020-class laptop, in CI where possible.

- **Vault ladders (TR-4):** ≤ 16 re-parses and ≤ 150 ms added to the worker parse, p95. If the budget is exceeded, the checkpoints drop to {1, 5, 10, max} and a warning is logged.
- **`buildSpendPlan`:** ≤ 20 ms p95 in the engine; ≤ 60 candidate items; ≤ 40 lines out.
- **Account State growth:** the `SpendInputs` projection adds ≤ 50 KB to the serialized Account State that is posted from the worker.

### TR-9 Security and privacy

- Everything runs on the device ([ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md)). M7 adds no network call.
- `SpendPlan` holds character indices, never names. Report this follows FR-19.
- Balances never leave the device. They are not sent to Suggestions either ([ADR 0008](../adr/0008-worker-for-suggestions.md) sends only text plus Stage, versions, screen, class and level).
- No committed test contains a private save or a balance from one. Synthetic fixtures are committed as field patches applied to the scrubbed W2 save in CI, or to the private saves locally.

### TR-10 Determinism and provenance

- **Same inputs, same plan.** `buildSpendPlan` is deterministic for the same `(state, history, kb, now)`. It uses no randomness and no `Date.now()`.
- **Provenance.** Every line lists the Account State fields read, for example `vault.rows[23].level`, `vault.rows[23].costToMax` and `wallets[0].coins`, and the entry ids used, for a later "Ask why" ([#17](https://github.com/YassSoliman/idleon-forge/issues/17)).
- **Golden snapshots.** One `SpendPlan` snapshot per fixture is part of the golden Now-screen snapshot ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 12).

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **Loading** (first save not yet parsed) | No Spend Plan block. M10 shows its loading state. |
| **Broken parse / empty account** | No plan (FR-1, AC-9.3). |
| **Adapter shape error** (Toolbox renamed a field) | The `SpendInputs` contract test fails in CI. At run time an `AccountShapeError` stops the parse, so there is no advice ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 13). |
| **Stale patch** (save game version newer than the parser pin) | The plan is still shown, with the M10 "game updated, parser not caught up yet" banner ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 6). Every line gets a "price may be off" note. A cost the patch changed is one Toolbox fixes, never us. |
| **Stale entries** (newest Source ≥ ~10 patches old) | Shown, ranked below fresh entries at the same position (FR-4). |
| **Offline** | The last good save's plan stays, under the "last cloud save Ns ago" line. Nothing in M7 needs the network. |
| **Save lag** (game saves every ~4 min; the player buys in between) | The plan reflects the last save. The header says "as of save Ns ago". Buying out of order is fine: the next save recomputes. A purchase already made shows until that save arrives (no manual done, [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8). |
| **Multiple tabs** | Each tab computes the same plan from the same save. Skip today and Not for me sync through the `storage` event. |
| **Second account** | One account per browser ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 16). Skip/Not for me keys include the account id, so a sign-out and sign-in to another account never leaks state. |
| **Shared-money toggle** (v1.07 Advanced Features, "money is shared between characters") | Its save flag and exact effect are unverified (Vault dossier, L). Until a Detector reads it, wallets follow `characters[].money`. If all characters but one read 0 while that one holds coins, that is consistent with either model and is shown as is. Tracked as a build-time verification task (Red-team 1). |
| **Rows 5/6 at totals 75–79** | Toolbox's `unlocked` disagrees with the game's count rule. `VaultRow.buyable` uses the game rule (Vault dossier, Toolbox gaps). |
| **Maxed rows with a Toolbox `cost`** | Dropped (FR-8). |
| **Locked P2W liquids** (`level == -1`) | Dropped (AC-8.2). |
| **Equip-type stamp materials** | Not ready unless counted (FR-10, AC-3.3). |
| **Very large numbers** (≥ 1e15) | Stored as JS numbers; ladders past 1e15 are allowed. Display uses M10's game-style notation. `NaN` or `Infinity` costs drop the line, with a warning in `state.warnings`. |
| **Coins below every line** | Empty state (FR-17). |
| **Stamps not unlocked** (highest class level < 14) | No stamp or bribe lines (AC-9.2). |
| **No Guilding Tools** (no statue at Gold and the item not owned) | No statue Gold line. A Goal goes to M4: "buy Guilding Tools (Yum-Yum Grotto shop)". |
| **Hydrogen unlocked but discount 0** (raised today) | Batching on, no hold. The plan says "discount resets on any raise: do all raises in this session". |
| **A line the player hid** | Its coins flow to later lines (FR-18). |
| **Player on a character with no coins** | The plan's first paying character goes to M10's "Next: switch to X" (Visit Order). The plan never says "spend here" for a 0-coin character. |

## 7. Dependencies

| Module | What M7 needs from it | Interface |
|---|---|---|
| **M1 Sync & Account State** | The `SpendInputs` projection (TR-2) and the worker-side Vault ladders (TR-4) | `AccountState.spend: SpendInputs`; contract tests in `packages/account-state/test` |
| **M2 Stage & Meta Path** | The Stage id that keys the Spend Priority List; the pusher, for the Bullseye gate | `stage(state): StageId`; `pusher(state): { characterIndex, nextMap }` |
| **M5 Higher-leverage options** (or M2, wherever the `getMaxDamage` clone lives) | The pusher's hit chance on the next map, for FR-21 | `hitChanceOnNextMap(state, characterIndex): number \| null`. Null means the gate does not fire, and the combat row stays at position 7. |
| **M4 Purpose & Milestones** | Takes M7's not-ready stamp raises and the Guilding Tools gap as Goals | M7 emits `SpendHandoff { kind: 'stamp-material' \| 'stamp-carry' \| 'guilding-tools', ref, shortfall }[]` |
| **M6 Unspent & idle** | Owns the "coins idle" Check and points it at the Spend Plan. M6 must not list coin purchases itself, which avoids double advice. | M6 reads `SpendPlan.perCharacter` and `SpendPlan.empty` |
| **M10 Now screen UI** | Renders the Spend Plan block (placement: D5), the 5-line cap, groups, status pills, Source links, Skip today, Not for me and Report this | `SpendPlan` (TR-3) |
| **M10 / M3 Visit Order** | "Most to spend" | `SpendPlan.perCharacter` |
| **M11 Knowledge tooling** | Schema for the `spend` block, the generated-fact pipeline for the 5 generated files, and CI source enforcement | JSON Schema in `packages/knowledge/schema` |
| **M12 Release** | "What's new" lines when the Spend lists change | changelog entries from Knowledge Base PRs |
| **M13 Suggestions** | Report this on a Spend line | FR-19 payload |

## 8. Open decisions for Yasser

❓ D1 - Coins on several characters: The game spends coins from the character being played, but coins can be moved through the bank (storage). Toolbox treats all coins as one account pool. Should the plan (a) treat coins as one pool, like Toolbox, and leave moving them to the player; (b) plan per character and add a "withdraw from storage, then buy" step only when one purchase needs more than any single character holds; or (c) plan per character and never suggest moving coins?
➡️ (b). It keeps a 15-minute session to the fewest character switches: on both fixtures, one or two characters hold most of the coins. It still unlocks the big one-off buys that no single character can afford, such as a 100M bribe on the W2-late account, whose richest character holds ~92M with ~105M in storage. (a) would tell players they can afford things they can't buy without extra steps they aren't shown.

❓ D2 - Saving up for a big purchase: When a high-ranked buy is unaffordable everywhere (e.g. Duplicate Entries at 100M, or Changing the Code at 1.5M early in W2), should the plan (a) never save up, and keep buying cheaper things below it; (b) always stop at the first unaffordable line ("save for X"); or (c) save up only for items flagged `reserve` in the Knowledge Base, by holding back the coins of the character closest to affording it?
➡️ (c). Only a handful of buys deserve it: Duplicate Entries before tickets, Changing the Code, and later the Crystal 3D Printer if gems ever join. (b) would freeze the whole plan behind one big item. (a) is what leaves players perpetually just short of the purchases the community says matter most.

❓ D3 - Sinks Toolbox doesn't price: Toolbox gives no cost for statue Gold, Alchemy Pay 2 Win Player upgrades or Forge upgrades. Anvil coin points are only priced in Toolbox's UI code. Should we (a) show them as "cost not checked, see the price in game" lines that are never deducted from a wallet; (b) leave them out of the Spend Plan entirely; or (c) amend ADR 0005 to allow a short list of one-line cost formulas copied from game code, each with a contract test?
➡️ (a) for statue Gold and Player upgrades: both are confirmed or cheap community priorities (PV 3.7; AutoReview's "Player upgrades after each Alchemy level up"), and the game shows the price on the button. Forge upgrades go under "Not covered yet". For Anvil coin points, call Toolbox's `getPlayerAnvil` from the worker if it can be imported; otherwise use (a). Keep (c) in reserve: it reopens the formula-upkeep cost ADR 0005 was written to avoid.

❓ D4 - When to raise stamp caps under the Hydrogen discount: Any cap raise resets the discount to 0%, and it rebuilds by the Hydrogen level each day you log in (up to 90%). Should the plan (a) always hold every raise until the discount hits 90%; (b) raise everything that fits now, all in one session, whenever any raise is ready; or (c) hold only while some stamp that is too big to carry now will fit within K days, otherwise raise everything now?
➡️ (c) with K = 7 days. (a) can mean waiting months at a low Hydrogen level (1%/day), and (b) wastes the discount's real job, which is making otherwise-impossible raises fit in a character's inventory. Toolbox already computes the discount each stamp needs (`minReduction`), so (c) is pure arithmetic. The hold notice shows the days left, so the player can override by just raising.

❓ D5 - Where the Spend Plan sits on the Now screen: #10 says an account-wide task that needs a specific character goes on that character's row, and every Spend line needs a specific character (the one holding the coins). Should the plan be (a) one block in the Account section, with each line naming its character; (b) split across the character rows; or (c) one Account block plus a one-line chip on each paying character's row ("Spend here: 4 buys, ~18M → Spend Plan")?
➡️ (c). The order across characters is the whole point of a Spend Plan, and splitting it (b) loses it. The chip still honours #10 item 6 and feeds Visit Order. This choice also binds M10.

❓ D6 - Stopping one upgrade from eating all the coins: Some Vault rows never run out of levels and get steep, such as Major Discount (×1.3 per level), Vault Mastery and Monster Tax. On the W2-late account, filling Major Discount toward the next checkpoint would take ~52M of the richest character's ~92M for about 4% cheaper rows. Should open-ended rows (a) be bought only to an authored checkpoint per Stage; (b) get a share cap, never taking more than a set fraction of the account's coins in one plan; or (c) both?
➡️ (c): authored checkpoints, plus a share cap of 1/3 of the account's coins per open-ended line. This is the Vault dossier's own "keep Major Discount about 1/3 of your spend". The checkpoint keeps the plan Stage-aware, and the cap stops a single steep row from crowding out a dozen cheap, permanent upgrades. Both are authored numbers, which ADR 0007 allows, and the cap can be tuned per entry.

## 9. Red-team notes

1. **It tells you to buy something you can't afford on the character you're playing.** Toolbox's `rawMoney` and `hasMoney` add up every character plus the bank. Its own comment assumes coins move freely between characters. A plan built on them would show "affordable" for buys that need several switches and transfers. *Defence:* per-character wallets (FR-2, FR-5), D1's explicit move-coins step, and AC-2.1 and AC-2.5. *Residual risk:* the shared-money toggle (v1.07) is unverified. A build task must find its save flag on a save with the toggle on before M7 ships. If it is on, wallets collapse into one.
2. **Toolbox numbers that look valid but aren't.** Five traps found on the fixtures:
   - maxed Vault rows still carry a `cost`;
   - locked Pay 2 Win liquids are level −1 with a 2.1K price;
   - `hasMaterials` is true for Equip-type stamp materials with 0 owned;
   - `unlocked` is wrong for rows 5/6 at totals 75–79;
   - `futureCosts.goldCost` counts one level twice.

   *Defence:* explicit filters (FR-8, FR-10, TR-4), the game-rule `buyable`, and the golden tests AC-1.3, AC-3.3 and AC-8.2. Each trap gets a Detector test so a Toolbox fix or regression shows up in the re-sync PR diff.
3. **Wrong advice from the order itself.** The Vault, stamp and Pay 2 Win orders are unverified (PV 7.6, 3.6, 4.4). Only bribes and statues are confirmed. "Engine rows first" can be bad at the steep end, as the Major Discount arithmetic in D6 shows. *Defence:*
   - confidence L shown on those lines;
   - cheapest-first tie-breaks;
   - D6's checkpoint and share cap;
   - Contested never on top;
   - Not for me and Report this on every line;
   - a review of the W2-late and W3-early golden snapshots by Yasser and Joseph as players, the #11 pipeline's human step, before merge.
4. **Wiping the Hydrogen discount.** One cheap cap raise resets days of discount for every stamp. *Defence:* FR-11 makes single raises impossible to emit while others are ready, D4's hold rule, and AC-4.1 to AC-4.3 on a synthetic fixture, since neither real fixture has Hydrogen yet. The rule is tested before either account reaches W3-late.
5. **An irreversible loss the plan didn't prevent.** Redeeming Colosseum tickets before Duplicate Entries loses half of them for good. *Defence:* FR-12 puts the guard at position 1, with `reserve` under D2, and AC-1.1 fires on the W3-early account today (12 tickets held, row unbought). *Residual risk:* other "buy X before Y" traps not yet known. New ones go into position 1 through Report this.
6. **Patch breakage.** A patch changes a cost, or Toolbox renames a field. *Defence:*
   - prices come only from Toolbox, so a fix is the weekly re-sync, not our code;
   - adapter contract tests and the ladder identity test fail loudly in the re-sync PR;
   - a version-mismatch save gets a "price may be off" note (section 6);
   - golden snapshots show the plan diff in every Knowledge Base PR.
7. **The plan lags reality.** The game cloud-saves about every 4 minutes, so a player buying from the list sees bought items linger, and may think the list is wrong. *Defence:* the "as of save Ns ago" header; M10's "switch character to refresh" hint after ~4 min ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 12); no manual done (it would drift from the save); conservative pricing (no re-pricing, overstated stamp totals), so a lagging plan never over-promises. A coin-income ETA from the save history is deliberately left out. Spending between saves would make it lie.
8. **Overload in a 15-minute session.** Five sinks with dozens of rows could produce a 40-line list. *Defence:* 5 visible lines (FR-15), grouping by sink and wallet (FR-9), the chip per character (D5), and unlock fuel collapsed to one line (FR-13).
9. **Privacy leak.** Balances and class levels could identify a player in a public issue. *Defence:* Report this sends class, level, Stage and a 2-significant-figure cost, never names or balances (FR-19). The plan stores no names (TR-2). No balance from a private fixture is committed (TR-9); this spec quotes only rounded aggregates.
10. **Double advice with M6.** "You have 91M idle" in M6 and "buy these" in M7 would say the same thing twice, or contradict each other if they count coins differently. *Defence:* section 7's boundary. M6 owns the idle-coins Check and links to the plan, and M7 owns every coin purchase. Both read `SpendPlan.perCharacter`, so they count coins the same way.

## Sources

- Leverage model (#26): https://github.com/YassSoliman/idleon-forge/blob/research/leverage-model/docs/research/2026-10-17-leverage-model.md (§1.3 Stages of both fixtures; §3 shared frame and per-Stage lists; §4.3 Visit Order, coin holders first)
- Priority verification (#27): https://github.com/YassSoliman/idleon-forge/blob/research/priority-verification/docs/research/2026-10-17-priority-verification.md (rows 3.2 bribes confirmed, 3.6 stamps unverified, 3.7 statues confirmed, 4.4 liquids/P2W unverified, 7.6 Vault order unverified, cross-cutting 3 accuracy gate)
- Upgrade Vault dossier: https://github.com/YassSoliman/idleon-forge/blob/research/account-wide/docs/research/systems/account-wide/upgrade-vault.md (cost formula, Major Discount scope, stage tables, Duplicate Entries, Happy Doggy, Toolbox gaps, count-rule quirk)
- Stamps dossier: https://github.com/YassSoliman/idleon-forge/blob/research/w1-systems/docs/research/systems/w1-systems/stamps.md (cap raises, carry wall, Hydrogen reset, Insider Trading 8%)
- Bribes dossier: https://github.com/YassSoliman/idleon-forge/blob/research/w1-systems/docs/research/systems/w1-systems/bribes.md (sets, prices, Changing the Code)
- Statues dossier: https://github.com/YassSoliman/idleon-forge/blob/research/w1-systems/docs/research/systems/w1-systems/statues.md (Gold order and cost source)
- W2 Systems dossier, Alchemy Pay 2 Win: https://github.com/YassSoliman/idleon-forge/blob/research/w2-systems/docs/research/systems/2026-10-17-w2-systems.md
- Anvil and Forge dossiers: https://github.com/YassSoliman/idleon-forge/tree/research/w1-systems/docs/research/systems/w1-systems
- Hypothetical math (#16): https://github.com/YassSoliman/idleon-forge/blob/research/hypothetical-math/docs/research/2026-10-17-hypothetical-math.md (the clone trick reused for Vault ladders)
- Toolbox vendored at `6c37e3d` (`feat/slice-1-live-sync`): `parsers/misc/upgradeVault.ts` (`parseUpgradeVault`, `getCostToMax`, `getUpgradeCost`), `parsers/world-1/stamps.ts` (`evaluateStamp`, `getFutureCosts`, `getGoldCostToMaxLevel`, `checkHasMaterials`), `parsers/index.ts` L320–326 (`bankMoney`, `rawMoney`), `utility/dashboard/account.js` L511–541 (P2W alert on `rawMoney`, and the "coins move freely through the bank" comment)
- Fixtures: `fixtures/private/*.parsed.json` (gitignored), read 2026-10-17. Aggregates only.

Verified 2026-10-17 against game v1.23 (Toolbox gameVer 2.3.540). Stale against any later patch.
