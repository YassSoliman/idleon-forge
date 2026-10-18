// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 engine Detector cards/slots; defined in src/collections/detectors.ts. It reads 'cards.fact.activity-keywords', 'cards.fact.card-preferences',
// 'cards.fact.slots' and 'classes.fact.class-tree'. The Cards view (src/collections/cards-view.ts) also
// reads 'cards.fact.drops', 'maps.fact.maps' and 'skills.fact.nodes', named here so `kb compile` ships them.
export { cardSlotsDetector as default } from '../../src/collections/detectors';
