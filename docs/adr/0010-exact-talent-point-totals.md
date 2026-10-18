# One game formula we keep: talent point totals, checked against the save

ADR 0005 says we use the numbers IdleOn Toolbox computes and never write game formulas. This ADR makes one narrow exception: **the talent point total per tab** (tabs 1–5 and the star tab, per preset, per character). We port the game's own `_customBlock_TotalTalentPoints` (N.js) term by term, in `packages/account-state/src/talent-points-formula.ts`, with a citation per term. Nothing else in that function, and no other game formula, is covered by this exception.

Why this one:

- **The owner asked for it** (2026-10-18). The Build view could only say "at least N points" (M9 TR-7, the difference between the two presets), which is often 0 when points are waiting. Players want the game's own number: "70 points waiting in tab 1".
- **Toolbox doesn't compute it.** It computes only the star tab's total, for the active character (`calcTotalStarTalent`). We keep using that one for the star tab, per preset.
- **The save is its own answer key.** Spent points can never exceed a tab's total, and most players spend every point on their main preset. So the preset that spent more on a tab (with its own points-granting talents taken out) gives a floor on the total, and an exact match when it shows 0 left. Every total is checked against it on every parse: a match is `exact-verified`, no contradiction is `exact`, a total below the floor is a mismatch.
- **There is a fallback.** On any mismatch, or when a term can't be computed (no Toolbox calls, a failed parse section), the tab falls back to the lower bound (`confidence: 'bound'`) and a truth-check violation (`talent-total-vs-answer-key`) names the formula, the answer key and the save fields read, so the missing term can be found. A wrong exact number is never shown.

Each bonus term that needs a computed value (bubbles, vials, star signs, stamps, shinies, the Upgrade Vault, companions, talents, the W6/W7 class systems) still comes from one Toolbox helper (`toolboxCalls.talentPointTerms`); only the sum is ours. Raw-save terms (class and skill levels, `CYTalentPoints`, achievements, Darts, merits, lore) are read directly. The truth checks reuse the same port with raw terms only, as their independent floor.

When the game changes TotalTalentPoints, the answer key starts reporting mismatches; re-read the function in N.js and update the port and its citations.

Ruled by the owner on 2026-10-18. Amends ADR 0005.

## Extension: Bubba derived values (M23 X1)

The same exception, on the same terms, also covers **Bubba's next-step values** (spec [M23](../specs/M23-bubba.md) TR-6, "X1"): pats per refill, the meat rate at happiness 0, Charisma XP needed and per second, the levels banked XP buys, each Charisma attribute's bonus now and at one more level, what the next Bubba Boon level adds, the Megaflesh multiplier, and how much a level of each discount cuts every cost. They live in `packages/account-state/src/bubba-x1.ts`, each one citing the `_customBlock_Bubbastuff` function (N.js) it ports.

- **The owner asked for it** (2026-10-18). M23 needs these numbers, and Toolbox computes none of them. The first plan was to add them to our Toolbox mirror fork. It was dropped because a fork-only pin breaks the weekly parser sync (the mirror only fast-forwards, and the sync accepts only commits on upstream main) and would make the vendored "copied unmodified" notices untrue. `vendor/` stays pristine.
- **Toolbox does the work wherever it can.** The happiness-0 rate, the next Boon level's delta and the discount ratios run Toolbox's own `getBubba` on an edited copy of the raw record (`toolboxCalls.bubbaParse`), so they are Toolbox numbers. The rest are short ports over Toolbox's per-upgrade `realLV` and `bonus` and the raw save.
- **Verified against the game's own code.** `scripts/oracle/bubba-oracle.cjs` runs `_customBlock_Bubbastuff`, copied verbatim from the client, on a save's raw record. Its values on two public saves (`latest.json`, `highend.json`) are pinned in `packages/account-state/test/bubba-x1.test.ts`, and every value must match to 1e-9. The happiness-0 rate also matches the live rate read on 2026-10-11.
- **There is a fallback.** With no Bubba record, no Toolbox calls, a throw or a non-finite result, the value is `null`, and M23 hides every line that needs it (M23 DS-3, FR-21). A wrong number is never shown.

When the game changes a Bubba function, re-run the oracle on both saves. A test that moves names the function to re-read in N.js, and the port and its citation get updated with it.

Extension ruled by the owner on 2026-10-18.
