#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 Layer 2, the truth run (docs/agents/truth-run.md). Local and dev-only. For each raw save:
//   1. headless: the whole worker (parser, engine, truth checks) over the save, via Vitest
//      (apps/activeon/test/truth-run.test.ts), written to <out>/<label>.headless.json;
//   2. browser: the built app under Wrangler's local server (production headers), the save pasted, every
//      character's Build, Gear and Cards tabs opened, the shown numbers read off the DOM;
//   3. diff: the DOM against the raw facts (points spent per tab, talent levels, "no points
//      waiting" lines, next steps and their start level, class levels).
// It writes <out>/truth-run.json and <out>/truth-run.md. Characters are named by slot and class only;
// no character name is ever read off the page or written out.
//
// Usage:
//   node scripts/truth/run.mjs --out <dir> [--base http://127.0.0.1:8799/] [--serve] [--no-browser] <save.raw.json>...
//   --serve       build the app and serve it with Wrangler (no file watcher) on the --base port for the run
//   --no-browser  headless only
// Playwright is not a repo dependency: set PLAYWRIGHT to an installed `playwright` module path
// (e.g. /tmp/pw/node_modules/playwright/index.js), or have it resolvable from here.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CANT = 'Can’t be sure of this one right now';

function args(argv) {
  const o = { out: null, base: 'http://127.0.0.1:8799/', serve: false, browser: true, saves: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--base') o.base = argv[++i];
    else if (a === '--serve') o.serve = true;
    else if (a === '--no-browser') o.browser = false;
    else o.saves.push(path.resolve(a));
  }
  if (!o.out || o.saves.length === 0) {
    console.error('usage: run.mjs --out <dir> [--base url] [--serve] [--no-browser] <save.raw.json>...');
    process.exit(2);
  }
  return o;
}

const labelOf = (file) => path.basename(file).replace(/\.raw\.json$|\.json$/, '');
const who = (c) => `slot ${c.index} ${c.className ?? `class ${c.classId}`}`;
const num = (s) => (s == null ? null : Number(String(s).replace(/,/g, '')));

