// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 3e14ee1dec06800dd5357337f9dc1b347f7a2f58.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Title, description and noindex for the exported HTML, resolved in one place because _app's
// <Head> renders all three and a page's own <NextSeo> re-renders them after hydration - the two
// must not disagree about what a page is called or whether it may be indexed.
//
// A data page renders DataLoadingWrapper's loader during `next build`, so its own <NextSeo> never
// runs and the export would carry no title. _app rebuilds the tags from PAGE_SEO, keyed by route
// pattern, overridden by whatever the page put in static props.
//
// The canonical URL is deliberately not here: it comes from asPath, so that it follows
// client-side navigation - which a value resolved from build-time props cannot do.

export function resolveSeoHead({ pageProps, pageSeo }) {
  return {
    title: pageProps?.seoTitle || pageSeo?.title || null,
    description: pageProps?.seoDescription || pageSeo?.description || null,
    // PAGE_SEO is keyed by route pattern, so pages generated from one dynamic route share an
    // entry - a class page with no builds carries its own noindex through static props.
    noindex: pageProps?.seoNoindex ?? pageSeo?.noindex ?? false
  };
}

// The visible heading is the title without the site suffix, rendered only by PageTitle.
export function headingOf(title) {
  return title?.replace(/\s*[|\-–—]\s*Idleon Toolbox\s*$/i, '')?.trim() || null;
}
