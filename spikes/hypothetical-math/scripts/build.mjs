// IdleOn Forge hypothetical-math spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Bundles src/probe.ts against the parser spike's vendored Toolbox code (branch research/parser-spike,
// spikes/parser-spike: run `npm install && npm run sync` there first). Override with PARSER_SPIKE=<dir>.
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spike = path.resolve(process.env.PARSER_SPIKE ?? path.join(root, '..', 'parser-spike'));
const v = (p) => path.join(spike, 'vendor', p);
const s = (p) => path.join(spike, 'shims', p);
const exact = {
  '@mantine/hooks': s('mantine-hooks.ts'),
  '@components/constants': s('components-constants.ts'),
  '@utility/analytics': s('analytics.ts'),
  '@utility/clipboard': s('clipboard.ts'),
  '@website-data': v('data/website-data/index.js'),
};
const prefixes = [['@parsers/', v('parsers/')], ['@utility/', v('utility/')]];
const aliasPlugin = {
  name: 'toolbox-aliases',
  setup(b) {
    b.onResolve({ filter: /^\.\.\/services\/leaderboardInfo$/ }, () => ({ path: s('leaderboardInfo.ts') }));
    b.onResolve({ filter: /^@(mantine|components|utility|parsers|website-data)/ }, async (args) => {
      let target = exact[args.path];
      if (!target) {
        const hit = prefixes.find(([p]) => args.path.startsWith(p));
        if (!hit) return { errors: [{ text: `unmapped alias ${args.path}` }] };
        target = hit[1] + args.path.slice(hit[0].length);
      }
      const r = await b.resolve('./' + path.basename(target), { resolveDir: path.dirname(target), kind: args.kind });
      return r.errors.length ? { errors: r.errors } : { path: r.path };
    });
  },
};
await build({
  entryPoints: [path.join(root, 'src/probe.ts')],
  outfile: path.join(root, 'dist/probe.mjs'),
  bundle: true, platform: 'node', format: 'esm', target: 'node22', logLevel: 'warning',
  nodePaths: [path.join(spike, 'node_modules')],
  plugins: [aliasPlugin],
});
console.log('built dist/probe.mjs against', spike);
