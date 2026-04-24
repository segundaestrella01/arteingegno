# Shopify data model scripts

GraphQL mutations that define the store's **product data model** for
Arte&Ingegno. Each file here creates exactly one metaobject or
metafield definition on the production Shopify store via the Admin
API.

**Target store:** `mattiastore-3117.myshopify.com` — the production
store. There is no dev / sandbox store on this project; everything
runs directly against production.

> Full design doc: Notion note **"Proposed product data model —
> variants, attributes, tags, metafields"** (page
> `34b5bef6-6256-819b-8ceb-c721b149e85d`).
> Visual: `../../product-data-model-diagram.svg`.

## What this is NOT

- **Not theme code.** Theme code lives under `sections/`, `snippets/`,
  `templates/`, `blocks/`, and `assets/` at the repo root. Updates to
  the theme that consume these new metafields/metaobjects are a
  separate piece of work.
- **Not an app.** These are one-shot admin operations, not a running
  service.

## Folder layout

```
scripts/shopify-data-model/
  metaobjects/            reusable cross-family records
    collection.graphql
    theme.graphql
  metafields/
    shared/               fields every product family has
    jewelry/              Jewelry-specific fields
    glass-sphere/         Glass sphere-specific fields
    fan/                  Fan-specific fields
```

The `artisan` metaobject and `dummy seed products` are intentionally
omitted (deferred by the user — see `HANDOFF.md`).

## Recommended run order

1. **Metaobjects first** — they're referenced by metafields of type
   `metaobject_reference`, so they must exist before the metafield
   definitions that point at them.
   1. `metaobjects/collection.graphql`
   2. `metaobjects/theme.graphql`

   Capture the returned definition IDs (`gid://shopify/MetaobjectDefinition/...`)
   — they're needed in step 2.
2. **Shared metafields** — every product uses these. Two of them
   (`theme_refs.graphql`, `editorial_collections.graphql`) need the
   metaobject IDs from step 1 substituted into the variables payload
   before execution.
3. **Per-family metafields** — `jewelry/` → `glass-sphere/` → `fan/`.

## How to run a file

1. Open the `.graphql` file.
2. Validate with `validate_graphql_codeblocks` (Shopify dev MCP,
   `api: "admin"`). All files in this folder were validated when
   committed, but re-validate if you've edited.
3. **Pre-check** the definition does not already exist on the store
   (see `HANDOFF.md` → "Pre-check pass" for the queries to run).
4. Execute against `mattiastore-3117.myshopify.com` via
   `admin-execution` mode (`shopify store auth mattiastore-3117.myshopify.com`,
   then `shopify store execute`).
5. Verify in the Shopify admin under
   **Settings → Custom data → Metaobjects** (or **Metafields →
   Products** for metafield definitions).
6. Append a one-line execution log to the Notion task
   *"Define product data model"* (page
   `34a5bef6-6256-81d9-9269-dbd28f707b0c`): timestamp, file path,
   returned definition ID, any user errors.

## Conventions

- **Namespaces**
  - Shared metafields: `custom.shared.*`
  - Type-scoped metafields: `custom.<product_type>.*` (e.g.
    `custom.jewelry.base_metal`)
  - Metaobjects: type name = singular snake-case (`collection`,
    `theme`)
- **Keys** — `snake_case`, English, no abbreviations that aren't
  already industry standard.
- **Names** — human-readable, capitalized, English (Shopify admin UI
  labels). Translations are handled via Shopify's translation tools,
  not by renaming keys.
- **One definition per file.** Keeps changes reviewable and re-runs
  targeted.
- **No unbounded text fields.** Use `multi_line_text_field` for long
  prose (Story, Care). Use `single_line_text_field` for short values.

## Re-run behavior

Creating a definition that already exists will error with a
`TAKEN`/`DUPLICATE` code from the Admin API. Treat that as a no-op —
it means a previous run already succeeded. Do **not** delete and
recreate to "clean up"; deletion cascades to existing metafield
values on products and there is no backup tool to recover from.
