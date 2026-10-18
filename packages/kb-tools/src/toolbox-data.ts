// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Generator inputs (TR-10): Toolbox's website-data (per-key files plus every shared-data.json key),
// exported parser constants (bundled with esbuild and the same alias rules as the parser build, in
// Node only), and Toolbox's patch notes at the pin.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Plugin } from 'esbuild';
import { CACHE, PARSERS, readPin, type UpstreamPin, WEBSITE_DATA } from './paths';

export type GameData = Record<string, unknown>;

let dataCache: { data: GameData; origin: Record<string, string> } | null = null;

/** Every website-data export by name, and the file (`website-data/<f>.json[#key]`) each came from. */
export function loadGameData(dir: string = WEBSITE_DATA): { data: GameData; origin: Record<string, string> } {
  if (dir === WEBSITE_DATA && dataCache) return dataCache;
  if (!existsSync(dir))
    throw new Error(
      `${dir} is missing: run \`pnpm --filter @idleon-forge/toolbox-parsers fetch-data\` first`,
    );
  const data: GameData = {};
  const origin: Record<string, string> = {};
  for (const f of readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()) {
    const json = JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as Record<string, unknown>;
    if (f === 'shared-data.json') {
      for (const [k, v] of Object.entries(json)) {
        data[k] = v;
        origin[k] = `website-data/shared-data.json#${k}`;
      }
    } else {
      const key = f.replace(/\.json$/, '');
      data[key] = json;
      origin[key] = `website-data/${f}`;
    }
  }
  const out = { data, origin };
  if (dir === WEBSITE_DATA) dataCache = out;
  return out;
}

/** A view of `data` that only exposes the keys a generator declared, so provenance can't lie. */
export function declaredData(data: GameData, inputs: readonly string[], generator: string): GameData {
  const keys = new Set(
    inputs
      .filter((i) => i.startsWith('website-data/'))
      .map((i) =>
        i.includes('#') ? (i.split('#')[1] as string) : (i.split('/').pop() as string).replace(/\.json$/, ''),
      ),
  );
  return new Proxy(Object.freeze({ ...data }), {
    get(target, prop) {
      if (typeof prop === 'string' && !keys.has(prop) && prop !== 'then')
        throw new Error(`${generator}: reads website-data "${prop}" without declaring it in inputs`);
      return Reflect.get(target, prop);
    },
  });
}

// ---- parser constants ----

const v = (p: string) => path.join(PARSERS, 'vendor', p);
const s = (p: string) => path.join(PARSERS, 'shims', p);

