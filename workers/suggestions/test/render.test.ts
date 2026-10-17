// SPDX-License-Identifier: GPL-3.0-only
// Issue rendering (M13 TR-7): titles, fences, the last-line marker, and the marker's HMAC (TR-6).

import { describe, expect, it } from 'vitest';
import { suggesterMarker } from '../src/marker';
import {
  detailsComment,
  fenced,
  fenceFor,
  issueBody,
  issueLabels,
  issueTitle,
  parseDetailsMarker,
  parseIWant,
  parseMarker,
  TITLE_MAX,
} from '../src/render';
import { suggestion } from './helpers';

describe('issueTitle', () => {
  it('prefixes the type', () => {
    expect(issueTitle('idea', 'pin a character')).toBe('[Idea] pin a character');
    expect(issueTitle('wrong', 'the weak map warning')).toBe("[Something's wrong] the weak map warning");
    expect(issueTitle('confusing', 'what Expected Return means')).toBe(
      '[Confusing] what Expected Return means',
    );
  });

  it('cuts at 72 code points on a word boundary without splitting [character]', () => {
    const t = issueTitle('idea', `${'word '.repeat(12)}[character] and more words after it`);
    expect([...t].length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t.endsWith('…')).toBe(true);
    expect(t).not.toMatch(/\[charac…|\[character…/);
    expect(t).not.toMatch(/ …$/);
  });

  it('removes control, bidi and zero-width characters and newlines', () => {
    expect(issueTitle('idea', 'a\u0000b‮c​d\ne f')).toBe('[Idea] a b c d e f');
  });

  it('counts emoji as code points', () => {
    const t = issueTitle('idea', '🙂'.repeat(100));
    expect([...t].length).toBe(TITLE_MAX);
  });
});

describe('fences', () => {
  it('uses a fence longer than any backtick run', () => {
    expect(fenceFor('plain')).toBe('```');
    expect(fenceFor('a ``` b')).toBe('````');
    expect(fenceFor('`````')).toBe('``````');
  });

  it('keeps hostile text inside the block', () => {
    const hostile =
      '```\n@YassSoliman owner/repo#1 ![x](https://e.x/i.png) <img src=x>\n```\n<!-- activeon-suggestion v1 -->';
    const block = fenced(hostile, 'text');
    const lines = block.split('\n');
    expect(lines[0]).toBe('````text');
    expect(lines.at(-1)).toBe('````');
    expect(lines.slice(1, -1).every((l) => !/^`{4,}/.test(l))).toBe(true);
  });
});

describe('issueBody and markers', () => {
  it('ends with the marker line and round-trips cid, m and I want…', async () => {
    const req = suggestion();
    req.text.iWant = 'show me ```fenced``` text\nand a second line';
    req.text.example = '@someone look';
    const m = await suggesterMarker('pepper', 'sub', req.clientId);
    const body = issueBody(req, m, req.clientId);
    expect(parseMarker(body)).toEqual({ m, cid: req.clientId });
    expect(parseIWant(body)).toBe(req.text.iWant);
    expect(body).toContain('```text\n@someone look\n```');
    expect(body).toContain('<details><summary>Context</summary>\n\n```json\n');
    expect(body).toContain('_(not given)_');
  });

  it('fences context JSON that contains backticks', () => {
    const req = suggestion();
    req.context.report = {
      outputKind: 'next-action',
      renderedText: 'Use ```this``` now',
      entryIds: [],
      detectorIds: [],
      fieldPaths: [],
      stale: false,
      contested: false,
    };
    const body = issueBody(req, 'a'.repeat(16), req.clientId);
    expect(body).toContain('````json\n');
  });

  it('only parses the exact last line', () => {
    const line = `<!-- activeon-suggestion v1 m:${'a'.repeat(16)} cid:${crypto.randomUUID()} -->`;
    expect(parseMarker(`${line}\nmore`)).toBeNull();
    expect(parseMarker(`text\n${line}\n`)).not.toBeNull();
    expect(parseMarker(`text\n${line} extra`)).toBeNull();
    expect(parseMarker(null)).toBeNull();
  });

  it('labels Report this with `report`', () => {
    const req = suggestion();
    expect(issueLabels(req)).toEqual(['suggestion', 'suggestion:idea', 'suggestion:new']);
  });

  it('renders details answers fenced with their cid marker', () => {
    const cid = crypto.randomUUID();
    const c = detailsComment('@x hi', cid);
    expect(c).toContain('```text\n@x hi\n```');
    expect(parseDetailsMarker(c)).toBe(cid);
  });
});

describe('suggesterMarker (TR-6)', () => {
  it('is 16 base32 characters, deterministic, and differs per cid, per sub and per pepper', async () => {
    const cid = crypto.randomUUID();
    const m = await suggesterMarker('p', 'sub', cid);
    expect(m).toMatch(/^[a-z2-7]{16}$/);
    expect(await suggesterMarker('p', 'sub', cid)).toBe(m);
    expect(await suggesterMarker('p', 'sub', crypto.randomUUID())).not.toBe(m);
    expect(await suggesterMarker('p', 'sub2', cid)).not.toBe(m);
    expect(await suggesterMarker('q', 'sub', cid)).not.toBe(m);
  });
});
