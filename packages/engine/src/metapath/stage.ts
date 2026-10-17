// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Stage detection (M2 FR-1 to FR-5, TR-4 to TR-6a): the whole account on one of the 10 Stages, from the
// save alone, with its evidence and its certainty. Pure: (state, kb) in, a StageResult out.
//
// Each rule is written as predicates over the fields it reads. A predicate over an unknown field is
// unknown; every assignment of the unknown predicates is tried and the earliest Stage they produce wins,
// with certainty 'partial' when they disagree (TR-6). The rules are evaluated top to bottom and the
// last one that holds wins (TR-5).
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import { render, STAGE_DEFINITIONS, STAGES, type StageId, stageIndex } from '@idleon-forge/knowledge';
import { type ClassTree, classTree, ENTRY, FACT, obolAltarLevel, stageRows, townUnlock } from './knowledge';
import type { FactLookup, StageEvidence, StageResult } from './types';

/** 9999 marks an NPC as met on characters that never pushed: never band evidence (TR-5, red-team F12). */
export const DIALOGUE_MET = 9999;

type Tri = boolean | null;

/** The predicates the TR-5 rules read. Level thresholds are folded into `maxLevel` candidates. */
interface Inputs {
  finished: number;
  maxLevel: number;
  dogBone: boolean;
  djonnut: boolean;
  subclassed: boolean;
  deathNote: boolean;
  printer: boolean;
  hoggindaz5: boolean;
  nullo: boolean;
  amethyst: boolean;
}

export interface Thresholds {
  stamps: number;
  tasks: number;
  obolAltar: number;
  postOffice: number;
}

export function thresholds(kb: FactLookup): Thresholds {
  return {
    stamps: townUnlock(kb, 'stamps'),
    tasks: townUnlock(kb, 'tasks'),
    obolAltar: obolAltarLevel(kb),
    postOffice: townUnlock(kb, 'post-office'),
  };
}

/** TR-5, top to bottom; the last rule that holds wins. */
export function stageOf(x: Inputs, t: Thresholds): StageId {
  const w1 = x.finished >= 1;
  const w2 = x.finished >= 2;
  const w3 = x.finished >= 3;
  const rules: [StageId, boolean][] = [
    ['W1-early', !w1 && x.maxLevel < t.stamps],
    ['W1-mid', !w1 && x.maxLevel >= t.stamps],
    ['W1-late', !w1 && (x.maxLevel >= t.tasks || x.dogBone)],
    ['W2-early', w1 && !w2 && (x.maxLevel < t.obolAltar || !x.subclassed)],
    ['W2-mid', w1 && !w2 && x.maxLevel >= t.obolAltar && x.subclassed],
    ['W2-late', w1 && !w2 && (x.djonnut || x.maxLevel >= t.postOffice)],
    ['W3-early', w2 && !w3 && (!x.deathNote || !x.printer || !x.hoggindaz5)],
    ['W3-mid', w2 && !w3 && x.deathNote && x.printer && x.hoggindaz5],
    ['W3-late', w2 && !w3 && (x.nullo || x.amethyst)],
    ['W4-entry', w3],
  ];
  let stage: StageId = 'W1-early';
  for (const [id, holds] of rules) if (holds) stage = id;
  return stage;
}

/** Whether a character's class is a subclass or above (TR-5: defined positively; null classIndex is neither). */
export function isSubclassed(tree: ClassTree, classIndex: number | null | undefined): boolean {
  if (classIndex === null || classIndex === undefined) return false;
  const tier = tree.byIndex.get(classIndex)?.tier;
  return tier === 'subclass' || tier === 'elite' || tier === 'master';
}

/** Gate-quest npc -> the world finished once a character completed one of its quests (TR-6a). */
const LATER_WORLD_QUESTS: ReadonlyArray<[string, number]> = [
  ['Djonnut', 1],
  ['Hoggindaz', 2],
  ['Bellows', 2],
  ['Gobo', 3],
];

