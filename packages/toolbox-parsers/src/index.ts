// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Runtime entry, bundled by scripts/build.mjs into dist/index.js. Importing it applies Toolbox's
// prototype polyfills (String/Array helpers the parsers rely on), so load it in a Web Worker.
import '../vendor/polyfills.js';
import { parseData } from '../vendor/parsers/index';
import { withFrozenClock } from './frozen-clock';
import type { parseSave as ParseSaveDecl, upstream as UpstreamDecl } from './public';
import type { UpstreamPin } from './types';

export { InvalidSaveInputError, normalizeEnvelope, parseEnvelopeText } from './envelope';
export { withFrozenClock } from './frozen-clock';

declare const __UPSTREAM__: UpstreamPin;
export const upstream: typeof UpstreamDecl = __UPSTREAM__;

const SECTION_FAILED = /section "([^"]+)" failed/;

export const parseSave: typeof ParseSaveDecl = (envelope, options) => {
  const now = options.now instanceof Date ? options.now.getTime() : options.now;
  if (!Number.isFinite(now)) throw new TypeError('parseSave: options.now must be a valid time');

  // Toolbox reports failures only through console.error: per-section (safeSection) and top-level
  // (parseData's catch-all). Capture both while the parse runs, and pass anything else through.
  const failedSections: string[] = [];
  let error: string | null = null;
  const realError = console.error;
  console.error = (msg?: unknown, ...rest: unknown[]) => {
    const section = typeof msg === 'string' ? SECTION_FAILED.exec(msg) : null;
    if (section?.[1]) failedSections.push(section[1]);
    else if (msg === 'Error while parsing data')
      error = rest[0] instanceof Error ? rest[0].message : String(rest[0]);
    else realError(msg, ...rest);
  };

  let parsed: { account: unknown; characters: unknown };
  try {
    parsed = withFrozenClock(now, () =>
      parseData(
        // biome-ignore lint/suspicious/noExplicitAny: Toolbox's own input types are generated, not ours.
        envelope.data as any,
        envelope.charNames ?? [],
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
  }

  const csver = Number(envelope.data.CSver);
  return {
    account: (parsed.account ?? {}) as Record<string, unknown>,
    characters: (Array.isArray(parsed.characters) ? parsed.characters : []) as Record<string, unknown>[],
    failedSections,
    error,
    meta: {
      now,
      saveVersion: Number.isFinite(csver) ? csver : null,
      capturedAt: envelope.lastUpdated ?? null,
      parserGameVersion: upstream.gameVersion,
    },
  };
};
