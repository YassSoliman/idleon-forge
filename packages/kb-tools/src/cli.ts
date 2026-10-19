// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `pnpm kb <command>`: the Knowledge Base CLI (M11 TR-1). Dev only, never shipped.
//
//   generate [--check] [--only <gen>]   rebuild generated facts (FR-14, FR-15, FR-18)
//   compile [--git|--no-git]            write packages/knowledge/dist/knowledge.json (TR-7)
//   check [--strict]                    schema, references, Detectors and examples, privacy (TR-8)
//   golden [-u] [--only <id>] [--diff-base <ref>]   golden snapshots (TR-15)
//   scrub <raw.json> --id <id> [--now <iso>] [--owner <who>] [--consent <url>]   (TR-14)
//   privacy [--staged]                  the structural gate, plus the denylist gate when one exists
//   facts <system> | --mentions <gameVersion>   list facts (TR-19 A3, TR-11)
//   new <type> <system>/<slug>          print a schema-valid skeleton (TR-19 A4)
//   fixtures [--pin]                    public fixture manifest (TR-15)
process.env.TZ = 'UTC';

const [command, ...args] = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main(): Promise<number> {
  switch (command) {
    case 'generate': {
      const { runGenerateCommand } = await import('./commands');
      return runGenerateCommand({ check: flag('--check'), only: option('--only') });
    }
    case 'compile': {
      const { runCompileCommand } = await import('./commands');
      return runCompileCommand({ git: flag('--git') ? true : flag('--no-git') ? false : undefined });
    }
    case 'check': {
      const { runCheckCommand } = await import('./commands');
      return runCheckCommand({ strict: flag('--strict'), examples: !flag('--no-examples') });
    }
    case 'golden': {
      const { runGoldenCommand } = await import('./golden');
      return runGoldenCommand({
        update: flag('-u') || flag('--update'),
        only: option('--only'),
        diffBase: option('--diff-base'),
      });
    }
    case 'scrub': {
      const { runScrubCommand } = await import('./scrub/command');
      return runScrubCommand(args);
    }
    case 'privacy': {
      const { runPrivacyCommand } = await import('./scrub/gates');
      return runPrivacyCommand({ staged: flag('--staged'), files: args.filter((a) => !a.startsWith('--')) });
    }
    case 'facts': {
      const { runFactsCommand } = await import('./commands');
      return runFactsCommand(args);
    }
    case 'new': {
      const { runNewCommand } = await import('./commands');
      return runNewCommand(args);
    }
    case 'stage-fixtures': {
      const { runStageFixtures } = await import('./stage-fixtures');
      const problems = await runStageFixtures({ check: flag('--check') });
      for (const p of problems) console.error(p);
      return problems.length ? 1 : 0;
    }
    case 'convert-drafts': {
      const { runConvertDrafts } = await import('./convert-drafts');
      const problems = runConvertDrafts({ check: flag('--check') });
      for (const p of problems) console.error(p);
      return problems.length ? 1 : 0;
    }
    case 'fixtures': {
      const { runFixturesCommand } = await import('./commands');
      return runFixturesCommand({ pin: flag('--pin') });
    }
    default:
      console.log(
        'usage: pnpm kb <generate|compile|check|golden|scrub|privacy|facts|new|fixtures|stage-fixtures|convert-drafts> [options]\nsee packages/kb-tools/README in the M11 spec (TR-1)',
      );
      return command ? 2 : 0;
  }
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e);
    process.exit(1);
  },
);
