#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The layout jitter check: the shell (the top bar, the place navigation and the content column) never
// moves between places.
// Local and dev-only, like the truth run (docs/agents/truth-run.md). It pastes a public fixture into the
// built app, then visits every place, two characters and several of their tabs, and a System page, at
// 390, 720, 1000, 1280 and 1600 px. On every animation frame after each switch (so a lazy chunk's loading frame
// counts too) it records the bounding boxes of the top bar (`.n-hdr`), the places (`nav.places`: the
// bar's places from 720 px, the bottom dock under it) and the
// content column (`.outlet`, left edge and width), and fails when any of them differs by a pixel. It
// also fails when any piece of the top bar reaches past the viewport (M24 fix: the 390 px phone bar
// overflowed to 424 px on a long "pasted · 45h 01m ago"; the public fixture's save is days old). It
// reads the nav by its element, not its position, so it holds for a side rail, a top bar or a dock.
// M24 QA P0: it also fails when the content column's own content is wider than the column on any stop
// (the 11-character fixture laid Now out at 572 px in a 390 px phone; `body{overflow-x:hidden}` cut
// the right third off), and on Now at 390 it also tries the Log in and Rounds pause points. Content
// inside its own scroller (a wide table that scrolls sideways) is fine.
// Scrollbars are shown (Playwright hides them by default), so a scrollbar that comes and goes counts.
//
// Usage:
//   pnpm build && (cd apps/activeon && pnpm exec vite preview --port 4173 --strictPort) &
//   node scripts/layout/jitter.mjs [--base http://127.0.0.1:4173/] [--shots <dir>]
// Playwright is not a repo dependency: set PLAYWRIGHT to an installed `playwright` module path
// (e.g. /tmp/pw/node_modules/playwright/index.js), or have it resolvable from here.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = path.join(ROOT, 'packages/account-state/fixtures/public/latest.json');
const WIDTHS = [390, 720, 1000, 1280, 1600];

function args(argv) {
  const o = { base: 'http://127.0.0.1:4173/', shots: null, widths: WIDTHS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') o.base = argv[++i];
    else if (a === '--shots') o.shots = argv[++i];
    else if (a === '--widths') o.widths = argv[++i].split(',').map(Number);
  }
  return o;
}

async function loadPlaywright() {
  const mod = await import(process.env.PLAYWRIGHT || 'playwright');
  return mod.chromium ?? mod.default?.chromium;
}

/** Starts recording the shell's boxes on every frame into window.__boxes. */
function record() {
  const box = (sel, keys) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return keys.map((k) => Math.round(r[k] * 100) / 100).join(',');
  };
  window.__boxes = [];
  const tick = () => {
    window.__boxes.push({
      header: box('.n-hdr', ['x', 'y', 'width', 'height']),
      rail: box('nav.places', ['x', 'width', 'height']),
      column: box('.outlet', ['x', 'width']),
      // The rail's top edge: sticky from 720 px, so it is read with the page at the top.
      railTop: box('nav.places', ['y']),
      // How far the bar's furthest piece reaches past the viewport (0 when it fits).
      // How far the column's content reaches past the column (0 when it fits): the column's own
      // scrollWidth, and any element right edge past the viewport outside a sideways scroller.
      content: String(
        (() => {
          const o = document.querySelector('.outlet');
          if (!o) return 0;
          const vw = document.documentElement.clientWidth;
          let over = Math.max(0, o.scrollWidth - o.clientWidth);
          for (const el of o.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= vw + 0.5) continue;
            const cs = getComputedStyle(el);
            if (cs.position === 'absolute' || cs.position === 'fixed') continue;
            let p = el.parentElement;
            let scrolled = false;
            while (p && p !== o) {
              const ox = getComputedStyle(p).overflowX;
              if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
                scrolled = true;
                break;
              }
              p = p.parentElement;
            }
            if (!scrolled) over = Math.max(over, Math.ceil(r.right - vw));
          }
          return over;
        })(),
      ),
      overflow: String(
        Math.max(
          0,
          ...[...document.querySelectorAll('.n-hdr__line > *')].map((el) =>
            Math.ceil(el.getBoundingClientRect().right - document.documentElement.clientWidth),
          ),
        ),
      ),
    });
    window.__raf = requestAnimationFrame(tick);
  };
  tick();
}

