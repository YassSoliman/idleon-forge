// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Routes audited to render without a parsed account. An anonymous visitor's empty account costs
// the parsers plus all of website-data (the items catalog alone is a 1.1s parse on a mid-range
// phone), and these pages read nothing from it. Everything else, including any route added later,
// still parses: a page missing here only pays the old cost, while a page wrongly listed would
// render without data.
const STATIC_ROUTES = new Set([
  '/',
  '/404',
  '/guilds',
  '/leaderboards',
  '/patch-notes',
  '/privacy-policy',
  '/statistics',
  '/tools/builds',
  '/tools/builds/[slug]',
  '/wiki',
  '/wiki/changelog',
  '/wiki/[kind]',
  '/wiki/[kind]/[slug]',
  '/wiki/[kind]/[slug]/[entity]'
]);

// `pathname` is the Next route pattern (router.pathname), not the URL.
export const routeNeedsAccount = (pathname) => !STATIC_ROUTES.has(pathname);
