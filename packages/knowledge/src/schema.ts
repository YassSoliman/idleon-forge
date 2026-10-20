// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Knowledge Base entry schema (M11 TR-2, TR-2a, TR-2b). Authored YAML is parsed, then validated
// against `AuthoredFile`; generated JSON against `GeneratedFile`. The cross-entry rules (TR-8) live in
// packages/kb-tools and run after both. Every key is strict: an unknown key fails, so no numeric weight,
// score or rank can ever be added to an entry by accident (FR-8).
import { z } from 'zod';
import { STAGES } from './stages';

// ---------- primitives ----------
export const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
export const ENTRY_TYPES = [
  'goal',
  'contribution',
  'check',
  'priority',
  'build',
  'acquisition',
  'metapath',
] as const;
export const EntryType = z.enum(ENTRY_TYPES);
export type EntryTypeName = (typeof ENTRY_TYPES)[number];
export const SystemId = z.string().regex(new RegExp(`^${SLUG}$`), 'system ids are lower-case kebab');
export const ENTRY_ID_RE = new RegExp(`^${SLUG}\\.(${ENTRY_TYPES.join('|')})\\.${SLUG}$`);
export const EntryId = z.string().regex(ENTRY_ID_RE, 'id must be <system>.<type>.<slug>');
export const DETECTOR_ID_RE = new RegExp(`^${SLUG}/${SLUG}$`);
export const DetectorId = z.string().regex(DETECTOR_ID_RE, 'detector id must be <system>/<name>');
export const GameVersion = z.string().regex(/^\d+\.\d+\.\d+$/, 'game version like 2.3.540');
export const IsoDate = z.iso.date();
export const StageId = z.enum(STAGES); // W1-early … W4-late (12 values, #26, M26 FR-3)
export type StageId = z.infer<typeof StageId>;
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

export const AFK_TYPES = [
  'FIGHTING',
  'MINING',
  'CHOPPIN',
  'FISHING',
  'CATCHING',
  'COOKING',
  'LABORATORY',
  'DIVINITY',
  'SPELUNKING',
] as const;
export const PARALLEL_SLOTS = ['trap', 'cog', 'worship', 'cauldron', 'printer'] as const;
export const VERIFICATION = ['confirmed', 'corrected', 'contested', 'unverified'] as const;

// ---------- Sources (ADR 0004) ----------
/** A tier 1 Source must be a permalink to game data: a Toolbox file at a 40-character commit sha (FR-3). */
export const TIER1_URL_RE = /^https:\/\/github\.com\/Morta1\/IdleonToolbox\/blob\/[0-9a-f]{40}\//;
/**
 * ADR 0004 amendment (M26 FR-2b, owner Q10): a tier 1 Source may also be a read of the game client
 * itself, the web build's script on legendsofidleon.com. It then carries the hash of the excerpt we
 * stored (`docs/research/game-client/excerpts/<excerptSha256>.txt`) and the client build it came from.
 */
export const GAME_CLIENT_URL_RE = /^https:\/\/legendsofidleon\.com\/[^?#]+\.js$/;
const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'a sha256 in lowercase hex');
/** The client file a game-client Source read: its sha256 and its Last-Modified date. */
export const ClientBuild = z.strictObject({ sha256: Sha256, lastModified: IsoDate });

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
    verification: z.enum(VERIFICATION).optional(),
    /** Game-client Sources only (M26 FR-2b): sha256 of the stored excerpt. */
    excerptSha256: Sha256.optional(),
    /** Game-client Sources only (M26 FR-2b): the client build read; `gameVersion` is the version it was matched to. */
    clientBuild: ClientBuild.optional(),
  })
  .refine((s) => s.tier === 1 || s.tier === 4 || s.claimDate !== undefined, {
    message: 'tier 2 and tier 3 Sources need claimDate',
    path: ['claimDate'],
  })
  .refine((s) => s.tier !== 1 || TIER1_URL_RE.test(s.url) || GAME_CLIENT_URL_RE.test(s.url), {
    message: 'a tier 1 Source is a Toolbox permalink at a 40-character commit sha, or a game-client read',
    path: ['url'],
  })
  .refine(
    (s) =>
      !GAME_CLIENT_URL_RE.test(s.url) ||
      s.tier !== 1 ||
      (s.excerptSha256 !== undefined && s.clientBuild !== undefined),
    {
      message: 'a tier 1 game-client Source needs excerptSha256 and clientBuild (ADR 0004, M26 FR-2b)',
      path: ['url'],
    },
  )
  .refine(
    (s) => (s.excerptSha256 === undefined && s.clientBuild === undefined) || GAME_CLIENT_URL_RE.test(s.url),
    {
      message: 'excerptSha256 and clientBuild belong to game-client Sources only',
      path: ['excerptSha256'],
    },
  );

