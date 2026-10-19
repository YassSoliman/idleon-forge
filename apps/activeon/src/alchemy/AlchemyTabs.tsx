// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Alchemy System page's six sections (canvas boards after/Alchemy = Cauldrons,
// after/sys/AlchemyBubbles = Bubbles, after/AlchemyVials = Vials, after/sys/AlchemyP2W = Pay 2 Win, plus
// Liquids and Seats), a lazy chunk. The four Alchemy Systems share this page; each opens on its own tab.
// It only lays out `EngineResult.alchemy` and M20's cauldron seats (built in the worker) and M7's Pay 2
// Win prices; it adds no advice. Our own sprites (ADR 0009).
import { brewLine, liquidAmount, potLine, potName, tubeLine } from '@idleon-forge/engine/alchemy-text';
import { formatCoins } from '@idleon-forge/engine/now';
import type { AlchemyResult, EngineResult, P2wCell, PotView } from '@idleon-forge/engine/result';
import { Sprite } from '../art/sprites/Sprite';
import type { FullPageProps, SystemPageBodyProps } from '../systems/pages';
import { CauldronSeatsBody } from '../systems/SlotPictures';
import { FramedSections } from '../systems/w23/framed';
import {
  Bar,
  Big,
  Cap,
  Head,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  Tag,
  Who,
  whoLabel,
} from '../systems/w23/kit';
import './alchemy-tabs.css';
import { VialTries } from './VialTries';

export const ALCHEMY_WORDS = {
  tabs: {
    cauldrons: 'Cauldrons',
    bubbles: 'Bubbles',
    vials: 'Vials',
    liquids: 'Liquids',
    p2w: 'Pay 2 Win',
    seats: 'Seats',
  },
  cauldronsLede:
    'Each cauldron brews its own colour of bubble: Power, Quicc, High-IQ and Kazam. The brew in a cauldron turns into new bubbles.',
  bubblesLede:
    'Each bubble colour has its own cauldron. Gold bars are the levels worth reaching at your Stage.',
  levelThis: 'Level this',
  brewIn: (line: string) => `brew in the pot: ${line}`,
  nextNew: (name: string) => `next new: ${name}`,
  seated: 'Seated',
  nobody: 'nobody',
  bubblesOf: (pot: string) => `${pot} cauldron's bubbles`,
  allBubbles: (n: number) => `${n} found across the four, on the Bubbles tab`,
  atLevel: (lv: number) => (lv === 1 ? 'all level 1' : `all level ${lv}`),
  nextNewRow: (name: string, pot: string) => `${name}: the next new ${pot} bubble, from brew`,
  later: 'later',
  found: (n: number) => `${n} found`,
  nextNewBubble: 'Next new bubble',
  brewBuys: (line: string) => `brew in it buys ${line}`,
  noneYet: 'none yet',
  vialsUnlocked: (n: number, of: number) => `${n} of ${of}`,
  vialsCap: 'Vials',
  ofUnlocked: (of: number) => `of ${of} unlocked`,
  howTry: 'How a try works',
  howTryText:
    "Drop the vial's item on it at the W2 town cauldron: one item, one roll. You need the roll shown or higher.",
  nextLevelUp: 'Next level up',
  attempts: (cur: number, max: number) => `${cur} of ${max} tries left today`,
  needs: (item: string) => `needs ${item}`,
  water: 'Water',
  whenFull: 'When it fills, spend it on bubbles, vials or the Liquid Shop.',
  cauldronsHead: 'Cauldrons',
  cauldronsNote: 'level now · next level costs',
  liquidsHead: 'Liquids',
  liquidsNote: 'the other three open with Alchemy levels',
  vialsPlayer: 'Vials and Player',
  maxed: 'maxed',
  next: (c: string) => `next ${c}`,
  cheapest: 'cheapest',
  inPlan: 'In your Spend Plan',
  openPlan: 'Open the Spend Plan',
  notPriced: 'not priced yet',
  notOpen: 'not open yet',
  answerCap: 'Do this next',
  refill: 'they refill at the daily reset',
  vialSub: (name: string, from: number, to: number, have: number, of: number) =>
    `Next vial: ${name} ${from} → ${to} · ${have} of ${of} vials unlocked`,
} as const;
const W = ALCHEMY_WORDS;

