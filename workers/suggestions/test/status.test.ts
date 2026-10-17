// SPDX-License-Identifier: GPL-3.0-only
// Status mapping and trusted comments (M13 TR-8): first match wins, each adjacent pair tested.

import { describe, expect, it } from 'vitest';
import {
  type IssueComment,
  type IssueState,
  isMaintainerComment,
  parseMaintainerIds,
  questionOf,
  replyOf,
  statusOf,
} from '../src/status';

const open = (...labels: string[]): IssueState => ({
  state: 'open',
  stateReason: null,
  labels: ['suggestion', ...labels],
});
const closed = (reason: string | null, ...labels: string[]): IssueState => ({
  state: 'closed',
  stateReason: reason,
  labels: ['suggestion', ...labels],
});

describe('statusOf', () => {
  it('maps each rule alone', () => {
    expect(statusOf(closed('completed'))).toBe('done');
    expect(statusOf(closed('not_planned'))).toBe('wontdo');
    expect(statusOf(open('outcome:wontfix'))).toBe('wontdo');
    expect(statusOf(open('outcome:duplicate'))).toBe('wontdo');
    expect(statusOf(open('suggestion:needs-info'))).toBe('info');
    expect(statusOf(open('needs-decision'))).toBe('decision');
    expect(statusOf(open('outcome:spec'))).toBe('planned');
    expect(statusOf(open('outcome:kb'))).toBe('planned');
    expect(statusOf(open('outcome:ticket'))).toBe('planned');
    expect(statusOf(open('listener:claimed'))).toBe('looking');
    expect(statusOf(open('story:drafted'))).toBe('looking');
    expect(statusOf(open('suggestion:new'))).toBe('received');
  });

  it('resolves each adjacent pair by the first rule', () => {
    expect(statusOf(closed('completed', 'outcome:wontfix'))).toBe('done');
    expect(statusOf(open('outcome:wontfix', 'suggestion:needs-info'))).toBe('wontdo');
    expect(statusOf(open('suggestion:needs-info', 'needs-decision'))).toBe('info');
    expect(statusOf(open('needs-decision', 'outcome:spec'))).toBe('decision');
    expect(statusOf(open('outcome:kb', 'listener:claimed'))).toBe('planned');
    expect(statusOf(open('story:drafted', 'suggestion:new'))).toBe('looking');
  });
});

const comment = (over: Partial<IssueComment>): IssueComment => ({
  id: 1,
  body: 'hello <!-- activeon:reply -->',
  createdAt: '2026-10-17T10:00:00Z',
  authorId: 1111,
  authorLogin: 'YassSoliman',
  authorIsBot: false,
  lastEditedAt: null,
  editorId: null,
  ...over,
});

describe('maintainer comments', () => {
  const ids = parseMaintainerIds('1111, 3333');

  it('parses the id list', () => {
    expect([...ids]).toEqual([1111, 3333]);
    expect([...parseMaintainerIds(undefined)]).toEqual([]);
    expect([...parseMaintainerIds('abc,12')]).toEqual([12]);
  });

  it('trusts an allow-listed, unedited (or self-edited) comment only', () => {
    expect(isMaintainerComment(comment({}), ids)).toBe(true);
    expect(isMaintainerComment(comment({ lastEditedAt: '2026-10-17T11:00:00Z', editorId: 1111 }), ids)).toBe(
      true,
    );
    expect(isMaintainerComment(comment({ lastEditedAt: '2026-10-17T11:00:00Z', editorId: 9000 }), ids)).toBe(
      false,
    );
    expect(isMaintainerComment(comment({ authorId: 2222 }), ids)).toBe(false);
    expect(isMaintainerComment(comment({ authorIsBot: true }), ids)).toBe(false);
    expect(isMaintainerComment(comment({ authorId: null }), ids)).toBe(false);
  });

  it('takes the newest marked maintainer comment and strips the marker', () => {
    const list = [
      comment({ id: 1, body: 'old <!-- activeon:reply -->', createdAt: '2026-10-17T09:00:00Z' }),
      comment({ id: 2, body: 'new <!-- activeon:reply -->', createdAt: '2026-10-17T10:00:00Z' }),
      comment({
        id: 3,
        body: 'fake <!-- activeon:reply -->',
        createdAt: '2026-10-17T11:00:00Z',
        authorId: 2222,
      }),
      comment({ id: 4, body: 'Which world? <!-- activeon:question -->', createdAt: '2026-10-17T08:00:00Z' }),
    ];
    expect(replyOf(list, ids)).toBe('new');
    expect(questionOf(list, ids)?.id).toBe(4);
    expect(replyOf([], ids)).toBeNull();
  });
});
