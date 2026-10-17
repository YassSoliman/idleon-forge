# M11 Knowledge tooling

Spec for [#39](https://github.com/YassSoliman/idleon-forge/issues/39), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft**, waiting on the open decisions (section 8) and a red-team pass.

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
- **FR-1** Every entry is one of seven types: `goal`, `contribution`, `check`, `priority` (Priority List), `build`, `acquisition` or `metapath` (Meta Path). An entry of any other type fails `kb check`.
- **FR-2** Every entry has `id`, `system`, `type`, `title`, `text` (a template with slots), `why`, `sources[]` (at least one), `appliesTo`, `confidence` (H/M/L) and `status` (active / contested / retired). A missing or empty field fails CI, and the error names the file, the line and the field.
- **FR-3** Every Source has an https URL, a title, an ADR 0004 tier (1–4), a verified date and the game version it was verified on. Tier 2 and tier 3 Sources must also carry `claimDate`, the date of the claim itself, not the page (#3).
- **FR-4** Entry ids are unique across authored and generated entries, follow `<system>.<type>.<slug>`, and their middle segment matches `type`.
- **FR-5** Every id an entry references (`extends`, `goal`, Priority List tiers, `replacedBy`, Acquisition `requires`) resolves to an existing entry of an allowed type. A Priority List cannot reference a retired entry. A dangling reference fails CI.
- **FR-6** An entry with `status: contested` carries at least two `contested.sides`, each with its own Sources. A contested entry can never be a Check with `effect: blocker`; CI rejects that combination.
- **FR-7** A Check with `effect: blocker` (a Verdict blocker) needs `confidence: H` and an evidence bar (D3). CI enforces it.
- **FR-8** Priority Lists hold ordered tiers of entry ids (ties allowed) and contain no numeric weight, score or rank field anywhere. Any unknown key fails CI (strict schema).

**Detectors**
- **FR-9** Every `detector.id` in YAML resolves to a registered Detector of the kind that entry type needs, and the entry's `params` pass that Detector's params schema.
- **FR-10** Every registered Detector is referenced by at least one entry. An orphan Detector fails CI.
- **FR-11** Every Detector declares at least one `fires` example and one `silent` example, and at least one of the two is a real save (public or scrubbed) rather than a mutated one. A generic test runs every example, and the job fails if any result differs from what the example declares.
- **FR-12** A Detector is deterministic. It gets the same result twice in a row on the same input. It throws if it touches `Date`, `Math.random`, `performance` or a global. It reads only the Account State fields it declares in `reads`, and a tracking proxy in tests enforces that.
- **FR-13** A Detector that can't tell from the data returns `unknown` for that subject. It never guesses `fires` or `silent`. If a Detector throws at runtime, the engine records `unknown` for that entry, and a CI test still catches the throw before merge.

**Generated facts (ADR 0007)**
- **FR-14** `kb generate` rebuilds every generated entry from the pinned Toolbox data. It runs at the end of `pnpm sync-parsers`, and its output is committed to `packages/knowledge/generated/`.
- **FR-15** CI regenerates the facts and fails if the committed output differs ("generated facts are out of date; run `pnpm kb generate`").
- **FR-16** A generated entry's Source is tier 1. Its URL points to the Toolbox file at the pinned commit, and its verified date and game version come from `UPSTREAM`.
- **FR-17** In authored YAML, a numeric literal equal to a value in a generated fact that the entry references fails CI ("hand-copied fact; use a slot"). Authored Acquisitions can't carry `chance`, and authored Goals that `extend` a generated Goal can't redefine `milestones`.
- **FR-18** `kb generate` prints a fact diff (added, removed, changed ids with old → new values, and possible renames) for the sync PR body. A removed generated id that an authored entry still references fails the sync PR.

**Lifecycle**
- **FR-19** An entry is **Stale** when its newest Source's game version is 10 or more game versions behind the current one, counted on the ordered patch list taken from Toolbox's patch notes, or when the staleness pass has flagged it (`stale:` block). Generated entries are never Stale by age, because they are rebuilt at every sync.
- **FR-20** Stale entries are still served. They rank below fresh entries at the same Priority List position and carry a Stale flag for the UI.
- **FR-21** `retired` entries are kept in YAML, which keeps their ids resolvable for old reports, but they are excluded from the runtime bundle. `retired.replacedBy` maps old ids to new ones.
- **FR-22** The compiled bundle carries a Knowledge Base version `YYYY.MM.DD[.n]` plus a content hash, and a manifest (`id → content hash`) for every active and contested entry.
- **FR-23** `diffManifests(old, new)` returns the entries that were added, changed and retired between two versions, for "What's new: advice changes".
- **FR-24** The System registry lists every System in scope for the MVP. `coverage(state)` returns the unlocked Systems that have no active entry, for "Not covered yet: …".

**Fixtures and goldens**
- **FR-25** `kb scrub` turns a private "Copy for support" export into a fixture with character names replaced by `Char1…CharN`, account identifiers and third-party names removed, and no string left that the scrub policy doesn't cover. Its parse must match the original's (TR-14).
- **FR-26** `kb golden` renders a deterministic golden snapshot per fixture (public, scrubbed, and private when present). CI fails when a committed golden differs from the rendered one. `kb golden -u` rewrites them.
- **FR-27** No committed file (fixture, golden, YAML, test) contains a real character name, guild name, account id or email. The local denylist gate and the CI structural gate both enforce it.

**Workflow**
- **FR-28** A Knowledge Base PR can't merge without: a green `kb check`, updated goldens, a red-team review with no open blocking findings, and approval from Yasser or Joseph through CODEOWNERS on `packages/knowledge/`.
- **FR-29** `reportContext()` returns exactly `{entryId, kbVersion, gameVersion, parserCommit, stage, class, level}` and nothing else.

## 4. User stories

Fixture ids: `scrubbed-w2` (W2-late, 5 characters) and `scrubbed-w3` (W3-early, 6 characters, two Squires) are the scrubbed fixtures (TR-14; `scrubbed-w3` depends on D1). `highend`, `fresh` and the other public ids are Toolbox's public saves. Unless a story says otherwise, "engine runs" means at the fixture's `now`, with an Expected Return of 8 h and no save history.

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
- **Given** `scrubbed-w3` and a contested Priority List item (for example the first Gem Shop buy) **When** the engine runs **Then** the golden shows it with `[contested]` and both sides' text and Sources, and it is never in position 1 of any character or of the Account section.
- **Given** a Check with `effect: blocker` and `status: contested` **When** `kb check` runs **Then** it fails with "a contested entry cannot be a Verdict blocker".

**US-4: game numbers stay right after a patch.**
As a player in a Play Session, I want kill Milestones and costs to match the current game, so that "next Milestone at 100k" is true today.
- **Given** a parser sync whose Toolbox data changes one Death Note rank threshold (synthetic data slice in the generator test) **When** `kb generate` runs **Then** `generated/deathnote.json` changes that one value, the fact diff lists it, and the `scrubbed-w3` golden shows the new Milestone, with no authored YAML edited.
- **Given** an authored entry that references a generated id the new data no longer produces **When** `kb generate` runs in the sync PR **Then** the PR fails and names the authored file and id.

**US-5: ActiveOn says what it doesn't know.**
As a player in a Play Session, I want a list of the unlocked Systems ActiveOn has no advice for yet, so that I don't mistake silence for "nothing to do".
- **Given** `scrubbed-w3`, and a registry in which Trapping is unlocked on the account but has no active entries **When** the engine runs **Then** the golden's Account section ends with `Not covered yet: Trapping`.
- **Given** `scrubbed-w2` (Post Office not unlocked) and no Post Office entries **When** the engine runs **Then** Post Office is not listed.

**US-6: I know which advice version I am on.**
As a player in a Play Session, I want the Knowledge Base version shown, so that a report or a chat with Joseph refers to the same advice.
- **Given** a build whose newest commit touching `packages/knowledge/` is dated 2026-10-17, the second such commit that day **When** the bundle compiles **Then** `kbVersion.display` is `knowledge 2026.10.17.2`, and the golden header shows the same string.

**US-7: advice changes are announced.**
As a player in a Play Session, I want "What's new" to list the advice that changed since my last visit, so that I'm not surprised when a Next Action changes.
- **Given** manifest A (stored by the app at the last visit) and bundle B, in which entry X's text changed, Y was added and Z was retired **When** `diffManifests(A, B)` runs **Then** it returns `{added: [Y], changed: [X], retired: [Z]}` with their titles.

**US-8: reporting wrong advice leaks nothing.**
As a player in a Play Session, I want "Report this" to send just enough to fix the entry, so that I can report freely without sharing my account.
- **Given** `scrubbed-w2` and a Next Action on character 2 produced by entry X **When** `reportContext()` runs for it **Then** the payload's keys are exactly `entryId, kbVersion, gameVersion, parserCommit, stage, class, level`, and no value matches any `charNames` entry of the fixture.

**US-9: no wrong Verdict blocker reaches us.**
As a player in a Play Session, I want every change to Verdicts reviewed on my own account before it ships, so that "Fix before you leave" is never wrong (the #13 done bar).
- **Given** a PR that changes a blocker Check **When** CI runs **Then** it fails until the goldens are updated, and the updated `scrubbed-w2` and `scrubbed-w3` goldens list every changed Verdict under `## Verdict changes` at the top of the diff.

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
  generated/_patches.json               ordered game versions from Toolbox patch notes
  generated/_lookups.json               validation tables: talent, item, monster, map, class names (not shipped)
  detectors/<system>/<name>.ts          Detectors, one per file, plus a co-located <name>.test.ts if needed
  detectors/index.ts                    the registry: `export const detectors = {...} satisfies DetectorRegistry`
  generators/<system>.gen.ts            fact generators (run in Node only, never bundled)
  src/schema.ts                         zod schema (TR-2)
  src/types.ts                          z.infer types, Detector types (TR-4)
  src/template.ts                       template parser and renderer (TR-6)
  src/stale.ts, src/version.ts, src/coverage.ts, src/report.ts
  src/index.ts                          runtime surface: loadKnowledge(), render(), isStale(), coverage(), diffManifests(), reportContext()
  dist/knowledge.json                   compiled bundle (build output, gitignored)
packages/kb-tools/                      dev only, private, never imported by apps/*
  src/cli.ts                            `pnpm kb <command>`
  src/generate.ts, compile.ts, check.ts, golden.ts, scrub/*.ts
  golden/<fixture>.md                   committed goldens for public and scrubbed fixtures
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

export const GoalEntry = Base.extend({
  type: z.literal('goal'),
  scope: z.enum(['character', 'account']),
  /** #10 ranking inside a character: blockers, then compounding, then spendables, then nice-to-haves. */
  rankClass: z.enum(['compounding', 'spendable', 'nice-to-have']),
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
  goal: EntryId, // the Goal this activity advances; one activity serving several Goals = several Contributions
  detector: DetectorRef, // a 'contribution' Detector
  /** #11 item 8: fighting gets an ETA from Toolbox kills per hour; skilling is yes/no only. */
  eta: z.enum(['kills-per-hour', 'none']),
});

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
});