const POTS = ['power', 'quicc', 'high-iq', 'kazam'] as const;
const potSprite = (c: string) => `cauldron-${c}`;
const LIQUID_SPRITE = ['liquid-water', 'liquid-nitrogen', 'liquid-seawater', 'liquid-mercury'];

/** Which tab each Alchemy System opens on. */
const OPENS_ON: Record<string, string> = {
  alchemy: 'cauldrons',
  'alchemy-bubbles': 'bubbles',
  'alchemy-vials': 'vials',
  'alchemy-p2w': 'p2w',
};

/** M7's price for a Pay 2 Win key, from its Spend Plan step (spend/candidates.ts `p2wRef`); null when unpriced. */
const p2wRef = (key: string) =>
  `alchemy-p2w.acquisition.${key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-')}`;
function p2wCost(result: EngineResult, key: string): number | null {
  const ref = p2wRef(key);
  for (const l of result.account?.spendPlan?.lines ?? [])
    for (const st of l.steps) if (st.sink === 'p2w' && st.ref === ref && st.coins !== null) return st.coins;
  return null;
}

/** The pot to show first: the lit pick's, else the first with something to level. */
const litPot = (a: AlchemyResult): PotView | null =>
  a.pots.find(
    (x) => a.pick !== null && x.next?.actionKey === a.pick.actionKey && x.next.actionKey !== null,
  ) ??
  a.pots.find((x) => x.next && x.next.atLeast > 0) ??
  a.pots[0] ??
  null;

function Seat({ p, cauldron }: { p: SystemPageBodyProps; cauldron: string }) {
  const seats = pictureOf(p, 'cauldron-seats');
  const st = seats?.stations.find((x) => x.station === cauldron);
  if (!st) return null;
  return (
    <div className="w-row w-foot al2-seat">
      <Cap>{W.seated}</Cap>
      {st.brewers.length ? (
        st.brewers.map((i) => <Who key={i} p={p} index={i} quiet />)
      ) : (
        <span className="w-mut">{W.nobody}</span>
      )}
    </div>
  );
}

function PotTile({ p, pot, lit }: { p: SystemPageBodyProps; pot: PotView; lit: boolean }) {
  const brew = brewLine(pot);
  return (
    <li className={`a-tile w-tile al2-pot al2-${pot.cauldron}${lit ? ' is-now' : ''}`}>
      <div className="w-row w-row--between">
        <Sprite name={potSprite(pot.cauldron)} size={48} decorative />
        {lit ? <Tag tone="gold">{W.levelThis}</Tag> : null}
      </div>
      <div className="w-stack w-stack--4">
        <h4 className="a-h2 al2-name">{potName(pot.cauldron)}</h4>
        <span className="w-sm w-b">{potLine(pot)}</span>
        {brew ? <span className="w-xs w-mut">{W.brewIn(brew)}</span> : null}
        {pot.nextUnlock ? <span className="w-xs w-mut">{W.nextNew(pot.nextUnlock)}</span> : null}
      </div>
      <Seat p={p} cauldron={pot.cauldron} />
    </li>
  );
}

