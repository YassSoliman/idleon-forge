// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Can't work out advice right now" (M10 FR-39): the engine (or the screen) threw as a whole. The
// Roster shows names and activities only, no Verdicts, plus a Report this that sends versions and the
// error class, never the save.
import type { AccountState } from '@idleon-forge/account-state';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CharacterList } from '../components/CharacterList';
import { buildInfo } from './release';
import { REPO_ISSUES } from './report';

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
      <section className="broken" role="alert" aria-label="Can't work out advice">
        <b className="broken-title">Can't work out advice right now</b>
        <p>Your save was read, but working out the advice failed. This needs a fix on our side.</p>
        <a
          className="small-btn"
          href={engineErrorReportUrl(message, state)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Report this
        </a>
        <p className="small">This will be posted publicly on GitHub.</p>
      </section>
      {state ? <CharacterList state={state} /> : null}
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
