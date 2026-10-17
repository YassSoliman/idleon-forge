# Deploying ActiveOn

ActiveOn is an assets-only Cloudflare Worker: `apps/activeon/dist/` served as static assets in SPA
mode ([`apps/activeon/wrangler.jsonc`](../../apps/activeon/wrangler.jsonc)). No Worker script, no
bindings, no runtime secrets. Research: `docs/research/2026-10-16-hosting.md` on the
[`research/hosting`](https://github.com/YassSoliman/idleon-forge/tree/research/hosting) branch.

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs `wrangler deploy` on every
push to `main` (and on manual dispatch), inside the GitHub **production** environment. Until the
setup below is done, that workflow fails at the deploy step; that is expected.

## One-time setup (repository owner)

1. **Cloudflare API token:** Cloudflare dashboard → Manage account → Account API tokens → Create
   token → "Edit Cloudflare Workers" template, scoped to the one account. Copy the token.
2. **Account ID:** Cloudflare dashboard → Workers & Pages → Account details → Account ID.
3. **GitHub environment:** repository Settings → Environments → New environment `production`.
   - Deployment branches and tags: "Selected branches and tags", add `main`.
   - Environment secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
     `VITE_GOOGLE_OAUTH_CLIENT_SECRET`.
   - Environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_GOOGLE_OAUTH_CLIENT_ID` (values: [`live-sign-in.md`](live-sign-in.md)).
4. Re-run the Deploy workflow (Actions → Deploy → Run workflow). The site appears at
   `https://activeon.<your-subdomain>.workers.dev`.

Do not also connect Cloudflare Workers Builds to this Worker: that would be a second deploy path
outside the GitHub gates.

## Manual deploy (owner only)

```sh
pnpm build                       # with apps/activeon/.env.local filled in
cd apps/activeon && pnpm exec wrangler deploy   # uses your wrangler login
```

`pnpm exec wrangler deploy --dry-run` validates the config without an account.

## Not yet

- **Per-PR Worker Previews** (`wrangler preview --name pr-<N>`, Wrangler ≥ 4.136.3, already pinned):
  a follow-up. Fork PRs never get secrets, so they will need a maintainer-gated step.
- **Custom domain:** pick it early. Changing origin later empties every player's browser storage
  (saved sign-in included).