function headless(save, out) {
  const file = path.join(out, `${labelOf(save)}.headless.json`);
  const r = spawnSync(
    'pnpm',
    ['exec', 'vitest', 'run', '--project', '@idleon-forge/activeon', 'test/truth-run.test.ts'],
    { cwd: ROOT, env: { ...process.env, TRUTH_SAVE: save, TRUTH_OUT: file }, encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`headless run failed for ${labelOf(save)}:\n${r.stdout}\n${r.stderr}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** The save moved to "just saved", like a live read: the page parses it at Date.now(). */
function timeShifted(save) {
  const s = JSON.parse(JSON.stringify(save));
  const ta = typeof s.data.TimeAway === 'string' ? JSON.parse(s.data.TimeAway) : s.data.TimeAway;
  const anchor = typeof ta?.GlobalTime === 'number' ? ta.GlobalTime * 1000 : s.lastUpdated;
  const delta = Date.now() - anchor - 60_000;
  if (typeof s.lastUpdated === 'number') s.lastUpdated += delta;
  for (const k of Object.keys(s.data))
    if (/^PTimeAway_\d+$/.test(k) && typeof s.data[k] === 'number') s.data[k] += delta / 1e6;
  if (ta) {
    for (const k of Object.keys(ta)) if (typeof ta[k] === 'number' && ta[k] > 1e9) ta[k] += delta / 1000;
    s.data.TimeAway = typeof s.data.TimeAway === 'string' ? JSON.stringify(ta) : ta;
  }
  return s;
}

async function loadPlaywright() {
  const spec = process.env.PLAYWRIGHT || 'playwright';
  const mod = await import(spec);
  return mod.chromium ?? mod.default?.chromium;
}

/**
 * Reads one character's Build tab (M24 design, M25 preset tabs): it shows one preset and one talent tab
 * at a time, so this clicks each preset tab (`.bd-ptabs [role=tab]`, id `…-tab-<slot>`; a lone preset
 * has no tabs, only its `.bd-preset[data-slot]` answer) and each tab control (`.bd-segbtn[data-tab]`,
 * tab 0 the star tab) and reads that tab's ladder: every Build step's levels ("12 → 50", or "50" when
 * done), the line where the known points end, and the tab control's points. Runs in the page.
 */
async function readBuild() {
  const view = document.querySelector('.build-view');
  if (!view) return null;
  const tick = () => new Promise((r) => setTimeout(r, 80));
  const n = (x) => Number(String(x).replace(/,/g, ''));
  const panels = [];
  const slotOf = (el) => Number(/-tab-(\d+)$/.exec(el.id)?.[1] ?? el.getAttribute('data-slot'));
  const presetTabs = [...view.querySelectorAll('.bd-ptabs [role="tab"]')];
  const slots = presetTabs.length
    ? presetTabs.map(slotOf)
    : [...view.querySelectorAll('.bd-preset[data-slot]')].map((b) => Number(b.getAttribute('data-slot')));
  for (const slot of slots) {
    const tab = presetTabs.find((t) => slotOf(t) === slot) ?? null;
    if (tab && tab.getAttribute('aria-selected') !== 'true') {
      tab.click();
      await tick();
    }
    const active = !!(tab ?? view.querySelector(`.bd-preset[data-slot="${slot}"]`))?.querySelector(
      '.bd-inuse',
    );
    const tabs = [];
    const tiles = [];
    const ids = [...view.querySelectorAll('.bd-segbtn')].map((b) => Number(b.getAttribute('data-tab')));
    for (const t of ids) {
      const btn = view.querySelector(`.bd-segbtn[data-tab="${t}"]`);
      if (btn && btn.getAttribute('aria-pressed') !== 'true') {
        btn.click();
        await tick();
      }
      const d = view.querySelector('.bd-ladder');
      if (!d) continue;
      tabs.push({
        tab: t,
        spent: /([\d,]+) spent/.exec(d.querySelector('.bd-spent')?.textContent ?? '')?.[1] ?? null,
        unspent: null,
        // "Your 70 Archer tab points end here", "At least 70 …", or the engine's marker words.
        marker: d.querySelector('.bd-cut-t')?.textContent ?? null,
        path: [...d.querySelectorAll('li.bd-step')].map((li) => {
          const lv = li.querySelector('.bd-step-lv')?.textContent ?? '';
          const m = /([\d,]+)\s*→\s*([\d,]+)/.exec(lv);
          return {
            label: (li.querySelector('.bd-step-name')?.textContent ?? '').trim(),
            done: li.getAttribute('data-band') === 'done',
            current: m ? n(m[1]) : null,
            goal: m ? n(m[2]) : n(lv.trim()) || null,
            note: li.querySelector('.bv-ps-note')?.textContent ?? null,
          };
        }),
        rows: [],
      });
      // The tab control's count is the engine's known points for that tab.
      const pts = btn?.querySelector('.bd-segpts')?.textContent ?? null;
      tiles.push({ tab: t, badge: pts ? `${pts} points` : null });
    }
    panels.push({ slot, active, unspent: null, next: [], tabs, tiles });
  }
  return { status: view.querySelector('.bv-status')?.textContent ?? null, panels };
}

async function browse(save, label, base, chromium, characters) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  await page.goto(`${base}?debug=truth`);
  // M21 G5: signed out, the paste drop zone is the screen itself (no fold to open).
  await page.waitForSelector('form.paste textarea');
  await page.locator('form.paste textarea').fill(JSON.stringify(timeShifted(save)));
  await page.click('form.paste button[type=submit]');
  await page.waitForSelector('.n-now, .cant-read, form.paste .error', { timeout: 60_000 });
  await page.waitForTimeout(800);
  const out = { label, characters: [], errors, csp: [], pageReport: null };
  for (const c of characters) {
    const row = { index: c.index, tabs: {} };
    for (const tab of ['build', 'gear', 'cards']) {
      await page.evaluate((h) => {
        location.hash = h;
      }, `#${tab}-${c.index}`);
      await page.waitForSelector('.char-tabs', { timeout: 20_000 });
      if (tab === 'build') await page.waitForSelector('.build-view', { timeout: 20_000 }).catch(() => null);
      await page.waitForTimeout(400);
      const read = await page.evaluate(
        ({ tab, cant }) => {
          // M24: the header's "Squire 85" (class and level, never the name).
          const sub = (document.querySelector('#focus-h')?.textContent ?? '').trim();
          const main = document.querySelector('main')?.textContent ?? document.body.textContent ?? '';
          return {
            level: Number(/(\d+)$/.exec(sub)?.[1] ?? Number.NaN),
            classText: sub.replace(/\s*\d+$/, '') || null,
            cantCount: main.split(cant).length - 1,
            chars: main.length,
            tab,
          };
        },
        { tab, cant: CANT },
      );
      if (tab === 'build') read.build = await page.evaluate(readBuild);
      row.tabs[tab] = read;
    }
    out.characters.push(row);
  }
  out.csp = await page.evaluate(() => window.__csp ?? []);
  out.pageReport = await page.evaluate(() => {
    const t = window.__activeonTruth?.report();
    return t ? { violations: t.violations, suppressed: t.suppressed, ms: t.ms } : null;
  });
  await browser.close();
  return out;
}

