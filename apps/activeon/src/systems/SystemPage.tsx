// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: a System's page. Every page renders through the template (frame/SystemFrame.tsx): a System with
// its own M24 page (`FULL_PAGES` in pages.ts, keyed by System id) renders that page; every other System
// renders the thin page (frame/SimplePage.tsx), with its older picture body (`SYSTEM_PAGES`, keyed by
// the `page` id of the engine's SYSTEM_HOMES) above the steps until that body moves onto the template.
// The view is built from the same `EngineResult` as Now (`buildSystemPageFrameView`).
import { PAGE_WORDS, SYSTEM_HOMES } from '@idleon-forge/engine/now';
import { buildSystemPageFrameView } from '@idleon-forge/engine/systems-ui';
import { Suspense, useEffect, useMemo } from 'react';
import { Loading } from '../lazy-part';
import { toNowPrefs } from '../now/prefs-store';
import type { Session } from '../shell/session';
import { SimplePage } from './frame/SimplePage';
import { FULL_PAGES, LOCKED_BODIES, SYSTEM_PAGES } from './pages';

export function SystemPage({ s, id }: { s: Session; id: string }) {
  const page = useMemo(
    () =>
      buildSystemPageFrameView(s.result, toNowPrefs(s.prefs.data, null), s.view, {
        now: s.now,
        lastCloudSave: s.lastCloudSave,
        id,
        highlight: s.highlight,
      }),
    [s, id],
  );
  // FR-31: arriving from "See it", the Next Action is outlined and scrolled into view.
  useEffect(() => {
    if (!page?.highlight) return;
    const el = document.querySelector(`[data-na-key="${CSS.escape(page.highlight)}"]`);
    el?.scrollIntoView?.({ block: 'center' });
  }, [page?.highlight]);
  if (!page) return null;
  const Full = page.locked ? undefined : FULL_PAGES[page.tile.id];
  if (Full)
    return (
      <Suspense fallback={<Loading text={PAGE_WORDS.loadingPicture} />}>
        <Full s={s} page={page} />
      </Suspense>
    );
  const pageId = SYSTEM_HOMES[page.tile.id]?.page;
  // A locked System shows no picture, except what the save already counts toward opening it.
  const Body = page.locked ? LOCKED_BODIES[page.tile.id] : pageId ? SYSTEM_PAGES[pageId] : undefined;
  return (
    <SimplePage
      s={s}
      page={page}
      body={
        Body ? (
          <Suspense fallback={<Loading text={PAGE_WORDS.loadingPicture} />}>
            <Body s={s} page={page} />
          </Suspense>
        ) : undefined
      }
    />
  );
}
