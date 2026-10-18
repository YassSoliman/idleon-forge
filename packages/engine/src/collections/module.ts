// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections (docs/specs/M8-collections.md) as an engine module (M10 `EngineModule`): runs every
// M8 entry's engine Detector and turns each finding into a Goal with one Next Action, an Active Play
// suggestion (custom stamp quests, D2) or a show-more line (`nice`, unlisted: toward stamps, the stamp
// count, the obol Goal). A finding that would repeat across characters (same entry, same group) is one
// account line naming each character by class and level (#70 A5). It never sets a Verdict. Pure.
import type { AccountState } from '@idleon-forge/account-state';
import {
  type DetectorRegistry,
  type Entry,
  type FactTable,
  findDetector,
  makeContext,
  render,
  runDetector,
  type SourceT,
} from '@idleon-forge/knowledge';
import type {
  CharacterContribution,
  EngineInput,
  EngineModule,
  ModuleGoal,
  ModuleOutput,
} from '../core/module';
import type { ActivePlay, Category, Done, Goal, SourceRef, Subject } from '../result';
import { buildCardsView } from './cards-view';
import type { M8Finding } from './detectors';
import { and } from './routes';

/** The Systems whose entries this module runs (M8 TR-1). */
export const COLLECTIONS_SYSTEMS: readonly string[] = ['stamps', 'cards', 'obols'];

export interface CollectionsKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
  readsOf?: Readonly<Record<string, string[]>>;
  stale?: readonly string[];
}

export interface CollectionsModuleDeps {
  kb: CollectionsKnowledge;
  /** The engine Detector registry (packages/engine/detectors). */
  registry: DetectorRegistry;
}

type Runnable = Extract<Entry, { type: 'check' | 'goal' }>;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  gameVersion: s.gameVersion,
});
const subjectKey = (s: M8Finding['subject']): Subject => (s.kind === 'account' ? 'account' : `c${s.index}`);

const refOf = (e: Runnable) => (e.type === 'check' ? e.detector : e.progress);
const isM8 = (e: Entry): e is Runnable =>
  (e.type === 'check' || e.type === 'goal') &&
  COLLECTIONS_SYSTEMS.includes(e.system) &&
  !('origin' in e && e.origin === 'generated');

interface Built {
  account: ModuleGoal[];
  byCharacter: Map<number, ModuleGoal[]>;
  activePlay: ActivePlay[];
}

