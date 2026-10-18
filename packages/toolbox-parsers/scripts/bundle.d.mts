// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Types for bundle.mjs, for the tests that import it.
import type { BuildOptions } from 'esbuild';

export const root: string;
export const DATA_TRIMS: Record<
  string,
  { importers: string[]; reads: string; trim: (data: Record<string, unknown[]>) => unknown }
>;
export function readUpstream(): { upstream: Record<string, string>; verifiedBuilds: Record<string, number> };
export function bundleOptions(opts?: { outfile?: string; trimData?: boolean }): {
  upstream: Record<string, string>;
  options: BuildOptions & { metafile: true };
};
