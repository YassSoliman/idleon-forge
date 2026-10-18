// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Can't work out advice right now" (M10 FR-39; M21 `flows.cant-work-out` Fallback roster with Report
// prefilled): the engine (or the screen) threw as a whole. Advice is paused; the Roster keeps its shape
// with who is doing what and no Verdicts, plus one Report that sends versions and the error class, never
// the save or a name.
import type { AccountState } from '@idleon-forge/account-state';
import { FLOW_WORDS } from '@idleon-forge/engine/now';
import { Component, type ErrorInfo, type ReactNode, Suspense } from 'react';
import { Loading, lazyPart } from '../lazy-part';
import { buildInfo } from './release';
import { REPO_ISSUES } from './report';

/** The fallback Roster is a lazy part: this state is rare (the walking blob shows while it loads). */
const CharacterList = lazyPart(
  () => import('../components/CharacterList'),
  (m) => m.CharacterList,
);

const errorClass = (message: string) => /^([A-Za-z]*Error)\b/.exec(message)?.[1] ?? 'Error';

export function engineErrorReportUrl(message: string, state: AccountState | null): string {
  const body = [
    '### What happened',
    '',
    'ActiveOn said "Can\'t work out advice right now".',
    '',
    '### Context (no names, no save data)',
    '',
    `- Error class: ${errorClass(message)}`,
    `- ActiveOn: ${buildInfo.app} (${buildInfo.commit.slice(0, 12)}, ${buildInfo.channel})`,
    `- Knowledge Base: ${buildInfo.knowledge}`,
    `- Game build: ${state?.account.gameVersion.serverBuild ?? 'unknown'}`,
    `- Parser: ${buildInfo.parsers.toolboxCommit.slice(0, 12)} (game ${buildInfo.parsers.gameVersion})`,
  ].join('\n');
  const q = new URLSearchParams({
    labels: 'bug',
    title: `Can't work out advice: ${errorClass(message)}`,
    body,
  });
  return `${REPO_ISSUES}?${q.toString()}`;
}

export function CantWorkOut({ message, state }: { message: string; state: AccountState | null }) {
  return (
    <>
      <section
        className="broken n-alert n-alert--warn n-paused"
        role="alert"
        aria-label="Can't work out advice"
      >
        <p>
          <b className="broken-title">{FLOW_WORDS.paused}</b> {FLOW_WORDS.pausedLine}
        </p>
        <a
          className="a-btn a-btn--primary"
          href={engineErrorReportUrl(message, state)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{FLOW_WORDS.report}</span>
        </a>
        <p className="n-small n-muted">{FLOW_WORDS.reportNote}</p>
      </section>
      {state ? (
        <Suspense fallback={<Loading />}>
          <CharacterList state={state} />
        </Suspense>
      ) : null}
    </>
  );
}

interface BoundaryProps {
  state: AccountState | null;
  /** Resets the boundary when a new result arrives. */
  resetKey: unknown;
  children: ReactNode;
}

export class AdviceBoundary extends Component<BoundaryProps, { error: string | null; key: unknown }> {
  override state = { error: null as string | null, key: this.props.resetKey };
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? `${err.name}: ${err.message}` : 'Error' };
  }
  static getDerivedStateFromProps(props: BoundaryProps, s: { error: string | null; key: unknown }) {
    return props.resetKey === s.key ? null : { error: null, key: props.resetKey };
  }
  override componentDidCatch(_err: unknown, _info: ErrorInfo) {}
  override render() {
    return this.state.error ? (
      <CantWorkOut message={this.state.error} state={this.props.state} />
    ) : (
      this.props.children
    );
  }
}