/** The parser build's alias rules (packages/toolbox-parsers/scripts/bundle.mjs), repeated for Node-side bundling. */
const aliasPlugin: Plugin = {
  name: 'toolbox-aliases',
  setup(b) {
    const exact: Record<string, string> = {
      '@mantine/hooks': s('mantine-hooks.ts'),
      '@components/constants': s('components-constants.ts'),
      '@utility/analytics': s('analytics.ts'),
      '@utility/clipboard': s('clipboard.ts'),
      '@parsers/safeSection': s('safe-section.ts'),
      '@website-data': v('data/website-data/index.js'),
    };
    const prefixes: [string, string][] = [
      ['@parsers/', v('parsers/')],
      ['@utility/', v('utility/')],
    ];
    b.onResolve({ filter: /^\.\.\/services\/leaderboardInfo$/ }, () => ({ path: s('leaderboardInfo.ts') }));
    b.onResolve({ filter: /^@(mantine|components|utility|parsers|website-data)/ }, async (args) => {
      let target = exact[args.path];
      if (!target) {
        const hit = prefixes.find(([p]) => args.path.startsWith(p));
        if (!hit) return { errors: [{ text: `unmapped alias ${args.path}` }] };
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

const constantsCache = new Map<string, unknown>();

/**
 * The named exports of vendored parser modules: `{ DEATH_NOTE_RANKS: 'parsers/world-3/deathNote.ts' }`.
 * Bundled once per pin into kb-tools/.cache and imported in Node.
 */
export async function loadConstants(spec: Readonly<Record<string, string>>, pin: UpstreamPin = readPin()) {
  const out: Record<string, unknown> = {};
  const missing = Object.keys(spec).filter((k) => !constantsCache.has(`${pin.commit}:${spec[k]}#${k}`));
  if (missing.length > 0) {
    // Some parser modules call Toolbox's prototype polyfills when they load (talents.ts uses
    // `.toSimpleObject()`), so the bundle applies them first, as the parser bundle does.
    const lines = [
      `import '${path.join(PARSERS, 'vendor/polyfills.js').replace(/\\/g, '/')}';`,
      ...missing.map((name) => {
        const file = (spec[name] as string)
          .replace(/^parsers\//, '@parsers/')
          .replace(/^utility\//, '@utility/')
          .replace(/\.ts$/, '');
        return `export { ${name} as ${name}__${missing.indexOf(name)} } from '${file}';`;
      }),
    ];
    const key = createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 12);
    const outfile = path.join(CACHE, `constants-${pin.commit.slice(0, 12)}-${key}.mjs`);
    mkdirSync(CACHE, { recursive: true });
    await build({
      stdin: { contents: lines.join('\n'), resolveDir: PARSERS, loader: 'ts' },
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node22',
      logLevel: 'silent',
      plugins: [aliasPlugin],
    });
    const mod = (await import(pathToFileURL(outfile).href)) as Record<string, unknown>;
    missing.forEach((name, i) => {
      const value = mod[`${name}__${i}`];
      if (value === undefined) throw new Error(`parser constant ${name} is not exported by ${spec[name]}`);
      constantsCache.set(`${pin.commit}:${spec[name]}#${name}`, value);
    });
  }
  for (const k of Object.keys(spec)) out[k] = constantsCache.get(`${pin.commit}:${spec[k]}#${k}`);
  return out;
}

// ---- patch notes ----

export interface PatchNote {
  gameVer: string;
  /** ISO date, from Toolbox's DD/MM/YYYY. */
  date: string | null;
}

export const patchNotesFile = (pin: UpstreamPin) => path.join(CACHE, `patch-notes-${pin.commit}.js`);

/**
 * Toolbox's patch notes at the pin (`data/patch-notes.js`), fetched once into the cache. The file is a
 * JSX module, so it is never imported: `gameVer` and `date` are read with a regex, as sync.sh does.
 */
export async function loadPatchNotes(pin: UpstreamPin = readPin()): Promise<PatchNote[]> {
  const file = patchNotesFile(pin);
  const upstreamCopy = path.join(PARSERS, '.upstream/data/patch-notes.js');
  let text: string;
  if (existsSync(file)) text = readFileSync(file, 'utf8');
  else if (
    existsSync(upstreamCopy) &&
    readFileSync(path.join(PARSERS, 'vendor/data/.commit'), 'utf8') === pin.commit
  )
    text = readFileSync(upstreamCopy, 'utf8');
  else {
    const url = `https://raw.githubusercontent.com/Morta1/IdleonToolbox/${pin.commit}/data/patch-notes.js`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetching ${url}: HTTP ${res.status}`);
    text = await res.text();
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, text);
  }
  return parsePatchNotes(text);
}

export function parsePatchNotes(text: string): PatchNote[] {
  const out: PatchNote[] = [];
  const re = /'gameVer':\s*'([^']+)'(?:,\s*'date':\s*'([^']+)')?/g;
  for (const m of text.matchAll(re)) {
    const dmy = m[2]?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    out.push({
      gameVer: m[1] as string,
      date: dmy
        ? `${dmy[3]}-${(dmy[2] as string).padStart(2, '0')}-${(dmy[1] as string).padStart(2, '0')}`
        : null,
    });
  }
  return out;
}