/** The DOM against the raw facts; every mismatch is a finding. */
function diff(head, dom) {
  const found = [];
  const raw = head.truth.raw;
  const add = (severity, where, what, evidence) => found.push({ severity, where, what, evidence });
  for (const dc of dom.characters) {
    const rc = raw.characters.find((c) => c.index === dc.index);
    if (!rc) continue;
    for (const [tab, t] of Object.entries(dc.tabs))
      if (Number.isFinite(t.level) && t.level !== rc.level)
        add('P1', `${who(rc)} · ${tab} tab`, 'class level shown differs from the save', {
          shown: t.level,
          save: rc.level,
        });
    const b = dc.tabs.build?.build;
    if (!b) continue;
    const hb = head.builds.find((x) => x.index === dc.index);
    for (const p of b.panels) {
      const rp = rc.presets.find((x) => x.slot === p.slot);
      const hp = hb?.presets.find((x) => x.slot === p.slot);
      if (!rp) continue;
      const where = `${who(rc)} · preset ${p.slot + 1}`;
      const idOf = (tab, label) => {
        const ht = hp?.tabs.find((x) => x.tab === tab);
        return (
          ht?.rows.find((r) => r.label === label)?.id ??
          ht?.path?.find((s) => s.label === label)?.talentId ??
          hp?.tabs.flatMap((x) => x.rows).find((r) => r.label === label)?.id
        );
      };
      const rawLv = (id) => {
        for (const t of rp.tabs) if (id in t.levels) return t.levels[id];
        return null;
      };
      for (const t of p.tabs) {
        const rt = rp.tabs.find((x) => x.tab === t.tab);
        const ht = [...(hp?.tabs ?? []), ...(hp?.star ? [hp.star] : [])].find((x) => x.tab === t.tab);
        if (rt && t.spent !== null && num(t.spent) !== rt.spent)
          add('P1', `${where} · tab ${t.tab}`, 'points spent shown differs from the save', {
            shown: num(t.spent),
            save: rt.spent,
          });
        const seen = new Set();
        for (const st of t.path ?? []) {
          if (seen.has(st.label) || st.note === CANT || st.note === 'set by a bubble') continue;
          seen.add(st.label);
          const id = idOf(t.tab, st.label);
          const lv = id === undefined ? null : rawLv(id);
          if (lv === null) continue;
          if (st.done && st.goal !== null && lv < st.goal)
            add(
              'P1',
              `${where} · tab ${t.tab} · ${st.label}`,
              'Build path shows done, the save is below it',
              {
                goal: st.goal,
                save: lv,
              },
            );
          // A later step of a talent the path already raised starts where that earlier step ends
          // ("20 → 100" after "1 → 20"): the engine's `from`, not the save's level.
          const from = ht?.path?.find((x) => x.label === st.label && x.goal === st.goal)?.from ?? null;
          if (!st.done && st.current !== null && from !== null && st.current !== from)
            add(
              'P1',
              `${where} · tab ${t.tab} · ${st.label}`,
              'Build path start level differs from the engine',
              {
                shown: st.current,
                engine: from,
              },
            );
          else if (!st.done && st.current !== null && from === null && st.current !== lv)
            add('P1', `${where} · tab ${t.tab} · ${st.label}`, 'Build path level differs from the save', {
              shown: st.current,
              save: lv,
            });
        }
        // The marker's count is the engine's known count for that tab, and never below the save's floor.
        // "Build complete at 1,001 · at least 1,935 points have no talent …" shows it as the build's
        // cost plus the spare points, so the count there is the sum.
        const known = ht?.known;
        const complete = /^Build complete at ([\d,]+)(?: · (?:at least )?([\d,]+) points? ha)?/.exec(
          t.marker ?? '',
        );
        const shown = /^([\d,]+) (?:points? waiting|unspent)|at least ([\d,]+)|^your ([\d,]+) /i.exec(
          t.marker ?? '',
        );
        const shownN = complete
          ? num(complete[1]) + (complete[2] ? num(complete[2]) : 0)
          : shown
            ? num(shown[1] ?? shown[2] ?? shown[3])
            : null;
        if (known && known.points !== null && shownN !== null && shownN !== known.points)
          add('P1', `${where} · tab ${t.tab}`, 'Build marker count differs from the engine’s count', {
            shown: t.marker,
            engine: known.points,
          });
        if (rt && rt.unspentAtLeast > 0 && known?.kind === 'exact' && (known.points ?? 0) < rt.unspentAtLeast)
          add('P1', `${where} · tab ${t.tab}`, 'exact unspent count is below the save’s floor', {
            exact: known.points,
            floor: rt.unspentAtLeast,
          });
        for (const r of t.rows) {
          const id = idOf(t.tab, r.label);
          const lv = id === undefined ? null : rawLv(id);
          if (lv !== null && r.current !== null && r.current !== lv && r.note !== CANT)
            add('P1', `${where} · tab ${t.tab} · ${r.label}`, 'talent level shown differs from the save', {
              shown: r.current,
              save: lv,
            });
        }
      }
      for (const tile of p.tiles ?? []) {
        const ht = [...(hp?.tabs ?? []), ...(hp?.star ? [hp.star] : [])].find((x) => x.tab === tile.tab);
        const m = /([\d,]+) (?:points?|unspent)/.exec(tile.badge ?? '');
        if (!m || !ht?.known || ht.known.points === null) continue;
        if (num(m[1]) !== ht.known.points)
          add('P1', `${where} · tile ${tile.tab}`, 'tab tile badge differs from the engine’s count', {
            shown: tile.badge,
            engine: ht.known.points,
          });
      }
      for (const n of p.next) {
        const rt = rp.tabs.find((x) => x.tab === n.tab);
        n.lines.forEach((line, k) => {
          if (line === CANT) return;
          if (/no points waiting/i.test(line) && rt && rt.unspentAtLeast > 0)
            add(
              'P1',
              `${where} · tab ${n.tab}`,
              '"No points waiting" shown, the save has points left there',
              {
                line,
                saveAtLeast: rt.unspentAtLeast,
              },
            );
          if (/no unspent points known/i.test(line) && rt && rt.unspentAtLeast > 0)
            add(
              'P2',
              `${where} · tab ${n.tab}`,
              '"No unspent points known" shown, the save proves points left',
              {
                line,
                saveAtLeast: rt.unspentAtLeast,
              },
            );
          const m = /into (.+?) \(to ([\d,]+)/.exec(line);
          if (!m) return;
          const id = idOf(n.tab, m[1]);
          const lv = id === undefined ? null : rawLv(id);
          if (lv === null) return;
          if (lv >= num(m[2]))
            add('P1', `${where} · tab ${n.tab} · ${m[1]}`, 'next step is already at its target in the save', {
              line,
              save: lv,
            });
          const take = /^Put the next ([\d,]+) points? into /.exec(line);
          if (k === 0 && take && num(m[2]) - num(take[1]) !== lv)
            add(
              'P2',
              `${where} · tab ${n.tab} · ${m[1]}`,
              'next step starts from a level the save doesn’t have',
              {
                line,
                save: lv,
              },
            );
        });
      }
    }
  }
  for (const e of dom.errors) add('P2', 'page', 'console or page error', { e });
  for (const e of dom.csp) add('P1', 'page', 'CSP violation', { e });
  return found;
}

function markdown(runs) {
  const L = ['# Truth run', '', `Run ${new Date().toISOString()}. Class and slot only.`, ''];
  for (const r of runs) {
    const t = r.headless.truth;
    L.push(`## ${r.label}`, '');
    L.push(
      `- Truth checks (headless): ${t.violations.length} violation(s), ${t.suppressed.length} item(s) held back, ${t.facts.length} facts, ${t.ms} ms.`,
    );
    if (t.raw?.unreadable?.length) L.push(`- Unreadable raw keys: ${t.raw.unreadable.join(', ')}`);
    if (r.dom)
      L.push(
        `- Browser: ${r.dom.characters.length} character(s) × Build, Gear, Cards; page report ${r.dom.pageReport ? `${r.dom.pageReport.violations.length} violation(s)` : 'missing'}.`,
      );
    L.push('', '### Violations (Layer 1)', '');
    if (t.violations.length === 0) L.push('None.');
    for (const v of [...t.violations].sort((a, b) => a.severity.localeCompare(b.severity)))
      L.push(`- **${v.severity}** \`${v.rule}\` ${v.message}`);
    L.push('', '### DOM vs raw (Layer 2)', '');
    if (!r.dom) L.push('Browser step skipped.');
    else if (r.findings.length === 0) L.push('No mismatch: every number read off the page matches the save.');
    for (const f of [...r.findings].sort((a, b) => a.severity.localeCompare(b.severity)))
      L.push(`- **${f.severity}** ${f.where}: ${f.what} (${JSON.stringify(f.evidence)})`);
    L.push('');
  }
  return L.join('\n');
}

/** Wrangler's local server for apps/activeon/dist, file watcher off (see main). argv[1]: port. */
const SERVE = `
import { unstable_startWorker } from 'wrangler';
const port = Number(process.argv[1]);
const worker = await unstable_startWorker({
  config: 'wrangler.jsonc',
  dev: { watch: false, liveReload: false, inspector: false, server: { hostname: '127.0.0.1', port } },
});
await worker.ready;
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => worker.dispose().finally(() => process.exit(0)));
`;

async function main() {
  const o = args(process.argv.slice(2));
  mkdirSync(o.out, { recursive: true });
  let server = null;
  if (o.serve && o.browser) {
    // A server already on the port would be tested instead of this build: refuse rather than guess.
    const taken = await fetch(o.base).then(
      () => true,
      () => false,
    );
    if (taken) {
      console.error(`--serve: ${o.base} is already answering; stop that server or pass another --base port`);
      process.exit(2);
    }
    spawnSync('pnpm', ['build'], { cwd: ROOT, stdio: 'inherit' });
    const port = Number(new URL(o.base).port || '8799');
    // Not `wrangler dev`: its assets watcher (chokidar) holds one descriptor per file in dist/, and
    // the game art is ~19.7k files. On macOS a process holding descriptors above OPEN_MAX (10240)
    // can no longer spawn a piped child (libuv's posix_spawn fails with EBADF), so Wrangler's own
    // esbuild service dies at start-up. `dev.watch` is not a CLI flag, so the same local server
    // (Workers static assets, _headers, SPA fallback) is started through the API with the watcher
    // off. Its own process group, so the workerd child goes down with it on exit.
    server = spawn(process.execPath, ['--input-type=module', '-e', SERVE, String(port)], {
      cwd: path.join(ROOT, 'apps/activeon'),
      stdio: 'ignore',
      detached: true,
    });
    const stop = () => {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {}
    };
    process.on('exit', stop);
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(o.base)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  const chromium = o.browser ? await loadPlaywright() : null;
  const runs = [];
  try {
    for (const save of o.saves) {
      const label = labelOf(save);
      const head = headless(save, o.out);
      const run = { label, headless: head, dom: null, findings: [] };
      if (chromium) {
        const json = JSON.parse(readFileSync(save, 'utf8'));
        run.dom = await browse(json, label, o.base, chromium, head.truth.raw.characters);
        run.findings = diff(head, run.dom);
      }
      runs.push(run);
    }
  } finally {
    if (server)
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {}
  }
  const slim = runs.map((r) => ({
    label: r.label,
    violations: r.headless.truth.violations,
    suppressed: r.headless.truth.suppressed,
    ms: r.headless.truth.ms,
    pageReport: r.dom?.pageReport ?? null,
    findings: r.findings,
    dom: r.dom ? { characters: r.dom.characters, errors: r.dom.errors, csp: r.dom.csp } : null,
  }));
  writeFileSync(path.join(o.out, 'truth-run.json'), JSON.stringify(slim, null, 1));
  writeFileSync(path.join(o.out, 'truth-run.md'), markdown(runs));
  console.log(`wrote ${path.join(o.out, 'truth-run.md')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
