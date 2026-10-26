// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { PAGES } from '@components/constants';
import { realCap } from '../../caps';

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

// The nav icon of the account page at this route
export const pageIcon = (route) => Object.entries(PAGES.ACCOUNT)
  .flatMap(([category, { categories }]) => categories.map((page) => [`/account/${kebab(category)}/${kebab(page.label)}`, page.icon]))
  .find(([path]) => path === route)?.[1] ?? null;

const finite = (n) => (Number.isFinite(n) ? n : 0);

// A page's header summary numbers as one system: each entry is one value with an optional max ("current / max").
// entries: [{ key, name, icon?, value(ctx), max?(ctx) }]; an entry without an icon shows the page icon.
export const totalsDescriptor = ({ system, label, route, entries }) => {
  const fallbackIcon = pageIcon(route);
  return {
    system,
    label,
    entryLabel: 'total',
    scope: 'account',
    route,
    totals: true,
    entryOnly: true,
    list: (ctx) => entries.map(({ key, name, icon, value, max }) => ({
      key,
      name,
      icon: icon ?? fallbackIcon,
      value: finite(Number(value(ctx))),
      max: realCap(max?.(ctx))
    })),
    key: (row) => row.key,
    name: (row) => row.name,
    icon: (row) => row.icon,
    metrics: {
      value: { label: 'Value', value: (row) => row.value, max: (row) => row.max }
    }
  };
};