const TierItem = z.union([
  EntryId,
  z.strictObject({
    ref: EntryId,
    verification: z.enum(['confirmed', 'corrected', 'contested', 'unverified']),
    sources: z.array(Source).default([]),
  }),
  /** Splice in a shared block (another Priority List with list: 'block'), e.g. #26's never-skip position-1 block. */
  z.strictObject({ include: EntryId }),
]);
export const PriorityEntry = Base.extend({
  type: z.literal('priority'),
  /** 'block' lists are only included by other lists; they have no Stage of their own. */
  list: z.enum(['goals', 'spend', 'leverage', 'block']),
  stage: StageId.optional(),
  /** Ordered positions; each position is a tie of one or more items. No weights, ever. */
  tiers: z.array(z.array(TierItem).min(1)).min(1),
});

export const BuildEntry = Base.extend({
  type: z.literal('build'),
  class: ClassName,
  preset: z.union([z.literal(1), z.literal(2)]),
  role: RoleId.optional(),
  order: z
    .array(
      z.strictObject({
        talent: RawName, // e.g. REFINERY_THROTTLE; checked against generated talents
        level: z.union([z.int().positive(), z.literal('max')]),
        note: Template.optional(),
      }),
    )
    .min(1),
  stars: z.array(RawName).default([]),
  detector: DetectorRef.default({ id: 'builds/talent-drift', params: {} }),
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
  part: z.enum(['slots', 'roles', 'milestones']),
  slots: z
    .array(
      z.strictObject({
        slot: z.union([z.int().min(1).max(11), z.strictObject({ from: z.int().min(1), to: z.int().max(11) })]),
        classLine: ClassName,
        role: RoleId.optional(),
        note: Template.optional(),
        status: z.enum(['active', 'contested']).default('active'),
        sides: z.array(Side).min(2).optional(),
      }),
    )
    .optional(),
  roles: z.array(z.strictObject({ id: RoleId, classLine: ClassName, does: Template })).optional(),
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
  generator: z.string(), // e.g. "deathnote"
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
    // D3 evidence bar is checked here once decided.
  }
  if (e.type === 'priority') {
    if ((e.list === 'block') !== (e.stage === undefined))
      ctx.addIssue({ code: 'custom', path: ['stage'], message: 'block lists have no stage; every other list has exactly one' });
    if (e.stage && !(e.appliesTo.stages !== 'all' && e.appliesTo.stages.length === 1 && e.appliesTo.stages[0] === e.stage))
      ctx.addIssue({ code: 'custom', path: ['appliesTo'], message: 'appliesTo.stages must be [stage]' });
  }
  if (e.type === 'metapath') {
    const present = (['slots', 'roles', 'milestones'] as const).filter((k) => e[k] !== undefined);
    if (present.length !== 1 || present[0] !== e.part)
      ctx.addIssue({ code: 'custom', path: ['part'], message: `part "${e.part}" needs exactly the "${e.part}" array` });
  }
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

### TR-3 One example entry of each type

These examples fix the shape. Their content is illustrative and gets drafted for real by the pipeline (TR-19). URLs marked `# illustrative` are placeholders that a real entry must replace.

**Goal (generated).** `generated/deathnote.json`, one of 104 normal-monster ladders. The thresholds are Toolbox's exported `DEATH_NOTE_RANKS` at pin `6c37e3d`.

```json
{
  "id": "deathnote.goal.poop-small",
  "system": "deathnote",
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
  "rankClass": "compounding",
  "unit": "kills",
  "progress": { "id": "deathnote/kills-of-monster", "params": { "monster": "poopSmall" } },
  "milestones": [
    { "at": 25000, "reward": "rank 1" }, { "at": 100000, "reward": "rank 2" }, { "at": 250000, "reward": "rank 3" },
    { "at": 500000, "reward": "rank 4" }, { "at": 1000000, "reward": "rank 5" }, { "at": 5000000, "reward": "rank 7" },
    { "at": 100000000, "reward": "rank 10" }
  ],
  "generatedBy": {
    "generator": "deathnote",
    "inputs": ["parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS", "website-data/shared-data.json#deathNote"],
    "commit": "6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1"
  }
}
```

An authored Goal adds judgment on top of a generated ladder, without copying any number:

```yaml
- id: deathnote.goal.w1-skulls
  title: Death Note skulls on W1 monsters
  extends: deathnote.goal.poop-small
  text: "{value:compact} Poop kills; next rank at {next:compact}, about {eta:duration} away"
  why: Multikill is on once the Death Note building is Lv 1, so every rank compounds AFK kills.
  sources:
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/w3-systems/docs/research/systems/w3-systems/worship-trapping-death-note.md#death-note
      title: W3 dossier, Death Note (from N.js)
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
  appliesTo: { stages: [{ from: W3-early, to: W4-entry }] }
  confidence: H
  status: active
  scope: account
  rankClass: compounding
  unit: kills
  progress: { id: deathnote/kills-of-monster, params: { monster: poopSmall } }
```

**Contribution.** Fighting on a map advances that map's Death Note Goal, with an ETA from Toolbox kills per hour.

```yaml
- id: deathnote.contribution.fight-poop
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
  goal: deathnote.goal.w1-skulls
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
      title: W2 dossier, Bubbles (game data; Toolbox missingBubbles)
      tier: 1
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

**Priority List.** The W3-early list from #26 §3.7 (excerpt), showing a shared block, ties, item-level verification and a contested item.

```yaml
- id: account.priority.w3-early
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
    - [{ include: account.priority.never-skip }]
    - [push.goal.next-portal]
    - [{ include: account.priority.free-value-fills }]
    - [{ ref: quests.goal.hoggindaz-1-5, verification: confirmed }]
    - [{ ref: construction.goal.printer-cruncher-arm, verification: corrected }]
    - [construction.goal.printer-samples]
    - [worship.goal.wax-skull-all, trapping.goal.traps-all]   # a tie
    - [{ ref: refinery.goal.redox-dioxide-ranks, verification: corrected,
         sources: [{ url: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa, title: shnaps progression gist,
                     tier: 3, claimDate: 2026-09-18, verified: 2026-10-17, gameVersion: 2.3.540 }] }]
    - [{ ref: shrines.goal.first-shrines, verification: contested }]
```

**Build.**

```yaml
- id: builds.build.squire-preset-2-construction
  title: Squire skilling preset
  text: "Preset {preset:int}: {talent:name} to {target}"
  why: The second preset is the class's skilling job; a Squire builds and refines.
  sources:
    - url: https://idleontoolbox.com/guides   # illustrative
      title: IdleOn Toolbox community build guide, Squire
      tier: 3
      claimDate: 2026-10-01
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: unverified
  appliesTo: { stages: [{ from: W2-mid, to: W4-entry }], classes: [Squire] }
  confidence: M
  status: active
  class: Squire
  preset: 2
  role: construction-builder
  order:
    - { talent: REFINERY_THROTTLE, level: max }
    - { talent: REDOX_RATES, level: max }
    - { talent: SHARPER_SAWS, level: 50 }
  stars: []
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
import type { AccountState, HistoryEntry } from '@idleon-forge/account-state'; // HistoryEntry: owned by M1

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
  /** Read-only access to compiled entries by id, e.g. a generated ladder or rate. */
  readonly facts: { get(id: string): Readonly<Entry> | undefined };
}

