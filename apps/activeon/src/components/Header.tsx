// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The top bar (M21.1 refresh, nav option A; M21 `now.header`, G1, G2): the wordmark on the left, the five
// places, then the status on the right (the
// Preview badge on a PR Preview, the World crest, the save-age chip, a "New version ready" chip), the
// light/dark toggle and the 44 px overflow menu (G1). Family level, Settings, Suggest, versions and Sign
// out live in that menu; a new update or a failed check puts one dot on its button (`flows.banners`).
// Only the age chip ticks every second (M10 TR-5), and it is never a live region (TR-14).
import type { AccountState } from '@idleon-forge/account-state';
import { HEADER_WORDS as W } from '@idleon-forge/engine/now';
import { type ReactNode, useEffect, useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Chip } from '../design/atoms/Chip';
import { GLYPH } from '../design/atoms/glyphs';
import { Pill } from '../design/atoms/Pill';
import { ThemeToggle } from '../design/atoms/ThemeToggle';
import { ago, clockAt, localOffsetMinutes } from '../design/format';
import { freshnessHint } from '../format';
import { LazySheet as Sheet } from '../now/chrome/LazySheet';
import { THEME_EVENT } from '../now/settings/settings-store';
import type { SaveSource, SyncState } from '../use-activeon';
import { useNow } from '../use-now';

export interface HeaderSave {
  state: AccountState;
  source: SaveSource;
  /** `last-good` while the newest save can't be read: the age is of the last good one (FR-15). */
  tag: 'current' | 'last-good';
}

export interface HeaderProps {
  save: HeaderSave | null;
  sync: SyncState;
  online: boolean;
  lastSnapshotAt: number | null;
  /** "updating…" in the chip row while a later save is parsed (§6). */
  busy?: boolean;
  /** EngineResult.stage (M2 D5): the World crest; what the next Stage needs opens in a sheet. */
  stage?: { id: string; label: string; needs?: string[] } | null;
  /** G2: "Preview of PR #123, not the live app", on PR Previews only. */
  preview?: string | null;
  /** A newer build is live (M12 FR-24): the quiet "New version ready · Reload" chip. */
  update?: { text: string; onReload(): void } | null;
  /** G1: the overflow menu's rows (HeaderMenu), rendered inside its sheet. */
  menu?: ReactNode;
  /** One dot on the overflow button: something new to see in it (a failed check, a dismissed toast). */
  dot?: boolean;
  /** Closes the overflow sheet from inside (a row that opens something else). */
  menuOpen?: boolean;
  onMenu?(open: boolean): void;
  /**
   * M21.1 refresh (nav option A): the place navigation's slot, in the bar between the wordmark and the
   * status. The shell portals the five places into it; under 720 px they draw as the bottom dock.
   */
  navRef?: (el: HTMLDivElement | null) => void;
}

