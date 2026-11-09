// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const TICKETS = 'tickets';

export default {
  system: 'key',
  label: 'Keys and tickets',
  entryLabel: 'key',
  scope: 'account',
  route: GOAL_ROUTES.key,
  // the three colosseum ticket rows share one amount, so they are one entry
  list: ({ account }) => [
    ...(account?.currencies?.KeysAll ?? []),
    { rawName: TICKETS, name: 'Colosseum Tickets', amount: account?.currencies?.ColosseumTickets?.totalAmount }
  ],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => (row.rawName === TICKETS ? 'data/TixCol' : `data/${row.rawName}`),
  metrics: {
    amount: { label: 'Amount', value: (row) => Number(row.amount) || 0 }
  }
};
