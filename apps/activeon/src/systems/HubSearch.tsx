// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 (board m25/SystemsSearch.dc.html): the Systems hub's search field, an editable combobox with a
// list of matches as you type (ARIA APG "combobox with list autocomplete"). "/" anywhere focuses it,
// ArrowDown/ArrowUp move in the list (focus stays in the field, `aria-activedescendant`), Enter opens
// the active match (or the first), Escape clears. Matched letters are highlighted.
import { INDEX_WORDS } from '@idleon-forge/engine/systems-ui';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { SystemIcon } from './frame/SystemIcon';
import { highlightRuns, type SearchResult } from './hub-search';

const W = INDEX_WORDS.search;
/** Rule 3: a short list; the grid below shows every match. */
export const LIST_MAX = 8;

const typingIn = (el: Element | null) =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    (el as HTMLElement).isContentEditable);

function Marked({ text, hits }: { text: string; hits: readonly number[] }) {
  return (
    <>
      {highlightRuns(text, hits).map((r, i) =>
        r.hit ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional and never reorder
          <mark key={i} className="sx-hit">
            {r.text}
          </mark>
        ) : (
          r.text
        ),
      )}
    </>
  );
}

export interface HubSearchProps {
  query: string;
  onQuery(q: string): void;
  /** Matches after the filters, best first. */
  results: readonly SearchResult[];
  onOpen(id: string): void;
}

export function HubSearch({ query, onQuery, results, onOpen }: HubSearchProps) {
  const id = useId();
  const listId = `${id}-list`;
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const shown = results.slice(0, LIST_MAX);
  const expanded = open && query.trim() !== '' && shown.length > 0;

  // "/" focuses the search from anywhere on the hub, unless the player is typing somewhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || typingIn(document.activeElement)) return;
      e.preventDefault();
      input.current?.focus();
      input.current?.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // The active option follows the list: a new query starts with nothing active.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on each new query only
  useEffect(() => setActive(-1), [query]);

  const pick = (i: number) => {
    const r = shown[i] ?? shown[0];
    if (!r) return;
    setOpen(false);
    onOpen(r.id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!expanded) {
          setOpen(true);
          if (e.altKey) return;
          setActive(0);
          return;
        }
        setActive((a) => (a + 1) % shown.length);
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActive(shown.length - 1);
          return;
        }
        setActive((a) => (a <= 0 ? shown.length - 1 : a - 1));
        return;
      case 'Enter':
        if (query.trim() === '' || shown.length === 0) return;
        e.preventDefault();
        pick(active);
        return;
      case 'Escape':
        if (query !== '' || open) {
          e.preventDefault();
          setOpen(false);
          onQuery('');
        }
        return;
      case 'Home':
      case 'End':
        // APG: these move the caret in the field, so the list's active option clears.
        setActive(-1);
        return;
      default:
        return;
    }
  };

  const optionId = (i: number) => `${id}-opt-${i}`;
  const status = query.trim() === '' ? '' : results.length === 0 ? W.none : W.count(results.length);

  return (
    <search className="sx-search">
      <div className="sx-search__box">
        <svg
          className="sx-search__glass"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 8 8"
          shapeRendering="crispEdges"
        >
          <rect x="1" y="0" width="3" height="1" fill="currentColor" />
          <rect x="0" y="1" width="1" height="3" fill="currentColor" />
          <rect x="4" y="1" width="1" height="3" fill="currentColor" />
          <rect x="1" y="4" width="3" height="1" fill="currentColor" />
          <rect x="4" y="4" width="1" height="1" fill="currentColor" />
          <rect x="5" y="5" width="1" height="1" fill="currentColor" />
          <rect x="6" y="6" width="2" height="2" fill="currentColor" />
        </svg>
        <label className="sr-only" htmlFor={`${id}-input`}>
          {W.label}
        </label>
        <input
          ref={input}
          id={`${id}-input`}
          className="sx-search__input"
          type="text"
          role="combobox"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          aria-keyshortcuts="/"
          placeholder={W.placeholder}
          value={query}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="sx-search__clear"
            aria-label={W.clearQuery}
            onClick={() => {
              onQuery('');
              input.current?.focus();
            }}
          >
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 6 6" shapeRendering="crispEdges">
              <rect x="0" y="0" width="2" height="2" fill="currentColor" />
              <rect x="4" y="0" width="2" height="2" fill="currentColor" />
              <rect x="2" y="2" width="2" height="2" fill="currentColor" />
              <rect x="0" y="4" width="2" height="2" fill="currentColor" />
              <rect x="4" y="4" width="2" height="2" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <kbd className="sx-search__key" title={W.keyHint}>
            {W.key}
          </kbd>
        )}
      </div>
      <div className="sx-pop" hidden={!expanded}>
        <div id={listId} className="sx-list" role="listbox" aria-label={W.listLabel}>
          {expanded
            ? shown.map((r, i) => (
                <div
                  key={r.id}
                  id={optionId(i)}
                  role="option"
                  // APG: options take no tab stop; the field keeps focus and points at them.
                  tabIndex={-1}
                  aria-selected={i === active}
                  className={`sx-opt${i === active ? ' sx-opt--on' : ''}`}
                  // Keep focus in the field: the option is chosen on mouse down, before the blur.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(i);
                  }}
                  onMouseMove={() => setActive(i)}
                >
                  <span className="sx-opt__ic">
                    <SystemIcon id={r.id} size={24} />
                  </span>
                  <span className="sx-opt__text">
                    <span className="sx-opt__name">
                      <Marked text={r.name} hits={r.hits} />
                    </span>
                    {r.via ? (
                      <span className="sx-opt__via">
                        {r.via.kind === 'alias' ? W.aliasLead : W.sectionLead}
                        <Marked text={r.via.text} hits={r.via.hits} />
                        {r.via.kind === 'alias' ? W.aliasEnd : null}
                      </span>
                    ) : null}
                  </span>
                  <span className="sx-opt__world">{INDEX_WORDS.worldName(r.world)}</span>
                </div>
              ))
            : null}
        </div>
        <p className="sx-pop__keys" aria-hidden="true">
          {W.keys}
        </p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </search>
  );
}
