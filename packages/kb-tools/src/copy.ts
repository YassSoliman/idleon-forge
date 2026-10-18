// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` copy rules (Design Lab copy pass): a step a player reads is short, and every duration goes
// through the one shared formatter (`{x:duration}`, `{x:hours}`), never hand-written.
//
// - step-words: a step template (an entry's `text`, its `values` step variants, a Spend Plan line) is at
//   most STEP_WORD_CAP words. The rest of the sentence belongs in the entry's `why`.
// - hand-written-duration: "about {x:duration}" (the format already says "about"), "{n} h", "about 2 min".
// Justified exceptions live in `packages/knowledge/copy-allowlist.yaml`, one reason each; an allowlist
// line that no longer matches a problem is itself an error, so the list can only shrink.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Entry } from '@idleon-forge/knowledge';
import { parse } from 'yaml';
import type { Issue } from './issues';
import type { KbSource, Located } from './load';
import { KNOWLEDGE, REPO } from './paths';

export const STEP_WORD_CAP = 12;
export const COPY_ALLOWLIST = path.join(KNOWLEDGE, 'copy-allowlist.yaml');

/** `values` keys that are not step copy: the why behind the tap, reasons, notes, per-character detail. */
const NOT_STEP_KEY = /(^|-)(why|reason|note|detail)(-|$)|^timeline|^stop/i;

/** Words a player reads: a `{slot}` counts as one, punctuation-only tokens ("→", "·") count as none. */
export function stepWords(template: string): number {
  return template
    .replace(/\{[^}]+\}/g, 'X')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

const DURATION_RULES: { re: RegExp; message: string }[] = [
  {
    re: /\babout \{[A-Za-z0-9]+:duration\}/,
    message: '"about {x:duration}": the duration format already says "about"; drop the word',
  },
  {
    re: /\{[A-Za-z0-9]+(?::int)?\}\s?(?:h|hrs?|hours?|d|days?|m|mins?|minutes?)\b/,
    message: 'a number slot with a hand-written unit; pass it as {x:duration} (ms) or {x:hours} (hours)',
  },
  {
    re: /\babout \d+(?:\.\d+)?\s?(?:h|hrs?|hours?|d|days?|m|mins?|minutes?)\b/,
    message: 'a hand-written "about N h"; put the time in a values slot and use {x:duration}',
  },
  {
    re: /\b\d+(?:\.\d+)?\s?(?:h|min|mins)\b/,
    message: 'a hand-written duration; put the time in a values slot and use {x:duration}',
  },
];

export interface CopyTemplate {
  /** "<entry id>#<path>", the allowlist key. */
  key: string;
  where: (string | number)[];
  template: string;
  step: boolean;
}

/** Every player-facing template of an entry, with whether it is step copy (capped) or not. */
export function templatesOf(e: Entry): CopyTemplate[] {
  const out: CopyTemplate[] = [];
  const add = (where: (string | number)[], template: unknown, step: boolean) => {
    if (typeof template === 'string' && template.trim())
      out.push({ key: `${e.id}#${where.join('.')}`, where, template, step });
  };
  const v = e as unknown as Record<string, unknown>;
  add(['text'], v.text, e.type !== 'priority');
  add(['why'], v.why, false);
  add(['stopHere'], v.stopHere, false);
  const values = (v.values ?? {}) as Record<string, unknown>;
  for (const [k, t] of Object.entries(values))
    if (typeof t === 'string' && t.includes(' ')) add(['values', k], t, !NOT_STEP_KEY.test(k));
  if (e.type === 'priority')
    for (const [i, tier] of ((v.tiers ?? []) as unknown[][]).entries())
      for (const [j, item] of (tier ?? []).entries()) {
        const it = item as Record<string, unknown> | string;
        if (typeof it !== 'object' || it === null) continue;
        add(['tiers', i, j, 'text'], it.text, true);
        add(['tiers', i, j, 'why'], it.why, false);
      }
  return out;
}

export interface CopyAllowlist {
  'step-words': Record<string, string>;
  'hand-written-duration': Record<string, string>;
}

export function readCopyAllowlist(file = COPY_ALLOWLIST): CopyAllowlist {
  let doc: Partial<CopyAllowlist> | null = null;
  try {
    doc = parse(readFileSync(file, 'utf8')) as Partial<CopyAllowlist> | null;
  } catch {
    doc = null;
  }
  return {
    'step-words': doc?.['step-words'] ?? {},
    'hand-written-duration': doc?.['hand-written-duration'] ?? {},
  };
}

/** The copy rules over the authored entries (generated entries' words come from their generators). */
export function copyIssues(
  entries: readonly Located<Entry>[],
  allow: CopyAllowlist,
  allowFile = path.relative(REPO, COPY_ALLOWLIST),
): Issue[] {
  const issues: Issue[] = [];
  const used = { 'step-words': new Set<string>(), 'hand-written-duration': new Set<string>() };
  const present = new Set<string>();
  for (const e of entries) {
    for (const t of templatesOf(e.value)) {
      present.add(t.key);
      const line = e.lineOf(t.where);
      if (t.step) {
        const n = stepWords(t.template);
        if (n > STEP_WORD_CAP) {
          if (t.key in allow['step-words']) used['step-words'].add(t.key);
          else
            issues.push({
              level: 'error',
              file: e.file,
              line,
              id: e.value.id,
              message: `${t.where.join('.')} is ${n} words; a step is at most ${STEP_WORD_CAP} with one verb, the rest goes in why (or allowlist it in ${allowFile})`,
              code: 'step-words',
            });
        }
      }
      const rule = DURATION_RULES.find((r) => r.re.test(t.template));
      if (rule) {
        if (t.key in allow['hand-written-duration']) used['hand-written-duration'].add(t.key);
        else
          issues.push({
            level: 'error',
            file: e.file,
            line,
            id: e.value.id,
            message: `${t.where.join('.')}: ${rule.message}`,
            code: 'hand-written-duration',
          });
      }
    }
  }
  // An allowlist line for a template that is now fine (or gone from a present entry) is stale.
  const ids = new Set(entries.map((e) => e.value.id));
  for (const rule of ['step-words', 'hand-written-duration'] as const)
    for (const key of Object.keys(allow[rule])) {
      if (used[rule].has(key) || !ids.has(key.split('#')[0] as string)) continue;
      issues.push({
        level: 'error',
        file: allowFile,
        line: 1,
        id: key,
        message: `${rule} allowlist entry no longer matches a problem${present.has(key) ? '' : ' (no such template)'}; remove it`,
        code: 'copy-allowlist-stale',
      });
    }
  return issues;
}

/** For `checkSource`: the copy issues of a loaded source, with the repo's allowlist. */
export const copyIssuesOf = (src: KbSource, allow = readCopyAllowlist()): Issue[] =>
  copyIssues(src.authored as Located<Entry>[], allow);
