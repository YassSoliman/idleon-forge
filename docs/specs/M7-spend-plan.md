# M7 Spend Plan

Spec for [#35](https://github.com/YassSoliman/idleon-forge/issues/35), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for build**. Decisions ruled 2026-10-17 (section 8); red-team pass logged in section 10. Build order slot: after M4, before M8 ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).

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
  - Statue Gold, as `unpriced` lines (D3).
  - Alchemy Pay 2 Win: cauldron and liquid upgrades. Vial and Player upgrades are `unpriced` lines (D3).
  - Anvil coin points, per character (D3: priced through Toolbox's exported Anvil functions).
- **Arithmetic** on Toolbox-computed costs ([ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md)): sums, running balances per wallet, shortfalls, levels to the next Vault unlock, and days until the Hydrogen discount reaches a level.
- **Batching rules:** stamp cap raises under the Hydrogen discount; one-off buys that must come before an irreversible action (Duplicate Entries before redeeming tickets).
- **The Knowledge Base entries** the plan needs: generated facts and authored Spend Priority Lists per Stage, plus the Detectors that read them.
- **The engine output** (`SpendPlan`) that M10 renders, plus the per-character "to spend" totals that Visit Order needs.

**Out of scope:**

- **Other currencies:** gems, merits, star talent points, anvil points from levels, Post Office boxes, talent points and so on. "You have unspent X" belongs to M6 Unspent & idle. The Gem Shop first buy is also Contested (PV 7.5).
- **Material spends other than stamp cap raises** (vials, bubbles, Construction salts, Post Office). These are other modules' Goals.
- **Sinks Toolbox does not price, other than those D3 shows as `unpriced`:** Forge upgrades (Toolbox gives no cost), Town shop items and consumables (food, upgrade stones), Obol shop, Colosseum and Arcade shops (non-coin currencies).
- **Bribe sets 5–6** (Garbage Tuna and Jade Emporium, W5+). **Vault rows 62–89** (W5–W6).
- **W4+ coin sinks** (kitchens, Lab, Breeding). Gilded and Exalted Stamps (Rift 26, W6).
- **Coin income forecasting,** for example "you will afford X in 3 h". Toolbox has no coins-per-hour number, and we will not write one. A later version may use the observed coin delta between saves; see section 9, note 7.
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
- **FR-7 Pooling** (D1). If no wallet covers a line but the bank plus one wallet does, the line becomes `move-coins`: "withdraw N from storage on <class Lv>, then buy". N is the line's cost minus that wallet's remaining balance, and it is deducted from the bank's running balance. The wallet is chosen by FR-6 among those the bank can top up. Moving coins between two characters through the bank (deposit on one, withdraw on another) is suggested only for lines flagged `reserve` (FR-22). The plan never treats all coins as one pool.
- **FR-8 Done and filtering.** A candidate is dropped when its target is already met (`level >= target`, `level >= maxLevel`, or bribe `done`), or its sink or row is not yet unlocked. This applies even when Toolbox still reports a non-zero `cost` for it: on both fixtures, maxed Vault rows such as Weapon Craft 5/5 and Knockout! 5/5 still carry a `cost`. A line also disappears once a later save shows it bought. There is no manual "done" ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8).
- **FR-9 Grouping.** Lines of the same sink, at the same list position, paid from the same wallet, are shown as one expandable line ("Raise 7 stamp caps, then buy their new levels, about 10.1M"). The group's cost is the sum of its parts.
- **FR-10 Stamp cap raises.** For a stamp at its cap, the plan emits the material step before the coin step:
  - **Material prices come from the worker re-evaluation (TR-4), never from the parsed save.** The parse calls Toolbox's `updateStamps` with its default `gildedStamp = true`, which prices every raise at the Gilded Stamp rate (×0.05) even when the account holds none. On both fixtures (`OLA[154] = 0`) that makes every material cost 20× too low.
  - **Material step:** "raise the cap: carry N <material> on <class Lv>". It is ready only when all of these hold, on the re-evaluated values:
    - Toolbox `hasMaterials` is true;
    - Toolbox `enoughPlayerStorage` is true;
    - for materials of type `Equip`, the count held in storage plus inventories is ≥ the cost. Toolbox's `checkHasMaterials` checks the craft recipe's other ingredients for Equip materials but does not count the item itself.
  - **Doer:** the character who carries the material. That is the line's wallet if its carry capacity for the material (Toolbox `bestCharacter.topCharacters`, the top 3 only) is ≥ the material cost, else Toolbox's `bestCharacter`. A wallet outside the top 3 counts as unable to carry. Capacity is Toolbox's empty-inventory figure, so the material step says "free up inventory space first" when the doer is not the best carrier.
  - **Coin step:** the new levels, priced with Toolbox `futureCosts[0].goldCost`, but only when that entry is the very next tier (`level === stamp.level + capStep`) at the current discount (`reduction === stampReducer`). Toolbox otherwise returns a later tier, a projected discount, or a single-level fallback; such a raise is not ready.
  - **Not ready:** a stamp whose material is missing, or too big for any character to carry, is not a Spend line. It is reported to M6 and M4 as a Goal (farm the material, or raise carry capacity).
- **FR-11 Hydrogen batching.** When the Hydrogen atom is above Lv 0 (`atoms.atoms[0].level > 0`), whatever the current discount:
  - **Only the first raise gets the discount.** Toolbox computes it as `min(90, Hydrogen baseBonus × level × days since the last cap raise)` (`OLA[134]`), and any raise resets the day count. So within a batch, raise 1 is priced at the current discount and every later raise at 0%.
  - All ready cap raises collapse into one batch line, ordered so the raise that gains most from the discount (the highest material cost, or the one that fits only with it) goes first. The others are ready only if they fit at 0%. The engine never emits a single cap raise on its own while other raises are ready.
  - **Hold rule (D4).** The batch line has status `hold` while at least one at-cap stamp is *waiting to fit*: its material is owned (FR-10 counts) but too big for any character to carry today, its Toolbox `minReduction` is ≤ 90, and the days to reach it, `ceil((minReduction − current) / daily rate)` with daily rate = Hydrogen `baseBonus × level`, are ≤ K = 7. The notice shows the current discount, the highest such `minReduction` (the discount needed) and its days, by arithmetic.
  - Otherwise (no stamp is waiting to fit, or every waiting stamp is more than 7 days away) the batch line is `buy`: raise every ready cap now, in one session.
  - While raises are on hold, no other raise is emitted either (it would reset the discount). Stamp coin levels below the cap stay buyable: they do not reset it.
  - **Gilded Stamps** (`OLA[154] > 0`, W4 Rift 26): the next raise uses one, so it goes first and goes to the stamp with the highest material cost (stamps dossier). The other raises are priced without it.
- **FR-12 Irreversible-order guard.** While Vault row 52 (Duplicate Entries) is buyable and at Lv 0, Duplicate Entries is position 1, whatever the ticket count. Its line reads "buy Duplicate Entries before you collect or redeem more Colosseum tickets". It is flagged `reserve` (D2).
  - **Ticket counts:** `currencies.ColosseumTickets.totalAmount` is the raw `CYColosseumTickets` balance, not tickets waiting to be received. The tickets banked at the three NPCs are `allTickets[].totalAmount`. The why quotes the NPC-banked count only, and never says "unredeemed".
  - **Build-time verification (ship gate):** find in N.js where the doubling applies (on NPC collection, or on redeeming ticket items). The answer sets the guard's wording and how M6's "Collect N Colosseum tickets" Goal interacts with it (section 7; open product question, section 10 row 6).
- **FR-13 Unlock fuel.** After the authored lines, one final line says how many Vault levels remain to the next unlock (`nextUnlock.unlockLevel − totalUpgradeLevels`). It also gives the cheapest-first coin estimate for them from the cost ladders (TR-4), labelled "about".
- **FR-14 Unpriced sinks** (D3). Statue Gold, Pay 2 Win Player upgrades and vial upgrades (Toolbox's `p2w.vials` holds levels only), and Anvil coin points if the worker import of TR-4 fails, show as `unpriced`: "cost not checked, see the price in game". It is never deducted from a wallet and never counted as affordable. At the same list position it ranks below priced lines. Because an unpriced buy does spend real coins, the expanded plan shows "totals below assume you skip the unchecked items" under the first unpriced line.
- **FR-15 Visible length.**
  - At most 5 lines are visible, then "show more", matching the Account cap in [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 5. Grouped lines count as one.
  - Lines with status `save-for` or `unpriced` do not take a visible slot ahead of a `buy` line at the same position.
- **FR-16 Per-character totals.** The plan exports, per character, the number of `buy` and `move-coins` lines and their summed cost. Visit Order's "most to spend" adds this line count to M6's `spendCount` (M6 FR-30), so both modules feed one number ("then most to spend", glossary; Leverage model §4.3 item 2: coin holders first in the spend phase).
- **FR-17 Empty states.**
  - **No priced line affordable:** "Nothing worth buying yet", with the cheapest next line, its shortfall, and the character closest to affording it.
  - **No sink unlocked yet** (highest class level < 14 and the Vault untouched): only the Vault, which is open from the start.
  - **Nothing left to buy:** "Spend Plan empty".
- **FR-18 Skip and Not for me.** Each line supports the two manual controls from [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8, with M10's expiry rules, keyed by `entryId + ref` (a grouped line by its `entryId` alone), so a partial buy that changes `fromLevel` does not bring a hidden line back:
  - **Skip today** hides it until the next local midnight or the end of the Play Session in which it was skipped, whichever is later (M10 FR-28).
  - **Not for me** hides it until the save's game build changes (M10 FR-29).

  Hiding a line frees its coins for the lines below it. Both controls stay in the browser.
- **FR-19 Report this.** Each line's Report this ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 9; [#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 15) sends:
  - the entry id and line id;
  - the Knowledge Base version and game version;
  - the Stage;
  - the paying character's class and level;
  - the line's cost, rounded to 2 significant figures.

  It never sends names, wallet balances or save data. M13 attaches the line's rendered text, so M7 provides a **report rendering** of each line: the full text with every coin amount rounded to 2 significant figures, and with the shortfall, the "withdraw N from storage" amount and any running balance removed. Cost minus shortfall would otherwise give the wallet's exact balance.
- **FR-20 Not covered.** Out-of-scope sinks that hold value on this account (for example, Forge upgrades) show in the "Not covered yet" list ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 14). They never become a line.
- **FR-21 Combat-row gate.** Vault combat rows (Bullseye 4, Steel Guard 5, All Armoured Up 46) enter the engine-row position only when their gate Check fires. For Bullseye, the gate is the pusher's Toolbox hit chance below 100% on the next map (M2 pusher; Leverage model W1-late 10; PV cross-cutting 3). Otherwise they sit in the band-table position. M5 builds last, so until it ships `hitChanceOnNextMap` returns null, the gate never fires, and these rows always sit in the band table.
- **FR-22 Reserve** (D2). When a line flagged `reserve` is not affordable by any wallet, nor by one wallet plus the bank (FR-7), it becomes `save-for`:
  - its *closest* character is the wallet with the smallest shortfall (ties to the lower index);
  - that wallet's remaining balance, up to the line's cost (never more), is held back from every line ranked below it, whatever its position;
  - when two `reserve` lines are both short, the higher-ranked one picks its wallet first, and the second picks among what is left;
  - the line shows the shortfall against that character.

  Only `reserve` lines save up. Any other unaffordable line is `save-for` without holding anything back, and the lines below it still spend.
- **FR-23 Character chip** (D5). The plan is one block in the Account section. In addition, every character with at least one `buy` or `move-coins` line gets a chip on its Now-screen row: "Spend here: N buys, ~X → Spend Plan", from `perCharacter` (FR-16). A character with no such line gets no chip.
- **FR-24 Open-ended rows** (D6). An open-ended item is one whose authored `spend` block has `openEnded: true` (Major Discount, Vault Mastery, Monster Tax and the like: rows whose max is far beyond any Stage's need, such as Major Discount's 80). It is bought:
  - only up to the Stage's authored checkpoint (`target: { kind: to-level }`);
  - and for no more than its `shareCap` (default 1/3) of the paying wallet's coins at the start of the plan, bank top-ups excluded. The cap is per wallet because the plan is per wallet (D1): on the W2-late account it holds a Major Discount line to ~31M of the Barbarian Lv 60's ~92M, the case D6 was ruled on.

  Within both limits it takes the largest ladder checkpoint its wallet covers (TR-4, partial fill). The rest of the way to the checkpoint stays a later line.
- **FR-25 Partial data.** Each sink's Detectors read only fields that are known (M1 `isKnown`, `diagnostics.failedSections`). When a sink's section failed, or the save lacks it (some public saves have no `UpgVault`), that sink contributes no lines and the plan shows "can't price <sink> right now". The rest of the plan still renders. A failed section never reads as level 0, which would suggest buying things already owned.

## 4. User stories

Every acceptance criterion doubles as a golden test ([#13](https://github.com/YassSoliman/idleon-forge/issues/13) item 4). "W2-late account" and "W3-early account" are the two private fixtures: the Stage comes from M2, and the Leverage model §1.3 confirms both. **Synthetic** fixtures are those private fixtures with named fields edited in the test. Their edits are listed in each criterion, and they are committed only as field patches, never as saves.

Coin figures are Toolbox numbers from the fixtures, rounded or bucketed. Golden tests assert on exact values locally; the spec never prints them.

| | W2-late account | W3-early account |
|---|---|---|
| Wallets (bucketed) | Barbarian Lv 60: ~90M; Wizard Lv 56, Shaman Lv 44, Squire Lv 43: under 1M each; Bowman Lv 54: under 1K. Bank: ~100M | Squire Lv 85, Wizard Lv 73: over 2B each; Shaman Lv 54: ~0.9B; Bowman Lv 60: ~0.7B; Barbarian Lv 56 and Squire Lv 51: under 10K. Bank: 0 |
| Vault | total levels 1,724; next unlock at 1,780 | total levels 2,497; next unlock at 2,530 |
| Stamps | 7 levelled, all at cap | 17 levelled, all at cap |
| Bribes | 20 bought (sets 1–3 complete) | 22 bought |
| Statue Gold | 5 statues | 13 statues |
| Hydrogen | 0 (no Atom Collider) | 0 (no Atom Collider) |
| Colosseum tickets | 6 | 12 |

### US-1 See what to buy, in order

As a player in a Play Session, I want one ordered list of what to buy with my coins, so that I stop guessing between the Vault, stamps, bribes and statues.

- **AC-1.1** Given the W3-early account / When the engine runs / Then the first line is "Buy Duplicate Entries (Vault) before you redeem tickets", costing ~100M, with status `buy`. This holds because row 52 is buyable at Lv 0 (FR-12).
- **AC-1.2** Given the W2-late account / When the engine runs / Then Duplicate Entries does not appear, because the row is locked (1,724 < 2,470 total levels).
- **AC-1.3** Given either fixture / When the engine runs / Then no line targets a Vault row already at its max level, even where Toolbox reports a non-zero `cost` for it (FR-8).
  - On the W2-late account that excludes Weapon Craft 5/5, Knockout! 5/5, Boss Decimation 25/25, Dirty Money 25/25, Baby on Board 50/50, Stick Snapping 50/50 and the three 777-coin skill rows.
  - On the W3-early account it also excludes Sleepy Time 20/20, Drops for Days 50/50, Bubble Money 10/10, Drip Drip Drip 20/20 and Card Retirement 1/1, among others.
  - The test asserts the rule generically (no line with `level >= maxLevel`); the named rows are examples only.
- **AC-1.4** Given the W2-late account / When the engine runs / Then the lines include, among the capped-rows and engine items:
  - Sleepy Time 18→20 (Toolbox `costToMax` ~3.0M);
  - Drops for Days 29→50 (~3.9M);
  - Bubble Money 7→10 (~8.3M).

  Each is paid by the Barbarian Lv 60.
- **AC-1.5** Given either fixture / When the engine runs / Then the last line is unlock fuel: "56 more Vault levels to unlock Active Murdering" on the W2-late account, and "33 more Vault levels to unlock Special Talent" on the W3-early account, each with an "about N coins" estimate (FR-13).
- **AC-1.6** Given either fixture / When the engine runs / Then at most 5 lines are visible and the rest sit behind "show more" (FR-15). The golden snapshot records the full ordered list.
- **AC-1.7** Given either fixture with the `upgradeVault` section listed in `diagnostics.failedSections` / When the engine runs / Then the plan has no Vault line and no unlock fuel, shows "can't price Upgrade Vault right now", and still lists the other sinks (FR-25).

### US-2 Know which character to buy on

As a player in a Play Session, I want each purchase tied to the character who holds the coins, so that I switch to the right character once and buy everything there.

- **AC-2.1** Given the W2-late account / When the engine runs / Then every `buy` line above 1M is paid by the Barbarian Lv 60, the only character holding more than 1M. The Bowman Lv 54 (under 1K) pays for no line.
- **AC-2.2** Given the W3-early account / When the engine runs / Then the Barbarian Lv 56 and the Squire Lv 51 (under 10K each) pay for no line. The planned total per wallet never exceeds that wallet's coins (FR-5).
- **AC-2.3** Given the W3-early account / When the engine runs / Then Duplicate Entries (~100M) is paid by the Bowman Lv 60 (~0.66B). It is the first line, so no wallet is in use yet, and the Bowman is the smallest wallet that covers it (FR-6).
- **AC-2.4** Given either fixture / When the engine runs / Then the per-character totals (FR-16) list the paying characters in descending total. The W2-late account's list starts with the Barbarian Lv 60.
- **AC-2.5** Given the W2-late account / When the engine runs / Then the bank (~105M) is shown as "Coins in storage" and is never counted as affordable for a `buy` line. It can still fund a `move-coins` line: a line that no single wallet covers but the Barbarian Lv 60 plus the bank does reads "withdraw N from storage on Barbarian Lv 60, then buy" (FR-7).

### US-3 Raise stamp caps, then buy the levels

As a player in a Play Session, I want to know which stamp caps I can raise now and what the new levels cost, so that my stamps keep levelling instead of sitting at their caps.

- **AC-3.1** Given the W2-late account / When the engine runs / Then the stamp lines contain no coin-only level buy, because all 7 levelled stamps are at their cap.
- **AC-3.2** Given the W2-late account / When the engine runs / Then one grouped line reads "Raise 2 stamp caps, then buy their new levels" (Shield Stamp and Hatchet Stamp), about 1.3M in coins. Target Stamp is not ready: its raise needs ~9.1K Thread at the non-gilded rate, more than the Thread in storage and more than the best carrier holds, so it goes to M4/M6 as a Goal. A golden test fails if any material amount equals the gilded value (457 Thread for Target Stamp) while `OLA[154] = 0`.
- **AC-3.3** Given the W3-early account / When the engine runs / Then the stamp lines are split this way:
  - **Ready (9 of 17 at-cap stamps):** the materials are in storage and fit one character's carry capacity, at the non-gilded rate.
  - **Twin Ores Stamp and Cool Diggy Tool Stamp:** these need an equipment item (Thief Hood, Iron Hatchet). Toolbox reports `hasMaterials` true for them with 0 counted. They are not marked ready unless storage plus inventories hold the item (FR-10).
  - **The other at-cap stamps** (Vendor Stamp among them) are not Spend lines: material missing or too big to carry.
  - **Vendor Stamp:** it lacks ~100 Cue Tape, so it is not a Spend line. It is handed to M6 and M4 as a Goal.
- **AC-3.4** Given the W3-early account / When the engine runs / Then the doers of the material steps are the Wizard Lv 73 or the Squire Lv 85 (Toolbox's highest-capacity characters for those materials), unless the line's wallet can carry the amount itself (FR-10).

### US-4 Don't waste the Hydrogen discount

As a player in a Play Session in late W3, I want cap raises batched around the Hydrogen discount, so that one cheap raise doesn't wipe a discount that took days to build.

- **AC-4.1** Given a synthetic W3-early account with the Hydrogen atom at Lv 5 and 8 days since the last cap raise (raw `OLA[134] = 8`, re-parsed, so `stampReducer = 40` and every Toolbox stamp value agrees with it) / When the engine runs / Then all ready cap raises are one batch line. Its first raise is priced at 40% off and the others at 0%, and the engine never emits a single cap raise as its own line (FR-11).
- **AC-4.2** Given the same synthetic account, plus one at-cap stamp whose material is owned but too big for any character to carry, and whose Toolbox `minReduction` is 55 / When the engine runs / Then the batch line has status `hold` and reads "Hold stamp cap raises: discount 40%, 55% needed for <stamp>, about 3 days". The 3 days is `ceil((55 − 40) / 5)`. Stamp coin levels below the cap stay buyable.
- **AC-4.3** Given the same synthetic account with `OLA[134] = 18` (discount at its 90% cap) / When the engine runs / Then the batch line is `buy`, with no hold, because the discount is at its 90% cap.
- **AC-4.4** Given either real fixture (Hydrogen Lv 0) / When the engine runs / Then no hold notice appears.
- **AC-4.5** Given the AC-4.2 account with a costlier waiting stamp whose `minReduction` is 80 / When the engine runs / Then the batch line is `buy`, because `ceil((80 − 40) / 5) = 8` days exceeds K = 7 (D4).

### US-5 Don't make an irreversible spending mistake

As a player in a Play Session, I want a warning before I lose value permanently, so that one wrong click doesn't cost me days.

- **AC-5.1** Given the W3-early account / When the engine runs / Then the Duplicate Entries line carries the why "doubles every Colosseum ticket you receive; 4 are waiting at the NPCs" (the NPC-banked count, not `ColosseumTickets.totalAmount`). It cites the Vault dossier (game data: row 52) and the community advice to buy it before redeeming tickets.
- **AC-5.2** Given a synthetic W3-early account with every wallet below 100M and the bank at 0 / When the engine runs / Then Duplicate Entries is a `save-for` line showing its shortfall against the character closest to it, and no line below it spends that character's coins (FR-22).

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

- **AC-8.1** Given the W2-late account / When the engine runs / Then a statue Gold line for the 6th statue (Kachow) appears with status `unpriced`, "cost not checked". It is never deducted from a wallet and ranks below the priced lines at its position.
- **AC-8.2** Given either fixture / When the engine runs / Then the Alchemy Pay 2 Win lines exclude the liquids Toolbox reports at level −1 (locked). On the W2-late account that means N2, Trench and Toxic Mercury, which Toolbox prices at ~2.1K each.
- **AC-8.3** Given either fixture / When the engine runs / Then Forge upgrades appear only in "Not covered yet".
- **AC-8.4** Given either fixture / When the engine runs / Then every Anvil coin point line is paid by the character whose Anvil it is, never by another wallet or the bank, and vial upgrades appear only as `unpriced` (TR-4).

### US-9 Empty and edge states

As a player in a Play Session, I want an honest message when there is nothing worth buying, so that I don't hunt for a list that isn't there.

- **AC-9.1** Given a synthetic W2-late account with every wallet at 0 and the bank at 0 / When the engine runs / Then the plan shows "Nothing worth buying yet". It names the cheapest next line and its shortfall, and no line has status `buy`.
- **AC-9.2** Given a synthetic save (the scrubbed W2 save with every character's level patched below 14, stamps and bribes cleared, and the Vault untouched, re-parsed) / When the engine runs / Then the plan has only Vault lines (stamps and bribes are locked until Mr Pigibank).
- **AC-9.3** Given a parse that fails or returns an empty account / When the engine runs / Then no Spend Plan is produced and the Now screen shows "Can't read your save right now" ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 13).

### US-10 See where to spend from my character row

As a player in a Play Session, I want my character's row to tell me it has buys waiting, so that I know to switch to it without reading the whole plan.

- **AC-10.1** Given the W2-late account / When the engine runs / Then the Barbarian Lv 60's row carries the chip "Spend here: N buys, ~X → Spend Plan", with N and X equal to its `perCharacter` entry, and the Bowman Lv 54 (under 1K) has no chip (FR-23).

### US-11 One steep row doesn't eat my coins

As a player in a Play Session, I want an endless upgrade capped, so that cheap permanent upgrades still get bought.

- **AC-11.1** Given the W2-late account / When the engine runs / Then the Major Discount line costs no more than 1/3 of its paying wallet's coins (about 31M of the Barbarian Lv 60's ~92M) and no more than its Stage checkpoint, and the capped-row lines of AC-1.4 are still `buy` (FR-24).

## 5. Technical requirements

### TR-1 Package boundaries

| Package | M7 responsibility |
|---|---|
| `packages/account-state` | Adds the typed `SpendInputs` projection (TR-2) to the Account State. It is the only code that reads Toolbox's coin, Vault, stamp, bribe, statue, Pay 2 Win and atom fields. Contract tests fail loudly when Toolbox renames a field. |
| `packages/toolbox-parsers` (worker side) | In the parse Web Worker, because the engine cannot call Toolbox: computes the Vault cost ladders (TR-4) by re-running Toolbox's exported `parseUpgradeVault` on cloned levels; re-evaluates stamps with `updateStamps(account, characters, gildedStamp = OLA[154] > 0, undefined, undefined, withMinReduction = true)` (TR-4); prices Anvil coin points with the exported `getPlayerAnvil` / `getCoinCost` (`parsers/world-1/anvil.ts`). |
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
    cost: number;           // Toolbox materialCost from the worker re-evaluation (never the parsed save's gilded value)
    ownedInStorage: number; // Toolbox ownedMats
    ownedAnywhere: number;  // storage + inventories, for Equip materials (ActiveOn count, plain arithmetic)
    carryOk: boolean;       // Toolbox enoughPlayerStorage
    carriers: { characterIndex: number; capacity: number }[]; // Toolbox bestCharacter.topCharacters (top 3), joined to indices inside the adapter; names never leave it
    minReduction: number | null; // Toolbox getMinReduction(...).reduction, from the worker re-evaluation (null in the parsed save)
    coinsAfterRaise: number; // Toolbox futureCosts[0].goldCost
  } | null;                 // null when below cap
}

export interface BribeState { index: number; status: -1 | 0 | 1; price: number } // raw BribeStatus: locked, available, bought
export interface AnvilCoinPoint { characterIndex: number; nextCost: number }      // Toolbox getCoinCost, per character
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
  p2w: P2wUpgrade[];           // priced cauldron and liquid upgrades only; vials and Player upgrades are unpriced (FR-14)
  anvilCoinPoints: AnvilCoinPoint[];
  hydrogen: { level: number; dailyRate: number; discountPct: number }; // atoms.atoms[0].level, baseBonus × level, atoms.stampReducer
  gildedStamps: number;        // OLA[154]
  colosseumTickets: { balance: number; bankedAtNpcs: number }; // CYColosseumTickets; sum of allTickets[].totalAmount
  highestClassLevel: number;
}
```

- **Character names:** `characterIndex` is the only character key in M7 data. Names stay in the Account State's existing `name` field and never enter `SpendPlan`.

### TR-3 Engine output

```ts
// packages/engine/src/spend/types.ts
export type SpendSink = 'vault' | 'stamp' | 'bribe' | 'statue-gold' | 'p2w' | 'anvil';
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
  id: string;                           // `${entryId}:${ref}:${fromLevel}->${toLevel}`; Skip and Not for me key on entryId + ref (FR-18)
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
  reportText: string;                   // FR-19 rendering: costs at 2 s.f., no shortfall, transfer or balance
  why: string;
  sources: { label: string; url: string; tier: 1 | 2 | 3 | 4; verifiedOn: string; gameVersion: string }[];
  confidence: 'H' | 'M' | 'L';
  contested: boolean;
  stale: boolean;
  provenance: { fields: string[]; entries: string[] };
}

export interface SpendPlan {
  stage: string;                        // from M2
  wallets: { holder: number | 'bank'; coins: number; planned: number }[]; // device-only; never in a report or a committed snapshot
  lines: SpendLine[];                   // full ordered list
  visibleCount: number;                 // <= 5 (FR-15)
  perCharacter: { characterIndex: number; lines: number; coins: number }[]; // FR-16
  unlockFuel: { levels: number; coinsAbout: number; unlocks: string } | null; // FR-13
  notCovered: string[];                 // FR-20, e.g. ["forge.upgrades"]
  empty: null | { reason: 'nothing-affordable' | 'nothing-unlocked' | 'nothing-left'; cheapest?: SpendLine };
  unavailable: SpendSink[];             // FR-25: sinks whose section failed or is missing
}
```

### TR-4 Cost arithmetic (ADR 0005)

- **Toolbox numbers only.** Every coin figure is a Toolbox value or a sum or difference of Toolbox values. We write no cost formula.
- **Vault cost ladders.** Toolbox exposes only `cost` (the next level) and `costToMax`. Multi-level targets use the clone trick from [#16](https://github.com/YassSoliman/idleon-forge/issues/16): in the parse worker, re-run Toolbox's exported `parseUpgradeVault(levels', account, characters)` with cloned levels, then read each row's next-level `cost`. The cumulative cost of +k levels is the **sum of the per-level `cost` values** at L, L+1, …, L+k−1, never `costToMax(L) − costToMax(L + k)`: steep rows carry `costToMax` near 1e42 (Wicked Smart) and 1e33 (Bullseye), where a double's precision step (~1e26) is larger than the real cost of 10 levels, so the difference reads 0.
  - **Pass A:** every row except 13 moved by +k, with row 13 (Major Discount) held at its level, because Major Discount changes the price of rows 0–32.
  - **Pass B:** row 13 alone moved by +k.
  - **Checkpoints:** k ∈ {1, 2, 3, 5, 10, 15, 20, 25}, capped at `maxLevel − level`. Summing needs every level up to 25, so each pass re-parses at L+1 … L+24: at most 48 re-parses of `parseUpgradeVault` alone (a small function, not the full save parse).
- **Ladder contract test:** on both fixtures and the public saves, `ladder[k=1].coins === cost` exactly; every ladder is strictly increasing in k; and, for rows whose `costToMax` is below 1e15, `ladder[k]` agrees with `costToMax(L) − costToMax(L + k)` within a relative tolerance of 1e-9. A re-sync that breaks this fails CI.
- **No re-pricing inside one plan.** A Major Discount buy makes the later rows 0–32 cheaper, but the plan keeps the pre-purchase prices. That overstates costs, which is the safe direction. The next save reprices.
- **Partial fill.** A "to level N" item that a wallet cannot fully cover is bought to the largest ladder checkpoint the wallet covers. The rest stays a later line.
- **Stamps:**
  - Coin levels: `nextCoinCost`, `coinsToCap` (Toolbox `getGoldCostToMaxLevel`, exported).
  - Cap raises: material costs, `hasMaterials`, `enoughPlayerStorage`, `minReduction` and `futureCosts` come from the worker re-evaluation with `gildedStamp = OLA[154] > 0` and `withMinReduction = true`. When `OLA[154] > 0`, only the first raise is gilded (the game spends one per raise), so the worker evaluates twice: gilded for the first raise, non-gilded for the rest. Contract test: with `OLA[154] = 0`, every `materialCost` is about 20× the parsed save's value.
  - After a cap raise: `futureCosts[0].goldCost`, under FR-10's next-tier condition. This Toolbox helper counts the first level twice (`getGoldCostToLevel`), so it overstates (about +12% on Target Stamp). That can turn a `buy` into a `save-for` near a wallet's edge; the line says "about". Recorded as a known quirk.
- **Bribes:** Toolbox `price`. Availability is the raw `BribeStatus[i]` (−1 locked, 0 available, 1 bought), which the adapter reads from the envelope (Toolbox keeps only `done`). In scope are book bribes 0–25 (sets 1–4). Index 26, "The Art of the Bail", is sold by the Garbage Tuna, not the book: the generated fact `soldBy` marks it, and a test checks it never becomes a line.
- **Pay 2 Win:** Toolbox `cost` and `costToMax` for cauldron and liquid upgrades. Upgrades at level −1 (locked liquids) and at `maxLevel` are dropped. Vial upgrades (`p2w.vials`) have no Toolbox price and are `unpriced`.
- **Anvil coin points:** the worker calls Toolbox's exported `getPlayerAnvil` / `getCoinCost` per character (D3: importable, so priced). The points belong to the character who buys them, so the payer is always that character, never another wallet or the bank. They sit in the band table (position 7).
- **Statue Gold, P2W Player and vial upgrades:** `unpriced` (D3, FR-14). Toolbox's parsed output prices none of them (`p2w.player` and `p2w.vials` have no cost; statue Gold has no Toolbox function). If the Anvil import above fails at build time, Anvil coin points fall back to `unpriced` too.
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
| `spend.bribe.available` | `bribes[].status`, generated `soldBy` | bribes with status 0 sold by the book (indices 0–25) |
| `spend.statueGold.next` | `statueGold[]`, Guilding Tools owned (any grade ≥ 1, or the item in storage) | next statue index without Gold |
| `spend.p2w.candidates` | `p2w[]` | unlocked, not-maxed upgrades |
| `spend.guard.duplicateEntries` | `vault.rows[52]`, `colosseumTickets.bankedAtNpcs` | fires when buyable and Lv 0; reports the NPC-banked count |
| `spend.anvil.coinPoints` | `anvilCoinPoints[]` | per-character next coin point and its cost |
| `spend.gate.combatRow` | M2 pusher id; Toolbox hit chance on the pusher's next map (M2/M5) | `{ bullseye: boolean, defence: boolean }` |

Each Detector has a fires / doesn't-fire test on both private fixtures and on at least one public save ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 12). The private-fixture tests run locally only ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 7). CI runs on the public saves and the scrubbed W2 save.

### TR-6 Knowledge Base entries ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) shape)

**Generated (ADR 0007),** rebuilt at every parser re-sync from Toolbox data. Never hand-edited.

| File | Entry ids | Fields (beyond #11's required set) | Generated from |
|---|---|---|---|
| `systems/upgrade-vault.generated.yaml` | `vault.row.<0..89>` | `name`, `unlockLevel`, `maxLevel`, `oneOff` (maxLevel == 1), `majorDiscountApplies` (index < 33), `masteryTier` | Toolbox `shared-data.json` `upgradeVault` |
| `systems/bribes.generated.yaml` | `bribe.<0..40>` | `name`, `set`, `soldBy` (`book`, `garbage-tuna`, `jade-emporium`, from the bribe text), `price`, `codeValue` (e.g. 8 for Insider Trading, not the 5 in its text), `opensSet` | Toolbox `shared-data.json` `bribes` |
| `systems/stamps.generated.yaml` | `stamp.<rawName>` | `capStep`, `material`, `tab`, `obtainable` from Toolbox data only | Toolbox `stamps.json` |
| `systems/statues.generated.yaml` | `statue.<0..31>` | `name`, `goldOrder` (index order) | Toolbox `statues` |
| `systems/alchemy-p2w.generated.yaml` | `p2w.<group>.<upgrade>` | `maxLevel`, `unlockAlchemyLevel` (20/35/80 for the liquids) | Toolbox `CAULDRONS_MAX_LEVELS`, alchemy data |

**Authored overlay:** the wiki's 7-stamp unobtainable list, where Toolbox's own list has typos, lives in `systems/stamps.overrides.yaml` as an authored entry with its cited Source (wiki, tier 2). It is applied on top of the generated file and never edits it (ADR 0004, ADR 0007). A re-sync PR that makes Toolbox's list agree shows the overlay as removable.

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
    openEnded: false             # D6, FR-24
    gate: null                   # e.g. spend.gate.combatRow.bullseye
    shareCap: null               # D6: open-ended items default to 0.33 of the account's coins (FR-24)
  text: "Max Sleepy Time ({from}→{to}) on {payer}: {coins}"
  why: "+1% AFK gains per level, for fighting and skilling; cheap to max"
  sources:
    - { url: "https://github.com/YassSoliman/idleon-forge/blob/<commit>/docs/research/systems/account-wide/upgrade-vault.md", tier: 3, verified: 2026-10-17, gameVersion: "2.3.540" } # pinned commit URL, never a branch URL
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

The per-Stage lists fill this frame with targets from the Vault dossier's stage tables: early W1 → `W1-*`, mid W1 to early W2 → `W1-late`/`W2-early`, late W2 → `W2-mid`/`W2-late`, W3 → `W3-*`. Earlier bands' unfinished items carry forward. **Sources:** each line cites the most official Source for its fact (game data via the dossier's code reference, tier 1) and the community Source for its order. Links are to pinned commits, not research branches, so they survive branch clean-up. **Never-buy rule:** Happy Doggy (row 19) is never an authored item. It can only be bought as unlock fuel (no gameplay read in N.js v1.23).

**Authored Checks:**

| Check | Detector | Purpose |
|---|---|---|
| `spend.guard.duplicate-entries` | `spend.guard.duplicateEntries` | FR-12 line plus the why |
| `spend.hydrogen.hold` | `spend.stamp.hydrogen` | FR-11 hold notice (D4) |
| `spend.stamp.not-ready` | `spend.stamp.raiseReady` (negative) | hands "farm the material" or "raise carry capacity" Goals to M6/M4 |

Coins sitting idle needs no separate Check. M6 routes coins to M7 and has no coins Check, so the Spend Plan's own first `buy` line is the "coins idle" nudge: M10 shows the plan as one Account Goal whose Next Action is that line.

### TR-7 Storage

- **No new persistent store.** The plan is recomputed from each save.
- **localStorage keys** (per account, [#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 5):
  - `spend.skipToday`: line ids plus the daily-reset timestamp they expire at.
  - `spend.notForMe`: entry ids plus the patch they expire at.
- Both are cleared by "clear my data".

### TR-8 Performance budgets

These are measured on both private fixtures and the largest public save, on a 2020-class laptop, in CI where possible.

- **Vault ladders and stamp re-evaluation (TR-4):** ≤ 48 `parseUpgradeVault` re-runs plus one or two `updateStamps` passes, ≤ 150 ms added to the worker parse, p95. If the budget is exceeded, ladders stop at k = 10 and a warning is logged; ladders never fall back to `costToMax` subtraction.
- **`buildSpendPlan`:** ≤ 20 ms p95 in the engine; ≤ 120 candidate items (the W3-early account has 70+ unmaxed items); ≤ 40 lines out. Past 40 lines, the lowest positions are dropped from the list (never from the allocation), and "show more" says "and N more".
- **Account State growth:** the `SpendInputs` projection adds ≤ 50 KB to the serialized Account State that is posted from the worker.

### TR-9 Security and privacy

- Everything runs on the device ([ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md)). M7 adds no network call.
- `SpendPlan` holds character indices, never names. Report this follows FR-19.
- Balances never leave the device. They are not sent to Suggestions either ([ADR 0008](../adr/0008-worker-for-suggestions.md) sends only text plus Stage, versions, screen, class and level).
- No committed test contains a private save or a balance from one. Golden snapshots of the private fixtures are written to a gitignored folder and compared locally only; CI's committed goldens come from the scrubbed W2 save and the public saves. Synthetic fixtures are committed as field patches applied to the scrubbed W2 save in CI, or to the private saves locally.

### TR-10 Determinism and provenance

- **Same inputs, same plan.** `buildSpendPlan` is deterministic for the same `(state, history, kb, now)`. It uses no randomness and no `Date.now()`.
- **Provenance.** Every line lists the Account State fields read, for example `vault.rows[23].level`, `vault.rows[23].costToMax` and `wallets[0].coins`, and the entry ids used, for a later "Ask why" ([#17](https://github.com/YassSoliman/idleon-forge/issues/17)).
- **Golden snapshots.** One `SpendPlan` snapshot per fixture is part of the golden Now-screen snapshot (private ones local only, TR-9) ([#11](https://github.com/YassSoliman/idleon-forge/issues/11) item 12).

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **Loading** (first save not yet parsed) | No Spend Plan block. M10 shows its loading state. |
| **Broken parse / empty account** | No plan (FR-1, AC-9.3). |
| **Adapter shape error** (Toolbox renamed a field) | The `SpendInputs` contract test fails in CI. At run time an `AccountShapeError` stops the parse, so there is no advice ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 13). |
| **Failed or missing section** (Toolbox's `safeSection` swallowed an error, or the save lacks `UpgVault`) | That sink is `unavailable`: no lines, "can't price <sink> right now" (FR-25). |
| **Stale patch** (save game version newer than the parser pin) | The plan is still shown, with the M10 "game updated, parser not caught up yet" banner ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 6). Every line gets a "price may be off" note. A cost the patch changed is one Toolbox fixes, never us. |
| **Stale entries** (verified on a patch older than the current one, per the glossary) | Shown, ranked below fresh entries at the same position (FR-4). |
| **Offline** | The last good save's plan stays, under the "last cloud save Ns ago" line. Nothing in M7 needs the network. |
| **Save lag** (game saves every ~4 min; the player buys in between) | The plan reflects the last save. The header says "as of save Ns ago". Buying out of order is fine: the next save recomputes. A purchase already made shows until that save arrives (no manual done, [#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 8). |
| **Multiple tabs** | Each tab computes the same plan from the same save. Skip today and Not for me sync through the `storage` event. |
| **Second account** | One account per browser ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 16). Skip/Not for me keys include the account id, so a sign-out and sign-in to another account never leaks state. |
| **Shared-money toggle** (v1.07 Advanced Features, "money is shared between characters") | Its save flag and exact effect are unverified (Vault dossier, L). Until a Detector reads it, wallets follow `characters[].money`. If all characters but one read 0 while that one holds coins, that is consistent with either model and is shown as is. Finding its flag is a **ship gate** for M7 (section 9, note 1). Runtime guard until then: if two or more wallets hold the same non-zero balance, the plan treats them as one wallet (the coins are counted once) and logs a warning. |
| **Rows 5/6 at totals 75–79** | Toolbox's `unlocked` disagrees with the game's count rule. `VaultRow.buyable` uses the game rule (Vault dossier, Toolbox gaps). |
| **Maxed rows with a Toolbox `cost`** | Dropped (FR-8). |
| **Locked P2W liquids** (`level == -1`) | Dropped (AC-8.2). |
| **Equip-type stamp materials** | Not ready unless counted (FR-10, AC-3.3). |
| **Very large numbers** (≥ 1e15) | Stored as JS numbers; ladders past 1e15 are allowed. Display uses M10's game-style notation. `NaN` or `Infinity` costs drop the line, with a warning in `state.warnings`. |
| **Coins below every line** | Empty state (FR-17). |
| **Stamps not unlocked** (highest class level < 14) | No stamp or bribe lines (AC-9.2). |
| **No Guilding Tools** (no statue at Gold and the item not owned) | No statue Gold line. A Goal goes to M4: "buy Guilding Tools (Yum-Yum Grotto shop)". |
| **Hydrogen unlocked but discount 0** (raised today) | Batching on (FR-11 needs only Hydrogen Lv > 0); the hold rule still applies. The plan says "discount resets on any raise: do all raises in this session". |
| **Gilded Stamps held** (`OLA[154] > 0`) | The first raise is gilded and goes to the costliest stamp; later raises are priced without it (FR-11). |
| **Several unpriced lines** | "Totals below assume you skip the unchecked items" (FR-14). |
| **A line the player hid** | Its coins flow to later lines (FR-18). |
| **Player on a character with no coins** | The plan's first paying character goes to M10's "Next: switch to X" (Visit Order). The plan never says "spend here" for a 0-coin character. |

## 7. Dependencies

| Module | What M7 needs from it | Interface |
|---|---|---|
| **M1 Sync & Account State** | The `SpendInputs` projection (TR-2) and the worker-side Vault ladders (TR-4) | `AccountState.spend: SpendInputs`; contract tests in `packages/account-state/test` |
| **M2 Stage & Meta Path** | The Stage id that keys the Spend Priority List; the pusher, for the Bullseye gate | `stage(state): StageId`; `pusher(state): { characterIndex, nextMap }` |
| **M5 Higher-leverage options** (or M2, wherever the `getMaxDamage` clone lives) | The pusher's hit chance on the next map, for FR-21 | `hitChanceOnNextMap(state, characterIndex): number \| null`. Null means the gate does not fire, and the combat row stays at position 7. |
| **M4 Purpose & Milestones** | Takes M7's not-ready stamp raises and the Guilding Tools gap as Goals | M7 emits `SpendHandoff { kind: 'stamp-material' \| 'stamp-carry' \| 'guilding-tools', ref, shortfall }[]` |
| **M6 Unspent & idle** | Lists no coin purchases (M6 routes coins to M7), which avoids double advice. Its "Collect N Colosseum tickets" Goal must agree with FR-12 once the doubling point is verified (open, section 10 row 6). | M6 `spendCount` + M7 `perCharacter` feed Visit Order together (FR-16) |
| **M10 Now screen UI** | Renders the Spend Plan as one Account-section block plus the per-character chip (D5, FR-23), the 5-line cap, groups, status pills, Source links, Skip today, Not for me and Report this | `SpendPlan` (TR-3) is the source of truth. **M10 must be amended** before M7 builds: M10's TR `SpendPlan { currency, owned, lines: { cost, cumulative, affordable } }` and FR-22's single running total predate per-wallet payers, `move-coins`, `hold`, nullable `unpriced` costs and the D5 chip. A running total is shown per paying wallet, never across wallets. |
| **M10 / M3 Visit Order** | "Most to spend" | `SpendPlan.perCharacter` lines + M6 `spendCount` |
| **M11 Knowledge tooling** | Schema for the `spend` block, the generated-fact pipeline for the 5 generated files, and CI source enforcement | JSON Schema in `packages/knowledge/schema` |
| **M12 Release** | "What's new" lines when the Spend lists change | changelog entries from Knowledge Base PRs |
| **M13 Suggestions** | Report this on a Spend line | FR-19 payload; `SpendLine.reportText` as the rendered text |

## 8. Decisions

Ruled by Yasser on 2026-10-17 ([PR #51](https://github.com/YassSoliman/idleon-forge/pull/51)): every recommendation accepted as written. The FRs, TRs and stories above already apply them.

- **D1 - Coins on several characters: plan per character, pool through the bank only when needed.** The plan keeps one wallet per character plus the bank. A line becomes `move-coins` ("withdraw N from storage on <class Lv>, then buy") only when no single wallet covers it but one wallet plus the bank does (FR-7). *Why:* it keeps a 15-minute session to the fewest character switches (on both fixtures one or two characters hold most of the coins), and it still unlocks big one-off buys no single character can afford. One account-wide pool, like Toolbox, would call things affordable that need steps the player isn't shown.
- **D2 - Saving up: only for `reserve` items.** When a line flagged `reserve` in the Knowledge Base is unaffordable everywhere, it becomes `save-for`, and the coins of the character closest to affording it are held back from every line ranked below it (FR-22). Every other unaffordable line is simply skipped, and cheaper lines below it stay buyable. The `reserve` items today: Duplicate Entries before tickets and Changing the Code (the Crystal 3D Printer joins only if gems ever enter the plan). *Why:* only a handful of buys deserve it. Always stopping at the first unaffordable line would freeze the plan behind one big item, and never saving leaves players forever just short of the buys the community says matter most.
- **D3 - Sinks Toolbox doesn't price: show them as `unpriced`.** Statue Gold and Alchemy Pay 2 Win Player upgrades show as "cost not checked, see the price in game" lines, never deducted from a wallet (FR-14). Forge upgrades go under "Not covered yet" (FR-20). Anvil coin points use Toolbox's `getPlayerAnvil` from the parse worker if it can be imported; otherwise they are `unpriced` too. No cost formulas of our own: amending ADR 0005 stays in reserve. *Why:* statue Gold is a confirmed priority (PV 3.7) and Player upgrades a cheap community one, and the game shows the price on the button. Writing formulas would reopen the upkeep cost ADR 0005 exists to avoid.
- **D4 - Hydrogen discount: hold only for a raise that will fit within 7 days.** Ready cap raises are held (`hold`) only while some at-cap stamp whose material is too big for any character to carry today would fit at a discount reachable within K = 7 days. Otherwise every ready raise is bought now, in one session (FR-11). *Why:* always waiting for 90% can mean months at a low Hydrogen level (1% a day), and raising whenever anything is ready wastes the discount's real job, which is making otherwise-impossible raises fit in an inventory. Toolbox already computes each stamp's `minReduction`, so the rule is pure arithmetic, and the hold notice shows the days left so the player can override by just raising.
- **D5 - Placement: one Account block plus a chip per paying character.** The Spend Plan is one block in the Now screen's Account section, each line naming its character. Each paying character's row also gets a one-line chip, "Spend here: N buys, ~X → Spend Plan" (FR-23). *Why:* the order across characters is the whole point of a Spend Plan, and splitting it across rows would lose it. The chip still honours #10 item 6 (an account-wide task that needs a character shows on that character's row) and feeds Visit Order. This binds M10.
- **D6 - Open-ended rows: authored checkpoints plus a 1/3 share cap.** Open-ended Vault rows (Major Discount, Vault Mastery, Monster Tax and the like) are bought only to an authored per-Stage checkpoint, and one open-ended line never takes more than 1/3 of the account's coins in one plan, measured on the paying wallet, bank excluded (FR-24; red-team 12). *Why:* this is the Vault dossier's own "keep Major Discount about 1/3 of your spend". On the W2-late account, filling Major Discount toward its next checkpoint would otherwise take ~52M of the richest character's ~92M for about 4% cheaper rows. The checkpoint keeps the plan Stage-aware, the cap stops one steep row from crowding out a dozen cheap permanent upgrades, and both are authored numbers (ADR 0007), tunable per entry.

## 9. Risk notes

1. **It tells you to buy something you can't afford on the character you're playing.** Toolbox's `rawMoney` and `hasMoney` add up every character plus the bank. Its own comment assumes coins move freely between characters. A plan built on them would show "affordable" for buys that need several switches and transfers. *Defence:* per-character wallets (FR-2, FR-5), D1's explicit move-coins step, and AC-2.1 and AC-2.5. *Residual risk:* the shared-money toggle (v1.07) is unverified. A build task must find its save flag on a save with the toggle on before M7 ships. If it is on, wallets collapse into one.
2. **Toolbox numbers that look valid but aren't.** Seven traps found on the fixtures (the last two by the red-team, section 10):
   - maxed Vault rows still carry a `cost`;
   - locked Pay 2 Win liquids are level −1 with a 2.1K price;
   - `hasMaterials` is true for Equip-type stamp materials with 0 owned;
   - `unlocked` is wrong for rows 5/6 at totals 75–79;
   - `futureCosts.goldCost` counts one level twice;
   - the parsed save prices every stamp raise at the Gilded Stamp rate (×0.05), and leaves `minReduction` null;
   - `costToMax` differences lose all precision on steep rows (≈1e42).

   *Defence:* explicit filters (FR-8, FR-10, TR-4), the worker stamp re-evaluation, summed ladders, the game-rule `buyable`, and the golden tests AC-1.3, AC-3.3 and AC-8.2. Each trap gets a Detector test so a Toolbox fix or regression shows up in the re-sync PR diff.
3. **Wrong advice from the order itself.** The Vault, stamp and Pay 2 Win orders are unverified (PV 7.6, 3.6, 4.4). Only bribes and statues are confirmed. "Engine rows first" can be bad at the steep end, as the Major Discount arithmetic in D6 shows. *Defence:*
   - confidence L shown on those lines;
   - cheapest-first tie-breaks;
   - D6's checkpoint and share cap;
   - Contested never on top;
   - Not for me and Report this on every line;
   - a review of the W2-late and W3-early golden snapshots by Yasser and Joseph as players, the #11 pipeline's human step, before merge.
4. **Wiping the Hydrogen discount.** One cheap cap raise resets days of discount for every stamp, and only the first raise of a batch gets the discount. *Defence:* FR-11 makes single raises impossible to emit while others are ready, D4's hold rule, and AC-4.1 to AC-4.3 on a synthetic fixture, since neither real fixture has Hydrogen yet. The rule is tested before either account reaches W3-late.
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

## 10. Red-team log

Independent red-team pass on 2026-10-17, run after the decisions were folded in, against the vendored Toolbox (`6c37e3d`), both private fixtures (aggregates only), the dossiers and the M1, M6, M10 and M13 specs. Each finding was re-checked against code or data before it was accepted. Totals: 22 findings (P0 2, P1 9, P2 9, P3 2). 20 were fixed. 2 were fixed with one part deferred to Yasser. No finding was rejected outright; parts of 2 were rejected.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | The parsed save prices every stamp raise at the Gilded rate (×0.05): `updateStamps` defaults `gildedStamp = true`, and both fixtures have `OLA[154] = 0` | Fixed | Worker re-evaluation with `gildedStamp = OLA[154] > 0` (FR-10, TR-1, TR-4). AC-3.2/3.3 recomputed: W2-late 2 of 7 ready (~1.3M), W3-early 9 of 17. A contract test fails on gilded amounts |
| 2 | P0 | `costToMax(L) − costToMax(L+k)` is 0 on steep rows (~1e42), and the ladder identity test was vacuous | Fixed | Ladders sum per-level `cost` (TR-4). New contract test: exact k=1, monotone ladders, tolerance check below 1e15. TR-8 budget restated |
| 3 | P1 | `minReduction` is null in the parsed save, and Toolbox returns `{ reduction }` | Fixed | Worker call with `withMinReduction = true`, unwrapping `.reduction` (TR-1, TR-2) |
| 4 | P1 | `futureCosts[0]` can be a later tier, a projected discount or a fallback | Fixed | Accepted only at the next tier and the current discount; otherwise not ready (FR-10) |
| 5 | P1 | Only the first raise in a batch gets the Hydrogen discount; the daily rate is `baseBonus × level`; the section 6 contradiction | Fixed | FR-11 rewritten: first raise discounted, the others priced at 0%, costliest first, batching on at discount 0, Gilded handling. AC-4.x updated |
| 6 | P1 | `ColosseumTickets.totalAmount` is the `CY` balance, not unreceived tickets; M6 says "collect tickets" | Fixed; one part deferred | The guard fires on row 52 alone, quotes the NPC-banked count and never says "unredeemed" (FR-12, AC-1.1, AC-5.1). Where the doubling applies is a ship-gate check. The M6 interaction goes to Yasser |
| 7 | P1 | Vial upgrades have no Toolbox price | Fixed | Vials are `unpriced` (scope, FR-14, TR-2, TR-4, AC-8.4) |
| 8 | P1 | M10's `SpendPlan` shape and single running total contradict TR-3 and D5 | Fixed | TR-3 is declared the source of truth, with the M10 amendment listed in section 7. M10's own spec must follow before M7 builds |
| 9 | P1 | Balances leak through Report this text (cost − shortfall) and committed goldens; the spec printed fixture balances | Fixed | `reportText` with no shortfall or transfer and costs at 2 s.f. (FR-19, TR-3). Private goldens are gitignored (TR-9). Fixture table bucketed |
| 10 | P1 | The shared-money toggle could count pooled coins once per character (suspicion) | Fixed | The flag check is now an M7 ship gate, plus a runtime guard that merges identical non-zero wallets (section 6) |
| 11 | P1 | No behaviour for a failed or missing section; a failed Vault would read as level 0 | Fixed | FR-25 partial data, `SpendPlan.unavailable`, a section 6 row, AC-1.7 |
| 12 | P2 | The 1/3 share cap was ambiguous and missed D6's own example; "open-ended" was undefined | Fixed | The cap is per paying wallet with the bank excluded, matching D6's 52M-of-92M case. An authored `openEnded` flag (FR-24, AC-11.1) |
| 13 | P2 | `reserve` rules: position ≥ 3 loophole, competing reserves, single-wallet freeze | Fixed; one part deferred | It reserves only the cost amount, protects every lower line, and the higher rank picks first (FR-22). The single-wallet fallback goes to Yasser |
| 14 | P2 | Skip/Not for me expiry and keys disagreed with M10, and ids were unstable | Fixed | M10 FR-28/29 expiry rules, keyed by `entryId + ref` (FR-18, TR-3) |
| 15 | P2 | "Most to spend" had two owners, and the idle-coins Check had none | Fixed | Visit Order sums M6 `spendCount` and M7 lines (FR-16). The plan's first buy line is the idle nudge (TR-6) |
| 16 | P2 | The Anvil note was inaccurate, and Anvil had no FR/TR | Fixed; claim rejected | `getPlayerAnvil` does exist (`parsers/world-1/anvil.ts:118`, exported), so the "no such function" part is rejected. The gap is fixed: Anvil coin points are priced per character (scope, TR-1, TR-2, TR-4, AC-8.4) |
| 17 | P2 | Bribe 26 (The Art of the Bail) set ambiguity | Fixed | Raw `BribeStatus` gives availability. A generated `soldBy` fact plus a test excludes index 26 (TR-2, TR-4, TR-6) |
| 18 | P2 | The `obtainable` wiki override broke ADR 0004/0007; the "~10 patches" Stale rule broke the glossary | Fixed | Authored overlay file with a cited Source (TR-6). Section 6 now uses the glossary definition |
| 19 | P2 | Untestable ACs: no public save below Lv 14; synthetic parsed-field patches inconsistent; FR-21 waits on M5 | Fixed | AC-9.2 uses a re-parsed synthetic save; AC-4.x patch raw `OLA[134]` and re-parse. FR-21 states the gate is dormant until M5 |
| 20 | P2 | Unpriced lines can over-promise the totals below them | Fixed; suggestion rejected | Caveat line added (FR-14, section 6). The suggested "about" reserve amount is rejected: it needs a cost estimate we would have to compute ourselves (ADR 0005) |
| 21 | P3 | Carry data is top-3, name-keyed and empty-inventory | Fixed | Documented in FR-10 and TR-2: index join inside the adapter, wallets outside the top 3 can't carry, "free up space" wording |
| 22 | P3 | Smaller points: AC-1.3 lists, Equip wording, tier-4 branch URLs, TR-8 candidate cap, "overstating is safe" | Fixed | Generic AC-1.3 assertion, Equip wording corrected, pinned-commit Source URLs, TR-8 raised to 120 candidates with overflow behaviour, the overstatement caveat in TR-4 |

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

## Final rulings (Yasser, 2026-10-17)

These supersede anything above that conflicts with them.

> **In-game facts (Yasser, 2026-10-17):**
> - Each character holds its own coins. Coins put in the storage vault are shared.
> - Coins can be deposited to storage from **anywhere** via the codex, so any character can reach storage without walking to a chest.
> - The bank moves coins between characters (confirmed).
> - There is no separate "shared money" toggle to worry about beyond storage.
> 
> **For D1:** a "deposit to storage, then withdraw on the buyer" step is cheap and works from any character.

> **Ruled by Yasser (2026-10-17), all as recommended:**
> - **RT-1 (tickets):** check in game code where doubling happens; this ships as a gate. If doubling happens on collection and a wallet (or wallet + bank) can afford Duplicate Entries, say "buy Duplicate Entries first, then collect". Otherwise collect anyway.
> - **RT-2 (reserve):** hold coins back only while the shortfall is ≤ 50% of the item's cost. Further away, show it as "save-for" without holding anything.
