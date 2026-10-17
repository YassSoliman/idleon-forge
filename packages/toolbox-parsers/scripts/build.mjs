// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Bundles src/index.ts + vendor/ + shims/ into dist/index.js (browser/worker ESM, no Node built-ins),
// resolving Toolbox's Next.js path aliases and redirecting its UI-coupled modules to shims/.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v = (p) => path.join(root, 'vendor', p);
const s = (p) => path.join(root, 'shims', p);

const upstream = Object.fromEntries(
  readFileSync(path.join(root, 'UPSTREAM'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split(/=(.*)/s).slice(0, 2)),
);
for (const key of ['repo', 'commit', 'commitDate', 'toolboxVersion', 'gameVersion']) {
  if (!upstream[key]) throw new Error(`UPSTREAM is missing "${key}"; run pnpm sync-parsers`);
}

// VERIFIED_BUILDS is written by scripts/verified-builds.mjs during the parser sync.
const verifiedBuilds = JSON.parse(readFileSync(path.join(root, 'VERIFIED_BUILDS'), 'utf8'));
for (const key of ['serverBuild', 'saveVersion']) {
  if (!Number.isFinite(verifiedBuilds[key])) throw new Error(`VERIFIED_BUILDS is missing "${key}"`);
}

// Exact specifiers first (UI-coupled modules -> shims), then Toolbox's prefix aliases -> vendor/.
const exact = {
  '@mantine/hooks': s('mantine-hooks.ts'),
  '@components/constants': s('components-constants.ts'),
  '@utility/analytics': s('analytics.ts'),
  '@utility/clipboard': s('clipboard.ts'),
  // Same behaviour as upstream's, plus a per-run outcome report (final-pass failures, TR-3).
  '@parsers/safeSection': s('safe-section.ts'),
  '@website-data': v('data/website-data/index.js'),
};
const prefixes = [
  ['@parsers/', v('parsers/')],
  ['@utility/', v('utility/')],
];

const aliasPlugin = {
  name: 'toolbox-aliases',
  setup(b) {
    // helpers.copyForSupport lazily imports an app service; never reached by parseData().
    b.onResolve({ filter: /^\.\.\/services\/leaderboardInfo$/ }, () => ({ path: s('leaderboardInfo.ts') }));
    b.onResolve({ filter: /^@(mantine|components|utility|parsers|website-data)/ }, async (args) => {
      let target = exact[args.path];
      if (!target) {
        const hit = prefixes.find(([p]) => args.path.startsWith(p));
        if (!hit)
          return { errors: [{ text: `unmapped alias ${args.path} (from ${args.importer}); add a shim` }] };
        target = hit[1] + args.path.slice(hit[0].length);
      }
      const r = await b.resolve(`./${path.basename(target)}`, {
        resolveDir: path.dirname(target),
        kind: args.kind,
      });
      return r.errors.length ? { errors: r.errors } : { path: r.path };
    });
  },
};

const banner = `/*! IdleOn Forge toolbox-parsers. GPL-3.0-only.
 * Bundles IdleOn Toolbox's parsers and game data (https://github.com/Morta1/IdleonToolbox) @ ${upstream.commit},
 * Copyright (C) Morta1 and IdleOn Toolbox contributors, redistributed unmodified under GPL-3.0-only.
 * Source: https://github.com/YassSoliman/idleon-forge/tree/main/packages/toolbox-parsers */`;

const result = await build({
  entryPoints: [path.join(root, 'src/index.ts')],
  outfile: path.join(root, 'dist/index.js'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  minify: true,
  legalComments: 'inline',
  banner: { js: banner },
  define: { __UPSTREAM__: JSON.stringify(upstream), __VERIFIED_BUILDS__: JSON.stringify(verifiedBuilds) },
  metafile: true,
  logLevel: 'warning',
  plugins: [aliasPlugin],
});

const inputs = Object.keys(result.metafile.inputs);
const count = (re) => inputs.filter((i) => re.test(i)).length;
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(
  `dist/index.js ${(bytes / 1e6).toFixed(1)} MB from ${inputs.length} inputs: parsers=${count(/vendor\/parsers/)} ` +
    `utility=${count(/vendor\/utility/)} website-data=${count(/website-data/)} shims=${count(/shims\//)} ` +
    `node_modules=${count(/node_modules/)} (Toolbox ${upstream.toolboxVersion}, game ${upstream.gameVersion})`,
);