interface Read {
  facts: Partial<Record<keyof Inputs, Tri>>;
  /** Readable characters' highest level; the true max may be higher when some couldn't be read. */
  knownMaxLevel: number;
  maxLevelKnown: boolean;
  evidence: StageEvidence[];
  contradiction: boolean;
  finished: number;
  beyond: boolean;
}

const bandDialogue = (v: number | undefined): boolean => v !== undefined && v > 0 && v < DIALOGUE_MET;

function read(state: AccountState, kb: FactLookup): Read | null {
  if (!isKnown(state, 'account.finishedWorlds')) return null;
  const tree = classTree(kb);
  const a = state.account;
  const chars = state.characters;
  const unreadable = state.diagnostics.unreadableCharacters.length > 0;
  const evidence: StageEvidence[] = [];

  // ---- finishedWorlds and its cross-check (TR-6a) ----
  const fw = [...a.finishedWorlds].sort((x, y) => x - y);
  const claimed = fw.length ? (fw[fw.length - 1] as number) : 0;
  let finished = claimed;
  let contradiction = false;
  for (let w = 1; w < claimed; w++) if (!fw.includes(w)) contradiction = true;
  evidence.push({ field: 'account.finishedWorlds', value: fw, known: true });
  const quests = a.gateQuests ?? null;
  if (quests && isKnown(state, 'account.gateQuests')) {
    let implied = 0;
    for (const [id, q] of Object.entries(quests))
      for (const [npc, world] of LATER_WORLD_QUESTS)
        if (id.startsWith(npc) && (q?.completedBy.length ?? 0) > 0) implied = Math.max(implied, world);
    if (implied > claimed) {
      contradiction = true;
      finished = implied;
      evidence.push({ field: 'account.gateQuests', value: implied, known: true });
    }
  }
  const beyond = finished >= 4 || (a.currentWorld ?? 0) > 4;

  // ---- levels ----
  const knownMaxLevel = chars.reduce((m, c) => Math.max(m, c.level), 0);
  evidence.push({ field: 'characters[*].level', value: knownMaxLevel, known: !unreadable });

  const facts: Read['facts'] = {};
  const world = Math.min(finished + 1, 4);

  // A per-character predicate is true when a known character satisfies it, unknown when some character
  // couldn't be read for it, else false.
  const anyChar = (path: (i: number) => string, test: (c: (typeof chars)[number]) => boolean): Tri => {
    let unknown = unreadable;
    for (const c of chars) {
      if (!isKnown(state, path(c.index))) {
        unknown = true;
        continue;
      }
      if (test(c)) return true;
    }
    return unknown ? null : false;
  };

  if (world === 1) {
    facts.dogBone = anyChar(
      (i) => `characters[${i}].npcDialog`,
      (c) => bandDialogue(c.npcDialog?.Dog_Bone),
    );
    evidence.push({
      field: 'characters[*].npcDialog.Dog_Bone',
      value: chars.flatMap((c) => (c.npcDialog?.Dog_Bone === undefined ? [] : [c.npcDialog.Dog_Bone])),
      known: facts.dogBone !== null,
    });
  }
  if (world === 2) {
    facts.subclassed = anyChar(
      (i) => `characters[${i}].classIndex`,
      (c) => isSubclassed(tree, c.classIndex),
    );
    evidence.push({
      field: 'characters[*].classIndex (subclassed)',
      value: chars.filter((c) => isSubclassed(tree, c.classIndex)).length,
      known: facts.subclassed !== null,
    });
    facts.djonnut = anyChar(
      (i) => `characters[${i}].npcDialog`,
      (c) => bandDialogue(c.npcDialog?.Djonnut),
    );
    evidence.push({
      field: 'characters[*].npcDialog.Djonnut',
      value: chars.flatMap((c) => (c.npcDialog?.Djonnut === undefined ? [] : [c.npcDialog.Djonnut])),
      known: facts.djonnut !== null,
    });
  }
  if (world === 3) {
    const b = isKnown(state, 'account.buildings') ? (a.buildings ?? null) : null;
    facts.deathNote = b?.deathNote == null ? null : b.deathNote >= 1;
    facts.printer = b?.printer3d == null ? null : b.printer3d >= 1;
    evidence.push({ field: 'account.buildings.deathNote', value: b?.deathNote ?? null, known: b !== null });
    evidence.push({ field: 'account.buildings.printer3d', value: b?.printer3d ?? null, known: b !== null });
    const q = isKnown(state, 'account.gateQuests') ? (a.gateQuests ?? null) : null;
    const h5 = q ? (q.Hoggindaz5?.completedBy.length ?? 0) : null;
    facts.hoggindaz5 = h5 === null ? null : h5 > 0;
    evidence.push({ field: 'account.gateQuests.Hoggindaz5.completedBy', value: h5, known: q !== null });
    const salts = isKnown(state, 'account.salts') ? (a.salts ?? null) : null;
    const nulloRaw = nulloRawName(kb);
    facts.nullo = salts === null ? null : salts.some((s) => s.rawName === nulloRaw && s.unlocked);
    evidence.push({ field: 'account.salts.Nullo.unlocked', value: facts.nullo, known: salts !== null });
    const crystals = isKnown(state, 'account.worldCrystals') ? (a.worldCrystals ?? null) : null;
    facts.amethyst = crystals === null ? null : crystals.galaxialAmethyst > 0;
    evidence.push({
      field: 'account.worldCrystals.galaxialAmethyst',
      value: crystals?.galaxialAmethyst ?? null,
      known: crystals !== null,
    });
  }
  if (contradiction)
    evidence.push({ field: 'account.finishedWorlds (contradicted)', value: finished, known: true });
  return { facts, knownMaxLevel, maxLevelKnown: !unreadable, evidence, contradiction, finished, beyond };
}