// ---------- shared pieces ----------
const StageRange = z.strictObject({ from: StageId, to: StageId });
export const AppliesTo = z.strictObject({
  stages: z.union([z.literal('all'), z.array(z.union([StageId, StageRange])).min(1)]),
  /** Matches the class and every class it promotes to (Squire matches Divine_Knight, Royal_Guardian). Omit for all classes. */
  classes: z.array(ClassName).min(1).optional(),
  levels: z.strictObject({ min: z.int().min(1).optional(), max: z.int().min(1).optional() }).optional(),
  /**
   * M26 FR-3: the first Stage the entry no longer applies at. Without it a range ending at W4-entry or
   * later stays live through W4-late and past World 4 (the beyond policy, `stages.ts`).
   */
  stopsAt: StageId.optional(),
});
export const DetectorRef = z.strictObject({
  id: DetectorId,
  /** Validated against the Detector's own params schema in TR-8. Thresholds that are judgment live here. */
  params: z.record(z.string(), z.unknown()).default({}),
});
export const Side = z.strictObject({ position: Template, sources: z.array(Source).min(1) });
const ActivePlay = z.strictObject({ minutes: z.int().positive() });

/**
 * M26 FR-5, "claimed by": the thing a Check or Goal is about, when another System's entry can fire on the
 * same thing (golden food in storage, an empty friend slot). The engine keeps one card per claimed key,
 * the one from the entry whose own System is `system`, and adds the others' reasons to it as detail lines.
 */
export const Claim = z.strictObject({ system: SystemId, key: z.string().regex(new RegExp(`^${SLUG}$`)) });

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
  /**
   * `draft` (M26 FR-1, owner Q1): validated like any entry but never compiled, so it never reaches the
   * engine; promotion flips it to `active` or `contested` in the PR that ships its Detector.
   */
  status: z.enum(['active', 'contested', 'retired', 'draft']),
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
  claims: z.array(Claim).min(1).optional(),
  scope: z.enum(['character', 'account']),
  category: Category,
  unit: z.string().min(1).max(24),
  progress: DetectorRef, // a 'progress' Detector, or an engine Detector (M2's Meta Path Goals)
  /** Inherit the Milestone ladder (a game fact) from a generated Goal. Exactly one of extends / milestones. */
  extends: EntryId.optional(),
  milestones: z.array(Milestone).min(1).optional(),
  activePlay: ActivePlay.optional(), // makes it an Active Play suggestion; never affects a Verdict
  /** M14 FR-1: the target Acquisition (a quest or a craftable item) this Goal's Walkthrough expands. */
  walkthrough: EntryId.optional(),
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
  goalFamily: z
    .string()
    .regex(new RegExp(`^${SLUG}\\.goal\\.${SLUG}$`))
    .optional(),
  detector: DetectorRef, // a 'contribution' Detector
  /** #11 item 8: fighting gets an ETA from Toolbox kills per hour; skilling is yes/no only. */
  eta: z.enum(['kills-per-hour', 'none']),
  /** The stop-here suggestion text at a Milestone (M4 FR-13). */
  stopHere: Template.optional(),
  /** With status 'contested': whether Sources disagree on the order only, or on usefulness itself (M4 FR-15). */
  contestedOn: z.enum(['order', 'usefulness']).optional(),
  // Verified before build (spec index, M11): a refine on a member of zod 4's discriminated union works
  // (test/schema.test.ts, "goal or goalFamily"), so the rule stays here and not in entryRules.
}).refine((c) => (c.goal === undefined) !== (c.goalFamily === undefined), {
  message: 'exactly one of goal or goalFamily',
  path: ['goal'],
});

