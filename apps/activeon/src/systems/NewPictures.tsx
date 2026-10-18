// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-S4 (Design Lab v2 `systems.stamps` "Stamp book grid", `systems.statues` "Statue wall",
// `systems.vault` "Vault tower", `cards.printer-plan` "Slot grid"): the four new System page bodies, one
// lazy chunk. Each draws its picture from `EngineResult.slotPictures` (area S's `pictures` engine step),
// with exactly one lit element (FR-S6: the page's "See it" highlight when it names one, else the
// picture's own), labels on the lit element and at most three others (DS-20), and every other value in
// the tap sheet. Our own pixel art (ADR 0009); state classes scoped to their component (DS-21).
import { formatCoins } from '@idleon-forge/engine/now';
import type { SystemPicture } from '@idleon-forge/engine/result';
import type {
  PrinterPicture,
  StampsPicture,
  StampTab,
  StampTile,
  StatuesPicture,
  VaultPicture,
} from '@idleon-forge/engine/systems-ui';
import {
  FRAME_WORDS,
  PRINTER_WORDS,
  STAMP_WORDS,
  STATUE_WORDS,
  VAULT_WORDS,
} from '@idleon-forge/engine/systems-ui';
import { type CSSProperties, useState } from 'react';
import { PixelArt, type Ramp } from '../design/art/PixelArt';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { litOf, usePictureSheet } from './PictureSheet';
import type { SystemPageBodyProps } from './pages';
import './pictures.css';
import { cx, Tabs } from '../design/atoms';

const pictureOf = <T,>(p: SystemPageBodyProps, kind: SystemPicture['kind']): T | null =>
  ((p.s.result.slotPictures ?? []).find((x) => x.kind === kind) as T | undefined) ?? null;

const coins = (n: number | null) => (n === null ? null : formatCoins(n));
const pct = (v: number, max: number) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

function NowTag() {
  return (
    <span className="sy-nowtag">
      <PixelArt name="v2-systems-st-now" decorative />
      <span>{FRAME_WORDS.nextStep}</span>
    </span>
  );
}

// ---- Stamps ----

const stampState = (t: StampTile) =>
  t.status === 'owned' ? (t.cap > 0 && t.level >= t.cap ? 'cap' : 'owned') : t.status;

