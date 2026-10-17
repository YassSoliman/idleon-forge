// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Smoke test of the git layer against this repository (thin by design, TR-3).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isGitRepo, isShallow, mainRef, parseLog, readHistory } from '../src/git.ts';
import { generate } from '../src/node.ts';

const root = join(import.meta.dirname, '../../..');

describe('git layer', () => {
  it('parses the log format', () => {
    const out =
      "\x1eabc\x1f2026-10-21T00:00:00Z\x1ffeat: x (#1)\x1fbody line\n\nWhat's-new: y\x1f\n\na/b.ts\nc.ts\n\x1edef\x1f2026-10-20T00:00:00Z\x1finit\x1f\x1f\n";
    expect(parseLog(out)).toEqual([
      {
        sha: 'abc',
        date: '2026-10-21T00:00:00Z',
        subject: 'feat: x (#1)',
        body: "body line\n\nWhat's-new: y",
        files: ['a/b.ts', 'c.ts'],
      },
      { sha: 'def', date: '2026-10-20T00:00:00Z', subject: 'init', body: '', files: [] },
    ]);
  });

  it.runIf(isGitRepo(root) && !isShallow(root))(
    'reads first-parent history with files and generates BuildInfo',
    () => {
      const history = readHistory(root, mainRef(root), 'packages/toolbox-parsers/UPSTREAM');
      expect(history.length).toBeGreaterThan(0);
      expect(history.some((c) => c.files.length > 0)).toBe(true);
      const { buildInfo, feed } = generate({
        appDir: join(root, 'apps/activeon'),
        channel: 'local',
        write: false,
        log: () => {},
      });
      expect(buildInfo.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(buildInfo.parsers.gameVersion).toMatch(/^\d/);
      expect(feed.schema).toBe(1);
    },
  );
});
