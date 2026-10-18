# Game-code oracles

An oracle runs **the game's own code**, copied verbatim from the client (`N.js`), on one save. Its output
is the "verified" value a port of ours is tested against ([ADR 0010](../../docs/adr/0010-exact-talent-point-totals.md)).
It is read-only. It never touches the game, Firebase or the network, apart from downloading `N.js`.

**Never commit `N.js`.** Pass a local copy with `--n`. Without one, the script downloads the client to the
OS temp folder (`$TMPDIR/idleon-forge-N.js`). The client URL changes per patch; the current one is in
[`packages/truth/src/game-data.ts`](../../packages/truth/src/game-data.ts).

## `bubba-oracle.cjs` (M23 X1)

```sh
node scripts/oracle/bubba-oracle.cjs packages/account-state/fixtures/public/latest.json --companion51 0
node scripts/oracle/bubba-oracle.cjs packages/account-state/fixtures/public/highend.json --companion51 2
```

The script extracts `_customBlock_Bubbastuff`, `cb.BubbaUpg` and `cb.Spelunky`, evaluates them in a
`node:vm` sandbox over the save's `Bubba` record, and prints JSON: `DailyPetting`, `CharismaTraitREQ`/`SPD`,
`CharismaBonus` now and at +1 level, the banked levels (the `ActorEvents_713` tick run to the end), the
next Bubba Boon level's delta, the Megaflesh multiplier and the three discount ratios.

- `--companion51` is the game's `Companions(51)` for that account: Toolbox's companion list `.bonus`, or 0
  when the companion isn't active. It is a lookup, not Bubba math.
- Minehead and the menagerie cheapener are stubbed, because they scale every `UpgCost` alike and cancel
  in the ratios. The script never prints a cost itself.

The two public saves' output is pinned in `packages/account-state/test/bubba-x1.test.ts` (`ORACLE`). After a
game patch, re-run it on both saves and compare. A changed value means the port in
`packages/account-state/src/bubba-x1.ts` needs re-reading against `N.js`.

Run it only on public or scrubbed saves when the output goes anywhere that is committed. Never quote a real
save's account data.
