# shopify-mgr

A zero-dependency Node.js CLI for managing the Shopify data model
(metaobject and metafield definitions) across multiple stores.

Uses a single **Shopify Partner app** (one Client ID + Secret) that
authenticates against any store via OAuth. All secrets are stored in
a `.env` file at the project root — never in the codebase.

---

## Secrets: the .env file

All credentials live in `.env` at the project root. This file is
gitignored and should never be committed.

```dotenv
# Shopify Partner app credentials (one-time setup)
SHOPIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Per-store access tokens (added automatically by `auth`)
SHOPIFY_TOKEN_MATTIASTORE_3117=shpat_xxxxxxxxxxxxxxxx
SHOPIFY_TOKEN_ANOTHERSTORE_5678=shpat_yyyyyyyyyyyyyyyy
```

The token key is derived from the store's subdomain:
`mattiastore-3117.myshopify.com` → `SHOPIFY_TOKEN_MATTIASTORE_3117`

---

## How to get your Client ID and Client Secret

1. Go to [partners.shopify.com](https://partners.shopify.com) and log in.
2. Click **Apps** → **Create app** → **Create app manually**.
3. Name it anything (e.g. "Store Data Manager").
4. Go to **Configuration** and add this redirect URI:
   ```
   http://localhost:3456/callback
   ```
5. Under **API access → Access scopes**, add:
   ```
   read_products, write_products, read_metaobjects, write_metaobjects
   ```
6. Save. Then open **Client credentials** — your Client ID and Client
   Secret are there.

---

## One-time setup

```bash
node scripts/shopify-mgr/cli.js configure
```

Prompts for Client ID and Secret, writes them to `.env`.

---

## Authenticating a store

```bash
node scripts/shopify-mgr/cli.js auth mattiastore-3117.myshopify.com
```

Opens your browser at Shopify's authorization page. On approval, the
CLI exchanges the code for an offline access token and appends it to
`.env` as `SHOPIFY_TOKEN_MATTIASTORE_3117=shpat_…`.

You only need to do this once per store. The token is permanent unless
the app is uninstalled from that store.

---

## Commands

### List authenticated stores
```bash
node scripts/shopify-mgr/cli.js stores
```

### Check existing definitions
```bash
node scripts/shopify-mgr/cli.js schema check mattiastore-3117.myshopify.com
```

### Apply all definitions
```bash
# Preview first
node scripts/shopify-mgr/cli.js schema apply mattiastore-3117.myshopify.com --dry-run

# Execute
node scripts/shopify-mgr/cli.js schema apply mattiastore-3117.myshopify.com
```

Definitions that already exist on the store are silently skipped.

### Apply a single file
```bash
node scripts/shopify-mgr/cli.js schema apply mattiastore-3117.myshopify.com metaobjects/collection.graphql
```

Paths are relative to `scripts/shopify-data-model/`.

---

## How metaobject IDs are resolved automatically

`theme_refs.graphql` and `editorial_collections.graphql` need the GIDs
of metaobject definitions that must exist first. The CLI resolves these
at runtime by querying the store — no manual copy-pasting of IDs.

---

## Reusing for a new store / new project

**New store, same project:** just run `auth <new-store>`. The credentials
in `.env` are shared; a new token line is appended.

**New project:** copy `scripts/shopify-mgr/` into the new repo, place
your `.graphql` files under `scripts/shopify-data-model/`, update
`APPLY_ORDER` in `lib/schema.js`, and run `configure` + `auth`.
The Partner app (Client ID + Secret) is the same across all your projects.

---

## File layout

```
scripts/shopify-mgr/
  cli.js              Entry point
  lib/
    auth.js           OAuth flow (local HTTP server redirect catcher)
    client.js         Shopify Admin GraphQL client (fetch wrapper)
    config.js         Reads / writes .env at the project root
    schema.js         .graphql parser, check, applyFile, applyAll
  README.md           This file

.env                  Secrets — gitignored, never committed
```