async function main() {
  const o = args(process.argv.slice(2));
  const chromium = await loadPlaywright();
  const save = readFileSync(FIXTURE, 'utf8');
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  const failures = [];
  for (const width of o.widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(o.base);
    await page.waitForSelector('form.paste textarea', { state: 'attached' });
    // The drop zone's textarea is drawn under its label, so it is filled the way React reads it.
    await page.evaluate((text) => {
      const ta = document.querySelector('form.paste textarea');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, text);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, save);
    await page.click('form.paste button[type=submit]');
    await page.waitForSelector('.n-now', { timeout: 60_000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      location.hash = '#systems';
    });
    await page.waitForSelector('a[href^="#system-"]', { timeout: 20_000 });
    const system = await page.evaluate(() =>
      document.querySelector('a[href^="#system-"]')?.getAttribute('href'),
    );
    const stops = [
      '#now',
      '#characters',
      '#build-0',
      '#gear-0',
      '#cards-0',
      '#now-1',
      '#build-1',
      '#skills-1',
      '#systems',
      system,
      '#timeline',
      '#map',
      '#characters',
      '#now',
    ].filter(Boolean);
    const seen = new Map();
    for (const [i, stop] of stops.entries()) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(record);
      await page.evaluate((h) => {
        location.hash = h;
      }, stop);
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      const frames = await page.evaluate(() => {
        cancelAnimationFrame(window.__raf);
        return window.__boxes;
      });
      for (const f of frames)
        for (const [k, v] of Object.entries(f)) {
          if (v == null) continue;
          if (!seen.has(k)) seen.set(k, new Map());
          const m = seen.get(k);
          if (!m.has(v)) m.set(v, stop);
        }
      if (o.shots) {
        mkdirSync(o.shots, { recursive: true });
        const name = `${width}-${String(i).padStart(2, '0')}-${stop.replace('#', '')}.png`;
        await page.screenshot({ path: path.join(o.shots, name) });
      }
    }
    // The pause points at the phone width: each lays the Now column out with other parts.
    if (width === 390)
      for (const pick of ['Log in', 'Rounds', 'Log off']) {
        await page.evaluate(() => {
          location.hash = '#now';
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(600);
        await page.getByRole('radio', { name: pick }).click({ force: true });
        await page.waitForTimeout(600);
        await page.evaluate(record);
        await page.waitForTimeout(100);
        const frames = await page.evaluate(() => {
          cancelAnimationFrame(window.__raf);
          return window.__boxes;
        });
        for (const f of frames) {
          if (!seen.has('content')) seen.set('content', new Map());
          const m = seen.get('content');
          if (!m.has(f.content)) m.set(f.content, `#now ${pick}`);
        }
      }
    const wide = [...(seen.get('content') ?? new Map())].filter(([v]) => v !== '0');
    if (wide.length) {
      console.log(
        `${width}px content OVERFLOWS the column: ${wide.map(([v, st]) => `${st} [${v} px]`).join('  ')}`,
      );
      failures.push(`${width}px content overflow`);
    }
    seen.delete('content');
    const over = [...(seen.get('overflow')?.keys() ?? [])].filter((v) => v !== '0');
    if (over.length) {
      console.log(`${width}px header  OVERFLOWS the viewport by ${over.join(', ')} px`);
      failures.push(`${width}px header overflow`);
    }
    seen.delete('overflow');
    for (const [k, m] of seen) {
      const status = m.size === 1 ? 'same' : 'MOVES';
      console.log(`${width}px ${k.padEnd(7)} ${status}: ${[...m].map(([v, s]) => `${s} [${v}]`).join('  ')}`);
      if (m.size !== 1) failures.push(`${width}px ${k}`);
    }
    await ctx.close();
  }
  await browser.close();
  if (failures.length) {
    console.error(`\nThe shell moved or overflowed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log(
    '\nThe top bar, the places and the content column hold still and fit at every width, and the content fits the column.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