function build(state: AccountState, now: number, deps: CollectionsModuleDeps, entries: Runnable[]): Built {
  const { kb, registry } = deps;
  const ctx = makeContext(state, kb, { now });
  const out: Built = { account: [], byCharacter: new Map(), activePlay: [] };
  const add = (subject: Subject, g: ModuleGoal) => {
    if (subject === 'account') out.account.push(g);
    else {
      const i = Number(subject.slice(1));
      out.byCharacter.set(i, [...(out.byCharacter.get(i) ?? []), g]);
    }
  };
  for (const entry of entries) {
    const ref = refOf(entry);
    const d = findDetector(ref.id, registry);
    if (d?.kind !== 'engine') continue;
    const run = runDetector(d, ctx, ref.params);
    if (!run.ok) continue; // FR-26: a broken Detector drops its lines; never a Verdict.
    const all = run.findings as readonly M8Finding[];
    const findings = all.filter((f) => f.result === 'fires');
    const sources = entry.sources.map(sourceRef);
    const goalOf = (f: M8Finding, subject: Subject, text: string, why: string): ModuleGoal => {
      const goal: Goal = {
        id: entry.id,
        title: entry.title,
        system: entry.system,
        category: (entry.category ?? 'nice') as Category,
        nextAction: {
          key: `${entry.id}@${subject}`,
          entryId: entry.id,
          text,
          why,
          sources,
          stale: kb.stale?.includes(entry.id) ?? false,
          contested:
            entry.status === 'contested' && entry.contested
              ? {
                  sides: entry.contested.sides.map((s) => ({
                    text: s.position,
                    sources: s.sources.map(sourceRef),
                  })),
                }
              : null,
          confidence: entry.confidence,
          provenance: { entryIds: [entry.id], fields: [...(kb.readsOf?.[d.id] ?? d.reads)] },
        },
        milestone: f.milestone ? { ...f.milestone, stopHere: false } : null,
      };
      const effort = entry.type === 'check' ? entry.effortSeconds : undefined;
      return { goal, rank: effort ? { cost: { unit: 'hours', amount: effort / 3600 } } : {} };
    };

    // Active Play (D2): one "If you have time" line per quest, never a Goal or a Verdict.
    if (entry.type === 'check' && entry.activePlay) {
      for (const f of findings)
        out.activePlay.push({
          key: `${entry.id}@account`,
          text: render(entry.text, f.slots, entry.values),
          estimateSeconds: entry.activePlay.minutes * 60,
          subject: 'account',
          sources,
        });
      continue;
    }

    // FR-26, US-9: a Goal whose Detector can't tell says so, and nothing it would have said is shown.
    const unknownText = typeof entry.values.unknownText === 'string' ? entry.values.unknownText : null;
    const unknownFinding = all.find((f) => f.result === 'unknown' && f.subject.kind === 'account');
    if (entry.type === 'goal' && unknownText && unknownFinding) {
      add('account', goalOf(unknownFinding, 'account', unknownText, render(entry.why, entry.values)));
      continue;
    }

    // #70 A5: the same finding on two or more characters is one account line.
    const groups = new Map<string, M8Finding[]>();
    for (const f of findings)
      if (f.subject.kind === 'character' && f.group !== undefined)
        groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
    const merged = new Set<M8Finding>();
    const groupText = typeof entry.values.groupText === 'string' ? entry.values.groupText : null;
    for (const fs of groups.values()) {
      if (fs.length < 2 || !groupText) continue;
      const [first] = fs;
      if (!first) continue;
      for (const f of fs) merged.add(f);
      const scope = { ...first.slots, characters: fs.length, who: and(fs.map((f) => f.who ?? '')) };
      const g = goalOf(
        first,
        'account',
        render(groupText, scope, entry.values),
        render(entry.why, scope, entry.values),
      );
      // M10 `Goal.details`: one line per character, in save order, from the entry's own detail template.
      const detailText = typeof entry.values.detailText === 'string' ? entry.values.detailText : '{who}';
      g.goal.details = fs.map((f) => ({
        subject: subjectKey(f.subject),
        text: render(detailText, { ...f.slots, who: f.who ?? '' }, entry.values),
      }));
      add('account', g);
    }
    for (const f of findings) {
      if (merged.has(f)) continue;
      const subject = subjectKey(f.subject);
      add(
        subject,
        goalOf(
          f,
          subject,
          render(entry.text, f.slots, entry.values),
          render(entry.why, f.slots, entry.values),
        ),
      );
    }
  }
  return out;
}

/**
 * The M8 engine module over the compiled Knowledge Base and the engine Detector registry, built like
 * M6's `createUnspentModule`. The parse worker and the golden harness register it.
 */
export function createCollectionsModule(deps: CollectionsModuleDeps): EngineModule {
  const entries = Object.values(deps.kb.entries)
    .filter(isM8)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    id: 'collections',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const { state, now } = input;
      const built = build(state, now, deps, entries);

      // FR-25: what this module asked for at the start of the Play Session and the save no longer needs.
      const done: Done[] = [];
      const start = input.history.sessionStartedAt;
      const first = start === null ? null : input.history.entries.find((h) => h.lastCloudSave >= start);
      if (first && first.state !== state) {
        const was = build(first.state, now, deps, entries);
        const keys = (b: Built) =>
          new Map(
            [...b.account, ...[...b.byCharacter.values()].flat()].map((g) => [g.goal.nextAction.key, g.goal]),
          );
        const before = keys(was);
        const after = keys(built);
        for (const [key, g] of before)
          if (!after.has(key) && g.category !== 'nice')
            done.push({ key, text: g.nextAction.text, confirmedAt: state.account.lastCloudSave ?? now });
      }

      const characters: CharacterContribution[] = state.characters.map((c) => ({
        index: c.index,
        goals: built.byCharacter.get(c.index) ?? [],
        doneThisSession: done.filter((d) => d.key.endsWith(`@c${c.index}`)),
      }));
      // The Cards view (owner request 2026-10-18): a broken card table drops the view, never the Goals.
      const cards = (() => {
        try {
          return buildCardsView(state, { get: (id) => deps.kb.entries[id] ?? deps.kb.facts[id] });
        } catch {
          return null;
        }
      })();
      return {
        characters,
        ...(cards ? { cards } : {}),
        account: {
          goals: built.account,
          activePlay: built.activePlay,
          doneThisSession: done.filter((d) => d.key.endsWith('@account')),
        },
      };
    },
  };
}
