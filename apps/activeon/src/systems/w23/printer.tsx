// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the 3D Printer and the Armor-set Smithy (canvas boards after/sys/Printer, after/sys/ArmorSmithy).
// The printer: who prints what now (M21's printer picture with M14's one change), the stored samples
// and the sample size (M24's printer-samples picture). The Smithy: M18's set cards. Read-only facts;
// "take a sample" advice for empty slots is not here (it needs its own Check).
import type { PrinterPicture } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { materialArt } from '../../art/game/systems-art';
import type { SystemPageBodyProps } from '../pages';
import {
  Bar,
  Big,
  Cap,
  litKeyOf,
  n0,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  Who,
  widePictureOf,
} from './kit';

export const PRINTER_WORDS = {
  printing: 'Printing',
  stored: 'Stored samples',
  ofPrinting: (n: number, of: number) => `${n} of ${of}`,
  empty: 'empty',
  perHour: (n: string) => `${n} an hour`,
  notPrinting: 'not printing',
  levelPrints: (lv: number) =>
    `not printing: level ${lv} prints for ${lv} ${lv === 1 ? 'character' : 'characters'}`,
  level: 'Printer level',
  of: (max: number) => `of ${max}`,
  perLevel: 'Each level lets one more character print.',
  inSlot: (to: number) => `Level ${to} is in a Construction build slot now.`,
  size: 'Sample size',
  sizeAll: (pct: string) => `${pct}% on every character.`,
  noStored: 'nothing stored',
  slots: (n: number) => `${n} stored-sample slots each`,
} as const;
const W = PRINTER_WORDS;

const pct = (n: number) => String(Math.round(n * 100) / 100);