export type DetectorKind = 'check' | 'contribution' | 'progress' | 'milestone' | 'build' | 'acquisition';

interface FindingBase {
  subject: Subject;
  /** Values for the entry's templates; must match the Detector's slots schema. */
  slots: Record<string, SlotValue>;
}
export type CheckFinding = FindingBase & (
  | { result: 'fires'; /** epoch ms when the problem bites, for "fills in 3 h" */ at?: number }
  | { result: 'unknown'; reason: UnknownReason }
);
export type ContributionFinding = FindingBase & {
  advances: 'yes' | 'no' | 'unknown';
  /** Only for eta: kills-per-hour; ms to the next Milestone, from Toolbox kills/h (ADR 0005 arithmetic). */
  etaMs?: number | null;
};
export type ProgressFinding = FindingBase & ({ value: number } | { value: null; reason: UnknownReason });
export type MilestoneFinding = FindingBase & { reached: 'yes' | 'no' | 'unknown' };
export type BuildFinding = FindingBase & {
  preset: 1 | 2;
  drift: 'none' | 'behind' | 'off-build' | 'unknown';
  /** Talent rawNames that differ from the Build's order. */
  differs: string[];
};
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
  build: BuildFinding;
  acquisition: AcquisitionFinding;
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
| Check | `detector` | check | `result: fires` for each subject with the problem |
| Build | `detector` | build | `drift` other than `none` |
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