export const CheckEntry = Base.extend({
  type: z.literal('check'),
  claims: z.array(Claim).min(1).optional(),
  subject: z.enum(['character', 'account']),
  /** blocker = Verdict "Fix before you leave"; next-action = a Next Action under `goal`. */
  effect: z.enum(['blocker', 'next-action']),
  detector: DetectorRef, // a 'check' Detector (or an engine Detector, TR-4)
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
  /** M14 FR-1: the target Acquisition (a quest or a craftable item) this Check's Walkthrough expands. */
  walkthrough: EntryId.optional(),
  /** Derived at compile time: true exactly for effect 'blocker'. YAML may state it only as an assertion, which CI checks (M6 R9). */
  affectsVerdict: z.boolean().optional(),
  /**
   * M21 D-10: the real time a fix takes, in seconds. The Verdict counter shows a fix time only when the
   * entry has one; otherwise the time token is hidden (DS-3, DS-23). No entry ships a value in R-M21.
   */
  fixSeconds: z.int().positive().optional(),
  /**
   * M21 FR-N3: the "Same job on N characters" card's sentence when this Check's Next Action shows on 2
   * or more Roster rows, said once for everyone ("Collect and re-place your finished traps"). Plain
   * text: per-character numbers go on the glyph chips. Required for a Check that fires on 3 or more
   * characters on a golden fixture (`kb check`, code group-text).
   */
  groupText: z.string().min(1).optional(),
});

