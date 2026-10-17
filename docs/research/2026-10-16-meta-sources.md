# Meta Path sources: which are current and authoritative? (2026-10-16)

Ticket: [#3](https://github.com/YassSoliman/idleon-forge/issues/3), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Precedence follows [ADR 0004](../adr/0004-source-precedence.md). Terms follow [GLOSSARY.md](../../GLOSSARY.md).

**Current patch on the research date:** "Lumi Menagerie", released **2026-10-16** ([Steam announcement](https://store.steampowered.com/news/app/1476970/view/1846651706682419)). The patch before it was "Jelly Operator" on 2026-09-18/19. Toolbox's internal game version for its most recent release is `2.3.531` ([Toolbox patch-notes.js](https://github.com/Morta1/IdleonToolbox/blob/main/data/patch-notes.js)). **None of the sources below covers Lumi Menagerie yet.** It adds W7 endgame content, so it should not move early-world class choices, but every entry should be re-verified after it.

## Answer

- **No single Source defines the Meta Path.** The facts behind it (the class tree, unlock requirements, which skill each class specializes in, character-slot unlock levels) are tier-1/2 game data. The *choices* (which class to put in each slot, creation order, which duplicates to make, per-world priorities) are community opinion, so they can only ever be tier 3 under ADR 0004. ActiveOn's Meta Path will have to be **assembled and owned by us**, citing a separate Source for each part.
- **Facts (tier 1/2), use these:** Toolbox game data (GPL-3.0, refreshed every patch; tier 1) and **idleon.wiki** pages whose tables are now generated from game data by BigCoight's modules (the Classes and Character Creation pages were edited 2026-10-05 to 10-13; tier 2). The wiki shows four master classes live: Death Bringer, Wind Walker, Arcane Cultist (2025-06-07) and Royal Guardian (2026-08-25).
- **Per-world milestones and priorities:** the recommended primary is **AutoReview (Scoli)**. Its `progression_tiers.py` holds about 40 machine-readable tier tables, and Pinchy maps them onto **Early/Mid/Late W1 to W7** thresholds. It is maintained (beta branch pushed 2026-10-16, main 2026-09-23). It has **no licence**, though: we can cite and re-derive the facts, but we cannot copy its code or tables.
- **Class per slot and creation order:** no current, authoritative source exists. The best available tier-3 sources are (1) the wiki Classes page's recommendation sentence, (2) TheAlmightyHyduck's Steam guide (updated 2025-09-27) and (3) shnaps' GitHub gist (updated 2026-09-18). Each is stale or low-authority in its own way (see the conflicts below).
- **The wiki's page dates hide stale sections.** The Classes page was edited 3 days ago, but its "first three Warrior/Archer/Mage → Barbarian/Bowman/Shaman, then Squire/Hunter/Wizard" sentence dates from **2022-01-19**. ADR 0004's "wiki edited after the relevant patch" test has to be applied **per section or claim, not per page**.
- **The wiki's own guides are dead.** External Resources links Sangy's Newbie Guide and the community "Guide Sheet". Both return **HTTP 410**. The backup copy says it "hasn't been updated in 2 years". The wiki's Beginner Guide says it was "written in version 1.01".
- **SEO sites (Games Finder, idleon.guide, DigitalTQ, jbracing) are tier 4** ("anything else"). They predate Royal Guardian or are low-quality, and they contradict each other. They can be used as corroboration only.
- **Reddit, Discord and Steam discussions** could not be surveyed. Reddit blocks unauthenticated fetches, and Discord needs a login, which our read-only rule forbids. This is a known gap: a human (Yasser or Joseph) should check the official Discord's guide channels for a pinned, current class-order guide before the Meta Path is locked.
- **Licences:** the wiki is **CC BY-NC-SA 3.0**, so we may cite it and quote it with attribution, and anything we adapt has to stay NC-SA, kept separate from the GPL code. AutoReview, the gist, the Steam guide and the SEO sites all have no licence, or are "all rights reserved" or under Steam's terms: we can cite and paraphrase the facts but not copy them. Toolbox is GPL-3.0, which is compatible.
- **Machine-readable:** Toolbox `data/website-data/*.json` (tier 1), the wiki's MediaWiki API at `https://idleon.wiki/api.php` (the `index.php` raw endpoint is behind a Cloudflare challenge; `api.php` works) and AutoReview's Python dicts. Everything else is prose.

## Source-by-source survey

| Source | Tier (ADR 0004) | Last update | Patch coverage | What it gives the Meta Path | Licence / reuse | Machine-readable |
|---|---|---|---|---|---|---|
| **Toolbox game data** ([repo](https://github.com/Morta1/IdleonToolbox)) | 1 | 2026-10-16 (gameVer 2.3.531) | Through Jelly Operator. Lumi Menagerie pending | Class tree, talents and game constants. Community talent *builds* per class ([/tools/builds](https://idleontoolbox.com/tools/builds/divine-knight)), but **no class-order or roster guidance** | GPL-3.0-only | Yes (JSON, TS types) |
| **idleon.wiki** ([Classes](https://idleon.wiki/wiki/Classes), [Character Creation](https://idleon.wiki/wiki/Character_Creation), [Royal Guardian](https://idleon.wiki/wiki/Royal_Guardian)) | 2 for game-data tables. The class-order sentence is effectively 3 and stale (2022) | Classes 2026-10-13, Character Creation 2026-10-07, Changelog/2026 2026-09-27 | Changelog runs to v1.22 Jelly Operator (2026-09-19). Lumi not yet added | Class tree including all 4 master classes, each class's skill, and a one-line class order | CC BY-NC-SA 3.0 (from `rightsinfo`; the site text says "Attribution-NonCommercial 3.0") | Yes, via `api.php` (wikitext and revision history) |
| **AutoReview / Scoli** ([repo](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot), [site](https://ieautoreview-scoli.pythonanywhere.com/)) | 3 (curated community targets over parsed save data) | Beta 2026-10-16, main 2026-09-23 | W1 to W7, including Royal Armory (Royal Guardian) | Per-system tier targets mapped to Early/Mid/Late W1 to W7 (Pinchy), slot-unlock account levels (Character 2 at 8 … Character 10 at 1500), secret-class path (Journeyman → Maestro → Voidwalker). **No class-per-slot plan.** | None, so all rights reserved: cite and re-derive only | Yes (`mysite/consts/progression_tiers.py`, `mysite/general/pinchy.py`) |
| **shnaps' progression gist** ([gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa)) | 3 (dated, but personal and secondary) | 2026-09-18 (22 revisions since 2026-06-28) | Self-declared "patches through v1.21 + Jelly Operator", "last wiki-verified 2026-07" | The most complete current roster: 10-slot plan, duplicates, W1 to W7 ordered steps, push gates, plus a dated "Griffy, Aug 2026" late-game alternative | None, so all rights reserved | No (Markdown prose) |
| **TheAlmightyHyduck, "An In-Depth Guide about Classes"** ([Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=3440291354)) | 3 | Posted 2025-03-07, updated 2025-09-27 | Covers Death Bringer and Wind Walker. **No Arcane Cultist (2025-06) and no Royal Guardian (2026-08)** | Creation order for slots 1 to 7 and the elite order | Steam user content, no reuse licence | No |
| **Sangy's Newbie Guide / community Guide Sheet** (linked from [External Resources](https://idleon.wiki/wiki/External_Resources)) | 3, but dead | Originals return HTTP 410. The [backup](https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc/edit) says "hasn't been updated in 2 years" | Pre-W5 era | W1 basics | None stated | No |
| **Games Finder** ([character creation order](https://gameslikefinder.com/article/idleon-character-creation-order/)) | 4 | 2026-06-01 | Says DK/ES/SB master classes are "future". **Predates Royal Guardian** | 11-slot creation order | "Copyright © Games Finder" | No |
| **idleon.guide** ([subclasses](https://idleon.guide/subclasses/)) | 4 | 2025-05-20 | W1 to W6, DB/WW only | 7-slot order | © Tech Tip Vault | No |
| **DigitalTQ / jbracing.co.uk** ([DigitalTQ RG](https://www.digitaltq.com/wiki/idleon/royal-guardian-guide)) | 4 (jbracing looks like SEO spam; fetch returned HTTP 520) | 2026 | Unknown | Not used | Unknown | No |
| **Efficiency built-in guidance** ([repo](https://github.com/Sludging/idleon-efficiency)) | n/a | 2026-10-12 | Current | In-page alerts only. **No class or progression guidance** | None | n/a |
| **Reddit r/idleon, official Discord** | 3 if found | Not reachable | Not reachable | Unknown | n/a | n/a |

## Known conflicts

1. **Which subclasses come first.** The [wiki](https://idleon.wiki/wiki/Classes) (2022 sentence), the Steam guide and Games Finder agree: **Barbarian/Bowman/Shaman first, Squire/Hunter/Wizard second**. The gist's roster table lists **Squire → DK first** as "main pusher". That table may be a roster ranking rather than a creation order, and the gist never states a creation order. idleon.guide puts **Bowman twice in the first four slots and no Hunter** in slots 1 to 7. Wiki, Steam and Games Finder agree with each other, so for slots 1 to 6 they win on agreement, but all three are older than the current patch.
2. **Duplicates (slots 8 to 10).** The gist's main plan is 2 DK, 2 ES, 2 SB. In the same gist, the "Griffy, Aug 2026" late-game alternative is 2 DK, 2 Death Bringer, 2 Arcane Cultist, 1 each of ES/SB/WW/Voidwalker. That alternative contradicts the gist's own "never duplicate Blood Berserker" rule, a contradiction the gist acknowledges. Games Finder's duplicates are Squire, Wizard (or Shaman), Bowman. Master classes are what changed the duplicate meta, and only the gist post-dates Royal Guardian.
3. **11th slot.** The gist says it unlocks at Family Level 5000. AutoReview's `combatLevels_progressionTiers` stops at "Character 10" (1500) and lists 5000 as "Family - Sparkle Obol Slot 4". This is unresolved: check it against Toolbox game data before using it.
4. **Main pusher over time.** The gist has DK early, then Elemental Sorcerer late. The Steam guide has BB for W4, then DK later. They are not contradictory, but neither is cited to game data.
5. **Patch numbering.** The wiki labels the 2026 patches v1.05 to v1.22 ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)), while 2025 used v2.xx and Toolbox reports gameVer 2.3.5xx. Knowledge Base entries should record the **patch date and the Toolbox gameVer**, not the wiki's label.

## Recommendation for the Meta Path decision ticket

- Model the Meta Path as layered Knowledge Base entries, each with its own Source:
  - **(a) Class-tree and unlock facts:** Toolbox data, with the wiki as fallback.
  - **(b) Slot-unlock levels:** Toolbox data, corroborated by AutoReview.
  - **(c) Class per slot and creation order:** tier-3 consensus of the wiki sentence, the Steam guide and the gist, flagged `opinion` with a verified-on date.
  - **(d) Per-world milestones:** derived from AutoReview's tier tables, cited and re-expressed in our own words and data.
- Treat the slot-1-to-6 order as settled by agreement (Barb/Bow/Shaman, then Squire/Hunter/Wizard, then Journeyman as the 7th). Treat duplicates and master-class doubling as **unsettled**; this matters for Joseph's Course Correction.
- Re-run this survey after each major patch. The gist and AutoReview are the two sources most likely to update first.

## Method and sources

All fetches were read-only and done on 2026-10-16. Wiki data came from the MediaWiki API (`action=query&prop=revisions`, `meta=siteinfo&siprop=rightsinfo`). The age of the class-order sentence was found by bisecting the 179 revisions of the Classes page: it first appears in revision 14574, made by Wekhter on 2022-01-19. AutoReview was read from a fresh clone of `main` (05ac449), and the beta-branch date came from the GitHub API. Gist history came from `gh api gists/161a370ed795e6141e0553eb30ddc8fa`. Steam dates came from the guide page's "Posted/Updated" fields and from the [ISteamNews API](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1476970&count=8).

- https://idleon.wiki/wiki/Classes
- https://idleon.wiki/wiki/Character_Creation
- https://idleon.wiki/wiki/External_Resources
- https://idleon.wiki/wiki/Beginner_Guide
- https://idleon.wiki/wiki/Changelog/2026
- https://idleon.wiki/wiki/Changelog/2025 (Arcane Cultist, v2.40, 2025-06-07)
- https://idleon.wiki/api.php?action=query&meta=siteinfo&siprop=rightsinfo&format=json
- https://store.steampowered.com/news/app/1476970/view/1846651706682419 (Lumi Menagerie, 2026-10-16)
- https://store.steampowered.com/news/app/1476970/view/1841579228678934 (Royal Guardian, 2026-08-25)
- https://github.com/Morta1/IdleonToolbox/blob/main/data/patch-notes.js
- https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/main/mysite/consts/progression_tiers.py
- https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/main/mysite/general/pinchy.py
- https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa
- https://steamcommunity.com/sharedfiles/filedetails/?id=3440291354
- https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc/edit
- https://gameslikefinder.com/article/idleon-character-creation-order/
- https://idleon.guide/subclasses/
- https://github.com/Sludging/idleon-efficiency