export function StampsBody(p: SystemPageBodyProps) {
  const pic = pictureOf<StampsPicture>(p, 'stamps');
  const lit = pic ? litOf(pic.elements, p.page.highlight, pic.lit) : null;
  const litTab = pic?.elements.find((e) => e.id === lit)?.tab ?? 'combat';
  const [tab, setTab] = useState<StampTab>(litTab);
  const { open, sheet } = usePictureSheet(p.page.wiki);
  if (!pic) return null;
  const labelled = new Set([lit, ...pic.next].filter(Boolean));
  const shown = pic.elements.filter((e) => e.tab === tab);
  const sheetOf = (t: StampTile) =>
    open({
      title: t.name,
      rows: [
        {
          label: FRAME_WORDS.value,
          value: t.status === 'owned' ? STAMP_WORDS.level(t.level, t.cap) : STAMP_WORDS.notOwned,
        },
        {
          label: FRAME_WORDS.next,
          value: t.status === 'owned' && t.level < t.cap ? STAMP_WORDS.nextLevel(t.level + 1) : null,
        },
        { label: FRAME_WORDS.cost, value: t.status === 'owned' ? coins(t.nextCoins) : null },
      ],
      note:
        t.status === 'owned'
          ? t.raiseInPlan
            ? STAMP_WORDS.raiseInPlan
            : t.level >= t.cap && t.cap > 0
              ? STAMP_WORDS.atCap
              : null
          : [STAMP_WORDS.status[t.status], t.route ? STAMP_WORDS.route[t.route] : null]
              .filter(Boolean)
              .join(' · '),
    });
  const nextTiles = pic.next
    .map((id) => pic.elements.find((e) => e.id === id))
    .filter((t): t is StampTile => !!t);
  return (
    <section className="sy-pic sy-stamps" aria-labelledby="sy-stamps-h">
      <h3 id="sy-stamps-h" className="sy-h3">
        {STAMP_WORDS.title}
      </h3>
      <p className="sy-pic__lede num">{STAMP_WORDS.owned(pic.owned, pic.total)}</p>
      <Tabs<StampTab>
        label={STAMP_WORDS.tabsLabel}
        value={tab}
        idBase="sy-stamps"
        onChange={setTab}
        tabs={pic.tabs.map((t) => ({
          value: t.tab,
          label: STAMP_WORDS.tabs[t.tab] ?? t.tab,
          badge: <span className="sy-dim num">{`${t.owned}/${t.total}`}</span>,
        }))}
      />
      <div
        className="sy-stamps__grid"
        role="tabpanel"
        id={`sy-stamps-panel-${tab}`}
        aria-labelledby={`sy-stamps-tab-${tab}`}
      >
        {shown.map((t) => {
          const isNow = t.id === lit;
          const st = stampState(t);
          return (
            <button
              key={t.id}
              type="button"
              className={cx('sy-stamp', `sy-stamp--${st}`, isNow && 'is-now')}
              style={{ '--pct': pct(t.level, t.cap) } as CSSProperties}
              aria-label={`${t.name}, ${t.status === 'owned' ? STAMP_WORDS.level(t.level, t.cap) : STAMP_WORDS.status[t.status]}`}
              onClick={() => sheetOf(t)}
            >
              {isNow ? <NowTag /> : null}
              <PixelArt name="v2-systems-stamp" ramp="bronze" decorative />
              {t.status === 'owned' && labelled.has(t.id) ? <b className="num">{t.level}</b> : null}
            </button>
          );
        })}
      </div>
      <p className="sy-hint">{STAMP_WORDS.legend}</p>
      {nextTiles.length ? (
        <section className="sy-ribbon" aria-labelledby="sy-stamps-next-h">
          <h4 id="sy-stamps-next-h" className="sy-h4">
            {STAMP_WORDS.nextThree}
          </h4>
          <ol>
            {nextTiles.map((t, i) => (
              <li
                key={t.id}
                className={cx('sy-ribbon__row', i === 0 && t.id === lit ? 'is-first' : 'is-dim')}
              >
                <span className="sy-ribbon__n num">{i + 1}</span>
                <PixelArt name="v2-systems-stamp" ramp="bronze" decorative />
                <span className="sy-ribbon__name">{t.name}</span>
                <span className="sy-ribbon__kind">
                  {[STAMP_WORDS.status[t.status], t.route ? STAMP_WORDS.route[t.route] : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {sheet}
    </section>
  );
}

// ---- Statues ----

const GRADE_RAMP: Ramp[] = ['stone', 'gold', 'majestic', 'plat'];

export function StatuesBody(p: SystemPageBodyProps) {
  const pic = pictureOf<StatuesPicture>(p, 'statues');
  const { open, sheet } = usePictureSheet(p.page.wiki);
  if (!pic) return null;
  const lit = litOf(pic.elements, p.page.highlight, pic.lit);
  const litTile = pic.elements.find((e) => e.id === lit) ?? null;
  const nameOf = (i: number) => {
    const r = p.s.view.roster.find((x) => x.index === i);
    return r ? `${r.classLabel} ${r.level}` : `${i + 1}`;
  };
  // FR-S4: the spread chart only when the per-character split exists (V-4: Toolbox gives it).
  const spread = litTile?.byCharacter && litTile.byCharacter.length > 0 ? litTile : null;
  const maxSpread = spread ? Math.max(1, ...(spread.byCharacter ?? [])) : 1;
  return (
    <section className="sy-pic sy-statues" aria-labelledby="sy-statues-h">
      <h3 id="sy-statues-h" className="sy-h3">
        {STATUE_WORDS.title}
      </h3>
      <p className="sy-pic__lede num">{STATUE_WORDS.counts(pic.gold, pic.onyx, pic.elements.length)}</p>
      <ul className="sy-statues__wall">
        {pic.elements.map((t) => {
          const isNow = t.id === lit;
          return (
            <li key={t.id}>
              <button
                type="button"
                className={cx('sy-statue', `sy-statue--g${Math.min(3, t.grade)}`, isNow && 'is-now')}
                aria-label={`${t.name}, ${STATUE_WORDS.level(t.level)}, ${STATUE_WORDS.grade[Math.min(3, t.grade)]}`}
                onClick={() =>
                  open({
                    title: t.name,
                    rows: [
                      { label: FRAME_WORDS.value, value: STATUE_WORDS.level(t.level) },
                      {
                        label: FRAME_WORDS.next,
                        value: STATUE_WORDS.grade[Math.min(3, t.grade + 1)] ?? null,
                      },
                      {
                        label: FRAME_WORDS.cost,
                        value: isNow ? (coins(t.goldCoins) ?? STATUE_WORDS.priceNotChecked) : null,
                      },
                    ],
                    note: t.goldInPlan ? STATUE_WORDS.inPlan : null,
                  })
                }
              >
                {isNow ? <NowTag /> : null}
                <PixelArt name="v2-systems-statue" ramp={GRADE_RAMP[Math.min(3, t.grade)]} decorative />
                <span className="sy-statue__lv num">{t.level}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {litTile ? (
        <p className="sy-statues__next">
          <b>{STATUE_WORDS.nextGold}:</b> {litTile.name} ·{' '}
          {litTile.goldCoins === null
            ? STATUE_WORDS.priceNotChecked
            : STATUE_WORDS.goldCost(formatCoins(litTile.goldCoins))}
        </p>
      ) : null}
      {spread ? (
        <section className="sy-spread" aria-labelledby="sy-spread-h">
          <h4 id="sy-spread-h" className="sy-h4">
            {`${STATUE_WORDS.spread}: ${spread.name}`}
          </h4>
          <ul>
            {(spread.byCharacter ?? []).map((lv, k) => {
              const i = spread.characterIndices[k] ?? k;
              const family = p.s.result.classFamilies?.[i];
              return (
                <li key={i} className="sy-spread__row">
                  <span className="sy-spread__who">
                    {family ? <WhoGlyph family={family} classLabel={nameOf(i)} scale={1} decorative /> : null}
                    <span>{nameOf(i)}</span>
                  </span>
                  <span className="sy-spread__bar" style={{ '--pct': pct(lv, maxSpread) } as CSSProperties} />
                  <span className="num">{STATUE_WORDS.level(lv)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {sheet}
    </section>
  );
}

// ---- Upgrade Vault ----

export function VaultBody(p: SystemPageBodyProps) {
  const pic = pictureOf<VaultPicture>(p, 'vault');
  const { open, sheet } = usePictureSheet(p.page.wiki);
  if (!pic) return null;
  const lit = litOf(pic.elements, p.page.highlight, pic.lit);
  // Floors: rows grouped by the total that opens them, top floor first (the tower reads upward).
  const floors = [...new Set(pic.elements.map((e) => e.unlockAt))].sort((a, b) => b - a);
  const hereFloor = floors.find((f) => f <= pic.totalLevels) ?? null;
  return (
    <section className="sy-pic sy-vault" aria-labelledby="sy-vault-h">
      <h3 id="sy-vault-h" className="sy-h3">
        {VAULT_WORDS.title}
      </h3>
      <p className="sy-vault__gap">
        {pic.nextUnlock
          ? VAULT_WORDS.nextUnlock(pic.nextUnlock.levels, pic.nextUnlock.name)
          : VAULT_WORDS.allOpen}
      </p>
      <ol className="sy-vault__tower">
        {floors.map((f) => (
          <li key={f} className={cx('sy-floor', f > pic.totalLevels && 'is-locked')}>
            {f === hereFloor ? (
              <p className="sy-floor__here">
                <PixelArt name="now-pin" decorative />
                <span>{VAULT_WORDS.here(pic.totalLevels)}</span>
              </p>
            ) : null}
            <p className="sy-floor__h num">{VAULT_WORDS.floor(f)}</p>
            <ul className="sy-floor__rows">
              {pic.elements
                .filter((e) => e.unlockAt === f)
                .map((r) => {
                  const isNow = r.id === lit;
                  const maxed = r.level >= r.maxLevel;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={cx(
                          'sy-vrow',
                          isNow && 'is-now',
                          !r.open && 'is-locked',
                          maxed && 'is-maxed',
                        )}
                        aria-label={`${r.name}, ${r.open ? VAULT_WORDS.level(r.level, r.maxLevel) : VAULT_WORDS.locked}`}
                        onClick={() =>
                          open({
                            title: r.name,
                            rows: [
                              {
                                label: FRAME_WORDS.value,
                                value: r.open ? VAULT_WORDS.level(r.level, r.maxLevel) : VAULT_WORDS.locked,
                              },
                              {
                                label: FRAME_WORDS.next,
                                value: r.open && !maxed ? VAULT_WORDS.level(r.level + 1, r.maxLevel) : null,
                              },
                              { label: FRAME_WORDS.cost, value: coins(r.nextCoins) },
                            ],
                            note: r.open ? null : VAULT_WORDS.floor(r.unlockAt),
                          })
                        }
                      >
                        {isNow ? <NowTag /> : null}
                        <span className="sy-vrow__name">{r.name}</span>
                        <span
                          className="sy-vrow__bar"
                          style={{ '--pct': pct(r.level, r.maxLevel) } as CSSProperties}
                        />
                        {isNow ? (
                          <span className="sy-vrow__v num">
                            {[VAULT_WORDS.level(r.level, r.maxLevel), coins(r.nextCoins)]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </li>
        ))}
      </ol>
      {sheet}
    </section>
  );
}

// ---- 3D Printer ----

export function PrinterBody(p: SystemPageBodyProps) {
  const pic = pictureOf<PrinterPicture>(p, 'printer');
  if (!pic) return null;
  const lit = litOf(pic.elements, p.page.highlight, pic.lit);
  const byChar = [...new Set(pic.elements.map((e) => e.characterIndex))];
  const nameOf = (i: number) => {
    const r = p.s.view.roster.find((x) => x.index === i);
    return r ? `${r.classLabel} ${r.level}` : `${i + 1}`;
  };
  return (
    <section className="sy-pic sy-printer" aria-labelledby="sy-printer-h">
      <h3 id="sy-printer-h" className="sy-h3">
        {PRINTER_WORDS.title}
      </h3>
      <p className="sy-pic__lede">{PRINTER_WORDS.printing(byChar.length)}</p>
      <ul className="sy-printer__grid">
        {byChar.map((i) => {
          const family = p.s.result.classFamilies?.[i];
          return (
            <li key={i} className="sy-pslot-row">
              <span className="sy-pslot-row__who">
                {family ? <WhoGlyph family={family} classLabel={nameOf(i)} scale={1} decorative /> : null}
                <span>{nameOf(i)}</span>
              </span>
              <ul className="sy-pslot-row__slots">
                {pic.elements
                  .filter((e) => e.characterIndex === i)
                  .map((e) => (
                    <li
                      key={e.id}
                      className={cx('sy-pslot', e.id === lit && 'is-now', !e.item && 'is-empty')}
                    >
                      {e.id === lit ? <NowTag /> : null}
                      <PixelArt name="v2-systems-printer" ramp="silver" decorative />
                      <span className="sy-pslot__item">
                        {e.changeTo ? (
                          <>
                            {e.item ?? PRINTER_WORDS.empty}
                            <PixelArt name="ui-arrow-right" decorative />
                            {e.changeTo}
                          </>
                        ) : (
                          (e.item ?? PRINTER_WORDS.empty)
                        )}
                      </span>
                      <span className="sy-pslot__note">{e.changeText ?? PRINTER_WORDS.noChange}</span>
                    </li>
                  ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
