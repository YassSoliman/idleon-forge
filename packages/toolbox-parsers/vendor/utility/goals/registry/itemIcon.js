// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Items whose art only ships as <name>_x1.png (the slab page falls back to it on a load error).
// The registry contract test fails when a catalog item with only _x1 art is missing here.
const X1_ONLY = /^(?:MotherlodeTREE|Bits|SailTr(?:1|9|11|13|20|24|28)|W6item(?:[1-9]|10)|W7item\d+|Bone\d+|Dust\d+|Tach\d+|DungRNG\d+)$/;

export const itemIcon = (rawName) => `data/${rawName}${X1_ONLY.test(rawName) ? '_x1' : ''}`;