/** The rawName of Nullo Salt (salt 6) from refinery.fact.salts, so a reorder shows in the KB diff. */
function nulloRawName(kb: FactLookup): string {
  const f = kb.get(FACT.salts) as { rows?: Array<{ name: string; rawName: string }> } | undefined;
  return f?.rows?.find((s) => s.name === 'Nullo_Salt')?.rawName ?? 'Refinery6';
}

const FLAGS = [
  'dogBone',
  'djonnut',
  'subclassed',
  'deathNote',
  'printer',
  'hoggindaz5',
  'nullo',
  'amethyst',
] as const;

/** Every Stage the unknown predicates allow (TR-6). */
function possibleStages(r: Read, t: Thresholds): Set<StageId> {
  const levels = r.maxLevelKnown
    ? [r.knownMaxLevel]
    : [r.knownMaxLevel, ...Object.values(t).filter((v) => v > r.knownMaxLevel)];
  const unknown = FLAGS.filter((f) => r.facts[f] === null);
  const out = new Set<StageId>();
  for (const maxLevel of levels)
    for (let mask = 0; mask < 1 << unknown.length; mask++) {
      const x: Inputs = {
        finished: r.finished,
        maxLevel,
        dogBone: false,
        djonnut: false,
        subclassed: false,
        deathNote: false,
        printer: false,
        hoggindaz5: false,
        nullo: false,
        amethyst: false,
      };
      for (const f of FLAGS) {
        const v = r.facts[f];
        x[f] = v === null ? (mask & (1 << unknown.indexOf(f))) !== 0 : v === true;
      }
      out.add(stageOf(x, t));
    }
  return out;
}