function Printing({ p }: { p: SystemPageBodyProps }) {
  const pic = widePictureOf<PrinterPicture>(p, 'printer');
  const samples = pictureOf(p, 'printer-samples');
  const slots = pictureOf(p, 'build-slots');
  if (!pic) return null;
  const lit = litKeyOf(
    p,
    pic.elements.map((e) => e.actionKey),
  );
  const printing = [...new Set(pic.elements.map((e) => e.characterIndex))];
  const others = (samples?.characters ?? []).filter((c) => !printing.includes(c.index));
  const inSlot = slots?.slots.find((b) => b?.index === 0) ?? null;
  const sizes = [...new Set((samples?.characters ?? []).map((c) => pct(c.samplePct)))];
  return (
    <Split
      main={
        <ul className="w-plain">
          {printing.map((i) => {
            const els = pic.elements.filter((e) => e.characterIndex === i);
            return (
              <li key={i} className="a-tile w-tile w23-print">
                <span className="w23-print__who">
                  <Who p={p} index={i} />
                </span>
                <span className="w-row w-grow">
                  {els.map((e) => {
                    const on = lit !== null && e.actionKey === lit;
                    return (
                      <span key={e.id} className={`a-tile2 w-tile2 w23-sample${on ? ' is-now' : ''}`}>
                        <GameIcon
                          art={materialArt(e.item)}
                          fallback="sys-printer"
                          size={24}
                          wiki={e.item}
                          decorative
                        />
                        <span className="w-stack w-stack--4">
                          <span className={e.item ? 'w-sm w-b' : 'w-sm w-b w-t--gold'}>
                            {e.item ?? W.empty}
                          </span>
                          {e.perHour !== null ? (
                            <span className="w-xs w-mut">{W.perHour(n0(e.perHour))}</span>
                          ) : null}
                          {on && e.changeText ? <span className="w-xs w-t--gold">{e.changeText}</span> : null}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </li>
            );
          })}
          {others.map((c) => (
            <li key={c.index} className="a-tile w-tile w23-print is-later">
              <span className="w23-print__who">
                <Who p={p} index={c.index} />
              </span>
              <span className="w-sm w-mut">{W.levelPrints(pic.level)}</span>
            </li>
          ))}
        </ul>
      }
      aside={
        <>
          <div className="w-stack">
            <Cap>{W.level}</Cap>
            <Big value={String(pic.level)} unit={samples?.maxLevel ? W.of(samples.maxLevel) : undefined} />
            {samples?.maxLevel ? (
              <Bar value={pic.level} max={samples.maxLevel} label={`${W.level} ${pic.level}`} />
            ) : null}
            <span className="w-sm w-mut2">
              {W.perLevel} {inSlot ? W.inSlot(inSlot.level + 1) : ''}
            </span>
          </div>
          {sizes.length ? (
            <div className="w-stack w-stack--8">
              <Cap>{W.size}</Cap>
              <span className="w-sm w-mut2">{sizes.length === 1 ? W.sizeAll(sizes[0] as string) : null}</span>
              {sizes.length > 1 ? (
                <ul className="w-plain w-sm">
                  {(samples?.characters ?? []).map((c) => (
                    <li key={c.index} className="w-row w-row--between">
                      <Who p={p} index={c.index} quiet />
                      <span>{pct(c.samplePct)}%</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      }
    />
  );
}

function Stored({ p }: { p: SystemPageBodyProps }) {
  const samples = pictureOf(p, 'printer-samples');
  if (!samples) return null;
  return (
    <section className="w-stack">
      <span className="w-note">{W.slots(samples.storedSlots)}</span>
      <ul className="w-grid w-plain">
        {samples.characters.map((c) => (
          <li key={c.index} className={`a-tile w-tile${c.stored.length ? '' : ' is-later'}`}>
            <Who p={p} index={c.index} />
            {c.stored.length ? (
              <ul className="w-plain w-sm">
                {c.stored.map((s, k) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stored samples are positional
                  <li key={k} className="w-row w-row--between">
                    <span className="w-row">
                      <GameIcon art={materialArt(s.name)} size={16} wiki={s.name} decorative />
                      <span>{s.name}</span>
                    </span>
                    <span className="w-mut">{W.perHour(n0(s.perHour))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="w-sm w-mut">{W.noStored}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function printerSections(p: SystemPageBodyProps): PageSections | null {
  const pic = widePictureOf<PrinterPicture>(p, 'printer');
  if (!pic) return null;
  const chars = new Set(pic.elements.map((e) => e.characterIndex));
  const busy = new Set(pic.elements.filter((e) => e.item).map((e) => e.characterIndex));
  const samples = pictureOf(p, 'printer-samples');
  return {
    answer: null,
    tabs: [
      {
        id: 'printing',
        label: W.printing,
        badge: W.ofPrinting(busy.size, chars.size),
        render: () => <Printing p={p} />,
      },
      ...(samples ? [{ id: 'stored', label: W.stored, render: () => <Stored p={p} /> }] : []),
    ],
  };
}

// ---- Armor-set Smithy ----

export const SMITHY_WORDS = {
  sets: 'Sets',
  registered: 'Registered',
  complete: (n: number) => `${n} complete`,
  of: (n: number, of: number) => `${n} of ${of}`,
  legend: { worn: 'worn', held: 'held, not worn', missing: 'missing' },
  none: 'No set registered yet.',
  readyCap: 'Ready for later',
  days: 'days',
} as const;
const S = SMITHY_WORDS;

function Sets({ p, registered }: { p: SystemPageBodyProps; registered: boolean }) {
  const sm = p.s.view.gear?.smithy;
  if (!sm) return null;
  const lit = litKeyOf(
    p,
    sm.sets.map((x) => x.actionKey),
  );
  const sets = sm.sets.filter((s) => s.registered === registered);
  if (registered && sets.length === 0) return <p className="w-p">{S.none}</p>;
  return (
    <section className="w-stack">
      <ul className="w-grid w-plain">
        {sets.map((set) => {
          const have = set.parts.filter((x) => x.where !== 'missing').length;
          const worn = set.parts.every((x) => x.where === 'worn');
          const on = set.actionKey !== null && set.actionKey === lit;
          return (
            <li
              key={set.set}
              className={`a-tile w-tile${on ? ' is-now' : worn || set.registered ? ' is-done' : have ? '' : ' is-later'}`}
            >
              <div className="w-row w-row--between">
                <span className="a-h2">{set.setName}</span>
                <span className={`w-sm${worn ? ' w-t--mint w-b' : ' w-mut2'}`}>
                  {S.of(have, set.parts.length)}
                </span>
              </div>
              <span className="w-sm w-b">{set.bonus}</span>
              <ul className="w-row w-plain w23-parts" aria-label={`${set.setName} set parts`}>
                {set.parts.map((pt) => (
                  <li
                    key={pt.rawName}
                    className={`w23-part w23-part--${pt.where}`}
                    title={`${pt.name}: ${S.legend[pt.where]}`}
                  >
                    <span className="sr-only">{`${pt.name}: ${S.legend[pt.where]}`}</span>
                  </li>
                ))}
              </ul>
              <span className="w-xs w-mut2">{set.line}</span>
            </li>
          );
        })}
      </ul>
      <ul className="w-row w-plain w-xs w-mut2" aria-hidden="true">
        {(['worn', 'held', 'missing'] as const).map((k) => (
          <li key={k} className="w-row">
            <span className={`w23-part w23-part--${k} w23-part--key`} />
            {S.legend[k]}
          </li>
        ))}
      </ul>
    </section>
  );
}

function smithyAnswer(p: SystemPageBodyProps): PageAnswer | null {
  const sm = p.s.view.gear?.smithy;
  if (sm?.state !== 'waiting' || sm.daysLeft === null) return null;
  const done = sm.sets.find((s) => !s.registered && s.parts.every((x) => x.where === 'worn'));
  return {
    tone: 'mint',
    cap: S.readyCap,
    hero: done ? `${done.setName} set: ${done.line}` : sm.line,
    sub: done ? done.bonus : null,
    big: { value: String(sm.daysLeft), unit: S.days, tone: 'sky', note: done ? sm.line : null },
  };
}

export function smithySections(p: SystemPageBodyProps): PageSections | null {
  const sm = p.s.view.gear?.smithy;
  if (!sm) return null;
  const complete = sm.sets.filter((s) => s.parts.every((x) => x.where === 'worn')).length;
  const reg = sm.sets.filter((s) => s.registered).length;
  const answer = smithyAnswer(p);
  return {
    answer,
    tabs: [
      {
        id: 'sets',
        label: S.sets,
        badge: complete ? S.complete(complete) : null,
        render: () => (
          <>
            {answer ? null : <p className="w-p">{sm.line}</p>}
            <Sets p={p} registered={false} />
          </>
        ),
      },
      { id: 'registered', label: S.registered, badge: reg, render: () => <Sets p={p} registered /> },
    ],
  };
}
