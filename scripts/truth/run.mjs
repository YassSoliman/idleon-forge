#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 Layer 2, the truth run (docs/agents/truth-run.md). Local and dev-only. For each raw save:
//   1. headless: the whole worker (parser, engine, truth checks) over the save, via Vitest
//      (apps/activeon/test/truth-run.test.ts), written to <out>/<label>.headless.json;
//   2. browser: the built app under `wrangler dev` (production headers), the save pasted, every
//      character's Build, Gear and Cards tabs opened, the shown numbers read off the DOM;
//   3. diff: the DOM against the raw facts (points spent per tab, talent levels, "no points
//      waiting" lines, next steps and their start level, class levels).
// It writes <out>/truth-run.json and <out>/truth-run.md. Characters are named by slot and class only;
// no character name is ever read off the page or written out.
//
// Usage:
//   node scripts/truth/run.mjs --out <dir> [--base http://127.0.0.1:8799/] [--serve] [--no-browser] <save.raw.json>...
//   --serve       build the app and start `wrangler dev` on the --base port for the run
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

/** Reads one character's Build tab: per preset, the next-points lines, the tab headers and rows. */
function readBuild() {
  const view = document.querySelector('.build-view');
  if (!view) return null;
  const panels = [...view.querySelectorAll('.bv-preset')].map((sec) => {
    const slot = Number(/-p(\d)-panel$/.exec(sec.id)?.[1]);
    const next = [...sec.querySelectorAll('.bv-next > div')].map((div) => ({
      tab: Number(/Tab (\d+)/.exec(div.querySelector('p')?.textContent ?? '')?.[1]),
      lines: [...div.querySelectorAll('li')].map((li) => li.textContent.trim()),
    }));
    const tabs = [...sec.querySelectorAll('section.bv-tab')].map((t) => {
      const h = t.querySelector('h5')?.textContent ?? '';
      return {
        tab: Number(/Tab (\d+)/.exec(h)?.[1]),
        spent: /([\d,]+) spent/.exec(h)?.[1] ?? null,
        unspent: /([\d,]+)\+ unspent/.exec(h)?.[1] ?? null,
        rows: [...t.querySelectorAll('tbody tr')].map((tr) => {
          const th = tr.querySelector('th');
          const cell = tr.querySelector('td.num')?.textContent ?? '';
          const m = /(\d+)\s*\/\s*(\d+)/.exec(cell);
          return {
            label: (th?.firstChild?.textContent ?? '').trim(),
            note: th?.querySelector('.bv-note')?.textContent ?? null,
            current: m ? Number(m[1]) : null,
            target: m ? Number(m[2]) : null,
          };
        }),
      };
    });
    return {
      slot,
      active: !!sec.querySelector('.bv-badge'),
      unspent: /At least ([\d,]+)/.exec(sec.querySelector('.bv-unspent')?.textContent ?? '')?.[1] ?? null,
      next,
      tabs,
    };
  });
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
  await page.waitForSelector('summary:has-text("Paste your save instead")');
  if (!(await page.locator('details.fallback').evaluate((d) => d.open)))
    await page.click('summary:has-text("Paste your save instead")');
  await page.locator('details.fallback textarea').fill(JSON.stringify(timeShifted(save)));
  await page.click('button:has-text("Read this save")');
  await page.waitForSelector('.roster, .cant-read, form.paste .error', { timeout: 60_000 });
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
          const hero = document.querySelector('.hero p.small.muted')?.textContent ?? '';
          const main = document.querySelector('main')?.textContent ?? document.body.textContent ?? '';
          return {
            level: Number(/lv (\d+)/i.exec(hero)?.[1] ?? Number.NaN),
            classText: hero.split(' · ')[0] ?? null,
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
          hp?.tabs.flatMap((x) => x.rows).find((r) => r.label === label)?.id
        );
      };
      const rawLv = (id) => {
        for (const t of rp.tabs) if (id in t.levels) return t.levels[id];
        return null;
      };
      for (const t of p.tabs) {
        const rt = rp.tabs.find((x) => x.tab === t.tab);
        if (rt && t.spent !== null && num(t.spent) !== rt.spent)
          add('P1', `${where} · tab ${t.tab}`, 'points spent shown differs from the save', {
            shown: num(t.spent),
            save: rt.spent,
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

async function main() {
  const o = args(process.argv.slice(2));
  mkdirSync(o.out, { recursive: true });
  let server = null;
  if (o.serve && o.browser) {
    spawnSync('pnpm', ['build'], { cwd: ROOT, stdio: 'inherit' });
    const port = new URL(o.base).port || '8799';
    server = spawn('pnpm', ['exec', 'wrangler', 'dev', '--port', port], {
      cwd: path.join(ROOT, 'apps/activeon'),
      stdio: 'ignore',
    });
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
    server?.kill();
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