/** What entering each Stage needs (FR-4): one requirement per `needs` line of the Stage entry, in order. */
function requirements(
  r: Read,
  t: Thresholds,
  stage: StageId,
): Array<{ holds: Tri; check: string; level?: number }> {
  const lv = (n: number): Tri => (r.knownMaxLevel >= n ? true : r.maxLevelKnown ? false : null);
  const or = (a: Tri, b: Tri): Tri =>
    a === true || b === true ? true : a === null || b === null ? null : false;
  // A predicate of another world is not computed: false. An unknown one stays null.
  const f = (k: keyof Inputs): Tri => (k in r.facts ? (r.facts[k] ?? null) : false);
  switch (stage) {
    case 'W1-mid':
      return [{ holds: lv(t.stamps), check: 'check-characters', level: t.stamps }];
    case 'W1-late':
      return [{ holds: or(lv(t.tasks), f('dogBone')), check: 'check-characters', level: t.tasks }];
    case 'W2-early':
      return [{ holds: r.finished >= 1, check: 'check-characters' }];
    case 'W2-mid':
      return [
        { holds: lv(t.obolAltar), check: 'check-characters', level: t.obolAltar },
        { holds: f('subclassed'), check: 'check-characters' },
      ];
    case 'W2-late':
      return [{ holds: or(f('djonnut'), lv(t.postOffice)), check: 'check-characters', level: t.postOffice }];
    case 'W3-early':
      return [{ holds: r.finished >= 2, check: 'check-characters' }];
    case 'W3-mid':
      return [
        { holds: f('deathNote'), check: 'check-towers' },
        { holds: f('printer'), check: 'check-towers' },
        { holds: f('hoggindaz5'), check: 'check-quests' },
      ];
    case 'W3-late':
      return [
        {
          holds: or(f('nullo'), f('amethyst')),
          check: f('nullo') === null ? 'check-refinery' : 'check-storage',
        },
      ];
    case 'W4-entry':
      return [{ holds: r.finished >= 3, check: 'check-characters' }];
    default:
      return [];
  }
}

const UNKNOWN_LABEL = 'Unknown';

/** M2 FR-1 to FR-5: the account's Stage. */
export function detectStage(state: AccountState, kb: FactLookup): StageResult {
  const { rows, values } = stageRows(kb);
  const provenance = (fields: string[]) => ({ entryIds: [ENTRY.stages], fields });
  const r = read(state, kb);
  if (r === null)
    return {
      id: null,
      label: UNKNOWN_LABEL,
      world: null,
      certainty: 'unknown',
      coverage: 'covered',
      rule: null,
      evidence: [{ field: 'account.finishedWorlds', value: null, known: false }],
      next: null,
      provenance: provenance(['account.finishedWorlds']),
    };
  const t = thresholds(kb);
  const fields = r.evidence.map((e) => e.field);

  if (r.beyond) {
    const def = STAGE_DEFINITIONS['W4-entry'];
    return {
      id: 'W4-entry',
      label: def.label,
      world: 4,
      certainty: r.contradiction ? 'partial' : 'certain',
      coverage: 'beyond',
      rule: rows.find((x) => x.id === 'W4-entry')?.rule ?? 'w4-entry',
      evidence: r.evidence,
      next: null,
      provenance: provenance(fields),
    };
  }

  const possible = [...possibleStages(r, t)].sort((a, b) => stageIndex(a) - stageIndex(b));
  const id = possible[0] as StageId;
  const def = STAGE_DEFINITIONS[id];
  const nextId = STAGES[stageIndex(id) + 1];
  let next: StageResult['next'] = null;
  if (nextId) {
    const templates = rows.find((x) => x.id === nextId)?.needs ?? [];
    const lines: string[] = [];
    requirements(r, t, nextId).forEach((req, i) => {
      if (req.holds === true) return;
      const line =
        req.holds === null
          ? String(values[req.check] ?? values['check-characters'] ?? '')
          : render(templates[i] ?? '', req.level === undefined ? {} : { level: req.level });
      if (line && !lines.includes(line)) lines.push(line);
    });
    next = { stage: nextId, needs: lines };
  }
  return {
    id,
    label: def.label,
    world: def.world,
    certainty: possible.length > 1 || r.contradiction ? 'partial' : 'certain',
    coverage: 'covered',
    rule: rows.find((x) => x.id === id)?.rule ?? id.toLowerCase(),
    evidence: r.evidence,
    next,
    provenance: provenance(fields),
  };
}
