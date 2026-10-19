# @idleon-forge/knowledge

The Knowledge Base: the entry schema, the Detector contract, generated facts and the compiled runtime
bundle ([M11 spec](../../docs/specs/M11-knowledge-tooling.md)). Its dev tooling, the `kb` CLI, is
[`packages/kb-tools`](../kb-tools), which is never shipped.

## Runtime surface (`@idleon-forge/knowledge`)

Pure, with no Node or bundler needs, so it runs in the parser Web Worker (ADR 0006).

| Export | What |
|---|---|
| `loadKnowledge(json)` | Loads `dist/knowledge.json` (`CompiledKnowledge`). Throws `KnowledgeUnavailableError` on a broken bundle. |
| `render(template, ...scopes)` | `{slot}` / `{slot:int\|compact\|pct\|coins\|duration\|name\|date}` to plain text. Throws `TemplateError` on a missing slot. |
| `isStale(entry, gameVersion, patches)` | FR-19. `gameVersion` is the parser pin's, never the save's. |
| `coverage(state, kb, registries)` | "Not covered yet": unlocked Systems with no authored entry. |
| `diffManifests(prev, kb)` | "What's new: advice changes": `{added, changed, retired}` with titles, or `null` with no stored manifest. |
| `entryReportFields(output, kb)` | Exactly `{entryIds, detectorIds, fieldPaths, stale, contested}` for M13's `ReportContext`. |
| `makeContext`, `runDetector`, `findDetector` | Run a Detector with per-Detector error isolation (FR-13). |
| Schema (`AuthoredEntry`, `GeneratedEntry`, `FactTable`, `Source`, `SystemDef`, …) | zod 4 schemas and their types. |
| `Detector`, `DetectorContext`, `CheckFinding`, `ProgressFinding`, `ContributionFinding`, `MilestoneFinding`, `AcquisitionFinding`, `UnknownReason`, `defineDetector` | The Detector contract (TR-4). |
| `STAGES`, `StageId`, `STAGE_DEFINITIONS` | `src/stages.ts`, the one file M2 owns here. M11 ships the ids; M2 fills the rules. |

`ctx.facts.get(id)` returns a compiled entry or fact table (`<system>.fact.<slug>`). A fact table ships
when a shipped entry references it, or when a Detector's source names its id as a string literal.

## Adding a Detector

Create `detectors/<system>/<name>.ts` whose default export is `defineDetector({ id: '<system>/<name>', … })`.
That is all: the registry (`@idleon-forge/knowledge/detectors`) is discovered with `import.meta.glob`,
and `kb` discovers the same files on disk and checks both agree. Never edit `detectors/index.ts`.

- Import only `zod`, Account State types, `../../src/types` and `../../src/helpers` (Biome enforces it).
  `helpers` re-exports `isKnown` and mutation helpers (`withCharacter`, `withAccount`, `withUnknown`).
- No `Date`, `performance`, `globalThis`, storage or network (Biome bans them); use `ctx.now`.
- Declare every Account State path you read in `reads` (a recording proxy checks it), return `unknown`
  when a field is unknown (a state with every optional field removed must never fire), and give at
  least one `fires` and one `silent` example, one of them on a real fixture with no `mutate`.
  `FixtureExample.params` sets the params an example runs with.
- Every registered Detector must be referenced by an entry or a System's `unlocked`.

**Engine Detectors** (`kind: 'engine'`, M2/M5/M7) follow the same convention in
`packages/engine/detectors/<system>/<name>.ts`; `kb check` resolves entry references against both
registries. Build the engine registry with `buildRegistry(import.meta.glob(…), 'engine')`.

## Generated facts

Generators are `generators/<name>.gen.ts` (default export `defineGenerator`), run only by `pnpm kb generate`
in Node. Output is committed in `generated/` and never edited by hand; `pnpm kb generate --check` runs in
CI. Each generator has a test in `packages/kb-tools/test/generators/` on a synthetic slice (hand-checked
values), on the live pinned data (invariants) and against a known save (the raw-field reading).
Generated entries whose Detector isn't registered yet show as `pending-detector` warnings until the
owner module adds the Detector.

## Drafts

An authored entry may set `status: draft` (M26 FR-1). `kb check` validates it against the schema and
reserves its id, `kb compile` never ships it, and no live entry may reference it. Its Detector,
references and template slots are checked only once it is promoted to `active` or `contested`, in the
PR that ships its Detector, after its wave's red team.

## Goldens

`golden/<fixture>.md`, rendered by `pnpm kb golden` (`-u` rewrites, `--only <id>`, `--diff-base <ref>`
writes `## Verdict changes` to the job summary). **Until M10 ships `renderNowText`, the `## Now` section
is a placeholder:** the harness uses a stub engine that prints `(engine not built)`, and the header's
stage reads `(engine not built)`. M10 replaces the stub by adding `packages/engine/src/golden.ts` that
exports `goldenEngine: GoldenEngine` (`stage(input)`, `renderNow(input)`, see
`packages/kb-tools/src/golden.ts`); the harness picks it up with no other change, and every golden is
regenerated in that PR. `## Not covered yet` and `## Findings` are real today.

## Fixtures

- Public: Toolbox's saves in `packages/account-state/fixtures/public/`, pinned by sha256 in
  `packages/kb-tools/fixtures/public-manifest.json` (`pnpm kb fixtures`, `--pin` after a reviewed sync).
- Scrubbed: `fixtures/scrubbed/<id>.json` plus `.meta.json`, made by
  `pnpm kb scrub fixtures/private/<x>.raw.json --id scrubbed-<id> --owner <who> --consent <url>`.
- Private: `private:<stem>` for `fixtures/private/<stem>.raw.json`, local only.
