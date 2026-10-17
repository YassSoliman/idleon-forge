# Community Meta Path guides: what Reddit and Discord actually share (2026-10-17)

Ticket: [#15](https://github.com/YassSoliman/idleon-forge/issues/15), items 5–6 only (the Discord and Reddit Meta Path guides), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). It follows [the Meta Path sources survey](https://github.com/YassSoliman/idleon-forge/blob/research/meta-sources/docs/research/2026-10-16-meta-sources.md) on branch `research/meta-sources`. Precedence follows [ADR 0004](../adr/0004-source-precedence.md). Terms follow [GLOSSARY.md](../../GLOSSARY.md).

**Current patch on the research date:** "Lumi Menagerie" (2026-10-16). Patch dates used below come from the wiki changelogs: v2.40 Arcane Cultist 2025-06-07, v2.41 Summoning Bosses 2025-07-06, World 7 2025-11-06 ([Changelog/2025](https://idleon.wiki/wiki/Changelog/2025)), Royal Guardian 2026-08-25 ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)). **None of the community guides below mentions Royal Guardian or anything later.**

## Answer

- **Nothing on Reddit or Discord is a maintained, current Meta Path.** Of the six most-shared links, two are years stale (the "IdleOn Guide Sheet", last version 2023-07-25, pre-W6; the "Talents guide", last change 2024-07-12, pre-Master-Class), one is an endgame calculator with no class advice (Antho and Arkh), and the "Mega Guide of Guides" is a link directory. **None mentions Royal Guardian (2026-08-25)**, which changes the slot plan.
- **Discord:** Reddit users point to the official server's **#tips-n-tricks** channel (a "master list of guides", one guide per master class, Bubba, weekly boss, arena) and to **pinned messages in each world's chat** (notably W7). No one in 12 months of r/idleon cites a pinned Discord **class-order** guide; the Discord guides are per-system. "Sangy's guide" is a 2-years-stale W1 walkthrough whose original link is dead (HTTP 410) and nobody mentioned it in the last year.
- **Slots 1–7 are settled; the order inside 1–6 mostly is not.** Every current source says: one each of Barbarian, Squire, Bowman, Hunter, Shaman, Wizard, then **Journeyman as the 7th**. Idleon Academy (2025-09-23) says "The first six can be in any order"; u/OG_Rokoma (2025-10-28) says 1–3 Warrior/Archer/Mage → DB/SB/AC, 4–6 Warrior/Mage/Archer → DK/ES/WW, "order doesn't matter" within each trio.
- **Slot 1 for W1–W3:** Warrior. Idleon Academy: "W1 → Warrior, W2 → Barbarian, W3 → Barbarian", switching to Elemental Sorcerer in W4–W5. The Incomplete Guide says "Warrior or Archer first" but calls the W2 pusher "your main pusher (Squire class)" and DK/ES the W4 pushers. Barbarian-first pusher vs Squire-first pusher is a real disagreement.
- **Slots 8–11 changed with Royal Guardian.** Pre-RG sheets (Iacchus, patch 2.41, 2025-07-06; Incomplete Guide, post-W7) say 2nd Divine Knight for Construction, then 2nd Arcane Cultist or 2nd Death Bringer, and call 2× Siege Breaker / 2× Elemental Sorcerer "old meta". Post-RG Reddit (2026-09-02 → 10-12) converges on **2 Royal Guardian** (the 2nd DK, now mastered), keeps 2nd AC vs 2nd DB vs 2nd ES disputed, calls 2nd SB/WW deprecated, and commonly **leaves the 11th slot as a Beginner**.
- **Per-world priorities, W1–W3, best sources:** Idleon Academy (one pusher only; accuracy is the gate; W1 Anvil/Stamps/Statues/Owl/Vault; W2 unlock all bubbles before sigils, skip Post Office and Obols, Distilled Water daily; W3 do the NPC tutorial quests, Squires on the cog board, Hunter for traps and TD) and the Incomplete Guide's W1–W4 tabs (Owl to Fractal 5, Amarok gear, Bobjoepickle ×100, traps and skulls for all, Exp cogs, merit-shop order).
- **Recommended primary Meta Path sources (all tier 3 under ADR 0004):** (1) **Iacchus's "Recommended Class Setups"** for the slot plan and its reasoning, *patched* by the post-RG Reddit consensus for slots 8–11; (2) **Idleon Academy** for slots 1–7 and the W1–W6 push; (3) the **Incomplete Guide** (shadowstorm) for per-world W1–W4 steps. AutoReview stays the per-world milestone source from the earlier survey.
- **Machine-readable:** only the sheets' text exports (CSV). The class plans in all three sheets are **images** (class icons with counts), so they must be transcribed by hand. Idleon Academy is slides; Reddit is prose.
- **Licences:** none of these sources states one. Treat all as all rights reserved: cite and re-derive, never copy.

## Source-by-source

### 1. "IdleOn Guide Sheet" (the "Uber Guide … W3–W5 skills")

- **Link:** [pubhtml](https://docs.google.com/spreadsheets/d/e/2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP/pubhtml). Tabs: INFO, Gems, Obols, Construction, Tower Defense, Pets, Sailing, Gaming, Divinity.
- **Maintainer:** the INFO tab says it "is a RipOff of the Original Guide made by 100mar / Rebuilt by SeannG97", crediting the original Guide Sheet authors (100mar, Owl, harold, anavn, cakesoup, Koneko Toujou, Puddles, rkinasz, Sparksen, Tony). The Tower Defense tab is "Updated by Granberg". The original 100mar sheet it links to, and the copy on the wiki's [External Resources](https://idleon.wiki/wiki/External_Resources), both return **HTTP 410**, so this rebuild is the surviving copy.
- **Last updated:** INFO says "Latest Version … 25/07/2023". Nothing in any tab mentions World 6 (released 2024-02-16) or later: no Summoning, Farming, Sneaking, Hole, Death Bringer, Spelunking.
- **Coverage:** W3–W5 account systems only (gem shop, obols, construction, TD, pets, sailing, gaming, divinity). No W1–W2 progression, no per-world push order.
- **Class order / Meta Path:** only an endgame "Ideal Class Setup" of 10 elite classes: 1 Blood Berserker, 2 Divine Knight, 1 Beast Master, 2 Siege Breaker, 1 Bubonic Conjurer, 2 Elemental Sorcerer, 1 Voidwalker. No creation order. This is the pre-Master-Class meta ("old meta" in source 4 below).
- **Machine-readable:** yes, tabular CSV per tab, but most recommendations are tier lists laid out visually, not records.
- **Licence:** none stated. It is itself a copy of another sheet; treat as all rights reserved, cite only.
- **Verdict:** heavily shared because the Reddit "Mega Guide of Guides" links it as the "Uber Guide", but it is **three years stale**. It is not a Meta Path source.

### 2. "Talents guide" ("Early game talent guides")

- **Link:** [pubhtml](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml). Tabs: Information, then one per class line (Mage, Shaman&Bubo, Wizzard&ES, Warrior, Squire&DK, Barbarian&BB, Archer, Bowman&SB, Hunter&BM, Journeyman, Maestro&Vman).
- **Maintainer:** "Made by Fibster from IttyBittyArmy / TETSU TOOK OVER".
- **Last updated:** its changelog has two entries, "24/06/23" and "12/07/24 – hunter rearanged". No Master Class tabs (Death Bringer arrived 2025-01-19, Wind Walker 2025-04-22, Arcane Cultist 2025-06-07), consistent with a last edit in July 2024.
- **Coverage:** talent point allocation per class for W1–W5-era classes ("Start with / Work towards / Extra points").
- **Class order / Meta Path:** a "Best 10 character slot set ups / I'd rather use top one" block, drawn as icons with counts. Setup #1: 2 Divine Knight, 2 Blood Berserker, 1 Siege Breaker, 1 Beast Master, 1 Bubonic Conjurer, 2 Elemental Sorcerer, 1 Voidwalker. Setup #2 swaps one Blood Berserker for a second Siege Breaker. No creation order, no per-world priorities.
- **Machine-readable:** partly. Talent names are text in CSV, but the class setups are images.
- **Licence:** none stated; cite only.
- **Verdict:** useful later for per-class talent advice (a separate Knowledge Base area), stale for class roster. Not a Meta Path source.

### 3. "Antho and Arkh's guide sheet"

- **Link:** [htmlview](https://docs.google.com/spreadsheets/d/1IcxwlHKPcw57PJxOWmtCJTP2Iv6ubdRSEwzMjbH476U/htmlview). Tabs: Landing, Idleon planner, Tome helper (Player tome), Spelunking (WIP), Summoning bosses, Gold food, Statues (WIP).
- **Maintainers:** "Made by Antho982 and Arkh"; gear pictures credited to AlmostPsycho's Sampling Sheet; links a [YouTube showcase](https://youtu.be/RMzGDY86mxM).
- **Last updated:** no date in the sheet. Content is W7-era: Spelunking bosses by depth, Tome scores, Arcane Cultist damage records, Grimoire upgrade levels. So it postdates 2025-11-06. No Royal Guardian.
- **Coverage:** endgame helpers (drop-rate sources still available, Tome gap finder, daily/weekly checklist, spelunking power/stamina thresholds).
- **Class order / Meta Path:** none.
- **Machine-readable:** yes (CSV), but it is a personal calculator that expects pasted Toolbox data.
- **Licence:** none stated; cite only.
- **Verdict:** irrelevant to W1–W3 and to class order. Possibly useful later for W7 thresholds.

### 4. "Idleon Incomplete Guide" (in-sheet title "IDLEON COMPLETE GUIDE SHEET")

- **Link:** [htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview). Tabs: INTRO, WORLD 1 … WORLD 7, Zenith Statues, DropRate Guide, Accuracy Guide.
- **Maintainer:** "MADE BY @shadowstorm2204" (Discord), "if the guide has some outdated information please ping me anytime in Idleon Discord server. All credits goes to the original guide makers and wiki editors!" Several sections are credited to others (the cooking section "MADE BY @_kuhaku").
- **Last updated:** no date. It mentions Zenith Statues and "W7 Spelunking's 6th Lore Boss", so it was edited after World 7 (2025-11-06). It does **not** mention Royal Guardian (2026-08-25). The WORLD 5, 6 and 7 tabs are headers only (115, 3,463 and 17 bytes of CSV); W1–W4 are written up.
- **Coverage:** W1–W4 prose walkthroughs plus W4 lab/breeding/cooking/Voidwalker details, merit-shop priorities per world, accuracy and drop-rate guides.
- **Class order / Meta Path:**
  - Endgame "IDEAL CLASS SETUP" (icons with counts): 1 Death Bringer, **2 Divine Knight** ("2 DK for construction"), 1 Wind Walker, 1 Siege Breaker, **2 Arcane Cultist**, 1 Elemental Sorcerer, 1 Voidwalker = 9 characters. "For the last 2 characters you either leave them beginners or choose whatever you want."
  - It links "Class setup Guide made by Iacchus" (source 4a) as the reasoning behind that setup.
  - **W1:** "I recommend going with Warrior or Archer first as it will be easier to push maps. (Dont worry you will have one of each class anyway)". Then Owl (Megafeathers to at least Fractal 5), Vault, stamps, Amarok gear "until late w5 or even world 6", anvil all points into speed producing Thread.
  - **W2:** reach the third map (Crab Cakes) and "unlock all your subclasses"; potions on "your main pusher (Squire class)"; golden statues; buy Bobjoepickle daily to 100 for W3.
  - **W3:** traps and skulls for everyone, Bottled World Town Teleport, "Amarok armor … for your Barbarian/Hunter" to push W3; Exp cogs; never equip Slush Skull.
  - **W4:** "push everyone to map 4 … and get your elite classes"; best pushers Divine Knight and Elemental Sorcerer ("If you struggle with damage … Divine Knight"); Blood Berserker for AFK.
  - Merit-shop priorities per world, numbered and explained (W1, W2, W4).
- **Machine-readable:** partly. Prose sits in cells, so per-tab CSV is clean text; class setups and tier lists are images.
- **Licence:** none stated; it openly reuses others' work. Cite only.
- **Verdict:** the most current all-worlds community walkthrough found, and the only one with explicit W1–W3 steps. But it is a single author's sheet, W5–W7 are unwritten, and it predates Royal Guardian.

### 4a. "Recommended Class Setups" by Iacchus (linked from source 4)

- **Link:** [htmlview](https://docs.google.com/spreadsheets/d/1dp-qoLsX8JxwvvwNM0GlpoVkOVcItb8J7aB5YRX7Ka4/htmlview). Tabs: Main, CLASSES.
- **Maintainer:** "Sheet created by: @iacchus_", thanks to Shadow and wheelonchair.
- **Last updated:** "recommended class setup as of **Patch 2.41, Summoning Boss update**" = 2025-07-06. It says "I recommend waiting for W7 release and information on extra class slots and future MCs", so it predates W7 and Royal Guardian.
- **Recommendation (icons identified from the xlsx export):**
  - **First 7 slots:** one Death Bringer, Arcane Cultist, Siege Breaker, Divine Knight, Elemental Sorcerer, Wind Walker and Voidwalker: "Your first 7 characters will include one of each main class and one secret class (Unlocking JMAN)." In W1–W3 terms that is one each of Barbarian, Shaman, Bowman, Squire, Wizard, Hunter, plus Journeyman.
  - **8th slot:** a second Divine Knight. "2nd DK will heavily benefit Construction, which takes a long time to complete."
  - **9th/10th:** a second Death Bringer ("double AFK bones to speed up Grimoire progression"), with a disclaimer that it breaks the 3/3/3 class split; or a second Elemental Sorcerer or Arcane Cultist ("2nd AC would become the meta choice … after we get AFK tachyons update").
  - Explicitly **demoted** as "old meta": 2× Siege Breaker and 2× Elemental Sorcerer, and second Wind Walker.
  - Explicitly **not recommended**: leaving two slots as Beginners or base classes to wait for future master classes.
- **Machine-readable:** no. The recommendation is icons over cells; reasoning is prose.
- **Licence:** none stated; cite only.
- **Verdict:** the clearest, reasoned slot plan in the community, and the one source 4 points to. **Outdated in one known way:** Royal Guardian (2026-08-25) is a Divine Knight master class, so the "2nd DK" slot now interacts with a master-class choice the sheet never considered.

### 5. Reddit "Mega Guide of Guides" (post 1m3pu0r) and its Google Doc

- **Links:** [Reddit post](https://www.reddit.com/r/idleon/comments/1m3pu0r/mega_guide_of_guides/) by u/OG_Rokoma, 2025-07-19, score 587, 48 comments; the author's [Google Doc copy](https://docs.google.com/document/d/e/2PACX-1vSGpDAO17pjrHDMXA4VHGjeAtBNRz5Y84qZqN9z7h_iUq4CfR0FJEdDou4SlZrNPc8BCRcYmE3w9p_E/pub) ("Updated automatically every 5 minutes"), posted in the thread on 2025-07-20.
- **Maintainer / dates:** OG_Rokoma edited the doc through 2025 ("Added sailing artifacts, killroy and greenstacks" 2025-07-21; "Started adding some W7 stuff in here" 2025-11-20). The doc's Master Classes section says "as of July 2025" and names only DB, WW and AC. The live doc contains no W7 or Royal Guardian content. The author asked mods to pin it (2025-07-23, 2025-12-13); there is no sign it was pinned.
- **Coverage:** a link directory (Toolbox, Efficiency, AutoReview, wiki, creators' videos per world W1–W6) plus FAQ and "common traps".
- **Class order / Meta Path:** none. Its only class advice: "DK is often considered the best class to push maps with"; ES for main-drop farming, DK for rare drops; "Don't make 2 VMan, there's no benefit to a second one".
- **Per-world priorities:** one-paragraph summaries per world (W1 "Do your stamps, do your Owl… statues… Anvil"; W2 Alchemy, "don't do sigils until you unlock all bubbles"; W3 refinery salt-lock, "3D printer is life", Equinox).
- **What it says about Discord:** a commenter (u/Machopeludo1, 2025-07-19) answers "No guide for Masterclass?" with "In lava's discord, there is a channel called tips and tricks, in there you have a guide for each masterclass!". This is the only direct description of Discord guide content found.
- **Machine-readable:** no. **Licence:** Reddit user content; cite only.
- **Verdict:** a directory, not a Meta Path. Its value is pointing to sources 1 and 2, AutoReview and the creators.

### 6. "Idleon Academy: The beginning" (Visme ebook)

- **Link:** [Visme](https://my.visme.co/view/dwonr73g-idleon-academy-the-beginning). 59 pages, "Idleon Beginner Guide, Chapter 1: The Real Start … By Nekow".
- **Maintainer:** Nekow, who says they are "active on the official IdleOn Discord, especially in the #w1-w2-questions channel" and offers account reviews.
- **Last updated:** the Visme project date is **2025-09-23**. It mentions bubbles "Up to Bubble 35 (World 7)" but no W7 content, no Royal Guardian.
- **Coverage:** "Phase 1: The Push, from World 1 to World 6". Per-world sections for W1 (Smithing, Stamps & Bribes, Statues), W2 (Alchemy, Post Office, Arcade, Obols, Ballot, Killroy, Weekly Boss), W3 (Refinery, Construction, Trapping, TD & Prayers, Smithy), W4 (Lab, Breeding, Cooking), W5 (Divinity, Gaming, Sailing).
- **Class order / Meta Path:**
  - "Your First 7 Characters … diversity over duplicates": Shaman and Wizard, Barbarian and Squire, Bowman and Hunter, then Journeyman. "**The first six can be in any order, it doesn't matter much. But the 7th character should be your Journeyman.**" Slots 8–10: "whatever plan fits your goals".
  - Pusher: "W1 → Warrior, W2 → Barbarian, W3 → Barbarian" (Monster Decimator doubles AFK kills); switch to **Elemental Sorcerer in W4–W5** (easy respawn, god linking, account-wide talent levels; 2 points in Polytheism to link Nobisect for 2× portal kills).
  - Priorities: one pusher only ("Not 5. Just one main"); accuracy is "the #1 barrier between World 1 and World 6" (talents, dungeons, Vault, Owl, Poppy, Shaquracy bubble via Barbarian's 3D printer of Bloach, cards, stones, stamps); W2: unlock all bubbles before sigils, skip Post Office and Obols early, buy Distilled Water daily; W3: don't skip the NPC tutorial quests, Squires only on the cog board, Hunter for trapping and TD; W4: daily chip and jewel purchases, everyone else in the Lab on Killer's Brightside; W5: Bear god then Goat god.
- **Machine-readable:** no (Visme slides; text is extractable from the embedded JSON, but it is prose).
- **Licence:** none stated; Visme default (all rights reserved). Cite only.
- **Verdict:** the **best W1–W3 beginner source** in this set: dated, written by a Discord helper, and explicit about the first seven slots and the pusher. It is opinion (tier 3) and a year old.

### 7. "Sangy's guide" and the Discord guide channels

- **Sangy's Newbie Guide** ([original](https://docs.google.com/document/d/1oB_eSa2_4l3Og1dxZp03fDZ_NVyfUzomChYy36Orx9M/edit), linked from the wiki's External Resources) returns **HTTP 410**. The [backup copy](https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc/edit) is by "Sangy#5166 & waktu#6400" and opens with "This guide hasn't been updated in 2 years". It is a W1 questline walkthrough. Its only class advice: "Endgame dudes recommend Warrior first because it's the strongest class early on". It points to a separate Discord (`discord.gg/cTRHYNBwNU`), not the official one.
- **Official Discord guide channels (inferred from Reddit, not read):** Reddit users consistently point to one channel, **#tips-n-tricks** ("Tips N Tricks", "tips and tricks") on the official server (`discord.gg/idleon`), as holding the community guides:
  - "a master list of guides … Lots of guides in there that are more up to date" (u/Kazu2324, [2025-10-12](https://www.reddit.com/r/idleon/comments/1o4hqq1/comment/nj2fae3/));
  - "a guide for each masterclass … search the name abbreviation (DB, WW, AC)" (u/Virth, [2026-08-01](https://www.reddit.com/r/idleon/comments/1vcnxak/comment/p14d5ut/)); earlier the same in [2025-07-19](https://www.reddit.com/r/idleon/comments/1m3pu0r/comment/n3z5w1k/) under the Mega Guide;
  - named guides: the AC guide (u/OG_Rokoma, [2025-10-21](https://www.reddit.com/r/idleon/comments/1mak9vq/comment/nkjyk3g/)), the Deathbringer guide ([2026-05-07](https://www.reddit.com/r/idleon/comments/1t6qh3l/comment/okjlryi/)), the "Bubba Clicker Guide" ([2026-01-13](https://www.reddit.com/r/idleon/comments/1qc2oqw/comment/nzf2u1b/)), weekly boss, arena/territory battles ([2026-08-22](https://www.reddit.com/r/idleon/comments/1vuxmiv/comment/p54vxg7/)), opal distribution, and a link to AutoReview ([2026-07-12](https://www.reddit.com/r/idleon/comments/1uu9l54/comment/ox1zubn/)). One user linked a guide thread in it as `discord.com/channels/437797104786604034/1447807595644719225` ([2025-12-13](https://www.reddit.com/r/idleon/comments/1plq1nu/comment/ntupkqs/)).
  - The other recurring pointer is **pinned messages in each world's chat channel**, especially the W7 chat ("a massive pinned guide in the W7 chat", [2026-05-10](https://www.reddit.com/r/idleon/comments/1t98nsz/comment/ol2yqrc/); "pinned messages for each world's channel", [2026-08-21](https://www.reddit.com/r/idleon/comments/1vusqau/comment/p545lhw/)), the endgame chat (research tier list, [2026-04-01](https://www.reddit.com/r/idleon/comments/1s8w75i/comment/odniwn6/)), and #w1-w2-questions (Nekow, source 6; a Poppy guide per its ebook).
  - **No Reddit comment in 2025-10 → 2026-10 names a pinned class-order or Meta Path guide on Discord.** Nobody cites "the Discord guide" for character order; Discord guides are per-system and per-master-class. The only Discord-sourced class rule quoted is "Lava has said (its pinned on discord somewhere) that 3 of a class is a nono and will mess with coding" (u/Lystian, [2026-09-02](https://www.reddit.com/r/idleon/comments/1w59vpd/comment/p7dw1h0/)), unverified.
  - Searching the archive for "Sangy", "iacchus" and "shadowstorm" over 2025-10 → 2026-10 returned **zero** comments (some monthly windows failed on rate limits: Sangy Nov 2025 and Feb 2026, iacchus Nov 2025). Sangy's guide is not part of the current conversation.
- **Recent Reddit class-roster threads (tier 3, dated):**
  - [2025-10-28](https://www.reddit.com/r/idleon/comments/1oin967/) (post-W7-preview, pre-W7): u/OG_Rokoma: "1-3 (order doesn't matter) – warrior, archer, mage, eventually becoming DB, SB and AC; 4-6 (again, order doesn't matter) – warrior, mage, archer, eventually becoming DK, ES and WW; 7 – beginner, eventually becoming a voidwalker". "A second DK is fairly universally agreed on due to Construction." u/Reglub agrees ("Divine Knight is absolutely the best class to get a 2nd of"). Another commenter points to source 1's front page.
  - [2025-12-27](https://www.reddit.com/r/idleon/comments/1px7bbr/comment/nw8zhof/): "the meta is 1 of each Master Class, plus 2 DK, 2 ES, 2 SB, and 1 VMan" (the older meta still being repeated).
  - [2026-02-26](https://www.reddit.com/r/idleon/comments/1rf9tjb/comment/o7ie03o/): "Don't make secret class till 7th character was the meta (unsure if it still is)".
  - [2026-09-02](https://www.reddit.com/r/idleon/comments/1w59vpd/) (one week after Royal Guardian): a player with 11 slots; replies converge on **2 Royal Guardian**, "keep 11th as beginner", "second siege breaker is not helpful"; one full list: "2 ES, 2 DB, 2 RG, 1 AC, 1 WW, 1 SB, 1 VW and 1 Beginner". 2nd AC vs 2nd DB vs 2nd ES is argued both ways; 2nd SB and 2nd WW called "old meta".
  - [2026-09-14](https://www.reddit.com/r/idleon/comments/1we5y9c/comment/p9nvb0c/): "you won't regret picking a Royal Guardian(Divine Knight). Second Arcane Cultist and Second Deathbringer are strong choices. Recommendations to pick second Siege Breaker or second Elemental Sorcerer are deprecated."
  - [2026-10-02](https://www.reddit.com/r/idleon/comments/1ww0c2u/): "2 royal guardians 2 death bringers 2 arcane cultists 1 secret class and people are saying leave the 11th guy blank for now"; "Royal Guardian is without a doubt the best class to have 2 of, and it's not even close" (u/Reglub); 2nd DB disputed ("only the 2nd DB's kills 'count'" for Wow/Chow kills).
  - [2026-10-12](https://www.reddit.com/r/idleon/comments/1x46ezk/comment/pfijef3/): "You'll want 3 Sword guys, 3 Magic guys, 3 Bowmen, 1 Secret Class. Most people make their 7th-10th character the Secret class."

## Comparison with the `research/meta-sources` finding

The earlier survey said slots 1–6 are Barbarian, Bowman, Shaman, then Squire, Hunter, Wizard, then Journeyman 7th, settled by agreement of the wiki (a 2022 sentence), a 2025 Steam guide and Games Finder, with duplicates disputed.

- **Slots 1–6: confirmed as a set, and the 1–3 / 4–6 split is corroborated, but the order within each trio is not.** u/OG_Rokoma's 2025-10-28 plan is exactly the earlier split (1–3 become DB/SB/AC = Barbarian/Bowman/Shaman; 4–6 become DK/ES/WW = Squire/Wizard/Hunter), with "order doesn't matter" inside each trio. Idleon Academy (2025-09-23) goes further: "The first six can be in any order." Iacchus and the Incomplete Guide only say "one of each main class". So the Knowledge Base should store the trio split as a **soft** recommendation and slot 1 = Warrior → Barbarian as the stronger claim (Academy, Sangy, the wiki sentence and the Steam guide agree; the Incomplete Guide allows Archer).
- **Slot 7 = Journeyman: confirmed** by Academy, Iacchus, OG_Rokoma and a 2026-02 comment ("was the meta (unsure if it still is)"). One 2026-10-12 comment says "most people make their 7th-10th character the Secret class", a looser reading.
- **Duplicates: no longer just "disputed"; they moved.** The earlier survey's newest source (shnaps' gist, 2026-09-18) had 2 DK, 2 ES, 2 SB, with a "Griffy, Aug 2026" alternative of 2 DK, 2 DB, 2 AC. The community sheets (2025) already dropped 2 SB / 2 ES as "old meta", and post-RG Reddit (2026-09 → 10) agrees on **2 RG** (= the 2nd DK, mastered), with 2nd AC / 2nd DB / 2nd ES still argued. The Griffy alternative is the closer match to current consensus; the gist's main plan is behind it.
- **11th slot: now confirmed as existing in practice.** Post-RG threads describe players with 11 characters and advise "keep 11th as beginner". The Incomplete Guide's 9-character setup plus "for the last 2 characters you either leave them beginners or choose whatever you want" implies the same 11. The unlock requirement is still unverified (the earlier survey's Family Level 5000 vs AutoReview conflict stands; check Toolbox data).
- **Discord gap: partly closed.** We now know *where* Discord keeps guides (#tips-n-tricks and per-world pins), and that Reddit never cites a Discord class-order guide. Reading the pinned guides themselves still needs a logged-in human.

## Method

Read-only, 2026-10-17. Every sheet was read in full: tab lists from the `pubhtml`/`htmlview` pages, then every tab as CSV (`/pub?gid=…&single=true&output=csv` for published sheets, `/export?format=csv&gid=…` for shared ones). Class recommendations in these sheets are drawn as class **icons**, not text, so the icons were downloaded (from the `htmlview` page, or from the sheet's `export?format=xlsx` drawing anchors) and identified by eye against the class art; the cell they sit in and the `x1`/`x2` counts beside them were matched by grid position. The Visme ebook's text was extracted from the `project_data` JSON embedded in its player page. Reddit was read through the [Arctic Shift](https://arctic-shift.photon-reddit.com/) archive API (`/api/posts/ids`, `/api/comments/search?link_id=…`, and monthly `/api/comments/search?subreddit=idleon&body=…` windows from 2025-10 to 2026-10, because wider windows time out). Discord was not opened: it needs a login, which the read-only rule forbids; what Discord pins was inferred only from what Reddit users and the guides themselves say about it.

## Sources

- IdleOn Guide Sheet (SeannG97 rebuild): https://docs.google.com/spreadsheets/d/e/2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP/pubhtml
- Original Guide Sheet by 100mar (HTTP 410): https://docs.google.com/spreadsheets/d/e/2PACX-1vSnlrC_6oW7P89Os4uECnEB_XOVr6TlPa-QhTC62DrtLnRkzQi1UAMnrEZassEaAQb6Cr3TEZAiSVvz/pubhtml
- Talents guide (Fibster / Tetsu): https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml
- Antho and Arkh's guide sheet: https://docs.google.com/spreadsheets/d/1IcxwlHKPcw57PJxOWmtCJTP2Iv6ubdRSEwzMjbH476U/htmlview
- Idleon Incomplete Guide (shadowstorm2204): https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview
- Recommended Class Setups (iacchus_): https://docs.google.com/spreadsheets/d/1dp-qoLsX8JxwvvwNM0GlpoVkOVcItb8J7aB5YRX7Ka4/htmlview
- Mega Guide of Guides (Reddit, OG_Rokoma, 2025-07-19): https://www.reddit.com/r/idleon/comments/1m3pu0r/mega_guide_of_guides/ (read via https://arctic-shift.photon-reddit.com/api/posts/ids?ids=1m3pu0r)
- Mega Guide of Guides (Google Doc): https://docs.google.com/document/d/e/2PACX-1vSGpDAO17pjrHDMXA4VHGjeAtBNRz5Y84qZqN9z7h_iUq4CfR0FJEdDou4SlZrNPc8BCRcYmE3w9p_E/pub
- Idleon Academy: The beginning (Nekow, Visme, 2025-09-23): https://my.visme.co/view/dwonr73g-idleon-academy-the-beginning
- Sangy's Newbie Guide (HTTP 410): https://docs.google.com/document/d/1oB_eSa2_4l3Og1dxZp03fDZ_NVyfUzomChYy36Orx9M/edit ; backup: https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc/edit
- Wiki External Resources (last edit 2025-05-07): https://idleon.wiki/wiki/External_Resources
- Wiki Royal Guardian (Divine Knight master class): https://idleon.wiki/wiki/Royal_Guardian
- Wiki changelogs: https://idleon.wiki/wiki/Changelog/2025 , https://idleon.wiki/wiki/Changelog/2026 , https://idleon.wiki/wiki/Changelog/2024
- Reddit threads (dates in the text): https://www.reddit.com/r/idleon/comments/1oin967/ , https://www.reddit.com/r/idleon/comments/1w59vpd/ , https://www.reddit.com/r/idleon/comments/1ww0c2u/ , https://www.reddit.com/r/idleon/comments/1we5y9c/comment/p9nvb0c/ , https://www.reddit.com/r/idleon/comments/1x46ezk/comment/pfijef3/ , https://www.reddit.com/r/idleon/comments/1px7bbr/comment/nw8zhof/ , https://www.reddit.com/r/idleon/comments/1rf9tjb/comment/o7ie03o/
- Arctic Shift API: https://arctic-shift.photon-reddit.com/api/comments/search?subreddit=idleon&body=tips%20and%20tricks&after=2025-10-01&before=2025-11-01&limit=100 (and the same per month and per term)
