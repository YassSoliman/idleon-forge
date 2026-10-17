// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Safe YAML for untrusted Knowledge Base files (TR-2 notes, TR-18): the core schema, no merge keys,
// no anchors or aliases, unique keys, a 256 KB cap per file, and every error mapped to its line.
import { type Document, isAlias, isNode, LineCounter, parseDocument, visit } from 'yaml';

export const MAX_YAML_BYTES = 256 * 1024;

export class YamlError extends Error {
  override name = 'YamlError';
  constructor(
    readonly file: string,
    readonly line: number,
    message: string,
  ) {
    super(`${file}:${line} ${message}`);
  }
}

export interface LoadedYaml {
  file: string;
  value: unknown;
  /** 1-based line of the node at `path` (or of its nearest existing parent); 1 when unknown. */
  lineOf(path: readonly (string | number)[]): number;
}

export function loadYaml(file: string, text: string): LoadedYaml {
  if (Buffer.byteLength(text, 'utf8') > MAX_YAML_BYTES) throw new YamlError(file, 1, 'file is over 256 KB');
  const lineCounter = new LineCounter();
  const doc: Document = parseDocument(text, {
    schema: 'core',
    merge: false,
    uniqueKeys: true,
    prettyErrors: true,
    lineCounter,
  });
  const first = doc.errors[0];
  if (first)
    throw new YamlError(file, first.linePos?.[0]?.line ?? 1, first.message.split('\n')[0] ?? first.message);
  let bad: { line: number; what: string } | null = null;
  visit(doc, (_key, node) => {
    if (bad) return visit.BREAK;
    if (isAlias(node))
      bad = { line: lineCounter.linePos(node.range?.[0] ?? 0).line, what: 'aliases are not allowed' };
    else if (isNode(node) && node.anchor)
      bad = { line: lineCounter.linePos(node.range?.[0] ?? 0).line, what: 'anchors are not allowed' };
    else if (isNode(node) && node.tag && !node.tag.startsWith('tag:yaml.org,2002:'))
      bad = {
        line: lineCounter.linePos(node.range?.[0] ?? 0).line,
        what: `custom tag ${node.tag} is not allowed`,
      };
    return undefined;
  });
  if (bad) {
    const b = bad as { line: number; what: string };
    throw new YamlError(file, b.line, b.what);
  }
  const value = doc.toJS({ maxAliasCount: 0 });
  return {
    file,
    value,
    lineOf(path) {
      for (let n = path.length; n >= 0; n--) {
        const node = doc.getIn(path.slice(0, n), true);
        if (isNode(node) && node.range) return lineCounter.linePos(node.range[0]).line;
      }
      return 1;
    },
  };
}
