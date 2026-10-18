// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` copy rules (Design Lab copy pass): the step word cap, hand-written durations and the
// allowlist that may only shrink.
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { type CopyAllowlist, copyIssues, STEP_WORD_CAP, stepWords } from '../src/copy';
import { formatIssue } from '../src/issues';
import { loadSource } from '../src/load';
import { entry, file, kbTree, testRegistries } from './kb-tree';

const check = (text: string, values = '') =>
  entry({
    id: 'afk.check.no-target',
    system: 'afk',
    type: 'check',
    subject: 'character',
    effect: 'blocker',
    detector: '{ id: afk/no-target }',
    text,
    ...(values ? { values } : {}),
  });
const sourceOf = (e: string) => loadSource(kbTree({ 'systems/afk.yaml': file('afk', e) }));
const none: CopyAllowlist = { 'step-words': {}, 'hand-written-duration': {} };
const run = (e: string, allow = none) => copyIssues(sourceOf(e).authored, allow, 'copy-allowlist.yaml');

describe('step-words', () => {
  it('counts a slot as one word and punctuation as none', () => {
    expect(stepWords('Collect {product:name} from the anvil')).toBe(5);
    expect(stepWords('Whetstone respec → about {times:int}× {product:name}')).toBe(5);
    expect(STEP_WORD_CAP).toBe(12);
  });

  it('flags a step over 12 words, with the file, line and the way out', () => {
    const issues = run(
      check(
        '"Collect your {salt:name} from the Refinery storage into the chest, then check the {building:name} in the Build menu"',
      ),
    );
    expect(issues.map((i) => i.code)).toEqual(['step-words']);
    expect(formatIssue(issues[0] as never)).toMatch(
      /systems\/afk\.yaml:\d+ afk\.check\.no-target: text is 18 words; a step is at most 12/,
    );
  });

  it('caps text- variants but not why, why- variants or details', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve thirteen';
    const issues = run(
      check('"Send it {suggestion:name}"', `{ text-far: "${long}", why-far: "${long}", detail: "${long}" }`),
    );
    expect(issues.map((i) => `${i.code} ${i.message.split(' ')[0]}`)).toEqual(['step-words values.text-far']);
  });

  it('an allowlisted template passes, and a stale allowlist line fails', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve thirteen';
    const allow = { ...none, 'step-words': { 'afk.check.no-target#text': 'a quest name' } };
    expect(run(check(`"${long}"`), allow)).toEqual([]);
    const stale = run(check('"Send it {suggestion:name}"'), allow);
    expect(stale.map((i) => i.code)).toEqual(['copy-allowlist-stale']);
  });
});

describe('hand-written-duration', () => {
  it.each([
    ['"Refinery runs dry in about {dryIn:duration}"', 'already says "about"'],
    ['"Whetstone respec at {hours:int} h"', 'hand-written unit'],
    ['"Play one round (about 2 min)"', 'hand-written "about N h"'],
    ['"Wait 3h for the bar"', 'hand-written duration'],
    ['"Refinery runs dry in {dryIn:duration}"', 'uses {x:in}'],
    ['"Ready {readyAt:duration}"', 'uses {x:in}'],
    ['"{eta:duration} at your recent pace"', 'uses {x:in}'],
  ])('flags %s', (text, message) => {
    const issues = run(check(text));
    expect(issues.map((i) => i.code)).toEqual(['hand-written-duration']);
    expect(issues[0]?.message).toContain(message);
  });

  it('passes the shared formats and spelled-out game facts', () => {
    for (const text of [
      '"Refinery runs dry {dryIn:in}"',
      '"Its food lasts {lasts:duration}"',
      '"Whetstone respec at {hours:hours}"',
      '"Keys bank for 3 days at most"',
      '"Use a {hours:int}-hour Time Candy"',
    ])
      expect(run(check(text))).toEqual([]);
  });
});

describe('the real Knowledge Base', () => {
  it('has no copy errors once the allowlist is applied', async () => {
    const issues = await checkSource(loadSource(), testRegistries());
    const copy = issues.filter((i) =>
      ['step-words', 'hand-written-duration', 'copy-allowlist-stale'].includes(i.code ?? ''),
    );
    expect(copy.map(formatIssue)).toEqual([]);
  });
});
