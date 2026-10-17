// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The fact generator contract (M11 TR-10, ADR 0007). Generators run in Node only (packages/kb-tools),
// never in the app. One generator per file: generators/<name>.gen.ts, default-exporting a Generator.
// They are discovered by file name, like Detectors, so adding one never edits a shared index.
import type { FactTableT, GeneratedEntryT, SourceT } from '../src/schema';

/**
 * Toolbox's extracted game data (`vendor/data/website-data`, through its index.js exports): the 29
 * per-key files plus every key of shared-data.json, by export name. Typed loosely here; each generator
 * narrows the keys it declares.
 */
export type ToolboxGameData = Readonly<Record<string, unknown>>;

export interface Pin {
  commit: string;
  commitDate: string;
  gameVersion: string;
  toolboxVersion: string;
}

export interface GeneratorInput {
  data: ToolboxGameData;
  /** Only the named exports the generator declares in `constants`. */
  constants: Readonly<Record<string, unknown>>;
  pin: Pin;
  /** Ordered game versions (oldest first), from Toolbox's patch notes; empty when not fetched. */
  patchNotes: readonly { gameVer: string; date: string | null }[];
}

export interface GeneratorOutput {
  entries?: GeneratedEntryT[];
  facts?: FactTableT[];
}

export interface Generator {
  /** Generator name, e.g. "death-note". Matches the file name `<name>.gen.ts`. */
  name: string;
  /** The System its output belongs to (the `system` of every entry and fact table). */
  system: string;
  /** Declared inputs, used for provenance (generatedBy.inputs and the Source URL) and for the fact diff:
   *  "website-data/shared-data.json#deathNote", "parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS". */
  inputs: readonly string[];
  /** Exported parser constants it needs: `{ DEATH_NOTE_RANKS: 'parsers/world-3/deathNote.ts' }`. */
  constants?: Readonly<Record<string, string>>;
  /** Output file stem, default `system`: generated/<file>.json and generated/<file>.facts.json. */
  file?: string;
  /** Validation-only output (lookups, patches): written as-is to generated/<file>.json, never shipped. */
  raw?: boolean;
  run(input: GeneratorInput): GeneratorOutput | Record<string, unknown>;
}

export const defineGenerator = (g: Generator): Generator => g;

const TOOLBOX = 'https://github.com/Morta1/IdleonToolbox/blob';

/** A Toolbox permalink at the pin, e.g. for "parsers/world-3/deathNote.ts" or "website-data/cards.json". */
export function toolboxUrl(pin: Pin, input: string): string {
  const [file] = input.split('#');
  const path = (file ?? input).replace(/^website-data\//, 'data/website-data/');
  return `${TOOLBOX}/${pin.commit}/${path}`;
}

/** The tier 1 Source of a generated entry or fact table (FR-16): the Toolbox file at the pin. */
export function generatedSource(pin: Pin, input: string, title: string): SourceT {
  return {
    url: toolboxUrl(pin, input),
    title,
    tier: 1,
    verified: pin.commitDate,
    gameVersion: pin.gameVersion,
  };
}

export function generatedBy(g: Pick<Generator, 'name' | 'inputs'>, pin: Pin) {
  return { generator: g.name, inputs: [...g.inputs], commit: pin.commit };
}

/** `poopSmall` -> `poop-small`, `Bored_Bean` -> `bored-bean`, `Boss2A` -> `boss2a`. Ids come from rawNames, never positions. */
export function slugify(raw: string): string {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .replace(/-+/g, '-');
}

/** Throws on a duplicate id: slug collisions fail generation (TR-10). */
export function assertUniqueIds(ids: readonly string[], generator: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`${generator}: slug collision on ${id}`);
    seen.add(id);
  }
}

/** Placeholder map names that are not real maps (filtered before slugging, TR-10). */
export const PLACEHOLDER_MAP_NAMES: ReadonlySet<string> = new Set(['Z', 'PlayerSelect', 'Filler', '']);
