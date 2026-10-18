// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The chrome every place shows (M17 FR-6), area N's slot (M21 §9 "Chrome slot"): the shell renders
// `<NowChrome s />` and never edits these pieces itself.
// - Notices as toasts, once (`flows.banners` Toast once): the game patch the parser hasn't caught up
//   with, and a Stage that can't be told. After "Later" a dot on the header's menu keeps them findable.
//   The update notice is the header's "New version ready" chip, offline is its age chip, and All set is
//   the counter, so none of those is a toast.
// - What's new, docked above the bottom bar (the patch notes scroll, D-16).
// - The polite live region (TR-14).
import { FLOW_WORDS } from '@idleon-forge/engine/now';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Toast } from '../../design/atoms/States';
import { lazyPart } from '../../lazy-part';
import type { Session } from '../../shell/session';
import { useWhatsNew } from '../release';
import { markNoticeSeen, seenNotices, setNoticeDot } from './notices';

/** The docked patch notes load only when there is something new (M21 TR-12). */
const WhatsNewDock = lazyPart(
  () => import('./WhatsNew'),
  (m) => m.WhatsNewDock,
);

const TOAST_KINDS = new Set(['patch', 'stage-unknown']);

export function NowChrome({ s }: { s: Session }) {
  const whatsNew = useWhatsNew();
  const notices = useMemo(
    () =>
      s.view.banners.filter((b) => TOAST_KINDS.has(b.kind)).map((b) => ({ id: `${b.kind}:${b.text}`, ...b })),
    [s.view.banners],
  );
  const [seen, setSeen] = useState<Set<string>>(seenNotices);
  const unseen = notices.find((n) => !seen.has(n.id)) ?? null;
  const dismissedButHolding = notices.some((n) => seen.has(n.id));
  useEffect(() => {
    setNoticeDot(dismissedButHolding);
    return () => setNoticeDot(false);
  }, [dismissedButHolding]);
  const later = (id: string) => {
    markNoticeSeen(id);
    setSeen(seenNotices());
  };
  return (
    <>
      {unseen ? (
        <div className="n-toasts">
          <Toast actions={[{ label: FLOW_WORDS.later, onClick: () => later(unseen.id) }]}>
            <p>{unseen.text}</p>
          </Toast>
        </div>
      ) : null}
      {whatsNew.view ? (
        <Suspense fallback={null}>
          <WhatsNewDock view={whatsNew.view} onDismiss={whatsNew.dismiss} />
        </Suspense>
      ) : null}
    </>
  );
}

/** The polite live region (TR-14): it sits after the place's content, as before the slot existed. */
export function NowLiveRegion({ s }: { s: Session }) {
  return (
    <p className="sr-only" aria-live="polite">
      {s.spoken}
    </p>
  );
}
