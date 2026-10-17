// IdleOn Forge parser spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Bundles vendor/ + shims/ into dist/run.mjs, replacing Toolbox's Next.js path aliases.
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v = (p) => path.join(root, 'vendor', p);
const s = (p) => path.join(root, 'shims', p);

// Exact specifiers first (UI-coupled modules -> shims), then Toolbox's prefix aliases -> vendor/.
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
    // helpers.copyForSupport lazily imports an app service; never reached by parseData().
    b.onResolve({ filter: /^\.\.\/services\/leaderboardInfo$/ }, () => ({ path: s('leaderboardInfo.ts') }));
    b.onResolve({ filter: /^@(mantine|components|utility|parsers|website-data)/ }, async (args) => {
      let target = exact[args.path];
      if (!target) {
        const hit = prefixes.find(([p]) => args.path.startsWith(p));
        if (!hit) return { errors: [{ text: `unmapped alias ${args.path} (from ${args.importer})` }] };
        target = hit[1] + args.path.slice(hit[0].length);
      }
      const r = await b.resolve('./' + path.basename(target), { resolveDir: path.dirname(target), kind: args.kind });
      return r.errors.length ? { errors: r.errors } : { path: r.path };
    });
  },
};

const result = await build({
  entryPoints: [path.join(root, 'src/run.ts')],
  outfile: path.join(root, 'dist/run.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  metafile: true,
  logLevel: 'warning',
  plugins: [aliasPlugin],
});
// Same code as a browser / Cloudflare Worker ESM library (no Node built-ins allowed), to prove portability.
const lib = await build({
  entryPoints: [path.join(root, 'src/index.ts')],
  outfile: path.join(root, 'dist/index.browser.mjs'),
  bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true,
  metafile: true, logLevel: 'warning', plugins: [aliasPlugin],
});
console.log(`dist/index.browser.mjs ${(Object.values(lib.metafile.outputs)[0].bytes / 1e6).toFixed(1)} MB (minified)`);
const inputs = Object.keys(result.metafile.inputs);
const count = (re) => inputs.filter((i) => re.test(i)).length;
console.log(`bundled ${inputs.length} inputs: parsers=${count(/vendor\/parsers/)} utility=${count(/vendor\/utility/)} website-data=${count(/website-data/)} shims=${count(/shims\//)} node_modules=${count(/node_modules/)}`);
console.log(`dist/run.mjs ${(result.metafile.outputs[Object.keys(result.metafile.outputs)[0]].bytes / 1e6).toFixed(1)} MB`);
