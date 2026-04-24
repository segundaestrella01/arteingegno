# Shopify data model scripts

GraphQL mutations that define the store's **product data model** for
Arte&Ingegno. Each file here creates or updates exactly one metaobject
or metafield definition on a Shopify store via the Admin API.

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
    artisan.graphql
  metafields/
    shared/               fields every product family has
    jewelry/              Jewelry-specific fields
    glass-sphere/         Glass sphere-specific fields
    fan/                  Fan-specific fields
  products/
    dummy/                seed data for dev store smoke tests
```

## Recommended run order (first-time setup)

1. **Metaobjects first** — they're referenced by metafields of type
   `metaobject_reference`, so they must exist before the metafield
   definitions that point at them.
   1. `metaobjects/collection.graphql`
   2. `metaobjects/theme.graphql`
   3. `metaobjects/artisan.graphql`
2. **Shared metafields** — the common attributes every product uses.
3. **Per-family metafields** — jewelry, then glass-sphere, then fan.
4. **Seed dummy products** (dev store only) to smoke-test the model.

## How to run a file

Assuming the Shopify dev MCP is configured in this project's Claude
Code session:

1. Open the `.graphql` file.
2. Validate with `validate_graphql_codeblocks` (MCP tool,
   `api: "admin"`).
3. If validation passes, execute against the **dev store** via
   `admin-execution` mode (`shopify store auth` to the dev store, then
   `shopify store execute`).
4. Verify in the Shopify admin that the definition appeared as
   expected.
5. Only after dev-store verification do we repeat steps 3–4 against
   the production store — and only with explicit user confirmation in
   the same turn.

## Conventions

- **Namespaces**
  - Shared metafields: `custom.shared.*`
  - Type-scoped metafields: `custom.<product_type>.*` (e.g.
    `custom.jewelry.base_metal`)
  - Metaobjects: type name = singular snake-case (`collection`,
    `theme`, `artisan`)
- **Keys** — `snake_case`, English, no abbreviations that aren't
  already industry standard.
- **Names** — human-readable, capitalized, English (Shopify admin UI
  labels). Translations are handled via Shopify's translation tools,
  not by renaming keys.
- **One definition per file.** Keeps PRs reviewable and re-runs
  targeted.
- **No unbounded text fields.** Use `multi_line_text_field` for long
  prose (Story, Care). Use `single_line_text_field` for short values.

## Re-run behavior

Creating a definition that already exists will error with a
`TAKEN`/`DUPLICATE` code from the Admin API. Treat that as a no-op —
it means the previous run succeeded. Do **not** delete and recreate to
"clean up"; deletion can cascade to existing metafield values on
products.