function Cauldrons({ p, a }: { p: SystemPageBodyProps; a: AlchemyResult }) {
  const first = litPot(a);
  const litKey = a.pick?.actionKey ?? null;
  const water = a.tubes.find((t) => t.index === 0) ?? null;
  const chips = first ? (a.column[first.cauldron] ?? []) : [];
  const inRows = new Set(first?.rows.map((r) => r.rawName) ?? []);
  const rest = chips.filter((c) => c.unlocked && !inRows.has(c.rawName));
  const restLevels = [...new Set(rest.map((c) => c.level))];
  const total = POTS.reduce((t, c) => t + (a.column[c] ?? []).filter((x) => x.unlocked).length, 0);
  return (
    <>
      <p className="w-p">{W.cauldronsLede}</p>
      <ul className="w-grid w-grid--4 w-plain al2-pots">
        {a.pots.map((pot) => (
          <PotTile
            key={pot.cauldron}
            p={p}
            pot={pot}
            lit={litKey !== null && pot.next?.actionKey === litKey}
          />
        ))}
      </ul>
      <Split
        main={
          first ? (
            <section className="w-stack" aria-labelledby="al2-bub-h">
              <Head id="al2-bub-h" title={W.bubblesOf(potName(first.cauldron))} note={W.allBubbles(total)} />
              <ol className="w-hair w-plain">
                {first.rows.map((r, i) => (
                  <li key={r.rawName} className="w-li">
                    <Tag tone={i === 0 && r.atLeast > 0 ? 'gold' : undefined}>{i + 1}</Tag>
                    <span className="w-grow w-b">{r.name}</span>
                    <span className={`w-sm${r.atLeast > 0 ? ' w-t--gold' : ' w-mut'}`}>
                      {r.atLeast > 0
                        ? `level ${r.from} → ${r.to}`
                        : r.blocked
                          ? W.needs(r.blocked.name)
                          : `level ${r.from}`}
                    </span>
                  </li>
                ))}
                {rest.length ? (
                  <li className="w-li">
                    <Tag>{rest.length}</Tag>
                    <span className="w-grow w-mut2">{rest.map((c) => c.name).join(', ')}</span>
                    <span className="w-sm w-mut">
                      {restLevels.length === 1 ? W.atLevel(restLevels[0] as number) : ''}
                    </span>
                  </li>
                ) : null}
                {first.nextUnlock ? (
                  <li className="w-li">
                    <Tag>+</Tag>
                    <span className="w-grow w-mut">
                      {W.nextNewRow(first.nextUnlock, potName(first.cauldron))}
                    </span>
                    <span className="w-sm w-mut">{W.later}</span>
                  </li>
                ) : null}
              </ol>
            </section>
          ) : null
        }
        aside={
          water ? (
            <div className="w-stack">
              <Cap>{W.water}</Cap>
              <div className="w-row">
                <Big value={liquidAmount(water.current)} unit={`of ${water.max}`} />
              </div>
              <Bar value={water.current} max={water.max} tone="sky" label={`${W.water} ${tubeLine(water)}`} />
              <span className="w-sm w-mut2">{W.whenFull}</span>
              {a.tubes
                .filter((t) => !t.open)
                .slice(0, 1)
                .map((t) => (
                  <span key={t.index} className="w-xs w-mut">
                    {t.name} {tubeLine(t)}
                  </span>
                ))}
            </div>
          ) : null
        }
      />
    </>
  );
}