/** M2 D5: "World 2, late" shows as "World 2 · late". */
export const stageText = (label: string) => label.replace(', ', ' · ');
const worldOf = (label: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 | undefined => {
  const n = Number(/World (\d)/.exec(label)?.[1]);
  return n >= 1 && n <= 7 ? (n as 1 | 2 | 3 | 4 | 5 | 6 | 7) : undefined;
};

/** `now.stage-badge` World crest: "World 3 · early"; a tap opens the next Stage's steps (44 px rows). */
function Crest({ stage }: { stage: NonNullable<HeaderProps['stage']> }) {
  const [open, setOpen] = useState(false);
  if (stage.id === 'not-covered' || stage.id === 'unknown') return null;
  const needs = stage.needs ?? [];
  const text = stageText(stage.label);
  return (
    <>
      <button
        type="button"
        className="n-crest"
        aria-label={W.stageButton(text, needs.length)}
        title={needs.length ? `Next Stage: ${needs.join(' · ')}` : 'Stage on the route'}
        onClick={() => setOpen(true)}
        disabled={needs.length === 0}
      >
        <PixelArt name="now-crest" w={worldOf(stage.label)} decorative />
        <span>{text}</span>
        {needs.length ? <span className="n-crest__count num">{W.stageToGo(needs.length)}</span> : null}
      </button>
      <Sheet open={open} title={W.stageTitle(stage.label)} onClose={() => setOpen(false)}>
        <p className="n-sheet-lead">{W.stageCount(needs.length)}</p>
        <ul className="n-needs">
          {needs.map((n) => (
            <li key={n}>
              <span className="n-box" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
        <p className="n-muted n-small">{W.stageHint}</p>
      </Sheet>
    </>
  );
}

/** The save-age chip: "save read 3m ago", "pasted · 5m ago", "last good save · 3h 02m ago". */
function SaveAge({ save, sync, online }: Pick<HeaderProps, 'save' | 'sync' | 'online'>) {
  const now = useNow();
  const saved = save?.state.account.lastCloudSave ?? null;
  const connection = !online
    ? W.offline(saved !== null ? clockAt(saved, localOffsetMinutes(saved)) : '…')
    : sync.status === 'reconnecting'
      ? W.reconnecting
      : null;
  if (connection) return <span className="n-agechip is-warn">{connection}</span>;
  if (save === null || saved === null) return <span className="n-agechip">{W.noSave}</span>;
  const age = ago(saved, now);
  const text =
    save.tag === 'last-good' ? W.lastGood(age) : save.source === 'paste' ? W.pasted(age) : W.read(age);
  return (
    <span className={save.tag === 'last-good' ? 'n-agechip is-warn' : 'n-agechip'}>
      <PixelArt name={GLYPH.howLong} decorative />
      <span className="num">{text}</span>
    </span>
  );
}

/** The refresh hint (M1 FR-26, FR-27), under the chip row; its status role announces it once. */
function FreshnessHint({ save, lastSnapshotAt }: Pick<HeaderProps, 'save' | 'lastSnapshotAt'>) {
  const now = useNow();
  const hint =
    save?.tag === 'current'
      ? freshnessHint({
          now,
          source: save.source,
          lastCloudSave: save.state.account.lastCloudSave,
          lastSnapshotAt,
        })
      : null;
  return (
    <p className="n-hint" role="status">
      {hint}
    </p>
  );
}

/** The header's toggle keeps its own state; Settings (G10) can change the theme, so it remounts then. */
function useThemeVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((x) => x + 1);
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);
  return v;
}

export function Header(props: HeaderProps) {
  const { save, sync, online, lastSnapshotAt, busy, stage, preview, update, menu, dot, navRef } = props;
  const [ownOpen, setOwnOpen] = useState(false);
  const menuOpen = props.menuOpen ?? ownOpen;
  const setMenu = props.onMenu ?? setOwnOpen;
  const themeVersion = useThemeVersion();
  return (
    <header className="n-hdr">
      <div className="n-hdr__line">
        <h1 className="n-wm">
          Active<span className="n-wm__on">On</span>
        </h1>
        {navRef ? <div ref={navRef} className="nav-slot" /> : null}
        <div className="n-hdr__chips">
          {preview ? <Pill urgency="fine" glyph="cards-src-gear" verb={preview} /> : null}
          {stage ? <Crest stage={stage} /> : null}
          <SaveAge save={save} sync={sync} online={online} />
          {busy ? <span className="n-agechip">{W.updating}</span> : null}
          {update ? (
            <Chip glyph={GLYPH.arrowRight} onClick={update.onReload}>
              {update.text}
            </Chip>
          ) : null}
        </div>
        <div className="n-hdr__end">
          <ThemeToggle key={themeVersion} />
          {menu ? (
            <button
              type="button"
              className="a-icon-btn n-more"
              aria-label={dot ? `${W.menu}, ${W.menuDot}` : W.menu}
              title={W.menu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenu(true)}
            >
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              {dot ? <span className="n-dot" aria-hidden="true" /> : null}
            </button>
          ) : null}
        </div>
      </div>
      <FreshnessHint save={save} lastSnapshotAt={lastSnapshotAt} />
      {menu ? (
        <Sheet open={menuOpen} title={W.menuTitle} onClose={() => setMenu(false)}>
          {menu}
        </Sheet>
      ) : null}
    </header>
  );
}
