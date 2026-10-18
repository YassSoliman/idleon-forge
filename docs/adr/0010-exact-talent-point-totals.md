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