- **Syntax:** `{slot}` or `{slot:format}`. Formats: `int` (12,345), `compact` (13k, 1.2M), `pct` (12%), `coins` (Toolbox's coin tiers), `duration` (3 h 20 min, from ms), `name` (humanizes a Toolbox identifier: `Poopy_Sewers` → "Poopy Sewers"), `date`.
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
  byType: Record<EntryType, string[]>;
  priorityByStage: Record<StageId, { goals?: string; spend?: string; leverage?: string }>;
  manifest: Record<string, string>; // id -> sha256(canonical JSON)[0..8]
}
```

Compiling is deterministic: keys are sorted and the output carries no timestamp other than the version. The bundle is imported by `packages/engine` inside the parser Web Worker (ADR 0006) as a lazily loaded JSON chunk.

### TR-8 Cross-entry validation (`kb check`)

`kb check` runs all of these, and `pnpm test` runs it in CI:
- ids are unique across authored and generated entries (FR-4), and every reference resolves to an allowed type (FR-5). Allowed targets: `extends` → a generated entry of the same type; `Contribution.goal` and `Check.goal` → a Goal; Priority List items → a Goal, Check or Acquisition; `include` → a `block` Priority List (no cycles); `replacedBy` → any non-retired entry.
- Detector refs resolve, are of the right kind, and their `params` parse (FR-9). No orphan Detectors (FR-10).
- Template slots resolve (TR-6).
- Class names, talent names, monster, map and item rawNames all exist in `generated/_lookups.json`. A Build's talents belong to its class's talent tabs.
- No hand-copied facts (FR-17): numeric literals in authored `text`, `why`, `values` and `milestones` are compared with the numeric values of the facts the entry references. A match is an error. Any other literal with 3 or more digits is a warning the reviewer must acknowledge in the PR.
- Every non-block Priority List covers a Stage, and every Stage in `STAGES` has a `goals` list, otherwise a warning until the M2–M9 content lands. Within a list, an item appears at most once after `include`s are expanded.
- The single-entry rules (TR-2 `entryRules`), including the blocker rules (FR-6, FR-7).
- A Meta Path `milestones` entry's Detector ids are of kind `milestone`.
- The structural privacy gate (TR-16).

Each error prints `path:line id: message`, and the command exits non-zero. Warnings print but don't fail, except `--strict` (used in CI for `packages/knowledge` PRs), which fails on the hand-copied-fact warning when the PR doesn't acknowledge it.

### TR-9 System registry and "Not covered yet"

- `systems.yaml` lists every System in the MVP coverage: W1–W3 plus the W4 entry, the dossier Systems, around 45. Each has `unlocked` (`always` or a milestone Detector).
- `coverage(state, kb)` returns the Systems whose `unlocked` Detector says `yes` (or that are `always` unlocked) and that have no active or contested entry, sorted by world then name. An `unknown` unlock is treated as unlocked, which errs toward listing.
- A System counts as covered when it has at least one non-generated active entry. Generated facts alone don't count (D5).

### TR-10 Codegen of facts at parser re-sync (ADR 0007)

**When it runs**
- `scripts/sync.sh` gains one final step: `pnpm kb generate`. The weekly sync PR (#14 item 11) therefore carries the parser diff, the regenerated `generated/*.json`, the fact diff in its body and the golden diffs.
- `fetch-data.sh` also fetches `/data/patch-notes.js`, so `generate` can build `_patches.json` without a full sync.
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
- **Renames:** when an id disappears and a new id appears with the same `title` or display name, the fact diff prints `possible rename: old → new`. The sync PR fixes the authored references in the same PR.
- **A failing generator** (new data shape, missing key) fails the sync PR with the generator name and input path. The previous `generated/*.json` stays on `main`.

**MVP generators** (W1–W3 plus W4 entry, per ADR 0007's list)

| Generator | Toolbox input | Emits |
|---|---|---|
| `deathnote` | `shared-data#deathNote`, `DEATH_NOTE_RANKS`, `MINI_BOSS_DEATH_NOTE_RANKS` | a Goal ladder per monster |
| `vault` | `shared-data#upgradeVault` | Acquisitions with `unlockLevel` gates (total vault levels, #24) and `maxLevel` |
| `stamps` | `stamps.json` | Acquisitions with `itemReq`, cost bases and the material-cap step |
| `quests` | `quests.json` | Acquisitions with quest requirements and rewards, for the W1–W3 NPCs |
| `cards` | `cards.json`, `shared-data#cardSets` | Goal ladders for card set tiers (set size from cards per category) |
| `classes` | `classPromotions.json` | Acquisitions for subclass and elite unlocks, plus the class lookup tree |
| `portals` | `shared-data#mapPortals`, `mapNames`, `mapEnemies` | Goal ladders for portal kill requirements up to the W4 entry |
| `obols` | `monsterDrops.json` (obol rows), `shared-data#obols` | Acquisitions with drop rates per monster |
| `_patches` | `patch-notes.js` | the ordered game-version list |
| `_lookups` | `talents.json`, `items.json`, `monsters.json`, `shared-data#mapNames` | name tables |

The meaning of each raw field (for example `mapPortals` values) is confirmed in that generator's test against a known save before the generator merges.

### TR-11 Staleness

- `isStale(entry, currentGameVersion, patches)` is true when the entry's `stale` block is set (and its `flaggedAt` ≤ current), or when `index(current) − index(max source gameVersion) ≥ 10` on `patches`. Generated entries return false.
- **"Current" game version:** the save's `serverBuild`, mapped to a game version through `patches` when it's known. Otherwise the parser pin's `gameVersion`. If the save is newer than the pin, M1/M10 show the "parser not caught up" banner, and staleness is computed against the pin, so entries aren't all marked stale just because the parser lags.
- **Unknown game versions:** a Source game version missing from `patches` (a typo, or a pre-history patch) fails `kb check`.
- **The staleness pass (#17)** runs in an agent session when a sync PR lands with a new game version:
  1. Read the new patch-notes entries.
  2. List entries whose System, entities or rawNames appear in them (a deterministic `kb facts --mentions <patch>` query does this).
  3. Have the LLM judge each candidate.
  4. Open one PR that adds `stale:` blocks (with reason and PR link) and files `kb-candidate` issues for new Goals.
  Clearing a `stale:` block needs a new Source verified on the current version.

### TR-12 Ranking contract (consumed by `packages/engine`)

The engine implements #11 item 6. M11 guarantees the data it needs:
1. **Verdict blockers first:** Checks with `effect: blocker` (never contested, by FR-6).
2. **Then position** in the Stage's `goals` Priority List, after `include`s are expanded. Ties share a position. A Goal not in the list ranks after every listed one.
3. **Then the arithmetic tie-breaks:** cheapest, then closest Milestone (the smallest `(next − value) / next`), then most Goals per activity (count of `advances: yes` Contributions).
4. **Stale demotion:** within an equal position, fresh before Stale. Across positions, Stale doesn't reorder (FR-20).
5. **Contested items** are never position 1 in any section. The engine skips them for the top slot and shows them later with both sides.
6. `rankClass` orders within a character as #10 item 5 says (compounding, spendable, nice-to-have) and is used only between Goals that the Stage list leaves unranked.

There is no numeric weight anywhere. The schema has no field to hold one (FR-8).

### TR-13 Versioning, manifest and "What's new"

- **Version id:** `YYYY.MM.DD.n+hash`. The date is the UTC date of the newest commit on the build's history that touches `packages/knowledge/`. `n` is that commit's ordinal among same-day commits touching the package, and `.n` is omitted when n = 1. `hash` is the first 8 hex digits of the compiled entries' sha256. The CI deploy job checks out with enough history (`fetch-depth: 0`). A build outside git (a tarball) uses `0000.00.00+hash`.
- **Display:** `knowledge 2026.10.17` (or `knowledge 2026.10.17.2`), in the footer (M10/M12) and in every golden header.
- **Manifest:** `id → hash8` for every shipped entry. The app stores the last-seen manifest in localStorage (about 20 bytes × entries; around 30 KB at 1,500 entries).
- **`diffManifests(prev, next)`** returns `{added, changed, retired}` with titles. A generated-only change (a fact moved at a sync) counts as `changed` for the entries that extend it.
- **Advice changes and code changes are listed separately** (#11 item 13): "What's new" shows the code changelog (Conventional Commits, M12) apart from these advice changes.

### TR-14 The scrubbed-fixture tool (`pnpm kb scrub`)

**Usage:** `pnpm kb scrub fixtures/private/<name>.raw.json --id scrubbed-w2 [--now <iso>]`

**Input:** a Toolbox "Copy for support" export (#9). Its top-level keys are `accountCreateTime, charNames, companion, data, extraData, guildData, lastUpdated, serverVars, tournament`.

**Policy** (`packages/kb-tools/src/scrub/policy.ts`) is a table from path pattern to action: `keep`, `blank` (a string becomes `""`, a number becomes 0), `drop`, `rename-chars` or `review`. Every string leaf in the output must be covered by a rule.

| Path | Action | Why |
|---|---|---|
| top-level keys other than the 9 above | **fail** | a new export format must be reviewed |
| `charNames[i]` | `rename-chars` → `Char{i+1}` | names |
| every string anywhere that equals or contains an original character name, including inside JSON-encoded strings such as `data.CogO` | replaced with the mapped `Char{n}` | names hidden in nested strings (found in `CogO` on the W2 save) |
| `companion.e` | `blank` | account-level identifier |
| `guildData.id`, `guildData.members` | `blank` / `{}` | guild identity and other players |
| `data.Guild` string leaves | `blank` unless allowlisted | guild name |
| `tournament.user`, `tournament.match`, `tournament.leaderboard` | `drop` | other players and the account's own identity |
| `serverVars.Comp_RaffleWinners`, any `serverVars.*Chat*`, any `serverVars.*Twitch*` | `blank` | third-party names and broadcast strings |
| `data.PlayerStuff_*`, `data.SteamAchieve` | `review` (keep numeric leaves; strings must pass the scan below) | may carry platform data |
| `accountCreateTime`, `lastUpdated`, timers in `data` | `keep` | the parser's time math depends on them (see red-team note 5) |
| everything else | `keep`, then scanned | |

**Steps**
1. Read the export. Fail on an unknown top-level key.
2. Build the name map (`charNames[i]` → `Char{i+1}`), and load `fixtures/private/denylist.txt` if present. The denylist (gitignored) holds real names, guild names, emails and account ids, one per line.
3. Walk every leaf. JSON-encoded string values are decoded, walked and re-encoded with the same formatting. Apply the policy.
4. **Unknown-string scan.** Every remaining string leaf must be one of: numeric-looking; a game identifier in `_lookups` (item, monster, map, class, talent rawNames) or Toolbox's known enum strings; on the per-path allowlist; or shorter than 3 characters. Anything else is listed with its path, and the tool stops. The fix is to add a policy rule, never to skip the check.
5. **Denylist gate.** The output, serialized, must contain no denylist line (case-insensitive, as a substring). The same gate runs over `packages/kb-tools/golden/` and `fixtures/scrubbed/`.
6. **Parse equivalence.** Parse the original and the scrubbed export with the same `now` (the export's `lastUpdated`). The two Account States must be deep-equal after mapping `name` fields. The engine output, rendered as a golden, must also be equal after mapping names. Any difference stops the tool and prints the first differing paths. This guarantees that scrubbing never changes the advice.
7. Write `fixtures/scrubbed/<id>.json` (pretty-printed, sorted keys) and `<id>.meta.json`:

```json
{
  "id": "scrubbed-w2",
  "description": "Early account at W2-late, 5 characters",
  "now": "2026-10-17T11:48:00Z",
  "exportedOn": "2026-10-17",
  "parserCommit": "6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1",
  "gameVersion": "2.3.540",
  "scrubber": { "version": 1, "policyHash": "1c0ffee2" },
  "characters": [
    { "label": "C1", "class": "Blood_Berserker", "level": 60 },
    { "label": "C2", "class": "Wizard", "level": 56 }
  ]
}
```

**CI structural gate** (the denylist is private, so CI checks structure instead): every `fixtures/scrubbed/*.json` must have `charNames` all matching `^Char\d+$`, an empty `companion.e`, no `tournament.user` or `tournament.match`, and a `scrubber.policyHash` equal to the current policy's hash. A policy change forces a re-scrub.

**Locally,** a `pre-commit` hook in `.githooks/`, enabled by `pnpm install` through `core.hooksPath`, runs the denylist gate on staged files whenever `fixtures/private/denylist.txt` exists.

### TR-15 The golden snapshot format

**One file per fixture:** `packages/kb-tools/golden/<fixture>.md`, committed for public and scrubbed fixtures. Private fixtures write to `fixtures/private/golden/<id>.md` (gitignored). A golden is Markdown-flavoured plain text. It is deterministic, it is sorted wherever the engine output has no order, and it never contains a name, because characters are always `C1…Cn` in save order whatever the fixture.

**Fixed run parameters:** `now` from the fixture's meta (public fixtures: their `lastUpdated`), Expected Return of 8 h, empty save history.

**Sections, in order**
1. A header line.
2. `## Verdict changes`, filled only by `kb golden --diff-base <ref>` in PR CI, so reviewers see Verdict flips first. It's empty in the committed file.
3. The Now-screen block: the progress bar, Visit Order, then one block per character and the Account section, in engine order, each line with its entry id and Source tag.
4. `## Not covered yet`.
5. `## Findings`: every Detector finding, including ones not shown on the Now screen, as one sorted table. This catches Detector changes the top-3 cut would hide.

Until the engine modules (M2–M9) exist, sections 2–4 show `(engine not built)`, and the Findings table alone is the golden.

```
# golden: scrubbed-w2 · knowledge 2026.10.17.2 · parser 6c37e3d (game 2.3.540) · now 2026-10-17T11:48:00Z · return 8h · stage W2-late

## Verdict changes

## Now
progress: 3 of 5 Ready
visit order: C4, C1, C2, C3, C5

### C4 · Shaman 44 · Fix before you leave
- [blocker] Assign C4 to a cauldron  ⟨alchemy.check.empty-cauldron · T1 2.3.540⟩
- [goal 1] Big bubbles: 0 of 2 equipped → Equip Call Me Bob in big-bubble slot 1  ⟨alchemy.goal.big-bubbles-equipped · alchemy.check.empty-big-bubble-slot · T1 2.3.540⟩
- [purpose] Fighting Jar Bridge: Jar kills 41k, next 100k in ~9 h  ⟨deathnote.contribution.fight-jar · T1⟩
- [contested] First Gem Shop buy: Infinity Hammer | Crystal 3D Printer and card slots  ⟨gemshop.priority.first-buy · T3 2026-09-23 | T3 2026-10-11⟩

### C1 · Blood_Berserker 60 · Ready
- [goal 1] … ⟨…⟩
- [stale] … ⟨… · T3 2.3.520 · stale⟩

### Account
- [goal 1] Upgrade Vault: buy Bigger Damage → Monster Tax  ⟨vault.priority.spend-w2 · T1⟩

## Not covered yet
Arcade

## Findings
| entry | detector | subject | result | slots |
|---|---|---|---|---|
| afk.check.no-afk-target | afk/no-afk-target | — | silent | |
| alchemy.check.empty-big-bubble-slot | alchemy/empty-big-bubble-slot | C1 | fires | bubble=Call_Me_Bob slot=1 |
| deathnote.goal.poop-small | deathnote/kills-of-monster | account | value | value=13021 |
```

**Harness:** `pnpm kb golden` renders every fixture and compares. On a difference it prints a unified diff and fails. `-u` rewrites the files, and `--only <id>` limits the run. In PR CI, `--diff-base origin/main` also renders the base branch's goldens and fills `## Verdict changes` in the job summary (`$GITHUB_STEP_SUMMARY`), so no bot token or PR comment is needed.

**Format version:** the header gains `· golden v1`. A format change bumps it and regenerates every golden in its own PR.

### TR-16 CI

The existing `CI` job (lint, typecheck, test, build) gains:
- `pnpm kb generate --check`, then `pnpm kb check --strict`, then `pnpm kb golden` (inside `pnpm test`), then the structural privacy gate.
- A cache of the parsed fixtures, keyed by `UPSTREAM` plus the fixture hashes.
- CODEOWNERS: `packages/knowledge/ @YassSoliman` plus Joseph per D6, and `fixtures/scrubbed/ @YassSoliman`.
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
- **Privacy gates:** scrub policy plus unknown-string scan plus denylist (local), the structural gate (CI), goldens with `C1…Cn` labels by construction, and `reportContext()` with a whitelist and a test against the fixture's `charNames` (FR-29).
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
   - Set `status`. Apply ADR 0004 for facts. Apply the D2 rule for judgment, and mark the entry contested with both sides when it applies.
5. **Write or extend Detectors** with params, slots and `reads`, plus at least one `fires` and one `silent` example on real fixtures (scrubbed or public), then mutations for the edge cases. If a field is missing, extend the Account State adapter with a contract test.
6. **Run** `pnpm kb check --strict && pnpm kb golden -u && pnpm test`. Read every golden diff as a player would.
7. **Self-check** against the red-team checklist below. Fix what it finds.
8. **Open a draft PR** with the template's Knowledge Base block filled in. List any `private:` example results in the PR as aggregates only (fires on 2 of 6 characters), never with names.

**B. Red team (a second agent, fresh context, D7)**
The red-team agent gets only the PR diff, the dossier link, the fixtures and this checklist, not the author's reasoning. It must do each step, not just read:
1. **Re-derive each claim from its Source.** Open every URL. Confirm the claim, its date (`claimDate`, not page date) and its tier. Flag a Source older than the current patch that describes a mechanic the patch notes touch.
2. **Hunt for hand-copied facts.** Any number in YAML that Toolbox data holds is a defect.
3. **Try to make it fire wrongly.** Write at least 3 mutations per Detector: a missing field (expect `unknown`), a boundary value (exactly at the threshold), and a character of a class the entry doesn't apply to. Run them with `pnpm kb try <detector> <fixture> --mutate <file>`, a throwaway script that is never committed.
4. **Verdict safety.** For each blocker, ask: can this say "Fix before you leave" on an account that is actually safe? Check it against both scrubbed goldens. The evidence bar is D3.
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

**E. After merge.** The deploy carries the new Knowledge Base version. Reports and Suggestions about an entry (M13) reopen the loop at step A1, with the entry id, Knowledge Base version and game version from `reportContext()`.

## 6. States and edge cases

| State | What happens |
|---|---|
| **Compiled bundle fails to load in the worker** (corrupt chunk, failed deploy) | The engine returns a typed `KnowledgeUnavailable` error. M10 shows "Advice is unavailable right now" with the save data only. No partial advice. |
| **Loading** | The bundle is a static chunk cached by the SPA. Its first load happens alongside the parser bundle and never blocks sign-in. |
| **Offline** | The Knowledge Base ships with the app, with no network fetch, so it works offline once loaded. |
| **Broken parse / empty account** | The engine doesn't run (M1 `EmptyAccountError`), so no Detector sees a broken state. |
| **Parser section failed** (`AccountState.warnings`) | Detectors that read that section return `unknown` with `parser-section-failed`. Verdicts become Unknown, never Ready. |
| **Save newer than the parser pin** | "Parser not caught up" banner (M1/M10). Staleness is computed against the pin. Generated facts keep the pin's values and label their Source with the pin version, so the player sees which game version the numbers come from. |
| **Sync PR changes a fact an authored entry relies on** | The fact diff, the golden diff and CI (dangling reference) make it visible. Authored entries extend facts by id, so they inherit the new value without an edit. |
| **Sync PR drops a generated id** | It fails until the authored references are moved, using the `possible rename` hint. |
| **Generator meets a new data shape** | The sync PR fails, naming the generator and input. `main` keeps working on the old pin. |
| **Entry Stale** | Still shown, ranked below fresh entries at equal position, with a Stale badge. |
| **Every entry in a Stage list is Stale** (a long gap without re-verification) | Still shown, in order. The golden header gains `stale: N of M`, so a PR reviewer sees the drift. |
| **Contested blocker attempted** | Rejected by schema (FR-6). |
| **Detector throws at runtime** (a shape CI never saw) | The engine catches it per Detector, records `unknown` plus a warning with the Detector id, and the character's Verdict becomes Unknown. It never crashes and never says Ready. |
| **Detector reads a field the adapter dropped after a sync** | The contract test fails in the sync PR. At runtime the read returns `unknown`. |
| **System with no entries** | Listed under "Not covered yet" if it's unlocked. Hidden if locked. |
| **Retired entry still referenced in a player's "Not for me" list** (M10 storage) | `replacedBy` maps the old id. With no replacement, the stored preference is dropped. |
| **Two entries render the same Next Action** (overlapping Checks) | `kb check` warns when two Checks share a Detector with equal params. The engine de-duplicates by (subject, rendered text). |
| **Second account in the same browser** | Not supported in the MVP (#10 item 16). The Knowledge Base is account-agnostic, so nothing in M11 depends on it. |
| **Multiple tabs** | The Knowledge Base is immutable per deploy. Two tabs on different deploys can show different versions, and the footer shows which. |
| **Manifest missing** (first visit, cleared storage) | "What's new: advice changes" is skipped, not shown as "everything changed". |
| **Scrub on a save with a new string field** | Stops with the field path (US-11). |
| **Scrubbed fixture falls behind the parser** | Each sync re-parses the scrubbed fixtures. Goldens change in the sync PR and are reviewed like any fact change. |
| **Private fixture absent** (CI, contributors) | `private:` examples and goldens are skipped and reported. Public and scrubbed coverage still gates the merge. |
| **Clock-dependent output** (timers, "fills in 3 h") | Always relative to the fixture `now`. Goldens are stable across days. |

## 7. Dependencies

| Module | What M11 needs from it | What it needs from M11 |
|---|---|---|
| **M1 Sync & Account State** | `AccountState`, `HistoryEntry`, `parseSave(envelope, { now })`, `account.gameVersion.{serverBuild, parserTarget}`, the contract-test harness, and new fields as Detectors need them | `generated/_patches.json` (to map `serverBuild` to a game version) and the scrubbed fixtures for its contract tests |
| **M2 Stage & Meta Path** | `STAGES` (in `packages/knowledge/src/stages.ts`) and the Stage Detector built from Meta Path `milestones` | the `metapath` and `priority` entry types, `milestone` Detectors, and `priorityByStage` |
| **M3 AFK Safety** | Verdict-blocker Checks and their content | `check` entries with `effect: blocker`, `usesExpectedReturn`, `CheckFinding.at` |
| **M4 Purpose & Milestones** | Goal and Contribution content | `goal`, `contribution`, generated Goal ladders, `etaMs` from kills/h |
| **M5 Higher-leverage options** | leverage lists | `priority` with `list: leverage`, the `contribution` count tie-break |
| **M6 Unspent & idle** | free-value and never-skip Checks | `check` with `effect: next-action`, `block` Priority Lists |
| **M7 Spend Plan** | spend lists | `priority` with `list: spend`, and generated costs and gates (vault, stamps) |
| **M8 Collections** | card, obol and stamp content | `acquisition` (authored and generated), and card set ladders |
| **M9 Builds** | Build content | `build` entries and the `builds/talent-drift` Detector kind |
| **M10 Now screen UI** | none | rendered text, Source labels (tier, game version, URL), Stale and Contested flags with sides, `coverage()`, `version.display` |
| **M12 Release** | the deploy job with `fetch-depth: 0`, the weekly sync Action running `kb generate` | `version`, `manifest`, `diffManifests()`, the budget check |
| **M13 Suggestions** | the delivery of Report this and Suggestions | `reportContext()`; Suggestions that become Knowledge Base changes enter TR-19 step A1 |
| **`packages/engine`** (shared by M2–M9) | the ranking (TR-12), the per-Detector error isolation, the rendering of golden sections 2–4 | the compiled bundle, `DetectorRegistry`, `render()` |

**Build order:** M11 follows M1 (#13). The tooling, schema, generators, scrub and Findings-only goldens can all ship before M2–M9. Each later module adds content and upgrades golden sections 2–4.

## 8. Open decisions for Yasser

❓ D1 - Publish a scrubbed copy of Joseph's save: #14 settled a scrubbed W2 fixture from Yasser's save. Should Joseph's W3 save (6 characters, two Squires) also be scrubbed and committed to the public repo, or (b) stay private, with W3 coverage in CI coming only from mutated W2 or public saves?
➡️ (a), with Joseph's explicit consent recorded in the PR that adds it. The #13 done bar ("no wrong Verdict blocker on either golden snapshot") needs a golden for both accounts, and the W3-early and two-Squire cases have no other real fixture (the public saves are all W4–W7). The scrub removes names and identifiers. What stays (class, level, progress) is already summarised in public issues.

❓ D2 - When is judgment Contested? ADR 0004 says "within a tier, the newer wins", but #26 and #27 mark several tier-3 disagreements as contested (first Gem Shop buy, pusher, cogs, prayers). Options: (a) apply ADR 0004 strictly everywhere, so newer always wins and opinions are only contested across tiers; (b) facts follow ADR 0004 strictly, while judgment entries (Priority Lists, Builds, Meta Path) are Contested whenever two or more Sources dated after the current major patch disagree, whatever their order; (c) leave it to each author.
➡️ (b). Recency settles facts, because a newer patch changes the game, but it doesn't settle opinion: a newer Reddit comment isn't more right than AutoReview. (b) also matches what #26 and #27 already did. It needs a one-line amendment to ADR 0004.

❓ D3 - The evidence bar for a Verdict blocker: beyond `confidence: H` and never contested, should a blocker also need (a) nothing more; (b) at least one tier 1 or 2 Source (game data, code, or a post-patch wiki edit); or (c) (b) plus a `private:` fires example on one of the real accounts, confirmed by the player in review?
➡️ (b). Blockers are AFK-safety mechanics (food, caps, an empty AFK Target, the wrong preset). Game data or code can establish all of them, and a wrong blocker is the one failure the done bar names. (c) would block contributors who don't have our saves.

❓ D4 - Fixture refresh: as our accounts progress, should the scrubbed fixtures (a) be replaced by fresh exports, so the W2 coverage disappears when Yasser reaches W3; or (b) be kept frozen, with new dated fixtures added at each new world or Stage (`scrubbed-w2-2026-10`, `scrubbed-w3-2026-12`, …), capped at about 6, dropping the oldest?
➡️ (b). Early-game goldens are our only early-game regression tests, and the public saves start at W4. Frozen fixtures still re-parse at every sync, so they keep testing the current parser.

❓ D5 - Dormant generated facts: should generated entries that no authored entry references (for example the Death Note ladder of every one of 104 monsters) (a) appear on the Now screen on their own as Goals, or (b) stay dormant data, used only through authored entries, and not count as coverage?
➡️ (b). Showing hundreds of generated ladders would bury the Priority List order (judgment) under raw facts. ADR 0007 already frames generated entries as what authored ones reference. "Not covered yet" then stays honest.

❓ D6 - Joseph's merge rights: #11 says only Yasser and Joseph merge Knowledge Base PRs, but Joseph isn't a collaborator yet (#7), and CODEOWNERS lists only Yasser. Add Joseph as a collaborator and co-owner of `packages/knowledge/` (approval from either suffices), or keep Yasser as the sole approver for now?
➡️ Add Joseph as a co-owner of `packages/knowledge/` and `fixtures/scrubbed/` only, with approval from either one sufficing. Player review is the gate that matters there, and Joseph's account is the off-meta test case. Code paths stay Yasser-only.

❓ D7 - The red-team agent: (a) the same model as the author in a fresh session with the adversarial brief; (b) a different, stronger model for every Knowledge Base PR; or (c) (a) by default, and (b) only for PRs that add or change a Verdict blocker or a Stage Priority List?
➡️ (c). Fresh context with a forced re-derivation checklist catches most errors cheaply. The expensive independent pass is reserved for the two places where a wrong entry hurts most (the done bar's blockers, and the order that drives every Next Action).

## 9. Red-team notes

1. **Hand-copied facts creep back in.** An author types "100k" or a stamp cost into YAML, and it rots at the next patch, which is exactly what ADR 0007 exists to stop. *Defence:* the generated `extends` path; schema bans on `chance` and `milestones` when extending; the hand-copied-fact check against referenced facts (FR-17), with `--strict` for 3+ digit literals; and red-team step B2.
2. **A generator reads the label instead of the value.** Toolbox data mixes display text and numbers, and some text is wrong (bribe Insider Trading reads "5%" with `value: 8`). A generator that parses descriptions ships wrong facts with tier-1 authority. *Defence:* the "numbers from value fields only" rule; a hand-checked value assertion per generator; and the fact diff in every sync PR.
3. **Detectors overfit to 13 fixtures.** Two early-game real saves and eleven late-game public ones can't show every account shape, so a Detector can fire wrongly on Joseph's next save or a public user's. *Defence:* `unknown` for missing data; the all-optional-fields-removed test; red-team mutations (boundary, missing field, wrong class); blockers needing H and a tier ≤ 2 Source (D3); per-Detector runtime isolation (a throw means Unknown, never Ready); and Report this closing the loop with the entry id.
4. **A scrubbed fixture leaks a name.** Names hide in nested JSON strings (`CogO`), and third-party names sit in server variables (raffle winners). A denylist-only scrub would miss a new field. *Defence:* the allowlist policy with mandatory coverage of every string leaf, the unknown-string scan, the local denylist gate plus pre-commit hook, the CI structural gate, the policy hash forcing a re-scrub, and goldens that use `C1…Cn` by construction.
5. **Kept timestamps fingerprint the account.** `accountCreateTime` and timers are kept because the parser's time math needs them. With names removed, re-identification would need outside data. *Defence:* that is accepted and documented here, and D1 asks for explicit consent. If it's ever judged too much, the fix is a uniform shift of every epoch field with a matching shift of `now`, verified by the same parse-equivalence check. It isn't in the MVP because a missed timer field would silently change advice.
6. **Golden fatigue.** A sync PR changes 13 goldens, and reviewers rubber-stamp them, so a wrong blocker slips through. *Defence:* `## Verdict changes` comes first in the job summary; the Findings table is sorted and stable, so diffs are small; generator PRs are separate from authored PRs; the PR template asks for a one-line summary per fixture; and Verdict-blocker PRs get the stronger red team (D7).
7. **Staleness turns everything grey.** At 1–2 week patches, "10 patches" is 10–20 weeks, so most community entries could go Stale within a season, and the badge stops meaning anything. *Defence:* Stale only demotes within a position and never hides an entry; the targeted staleness pass flags the entries a patch actually touched; re-verification is cheap (a new Source line); and the golden header counts Stale entries, so drift shows up in review. If the badge still proves too noisy, the threshold is one constant to tune.
8. **The red team shares the author's blind spots.** Same model, same Sources, same mistakes. *Defence:* fresh context without the author's reasoning; a checklist that forces actions (open each URL, write mutations, compare with #26's worked examples) rather than opinions; a stronger model for blockers and Stage lists (D7); and the final gate is a human player on their own fresh save.
9. **ids churn and break reports and preferences.** An upstream rename or a slug change breaks "Not for me" and old reports. *Defence:* ids come from rawNames, not positions; the `possible rename` hint; retired entries keep their ids and carry `replacedBy`; and Knowledge Base version plus game version travel with every report.
10. **Templates render wrong numbers.** Milliseconds shown as hours, or "13021" where "13k" was meant, or the reverse. Wrong-looking advice is as damaging as wrong advice. *Defence:* typed slot schemas per Detector, compile-time format checks, and goldens that show the rendered text, so every format change is visible in review.
