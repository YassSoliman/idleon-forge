// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 `planWalkthroughs` (TR-6): parents in rank order -> Requirement Trees on one holdings pool (FR-13)
// -> Supplies and effort per missing leaf -> the Bottleneck -> jobs and assignees -> ordered steps
// (FR-22) -> the printer Parallel Slot Plan. Pure: the same inputs give byte-identical output (FR-32).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import type { SlotValue } from '@idleon-forge/knowledge';
import { classLabel } from '../core/labels';
import type { MetaPathResult } from '../metapath/types';
import type {
  EngineResult,
  SourceRef,
  Subject,
  WalkthroughRoot,
  WalkthroughStepView,
  WalkthroughTreeLine,
  WalkthroughView,
} from '../result';
import { type ExpandContext, expandTarget, itemNodes, missingLeaves, questStanding } from './expand';
import { HoldingsPool, holdingsKnown } from './holdings';
import {
  chanceText,
  ENTRY,
  hoursText,
  human,
  itemId,
  itemOf,
  mapGraph,
  presetFit,
  type QuestData,
  say,
  sourcesOf,
  type WalkthroughKnowledge,
} from './knowledge';
import {
  assignJobs,
  bottleneckOf,
  type JobInput,
  type LeafEffort,
  leafEffort,
  type PlanContext,
  type PlanValues,
} from './plan';
import { presetActions } from './presets';
import { planPrinter } from './printer';
import { type SupplyContext, suppliesOf } from './supply';
import type { Job, ReqNode, SupplyEval, WalkthroughBuilt, WalkthroughResult } from './types';

type ItemNode = Extract<ReqNode, { kind: 'item' }>;

/** A Goal that opts in to a Walkthrough (FR-1), as the engine ranked it. */
export interface WalkthroughParent {
  key: string;
  entryId: string;
  subject: Subject;
  title: string;
  targetId: string;
  /** M18 X3: the inline root the Goal carries, when its target is not an Acquisition. */
  root?: WalkthroughRoot;
}

export interface PlanInput {
  state: AccountState;
  kb: WalkthroughKnowledge;
  meta: MetaPathResult | null;
  prior: EngineResult | null;
  values: PlanValues;
  parents: WalkthroughParent[];
}

