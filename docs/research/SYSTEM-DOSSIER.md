# System Dossier format

Every game system ActiveOn reasons about gets one dossier section in this shape. Dossiers are research output: cited, dated, written in [`GLOSSARY.md`](../../GLOSSARY.md) terms. The Knowledge Base is built from them.

## <System name>

- **What it is:** one or two lines.
- **Unlocks:** where, when and how (world, quest, level, item), verified on the current patch.
- **Scope:** per-character, account-wide, or both (and which parts are which).
- **Inputs → outputs:** what it consumes (currency, materials, time, kills, AFK) and what it gives (bonuses, resources, unlocks).
- **Goals and Milestones:** the thresholds where rewards step up (e.g. kill counts, levels, set bonuses), as a table.
- **Feeds / fed by:** links to other systems, in both directions (e.g. Copper → stamps; Poop kills → Upgrade Vault and Death Note).
- **Per-session actions:** what a Play Session should check or spend here; what counts as an idle or capped state.
- **AFK Setup implications:** which activities or presets this system wants characters on.
- **Min-max by stage:** the priority order within the system for early, mid and late W1–W3 (and the W4+ outline), and per class where it differs.
- **Common mistakes:** what casual players get wrong, and how to detect it from the save.
- **Save and Toolbox fields:** where the state lives in the parsed Account State (`account.*`, `characters[].*`) and which Toolbox-computed numbers apply (ADR 0005).
- **Sources:** every claim cites a URL or code location, with the patch or game version and the date verified (ADR 0004). Flag anything older than the current patch.
