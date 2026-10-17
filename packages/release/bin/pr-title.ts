// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The `PR title` check. Reads PR_TITLE and PR_BODY from the environment (never interpolated into a
// shell), prints GitHub annotations, exits 1 on an error. Warnings never fail it (D2).
import { checkPr } from '../src/pr-title.ts';

const { errors, warnings } = checkPr(process.env.PR_TITLE ?? '', process.env.PR_BODY ?? '');
for (const w of warnings) console.log(`::warning title=What's new::${w}`);
for (const e of errors) console.log(`::error title=PR title::${e}`);
if (!errors.length) console.log('PR title OK');
process.exit(errors.length ? 1 : 0);
