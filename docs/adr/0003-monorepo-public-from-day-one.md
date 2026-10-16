# One public monorepo for every Mod

IdleOn Forge is a single public repository: shared parts (parser fork, Knowledge Base, Account State) are packages, and each Mod (ActiveOn first) is an app. We chose a monorepo over one repo per Mod because building ActiveOn will spawn shared tooling every later Mod reuses, and with a two-person team one clone, one issue tracker and no cross-repo versioning wins. It is public from the first commit, with open-source onboarding (README, contributing guide, agent instructions) treated as part of the product, so going public is never a migration.
