// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The parser bundle's esbuild options, shared by build.mjs (dist/index.js) and the data-trim tests,
// which build the same bundle with and without the trims and compare what they parse.
//
// Data trims: a website-data file the parsers read only a sliver of is cut down to that sliver as it
// enters the bundle. vendor/ is never edited; the trim runs in esbuild's onLoad. Each trim names the
// vendored files allowed to import it and the exact code that reads it (`reads`), and
// test/data-trims.test.ts fails when any other file imports it or the reading code changes, so a
// re-sync can never widen what the parsers read without someone re-checking the trim.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v = (p) => path.join(root, 'vendor', p);
const s = (p) => path.join(root, 'shims', p);

/** Website-data trims, by file name in vendor/data/website-data/. */
export const DATA_TRIMS = {
  // ~2.6 MB of the ~6.4 MB bundle. Only quests.ts imports it, to list the greenstackable drops each
  // quest gates: it reads `questLink` and `rawName`, and skips drops whose questLink is empty or 'N/A'.
  'monsterDrops.json': {
    importers: ['parsers/quests.ts'],
    reads: `missableQuestDrops ??= Object.values(monsterDrops as Record<string, any[]>)
    .flat()
    .reduce((res: Record<string, string[]>, { questLink, rawName }: any) => {
      if (!questLink || questLink === 'N/A' || res[questLink]?.includes(rawName)) return res;`,
    trim: (data) =>
      Object.fromEntries(
        Object.entries(data)
          .map(([monster, drops]) => [
            monster,
            drops
              .filter(({ questLink }) => questLink && questLink !== 'N/A')
              .map(({ questLink, rawName }) => ({ questLink, rawName })),
          ])
          .filter(([, drops]) => drops.length > 0),
      ),
  },
};

export function readUpstream() {
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
  return { upstream, verifiedBuilds };
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

const websiteData = v('data/website-data');
const dataTrimPlugin = {
  name: 'toolbox-data-trims',
  setup(b) {
    b.onLoad({ filter: /\.json$/ }, (args) => {
      if (path.dirname(args.path) !== websiteData) return undefined;
      const trim = DATA_TRIMS[path.basename(args.path)];
      if (!trim) return undefined;
      const data = JSON.parse(readFileSync(args.path, 'utf8'));
      return { contents: JSON.stringify(trim.trim(data)), loader: 'json' };
    });
  },
};

/** esbuild options for the parser bundle; `trimData: false` builds it with the data untrimmed. */
export function bundleOptions({ outfile, trimData = true } = {}) {
  const { upstream, verifiedBuilds } = readUpstream();
  const trims = trimData ? Object.keys(DATA_TRIMS).sort().join(', ') : '';
  const banner = `/*! IdleOn Forge toolbox-parsers. GPL-3.0-only.
 * Bundles IdleOn Toolbox's parsers and game data (https://github.com/Morta1/IdleonToolbox) @ ${upstream.commit},
 * Copyright (C) Morta1 and IdleOn Toolbox contributors, redistributed unmodified under GPL-3.0-only${
   trims ? `,\n * except these game data files, which keep only the fields the parsers read: ${trims}` : ''
 }.
 * Source: https://github.com/YassSoliman/idleon-forge/tree/main/packages/toolbox-parsers */`;
  return {
    upstream,
    options: {
      entryPoints: [path.join(root, 'src/index.ts')],
      outfile: outfile ?? path.join(root, 'dist/index.js'),
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
      plugins: trimData ? [aliasPlugin, dataTrimPlugin] : [aliasPlugin],
    },
  };
}