/** "Bowman Lv 54": the only way M14 text names a character (TR-13). */
export const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${classLabel(c)} Lv ${c.level}`;

const ACTIVITY_WORD: Readonly<Record<string, string>> = {
  FIGHTING: 'Fighting',
  FISHING: 'Fishing',
  MINING: 'Mining',
  CHOPPIN: 'Choppin',
  CATCHING: 'Catching',
};

interface LeafPlan {
  leaf: ItemNode;
  supplies: SupplyEval[];
  effort: LeafEffort;
}

interface Built {
  parent: WalkthroughParent;
  quest: QuestData | null;
  root: ReqNode;
  leaves: LeafPlan[];
  bottleneck: ItemNode | null;
  doneLeaves: number;
}

function otherWays(kb: WalkthroughKnowledge, supplies: SupplyEval[], world: number): string[] {
  // Drops nobody can reach yet first (best chance first), then Active Play sources (FR-8, US-5).
  const locked: { text: string; chance: number }[] = [];
  const active: string[] = [];
  for (const s of supplies) {
    if (s.kind === 'active-play' && s.where.monsterName)
      active.push(
        say(kb, ENTRY.assign, 'other-active', { monster: s.where.monsterName }) ?? s.where.monsterName,
      );
    else if (s.kind === 'drop' && !s.afkable && s.where.monsterName && s.where.map) {
      const gate = (s.where.world ?? 0) > world ? `World ${s.where.world}` : 'its door';
      locked.push({
        text:
          say(kb, ENTRY.assign, 'other-unreachable', {
            monster: s.where.monsterName,
            map: s.where.map,
            gate,
          }) ?? s.where.monsterName,
        chance: s.chance ?? 0,
      });
    }
  }
  locked.sort((a, b) => b.chance - a.chance || (a.text < b.text ? -1 : 1));
  return [...new Set([...locked.slice(0, 8).map((l) => l.text), ...active])];
}

function treeLines(node: ReqNode, out: WalkthroughTreeLine[] = []): WalkthroughTreeLine[] {
  if (node.kind === 'item') {
    const held = node.unknown ? '?' : node.held.toLocaleString('en-US');
    const worn = node.worn ? `, ${node.worn.toLocaleString('en-US')} worn` : '';
    out.push({
      depth: node.depth,
      text: `${node.need.toLocaleString('en-US')} ${node.name} (${held} held${worn}${node.stoppedBecause === 'cycle' ? "; can't expand this (recipe loop)" : ''})`,
      done: node.unknown ? null : node.missing === 0,
    });
  } else
    out.push({
      depth: node.depth,
      text:
        node.gate === 'quest' ? node.label : `${node.label}${node.met === null ? ' (check in game)' : ''}`,
      done: node.gate === 'quest' ? null : node.met,
    });
  for (const c of node.children) treeLines(c, out);
  return out;
}

const subjectOf = (index: number | null): Subject | null => (index === null ? null : `c${index}`);

export function planWalkthroughs(
  input: PlanInput,
): WalkthroughResult & { built: WalkthroughBuilt[]; rows: RowAction[] } {
  const { state, kb, values } = input;
  const graph = mapGraph(kb);
  const pool = new HoldingsPool(state);
  const diagnostics: string[] = [];
  const ectx: ExpandContext = { state, kb, pool, diagnostics };
  const sctx: SupplyContext = { state, kb, graph };
  const world = state.account.currentWorld ?? 1;

  // 1. Trees, once per target, holdings to the higher-ranked parent first (FR-13, FR-23).
  const built: Built[] = [];
  const seen = new Set<string>();
  for (const parent of input.parents) {
    if (seen.has(parent.targetId)) continue;
    seen.add(parent.targetId);
    const t = expandTarget(ectx, parent.targetId, parent.root);
    if (!t) continue;
    const leaves = missingLeaves(t.root).map((leaf) => {
      const supplies = suppliesOf(sctx, leaf);
      leaf.supplies = supplies;
      return { leaf, supplies, effort: leafEffort(leaf, supplies, values) };
    });
    const all = itemNodes(t.root).filter((n) => n.children.every((c) => c.kind === 'gate'));
    built.push({
      parent,
      quest: t.quest,
      root: t.root,
      leaves,
      bottleneck: bottleneckOf(leaves),
      doneLeaves: all.filter((n) => n.missing === 0 && !n.unknown).length,
    });
  }

  // 2. Jobs across Walkthroughs: highest-ranked first, longest effort first (FR-17).
  const jobInputs: JobInput[] = [];
  const jobItems = new Set<string>();
  for (const b of built) {
    const jobs = b.leaves
      .filter((l) => l.effort.kind === 'job' && !jobItems.has(l.leaf.rawName))
      .sort((x, y) => (y.effort.seconds ?? -1) - (x.effort.seconds ?? -1));
    for (const l of jobs) {
      jobItems.add(l.leaf.rawName);
      jobInputs.push({
        leaf: l.leaf,
        supplies: l.supplies,
        effort: l.effort,
        parentKey: b.parent.key,
        parentEntryId: b.parent.entryId,
        targetId: b.parent.targetId,
        bottleneck: b.bottleneck === l.leaf,
      });
    }
  }
  const onSupply = new Set<number>();
  for (const b of built)
    for (const l of b.leaves)
      for (const sup of l.supplies)
        for (const p of sup.perCharacter) if (p.alreadyFarming) onSupply.add(p.characterIndex);
  const pctx: PlanContext = { state, meta: input.meta, prior: input.prior, values, onSupply };
  const jobs = assignJobs(pctx, jobInputs);
  const jobOf = new Map(jobs.map((j) => [j.rawName, j]));

  // 3. Views.
  const rows: RowAction[] = [];
  const views: WalkthroughBuilt[] = built.map((b) => {
    const steps = stepsOf(input, b, jobOf, rows);
    const total = steps.length + b.doneLeaves;
    const slowest = b.bottleneck?.name ?? null;
    // M18 FR-15: "you hold everything" is said here, so the Goal and its Walkthrough never disagree.
    const allHeld = b.parent.root !== undefined && b.leaves.length === 0 && gatesMet(b.root);
    const collapsed =
      (allHeld
        ? say(kb, ENTRY.assign, 'collapsed-all-held', { total })
        : slowest
          ? say(kb, ENTRY.assign, 'collapsed', { done: b.doneLeaves, total, item: slowest })
          : say(kb, ENTRY.assign, 'collapsed-none', { done: b.doneLeaves, total })) ?? '';
    const caveats: string[] = [];
    if (!holdingsKnown(state)) caveats.push(say(kb, ENTRY.assign, 'can-tell-not', {}) ?? "can't tell");
    if (input.prior?.versions.parserBehind) caveats.push('may be out of date');
    const view: WalkthroughView = {
      targetId: b.parent.targetId,
      collapsed,
      steps,
      tree: treeLines(b.root),
      otherWays: [...new Set(b.leaves.flatMap((l) => otherWays(kb, l.supplies, world)))],
      caveats,
    };
    return {
      targetId: b.parent.targetId,
      parentKey: b.parent.key,
      parentEntryId: b.parent.entryId,
      parentSubject: b.parent.subject,
      tree: b.root,
      bottleneck: b.bottleneck?.rawName ?? null,
      view,
    };
  });

  // 4. Demand (FR-13) and the printer plan (FR-25 to FR-30).
  const demandMap = new Map<
    string,
    { rawName: string; missing: number; byParent: { key: string; amount: number }[] }
  >();
  for (const b of built)
    for (const l of b.leaves) {
      const d = demandMap.get(l.leaf.rawName) ?? { rawName: l.leaf.rawName, missing: 0, byParent: [] };
      d.missing += l.leaf.missing;
      d.byParent.push({ key: b.parent.key, amount: l.leaf.missing });
      demandMap.set(l.leaf.rawName, d);
    }
  const demand = [...demandMap.values()];
  const covered = new Set(
    built.flatMap((b) =>
      itemNodes(b.root)
        .filter((n) => n.missing === 0)
        .map((n) => n.rawName),
    ),
  );
  const bottlenecks = new Set(built.map((b) => b.bottleneck?.rawName).filter((x): x is string => !!x));
  const printer = planPrinter({ state, kb, meta: input.meta, demand, covered, bottlenecks, graph });

  return { walkthroughs: views, built: views, demand, jobs, printer, rows };
}

/** Every gate in a tree is met (an unknown gate is not). */
function gatesMet(node: ReqNode): boolean {
  if (node.kind === 'gate' && node.gate !== 'quest' && node.met !== true) return false;
  return node.children.every(gatesMet);
}

/** A step's reason and its detail as one Why: "it is the slowest part, so it starts now. 5 needed: ...". */
function joinWhy(...parts: (string | null | undefined)[]): string | null {
  const xs = parts.map((p) => p?.trim()).filter((p): p is string => !!p);
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => (/[.!?]$/.test(a) ? `${a} ${b}` : `${a}. ${b}`));
}

/** "farm X at Y, then ..." -> "Farm X at Y, then ...": a row's own text starts a sentence. */
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** An FR-21 Next Action for a character row. */
export interface RowAction {
  characterIndex: number;
  key: string;
  parentKey: string;
  parentEntryId: string;
  text: string;
  why: string;
}

function stepsOf(
  input: PlanInput,
  b: Built,
  jobOf: Map<string, Job>,
  rows: RowAction[],
): WalkthroughStepView[] {
  const { state, kb, meta } = input;
  const s = (t: string, slots: Record<string, SlotValue>) => say(kb, ENTRY.assign, t, slots);
  const src = (n: ItemNode): SourceRef[] => {
    return sourcesOf(kb, itemId(n.rawName));
  };
  const steps: WalkthroughStepView[] = [];
  const add = (
    x: Omit<WalkthroughStepView, 'order' | 'after' | 'sources'> & { after?: number[]; sources?: SourceRef[] },
  ) => {
    steps.push({ ...x, order: steps.length + 1, after: x.after ?? [], sources: x.sources ?? [] });
    return steps.length;
  };
  const char = (i: number) => state.characters.find((c) => c.index === i);
  const fit = presetFit(kb);
  const parentTitle = b.parent.title;

  // Accept the quest first when nobody has it (§6).
  const q = b.quest;
  let handInBy: number | null = null;
  if (q) {
    const standing = state.characters.map((c) => ({ c, st: questStanding(state, c.index, q, prevKey(q)) }));
    const accepted = standing.filter((x) => x.st === 'accepted').map((x) => x.c);
    const carrier = accepted.find((c) => q.requires.some((r) => (c.inventoryItems?.[r.rawName] ?? 0) > 0));
    handInBy =
      (carrier ?? [...accepted].sort((a, x) => x.level - a.level || a.index - x.index)[0])?.index ?? null;
    if (handInBy === null) {
      const can = standing.filter((x) => x.st === 'acceptable').map((x) => x.c);
      const top = [...can].sort((a, x) => x.level - a.level || a.index - x.index)[0];
      if (top) {
        handInBy = top.index;
        add({
          text: s('accept', { npc: human(q.npc), who: who(top) }) ?? '',
          when: 'now',
          subject: `c${top.index}`,
          progress: null,
          why: null,
        });
      }
    }
  }

  // Leaf steps ("now"): the Bottleneck first, then by effort.
  const leaves = [...b.leaves].sort((x, y) => {
    if (x.leaf === b.bottleneck) return -1;
    if (y.leaf === b.bottleneck) return 1;
    const rank = (l: LeafPlan) => (l.effort.kind === 'smelt' ? 2 : l.effort.kind === 'produce' ? 1 : 0);
    if (rank(x) !== rank(y)) return rank(x) - rank(y);
    return (y.effort.seconds ?? -1) - (x.effort.seconds ?? -1);
  });
  // FR-16: a leaf needed only behind an unmet gate still starts now; the step says why.
  const behind = new Map<ItemNode, string>();
  const mark = (node: ReqNode) => {
    const gate = node.children.find((x) => x.kind === 'gate' && x.gate === 'anvil-tab' && x.met === false);
    if (node.kind === 'item' && gate?.kind === 'gate')
      for (const x of node.children) if (x.kind === 'item') behind.set(x, gate.label);
    node.children.forEach(mark);
  };
  mark(b.root);
  const leafStep = new Map<ItemNode, number>();
  let collected = false;
  const collectAll = () => {
    if (collected) return;
    collected = true;
    // Collect what waits in the Forge's output (FR-6 "in the Forge: collect").
    for (const n of itemNodes(b.root)) {
      const f = n.holdings.find((h) => h.place === 'forge');
      if (f && n.held > 0)
        add({
          text: s('collect', { amount: Math.min(f.amount, n.held), item: n.name }) ?? '',
          when: 'now',
          subject: null,
          progress: null,
          why: null,
        });
    }
  };
  for (const l of leaves) {
    const n = l.leaf;
    if (l.effort.kind === 'smelt') collectAll();
    const progress = { held: n.held, need: n.need };
    const isBottleneck = n === b.bottleneck;
    const sup = l.effort.supply;
    let text: string | null = null;
    let subject: Subject | null = null;
    /** M21 FR-M7: the map a farm or gather step happens on, for "See it on the map". */
    let mapIndex: number | null = null;
    let why: string | null = null;
    let rowText: string | null = null;
    // The step's numbers and conditions: its `<template>-why`, joined after the reason (copy rule 1).
    const detail: { why: string | null } = { why: null };
    const sw = (t: string, slots: Record<string, SlotValue>) => {
      detail.why = s(`${t}-why`, slots);
      return s(t, slots);
    };
    // R-Q9a item 4: preset steps go right before the job, or right after it when the push comes first.
    const presetTexts: { text: string; subject: Subject }[] = [];
    let presetsAfter = false;
    if (l.effort.kind === 'buy' && sup?.kind === 'liquid-shop' && sup.liquid) {
      const L = sup.liquid;
      text =
        L.costForMissing !== null
          ? sw('buy-liquid-today', { missing: n.missing, item: n.name, cost: Math.round(L.costForMissing) })
          : L.days !== null
            ? sw('buy-liquid-days', {
                missing: n.missing,
                item: n.name,
                water: Math.floor(L.water),
                now: L.affordableNow,
                days: L.days,
              })
            : s('buy-liquid-none', { missing: n.missing, item: n.name });
    } else if (l.effort.kind === 'buy' && sup?.kind === 'shop')
      text = s('buy-shop', { missing: n.missing, item: n.name, town: sup.where.town ?? '' });
    else if (l.effort.kind === 'produce' && sup?.anvil) {
      const bestChar = sup.perCharacter
        .filter((p) => p.eligible && p.etaSeconds !== null)
        .sort(
          (a, x) =>
            (a.etaSeconds as number) - (x.etaSeconds as number) || a.characterIndex - x.characterIndex,
        )[0];
      const c = bestChar ? char(bestChar.characterIndex) : undefined;
      text =
        c && bestChar
          ? sw('produce', {
              item: n.name,
              who: who(c),
              level: c.smithingLevel ?? 0,
              missing: n.missing,
              hours: hoursText(bestChar.etaSeconds as number),
            })
          : sw('produce-gate', { missing: n.missing, item: n.name, level: sup.anvil.levelReq });
      subject = c ? `c${c.index}` : null;
    } else if (l.effort.kind === 'smelt' && sup?.forge)
      text = sw('smelt', {
        missing: n.missing,
        item: n.name,
        ore: sup.forge.oreHeld,
        oreName: sup.forge.oreName,
      });
    else if (l.effort.kind === 'job') {
      const job = jobOf.get(n.rawName);
      const ch = job?.chosen;
      const c = job?.assignees[0] !== undefined ? char(job.assignees[0]) : undefined;
      if (job && ch && c) {
        subject = `c${c.index}`;
        const where = ch.supply.where;
        mapIndex = where.mapIndex;
        const skill = ch.supply.kind === 'skill-node';
        const already = job.pref === 1;
        if (skill) {
          const eff = ch.eval.skillEfficiency ?? 0;
          const gate =
            ch.supply.minEfficiency !== undefined && eff < ch.supply.minEfficiency
              ? (s('gate-efficiency', {
                  item: n.name,
                  skill: ACTIVITY_WORD[where.skill ?? ''] ?? human(where.skill ?? ''),
                  need: ch.supply.minEfficiency,
                }) ?? '')
              : '';
          text = already
            ? sw('gather-already', { who: who(c), item: n.name, map: where.map ?? '', missing: n.missing })
            : sw('gather', {
                who: who(c),
                map: where.map ?? '',
                world: where.world ?? 0,
                item: n.name,
                missing: n.missing,
                gate,
              });
        } else if (already) {
          text = s('farm-already', { who: who(c), item: n.name, map: where.map ?? ch.supply.kind });
          // No rate: the time is left out, never printed as "?" (Design Lab copy rule).
          detail.why =
            job.etaSeconds !== null
              ? s('farm-already-why', { hours: hoursText(job.etaSeconds), missing: n.missing })
              : s('farm-already-why-none', { missing: n.missing });
        } else
          text = sw('farm', {
            who: who(c),
            map: where.map ?? '',
            world: where.world ?? 0,
            item: n.name,
            missing: n.missing,
            kills: Math.round(ch.eval.killsNeeded ?? 0),
            chance: chanceText(ch.supply.chance ?? 0),
            dropRate: (Math.round((ch.eval.dropRate ?? 0) * 100) / 100).toFixed(2),
            hours: hoursText(ch.eval.etaSeconds ?? 0),
            kph: ch.eval.killsPerHour ?? 0,
          });
        if (!already) {
          // R-Q9a item 4: preset steps before a move that changes the activity.
          for (const a of c.afkType === job.activity ? [] : presetActions(c, job.activity, fit)) {
            const act = ACTIVITY_WORD[job.activity] ?? human(job.activity);
            const action =
              a.kind === 'switch'
                ? s('preset-switch', { talent: a.talent + 1, card: a.card + 1, activity: act })
                : a.kind === 'setup-talent'
                  ? s('preset-talent-setup', { talent: a.talent + 1, activity: act })
                  : s('preset-card-fill', { card: a.card + 1, activity: act });
            if (action)
              presetTexts.push({
                text: s('preset-step', { who: who(c), action }) ?? action,
                subject: `c${c.index}`,
              });
          }
          // R-Q9a item 3: one character, two Goals: order its jobs.
          if (job.sequence && meta?.pushGoal) {
            const pushGoal = input.prior?.characters
              .find((x) => x.index === c.index)
              ?.goals.find((g) => g.id === 'metapath.goal.push');
            const raw = pushGoal?.nextAction.text ?? 'finish the portal push';
            const pushText = raw.charAt(0).toLowerCase() + raw.slice(1);
            const jobText = skill
              ? sw('job-gather', { item: n.name, map: where.map ?? '', missing: n.missing })
              : sw('job-farm', {
                  item: n.name,
                  map: where.map ?? '',
                  kills: Math.round(ch.eval.killsNeeded ?? 0),
                  hours: hoursText(ch.eval.etaSeconds ?? 0),
                });
            const firstPush = job.sequence.firstIs === 'push';
            presetsAfter = firstPush;
            const firstSeconds = firstPush ? job.sequence.pushEtaSeconds : job.etaSeconds;
            const slots = {
              who: who(c),
              first: (firstPush ? pushText : jobText) ?? '',
              second: (firstPush ? jobText : pushText) ?? '',
            };
            const timed = firstSeconds !== null ? { ...slots, firstHours: hoursText(firstSeconds) } : null;
            text = timed ? s('sequence', timed) : s('sequence-plain', slots);
            // The row already names the character: its own text drops "On the <who>:" (copy rule 6).
            const own = timed ? s('sequence-own', timed) : s('sequence-own-plain', slots);
            rowText = own ? capitalize(own) : text;
            why =
              job.sequence.reason === 'short'
                ? s('sequence-why-short', {})
                : s('sequence-why-rank', { first: firstPush ? 'the push' : parentTitle });
          } else if (job.fixFirst) why = s('reason-fix-first', {});
          else if (isBottleneck)
            why = behind.has(n)
              ? s('reason-start-early', { gate: behind.get(n) as string })
              : s('reason-bottleneck', {});
          // FR-21: the move shows on the character's row when it is free (pref 2) or its own Role.
          if (job.pref === 2 || job.pref === 'role')
            rows.push({
              characterIndex: c.index,
              key: `${job.key}@c${c.index}`,
              parentKey: b.parent.key,
              parentEntryId: b.parent.entryId,
              text:
                job.sequence && rowText
                  ? rowText
                  : (s('assign', { map: where.map ?? '', item: n.name, goal: parentTitle }) ?? ''),
              why:
                s('assign-why', {
                  goal: parentTitle,
                  reason: job.pref === 'role' ? (s('reason-role', {}) ?? '') : (s('reason-free', {}) ?? ''),
                }) ?? '',
            });
        }
      } else {
        const sp = l.effort.supply;
        mapIndex = sp?.where.mapIndex ?? null;
        const door =
          sp?.kind === 'drop' && sp.where.mapIndex !== null ? doorInto(kb, sp.where.mapIndex) : null;
        const reachers = (sp?.perCharacter ?? [])
          .filter((p) => p.eligible)
          .map((p) => char(p.characterIndex));
        text =
          door && sp && reachers.length <= 1
            ? sw('farm-locked', {
                missing: n.missing,
                item: n.name,
                map: sp.where.map ?? '',
                world: sp.where.world ?? 0,
                gateMap: door.map,
                requirement: door.requirement,
                who: reachers[0] ? `the ${who(reachers[0])}` : 'nobody',
              })
            : sp?.kind === 'skill-node'
              ? s('gather-wait', {
                  missing: n.missing,
                  item: n.name,
                  map: sp.where.map ?? '',
                  world: sp.where.world ?? 0,
                })
              : s('farm-wait', {
                  missing: n.missing,
                  item: n.name,
                  map: sp?.where.map ?? '',
                  world: sp?.where.world ?? 0,
                });
      }
    } else if (n.notCovered) text = s('not-covered', { item: n.name, system: 'no game data at this pin' });
    else text = s('check-in-game', { what: `where to get ${n.name}` });
    if (!text) continue;
    const presetStep = (p: { text: string; subject: Subject }) =>
      add({
        text: p.text,
        when: presetsAfter ? 'after' : 'now',
        subject: p.subject,
        progress: null,
        why: null,
      });
    if (!presetsAfter) presetTexts.forEach(presetStep);
    const at = add({
      text,
      when: 'now',
      subject,
      ...(mapIndex !== null ? { mapIndex } : {}),
      progress,
      why: joinWhy(
        why ??
          (isBottleneck
            ? behind.has(n)
              ? s('reason-start-early', { gate: behind.get(n) as string })
              : s('reason-bottleneck', {})
            : null),
        detail.why,
      ),
      sources: src(n),
    });
    leafStep.set(n, at);
    if (presetsAfter) presetTexts.forEach(presetStep);
  }

  collectAll();

  // "After" steps: crafts and unlocks, leaves up (post-order), then the hand-in.
  const stepsUnder = (node: ReqNode): number[] => {
    const out: number[] = [];
    const walk = (x: ReqNode) => {
      if (x.kind === 'item') {
        const st = leafStep.get(x);
        if (st) out.push(st);
        const cr = craftStep.get(x);
        if (cr) out.push(cr);
      }
      if (x.kind === 'gate') {
        const u = unlockStep.get(x);
        if (u) out.push(u);
      }
      x.children.forEach(walk);
    };
    node.children.forEach(walk);
    return [...new Set(out)].sort((a, c) => a - c);
  };
  const craftStep = new Map<ReqNode, number>();
  const unlockStep = new Map<ReqNode, number>();
  const post = (node: ReqNode) => {
    for (const c of node.children) post(c);
    // M18 X3: an unmet recipe unlock is its own step; its label is the owner module's words.
    if (node.kind === 'gate' && node.gate === 'recipe' && node.met === false && node.label)
      unlockStep.set(node, add({ text: node.label, when: 'now', subject: null, progress: null, why: null }));
    if (node.kind === 'gate' && node.gate === 'anvil-tab' && node.met === false && node.tab) {
      const tabItem = node.children.find((x) => x.kind === 'item');
      unlockStep.set(
        node,
        add({
          text:
            s('unlock', {
              item: tabItem?.kind === 'item' ? tabItem.name : `Anvil Tab ${node.tab}`,
              tab: node.tab,
            }) ?? '',
          when: 'after',
          after: stepsUnder(node),
          subject: null,
          progress: null,
          why: null,
        }),
      );
    }
    if (node.kind === 'item' && node.via === 'recipe' && node.missing > 0 && !node.stoppedBecause) {
      const smith = node.children.find((x) => x.kind === 'gate' && x.gate === 'smithing');
      const level = smith?.kind === 'gate' ? (smith.level ?? 0) : 0;
      const gated = smith?.kind === 'gate' && smith.met === false;
      const slots = {
        amount: node.missing,
        item: node.name,
        level,
        bag: gated ? '' : (s('craft-bag', {}) ?? ''),
      };
      const text = s(gated ? 'craft-gate' : 'craft', slots);
      const why = s(gated ? 'craft-gate-why' : 'craft-why', slots);
      craftStep.set(
        node,
        add({
          text: text ?? '',
          when: 'after',
          after: stepsUnder(node),
          subject: null,
          progress: { held: node.held, need: node.need },
          why,
          sources: src(node),
        }),
      );
    }
  };
  post(b.root);

  if (q) {
    const c = handInBy !== null ? char(handInBy) : undefined;
    const items = q.requires.map((r) => `${r.amount.toLocaleString('en-US')} ${r.name}`).join(', ');
    add({
      text: c ? (s('hand-in', { items, npc: human(q.npc), who: who(c) }) ?? '') : '',
      when: steps.length ? 'after' : 'now',
      after: steps.map((x) => x.order),
      subject: subjectOf(c?.index ?? null),
      progress: null,
      why: null,
      sources: sourcesOf(kb, b.parent.targetId).filter((x) => x.tier !== 1),
    });
  }
  return steps.filter((x) => x.text !== '');
}

/** The door into a map and its kill requirement (maps.fact.maps), for "open <map>'s door first". */
function doorInto(kb: WalkthroughKnowledge, mapIndex: number): { map: string; requirement: number } | null {
  for (const r of mapGraph(kb).values()) {
    const d = r.doors.find((x) => x.destination === mapIndex && x.requirement > 0);
    if (d) return { map: human(r.name), requirement: d.requirement };
  }
  return null;
}

/** The previous quest key of the same NPC, from the generated quest order (never key arithmetic). */
function prevKey(q: { questOrder: number; questKey: string }): string | null {
  if (q.questOrder <= 0) return null;
  const n = Number(q.questKey);
  return Number.isInteger(n) && n > 1 ? String(n - 1) : null;
}

/** Leaves whose drop maps the worker computes rates for (TR-3): drop rows only, by chance x quantity. */
export function leavesForRates(
  state: AccountState,
  kb: WalkthroughKnowledge,
  targets: readonly string[],
): { rawName: string; maps: { mapIndex: number; chance: number }[] }[] {
  const ctx: ExpandContext = { state, kb, pool: new HoldingsPool(state), diagnostics: [] };
  const out = new Map<string, { mapIndex: number; chance: number }[]>();
  for (const t of targets) {
    const e = expandTarget(ctx, t);
    if (!e) continue;
    for (const leaf of missingLeaves(e.root)) {
      const item = itemOf(kb, leaf.rawName);
      if (!item) continue;
      const maps = item.drops.flatMap((d) =>
        d.maps.map((mapIndex) => ({ mapIndex, chance: d.chance * d.quantity })),
      );
      if (maps.length) out.set(leaf.rawName, [...(out.get(leaf.rawName) ?? []), ...maps]);
    }
  }
  return [...out].map(([rawName, maps]) => ({ rawName, maps }));
}