/** M7 TR-6: what a Spend Plan item buys. */
export const SpendBlock = z.strictObject({
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

export const RefItem = z
  .strictObject({
    ref: EntryId,
    verification: z.enum(VERIFICATION).optional(),
    sources: z.array(Source).default([]),
    /** Required when verification is 'contested' and the referenced entry isn't itself contested. */
    sides: z.array(Side).min(2).optional(),
    /** M6: listed once, in the never-skip block; the engine moves it to position 3 when its urgency is 'banked' (M2 TR-13). */
    byUrgency: z.boolean().optional(),
    /** M8 D5, M7: still ranks, after the last authored position, in later Stage lists that don't list it (M2 TR-13). */
    carryForward: z.boolean().optional(),
  })
  .refine(
    (t) => t.verification !== 'contested' || t.sides !== undefined,
    'a contested item needs at least 2 sides',
  );
/** Splice in a shared block (another Priority List with list: 'block'), e.g. #26's never-skip position-1 block.
 *  An include contributes all of the block's items to this ONE position, as a tie; blocks never shift later positions. */
export const IncludeItem = z.strictObject({ include: EntryId });
/** M7: one Spend Plan item, only inside a list: 'spend'. Its stable key is `${listId}#${item}` (M7 SpendLine.entryId). */
export const SpendItem = z.strictObject({
  item: z.string().regex(new RegExp(`^${SLUG}$`)), // unique within its list
  ref: EntryId, // a generated Acquisition, e.g. upgrade-vault.acquisition.row-23
  spend: SpendBlock,
  text: Template,
  why: Template,
  sources: z.array(Source).min(1),
  confidence: z.enum(['H', 'M', 'L']),
  verification: z.enum(VERIFICATION).optional(),
  carryForward: z.boolean().optional(),
});
export const TierItem = z.union([EntryId, RefItem, IncludeItem, SpendItem]);

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
/**
 * M26: a world past the Stage model (Stages end in World 4). A step or Build with a hint applies only
 * on an account past World 4; the Stage model can't tell W5 from W7 yet, so the hint is the earliest.
 */
export const WORLD_HINTS = ['W5', 'W6', 'W7'] as const;
export const WorldHint = z.enum(WORLD_HINTS);
/** A class talent tab: 1-3 up to the subclass, 4 the elite class, 5 the master class (M26). */
export const BuildTab = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export const BuildStep = z.strictObject({
  talent: RawName, // a generated talent fact, checked against talents.fact tables
  target: z.union([z.int().positive(), z.literal('max')]),
  tie: z.string().optional(),
  core: z.boolean().optional(), // only the steps M9 TR-5 lists; CI enforces (M9 TR-15)
  hardCap: z.boolean().optional(),
  when: z.array(StepCondition).optional(),
  breakpoints: z.array(z.int().positive()).optional(),
  /** M26: applies only past World 4, from this world (Gaming talents at W5). */
  stageHint: WorldHint.optional(),
});
export const BuildEntry = Base.extend({
  type: z.literal('build'),
  classLine: ClassName, // e.g. "Squire"
  role: z.enum(['fighting', 'skilling']),
  serves: z.array(z.enum(AFK_TYPES)), // e.g. ["MINING"]; [] for the Hunter's trapping preset
  variant: z.literal('afk'),
  /** The role's talents for classification (M9 TR-6), not only the steps. */
  tags: z.array(RawName).min(1),
  tabs: z
    .array(
      z.strictObject({
        tab: BuildTab,
        steps: z.array(BuildStep).min(1),
      }),
    )
    .min(1),
  attacks: z.array(RawName).default([]),
  onePointOk: z.array(RawName).default([]),
  /**
   * M26: the Build whose tabs this one takes for every tab it doesn't list (a master Build lists tab 5
   * and takes tabs 1-4 from its elite Build).
   */
  inherits: EntryId.optional(),
  /** M26: independent dated authors behind the order, when more than the listed Sources show. */
  sourceCount: z.int().min(1).optional(),
  /** M26 (owner ruling 2026-10-19): the confidence words shown with the Build ("one source"). */
  confidenceLabel: z.string().min(1).max(60).optional(),
  /** M26: the world past the Stage model the whole Build applies from (master classes: W6). */
  stageHint: WorldHint.optional(),
});

/** M21 TR-8 (FR-C12): a useful cap a star step stops at, worked out from save data. */
export const STAR_CAPS = ['best-level-tenth', 'best-beginner-tenth'] as const;
/** M21 TR-8: a star step's extra condition: only when the preset serves one of these AFK skills. */
export const ServesAnyCondition = z.strictObject({
  kind: z.literal('servesAny'),
  afk: z.array(z.enum(AFK_TYPES)).min(1),
});
/**
 * M21 TR-8 (FR-C11): a class-agnostic star Build (the Star Talent tab, "Special Talent 1-4" in game
 * data). Kept apart from the class Builds: never in preset classification or `kb.build(line, role)`;
 * the engine reads it through `kb.starBuild(role)`. One pool of points across pages 1-4.
 */
export const StarBuildEntry = Base.extend({
  type: z.literal('build'),
  variant: z.literal('star'),
  role: z.enum(['fighting', 'skilling']),
  steps: z
    .array(
      z.strictObject({
        talent: RawName,
        page: z.int().min(1).max(4),
        target: z.union([z.int().positive(), z.literal('max'), z.strictObject({ cap: z.enum(STAR_CAPS) })]),
        tie: z.string().optional(),
        core: z.boolean().optional(),
        when: z.array(z.union([StepCondition, ServesAnyCondition])).optional(),
      }),
    )
    .min(1),
});
/** Both Build shapes under `type: build`, told apart by `variant` (afk: class Builds; star: M21). */
export const AnyBuildEntry = z.discriminatedUnion('variant', [BuildEntry, StarBuildEntry]);

/** M14 TR-4: a generated requirement may carry a quantity (`{ ref, amount }`). */
const Requirement = z.union([
  EntryId,
  z.strictObject({ text: Template }),
  z.strictObject({ ref: EntryId, amount: z.number().positive() }),
]);
/** M14 TR-4: how an Acquisition method gets the thing. */
export const ACQUISITION_KINDS = [
  'drop',
  'skill-node',
  'anvil',
  'forge',
  'shop',
  'liquid-shop',
  'printer',
  'recipe',
  'quest',
  'active-play',
] as const;
export const AcquisitionEntry = Base.extend({
  type: z.literal('acquisition'),
  thing: z.strictObject({
    kind: z.enum(['obol', 'stamp', 'card', 'item', 'talent', 'class', 'building', 'quest', 'other']),
    rawName: RawName,
  }),
  extends: EntryId.optional(), // inherit generated requirements and rates
  methods: z
    .array(
      z.strictObject({
        how: Template,
        where: z
          .strictObject({ map: RawName.optional(), monster: RawName.optional(), npc: RawName.optional() })
          .optional(),
        requires: z.array(Requirement).default([]),
        kind: z.enum(ACQUISITION_KINDS).optional(),
      }),
    )
    .min(1)
    .optional(),
  detector: DetectorRef.optional(), // an 'acquisition' Detector: owned? requirements met?
});

export const METAPATH_PARTS = [
  'slots',
  'roles',
  'milestones',
  'stages',
  'pusher-rule',
  'gate-chain',
  'expectations',
] as const;
/**
 * M15 TR-10: one Stage Expectation row, "by this Stage, this fix of ours should no longer be firing".
 * Our own table (never AutoReview's); `fix` must resolve to an entry (kb check, M15 C4).
 */
export const StageExpectation = z.strictObject({
  id: z.string().regex(new RegExp(`^${SLUG}$`)),
  /** The System's display name, e.g. "Cards". */
  system: z.string().min(1).max(40),
  /** The Stage by which the fix should be silent. */
  expectedBy: StageId,
  fix: EntryId,
  /** Only findings whose slot `findingField` equals this value count (e.g. F2's subject is the 3D Printer). */
  when: z
    .strictObject({ findingField: z.string().min(1), equals: z.union([z.string(), z.number()]) })
    .optional(),
  /** Character findings below this class level never count (FR-26); default 30. */
  minCharacterLevel: z.int().min(1).optional(),
  why: Template,
  sources: z.array(Source).min(1),
});
export const MetaPathEntry = Base.extend({
  type: z.literal('metapath'),
  /** M2 TR-7 adds stages, pusher-rule and gate-chain. */
  part: z.enum(METAPATH_PARTS),
  slots: z
    .array(
      z
        .strictObject({
          slot: z.union([
            z.int().min(1).max(11),
            z.strictObject({ from: z.int().min(1), to: z.int().max(11) }),
          ]),
          classLine: ClassName,
          role: RoleId.optional(),
          note: Template.optional(),
          status: z.enum(['active', 'contested']).default('active'),
          sides: z.array(Side).min(2).optional(),
        })
        .refine(
          (sl) => (sl.status === 'contested') === (sl.sides !== undefined),
          'a contested slot needs sides, and only a contested slot has them',
        ),
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
    .array(
      z.strictObject({
        id: StageId,
        rule: z.string().min(1),
        needs: z.array(Template).default([]),
        factRefs: z.array(z.string()).default([]),
      }),
    )
    .optional(),
  /** M2 TR-1: the engine Detector behind this part (metapath/stage, metapath/roster, metapath/pusher). */
  detector: DetectorRef.optional(),
  /** M2 TR-10, D1: the incumbent margin (1.25). */
  pusherRule: z.strictObject({ margin: z.number().min(1) }).optional(),
  /** M2 TR-11: the ordered gate steps of one or more worlds. */
  gateChain: z
    .array(
      z.strictObject({
        world: z.int().min(1).max(4),
        steps: z
          .array(
            z.strictObject({
              kind: z.enum(['route', 'quest', 'boss', 'crystal', 'gatekeeper']),
              ref: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .optional(),
  /** M15 TR-10: the Stage Expectations table (F5 Behind for your Stage), in tie-break order. */
  expectations: z.array(StageExpectation).min(1).optional(),
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

// ---------- single-entry rules ----------
type EntryShape = z.infer<
  | typeof GoalEntry
  | typeof ContributionEntry
  | typeof CheckEntry
  | typeof PriorityEntry
  | typeof BuildEntry
  | typeof StarBuildEntry
  | typeof AcquisitionEntry
  | typeof MetaPathEntry
>;

const METAPATH_FIELD = {
  slots: 'slots',
  roles: 'roles',
  milestones: 'milestones',
  stages: 'stages',
  'pusher-rule': 'pusherRule',
  'gate-chain': 'gateChain',
  expectations: 'expectations',
} as const;

/**
 * M17 TR-4: the kinds of Timeline bar (`values.timelineKind`). An entry that emits Timeline bars authors
 * both `timelineKind` and `timelineWhat` (the producer's words for what binds, "anvil").
 */
export const TIMELINE_KINDS = ['storage', 'food', 'time-cap', 'production', 'bank', 'timer'] as const;

/** The rules one entry must satisfy on its own (TR-2). Exported so `kb check` can name each one in its tests. */
export function entryRules(e: EntryShape, ctx: z.RefinementCtx): void {
  const add = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  const [, typeSeg] = e.id.split('.');
  if (typeSeg !== e.type) add('id', `id segment "${typeSeg}" must equal type "${e.type}"`);
  if (!e.id.startsWith(`${e.system}.`)) add('id', 'id must start with its system');
  if ((e.status === 'contested') !== (e.contested !== undefined))
    add('contested', 'contested status and contested.sides go together');
  if ((e.status === 'retired') !== (e.retired !== undefined))
    add('retired', 'retired status and retired block go together');
  if (e.type === 'goal') {
    if ((e.extends === undefined) === (e.milestones === undefined))
      add('milestones', 'a Goal needs exactly one of extends or milestones');
    if (e.milestones?.some((m, i, a) => i > 0 && m.at <= (a[i - 1]?.at ?? Number.NEGATIVE_INFINITY)))
      add('milestones', 'Milestones must strictly ascend');
  }
  if (e.type === 'contribution' && e.eta === 'kills-per-hour' && e.activity.afkType !== 'FIGHTING')
    add('eta', 'kills-per-hour ETA only for FIGHTING (#11 item 8)');
  if (e.type === 'check' && e.effect === 'blocker') {
    if (e.status === 'contested') add('status', 'a contested entry cannot be a Verdict blocker');
    if (e.confidence !== 'H') add('confidence', 'Verdict blockers need confidence H');
    if (e.activePlay) add('activePlay', 'Active Play suggestions never affect a Verdict');
    if (!e.sources.some((s) => s.tier <= 2))
      add('sources', 'Verdict blockers need a tier 1 or 2 Source (D3)');
    if (e.priority?.frame === 'by-urgency') add('priority', 'Verdict blockers are not list items');
  }
  if (e.type === 'priority') {
    // block lists have no Stage; goals, spend and leverage lists have exactly one; order lists may have one.
    if (e.list === 'block' && e.stage !== undefined) add('stage', 'block lists have no stage');
    if ((e.list === 'goals' || e.list === 'spend' || e.list === 'leverage') && e.stage === undefined)
      add('stage', 'goals, spend and leverage lists have exactly one stage');
    if (
      e.stage &&
      !(e.appliesTo.stages !== 'all' && e.appliesTo.stages.length === 1 && e.appliesTo.stages[0] === e.stage)
    )
      add('appliesTo', 'appliesTo.stages must be [stage]');
  }
  if (e.type === 'metapath') {
    const present = (Object.values(METAPATH_FIELD) as (keyof typeof e)[]).filter((k) => e[k] !== undefined);
    if (present.length !== 1 || present[0] !== METAPATH_FIELD[e.part])
      add('part', `part "${e.part}" needs exactly the "${METAPATH_FIELD[e.part]}" field`);
  }
  if (e.type === 'contribution' && e.contestedOn !== undefined && e.status !== 'contested')
    add('contestedOn', 'contestedOn only on a contested entry');
  if (e.type === 'check' && e.affectsVerdict !== undefined && e.affectsVerdict !== (e.effect === 'blocker'))
    add('affectsVerdict', 'affectsVerdict is true exactly for effect: blocker');
  // M17 TR-4: Timeline bar words come in pairs, and the kind is one of TIMELINE_KINDS.
  const tk = e.values.timelineKind;
  const tw = e.values.timelineWhat;
  if ((tk === undefined) !== (tw === undefined))
    add('values', 'timelineKind and timelineWhat go together (M17 TR-4)');
  if (tk !== undefined && !(TIMELINE_KINDS as readonly unknown[]).includes(tk))
    add('values', `timelineKind must be one of ${TIMELINE_KINDS.join(', ')}`);
  if (tw !== undefined && (typeof tw !== 'string' || tw.length === 0 || tw.length > 40))
    add('values', 'timelineWhat is a short phrase (1 to 40 characters)');
}

export const AuthoredEntry = z
  .discriminatedUnion('type', [
    GoalEntry,
    ContributionEntry,
    CheckEntry,
    PriorityEntry,
    AnyBuildEntry,
    AcquisitionEntry,
    MetaPathEntry,
  ])
  .superRefine(entryRules);

export const AuthoredFile = z.strictObject({
  system: SystemId,
  entries: z.array(AuthoredEntry).min(1),
});

export const GeneratedBy = z.strictObject({
  generator: z.string().min(1), // e.g. "death-note"
  inputs: z.array(z.string()).min(1), // e.g. ["parsers/world-3/deathNote.ts#DEATH_NOTE_RANKS", "website-data/shared-data.json#deathNote"]
  commit: z.string().regex(/^[0-9a-f]{40}$/),
});

/** Structured game data a generated entry carries for its Detectors and the engine (routes, item requirements,
 *  cost bases). Machine data only: never shown as text except through slots. Added in the M11 build (TR-10 table). */
const GeneratedData = z.record(z.string(), z.json()).optional();

/** Generated entries are Goals and Acquisitions with machine provenance. Authored YAML can never set `generatedBy`. */
export const GeneratedEntry = z
  .discriminatedUnion('type', [
    GoalEntry.extend({ origin: z.literal('generated'), generatedBy: GeneratedBy, data: GeneratedData }),
    AcquisitionEntry.extend({
      origin: z.literal('generated'),
      generatedBy: GeneratedBy,
      /** Drop chance and similar rates exist only on generated Acquisitions (FR-17). */
      rates: z.record(z.string(), z.number()).optional(),
      data: GeneratedData,
    }),
  ])
  .superRefine(entryRules);

// ---------- fact tables (TR-2a): game facts that are not entries ----------
export const FACT_ID_RE = new RegExp(`^${SLUG}\\.fact\\.${SLUG}$`);
export const FactId = z.string().regex(FACT_ID_RE, 'fact id must be <system>.fact.<slug>');
export const FactTable = z
  .strictObject({
    id: FactId,
    system: SystemId,
    /** 'authored' = a tier 2–3 fact not yet generatable (ADR 0007), e.g. metapath.fact.family-slots, stamps.fact.unobtainable. */
    origin: z.enum(['generated', 'authored']),
    title: z.string().min(1).max(80),
    /** Validated by the schema its generator declares, or by a zod schema co-located with the authored file. */
    rows: z.json(),
    sources: z.array(Source).min(1),
    generatedBy: GeneratedBy.optional(),
    /** For authors and reviewers; never shown to players. */
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (f) => (f.origin === 'generated') === (f.generatedBy !== undefined),
    'generatedBy only, and always, on generated tables',
  )
  .refine(
    (f) =>
      f.origin === 'generated'
        ? f.sources.every((s) => s.tier === 1)
        : f.sources.every((s) => (s.tier === 2 || s.tier === 3) && s.claimDate !== undefined) ||
          // Toolbox-code constants (TR-2a): authored rows whose Source is the Toolbox file and line at the pin.
          f.sources.every((s) => s.tier === 1),
    {
      message:
        'generated tables cite a tier 1 permalink; authored tables cite tier 2–3 Sources with claimDate',
      path: ['sources'],
    },
  );

export const GeneratedFile = z.strictObject({
  system: SystemId,
  generator: z.string().min(1),
  entries: z.array(GeneratedEntry),
});
export const GeneratedFactsFile = z.strictObject({
  system: SystemId,
  generator: z.string().min(1),
  facts: z.array(FactTable),
});
export const AuthoredFactsFile = z.strictObject({
  system: SystemId,
  facts: z.array(FactTable).min(1),
});

export type AuthoredEntryT = z.infer<typeof AuthoredEntry>;
export type GeneratedEntryT = z.infer<typeof GeneratedEntry>;
export type Entry = AuthoredEntryT | GeneratedEntryT;
export type FactTableT = z.infer<typeof FactTable>;
export type FactTable = FactTableT;
export type SourceT = z.infer<typeof Source>;
export type TierItemT = z.infer<typeof TierItem>;
export type DetectorRefT = z.infer<typeof DetectorRef>;

export const SystemDef = z.strictObject({
  id: SystemId,
  name: z.string().min(1).max(40),
  world: z.int().min(0).max(7), // 0 = cross-cutting
  scope: z.enum(['character', 'account', 'both']),
  dossier: z.url({ protocol: /^https$/ }),
  /** 'always', or a 'milestone' Detector that says whether the System is unlocked on this account. */
  unlocked: z.union([z.literal('always'), DetectorRef]),
  /** M17 FR-16: 'game' Systems get a Systems hub tile; 'activeon' rows are ActiveOn's own concepts. */
  kind: z.enum(['game', 'activeon']).optional(),
  /** M17 FR-34: the fact table holding how this System opens (a row keyed by the System id). */
  unlockFact: FactId.optional(),
});
export type SystemDefT = z.infer<typeof SystemDef>;
/** M17 TR-8: a System's kind; absent means 'game'. */
export const systemKind = (s: Pick<SystemDefT, 'kind'>): 'game' | 'activeon' => s.kind ?? 'game';

/** M17 FR-34: the fact table of how each game System opens. */
export const SYSTEM_UNLOCKS_ID = 'systems.fact.unlocks';
/**
 * One row of `systems.fact.unlocks` (M17 FR-34, TR-8): the in-game condition in condition form
 * ("Opens …" or "Needs …", at most 120 characters), its world, the patch it was verified on and at
 * least one player-readable tier 2–4 Source (#74), the System's IdleOn Wiki page among them. A row whose
 * condition is a level in `metapath.fact.town-unlocks` names it in `level` and writes `{level}` in `text`
 * instead of repeating the number.
 */
export const SystemUnlockRow = z.strictObject({
  system: SystemId,
  text: z
    .string()
    .min(1)
    .max(120)
    .regex(/^(Opens|Needs)\b/, 'an unlock condition starts with "Opens" or "Needs"'),
  world: z.int().min(0).max(7),
  gameVersion: GameVersion,
  level: z.strictObject({ fact: FactId, key: z.string().min(1) }).optional(),
  sources: z.array(Source).min(1),
});
export type SystemUnlockRowT = z.infer<typeof SystemUnlockRow>;

/**
 * M17 TR-9's advice lexicon: an imperative from the Next Action templates ("Equip", "Collect", "Claim",
 * "Spend", "Buy", "Swap", …) or a rating word (P6). View words and unlock conditions never match it.
 */
export const ADVICE_IMPERATIVES =
  /(^|[.:;·,]\s*|\s)(Equip|Collect|Claim|Spend(?! Plan)|Buy|Swap|Upgrade|Craft|Refine|Kill|Put|Assign|Activate|Fix)\b/;
export const ADVICE_RATINGS = /\b(tier|tiers|rated|rating|score|scores)\b/i;
/** True when `text` reads as advice or a rating (M17 TR-9). */
export const isAdviceShaped = (text: string): boolean =>
  ADVICE_IMPERATIVES.test(text) || ADVICE_RATINGS.test(text);
export const SystemUnlockRows = z.array(SystemUnlockRow).min(1);
export const SystemsFile = z.strictObject({ systems: z.array(SystemDef).min(1) });

/** `majors.yaml` (TR-11, D2): the game versions that count as major patches. Authored judgment. */
export const MajorsFile = z.strictObject({
  majors: z.array(
    z.strictObject({ gameVersion: GameVersion, date: IsoDate, what: z.string().min(1).max(120) }),
  ),
});
