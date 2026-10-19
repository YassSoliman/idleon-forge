// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Talent categories and the four talent tabs (our own emblems, ADR 0009).
import type { SpriteDef } from '../bake';
import { g } from '../grid';

export const talents: Record<string, SpriteDef> = {
  'talent-damage': {
    title: 'Damage talents',
    mask: g(`
      ................
      ...rrrrrrrrrr...
      ..rrrrrrrrrrrr..
      .rrrrrrrrrrrrrr.
      .rrrrrrkkrrrrrr.
      .rrrrrkkkkrrrrr.
      .rrrrrkkkkrrrrr.
      .rrrrrkkkkrrrrr.
      .rrrrrkkkkrrrrr.
      .rrrkkkkkkkkrrr.
      .rrrrrrkkrrrrrr.
      .rrrrrrkkrrrrrr.
      .rrrrrrrrrrrrrr.
      ..rrrrrrrrrrrr..
      ...rrrrrrrrrr...
      ................
    `),
  },
  'talent-skilling': {
    title: 'Skilling talents',
    mask: g(`
      ................
      ...llllllllll...
      ..llllllllllll..
      .llllllllllllll.
      .llllkkkkkkllll.
      .lllkkkkkkkklll.
      .lllkklkklkklll.
      .lllkllkkllklll.
      .llllllkkllllll.
      .llllllkkllllll.
      .llllllkkllllll.
      .llllllkkllllll.
      .llllllllllllll.
      ..llllllllllll..
      ...llllllllll...
      ................
    `),
  },
  'talent-afk': {
    title: 'AFK gains talents',
    mask: g(`
      ................
      ...pppppppppp...
      ..pppppppppppp..
      .pppppppppppppp.
      .pppkkkkkkppppp.
      .pppppppkkppppp.
      .ppppppkkpppppp.
      .pppppkkppppppp.
      .ppppkkpppppppp.
      .pppkkkkkkkkppp.
      .ppppppppkkkppp.
      .ppppppppkkkppp.
      .pppppppppppppp.
      ..pppppppppppp..
      ...pppppppppp...
      ................
    `),
  },
  'talent-defence': {
    title: 'Defence talents',
    mask: g(`
      ................
      ...iiiiiiiiii...
      ..iiiiiiiiiiii..
      .iiiiiiiiiiiiii.
      .iiippppppppiii.
      .iiippppppppiii.
      .iiippppppppiii.
      .iiippppppppiii.
      .iiiippppppiiii.
      .iiiippppppiiii.
      .iiiiippppiiiii.
      .iiiiiippiiiiii.
      .iiiiiiiiiiiiii.
      ..iiiiiiiiiiii..
      ...iiiiiiiiii...
      ................
    `),
  },
  'talent-utility': {
    title: 'Utility talents',
    mask: g(`
      ................
      ...gggggggggg...
      ..gggggggggggg..
      .gggggggggggggg.
      .ggggggwwgggggg.
      .ggggwwwwwwgggg.
      .ggggwwggwwgggg.
      .gggwwggggwwggg.
      .gggwwggggwwggg.
      .ggggwwggwwgggg.
      .ggggwwwwwwgggg.
      .ggggggwwgggggg.
      .gggggggggggggg.
      ..gggggggggggg..
      ...gggggggggg...
      ................
    `),
  },
  'talent-tab-1': {
    title: 'Talent tab 1',
    mask: g(`
      ................
      .wwwwwwwwwwwwww.
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzkkzzzzz..
      ..zzzzzkkzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzzzzzzzzz..
      ..zzzzz..zzzzz..
      ..zzzz....zzzz..
      ..zzz......zzz..
      ................
    `),
  },
  'talent-tab-2': {
    title: 'Talent tab 2',
    mask: g(`
      ................
      .wwwwwwwwwwwwww.
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiikkiikkiii..
      ..iiikkiikkiii..
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiiiiiiiiiii..
      ..iiiii..iiiii..
      ..iiii....iiii..
      ..iii......iii..
      ................
    `),
  },
  'talent-tab-3': {
    title: 'Talent tab 3',
    mask: g(`
      ................
      .wwwwwwwwwwwwww.
      ..gggggggggggg..
      ..gggggggggggg..
      ..gggggkkggggg..
      ..gggggkkggggg..
      ..gggggggggggg..
      ..gggggggggggg..
      ..gggkkggkkggg..
      ..gggkkggkkggg..
      ..gggggggggggg..
      ..gggggggggggg..
      ..ggggg..ggggg..
      ..gggg....gggg..
      ..ggg......ggg..
      ................
    `),
  },
  'talent-tab-4': {
    title: 'Talent tab 4',
    mask: g(`
      ................
      .wwwwwwwwwwwwww.
      ..mmmmmmmmmmmm..
      ..mmmmmmmmmmmm..
      ..mmmkkmmkkmmm..
      ..mmmkkmmkkmmm..
      ..mmmmmmmmmmmm..
      ..mmmmmmmmmmmm..
      ..mmmkkmmkkmmm..
      ..mmmkkmmkkmmm..
      ..mmmmmmmmmmmm..
      ..mmmmmmmmmmmm..
      ..mmmmm..mmmmm..
      ..mmmm....mmmm..
      ..mmm......mmm..
      ................
    `),
  },
};
