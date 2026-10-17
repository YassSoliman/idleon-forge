// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Runtime entry, bundled by scripts/build.mjs into dist/index.js. Importing it applies Toolbox's
// prototype polyfills (String/Array helpers the parsers rely on), so load it in a Web Worker.
import '../vendor/polyfills.js';
import { setSectionReporter } from '../shims/safe-section';
import { parseData } from '../vendor/parsers/index';
import { withFrozenClock } from './frozen-clock';
import type {
  parseSave as ParseSaveDecl,
  upstream as UpstreamDecl,
  verifiedBuilds as VerifiedBuildsDecl,
} from './public';
import { finalFailures, truncateMessage } from './section-outcomes';
import type { UpstreamPin, VerifiedBuilds } from './types';

export { InvalidSaveInputError, normalizeEnvelope, parseEnvelopeText } from './envelope';
export { withFrozenClock } from './frozen-clock';

declare const __UPSTREAM__: UpstreamPin;
declare const __VERIFIED_BUILDS__: VerifiedBuilds;
export const upstream: typeof UpstreamDecl = __UPSTREAM__;
export const verifiedBuilds: typeof VerifiedBuildsDecl = __VERIFIED_BUILDS__;

const SECTION_FAILED = /section "([^"]+)" failed/;

export const parseSave: typeof ParseSaveDecl = (envelope, options) => {
  const now = options.now instanceof Date ? options.now.getTime() : options.now;
  if (!Number.isFinite(now)) throw new TypeError('parseSave: options.now must be a valid time');
  const full = options.consoleErrors === 'full';

  // Toolbox reports failures only through console.error: per-section (safeSection) and top-level
  // (parseData's catch-all). The section shim reports every run's outcome; console.error is still
  // captured so the section messages (which dump the error object) never reach the console.
  const outcomes: Array<[string, boolean]> = [];
  let error: string | null = null;
  const realError = console.error;
  console.error = (msg?: unknown, ...rest: unknown[]) => {
    if (typeof msg === 'string' && SECTION_FAILED.test(msg)) return;
    if (msg === 'Error while parsing data') {
      error = truncateMessage(rest[0]);
      return;
    }
    if (full) realError(msg, ...rest);
    else realError(`[parsers] ${truncateMessage(msg)}`);
  };
  setSectionReporter((name, ok) => outcomes.push([name, ok]));

  let parsed: { account: unknown; characters: unknown };
  try {
    parsed = withFrozenClock(now, () =>
      parseData(
        // biome-ignore lint/suspicious/noExplicitAny: Toolbox's own input types are generated, not ours.
        envelope.data as any,
        // Leave undefined when absent: Toolbox then reads the character slots off the save itself.
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        envelope.charNames as any,
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        (envelope.companion ?? null) as any,
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        (envelope.guildData ?? null) as any,
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        (envelope.serverVars ?? {}) as any,
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        envelope.accountCreateTime as any,
        // biome-ignore lint/suspicious/noExplicitAny: see above.
        (envelope.tournament ?? null) as any,
      ),
    );
  } finally {
    console.error = realError;
    setSectionReporter(null);
  }

  const csver = Number(envelope.data.CSver);
  return {
    account: (parsed.account ?? {}) as Record<string, unknown>,
    characters: (Array.isArray(parsed.characters) ? parsed.characters : []) as Record<string, unknown>[],
    failedSections: finalFailures(outcomes),
    error,
    meta: {
      now,
      saveVersion: Number.isFinite(csver) ? csver : null,
      capturedAt: envelope.lastUpdated ?? null,
      parserGameVersion: upstream.gameVersion,
      parserCommit: upstream.commit,
    },
  };
};
