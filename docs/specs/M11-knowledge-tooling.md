# M11 Knowledge tooling

Spec for [#39](https://github.com/YassSoliman/idleon-forge/issues/39), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready**. Section 8 was ruled by Yasser on 2026-10-17 (every recommendation accepted), and the red-team pass is logged in section 10.

It builds on these resolutions. Terms come from [`GLOSSARY.md`](../../GLOSSARY.md).
- [#11 Knowledge Base shape and authoring pipeline](https://github.com/YassSoliman/idleon-forge/issues/11): the 7 entry types, YAML plus TypeScript Detectors, required fields, ranking, Stage, Contested, staleness, the pipeline, golden snapshots and versioning.
- [ADR 0007](../adr/0007-generated-facts-authored-judgment.md): game facts are generated, judgment is hand-written.
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [ADR 0004](../adr/0004-source-precedence.md) (source precedence), [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers, no formulas of our own).
- [#14 Architecture](https://github.com/YassSoliman/idleon-forge/issues/14) (packages, tests, the weekly parser sync), [#17 LLM use](https://github.com/YassSoliman/idleon-forge/issues/17) (offline rule mining, the staleness pass), [#13 MVP cut](https://github.com/YassSoliman/idleon-forge/issues/13) (the done bar), [#26 the Leverage model](https://github.com/YassSoliman/idleon-forge/issues/26) (10 Stages, the Priority List frame) and [#27 priority verification](https://github.com/YassSoliman/idleon-forge/issues/27) (the confirmed / corrected / contested / unverified legend).

---

## 1. Purpose

Players never see M11 directly, but everything they read comes through it. It is the machinery that keeps ActiveOn's advice **correct, cited and current** across a game that patches every 1–2 weeks. Each Next Action on the Now screen must trace back to a Knowledge Base entry with a Source and a patch tag. The game's numbers (kill Milestones, costs, unlock levels) must come from the game's own data, refreshed automatically when the parser fork re-syncs, never from a guide someone copied months ago. When a Source is old, ActiveOn has to say so. When Sources disagree, it has to show both sides. And Yasser and Joseph must be able to see, before any change merges, exactly how it changes the advice on their own accounts. M11 delivers the Knowledge Base package and its schema, the Detector contract, the fact generator, CI validation, the scrubbed fixtures and golden Now-screen snapshots, and the agent authoring and red-team workflow that fills the Knowledge Base.

## 2. Scope / Out of scope

**In scope**
- `packages/knowledge`: the entry schema (zod), the System registry, authored YAML, generated fact JSON, the Detector interface and registry, the template renderer, staleness and version helpers, and the compiled runtime bundle.
- `packages/kb-tools` (dev only, never shipped): the `kb` CLI with `generate`, `compile`, `check`, `golden`, `scrub`, `facts` and `new`.
- Fact codegen from Toolbox's `data/website-data` (plus a few exported parser constants) at every parser re-sync.
- CI validation: schema, references, Sources, Detector examples, generated-file freshness, golden snapshots and the privacy gates.
- The scrubbed-fixture tool and the committed scrubbed fixtures.
- The golden Now-screen snapshot format and its harness.
- Knowledge Base versioning, the manifest that drives "What's new: advice changes", and the Report-this context payload.
- The agent authoring, red-team, player-review, staleness-pass and rule-mining workflows, step by step.

**Out of scope**
- The **contents** of the Knowledge Base: which Goals, Checks, Priority Lists, Builds and Acquisitions exist. Those are written by M2–M9 and the authoring pipeline, using #26 and #27. This spec includes one example entry per type only to fix the shape; the examples are illustrative, not shipped content.
- The ranking **algorithm**'s implementation, Verdict logic, Purpose derivation and Visit Order. Those live in `packages/engine` and are owned by M2–M9. M11 fixes only the data contract the ranking consumes (TR-12).
- Stage derivation. M2 owns `STAGES` and the Stage Detector. M11 consumes the Stage list as a type.
- Rendering on the Now screen (M10), the "What's new" UI and the footer (M10/M12), and Report-this delivery (M13).
- Any LLM at advice time (ADR 0002). Any game formula of our own (ADR 0005).
- Worlds 5–7 content, a public contributor portal, and translation.

## 3. Functional requirements

**Entries and schema**
- **FR-1** Every entry is one of seven types: `goal`, `contribution`, `check`, `priority` (Priority List), `build`, `acquisition` or `metapath` (Meta Path). An entry of any other type fails `kb check`. Fact tables (TR-2a) are not entries: they hold game facts that entries and Detectors read, so the seven types stand.
- **FR-2** Every entry has `id`, `system`, `type`, `title`, `text` (a template with slots), `why`, `sources[]` (at least one), `appliesTo`, `confidence` (H/M/L) and `status` (active / contested / retired). A missing or empty field fails CI, and the error names the file, the line and the field.
- **FR-3** Every Source has an https URL, a title, an ADR 0004 tier (1–4), a verified date and the game version it was verified on. Tier 2 and tier 3 Sources must also carry `claimDate`, the date of the claim itself, not the page (#3). A tier 1 Source must be a permalink to game data: a Toolbox file at a 40-character commit sha. Our own dossiers are cited as tier 4 for the write-up, next to the tier 1 Toolbox link they rely on (red-team R17).
- **FR-4** Entry ids are unique across authored and generated entries, follow `<system>.<type>.<slug>`, and their middle segment matches `type`. System ids and slugs are lower-case kebab. Detector ids follow `<system>/<name>` and fact table ids `<system>.fact.<slug>` (TR-2a). These three formats bind every module spec (M2–M9 were aligned to them in the 2026-10-17 consistency pass).
- **FR-5** Every id an entry references (`extends`, `goal`, Priority List tiers, `replacedBy`, Acquisition `requires`) resolves to an existing entry of an allowed type. A Priority List cannot reference a retired entry. A dangling reference fails CI.
- **FR-6** An entry with `status: contested` carries at least two `contested.sides`, each with its own Sources. A contested entry can never be a Check with `effect: blocker`; CI rejects that combination.
- **FR-7** A Check with `effect: blocker` (a Verdict blocker) needs `confidence: H` and at least one tier 1 or tier 2 Source (game data or code, or a wiki edit made after the patch; D3). CI enforces it.
- **FR-8** Priority Lists hold ordered tiers of entry ids (ties allowed) and contain no numeric weight, score or rank field anywhere. Any unknown key fails CI (strict schema).

**Detectors**
- **FR-9** Every `detector.id` in YAML resolves to a registered Detector of the kind that entry type needs, and the entry's `params` pass that Detector's params schema. Ids resolve against two registries: the Knowledge Base registry (`packages/knowledge/detectors`) and the engine registry of **engine Detectors** (`kind: 'engine'`, `packages/engine`, TR-4), whose output shape is defined by their module spec (M2 Stage, roster and pusher; M5 options; M7 spend lines).
- **FR-10** Every registered Detector, in either registry, is referenced by at least one entry. An orphan Detector fails CI.
- **FR-11** Every Detector declares at least one `fires` example and one `silent` example, and at least one of the two is a real save (public or scrubbed) rather than a mutated one. A generic test runs every example, and the job fails if any result differs from what the example declares.
- **FR-12** A Detector is deterministic. It gets the same result twice in a row on the same input. It throws if it touches `Date`, `Math.random`, `performance` or a global. It reads only the Account State fields it declares in `reads`, and a tracking proxy in tests enforces that.
- **FR-13** A Detector that can't tell from the data returns `unknown` for that subject. It never guesses `fires` or `silent`. If a Detector throws at runtime, the engine records `unknown` for that entry, and a CI test still catches the throw before merge. Only a throw in a blocker Check's Detector makes the Verdict Unknown (`affectsVerdict`, TR-2b); any other throw drops that entry's line and is counted in the footer (M10 FR-39, M6 R9).

**Generated facts (ADR 0007)**
- **FR-14** `kb generate` rebuilds every generated entry from the pinned Toolbox data. It runs at the end of `pnpm sync-parsers`, and its output is committed to `packages/knowledge/generated/`.
- **FR-15** CI regenerates the facts and fails if the committed output differs ("generated facts are out of date; run `pnpm kb generate`").
- **FR-16** A generated entry's Source is tier 1. Its URL points to the Toolbox file at the pinned commit, and its verified date and game version come from `UPSTREAM`.
- **FR-17** In authored YAML, a numeric literal equal to a value in a generated fact or fact table that the entry references fails CI ("hand-copied fact; use a slot"). Authored Acquisitions can't carry `chance`, and authored Goals that `extend` a generated Goal can't redefine `milestones`.
- **FR-18** `kb generate` prints a fact diff (added, removed, changed ids with old → new values, identical changes grouped across entries, and possible renames) for the sync PR body. A generator that fails, or that drops an id an authored entry still references, never blocks the parser update: its last good output is **held** (TR-10), the sync PR stays mergeable, and the held facts are labelled with their older game version until the hold is cleared.

**Lifecycle**
- **FR-19** An entry is **Stale** when its newest authored Source's game version is 10 or more game versions behind the current one, counted on the deduplicated patch list (TR-11), or when the staleness pass has flagged it (`stale:` block). Only the entry's own Sources count (plus, for a contested entry, its sides' Sources); a generated Source inherited through `extends` never makes an authored entry fresh. Generated entries are never Stale by age, because they are rebuilt at every sync.
- **FR-20** Stale entries are still served. They rank below fresh entries at the same Priority List position and carry a Stale flag for the UI.
- **FR-21** `retired` entries are kept in YAML, which keeps their ids resolvable for old reports, but they are excluded from the runtime bundle. `retired.replacedBy` maps old ids to new ones.
- **FR-22** The compiled bundle carries a Knowledge Base version `YYYY.MM.DD[.n]` plus a content hash, a manifest (`id → content hash`) for every active and contested **authored** entry, and a `retired` map (`id → {title, replacedBy}`) for retired authored entries. A content hash covers what a player sees (text, why, values, milestones, tiers and the facts the entry extends), never provenance (`verified` dates, Source URLs, `generatedBy`), so a sync that moves no fact changes no hash.
- **FR-23** `diffManifests(old, new)` returns the authored entries that were added, changed and retired between two versions, with their titles (retired titles come from the `retired` map), for "What's new: advice changes". Generated ids never appear in it (D5).
- **FR-24** The System registry lists every System in scope for the MVP. `coverage(state)` returns the unlocked Systems that have no active or contested authored entry, for "Not covered yet: …". Generated facts alone never count as coverage and never appear on the Now screen by themselves; they are used only through authored entries that reference them (D5).

**Fixtures and goldens**
- **FR-25** `kb scrub` turns a private "Copy for support" export into a fixture with character names replaced by `Char1…CharN`, other players' names replaced by pseudonyms (`Member1…`, `Opponent1…`) or blanked, account identifiers removed, and no string left that a value-checked policy rule doesn't cover. Toolbox's full parse of it must match the original's, outside a declared list of scrubbed paths that no Account State field may read (TR-14).
- **FR-26** `kb golden` renders a deterministic golden snapshot per fixture (public, scrubbed, and private when present). CI fails when a committed golden differs from the rendered one. `kb golden -u` rewrites them.
- **FR-27** No scrubbed fixture, golden, YAML entry or Detector example contains a real character name, guild name, other player's name, account id or email. The local denylist gate (seeded automatically by every scrub) and the CI gates enforce it: the structural gate on scrubbed fixtures, and the golden slot check (every string slot in a golden is a `_lookups` value or matches `^C\d+$`). Toolbox's public saves are already public and exempt; they never feed a golden's text except through slots that pass that check.

**Workflow**
- **FR-28** A Knowledge Base PR can't merge without: a green `kb check`, updated goldens, a red-team review with no open blocking findings when the PR changes authored entries or Detectors (a sync PR that only regenerates facts and goldens needs none; its fact diff and `## Verdict changes` go to player review instead), run by the stronger model when the PR adds or changes a Verdict blocker or a Stage Priority List (D7), and approval from Yasser or Joseph through CODEOWNERS on the paths Joseph co-owns: the YAML entries, generated facts and goldens under `packages/knowledge/`, and `fixtures/scrubbed/`. Either one's approval is enough there (D6). `packages/knowledge/{detectors,generators,src}` need Yasser (Final rulings RT-4).
- **FR-29** `entryReportFields(output)` (renamed from `reportContext()`, so that only M13 uses the name `ReportContext`) returns exactly `{entryIds, detectorIds, fieldPaths, stale, contested}` and nothing else: the provenance part of M13's `ReportContext` (M13 TR-3). Versions come from M12's `BuildInfo`, the Stage from M2, and class and level from M1's `accountReportFields(state)`. What leaves the device is only M13's `SuggestionContext` (ADR 0008).

## 4. User stories

Fixture ids: `scrubbed-w2` (Yasser's save, W2-late, 5 characters) and `scrubbed-w3` (Joseph's save, W3-early, 6 characters, two Squires) are the scrubbed fixtures (TR-14). They are shorthand for the dated ids `scrubbed-w2-2026-10` and `scrubbed-w3-2026-10` (D4). Joseph has consented (relayed by Yasser on 2026-10-17, M1 Final rulings D1), so `scrubbed-w3` is committed in the PR that adds it, which records that consent (D1). Until that PR merges, the stories that use it run locally as `private:joseph-w3` and are reported as skipped in CI. `highend`, `fresh` and the other public ids are Toolbox's public saves. Unless a story says otherwise, "engine runs" means at the fixture's `now`, with an Expected Return of 8 h and no save history.

**US-1: every piece of advice is cited.**
As a player in a Play Session, I want every Next Action to show where it came from, so that I can trust it or check it myself.
- **Given** `scrubbed-w2` **When** the engine runs **Then** every Next Action line in the golden carries at least one Source label with its tier and game version, and every one of those Sources has an https URL.
- **Given** an entry whose `sources` list is empty **When** `kb check` runs **Then** it fails with `systems/<file>.yaml:<line> <id>: sources must have at least 1 item`.

**US-2: old advice is flagged, not hidden.**
As a player in a Play Session, I want advice from an old patch marked Stale and placed below fresh advice, so that I don't follow superseded mechanics with full confidence.
- **Given** `scrubbed-w2`, plus a test Knowledge Base in which entries A and B share a Priority List tier, A's newest Source is 10 game versions old and B's is current **When** the engine runs **Then** B ranks above A, and A's line in the golden shows `[stale]`.
- **Given** the same A, re-verified with a new Source dated on the current game version **When** the engine runs **Then** A is no longer Stale.

**US-3: disagreements are shown honestly.**
As a player in a Play Session, I want advice the community disagrees on to show both sides, so that I can choose, and never get it as my top action or a reason I can't log off.
- **Given** `scrubbed-w3` and a contested Priority List item (for example the first Gem Shop buy, `gemshop.goal.first-buy`, a Goal with `status: contested`) **When** the engine runs **Then** the golden shows it with `[contested]` and both sides' text and Sources, and it is never in position 1 of any character or of the Account section. *CI variant:* the same on `scrubbed-w2`, with the item placed at position 1 of the W2-late list.
- **Given** a Check with `effect: blocker` and `status: contested` **When** `kb check` runs **Then** it fails with "a contested entry cannot be a Verdict blocker".

**US-4: game numbers stay right after a patch.**
As a player in a Play Session, I want kill Milestones and costs to match the current game, so that "next Milestone at 100k" is true today.
- **Given** a parser sync whose Toolbox data changes one Death Note rank threshold (synthetic data slice in the generator test) **When** `kb generate` runs **Then** `generated/death-note.json` changes that threshold in every ladder that uses it, the fact diff lists it once as a grouped change ("104 entries: milestone 2, 100000 → 120000"), and the `scrubbed-w3` golden (CI variant: `scrubbed-w2`) shows the new Milestone, with no authored YAML edited.
- **Given** an authored entry that references a generated id the new data no longer produces **When** `kb generate` runs in the sync PR **Then** the generator's previous output is held, the PR body names the authored file and id under "Held facts", and the parser update stays mergeable.

**US-5: ActiveOn says what it doesn't know.**
As a player in a Play Session, I want a list of the unlocked Systems ActiveOn has no advice for yet, so that I don't mistake silence for "nothing to do".
- **Given** `scrubbed-w3`, and a registry in which Trapping is unlocked on the account but has no active entries **When** the engine runs **Then** the golden's Account section ends with `Not covered yet: Trapping`. *CI variant:* `scrubbed-w2` with a registry in which a W2 System it has unlocked has no entries.
- **Given** `scrubbed-w2` (Post Office not unlocked) and no Post Office entries **When** the engine runs **Then** Post Office is not listed.

**US-6: I know which advice version I am on.**
As a player in a Play Session, I want the Knowledge Base version shown, so that a report or a chat with Joseph refers to the same advice.
- **Given** injected git metadata in which the newest commit touching `packages/knowledge/` is dated 2026-10-17, the second such commit that day **When** the deploy build compiles the bundle **Then** `kbVersion.display` is `knowledge 2026.10.17.2`. Goldens never show the date version; their header shows the content hash only (TR-15), so a merge never turns them red.

**US-7: advice changes are announced.**
As a player in a Play Session, I want "What's new" to list the advice that changed since my last visit, so that I'm not surprised when a Next Action changes.
- **Given** manifest A (stored by the app at the last visit) and bundle B, in which entry X's text changed, Y was added and Z was retired **When** `diffManifests(A, B)` runs **Then** it returns `{added: [Y], changed: [X], retired: [Z]}` with their titles.

**US-8: reporting wrong advice leaks nothing.**
As a player in a Play Session, I want "Report this" to send just enough to fix the entry, so that I can report freely without sharing my account.
- **Given** `scrubbed-w2` and a Next Action on character 2 produced by entry X **When** `entryReportFields()` runs for it **Then** the payload's keys are exactly `entryIds, detectorIds, fieldPaths, stale, contested`, and no value matches any `charNames` entry of the fixture. (The full report is M13's `SuggestionContext`; M13 US-3 tests it end to end.)

**US-9: no wrong Verdict blocker reaches us.**
As a player in a Play Session, I want every change to Verdicts reviewed on my own account before it ships, so that "Fix before you leave" is never wrong (the #13 done bar).
- **Given** a PR that changes a blocker Check **When** CI runs **Then** it fails until the goldens are updated, and the CI job summary (`$GITHUB_STEP_SUMMARY`, from `kb golden --diff-base origin/main`) lists every changed Verdict on every scrubbed fixture under `## Verdict changes`, before any other diff.

**Contributor stories** (they protect the player stories above)
- **US-10.** As a Knowledge Base contributor, I want to add a Detector and see right away whether it fires where it should. **Given** a new Detector with `examples.fires` on `scrubbed-w2` and no `silent` example **When** `kb check` runs **Then** it fails with "detector <id>: needs at least one silent example".
- **US-11.** As the owner of a private save, I want to turn it into a public fixture without leaking anything. **Given** `fixtures/private/<x>.raw.json` and a denylist **When** `pnpm kb scrub fixtures/private/<x>.raw.json --id scrubbed-wN` runs **Then** the output's `charNames` are `Char1…CharN`, no string from the denylist appears anywhere in it, the unknown-string scan is empty, and the parse-equivalence check passes. **Given** a save with a new, unreviewed string field **When** the scrub runs **Then** it stops and names the field path.

## 5. Technical requirements

### TR-1 Package layout and boundaries

```
packages/knowledge/                     runtime package, imported by packages/engine
  systems.yaml                          System registry (TR-9)
  systems/<system>.yaml                 authored entries, one file per System
  generated/<system>.json               generated fact entries (committed, never hand-edited)
  generated/<system>.facts.json         generated fact tables (TR-2a; committed, never hand-edited)
  systems/<system>.facts.yaml           authored tier-2 fact tables, each with a cited Source (TR-2a)
  generated/_patches.json               ordered game versions from Toolbox patch notes
  generated/_lookups.json               validation tables: talent, item, monster, map, class names (not shipped)
  detectors/<system>/<name>.ts          Detectors, one per file, plus a co-located <name>.test.ts if needed
  detectors/index.ts                    the registry: `export const detectors = {...} satisfies DetectorRegistry`
  generators/<system>.gen.ts            fact generators (run in Node only, never bundled)
  src/schema.ts                         zod schema (TR-2)
  src/types.ts                          z.infer types, Detector types (TR-4)
  src/template.ts                       template parser and renderer (TR-6)
  src/stale.ts, src/version.ts, src/coverage.ts, src/report.ts
  src/index.ts                          runtime surface: loadKnowledge(), render(), isStale(), coverage(), diffManifests(), entryReportFields()
  dist/knowledge.json                   compiled bundle (build output, gitignored)
  golden/<fixture>.md                   committed goldens for public and scrubbed fixtures (data only, never bundled;
                                        here so they sit under the co-owned path, D6); their `## Now` section is
                                        M10's renderNowText output (TR-15)
  majors.yaml                           game versions that count as major patches (TR-11, D2)
packages/kb-tools/                      dev only, private, never imported by apps/*
  src/cli.ts                            `pnpm kb <command>`
  src/generate.ts, compile.ts, check.ts, golden.ts, scrub/*.ts   (the golden harness lives here; it only writes into knowledge/golden/)
fixtures/scrubbed/<id>.json             committed scrubbed fixtures
fixtures/scrubbed/<id>.meta.json        their metadata (TR-14)
fixtures/private/                       gitignored: real saves, denylist.txt, golden/<id>.md
```

- **Dependency direction:** `account-state` ← `knowledge` ← `engine` ← `apps/activeon`. `kb-tools` depends on all of them plus `toolbox-parsers`. `knowledge` must not import `engine`, and nothing under `apps/` may import `kb-tools`. Biome `noRestrictedImports` enforces both rules.
- `kb-tools` is a seventh package beyond #14's table. It keeps the Node-only dependencies (`yaml`, `fast-glob`, the parser bundle) out of the runtime package and breaks the cycle a golden harness inside `knowledge` would create (`knowledge` → `engine` → `knowledge`).
- **Runtime dependencies of `knowledge`:** none beyond `account-state` types. `zod` is a dependency for `z.infer` and the dev-mode check, but the runtime path never calls `parse` on the compiled bundle, because it was validated at build time.
- Detectors import only from `@idleon-forge/account-state` (types), `../../src/types` and `../../src/helpers` (pure helpers such as `charactersOf`, `sumBy`). Biome enforces this inside `detectors/**`.
- **Licence:** every new file starts with `// SPDX-License-Identifier: GPL-3.0-only` (YAML: `# SPDX-License-Identifier: GPL-3.0-only`).

### TR-2 The YAML schema (zod)

The schema is zod 4. Authored YAML files are parsed, then validated against `AuthoredFile`. Generated JSON is validated against `GeneratedEntry`. The cross-entry rules in TR-8 run after both.

```ts
// SPDX-License-Identifier: GPL-3.0-only
// packages/knowledge/src/schema.ts
import { z } from 'zod';
import { STAGES } from './stages'; // the one file M2 owns inside this package (see the notes below)

// ---------- primitives ----------
const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
export const ENTRY_TYPES = ['goal', 'contribution', 'check', 'priority', 'build', 'acquisition', 'metapath'] as const;
export const EntryType = z.enum(ENTRY_TYPES);
export const SystemId = z.string().regex(new RegExp(`^${SLUG}$`));
export const EntryId = z
  .string()
  .regex(new RegExp(`^${SLUG}\\.(${ENTRY_TYPES.join('|')})\\.${SLUG}$`), 'id must be <system>.<type>.<slug>');
export const DetectorId = z.string().regex(new RegExp(`^${SLUG}/${SLUG}$`), 'detector id must be <system>/<name>');
export const GameVersion = z.string().regex(/^\d+\.\d+\.\d+$/, 'game version like 2.3.540');
export const IsoDate = z.iso.date();
export const StageId = z.enum(STAGES); // W1-early … W4-entry (10 values, #26)
export const RoleId = z.string().regex(new RegExp(`^${SLUG}$`));
/** Toolbox class name, e.g. "Squire", "Divine_Knight". Checked against generated/_lookups.json in TR-8. */
export const ClassName = z.string().regex(/^[A-Z][A-Za-z_]+$/);
/** Toolbox rawName of an item, monster, map, talent… Checked against lookups in TR-8. */
export const RawName = z.string().min(1).max(64);
/** Text with {slot} or {slot:format} placeholders (TR-6). Plain text only: no HTML, no Markdown. */
export const Template = z
  .string()
  .min(1)
  .max(240)
  .refine((s) => !/[<>]/.test(s), 'templates are plain text; no < or >');

export const AFK_TYPES = ['FIGHTING', 'MINING', 'CHOPPIN', 'FISHING', 'CATCHING', 'COOKING', 'LABORATORY', 'DIVINITY', 'SPELUNKING'] as const;
export const PARALLEL_SLOTS = ['trap', 'cog', 'worship', 'cauldron', 'printer'] as const;

// ---------- Sources (ADR 0004) ----------
export const Source = z
  .strictObject({
    url: z.url({ protocol: /^https$/ }),
    title: z.string().min(1).max(120),
    /** 1 game data (via Toolbox) · 2 wiki edited after the patch · 3 dated community guide · 4 anything else */
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    verified: IsoDate,
    gameVersion: GameVersion,
    /** Date of the claim itself (comment date, wiki revision date), not of the page (#3). */
    claimDate: IsoDate.optional(),
    /** Our paraphrase, at most 200 characters. Never paste guide text (copyright; AutoReview is citable, not copyable). */
    note: z.string().max(200).optional(),
    /** #27 legend, for judgment entries. */
    verification: z.enum(['confirmed', 'corrected', 'contested', 'unverified']).optional(),
  })
  .refine((s) => s.tier === 1 || s.tier === 4 || s.claimDate !== undefined, {
    message: 'tier 2 and tier 3 Sources need claimDate',
    path: ['claimDate'],
  });

// ---------- shared pieces ----------
const StageRange = z.strictObject({ from: StageId, to: StageId });
export const AppliesTo = z.strictObject({
  stages: z.union([z.literal('all'), z.array(z.union([StageId, StageRange])).min(1)]),
  /** Matches the class and every class it promotes to (Squire matches Divine_Knight, Royal_Guardian). Omit for all classes. */
  classes: z.array(ClassName).min(1).optional(),
  levels: z.strictObject({ min: z.int().min(1).optional(), max: z.int().min(1).optional() }).optional(),
});
export const DetectorRef = z.strictObject({
  id: DetectorId,
  /** Validated against the Detector's own params schema in TR-8. Thresholds that are judgment live here. */
  params: z.record(z.string(), z.unknown()).default({}),
});
const Side = z.strictObject({ position: Template, sources: z.array(Source).min(1) });
const ActivePlay = z.strictObject({ minutes: z.int().positive() });

const Base = z.strictObject({
  id: EntryId,
  system: SystemId,
  title: z.string().min(1).max(80),
  text: Template,
  why: Template,
  /** Authored constants the templates may use, e.g. a "stop here" threshold that is judgment, not a game fact. */
  values: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
  sources: z.array(Source).min(1),
  appliesTo: AppliesTo,
  confidence: z.enum(['H', 'M', 'L']),
  status: z.enum(['active', 'contested', 'retired']),
  contested: z.strictObject({ sides: z.array(Side).min(2) }).optional(),
  retired: z.strictObject({ reason: z.string().min(1), replacedBy: EntryId.optional() }).optional(),
  /** Set only by the staleness pass (TR-11). */
  stale: z.strictObject({ flaggedAt: GameVersion, reason: z.string().min(1), pr: z.url() }).optional(),
  /** For authors and reviewers; never shown to players. */
  notes: z.string().max(1000).optional(),
});

// ---------- the seven types ----------
const Milestone = z.strictObject({ at: z.number().positive(), reward: Template });

/** M10 TR-2 `Category` minus 'blocker'. A display label only: it never orders anything (M2 TR-14, M6 D1). */
export const Category = z.enum(['compounding', 'spendable', 'nice']);
/** FieldPath (TR-4) as a schema, for doneWhen. */
const FieldPathSchema = z.string().min(1).max(200);

export const GoalEntry = Base.extend({
  type: z.literal('goal'),
  scope: z.enum(['character', 'account']),
  category: Category,
  unit: z.string().min(1).max(24),
  progress: DetectorRef, // a 'progress' Detector
  /** Inherit the Milestone ladder (a game fact) from a generated Goal. Exactly one of extends / milestones. */
  extends: EntryId.optional(),
  milestones: z.array(Milestone).min(1).optional(),
  activePlay: ActivePlay.optional(), // makes it an Active Play suggestion; never affects a Verdict
});

export const ContributionEntry = Base.extend({
  type: z.literal('contribution'),
  activity: z
    .strictObject({
      afkType: z.enum(AFK_TYPES).optional(),
      slot: z.enum(PARALLEL_SLOTS).optional(),
      map: RawName.optional(),
      target: RawName.optional(),
    })
    .refine((a) => (a.afkType === undefined) !== (a.slot === undefined), 'exactly one of afkType or slot'),
  /** The Goal this activity advances; one activity serving several Goals = several Contributions. Exactly one of goal / goalFamily. */
  goal: EntryId.optional(),
  /** A generated Goal family prefix, e.g. "upgrade-vault.goal.kill-row" (M4 TR-4). `kb compile` expands it into one concrete
   *  Contribution per generated Goal in the family, id `<system>.contribution.<slug>-<goal-slug>`, so runtime only sees `goal`. */
  goalFamily: z.string().regex(new RegExp(`^${SLUG}\\.goal\\.${SLUG}$`)).optional(),
  detector: DetectorRef, // a 'contribution' Detector
  /** #11 item 8: fighting gets an ETA from Toolbox kills per hour; skilling is yes/no only. */
  eta: z.enum(['kills-per-hour', 'none']),
  /** The stop-here suggestion text at a Milestone (M4 FR-13). */
  stopHere: Template.optional(),
  /** With status 'contested': whether Sources disagree on the order only, or on usefulness itself (M4 FR-15). */
  contestedOn: z.enum(['order', 'usefulness']).optional(),
}).refine((c) => (c.goal === undefined) !== (c.goalFamily === undefined), 'exactly one of goal or goalFamily');

export const CheckEntry = Base.extend({
  type: z.literal('check'),
  subject: z.enum(['character', 'account']),
  /** blocker = Verdict "Fix before you leave"; next-action = a Next Action under `goal`. */
  effect: z.enum(['blocker', 'next-action']),
  detector: DetectorRef, // a 'check' Detector
  goal: EntryId.optional(),
  /** An account-wide task that needs a specific character goes on that character's row (#10 item 6). */
  needsCharacter: z.boolean().default(false),
  /** Whether the Detector uses the Expected Return (fills or runs out before the player is back). */
  usesExpectedReturn: z.boolean().default(false),
  activePlay: ActivePlay.optional(),
  /** Display label for a next-action Check's Goal (M10). */
  category: Category.optional(),
  /** M6: the frame position follows the finding's urgency (1 when losing-now or lost-before-return, else 3; M2 TR-13). */
  priority: z.strictObject({ frame: z.literal('by-urgency') }).optional(),
  /** M6 TR-9: authored effort, the "cheapest" tie-break ({unit: 'hours', amount: effortSeconds / 3600}, M2 TR-14). */
  effortSeconds: z.int().positive().optional(),
  /** M6 TR-8: done only on this explicit field change in a later save, never on "stopped firing". */
  doneWhen: z
    .strictObject({
      field: FieldPathSchema,
      becomes: z.union([z.number(), z.string(), z.boolean()]).optional(),
      change: z.enum(['lower', 'higher', 'changed']).optional(),
    })
    .optional(),
  /** Derived at compile time: true exactly for effect 'blocker'. YAML may state it only as an assertion, which CI checks (M6 R9). */
  affectsVerdict: z.boolean().optional(),
});

/** M7 TR-6: what a Spend Plan item buys. */
const SpendBlock = z.strictObject({
  sink: z.enum(['vault', 'stamp', 'bribe', 'statue-gold', 'p2w', 'anvil']),
  target: z.strictObject({
    kind: z.enum(['once', 'to-level', 'to-max', 'levels', 'next', 'cheapest-until-unlock']),
    level: z.int().positive().optional(),
    levels: z.int().positive().optional(),
  }),
  reserve: z.boolean().default(false), // M7 D2
  openEnded: z.boolean().default(false), // M7 D6, FR-24
  gate: DetectorId.nullable().default(null), // e.g. 'spend/combat-row-gate'
  shareCap: z.number().positive().max(1).nullable().default(null), // open-ended items default to 1/3 in the engine (M7 FR-24)
});

const TierItem = z.union([
  EntryId,
  z
    .strictObject({
      ref: EntryId,
      verification: z.enum(['confirmed', 'corrected', 'contested', 'unverified']).optional(),
      sources: z.array(Source).default([]),
      /** Required when verification is 'contested' and the referenced entry isn't itself contested. */
      sides: z.array(Side).min(2).optional(),
      /** M6: listed once, in the never-skip block; the engine moves it to position 3 when its urgency is 'banked' (M2 TR-13). */
      byUrgency: z.boolean().optional(),
      /** M8 D5, M7: still ranks, after the last authored position, in later Stage lists that don't list it (M2 TR-13). */
      carryForward: z.boolean().optional(),
    })
    .refine((t) => t.verification !== 'contested' || t.sides !== undefined, 'a contested item needs at least 2 sides'),
  /** Splice in a shared block (another Priority List with list: 'block'), e.g. #26's never-skip position-1 block.
   *  An include contributes all of the block's items to this ONE position, as a tie; blocks never shift later positions. */
  z.strictObject({ include: EntryId }),
  /** M7: one Spend Plan item, only inside a list: 'spend'. Its stable key is `${listId}#${item}` (M7 SpendLine.entryId). */
  z.strictObject({
    item: z.string().regex(new RegExp(`^${SLUG}$`)), // unique within its list
    ref: EntryId, // a generated Acquisition, e.g. upgrade-vault.acquisition.row-23
    spend: SpendBlock,
    text: Template,
    why: Template,
    sources: z.array(Source).min(1),
    confidence: z.enum(['H', 'M', 'L']),
    verification: z.enum(['confirmed', 'corrected', 'contested', 'unverified']).optional(),
    carryForward: z.boolean().optional(),
  }),
]);
export const PriorityEntry = Base.extend({
  type: z.literal('priority'),
  /** 'block' lists are only included by other lists; they have no Stage of their own.
   *  'order' lists are System-internal orderings (merit rows, gem buys, stamp acquisition, card sets, card lists); their Stage is optional. */
  list: z.enum(['goals', 'spend', 'leverage', 'block', 'order']),
  stage: StageId.optional(),
  /** Ordered positions; each position is a tie of one or more items. No weights, ever. */
  tiers: z.array(z.array(TierItem).min(1)).min(1),
});

/** M9 TR-5 owns this shape (role-keyed presets, per-tab steps, conditions, the attack bar). Builds carry no Detector:
 *  M9's Checks (`builds/*`) read them. */
export const StepCondition = z.union([
  z.strictObject({ kind: z.literal('stageAtLeast'), stage: StageId }),
  z.strictObject({ kind: z.literal('accuracyShort') }),
]);
export const BuildStep = z.strictObject({
  talent: RawName, // a generated talent fact, checked against talents.fact tables
  target: z.union([z.int().positive(), z.literal('max')]),
  tie: z.string().optional(),
  core: z.boolean().optional(), // only the steps M9 TR-5 lists; CI enforces (M9 TR-15)
  hardCap: z.boolean().optional(),
  when: z.array(StepCondition).optional(),
  breakpoints: z.array(z.int().positive()).optional(),
});
export const BuildEntry = Base.extend({
  type: z.literal('build'),
  classLine: ClassName, // e.g. "Squire"
  role: z.enum(['fighting', 'skilling']),
  serves: z.array(z.enum(AFK_TYPES)), // e.g. ["MINING"]; [] for the Hunter's trapping preset
  variant: z.literal('afk'),
  /** The role's talents for classification (M9 TR-6), not only the steps. */
  tags: z.array(RawName).min(1),
  tabs: z.array(z.strictObject({ tab: z.union([z.literal(1), z.literal(2), z.literal(3)]), steps: z.array(BuildStep).min(1) })).min(1),
  attacks: z.array(RawName).default([]),
  onePointOk: z.array(RawName).default([]),
});

const Requirement = z.union([EntryId, z.strictObject({ text: Template })]);
export const AcquisitionEntry = Base.extend({
  type: z.literal('acquisition'),
  thing: z.strictObject({
    kind: z.enum(['obol', 'stamp', 'card', 'item', 'talent', 'class', 'building', 'other']),
    rawName: RawName,
  }),
  extends: EntryId.optional(), // inherit generated requirements and rates
  methods: z
    .array(
      z.strictObject({
        how: Template,
        where: z.strictObject({ map: RawName.optional(), monster: RawName.optional(), npc: RawName.optional() }).optional(),
        requires: z.array(Requirement).default([]),
      }),
    )
    .min(1)
    .optional(),
  detector: DetectorRef.optional(), // an 'acquisition' Detector: owned? requirements met?
});

export const MetaPathEntry = Base.extend({
  type: z.literal('metapath'),
  /** M2 TR-7 adds stages, pusher-rule and gate-chain. */
  part: z.enum(['slots', 'roles', 'milestones', 'stages', 'pusher-rule', 'gate-chain']),
  slots: z
    .array(
      z.strictObject({
        slot: z.union([z.int().min(1).max(11), z.strictObject({ from: z.int().min(1), to: z.int().max(11) })]),
        classLine: ClassName,
        role: RoleId.optional(),
        note: Template.optional(),
        status: z.enum(['active', 'contested']).default('active'),
        sides: z.array(Side).min(2).optional(),
      })
      .refine((sl) => (sl.status === 'contested') === (sl.sides !== undefined), 'a contested slot needs sides, and only a contested slot has them'),
    )
    .optional(),
  roles: z
    .array(
      z.strictObject({
        id: RoleId,
        classLine: ClassName,
        does: Template,
        activeFrom: StageId, // M2 TR-9, e.g. construction-builder from W3-early
        owns: z.array(z.string()).default([]), // AFK types or Parallel Slots, e.g. "parallel:cog-seat"
        visitHint: z.enum(['pool-after', 'cooldown', 'skip-trap-stop']).optional(), // M2 TR-12
      }),
    )
    .optional(),
  /** M2 TR-4/TR-5: the 10 Stages; thresholds are referenced by fact id, never typed in. */
  stages: z
    .array(z.strictObject({ id: StageId, rule: z.string().min(1), needs: z.array(Template).default([]), factRefs: z.array(z.string()).default([]) }))
    .optional(),
  /** M2 TR-10, D1: the incumbent margin (1.25). */
  pusherRule: z.strictObject({ margin: z.number().min(1) }).optional(),
  /** M2 TR-11: the ordered gate steps of one or more worlds. */
  gateChain: z
    .array(
      z.strictObject({
        world: z.int().min(1).max(4),
        steps: z.array(z.strictObject({ kind: z.enum(['route', 'quest', 'boss', 'crystal', 'gatekeeper']), ref: z.string().optional() })).min(1),
      }),
    )
    .optional(),
  milestones: z
    .array(
      z.strictObject({
        id: z.string().regex(new RegExp(`^${SLUG}$`)),
        world: z.int().min(1).max(7),
        label: Template,
        detector: DetectorRef, // a 'milestone' Detector; M2 composes these into the Stage
      }),
    )
    .optional(),
});

export const AuthoredEntry = z
  .discriminatedUnion('type', [GoalEntry, ContributionEntry, CheckEntry, PriorityEntry, BuildEntry, AcquisitionEntry, MetaPathEntry])
  .superRefine(entryRules);

export const AuthoredFile = z.strictObject({
  system: SystemId,
  entries: z.array(AuthoredEntry).min(1),
});

const GeneratedBy = z.strictObject({
  generator: z.string(), // e.g. "death-note"
  inputs: z.array(z.string()).min(1), // e.g. ["parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS", "website-data/shared-data.json#deathNote"]
  commit: z.string().regex(/^[0-9a-f]{40}$/),
});

/** Generated entries are Goals and Acquisitions with machine provenance. Authored YAML can never set `generatedBy`. */
export const GeneratedEntry = z
  .discriminatedUnion('type', [
    GoalEntry.extend({ origin: z.literal('generated'), generatedBy: GeneratedBy }),
    AcquisitionEntry.extend({
      origin: z.literal('generated'),
      generatedBy: GeneratedBy,
      /** Drop chance and similar rates exist only on generated Acquisitions (FR-17). */
      rates: z.record(z.string(), z.number()).optional(),
    }),
  ])
  .superRefine(entryRules);

// ---------- fact tables (TR-2a): game facts that are not entries ----------
export const FactId = z.string().regex(new RegExp(`^${SLUG}\\.fact\\.${SLUG}$`), 'fact id must be <system>.fact.<slug>');
export const FactTable = z
  .strictObject({
    id: FactId,
    system: SystemId,
    /** 'authored' = a tier 2–3 fact not yet generatable (ADR 0007), e.g. metapath.fact.family-slots, stamps.fact.unobtainable. */
    origin: z.enum(['generated', 'authored']),
    title: z.string().min(1).max(80),
    /** Validated by the schema its generator declares, or by a zod schema co-located with the authored file. */
    rows: z.unknown(),
    sources: z.array(Source).min(1),
    generatedBy: GeneratedBy.optional(),
  })
  .refine((f) => (f.origin === 'generated') === (f.generatedBy !== undefined), 'generatedBy only, and always, on generated tables')
  .refine((f) => f.origin === 'generated' ? f.sources.every((s) => s.tier === 1) : f.sources.every((s) => s.tier === 2 || s.tier === 3), {
    message: 'generated tables cite a tier 1 permalink; authored tables cite tier 2–3 Sources with claimDate',
  });

// ---------- single-entry rules ----------
type EntryShape = z.infer<
  typeof GoalEntry | typeof ContributionEntry | typeof CheckEntry | typeof PriorityEntry | typeof BuildEntry | typeof AcquisitionEntry | typeof MetaPathEntry
>;
function entryRules(e: EntryShape, ctx: z.RefinementCtx) {
  const [, typeSeg] = e.id.split('.');
  if (typeSeg !== e.type) ctx.addIssue({ code: 'custom', path: ['id'], message: `id segment "${typeSeg}" must equal type "${e.type}"` });
  if (!e.id.startsWith(`${e.system}.`)) ctx.addIssue({ code: 'custom', path: ['id'], message: 'id must start with its system' });
  if ((e.status === 'contested') !== (e.contested !== undefined))
    ctx.addIssue({ code: 'custom', path: ['contested'], message: 'contested status and contested.sides go together' });
  if ((e.status === 'retired') !== (e.retired !== undefined))
    ctx.addIssue({ code: 'custom', path: ['retired'], message: 'retired status and retired block go together' });
  if (e.type === 'goal') {
    if ((e.extends === undefined) === (e.milestones === undefined))
      ctx.addIssue({ code: 'custom', path: ['milestones'], message: 'a Goal needs exactly one of extends or milestones' });
    if (e.milestones?.some((m, i, a) => i > 0 && m.at <= a[i - 1].at))
      ctx.addIssue({ code: 'custom', path: ['milestones'], message: 'Milestones must strictly ascend' });
  }
  if (e.type === 'contribution' && e.eta === 'kills-per-hour' && e.activity.afkType !== 'FIGHTING')
    ctx.addIssue({ code: 'custom', path: ['eta'], message: 'kills-per-hour ETA only for FIGHTING (#11 item 8)' });
  if (e.type === 'check' && e.effect === 'blocker') {
    if (e.status === 'contested') ctx.addIssue({ code: 'custom', path: ['status'], message: 'a contested entry cannot be a Verdict blocker' });
    if (e.confidence !== 'H') ctx.addIssue({ code: 'custom', path: ['confidence'], message: 'Verdict blockers need confidence H' });
    if (e.activePlay) ctx.addIssue({ code: 'custom', path: ['activePlay'], message: 'Active Play suggestions never affect a Verdict' });
    if (!e.sources.some((s) => s.tier <= 2))
      ctx.addIssue({ code: 'custom', path: ['sources'], message: 'Verdict blockers need a tier 1 or 2 Source (D3)' });
  }
  if (e.type === 'priority') {
    if ((e.list === 'block') !== (e.stage === undefined))
      ctx.addIssue({ code: 'custom', path: ['stage'], message: 'block lists have no stage; every other list has exactly one' });
    if (e.stage && !(e.appliesTo.stages !== 'all' && e.appliesTo.stages.length === 1 && e.appliesTo.stages[0] === e.stage))
      ctx.addIssue({ code: 'custom', path: ['appliesTo'], message: 'appliesTo.stages must be [stage]' });
  }
  if (e.type === 'metapath') {
    const fieldOf = { slots: 'slots', roles: 'roles', milestones: 'milestones', stages: 'stages', 'pusher-rule': 'pusherRule', 'gate-chain': 'gateChain' } as const;
    const present = (Object.values(fieldOf) as (keyof typeof e)[]).filter((k) => e[k] !== undefined);
    if (present.length !== 1 || present[0] !== fieldOf[e.part])
      ctx.addIssue({ code: 'custom', path: ['part'], message: `part "${e.part}" needs exactly the "${fieldOf[e.part]}" field` });
  }
  if (e.type === 'contribution' && e.contestedOn !== undefined && e.status !== 'contested')
    ctx.addIssue({ code: 'custom', path: ['contestedOn'], message: 'contestedOn only on a contested entry' });
  if (e.type === 'check' && e.affectsVerdict !== undefined && e.affectsVerdict !== (e.effect === 'blocker'))
    ctx.addIssue({ code: 'custom', path: ['affectsVerdict'], message: 'affectsVerdict is true exactly for effect: blocker' });
  if (e.type === 'check' && e.priority?.frame === 'by-urgency' && e.effect === 'blocker')
    ctx.addIssue({ code: 'custom', path: ['priority'], message: 'Verdict blockers are not list items' });
}

export type Entry = z.infer<typeof AuthoredEntry> | z.infer<typeof GeneratedEntry>;
export const SystemDef = z.strictObject({
  id: SystemId,
  name: z.string().min(1).max(40),
  world: z.int().min(0).max(7), // 0 = cross-cutting
  scope: z.enum(['character', 'account', 'both']),
  dossier: z.url({ protocol: /^https$/ }),
  /** 'always', or a 'milestone' Detector that says whether the System is unlocked on this account. */
  unlocked: z.union([z.literal('always'), DetectorRef]),
});
```

Notes on the schema:
- **`STAGES` ownership:** M2 owns the Stage list. To keep `knowledge` from importing `engine` (TR-1), M2 publishes `STAGES` from `packages/knowledge/src/stages.ts`, the one file M2 owns inside this package, and `engine` re-exports it.
- **YAML parsing:** use the `yaml` package with `{ schema: 'core', merge: false, maxAliasCount: 0, uniqueKeys: true, prettyErrors: true }`. Anchors, aliases and merge keys are rejected, so every entry reads on its own. Each file is capped at 256 KB. Every zod issue is mapped back to its YAML line through the parser's source ranges.
- **File order:** inside a file, entries are sorted by type, then id. `kb check --fix` re-sorts.
- **`category`** replaces the earlier `rankClass` (its `nice-to-have` value is now `nice`, matching M10 TR-2). It is a display label only and never orders anything (TR-12).

### TR-2a Fact tables

Many modules need game facts that are tables rather than Goals or Acquisitions: M2's class tree, family slots, world gates and routes; M3's Unending Energy cap and trap tables; M5's map graph, Lab nodes and skill classes; M6's bubble, merit, gem-shop, salt and building catalogues; M8's shop towns and unobtainable stamps; M9's talent facts and groups. These are **fact tables** (`FactTable` above), not entries, so FR-1's seven types stand.

- **Ids:** `<system>.fact.<slug>` (for example `classes.fact.class-tree`, `portals.fact.world-routes`, `upgrade-vault.fact.kill-slots`, `talents.fact.bubble-capped`). The rename map from the earlier `gen.*` and ad hoc ids is in each module spec and in the spec index.
- **Where:** generated tables in `generated/<system>.facts.json`, written by generators (TR-10) with a tier 1 Source; authored tier-2 tables in `systems/<system>.facts.yaml`, each with a cited Source and `origin: authored`, for facts that live in game code Toolbox doesn't export yet (M2 TR-7). Switching a table from authored to generated keeps its id, so no reference changes.
- **Access:** Detectors read them through `ctx.facts.get(id)` (which returns entries or fact tables); templates reach their values through slots; entries reference them by id in `values` or Detector `params`. FR-5 and FR-17 cover them (dangling ids fail; hand-copied values fail).
- **Shipped:** fact tables that a shipped entry or Detector references are compiled into the bundle (`facts` in TR-7). `generated/_lookups.json` stays validation-only and is never shipped.
- **Toolbox-code constants** (M6 TR-5: the 3-day bank cap, the pet free-pull period, minigame unlock thresholds) are authored fact rows whose Source is the Toolbox file and line at the pin; M12's re-sync diffs those exact lines.

### TR-2b Additions requested by M2–M9

Folded into TR-2 and TR-4 in the 2026-10-17 consistency pass, with the spec that asked:

| Addition | Where | Asked by |
|---|---|---|
| `category` (`compounding`/`spendable`/`nice`, display only) replaces `rankClass` | GoalEntry, CheckEntry | M6 D1, M10 TR-2, M2 TR-14 |
| `goalFamily` with compile-time expansion; `stopHere: Template`; `contestedOn: 'order' \| 'usefulness'` | ContributionEntry | M4 TR-4, FR-13, FR-15 |
| `priority: { frame: 'by-urgency' }`, `effortSeconds`, `doneWhen`, derived `affectsVerdict` | CheckEntry | M6 TR-2, TR-8, TR-9, R9 |
| `urgency`, `deadline`, `doneKey`, `nextChangeAt` on findings | CheckFinding | M6 TR-2, FR-28 |
| `fixHolds`, `demotedBecause` on `fires`; a `pass` result with `nextAt` | CheckFinding | M3 TR-4, FR-11 |
| `list: 'order'`; TierItem `byUrgency` and `carryForward`; an `include` is one position (a tie) | PriorityEntry | M6, M8 D5, M7, M2 TR-13 |
| the `spend` TierItem (`item`, `ref`, `spend` block, its own text, why and Sources) | PriorityEntry with `list: 'spend'` | M7 TR-6 |
| Build entry replaced by the role-keyed shape; no Build Detector | BuildEntry | M9 TR-5 |
| Meta Path parts `stages`, `pusher-rule`, `gate-chain`; role `activeFrom`, `owns`, `visitHint` | MetaPathEntry | M2 TR-7, TR-9, TR-12 |
| fact tables | TR-2a | M2, M3, M5, M6, M7, M8, M9 |
| engine Detectors (`kind: 'engine'`), resolved against the engine registry | TR-4, FR-9 | M2, M5, M7 |
| `HistoryEntry` (M1 TR-14) as `DetectorContext.history` | TR-4 | M1, M3, M6 |
| generators listed in TR-10 | TR-10 | M2, M3, M4, M5, M6, M7, M8, M9 |
| CI warning when `appliesTo` names a Stage whose list doesn't reference the entry | TR-8 | M2 FR-21 |

### TR-3 One example entry of each type

These examples fix the shape. Their content is illustrative and gets drafted for real by the pipeline (TR-19). URLs marked `# illustrative` are placeholders that a real entry must replace.

**Goal (generated).** `generated/death-note.json`, one of 104 normal-monster ladders. The thresholds are Toolbox's exported `DEATH_NOTE_RANKS` at pin `6c37e3d`.

```json
{
  "id": "death-note.goal.poop-small",
  "system": "death-note",
  "type": "goal",
  "origin": "generated",
  "title": "Death Note: Poop",
  "text": "{value:compact} Poop kills; next Death Note rank at {next:compact}",
  "why": "Each Death Note rank adds to the World 1 skull bonus.",
  "values": { "monster": "poopSmall", "world": 1 },
  "sources": [{
    "url": "https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/deathNote.ts",
    "title": "IdleOn Toolbox game data: DEATH_NOTE_RANKS", "tier": 1, "verified": "2026-10-17", "gameVersion": "2.3.540"
  }],
  "appliesTo": { "stages": "all" },
  "confidence": "H",
  "status": "active",
  "scope": "account",
  "category": "compounding",
  "unit": "kills",
  "progress": { "id": "death-note/kills-of-monster", "params": { "monster": "poopSmall" } },
  "milestones": [
    { "at": 25000, "reward": "rank 1" }, { "at": 100000, "reward": "rank 2" }, { "at": 250000, "reward": "rank 3" },
    { "at": 500000, "reward": "rank 4" }, { "at": 1000000, "reward": "rank 5" }, { "at": 5000000, "reward": "rank 7" },
    { "at": 100000000, "reward": "rank 10" }
  ],
  "generatedBy": {
    "generator": "death-note",
    "inputs": ["parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS", "website-data/shared-data.json#deathNote"],
    "commit": "6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1"
  }
}
```

An authored Goal adds judgment on top of a generated ladder, without copying any number:

```yaml
- id: death-note.goal.w1-skulls
  title: Death Note skulls on W1 monsters
  extends: death-note.goal.poop-small
  text: "{value:compact} Poop kills; next rank at {next:compact}, about {eta:duration} away"
  why: Multikill is on once the Death Note building is Lv 1, so every rank compounds AFK kills.
  sources:
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/w3-systems/docs/research/systems/w3-systems/worship-trapping-death-note.md#death-note
      title: W3 dossier, Death Note (from N.js)
      tier: 4   # our own write-up; the tier 1 claim is the Toolbox permalink below
      verified: 2026-10-17
      gameVersion: 2.3.540
    - url: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/deathNote.ts
      title: IdleOn Toolbox, Death Note multikill
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: [{ from: W3-early, to: W4-entry }] }
  confidence: H
  status: active
  scope: account
  category: compounding
  unit: kills
  progress: { id: death-note/kills-of-monster, params: { monster: poopSmall } }
```

**Contribution.** Fighting on a map advances that map's Death Note Goal, with an ETA from Toolbox kills per hour.

```yaml
- id: death-note.contribution.fight-poop
  title: Fighting Poop fills its Death Note
  text: "Advances Poop kills: {value:compact} of {next:compact}"
  why: AFK fighting on Poopy Sewers is the only way to add Poop kills.
  sources:
    - url: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/deathNote.ts
      title: IdleOn Toolbox, Death Note kill counting
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: [{ from: W3-early, to: W4-entry }] }
  confidence: H
  status: active
  activity: { afkType: FIGHTING, map: Poopy_Sewers, target: poopSmall }
  goal: death-note.goal.w1-skulls
  detector: { id: fighting/on-target, params: { target: poopSmall } }
  eta: kills-per-hour
```

**Check.** A Next Action from #26's free-value fill 3c, with a Verdict-blocker variant below it.

```yaml
- id: alchemy.check.empty-big-bubble-slot
  title: Empty big-bubble slot
  text: "Equip {bubble:name} in big-bubble slot {slot:int}"
  why: An empty big-bubble slot is free value lost on every AFK hour.
  sources:
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/w2-systems/docs/research/systems/2026-10-17-w2-systems.md#bubbles
      title: W2 dossier, Bubbles
      tier: 4   # our own write-up; a real entry adds the Toolbox permalink for missingBubbles as its tier 1 Source
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: unverified
  appliesTo: { stages: [{ from: W2-early, to: W4-entry }] }
  confidence: H
  status: active
  subject: character
  effect: next-action
  goal: alchemy.goal.big-bubbles-equipped
  detector: { id: alchemy/empty-big-bubble-slot, params: { countSecondSlotBribe: true } }

- id: afk.check.no-afk-target
  title: No AFK Target
  text: "{character} has no AFK Target; send it to {suggestion:name}"
  why: A character with no AFK Target earns nothing while you are away.
  sources:
    - url: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts
      title: IdleOn Toolbox, afkType "Nothing"
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: all }
  confidence: H
  status: active
  subject: character
  effect: blocker
  detector: { id: afk/no-afk-target }
```

**Priority List.** The W3-early list from #26 §3.7 (excerpt), showing the shared blocks, ties, item-level verification and a contested item. M2 owns the real list files and their ids (M2 TR-7, TR-13); item ids below other than M2's are illustrative.

```yaml
- id: metapath.priority.w3-early
  title: W3-early priorities
  text: "Priorities for {stage}"
  why: Systems in Leverage order for an account entering World 3.
  sources:
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/leverage-model/docs/research/2026-10-17-leverage-model.md#37-w3-early
      title: Leverage model, W3-early
      tier: 3
      claimDate: 2026-10-17
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: [W3-early] }
  confidence: M
  status: active
  list: goals
  stage: W3-early
  tiers:
    - [{ include: metapath.priority.never-skip }]          # position 1: the whole block, as one tie
    - [metapath.goal.push]                                 # position 2
    - [{ include: metapath.priority.free-value-fills }]    # position 3: the whole block, as one tie
    - [{ ref: quests.goal.hoggindaz-1-5, verification: confirmed }]
    - [{ ref: construction.goal.printer-cruncher-arm, verification: corrected }]
    - [construction.goal.printer-samples]
    - [worship.goal.wax-skull-all, trapping.goal.traps-all]   # a tie
    - [{ ref: refinery.goal.redox-dioxide-ranks, verification: corrected,
         sources: [{ url: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa, title: shnaps progression gist,
                     tier: 3, claimDate: 2026-09-18, verified: 2026-10-17, gameVersion: 2.3.540 }] }]
    - [{ ref: shrines.goal.first-shrines, verification: contested }]
```

**Build.** The shape is M9's (M9 TR-5, which has the full Barbarian example); abridged:

```yaml
- id: talents.build.squire-skilling
  title: Squire skilling build
  text: "Next talent points: {talent} to {target}"
  why: A Squire's skilling preset mines and runs the Refinery talents.
  sources:
    - url: https://idleontoolbox.com/tools/builds   # illustrative
      title: Toolbox community build, Squire mining
      tier: 3
      claimDate: 2026-10-10
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: unverified
  appliesTo: { stages: [{ from: W2-early, to: W4-entry }], classes: [Squire], levels: { min: 15 } }
  confidence: L
  status: active
  classLine: Squire
  role: skilling
  serves: [MINING]
  variant: afk
  tags: [BRUTE_EFFICIENCY, BIG_PICK, REFINERY_THROTTLE, REDOX_RATES]   # abridged
  tabs:
    - tab: 2
      steps:
        - { talent: BIG_PICK, target: max, core: true }
        - { talent: REFINERY_THROTTLE, target: max, when: [{ kind: stageAtLeast, stage: W3-early }] }
  attacks: []
  onePointOk: []
```

**Acquisition.** An authored method on top of a generated drop-rate Acquisition.

```yaml
- id: obols.acquisition.efaunt-obol
  title: Skeletal Obol of Efaunt's Gaze
  text: "Farm Efaunt with {keys:int} keys banked; the obol drops from the boss"
  why: One of the few obols that drop before W3; fills a family slot.
  sources:
    - url: https://idleon.wiki/wiki/Obols   # illustrative
      title: IdleOn wiki, Obols
      tier: 2
      claimDate: 2026-10-05
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: [W2-late, W3-early, W3-mid] }
  confidence: M
  status: active
  thing: { kind: obol, rawName: ObolEfauntA }
  extends: obols.acquisition.obol-efaunt-a-drop   # generated: drop chances by Boss2A/B/C
  methods:
    - how: "Fight Efaunt (needs a Djonnut key)"
      where: { monster: Boss2A }
      requires: [bosses.acquisition.efaunt-key, { text: "W2 obol merit bought" }]
  detector: { id: obols/owned, params: { rawName: ObolEfauntA } }
```

**Meta Path.** The slot plan (#15, #26 §4.1), with a per-slot contested item.

```yaml
- id: metapath.metapath.slot-plan
  title: Character slot plan
  text: "Slot {slot}: {classLine:name}"
  why: One of each subclass first, then Journeyman, then a second Squire for Construction.
  sources:
    - url: https://www.reddit.com/r/idleon/comments/1wnq6ay/comment/pbgy0ai/
      title: "r/idleon: Squire or barbarian?"
      tier: 3
      claimDate: 2026-09-22
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: confirmed
    - url: https://www.reddit.com/r/idleon/comments/1ww0c2u/comment/pdivfke/
      title: "r/idleon: Royal Guardian is the best class to have 2 of"
      tier: 3
      claimDate: 2026-10-02
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: confirmed
  appliesTo: { stages: all }
  confidence: M
  status: active
  part: slots
  slots:
    - { slot: 1, classLine: Barbarian, role: pusher }
    - { slot: 2, classLine: Squire, role: construction-builder }
    - { slot: 3, classLine: Bowman, role: catching }
    - { slot: 4, classLine: Hunter, role: trapping }
    - { slot: 5, classLine: Shaman, role: alchemy-brewer }
    - { slot: 6, classLine: Wizard, role: worship }
    - { slot: 7, classLine: Journeyman }
    - { slot: 8, classLine: Squire, role: construction-builder, note: "becomes the second Royal Guardian" }
    - slot: { from: 9, to: 10 }
      classLine: Arcane_Cultist
      status: contested
      sides:
        - position: "Second Arcane Cultist"
          sources: [{ url: https://www.reddit.com/r/idleon/comments/1w7xfz2/, title: "r/idleon thread", tier: 3, claimDate: 2026-09-05, verified: 2026-10-17, gameVersion: 2.3.540 }]
        - position: "Second Death Bringer"
          sources: [{ url: https://www.reddit.com/r/idleon/comments/1we5y9c/comment/p9nvb0c/, title: "r/idleon thread", tier: 3, claimDate: 2026-09-13, verified: 2026-10-17, gameVersion: 2.3.540 }]
    - { slot: 11, classLine: Beginner }
```

### TR-4 The Detector interface

```ts
// SPDX-License-Identifier: GPL-3.0-only
// packages/knowledge/src/types.ts (Detector part)
import type { z } from 'zod';
import type { Entry, FactTable } from './schema'; // FactTable: z.infer of the TR-2 schema
import type { AccountState, HistoryEntry } from '@idleon-forge/account-state'; // HistoryEntry: M1 TR-14, Pick<SaveRecord, 'lastCloudSave' | 'receivedAt' | 'state'>

/** Dot path into AccountState with [*] for arrays, e.g. "characters[*].afkType", "account.towers.data[*].level". */
export type FieldPath = string;
export type Subject = { kind: 'account' } | { kind: 'character'; index: number };
export type SlotValue = number | string;

export interface DetectorContext {
  readonly state: AccountState;
  /** Earlier saves, oldest first, at most 30 days (M1). Empty on the first save. */
  readonly history: readonly HistoryEntry[];
  /** Injected clock (epoch ms). Detectors never read the real clock. */
  readonly now: number;
  /** The player's Expected Return (ms), default 8 h. Only Checks with usesExpectedReturn should read it. */
  readonly expectedReturnMs: number;
  /** Read-only access to compiled entries and fact tables (TR-2a) by id, e.g. a generated ladder or a route table. */
  readonly facts: { get(id: string): Readonly<Entry | FactTable> | undefined };
}

/** 'engine': an engine Detector in packages/engine (M2 Stage/roster/pusher, M5 options, M7 spend lines), whose finding
 *  shape its module spec defines. Builds have no Detector kind: M9's Checks read Build entries. */
export type DetectorKind = 'check' | 'contribution' | 'progress' | 'milestone' | 'acquisition' | 'engine';

interface FindingBase {
  subject: Subject;
  /** Values for the entry's templates; must match the Detector's slots schema. */
  slots: Record<string, SlotValue>;
}
export type CheckFinding = FindingBase & (
  | {
      result: 'fires';
      /** epoch ms when the problem bites, for "fills in 3 h" (at <= now: already biting) */
      at?: number;
      /** M3 FR-7 (c): would the fix hold until the return? */
      fixHolds?: boolean;
      demotedBecause?: 'not-quick' | 'not-fillable' | 'fix-does-not-hold' | 'effect-next-action' | null;
      /** M6 TR-9: drives the by-urgency frame position and the urgency tie-break (M2 TR-14). */
      urgency?: 'losing-now' | 'lost-before-return' | 'banked';
      /** epoch ms the value starts to be lost (M6 TR-6). */
      deadline?: number;
      /** M6 TR-8: identifies the done check across saves. */
      doneKey?: string;
      /** M6 FR-28: the next moment this answer can change without a new save; the engine re-runs at the earliest. */
      nextChangeAt?: number;
    }
  /** Optional: a Detector may still return nothing for a silent subject. M3 FR-11 uses nextAt for first fill. */
  | { result: 'pass'; /** epoch ms when it would start to fire, e.g. a cap after the return */ nextAt?: number; nextChangeAt?: number }
  | { result: 'unknown'; reason: UnknownReason }
);
export type ContributionFinding = FindingBase & {
  advances: 'yes' | 'no' | 'unknown';
  /** Only for eta: kills-per-hour; ms to the next Milestone, from Toolbox kills/h (ADR 0005 arithmetic). */
  etaMs?: number | null;
};
export type ProgressFinding = FindingBase & ({ value: number } | { value: null; reason: UnknownReason });
export type MilestoneFinding = FindingBase & { reached: 'yes' | 'no' | 'unknown' };
/** An engine Detector's output; its shape is fixed by its module spec (M2 StageResult/MetaPathResult, M5 HigherLeverageOption, M7 spend facts). */
export type EngineFinding = unknown;
export type AcquisitionFinding = FindingBase & {
  owned: 'yes' | 'no' | 'unknown';
  requirementsMet: 'yes' | 'no' | 'unknown';
  missing: string[]; // requirement entry ids or text keys
};
export type UnknownReason = 'field-missing' | 'parser-section-failed' | 'not-applicable' | 'needs-history';

interface FindingByKind {
  check: CheckFinding;
  contribution: ContributionFinding;
  progress: ProgressFinding;
  milestone: MilestoneFinding;
  acquisition: AcquisitionFinding;
  engine: EngineFinding;
}

export interface FixtureExample {
  fixture: string; // a public id, a scrubbed id, or 'private:<id>' (local only)
  subject?: Subject; // default: any subject
  /** Optional state mutation for edge cases, e.g. (s) => withCharacter(s, 0, { afkType: 'Nothing' }). */
  mutate?: (s: AccountState) => AccountState;
  /** Expected values for kinds without fires/silent, e.g. { value: 13021 } for progress. */
  expect?: Record<string, unknown>;
}

export interface Detector<K extends DetectorKind, P extends z.ZodType, S extends z.ZodType<Record<string, SlotValue>>> {
  id: string; // "<system>/<name>", unique
  kind: K;
  system: string;
  /** Params an entry may pass (thresholds that are judgment). The entry's `params` are validated against it. */
  params: P;
  /** Slots each finding provides to templates. Templates may use only these, plus built-ins and `values`. */
  slots: S;
  /** Every Account State path the Detector may read. Enforced in tests by a recording proxy. */
  reads: readonly FieldPath[];
  examples: {
    fires: readonly FixtureExample[]; // check, milestone ('reached: yes'), contribution ('advances: yes'), …
    silent: readonly FixtureExample[];
    unknown?: readonly FixtureExample[];
  };
  /** Pure. Returns one finding per subject it has an opinion on. An empty array means silent everywhere. */
  run(ctx: DetectorContext, params: z.infer<P>): readonly FindingByKind[K][];
}

export type AnyDetector = Detector<DetectorKind, z.ZodType, z.ZodType<Record<string, SlotValue>>>;
export type DetectorRegistry = Record<string, AnyDetector>;
export function defineDetector<K extends DetectorKind, P extends z.ZodType, S extends z.ZodType<Record<string, SlotValue>>>(
  d: Detector<K, P, S>,
): Detector<K, P, S> {
  return d;
}
```

Which Detector kind each entry type needs:

| Entry type | Field | Detector kind | Meaning of "fires" |
|---|---|---|---|
| Goal | `progress` | progress | returns the current value; the engine places it on the Milestone ladder |
| Contribution | `detector` | contribution | `advances: yes` for a character whose activity serves the Goal |
| Check | `detector` | check, or engine (M5 leverage Checks, M7 spend Checks) | `result: fires` for each subject with the problem |
| Build | none | | read by M9's `builds/*` Check Detectors |
| Meta Path stages, roster, pusher; Spend Plan items | `detector` (engine) | engine | the module's own typed output (M2, M7) |
| Acquisition | `detector` | acquisition | `owned` / `requirementsMet` |
| Meta Path milestones, System `unlocked` | `detector` | milestone | `reached: yes` |
| Priority List | none | | lists are data only |

Example Detector:

```ts
// SPDX-License-Identifier: GPL-3.0-only
// packages/knowledge/detectors/afk/no-afk-target.ts
import { z } from 'zod';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'afk/no-afk-target',
  kind: 'check',
  system: 'afk',
  params: z.strictObject({}),
  slots: z.strictObject({ suggestion: z.string() }),
  reads: ['characters[*].afkType', 'characters[*].currentMap', 'characters[*].index'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', subject: { kind: 'character', index: 0 }, mutate: (s) => withAfkType(s, 0, 'Nothing') }],
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'highend' }],
  },
  run({ state }) {
    return state.characters
      .filter((c) => c.afkType === 'Nothing')
      .map((c) => ({
        subject: { kind: 'character', index: c.index } as const,
        result: 'fires' as const,
        slots: { suggestion: c.currentMap ?? 'a fighting map' },
      }));
  },
});
```

Rules for Detectors:
- **Engine Detectors** follow every rule below (purity, declared `reads`, no clock), are registered in `packages/engine`'s registry under the same id format, and use their module's golden tests as their examples (FR-11).
- **What they read:** only the Account State, never the raw Toolbox output. A Detector that needs a field M1's adapter doesn't expose yet adds that field to `@idleon-forge/account-state`, with a contract test, in the same PR (an M1 interface change). Hypothetical numbers ("this character on that map", #16) are computed in the parser worker and exposed as Account State fields. Detectors never call Toolbox functions.
- **What they hold:** no words a player reads and no Source. Those belong in the entry. A Detector's string slots are game identifiers (rawNames) that the template formats.
- **Purity is enforced three ways.** Biome `noRestrictedGlobals` bans `Date`, `Math.random`, `performance`, `globalThis` and `window` under `detectors/**`. The example harness runs each Detector twice and deep-compares the results. It also runs once with `globalThis.Date` replaced by a function that throws.
- **Reads are enforced by a proxy.** The harness wraps `state` in a Proxy that records every property path accessed and fails if a path isn't covered by a `reads` pattern. The engine records `reads` as the provenance of each output (#14 item 4), so the declaration has to be true.
- **Defensive by default.** An optional chain on a missing field must produce `unknown` with `reason: 'field-missing'`, not `silent`. The harness gives each Detector an `AccountState` with every optional field removed and requires it to return no `fires`.

### TR-5 Detector tests (fires / doesn't fire)

- One generic Vitest suite (`packages/kb-tools/test/detectors.test.ts`) iterates the registry. For each example it loads the fixture, which is parsed once and cached per run, applies `mutate`, runs the Detector with the fixture's `now` from its meta, and asserts the declared outcome.
- `private:` examples run only when `fixtures/private/<id>.raw.json` exists. In CI they are skipped, and the skip is reported.
- A co-located `<name>.test.ts` is optional, for Detectors whose logic deserves more than examples (arithmetic, history).
- **Coverage rule (FR-11):** at least one `fires` and one `silent` example, and at least one of the two must have no `mutate`. Progress Detectors use `expect: { value }` on at least one real fixture instead.

### TR-6 Templates

- **Syntax:** `{slot}` or `{slot:format}`. Formats: `int` (12,345), `compact` (13k, 1.2M), `pct` (12%), `coins` (Toolbox's coin tiers), `duration` (from ms, rounded to coarse buckets so small upstream formula changes don't move the text: under 1 h in 10 min steps, under 24 h in whole hours, then in days), `name` (humanizes a Toolbox identifier: `Poopy_Sewers` → "Poopy Sewers"), `date`.
- **Slots resolve from four places, in order:** the Detector finding's `slots`; the engine built-ins (`character`, `class`, `level`, `value`, `next`, `eta`, `stage`, `preset`); the entry's `values`; and the referenced facts (`extends`).
- **Compile-time check:** every slot in `text` and `why` must be provided by one of those four places, and must have a format compatible with its declared type (a number slot can't take `name`). An unknown slot fails `kb check`.
- **The character display label is never stored.** `{character}` is filled at render time by M10 from the save. Goldens fill it with `C1…Cn` (TR-15).
- **Rendering** returns a plain string. M10 renders it as a text node only (never `innerHTML`), so a template can never inject markup.

### TR-7 Compile

`kb compile` (run by `pnpm build` and `pnpm test`) does the following:
1. Loads `systems.yaml`, every `systems/*.yaml` and every `generated/*.json`, and validates each against the schema.
2. Runs the cross-entry rules (TR-8).
3. Drops retired entries, then resolves `include` blocks and `extends`.
4. Writes `dist/knowledge.json`:

```ts
interface CompiledKnowledge {
  version: { display: string /* "knowledge 2026.10.17.2" */; id: string /* "2026.10.17.2+3f9a1c2e" */; contentHash: string };
  builtFrom: { parserCommit: string; gameVersion: string; toolboxVersion: string };
  patches: string[]; // ordered game versions, oldest first (from generated/_patches.json)
  systems: SystemDef[];
  entries: Record<string, Entry>; // active + contested only
  facts: Record<string, FactTable>; // fact tables referenced by a shipped entry or Detector (TR-2a)
  byType: Record<EntryType, string[]>;
  priorityByStage: Record<StageId, { goals?: string; spend?: string; leverage?: string }>;
  manifest: Record<string, string>; // authored id -> sha256(canonical player-visible fields)[0..8] (FR-22)
  retired: Record<string, { title: string; replacedBy?: string }>; // retired authored entries, for What's new and "Not for me"
}
```

Compiling is deterministic: keys are sorted and the output carries no timestamp other than the version. The bundle is imported by `packages/engine` inside the parser Web Worker (ADR 0006) as a lazily loaded JSON chunk.

### TR-8 Cross-entry validation (`kb check`)

`kb check` runs all of these, and `pnpm test` runs it in CI:
- ids are unique across authored and generated entries (FR-4), and every reference resolves to an allowed type (FR-5). Allowed targets: `extends` → a generated entry of the same type; `Contribution.goal` and `Check.goal` → a Goal; Priority List items → a Goal, Check or Acquisition (a contested item is a contested entry, or an item with `verification: contested` and its own `sides`); `include` → a `block` Priority List (no cycles); `replacedBy` → any non-retired entry.
- Detector refs resolve, are of the right kind, and their `params` parse (FR-9). No orphan Detectors (FR-10).
- Template slots resolve (TR-6).
- Class names, talent names, monster, map and item rawNames all exist in `generated/_lookups.json`. A Build's talents belong to its class's talent tabs.
- No hand-copied facts (FR-17): numeric literals in authored `text`, `why`, `values`, `milestones` and Detector `params` are compared with the numeric values of the facts the entry references, ignoring 0, 1 and 2. A match is an error. Any other literal with 3 or more digits is a warning the reviewer must acknowledge in the PR. Under `detectors/**`, a lint rule warns on numeric literals of 2 or more digits that aren't in a named `params` default, because thresholds belong in entry params.
- Every `goals` and `spend` Priority List covers a Stage, and every Stage in `STAGES` has a `goals` list, otherwise a warning until the M2–M9 content lands. Within a list, an item appears at most once after `include`s are expanded; a `byUrgency` item (listed once, in the never-skip block, and moved to position 3 by the engine when `banked`) counts as one position. `byUrgency` is allowed only inside `metapath.priority.never-skip`.
- A warning when an entry's `appliesTo` names a Stage whose `goals` list doesn't reference it, directly, through a block or by `carryForward` (M2 FR-21). Verdict blockers are exempt (they are never list items).
- `spend` TierItems appear only in `list: spend`, their `ref` resolves to a generated Acquisition, and `item` slugs are unique within the list.
- Fact table ids resolve (FR-5), every authored fact table has a tier 2–3 Source with `claimDate`, and a Build step's talent exists in the talent fact tables.
- The single-entry rules (TR-2 `entryRules`), including the blocker rules (FR-6, FR-7).
- A Meta Path `milestones` entry's Detector ids are of kind `milestone`.
- The structural privacy gate (TR-16).

Each error prints `path:line id: message`, and the command exits non-zero. Warnings print but don't fail, except `--strict` (used in CI for `packages/knowledge` PRs), which fails on the hand-copied-fact warning when the PR doesn't acknowledge it.

### TR-9 System registry and "Not covered yet"

- `systems.yaml` lists every System in the MVP coverage: W1–W3 plus the W4 entry, the dossier Systems, around 45. Each has `unlocked` (`always` or a milestone Detector).
- `coverage(state, kb)` returns the Systems whose `unlocked` Detector says `yes` (or that are `always` unlocked) and that have no active or contested entry, sorted by world then name. An `unknown` unlock is treated as unlocked, which errs toward listing.
- A System counts as covered when it has at least one authored (non-generated) active or contested entry. Generated facts alone don't count (D5).

### TR-10 Codegen of facts at parser re-sync (ADR 0007)

**When it runs**
- `scripts/sync.sh` gains two final steps: `pnpm kb generate`, then `pnpm kb golden -u`. The weekly sync PR (#14 item 11) therefore carries the parser diff, the regenerated `generated/*.json`, the fact diff and any held facts in its body, and the golden diffs. The weekly Action (M12) opens it with a Forge Bot installation token, so CI runs on it; a PR opened with the default `GITHUB_TOKEN` runs no workflows (Final rulings RT-1, M12 TR-15).
- `fetch-data.sh` also fetches `/data/patch-notes.js`, so `generate` can build `_patches.json` without a full sync. The file is a JSX module (it imports React and `@mui/material`), so the `_patches` generator extracts `gameVer` and `date` with a regex, as `sync.sh` already does, and never imports it.
- CI runs `pnpm kb generate --check`, which regenerates into a temp dir and diffs against the committed files (FR-15).

**Inputs**
- `packages/toolbox-parsers/vendor/data/website-data/*.json`, through its `index.js` exports: 29 per-key files plus `shared-data.json` with 134 keys at pin `6c37e3d`.
- `vendor/data/patch-notes.js`, the ordered `gameVer` list.
- Selected exported constants from vendored parsers, for example `DEATH_NOTE_RANKS` and `MINI_BOSS_DEATH_NOTE_RANKS` from `parsers/world-3/deathNote.ts`. The generator runner bundles these with the same esbuild alias plugin as `scripts/build.mjs`, in Node only.
- `UPSTREAM`: commit, commit date, Toolbox version and game version.

**Generator contract**

```ts
// packages/knowledge/generators/types.ts
export interface GeneratorInput {
  data: ToolboxGameData;                 // typed by vendor/data/website-data.d.ts
  constants: Record<string, unknown>;    // only the named exports the generator declares
  pin: { commit: string; commitDate: string; gameVersion: string; toolboxVersion: string };
}
export interface Generator {
  system: string;
  /** Declared inputs, used for provenance (generatedBy.inputs and the Source URL) and for the fact diff. */
  inputs: readonly string[];             // "website-data/shared-data.json#deathNote", "parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS"
  run(input: GeneratorInput): GeneratedEntry[];
}
```

**Rules**
- **Pure and deterministic.** No clock and no network. Output is sorted by id and written as 2-space JSON with sorted keys and a trailing newline, so diffs stay minimal and readable.
- **ids come from rawNames,** slugified (`poopSmall` → `poop-small`), never from array positions, so a reorder upstream doesn't churn ids. Slug collisions fail generation.
- **Numbers come from value fields, never from description text.** Example: bribe `Insider_Trading` has `desc` "All stamps cost 5% less" but `value: 8`. The `value` is the fact (the W1 dossier confirms that two bribes differ from their text). A generator test for every generator asserts at least one value against a hand-checked expectation.
- **Template text in generated entries is the generator's own,** factual and neutral ("{value:compact} Poop kills; next Death Note rank at {next:compact}"). A generated `why` states only what the game says the reward does. Judgment belongs to authored entries that `extend` it.
- **Trimmed output.** A generator emits only the fields its entries need. `monsterDrops.json` alone is 4 MB, so the obol generator emits only obol rows.
- **Lookups:** `generated/_lookups.json` holds name tables (classes and their promotion tree from `classPromotions`, talent names per tab, item, monster and map rawNames). It's used by `kb check` only, and never shipped.
- **Renames:** when an id disappears and a new id appears with the same `title` or display name, the fact diff prints `possible rename: old → new`. A sync PR may then change authored YAML in exactly one way: a mechanical id substitution that follows a printed rename. That is the one exception to TR-19 A1's separation of generator and authored changes, and it is listed in the PR body. Anything else waits for its own authored PR while the old id is held.
- **A failing generator never blocks the parser update.** When a generator throws (new data shape, missing key), or drops an id that authored YAML still references, `kb generate` keeps that generator's last good output (or just the dropped entries), with its old `generatedBy.commit` and Source, and records a **hold** in `generated/_held.json`: `{generator, ids, reason, issue, since}`. CI accepts held output only when it matches the hold record. Lines that use a held fact show `[facts behind]` with the older game version in the UI and in goldens. A hold older than 2 syncs fails CI, so it can't be forgotten. The parser bump that M1 needs on patch day therefore always merges on its own.
- **Generator tests don't break on balance changes.** Each generator has one test on a small, checked-in synthetic data slice with a hand-checked expected output (it proves the generator reads `value`, not `desc`), plus invariant tests on the live pinned data (ladders ascend, no duplicate ids, every id resolves, counts within a range). A real balance change moves the fact diff, never a test.
- **Normalisation:** world numbers are 1-based in entries (Toolbox data is 0-based). Placeholder rows (map names such as `Z` or `PlayerSelect`, maps with no enemies) are filtered before slugging, so the collision rule applies only to real rows.
- **Shared tables:** a value copied into many entries from one upstream table (for example `DEATH_NOTE_RANKS` into every monster's ladder) shows in the fact diff as one grouped change.

**MVP generators** (W1–W3 plus W4 entry, per ADR 0007's list)

| Generator | Toolbox input | Emits | For |
|---|---|---|---|
| `death-note` | `shared-data#deathNote`, `DEATH_NOTE_RANKS`, `MINI_BOSS_DEATH_NOTE_RANKS` | a Goal ladder per monster (`death-note.goal.<mob>`) | M4 |
| `upgrade-vault` | `shared-data#upgradeVault` | Acquisitions `upgrade-vault.acquisition.row-<i>` with `unlockLevel` gates (total vault levels, #24) and `maxLevel` | M7 |
| `vault-kills` | the `VaultKillzTotal` map list and the 5 scaled rows | kill-row Goal ladders (`upgrade-vault.goal.kill-row-map-<i>`) and the map → slot table `upgrade-vault.fact.kill-slots` | M4 |
| `stamps` | `stamps.json`, `shared-data#shops`, `quests.json`, `monsterDrops.json`, `crafts.json`, `items.json` | Acquisitions `stamps.acquisition.<slug>` with `itemReq`, cost bases, the material-cap step and M8's routes (TR-8 rules there: route worlds from `npcPlacements`, one-level craft) | M7, M8 |
| `quests` | `quests.json` | Acquisitions with quest requirements and rewards, for the W1–W3 NPCs; `quests.fact.gate-quests` (Dog Bone, Djonnut, Hoggindaz, Bellows, Gobo) | M2, M8 |
| `cards` | `cards.json`, `shared-data#cardSets`, `monsterDrops.json` | Goal ladders for card set tiers; card Acquisitions with base chance and set membership | M8 |
| `card-levels` | `cards.json` perTier, `monsterDrops.json` base chance | per-card Goal ladders `cards.goal.<card>` | M4 |
| `classes` | `classPromotions.json` | subclass and elite Acquisitions; `classes.fact.class-tree` (tier, line, swap sibling) | M2, M9 |
| `class-gates` | `expReq`, talent and obol data | the `classes.goal.level` ladder with labelled level gates | M4 |
| `portals` | `shared-data#mapPortals`, `mapPortalDestinations`, `mapNames`, `mapEnemies` | portal Goal ladders (one step per door) and the route path `portals.fact.world-routes` | M2, M4 |
| `world-gates` | `quests.ts` `isWorldFinished` (exported constant), `items.json` Crystal1–3 | `metapath.fact.world-gates`; authored tier 2 until the constant is exported | M2 |
| `skill-doors` | `mapPortals` on skilling maps, filtered by destination world | `skills.goal.door-<skill>` ladders | M4 |
| `tools` | `items.json` tools (`lvReqToEquip`), anvil recipes | `skills.goal.tool-<skill>` | M4 |
| `maps`, `lab-nodes`, `skill-classes` | `mapNames`, `mapEnemiesArray`, `monsters`, `mapPortals`, `mapPortalDestinations`, Toolbox's exported `getFilteredPortals`; `labBonuses`, `jewels`; `talents.json` | fact tables `maps.fact.maps`, `lab.fact.lab-nodes`, `talents.fact.skill-classes` | M5 |
| `bribes`, `statues`, `alchemy-p2w` | `shared-data#bribes`, `statues`, `CAULDRONS_MAX_LEVELS` | Acquisitions `bribes.acquisition.bribe-<i>` (with `soldBy`, `codeValue`), `statues.acquisition.statue-<i>`, `alchemy-p2w.acquisition.<group>-<upgrade>` | M7 |
| `talents` | `talents.json`, `items.json`, `quests.json`, `gemShop.json` | `talents.fact.*`: per-talent facts with `isAttack`, `skillAttackFor`, value tables from Toolbox's growth function; the groups `talents.fact.tab2-granting` and `talents.fact.bubble-capped`; reset items | M9 |
| `obols` | `monsterDrops.json` (obol rows), `shared-data#obols` | Acquisitions with drop rates per monster; slot gates and shapes | M8 |
| `afk` facts | prayer data, `trapsInfo`, items data, `items.json` `Type` | `prayers.fact.unending-energy-cap` (parsed from the curse text; generation fails loudly if it no longer parses), `trapping.fact.trap-durations`, `trapping.fact.trap-set-capacity`, `afk.fact.food-kinds` | M3 |
| `w2-w3` catalogues | `website-data` | bubble catalogue, merit rows (null-cost placeholders dropped), gem shop items, Post Office unlock, salt catalogue, Construction building catalogue | M6 |
| `_patches` | `patch-notes.js` | the ordered game-version list | M11 |
| `_lookups` | `talents.json`, `items.json`, `monsters.json`, `shared-data#mapNames` | name tables (validation only) | M11 |

Exported parser constants the generators need, and until then authored tier-2 fact tables under the same ids (M2 TR-7): the town-unlock class-level gates (`metapath.fact.town-unlocks`), the Obol Altar level (`obols.fact.obol-altar`), the gatekeeper NPCs, and family slot levels (`metapath.fact.family-slots`). M6's Toolbox-code constants are authored fact rows (TR-2a), diffed by M12 at each re-sync. A generator's owner module writes or reviews its expected-value test.

The meaning of each raw field (for example `mapPortals` values) is confirmed in that generator's test against a known save before the generator merges.

### TR-11 Staleness

- `isStale(entry, currentGameVersion, patches)` is true when the entry's `stale` block is set (and its `flaggedAt` ≤ current), or when `index(current) − index(max authored source gameVersion) ≥ 10` on `patches` (FR-19). Generated entries return false. Toolbox's notes list 42 distinct versions since October 2024; 10 versions back from 2.3.540 is 2.3.507 (May 2026), about four and a half months.
- **`_patches.json`:** the distinct `gameVer` values from Toolbox's patch notes (120 Toolbox releases carried only 42 distinct game versions at pin `6c37e3d`), deduplicated, oldest first, with letter suffixes normalised (`2.0.493a` → `2.0.493`). It skips game versions Toolbox never wrote notes for (for example 2.3.532–2.3.539).
- **"Current" game version:** the parser pin's `gameVersion`. A save's `serverBuild` is an integer (`GameVERSION`, such as 141) with no mapping to a game version in Toolbox data, so it is not used for staleness. Whether a save is newer than the pin is M1's call ("parser not caught up" banner), made by M1's `verifiedBuilds` rule (M1 FR-29, D3), which never compares a build with a game version. Staleness is never computed against the save.
- **Source game versions:** any `x.y.z` version is accepted, and is indexed at the newest listed version at or below it, so a Source verified on an unlisted in-game version (2.3.535) still counts. A version newer than the pin, or malformed, fails `kb check`.
- **Major patches (D2):** `packages/knowledge/majors.yaml` lists the game versions that count as major patches (a new world or a system overhaul). It is authored judgment, and the staleness pass proposes additions from the patch notes. "Dated after the current major patch" means a `claimDate` on or after the newest listed major patch's date.
- **The staleness pass (#17)** runs in an agent session when a sync PR lands with a new game version:
  1. Read the new patch-notes entries.
  2. List entries whose System, entities or rawNames appear in them (a deterministic `kb facts --mentions <patch>` query does this).
  3. Have the LLM judge each candidate.
  4. Open one PR that adds `stale:` blocks (with reason and PR link) and files `kb-candidate` issues for new Goals.
  Clearing a `stale:` block needs a new Source verified on the current version.

### TR-12 Ranking contract (consumed by `packages/engine`)

The engine implements #11 item 6 with M2's `compareGoals` (M2 TR-14), which owns the order: blockers, list position, urgency and deadline, fresh before Stale, cheapest, closest Milestone ETA, most Goals served, then id; Contested items are moved below the first non-contested one. M11 guarantees the data it needs:
1. **Verdict blockers:** Checks with `effect: blocker` (never contested, by FR-6); they are never list items.
2. **Positions** in the Stage's `goals` Priority List after `include`s are expanded: an `include` is one position, a tie of all the block's items, so blocks never shift later positions. `byUrgency` and `carryForward` flags are kept in the compiled list for the engine (M2 TR-13). A Goal not in the list ranks after every listed one.
3. **Stale and Contested flags** per entry (FR-19, FR-6), and `effortSeconds` for the cheapest tie-break.
4. `category` is a display label only and never orders anything (M6 D1; it replaces the earlier `rankClass`, which ordered by #10 item 5, superseded by #11 item 6 per M2 TR-14).

There is no numeric weight anywhere. The schema has no field to hold one (FR-8).

### TR-13 Versioning, manifest and "What's new"

- **Version id:** `YYYY.MM.DD.n+hash`. The date is the UTC date of the newest commit on the build's history that touches `packages/knowledge/`. `n` is that commit's ordinal among same-day commits touching the package, and `.n` is omitted when n = 1. `hash` is the first 8 hex digits of the compiled entries' sha256. The CI deploy job checks out with enough history (`fetch-depth: 0`). A build outside git (a tarball) uses `0000.00.00+hash`.
- **Display:** `knowledge 2026.10.17` (or `knowledge 2026.10.17.2`), in the footer (M10/M12). It is computed only in the deploy build, which checks out `main` with `fetch-depth: 0`. PR CI runs on a synthetic merge commit with shallow history, and squash merges renumber `.n`, so goldens and tests never include it: goldens show `knowledge #<contentHash8>`, and US-6 is tested with injected git metadata.
- **Manifest:** `id → hash8` for every shipped authored entry, hashed over player-visible fields only (FR-22). The app stores the last-seen manifest in localStorage (about 20 bytes × entries; around 30 KB at 1,500 entries).
- **`diffManifests(prev, next)`** returns `{added, changed, retired}` with titles. A generated fact that moved at a sync changes the hash of every authored entry that extends it, so those entries show as `changed`. A sync that moves no fact changes nothing.
- **Advice changes and code changes are listed separately** (#11 item 13): "What's new" shows the code changelog (Conventional Commits, M12) apart from these advice changes.

### TR-14 The scrubbed-fixture tool (`pnpm kb scrub`)

**Usage:** `pnpm kb scrub fixtures/private/<name>.raw.json --id scrubbed-w2 [--now <iso>]`

**Input:** a Toolbox "Copy for support" export (#9). Its top-level keys are `accountCreateTime, charNames, companion, data, extraData, guildData, lastUpdated, serverVars, tournament`.

**Policy** (`packages/kb-tools/src/scrub/policy.ts`) is a table of rules. Each rule is a path pattern, an action (`keep`, `blank`, `drop`, `rename-chars`, `pseudonym`, `review`), and, for `keep` on string leaves, the values it allows: a `_lookups` table name, a value set or a regex. A path-only `keep` on strings is rejected by the policy's own schema, because a path that holds an id today can hold a name tomorrow (`data.OptLacc[37]` holds another guild member's name in a public save). Every string leaf in the output must be covered by a rule. `blank` keeps the type: a string becomes `""`, a number 0, an array `[]`, an object `{}`.

| Path | Action | Why |
|---|---|---|
| top-level keys other than the 9 above | **fail** | a new export format must be reviewed |
| `charNames[i]` | `rename-chars` → `Char{i+1}` | names |
| known name positions: `data.CogO` (`Player_<name>`), the player entries in `tournament.match.d` | structured replace with the mapped `Char{n}` | names inside game strings (found in `CogO` on the W2 save) |
| any other string leaf, or JSON-decoded token, that **equals** an original character name | replaced with the mapped `Char{n}` | exact matches only: substring replacement corrupts game ids (a public save's spelunking item `Knightly_Twohander` contains the character name `Two`, and the bubble `Call_Me_Bob` would break for a character named Bob) |
| `companion.e` | `keep` (value regex `^[\d,]*$`) | the equipped companion (`misc.ts:1387` splits it), not an identifier |
| `guildData.id` | `blank` | guild identity |
| `guildData.members[*].a` | `pseudonym` → `Member{n}` | other players' names; numbers kept so the guild parse still runs (`guild.ts:127` maps over the array) |
| `guildData.members[*].b` | `blank` | |
| `data.Guild` string leaves | `blank` unless value-allowlisted | guild name |
| `tournament.user` | numbers `keep`, strings `blank` | `tournament.ts` reads `user.r` and `user.l` |
| `tournament.match.d` | decoded; own characters `Char{n}`, opponents `pseudonym` → `Opponent{n}`, battle tokens value-allowlisted | other players' names |
| `tournament.leaderboard` | `blank` (`[]`) | other players |
| `serverVars.*` | `keep` only for the keys in `SERVER_VARS_READ`, value-checked; every other key `blank` | server-wide broadcast data that names other players and guilds (`*Chat*`, `Comp_RaffleWinners`, `GuildRank`, `hr_w`, test strings). `SERVER_VARS_READ` is generated at each sync from the `serverVars` keys the vendored parsers read; a newly read key stops the scrub until reviewed |
| `data.OptLacc[i]` string slots | `blank` unless `i` is in the reviewed `OPTLACC_STRING_KEEP` list (the slots parsers read as strings, such as 169 and 172) | free-text slots (`[37]` above) |
| `data.PlayerStuff_*`, `data.SteamAchieve` | `review` (keep numeric leaves; strings must pass the scan below) | may carry platform data |
| `accountCreateTime`, `lastUpdated`, timers in `data` | `keep` | the parser's time math depends on them (see red-team note 5) |
| everything else | numbers `keep`; strings only through a value-checked `keep`, then scanned | |

**Steps**
1. Read the export. Fail on an unknown top-level key.
2. Build the pseudonym map: `charNames[i]` → `Char{i+1}`, guild members → `Member{n}`, tournament opponents → `Opponent{n}`. Append every original name to `fixtures/private/denylist.txt` (gitignored, created if absent), so anyone who has scrubbed a save gets the pre-commit gate. The denylist also holds guild names, emails and account ids added by hand, one per line.
3. Walk every leaf. JSON-encoded string values are decoded, walked and re-encoded with the same formatting. Apply the policy.
4. **Unknown-string scan.** Every remaining string leaf must be one of: numeric-looking (digits and `,;:._x+-`); a value its rule allows (a `_lookups` table, a value set or a regex); a pseudonym; or shorter than 3 characters. `_lookups` covers items, monsters, maps, classes, talents, cards, cogs, quests, pets, and the sentinel values `Blank`, `Null` and `LockedInvSpace`. On the public saves, item, monster, map, class and talent names alone leave several hundred distinct values unexplained (844 on `latest`), so the scrub ships with those tables in place. Anything else is listed, grouped by path, and the tool stops. The fix is a value-checked rule or a new lookup table, never a path-only `keep` and never skipping the check.
5. **Denylist gate.** No string leaf of the output, and no decoded token, may equal a denylist line (case-insensitive) or contain it as a whole word (split on non-letters and on case changes). A denylist line that is also a `_lookups` value is checked as a whole-leaf match only, so a character named after an item doesn't block the scrub. The same gate runs over `packages/knowledge/golden/` and `fixtures/scrubbed/`.
6. **Parse equivalence.** Parse the original and the scrubbed export with the same `now` (the export's `lastUpdated`), the same seeded `Math.random`, and `TZ=UTC`. Toolbox's **full** `parseData` output (not just the Account State, which today exposes only a slice of it) must be deep-equal after applying the pseudonym map, outside the declared `SCRUBBED_OUTPUT_PATHS` (guild id, tournament player names, blanked serverVars text). An Account State contract test fails if any Account State field is derived from a path on that list. The engine output, rendered as a golden, must also be equal. Any difference stops the tool and prints the first differing paths. Together these guarantee that scrubbing never changes the advice, now and as Account State grows, without re-reading the raw save.
7. Write `fixtures/scrubbed/<id>.json` (pretty-printed, sorted keys) and `<id>.meta.json`:

```json
{
  "id": "scrubbed-w2",
  "description": "Early account at W2-late, 5 characters",
  "now": "2026-10-17T11:48:00Z",
  "exportedOn": "2026-10-17",
  "parserCommit": "6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1",
  "gameVersion": "2.3.540",
  "scrubber": { "version": 1, "matchedPolicyHash": "1c0ffee2" },
  "owner": "yasser",
  "consent": "https://github.com/YassSoliman/idleon-forge/pull/<n>#issuecomment-<id>",
  "characters": [
    { "label": "C1", "class": "Blood_Berserker", "level": 60 },
    { "label": "C2", "class": "Wizard", "level": 56 }
  ]
}
```

**CI structural gate** (the denylist is private, so CI checks structure instead): every `fixtures/scrubbed/*.json` must have `charNames` all matching `^Char\d+$`, `guildData.members[*].a` all matching `^Member\d+$`, an empty `guildData.id`, `tournament.leaderboard` empty, only `SERVER_VARS_READ` keys non-blank in `serverVars`, a `scrubber.matchedPolicyHash` equal to the hash of the current versions of the rules that matched it, and a non-empty `consent` link (D1). CI can't tell whose comment the link points to, so the code-owner reviewer confirms it is the save owner's. Consent relayed by Yasser (Joseph's, M1 Final rulings D1) is linked to that ruling. Editing a rule that matched a fixture forces a re-scrub of that fixture; editing other rules doesn't. A re-scrub needs the owner's raw save, so only the owner can run it. Raw saves stay with their owners (plus an owner-controlled encrypted backup), never in the repo (Final rulings RT-2). A re-scrub that only removes more needs no new consent; if anything new is kept, the owner is asked again, and `kb scrub` prints the diff of kept fields against the previous scrub so this is visible (Final rulings RT-3).

**Locally,** a `pre-commit` hook in `.githooks/`, enabled by `pnpm install` through `core.hooksPath`, runs the denylist gate on staged files whenever `fixtures/private/denylist.txt` exists.

### TR-15 The golden snapshot format

**One file per fixture:** `packages/knowledge/golden/<fixture>.md`, committed for public and scrubbed fixtures. Private fixtures write to `fixtures/private/golden/<id>.md` (gitignored). A golden is Markdown-flavoured plain text. It is deterministic, it is sorted wherever the engine output has no order, and it never contains a name, because characters are always `C1…Cn` in save order whatever the fixture.

**Fixed run parameters:** `now` from the fixture's meta (public fixtures: their `lastUpdated`), Expected Return of 8 h, empty save history.

**Sections, in order**
1. A header line.
2. `## Verdict changes`, filled only by `kb golden --diff-base <ref>` in PR CI, so reviewers see Verdict flips first. It's empty in the committed file.
3. The Now-screen block: the progress bar, Visit Order, then one block per character and the Account section, in engine order, each line with its entry id and Source tag. This section is M10's `renderNowText(buildNowView(…))` output (M10 TR-15), so there is one golden format; M10's hand-written view fixtures keep their own component snapshots.
4. `## Not covered yet`.
5. `## Findings`: every Detector finding, including ones not shown on the Now screen, as one sorted table. This catches Detector changes the top-3 cut would hide.

Until the engine modules (M2–M9) exist, sections 2–4 show `(engine not built)`, and the Findings table alone is the golden.

```
# golden v1: scrubbed-w2 · knowledge #3f9a1c2e · parser 6c37e3d (game 2.3.540) · now 2026-10-17T11:48:00Z · return 8h · stage W2-late

## Verdict changes

## Now
progress: 3 of 5 Ready
visit order: C4, C1, C2, C3, C5

### C4 · Shaman 44 · Fix before you leave
- [blocker] Assign C4 to a cauldron  ⟨alchemy.check.empty-cauldron · T1 2.3.540⟩
- [goal 1] Big bubbles: 0 of 2 equipped → Equip Call Me Bob in big-bubble slot 1  ⟨alchemy.goal.big-bubbles-equipped · alchemy.check.empty-big-bubble-slot · T1 2.3.540⟩
- [purpose] Fighting Jar Bridge: Jar kills 41k, next 100k in ~9 h  ⟨death-note.contribution.fight-jar · T1 gen⟩
- [contested] First Gem Shop buy: Infinity Hammer | Crystal 3D Printer and card slots  ⟨gemshop.goal.first-buy · T3 2026-09-23 | T3 2026-10-11⟩

### C1 · Blood_Berserker 60 · Ready
- [goal 1] … ⟨…⟩
- [stale] … ⟨… · T3 2.3.520 · stale⟩

### Account
- [goal 1] Spend coins: buy Bigger Damage on C1 → Monster Tax  ⟨spend.goal.plan · spend.priority.w2-late#bigger-damage · T1 gen⟩

## Not covered yet
Arcade

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.no-afk-target | afk/no-afk-target | — | silent | |
| alchemy.check.empty-big-bubble-slot | alchemy/empty-big-bubble-slot | C1 | fires | bubble=Call_Me_Bob slot=1 |
| death-note.goal.poop-small | death-note/kills-of-monster | account | value | value=13021 |
```

**Golden slot check:** every string slot printed in a golden must be a `_lookups` value, a pseudonym or `C<n>` (FR-27). A Detector that passes a free string from the save (such as `CogO`'s `Player_<name>`) fails here.

**Harness:** `pnpm kb golden` renders every fixture and compares. On a difference it prints a unified diff and fails. `-u` rewrites the files, and `--only <id>` limits the run. In PR CI, `--diff-base origin/main` also renders the base branch's goldens and fills `## Verdict changes` in the job summary (`$GITHUB_STEP_SUMMARY`), so no bot token or PR comment is needed.

**Format version:** the header starts `# golden v1`. A format change bumps it and regenerates every golden in its own PR.

**What keeps goldens stable** (they should change only when advice changes):
- The header shows `knowledge #<contentHash8>`, never the date version (TR-13), so merges and rebases don't touch it.
- A line citing a generated Source prints `T1 gen`; the parser pin and game version appear once, in the header. A sync therefore changes one header line per golden, plus the lines whose facts actually moved.
- Durations use the coarse `duration` buckets (TR-6).
- Parsing runs with the frozen clock, a seeded `Math.random` (Toolbox's construction optimizer calls it), `TZ=UTC` and the `en-US` locale.
- **Public fixtures are pinned by content.** `sync.sh` deletes and recopies Toolbox's public saves, and Toolbox may rename or replace them. `packages/account-state/fixtures/public/manifest.json` maps each of our fixture ids to its upstream path and sha256. A sync that changes or removes a pinned file reports "public fixture changed upstream" in the PR body. Fixtures that a Detector example or a golden relies on are kept as frozen copies under our id until a PR moves those examples.
- **Retiring a scrubbed fixture (D4) is a migration:** the PR that drops one first moves every Detector example whose only real-save example used it, and `kb check` fails on an example that names a missing fixture.

### TR-16 CI

The existing `CI` job (lint, typecheck, test, build) gains:
- `pnpm kb generate --check`, then `pnpm kb check --strict`, then `pnpm kb golden` (inside `pnpm test`), then the structural privacy gate.
- A cache of the parsed fixtures, keyed by `UPSTREAM`, the fixture hashes, and the hashes of the parser bundle, the Account State adapter and the frozen-clock shim, so an adapter change can't be served stale results.
- CODEOWNERS (D6, narrowed by Final rulings RT-4), with branch protection requiring one code-owner approval, so either one suffices on the co-owned paths (the last matching pattern wins):

  ```
  /packages/knowledge/             @YassSoliman @JoKhalil
  /packages/knowledge/detectors/   @YassSoliman
  /packages/knowledge/generators/  @YassSoliman
  /packages/knowledge/src/         @YassSoliman
  /fixtures/scrubbed/              @YassSoliman @JoKhalil
  ```

  Joseph co-owns the YAML entries (`systems/`, `systems.yaml`, `majors.yaml`), the generated facts (`generated/`) and the goldens (`golden/`), plus the scrubbed fixtures. The code paths above, `packages/kb-tools/`, the scrub policy and CI stay `@YassSoliman` only. `JoKhalil` takes effect once Joseph accepts the collaborator invite (#7, M12 Appendix A step 4); M12 TR-18 carries the same block. Goldens live in `packages/knowledge/golden/`, so a content-only Knowledge Base PR never needs a Yasser-only path. GitHub doesn't let an author approve their own PR, so agent PRs are opened by the Forge Bot GitHub App (`idleon-forge-bot`, live; `scripts/forge-bot-token.sh` gives an agent a 1-hour bot token), and Yasser approves them (Final rulings RT-1).
- The PR template gains a "Knowledge Base" block: entries added, changed and retired; Sources table; golden summary per fixture; hand-copied-fact warnings acknowledged; red-team status.

### TR-17 Performance budgets

| What | Budget |
|---|---|
| `kb generate` (all generators) | ≤ 15 s on CI |
| `kb compile` | ≤ 5 s |
| `kb check` including the Detector examples (fixtures cached) | ≤ 60 s |
| `kb golden` over 13 fixtures (parse 0.3–1.1 s each, plus engine) | ≤ 2 min |
| Compiled bundle shipped | ≤ 400 KB raw, ≤ 120 KB gzip at MVP coverage. CI fails at +20 % over the budget file `kb-budget.json` |
| All Detectors on one save, in the worker | ≤ 50 ms p95 on the `highend` fixture on CI hardware. Per Detector ≤ 5 ms (reported, warning only, to avoid flaky CI) |
| `loadKnowledge()` cold, in the worker | ≤ 30 ms (JSON parse of the bundle) |

### TR-18 Security and privacy

- **No secrets.** M11 needs no tokens. Fork PRs run every M11 check.
- **Untrusted YAML:** the safe parser options in TR-2 (no aliases, no custom tags) and the size caps. The app never parses YAML; it loads only compiled JSON produced in CI.
- **Untrusted text:** templates reject `<` and `>`, M10 renders text nodes only, and Source links open with `rel="noopener noreferrer"` and must be https.
- **Detector code is code.** CODEOWNERS review, import restrictions and banned globals apply. Detectors can't reach network, storage or the DOM, because Biome bans those globals under `detectors/**` and the worker has no DOM.
- **Privacy gates:** scrub policy plus unknown-string scan plus denylist (local), the structural gate (CI), goldens with `C1…Cn` labels by construction, and `entryReportFields()` with a whitelist and a test against the fixture's `charNames` (FR-29); the full report payload is M13's `SuggestionContext`, scrubbed and previewed by M13.
- **Content licence:** entries paraphrase and cite. They never paste guide text (`note` ≤ 200 characters). AutoReview tiers are cited, not copied (#3).

### TR-19 Agent authoring and red-team workflow

Every route into the Knowledge Base goes through the same pipeline (#11 item 11): a new or updated dossier, a Suggestion turned into a Knowledge Base change (M13), a staleness flag, or offline rule mining (#17).

**A. Author (an agent, in a Claude Code session)**
1. **Claim the work.** It's a GitHub issue labelled `area:kb`. Branch `kb/<system>-<slug>` from `main`. One System, or one cross-System Priority List, per PR. Generator changes and authored changes go in separate PRs.
2. **Read** the System's dossier, the #27 overlay rows for it, the #26 Stage lists it appears in, `GLOSSARY.md` and ADRs 0002, 0004, 0005 and 0007.
3. **Facts first.** Run `pnpm kb facts <system>` to list the generated entries and lookups for the System. If a fact the entries need isn't generated but is in Toolbox data, write or extend a generator first (its own PR), and never type the number into YAML. If the fact isn't in game data at all (for example "which obols you can obtain", #16), it becomes an authored Acquisition with a tier 2–3 Source.
4. **Draft entries** with `pnpm kb new <type> <system>/<slug>`, which writes a schema-valid skeleton. For each entry:
   - Fill `text`, `why` and `appliesTo`.
   - Add Sources with `claimDate` and the #27 `verification`.
   - Set `confidence`: H for game data or code, M for one current tier-3 Source, L for unverified dossier reasoning.
   - Set `status`. Apply ADR 0004 strictly for facts (the newer Source wins within a tier). For judgment entries (Priority Lists, Builds, the Meta Path), mark the entry contested with both sides whenever two or more Sources dated after the current major patch disagree, whatever their tiers or dates (D2).
5. **Write or extend Detectors** with params, slots and `reads`, plus at least one `fires` and one `silent` example on real fixtures (scrubbed or public), then mutations for the edge cases. If a field is missing, extend the Account State adapter with a contract test.
6. **Run** `pnpm kb check --strict && pnpm kb golden -u && pnpm test`. Read every golden diff as a player would.
7. **Self-check** against the red-team checklist below. Fix what it finds.
8. **Open a draft PR** with the template's Knowledge Base block filled in. List any `private:` example results in the PR as aggregates only (fires on 2 of 6 characters), never with names.

**B. Red team (a second agent, fresh context, D7)**
By default the red team is the same model as the author, in a fresh session with this brief. A PR that adds or changes a Verdict blocker or a Stage Priority List gets a different, stronger model instead, and the PR template records which one ran. The red-team agent gets only the PR diff, the dossier link, the fixtures and this checklist, not the author's reasoning. It must do each step, not just read:
1. **Re-derive each claim from its Source.** Open every URL. Confirm the claim, its date (`claimDate`, not page date) and its tier. Flag a Source older than the current patch that describes a mechanic the patch notes touch.
2. **Hunt for hand-copied facts.** Any number in YAML that Toolbox data holds is a defect.
3. **Try to make it fire wrongly.** Write at least 3 mutations per Detector: a missing field (expect `unknown`), a boundary value (exactly at the threshold), and a character of a class the entry doesn't apply to. Run them with `pnpm kb try <detector> <fixture> --mutate <file>`, a throwaway script that is never committed.
4. **Verdict safety.** For each blocker, ask: can this say "Fix before you leave" on an account that is actually safe? Check it against every scrubbed golden. Confirm it has a tier 1 or 2 Source that establishes the mechanic itself, not just a related one (D3).
5. **Contested handling.** Same-tier disagreement that isn't marked; a contested item at position 1; a "corrected" #27 row ignored.
6. **Wording.** Templates follow GLOSSARY terms, `why` is one line, there is no hype, and the text is understandable without the dossier.
7. **Privacy.** No names, no account data, no quotes from private saves in the PR text or the goldens.
8. **Ranking sanity.** For each changed Priority List, check that the top 3 Next Actions on each scrubbed golden match what the dossier's worked example (#26 §5) would do.

The red team posts findings as one PR review, each with a severity: `blocking` (wrong advice, wrong blocker, leak, hand-copied fact) or `non-blocking`. The author fixes them, or answers each with evidence. The loop repeats until the red team approves with no open blocking finding. If they still disagree after two rounds, the disagreement goes to the human reviewer in the PR, and nothing is silently resolved.

**C. Player review (Yasser or Joseph)**
1. Read the `## Verdict changes` summary and the golden diffs for the scrubbed fixtures, and run `pnpm kb golden --only private:<self>` locally on your own fresh save.
2. Answer as a player: "Would I do this, in this order, today?"
3. Approve through CODEOWNERS and merge. Only Yasser and Joseph merge (#11 item 16).

**D. The staleness pass** (TR-11) and **offline rule mining** (#17) both open PRs that enter at step A6: they produce entries and flags, then run red team and player review like any other PR.

**E. After merge.** The deploy carries the new Knowledge Base version. Reports and Suggestions about an entry (M13) reopen the loop at step A1, with the entry ids from `entryReportFields()` and the versions from `BuildInfo`, as carried in M13's `SuggestionContext`.

## 6. States and edge cases

| State | What happens |
|---|---|
| **Compiled bundle fails to load in the worker** (corrupt chunk, failed deploy) | The engine returns a typed `KnowledgeUnavailable` error. M10 shows "Advice is unavailable right now" with the save data only. No partial advice. |
| **Loading** | The bundle is a static chunk cached by the SPA. Its first load happens alongside the parser bundle and never blocks sign-in. |
| **Offline** | The Knowledge Base ships with the app, with no network fetch, so it works offline once loaded. |
| **Broken parse / empty account** | The engine doesn't run (M1 `EmptyAccountError`), so no Detector sees a broken state. |
| **Parser section failed, or a field fails its presence check** | M1 reports it in `diagnostics.failedSections` and `diagnostics.unknownFields`, and `isKnown(state, path)` answers false through `FIELD_SECTIONS` and `FIELD_RAW_KEYS` (M1 FR-16, TR-11). `AccountState.warnings` stay display-only and are never read. A Detector whose `reads` touch an unknown path returns `unknown` with `parser-section-failed` or `field-missing`, and for blocker Checks the Verdict becomes Unknown, never Ready. |
| **Save newer than the parser pin** | "Parser not caught up" banner (M1/M10). Staleness is computed against the pin. Generated facts keep the pin's values and label their Source with the pin version, so the player sees which game version the numbers come from. |
| **Sync PR changes a fact an authored entry relies on** | The fact diff, the golden diff and CI (dangling reference) make it visible. Authored entries extend facts by id, so they inherit the new value without an edit. |
| **Sync PR drops a generated id that authored entries reference** | The old entry is held and the parser update still merges. The references move, using the `possible rename` hint, in the same PR (mechanical substitution only) or in a follow-up before the hold expires after 2 syncs. |
| **Generator meets a new data shape** | That generator's last good output is held (TR-10), the sync PR names it under "Held facts", and the parser update still merges. Lines using held facts show `[facts behind]` with the older game version. |
| **Entry Stale** | Still shown, ranked below fresh entries at equal position, with a Stale badge. |
| **Every entry in a Stage list is Stale** (a long gap without re-verification) | Still shown, in order. The golden header gains `stale: N of M`, so a PR reviewer sees the drift. |
| **Contested blocker attempted** | Rejected by schema (FR-6). |
| **Detector throws at runtime** (a shape CI never saw) | The engine catches it per Detector and records `unknown` plus a warning with the Detector id. If the Detector belongs to a blocker Check, the character's Verdict becomes Unknown; otherwise that entry's line is dropped. It never crashes and never says Ready because of a throw. |
| **Detector reads a field the adapter dropped after a sync** | The contract test fails in the sync PR. At runtime the read returns `unknown`. |
| **System with no entries** | Listed under "Not covered yet" if it's unlocked. Hidden if locked. |
| **Retired entry still referenced in a player's "Not for me" list** (M10 storage) | `replacedBy` maps the old id. With no replacement, the stored preference is dropped. |
| **Two entries render the same Next Action** (overlapping Checks) | `kb check` warns when two Checks share a Detector with equal params. The engine de-duplicates by (subject, rendered text). |
| **Second account in the same browser** | Not supported in the MVP (#10 item 16). The Knowledge Base is account-agnostic, so nothing in M11 depends on it. |
| **Multiple tabs** | The Knowledge Base is immutable per deploy. Two tabs on different deploys can show different versions, and the footer shows which. |
| **Manifest missing** (first visit, cleared storage) | "What's new: advice changes" is skipped, not shown as "everything changed". |
| **Scrub on a save with a new string field** | Stops with the field path (US-11). |
| **Scrubbed fixture falls behind the parser** | Each sync re-parses the scrubbed fixtures. Goldens change in the sync PR and are reviewed like any fact change. |
| **Our accounts move past a fixture's Stage** | The fixture stays, frozen. A new dated fixture is added for the new world or Stage, and the oldest is dropped past about 6 (D4). |
| **`scrubbed-w3` not committed yet** | Joseph has consented (M1 Final rulings D1). Until the PR that adds the fixture merges, its stories and examples run locally as `private:joseph-w3` and are reported as skipped in CI (D1). |
| **Private fixture absent** (CI, contributors) | `private:` examples and goldens are skipped and reported. Public and scrubbed coverage still gates the merge. |
| **Clock-dependent output** (timers, "fills in 3 h") | Always relative to the fixture `now`. Goldens are stable across days. |

## 7. Dependencies

| Module | What M11 needs from it | What it needs from M11 |
|---|---|---|
| **M1 Sync & Account State** | `AccountState`, `HistoryEntry` (M1 TR-14), `parseSave(envelope, { now })`, `account.gameVersion.{serverBuild, parserTarget}`, `diagnostics` and `isKnown` with `FIELD_SECTIONS` / `FIELD_RAW_KEYS` (M1 TR-11), `verifiedBuilds` for the "parser not caught up" banner (M1 FR-29; builds are never mapped to game versions), a seedable `Math.random` in the frozen-clock shim, the contract-test harness, and new fields as Detectors need them | the scrub tool and the scrubbed fixtures (TR-14, which meets M1 TR-17's scrub requirements) for its contract tests |
| **M2 Stage & Meta Path** | `STAGES` (in `packages/knowledge/src/stages.ts`), the list files and their order, `compareGoals` (M2 TR-14) | the `metapath` type with the `stages`, `pusher-rule` and `gate-chain` parts and the role fields; `priority` with blocks, `byUrgency`, `carryForward` and one-position includes; engine Detectors; fact tables and generators (`classes`, `portals` with `mapPortalDestinations`, `world-gates`, `quests`, town-unlock and Obol Altar constants); the `appliesTo`-without-list warning; `priorityByStage` |
| **M3 AFK Safety** | Verdict-blocker Checks and their content | `check` entries with `effect: blocker`, `usesExpectedReturn`, `CheckFinding.at`, `fixHolds`, `demotedBecause`, the `pass` result with `nextAt`; its generated facts (TR-10) |
| **M4 Purpose & Milestones** | Goal and Contribution content | `goal`, `contribution` with `goalFamily`, `stopHere`, `contestedOn`; the `death-note`, `vault-kills`, `card-levels`, `class-gates`, `skill-doors`, `tools` and `portals` generators; `etaMs` from kills/h |
| **M5 Higher-leverage options** | leverage Checks | `check` entries backed by engine Detectors (`leverage/*`); the `maps`, `lab-nodes` and `skill-classes` fact tables |
| **M6 Unspent & idle** | free-value and never-skip Checks | `check` with `effect: next-action`, `priority: { frame: by-urgency }`, `effortSeconds`, `doneWhen`, derived `affectsVerdict`; findings with `urgency`, `deadline`, `doneKey`, `nextChangeAt`; `block` Priority Lists; `order` lists (merit rows, gem buys); its catalogue facts and authored Toolbox-code constants |
| **M7 Spend Plan** | spend lists | `priority` with `list: spend` and the `spend` TierItem; engine Detectors (`spend/*`); the `upgrade-vault`, `stamps`, `bribes`, `statues` and `alchemy-p2w` Acquisitions |
| **M8 Collections** | card, obol and stamp content | `acquisition` (authored and generated) with M8's route data, card set ladders, `order` lists, authored fact tables (`stamps.fact.*`) |
| **M9 Builds** | Build content | `build` entries in M9 TR-5's shape (no Build Detector), the `talents` fact tables |
| **M10 Now screen UI** | `renderNowText` for golden section 3 | rendered text, Source labels (tier, game version, URL), Stale and Contested flags with sides, `coverage()`, `version.display` |
| **M12 Release** | the deploy job with `fetch-depth: 0`, the weekly sync Action running `kb generate` with a Forge Bot token, the CODEOWNERS block (TR-16) | `version`, `manifest`, `diffManifests()`, the budget check |
| **M13 Suggestions** | the delivery of Report this and Suggestions; `ReportContext` and `SuggestionContext` | `entryReportFields()`; Suggestions that become Knowledge Base changes enter TR-19 step A1 |
| **`packages/engine`** (shared by M2–M9; its core is built with M10) | `compareGoals` (M2), the per-Detector error isolation, the engine Detector registry, the rendering of golden sections 2–4 | the compiled bundle, `DetectorRegistry`, `render()` |

**Build order:** M11 follows M1 (#13). The tooling, schema, generators, scrub and Findings-only goldens can all ship before M2–M9. Each later module adds content and upgrades golden sections 2–4.

## 8. Decisions

Ruled by Yasser on 2026-10-17: every recommendation accepted as written, with D1 and D6 confirmed in detail.

- **D-1 Joseph's save becomes a committed scrubbed fixture, only with his explicit consent.** `scrubbed-w3` is scrubbed from Joseph's W3 save (6 characters, two Squires) and committed only in a PR that records Joseph's consent in its description (a link to his comment, his approval on that PR, or, as happened, consent relayed by Yasser on 2026-10-17, M1 Final rulings D1). Until that PR merges it runs locally only, as `private:joseph-w3`. *Why:* the #13 done bar needs a golden for both accounts, and the W3-early and two-Squire cases have no other real fixture (the public saves are all W4–W7). The scrub removes names and identifiers. What stays (class, level, progress, and timestamps, see red-team note 5) is already summarised in public issues, and consent covers it.
- **D-2 Facts follow ADR 0004 strictly; judgment is Contested when post-patch Sources disagree.** Facts take the newest Source within a tier. Judgment entries (Priority Lists, Builds, the Meta Path) are Contested whenever two or more Sources dated after the current major patch disagree, whatever their tier or order. ADR 0004 gains a one-line amendment saying so (in this PR). *Why:* recency settles facts, because a newer patch changes the game, but it doesn't settle opinion. A newer Reddit comment isn't more right than AutoReview. This also matches what #26 and #27 already did.
- **D-3 A Verdict blocker needs a tier 1 or 2 Source**, on top of `confidence: H` and never being contested (FR-7, enforced in `entryRules`). *Why:* blockers are AFK-safety mechanics (food, caps, an empty AFK Target, the wrong preset), and game data or code can establish all of them. A wrong blocker is the one failure the done bar names. Requiring a `private:` example as well would block contributors who don't have our saves.
- **D-4 Scrubbed fixtures are frozen and dated.** A new dated fixture is added at each new world or Stage (`scrubbed-w2-2026-10`, `scrubbed-w3-2026-12`, …), capped at about 6, dropping the oldest. Existing ones are never replaced by fresh exports. *Why:* early-game goldens are our only early-game regression tests, and the public saves start at W4. Frozen fixtures still re-parse at every sync, so they keep testing the current parser.
- **D-5 Generated facts are dormant data.** A generated entry that no authored entry references never shows on the Now screen by itself and doesn't count as coverage (FR-24, TR-9). *Why:* hundreds of generated ladders would bury the Priority List order (judgment) under raw facts. ADR 0007 already frames generated entries as what authored ones reference, and "Not covered yet" stays honest.
- **D-6 Joseph co-owns `packages/knowledge/` and `fixtures/scrubbed/`.** He is added as a collaborator (#7) and listed in CODEOWNERS for those two paths, and approval from either Yasser or Joseph is enough to merge there (TR-16, FR-28). Every other path stays Yasser-only. *Narrowed by Final rulings RT-4:* inside `packages/knowledge/`, `detectors/`, `generators/` and `src/` stay Yasser-only. *Why:* player review is the gate that matters for advice, and Joseph's account is the off-meta test case.
- **D-7 The red team is a fresh session of the author's model by default, and a stronger model for blockers and Stage lists.** A PR that adds or changes a Verdict blocker or a Stage Priority List gets a different, stronger model (TR-19 B). *Why:* fresh context with a forced re-derivation checklist catches most errors cheaply. The expensive independent pass is kept for the two places where a wrong entry hurts most: the done bar's blockers, and the order that drives every Next Action.

## 9. Red-team notes

1. **Hand-copied facts creep back in.** An author types "100k" or a stamp cost into YAML, and it rots at the next patch, which is exactly what ADR 0007 exists to stop. *Defence:* the generated `extends` path; schema bans on `chance` and `milestones` when extending; the hand-copied-fact check against referenced facts (FR-17), with `--strict` for 3+ digit literals; and red-team step B2.
2. **A generator reads the label instead of the value.** Toolbox data mixes display text and numbers, and some text is wrong (bribe Insider Trading reads "5%" with `value: 8`). A generator that parses descriptions ships wrong facts with tier-1 authority. *Defence:* the "numbers from value fields only" rule; a hand-checked value assertion per generator; and the fact diff in every sync PR.
3. **Detectors overfit to 13 fixtures.** Two early-game real saves and eleven late-game public ones can't show every account shape, so a Detector can fire wrongly on Joseph's next save or a public user's. *Defence:* `unknown` for missing data; the all-optional-fields-removed test; red-team mutations (boundary, missing field, wrong class); blockers needing H and a tier ≤ 2 Source (D3); per-Detector runtime isolation (a throw means Unknown, never Ready); and Report this closing the loop with the entry id.
4. **A scrubbed fixture leaks a name.** Names hide in nested JSON strings (`CogO`), and third-party names sit in server variables (raffle winners). A denylist-only scrub would miss a new field. *Defence:* the allowlist policy with mandatory coverage of every string leaf, the unknown-string scan, the local denylist gate plus pre-commit hook, the CI structural gate, the policy hash forcing a re-scrub, and goldens that use `C1…Cn` by construction.
5. **Kept timestamps fingerprint the account, and the fixture is attributable anyway.** `accountCreateTime` and timers are kept because the parser's time math needs them. The fixture is not anonymous: its `owner` field, its consent link and this spec say whose save it is. What the scrub removes is the in-game identity (character, guild and other players' names, ids) that would let someone find the account in-game or in leaderboards. *Defence:* that is accepted, stated plainly in the consent request (D1), and documented here. If it's ever judged too much, the fix is a uniform shift of every epoch field with a matching shift of `now`, verified by the same parse-equivalence check. It isn't in the MVP because a missed timer field would silently change advice.
6. **Golden fatigue.** A sync PR changes 13 goldens, and reviewers rubber-stamp them, so a wrong blocker slips through. *Defence:* `## Verdict changes` comes first in the job summary; the Findings table is sorted and stable, so diffs are small; generator PRs are separate from authored PRs; the PR template asks for a one-line summary per fixture; and Verdict-blocker PRs get the stronger red team (D7).
7. **Staleness turns everything grey.** At 1–2 week patches, "10 patches" is 10–20 weeks, so most community entries could go Stale within a season, and the badge stops meaning anything. *Defence:* Stale only demotes within a position and never hides an entry; the targeted staleness pass flags the entries a patch actually touched; re-verification is cheap (a new Source line); and the golden header counts Stale entries, so drift shows up in review. If the badge still proves too noisy, the threshold is one constant to tune.
8. **The red team shares the author's blind spots.** Same model, same Sources, same mistakes. *Defence:* fresh context without the author's reasoning; a checklist that forces actions (open each URL, write mutations, compare with #26's worked examples) rather than opinions; a stronger model for blockers and Stage lists (D7); and the final gate is a human player on their own fresh save.
9. **ids churn and break reports and preferences.** An upstream rename or a slug change breaks "Not for me" and old reports. *Defence:* ids come from rawNames, not positions; the `possible rename` hint; retired entries keep their ids and carry `replacedBy`; and Knowledge Base version plus game version travel with every report.
10. **Templates render wrong numbers.** Milliseconds shown as hours, or "13021" where "13k" was meant, or the reverse. Wrong-looking advice is as damaging as wrong advice. *Defence:* typed slot schemas per Detector, compile-time format checks, and goldens that show the rendered text, so every format change is visible in review.

## 10. Red-team log

An independent agent (fresh context, given only this spec, the glossary, the ADRs and read access to the slice-1 code and Toolbox's public saves) reviewed the spec on 2026-10-17 after the decisions were folded in, with extra weight on the scrub allowlist, codegen drift on patch day and golden brittleness. Each finding was then checked against the vendored parsers, the public saves, `sync.sh`, `fetch-data.sh`, `ci.yml` and Toolbox's `patch-notes.js` at pin `6c37e3d`. Totals: 22 findings (1 P0, 11 P1, 8 P2, 2 P3). 20 were fixed in full, and 2 were fixed in part, with the rest deferred to Yasser. Two proposed fixes were rejected (in R3 and R22) and replaced or dropped, with the reason given.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| R1 | P0 | Other players' names fall outside the policy (`data.OptLacc[37]` holds a guild member's name in a public save; `serverVars.GuildRank` is a guild leaderboard), and the string scan pushes authors toward path-wide `keep` rules that would pass them | fixed | TR-14: value-checked rules only (a path-only `keep` is rejected), serverVars kept only for keys the parsers read, `OptLacc` string slots blanked unless reviewed, wider `_lookups`, and an auto-seeded denylist |
| R2 | P1 | `companion.e` is the equipped companion (`misc.ts:1387`), not an identifier; blanking it changes the parse and the CI gate required it empty | fixed | Kept with a value regex; removed from the structural gate |
| R3 | P1 | Parse equivalence can't hold: blanking `guildData.members` and dropping `tournament.user/match` changes Toolbox's output, and Account State is only a slice of it | fixed | Members and opponents pseudonymised with numbers kept; equivalence runs on the full `parseData` output outside the declared `SCRUBBED_OUTPUT_PATHS`, and a contract test bans Account State from reading those paths. *Rejected:* an owner `kb scrub --verify` on every sync PR, which the contract test makes unnecessary |
| R4 | P1 | `serverBuild` is an integer with no mapping in patch notes; the notes have 120 releases but only 42 distinct game versions, with gaps and a `2.0.493a`; the file is JSX | fixed | TR-11: current = the pin's version; patches deduplicated and normalised; unlisted Source versions indexed at the nearest lower version; regex extraction; M1 owns the build → version table. *Corrected in the consistency pass:* M1 never maps builds to versions (M1 D3); "newer than the pin" is M1's `verifiedBuilds` rule (FR-29) |
| R5 | P1 | The date version in golden headers can't match itself (shallow synthetic merge commit; squash renumbers `.n`) | fixed | Goldens show the content hash only; the date version is computed in the deploy build only; US-6 uses injected git metadata |
| R6 | P1 | Provenance in generated entries makes every sync change every hash | fixed | FR-22: hashes cover player-visible fields only; generated ids are left out of the manifest and of What's new |
| R7 | P1 | The parser sync is held hostage by the knowledge tooling (failing generator, dropped id, red-team rule, generator value tests, no `golden -u`, `GITHUB_TOKEN` PRs skip CI); and TR-10 contradicts TR-19 A1 | fixed | Per-generator holds with `[facts behind]` and a 2-sync expiry; sync runs `kb golden -u`; fact-only sync PRs skip the red team; generator tests run on synthetic slices plus invariants; a CI-triggering token (M12); the rename substitution is the single stated exception to A1 |
| R8 | P1 | Goldens sat on a Yasser-only path, so Joseph's approval alone could never suffice; Yasser can't approve agent PRs opened under his own account | fixed in part | Goldens moved to `packages/knowledge/golden/`. The agent identity (a bot account or GitHub App) is deferred to Yasser. *Ruled (Final rulings RT-1):* the Forge Bot GitHub App, now live (TR-16) |
| R9 | P1 | US-9 put `## Verdict changes` in the committed golden; TR-15 says it lives only in the job summary | fixed | US-9 now points at `$GITHUB_STEP_SUMMARY` |
| R10 | P1 | A contested Priority List item had nowhere to keep its sides; the example used a `priority` id as an item; a contested Meta Path slot could skip `sides` | fixed | `TierItem.sides` with a refine, the example becomes `gemshop.goal.first-buy`, and a slot refine ties `status: contested` to `sides` |
| R11 | P1 | Retired titles and `replacedBy` weren't in the bundle | fixed | A `retired` map in the bundle (FR-22, TR-7) |
| R12 | P1 | "A policy change forces a re-scrub" fights frozen fixtures and private raw saves | fixed in part | The hash covers only the rules that matched each fixture, and only the owner can re-scrub. Where raw saves live and whether a re-scrub needs fresh consent are deferred to Yasser. *Ruled (Final rulings RT-2, RT-3):* raw saves stay with their owners plus an encrypted backup; a remove-only re-scrub needs no re-consent (TR-14) |
| R13 | P2 | Substring name replacement hits game ids (a public save's `Knightly_Twohander` contains the character name `Two`) | fixed | Exact matches plus known name positions only; the denylist matches whole words and treats lookup values as whole-leaf matches |
| R14 | P2 | Goldens churn for reasons unrelated to advice (T1 version on every line, recopied public fixtures, ETAs, the cache key, `Math.random`, TZ) | fixed | `T1 gen` lines; a public-fixture manifest pinned by sha256; coarse durations; a wider cache key; seeded `Math.random`, `TZ=UTC`, `en-US` |
| R15 | P2 | Staleness was undefined for inherited, item-level and contested Sources, and "major patch" was undefined | fixed | FR-19 counts only authored Sources; `majors.yaml` defines major patches |
| R16 | P2 | The hand-copied-fact check skipped `params` and Detector code, and small integers gave false positives | fixed | TR-8 scans `params`, ignores 0–2, and adds a lint for 2+ digit literals in `detectors/**` |
| R17 | P2 | Our own dossiers on mutable branches were cited as tier 1, so a blocker could meet D3 with our own write-up | fixed | FR-3: tier 1 only for Toolbox permalinks at a sha; the TR-3 examples now cite dossiers as tier 4 |
| R18 | P2 | Detectors can't tell which parser section failed (`warnings: string[]`) | fixed | M1 dependency: met by M1 TR-11's `diagnostics` and `isKnown` with `FIELD_SECTIONS` (§6, §7); `warnings` stay display-only |
| R19 | P2 | Generator assumptions vs data: placeholder map names collide, `DEATH_NOTE_RANKS` is one global table, worlds are 0-based | fixed | TR-10 normalisation rules; grouped fact-diff lines; US-4 reworded |
| R20 | P2 | Stories depended on `scrubbed-w3` (not in CI until consent), and dropping a fixture could orphan Detector examples | fixed | CI variants on `scrubbed-w2` for US-3, US-4 and US-5; fixture retirement as a migration |
| R21 | P3 | FR-27 couldn't be met as written, and goldens had no check on string slots | fixed | FR-27 scoped (public Toolbox saves exempt); a golden slot check added |
| R22 | P3 | Note 5 wrongly implied anonymity; FR-24 and TR-9 disagreed on contested coverage; any throw made a Verdict Unknown; CI can't verify whose consent it is; the cited "section 10" didn't exist | fixed | Note 5 rewritten, coverage aligned, throws scoped to blockers, the reviewer confirms consent. *Rejected:* the missing section 10, which is this section |

## Consistency pass (2026-10-17)

- **Schema hub updated in place** (TR-2, TR-4, TR-2b): `category` replaces `rankClass`; M9's role-keyed Build shape replaces the old one (no Build Detector kind); M4's `goalFamily`, `stopHere`, `contestedOn`; M6's `by-urgency`, `effortSeconds`, `doneWhen`, derived `affectsVerdict`; M3's and M6's finding fields and a `pass` result; `order` lists, `byUrgency`, `carryForward` and M7's `spend` TierItem; M2's Meta Path parts and role fields.
- **Fact tables** (TR-2a, `<system>.fact.<slug>`) and **engine Detectors** (`kind: 'engine'`) give the ad hoc `gen.*` ids and the module-specific Detectors of M2, M5 and M7 one valid home without adding an entry type.
- **Generators table** now lists every generator M2–M9 asked for, with its owner; `deathnote` → `death-note`, `vault` → `upgrade-vault` to match M4 and M6.
- **Ranking:** M2's `compareGoals` owns the order (TR-12); an `include` is one position.
- **Names:** `reportContext()` → `entryReportFields()` (M13 owns `ReportContext`); M1 dependencies use `diagnostics`/`isKnown` and `verifiedBuilds` (no build → version table, M1 D3); `HistoryEntry` is defined in M1 TR-14.
- **Final rulings folded in:** Forge Bot for agent PRs and the sync PR (RT-1), raw saves and re-scrub consent (RT-2, RT-3), Joseph's narrowed co-ownership with the CODEOWNERS block (RT-4), and Joseph's consent for `scrubbed-w3` (M1 Final rulings D1).

## Final rulings (Yasser, 2026-10-17)

These supersede anything above that conflicts with them.

> **Ruled by Yasser (2026-10-17), all as recommended:**
> - **RT-1:** agent PRs come from a GitHub App ("Forge Bot"), so Yasser can approve them. The same App token lets the sync PR trigger CI. Yasser is creating it from the setup runbook.
> - **RT-2:** raw saves stay with their owners, plus an owner-controlled encrypted backup, never in the repo.
> - **RT-3:** a re-scrub that only removes more doesn't need re-consent. Ask again if anything new is kept; the tool prints the diff.
> - **RT-4:** Joseph co-owns the YAML entries, generated facts and snapshots. `packages/knowledge/{detectors,generators,src}` stay Yasser-only.
