// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The `PR title` required check (M12 FR-25, FR-29, TR-1).
import { CONVENTIONAL_TYPES, parseTitle, parseWhatsNewLine } from './commits.ts';
import { MAX_TEXT, plainText } from './whats-new.ts';

export interface PrCheck {
  errors: string[];
  warnings: string[];
}

export function checkPr(title: string, body: string): PrCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = parseTitle(title);
  if (!parsed) {
    errors.push(
      `PR title must be a Conventional Commit: <type>(<scope>)!: <description>, type one of ${CONVENTIONAL_TYPES.join(', ')}`,
    );
  }
  const line = parseWhatsNewLine(body);
  if (line?.kind === 'text') {
    const text = plainText(line.text);
    if (text.length > MAX_TEXT)
      errors.push(`The What's-new: line is ${text.length} characters; keep it to ${MAX_TEXT}`);
  }
  if (parsed && (parsed.type === 'feat' || parsed.type === 'fix') && !line) {
    warnings.push(
      `No What's-new: line; players will see the title ("${parsed.description}"). Add one, or "What's-new: none".`,
    );
  }
  return { errors, warnings };
}