function Bubbles({ a }: { a: AlchemyResult }) {
  const litKey = a.pick?.actionKey ?? null;
  return (
    <>
      <p className="w-p">{W.bubblesLede}</p>
      <ul className="w-grid w-grid--4 w-plain al2-pots">
        {a.pots.map((pot) => {
          const chips = (a.column[pot.cauldron] ?? []).filter((c) => c.unlocked);
          const plan = new Map(pot.rows.map((r) => [r.rawName, r]));
          const lit = litKey !== null && pot.next?.actionKey === litKey;
          const brew = brewLine(pot);
          return (
            <li
              key={pot.cauldron}
              className={`a-tile w-tile al2-pot al2-${pot.cauldron}${lit ? ' is-now' : ''}`}
            >
              <div className="w-row">
                <Sprite name={potSprite(pot.cauldron)} size={48} decorative />
                <span className="w-stack w-stack--4 w-grow">
                  <h4 className="a-h2 al2-name">{potName(pot.cauldron)}</h4>
                  <span className="w-xs w-mut2">
                    {[W.found(chips.length), pot.next?.blocked ? potLine(pot) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </div>
              <ul className="w-plain al2-bubbles">
                {chips.map((c) => {
                  const r = plan.get(c.rawName);
                  const goal = r && r.atLeast > 0 ? r.to : null;
                  return (
                    <li key={c.rawName} className="w-stack w-stack--4">
                      <span className="w-row w-row--between w-sm">
                        <span className="w-b">{c.name}</span>
                        <span className={goal ? 'w-t--gold w-b' : 'w-mut'}>
                          {goal ? `${c.level} → ${goal}` : `Lv ${c.level}`}
                        </span>
                      </span>
                      <Bar
                        value={goal ? c.level : 0}
                        max={goal ?? 1}
                        tone="gold"
                        label={goal ? `${c.name} ${c.level} of ${goal}` : `${c.name} level ${c.level}`}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="w-stack w-stack--4 w-foot">
                <Cap>{W.nextNewBubble}</Cap>
                <span className="w-sm">{pot.nextUnlock ?? W.noneYet}</span>
                {brew ? <span className="w-xs w-mut">{W.brewBuys(brew)}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Vials({ p, a }: { p: SystemPageBodyProps; a: AlchemyResult }) {
  const have = a.vials.filter((v) => v.level > 0).length;
  return (
    <Split
      main={<VialTries a={a} who={(i) => whoLabel(p, i)} />}
      aside={
        <>
          <div className="w-stack">
            <Cap>{W.vialsCap}</Cap>
            <Big value={String(have)} unit={W.ofUnlocked(a.vials.length)} />
            <Bar value={have} max={a.vials.length} label={`${have} of ${a.vials.length} vials unlocked`} />
          </div>
          {a.attempts ? (
            <div className="w-stack w-stack--8">
              <Cap>{W.attempts(a.attempts.current, a.attempts.max)}</Cap>
              <Bar
                value={a.attempts.current}
                max={a.attempts.max}
                tone="gold"
                label={W.attempts(a.attempts.current, a.attempts.max)}
              />
            </div>
          ) : null}
          <div className="w-stack w-stack--8">
            <Cap>{W.howTry}</Cap>
            <p className="w-p">{W.howTryText}</p>
          </div>
          {a.vialPick ? (
            <div className="a-tile2 w-tile2">
              <Cap>{W.nextLevelUp}</Cap>
              <span className="w-sm">
                {a.vialPick.name} {a.vialPick.from} → {a.vialPick.to}
              </span>
            </div>
          ) : null}
        </>
      }
    />
  );
}

function Liquids({ a }: { a: AlchemyResult }) {
  return (
    <ul className="w-grid w-grid--4 w-plain">
      {a.tubes.map((t) => (
        <li key={t.index} className={`a-tile w-tile${t.open ? '' : ' is-later'}`}>
          <div className="w-row">
            <Sprite name={LIQUID_SPRITE[t.index] ?? 'liquid-water'} size={32} decorative />
            <span className={`w-b${t.open ? ' w-t--sky' : ' w-mut'}`}>{t.name}</span>
          </div>
          {t.open ? (
            <>
              <Big value={liquidAmount(t.current)} unit={`of ${t.max}`} />
              <Bar value={t.current} max={t.max} tone="sky" label={`${t.name} ${tubeLine(t)}`} />
            </>
          ) : (
            <span className="w-xs w-mut">{tubeLine(t)}</span>
          )}
          {t.note ? <span className="w-xs w-mut2">{t.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function CellTile({ c, cost, lit }: { c: P2wCell | undefined; cost: number | null; lit: boolean }) {
  if (!c) return <span className="a-tile2 w-tile2 w-mut">-</span>;
  const closed = c.closed || c.level < 0;
  const maxed = c.max !== null && c.level >= c.max;
  return (
    <span className={`a-tile2 w-tile2 w-stack--4${lit ? ' is-now' : ''}`}>
      <span className={`w-b${lit ? ' w-t--gold' : ''}`}>{closed ? '-' : `Lv ${c.level}`}</span>
      <span className="w-xs w-mut">
        {closed ? W.notOpen : maxed ? W.maxed : cost !== null ? W.next(formatCoins(cost)) : W.notPriced}
      </span>
    </span>
  );
}

function P2w({ p, a }: { p: SystemPageBodyProps; a: AlchemyResult }) {
  const r = p.s.result;
  const cell = (k: string) => a.p2w.find((c) => c.key === k);
  const costs = new Map(a.p2w.map((c) => [c.key, p2wCost(r, c.key)]));
  // The cheapest open Boost Req level: the board's "cheapest" note.
  const boost = POTS.map((pot) => cell(`cauldron.${pot}.boostReq`)).filter((c): c is P2wCell => !!c);
  const cheapest = boost
    .filter((c) => costs.get(c.key) != null)
    .sort((x, y) => (costs.get(x.key) ?? 0) - (costs.get(y.key) ?? 0))[0];
  const lines = (r.account?.spendPlan?.lines ?? []).filter((l) => l.steps.some((s) => s.sink === 'p2w'));
  const liquids = a.p2w.filter((c) => c.key.startsWith('liquid.'));
  const others = a.p2w.filter((c) => c.key.startsWith('vials.') || c.key.startsWith('player.'));
  const groups = [...new Set(others.map((c) => c.row))];
  return (
    <Split
      main={
        <>
          <section className="w-stack" aria-labelledby="al2-p2w-c">
            <Head id="al2-p2w-c" title={W.cauldronsHead} note={W.cauldronsNote} />
            <table className="al2-p2w">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Cauldron</span>
                  </th>
                  <th scope="col" className="a-cap">
                    Speed
                  </th>
                  <th scope="col" className="a-cap">
                    New bubble
                  </th>
                  <th scope="col" className="a-cap">
                    Boost cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {POTS.map((pot) => {
                  const keys = ['speed', 'newBubble', 'boostReq'].map((x) => `cauldron.${pot}.${x}`);
                  return (
                    <tr key={pot}>
                      <th scope="row" className={`al2-${pot} al2-name`}>
                        <span className="w-row">
                          <Sprite name={potSprite(pot)} size={24} decorative />
                          {potName(pot)}
                        </span>
                      </th>
                      {keys.map((k) => {
                        const c = cell(k);
                        return (
                          <td key={k}>
                            <CellTile
                              c={c}
                              cost={costs.get(k) ?? null}
                              lit={!!c && (c.next || (cheapest?.key === k && !a.p2w.some((x) => x.next)))}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          {liquids.length ? (
            <section className="w-stack" aria-labelledby="al2-p2w-l">
              <Head id="al2-p2w-l" title={W.liquidsHead} note={W.liquidsNote} />
              <ul className="w-grid w-grid--4 w-plain">
                {[...new Set(liquids.map((c) => c.row))].map((row) => (
                  <li key={row} className="a-tile w-tile w-stack--8">
                    <span className="w-sm w-b w-t--sky">{row}</span>
                    {liquids
                      .filter((c) => c.row === row)
                      .map((c) => {
                        const cost = costs.get(c.key) ?? null;
                        const maxed = c.max !== null && c.level >= c.max;
                        if (c.closed || c.level < 0)
                          return (
                            <span key={c.key} className="w-row w-sm w-mut">
                              {c.label} · {W.notOpen}
                            </span>
                          );
                        return (
                          <span key={c.key} className="w-row w-sm">
                            {c.label} Lv {c.level}
                            {maxed ? (
                              <Tag tone="mint">{W.maxed}</Tag>
                            ) : cost !== null ? (
                              <span className="w-mut">· {W.next(formatCoins(cost))}</span>
                            ) : null}
                          </span>
                        );
                      })}
                  </li>
                ))}
                {a.tubes
                  .filter((t) => !t.open)
                  .map((t) => (
                    <li key={t.index} className="a-tile w-tile w-stack--8 is-later">
                      <span className="w-sm w-b w-mut">{t.name}</span>
                      <span className="w-xs w-mut">{tubeLine(t)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
          {groups.length ? (
            <section className="w-grid" aria-label={W.vialsPlayer}>
              {groups.map((row) => {
                const cs = others.filter((c) => c.row === row);
                const lit = cs.some((c) => c.next);
                const max = cs.find((c) => c.max !== null)?.max ?? null;
                return (
                  <div key={row} className={`a-tile w-tile w-stack--4${lit ? ' is-now' : ''}`}>
                    <Cap tone={lit ? 'gold' : undefined}>{row}</Cap>
                    <span className="w-sm">
                      {cs.map((c) => `${c.label} Lv ${c.level}`).join(' · ')}
                      {lit && max !== null ? <span className="w-mut"> · cap {max}</span> : null}
                    </span>
                  </div>
                );
              })}
            </section>
          ) : null}
        </>
      }
      aside={
        lines.length ? (
          <div className="w-stack">
            <Cap>{W.inPlan}</Cap>
            <ol className="w-hair w-plain">
              {lines.map((l, i) => (
                <li key={l.id} className="w-li">
                  <Tag tone={i === 0 ? 'gold' : undefined}>{i + 1}</Tag>
                  <span className="w-grow w-sm">{l.text}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="w-link" onClick={() => p.s.toSpend()}>
              {W.openPlan}
            </button>
          </div>
        ) : null
      }
    />
  );
}

/** The page's answer: the engine's step, with today's tries as the big number when it is about vials. */
export function alchemyAnswer(a: AlchemyResult): PageAnswer | null {
  const step = a.topStep;
  if (!step || !a.attempts || !step.key.startsWith('alchemy-vials.check.daily-attempts')) return null;
  // The save's count is from before any daily reset the Check projects; show it only when the step
  // says the same number, so the frame never says "use your 17" beside "0 left".
  if (!new RegExp(`\\b${a.attempts.current}\\b`).test(step.text)) return null;
  const have = a.vials.filter((v) => v.level > 0).length;
  return {
    tone: 'gold',
    cap: W.answerCap,
    hero: step.text,
    sub: a.vialPick ? W.vialSub(a.vialPick.name, a.vialPick.from, a.vialPick.to, have, a.vials.length) : null,
    big: {
      value: String(a.attempts.current),
      unit: `of ${a.attempts.max} tries left today`,
      meter: a.attempts.max > 0 ? a.attempts.current / a.attempts.max : null,
      note: W.refill,
    },
  };
}

export function alchemySections(p: SystemPageBodyProps): PageSections | null {
  const a = p.s.result.alchemy;
  if (!a) return null;
  const found = POTS.reduce((t, c) => t + (a.column[c] ?? []).filter((x) => x.unlocked).length, 0);
  const have = a.vials.filter((v) => v.level > 0).length;
  const seats = pictureOf(p, 'cauldron-seats');
  return {
    answer: alchemyAnswer(a),
    initialTab: OPENS_ON[p.page.tile.id] ?? 'cauldrons',
    tabs: [
      { id: 'cauldrons', label: W.tabs.cauldrons, render: () => <Cauldrons p={p} a={a} /> },
      { id: 'bubbles', label: W.tabs.bubbles, badge: found, render: () => <Bubbles a={a} /> },
      {
        id: 'vials',
        label: W.tabs.vials,
        badge: W.vialsUnlocked(have, a.vials.length),
        render: () => <Vials p={p} a={a} />,
      },
      { id: 'liquids', label: W.tabs.liquids, render: () => <Liquids a={a} /> },
      ...(a.p2w.length ? [{ id: 'p2w', label: W.tabs.p2w, render: () => <P2w p={p} a={a} /> }] : []),
      ...(seats ? [{ id: 'seats', label: W.tabs.seats, render: () => <CauldronSeatsBody {...p} /> }] : []),
    ],
  };
}

/** The Alchemy page on the template (FULL_PAGES: alchemy, alchemy-bubbles, -vials, -p2w). */
export default function AlchemyPage(p: FullPageProps) {
  return <FramedSections {...p} sections={alchemySections(p)} />;
}
