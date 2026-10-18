// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Bundles src/index.ts + vendor/ + shims/ into dist/index.js (browser/worker ESM, no Node built-ins),
// resolving Toolbox's Next.js path aliases, redirecting its UI-coupled modules to shims/ and trimming
// the game data the parsers barely read (the options live in bundle.mjs).
import { build } from 'esbuild';
import { bundleOptions } from './bundle.mjs';

const { upstream, options } = bundleOptions();
const result = await build(options);

const inputs = Object.keys(result.metafile.inputs);
const count = (re) => inputs.filter((i) => re.test(i)).length;
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(
  `dist/index.js ${(bytes / 1e6).toFixed(1)} MB from ${inputs.length} inputs: parsers=${count(/vendor\/parsers/)} ` +
    `utility=${count(/vendor\/utility/)} website-data=${count(/website-data/)} shims=${count(/shims\//)} ` +
    `node_modules=${count(/node_modules/)} (Toolbox ${upstream.toolboxVersion}, game ${upstream.gameVersion})`,
);
