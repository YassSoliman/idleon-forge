# We use the numbers Toolbox computes; we never write game formulas

Advice may use any value IdleOn Toolbox's parsers compute (max damage, kills per hour, AFK gain rate, survivability, costs, bonuses) plus plain arithmetic on them (sums, costs vs what you can afford, time to the next Milestone). We do not write or maintain our own game formulas. This lets ActiveOn derive a character's Purpose, Milestone ETAs, a Spend Plan and Higher-leverage options deterministically, while the upkeep of formula correctness stays with Toolbox, which already tracks every patch. It replaces the earlier blanket ruling that "advice computed from game formulas" was out of scope.

Amended by [ADR 0010](0010-exact-talent-point-totals.md): talent point totals are the one game formula we port, checked against the save on every parse and falling back to the lower bound on any mismatch.
