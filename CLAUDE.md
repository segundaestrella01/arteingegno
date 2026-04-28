# Arte&Ingegno — project memory

## Notion workspace

When the user asks to update, read from, or write to the Notion project for
Arte&Ingegno, ALWAYS use the following page and databases (do not create new
ones, do not fall back to the shared Projects / Tasks / Project notes
databases used by other projects):

- **Project page** — "Arte&Ingegno"
  URL: https://www.notion.so/34a5bef6625680d4aebdce9a23c09dc9
  ID:  34a5bef6-6256-80d4-aebd-ce9a23c09dc9

- **Dedicated Notes database** — "Project notes"
  URL:           https://www.notion.so/e9e1c32d2bbf46a593ffeeb1a21442d1
  Database ID:   e9e1c32d-2bbf-46a5-93ff-eeb1a21442d1
  Data source:   collection://b095a880-a0fd-46aa-9d06-6172203bb7c7

- **Dedicated Tasks database** — "Tasks"
  URL:           https://www.notion.so/8bd8f6a12246483bb6f3f569beef0aaa
  Database ID:   8bd8f6a1-2246-483b-b6f3-f569beef0aaa
  Data source:   collection://5b94e1d9-b664-4157-a302-003217368469

### Notes
- Schemas mirror the shared Project notes and Tasks DBs used by other
  projects, so existing playbooks for creating notes/tasks still apply.
- No AI Summary field is used on this project — do not add one.
- The project page lives under the "SegundaEstrella" parent page, not under
  the shared "Projects" database.

### Default source of truth for notes & tasks
Whenever the user references notes or tasks related to this project
(e.g. "what are the next tasks", "what does the note say about X",
"add a task", "update the plan", etc.), ALWAYS fetch them from the
Arte&Ingegno Notion project page and its linked databases — do not
rely on memory, prior context, or local files.

- Canonical project page to fetch from:
  https://www.notion.so/Arte-Ingegno-34a5bef6625680d4aebdce9a23c09dc9?source=copy_link
  (page ID: 34a5bef6-6256-80d4-aebd-ce9a23c09dc9)

Use the Notion tools (fetch / search / query_database_view) against
this page and the two dedicated databases listed above before
answering. If content lives in a child page or note (e.g. the
"Technical Project Plan"), follow the links from the project page
and fetch the child page too.

---

## Repository overview

This repo contains **two** distinct things:

1. **A Shopify theme** (root level: `assets/`, `blocks/`, `config/`,
   `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`) — based
   on Shopify's **Horizon** theme v3.5.1. Managed/deployed with the
   Shopify CLI (`shopify theme dev` / `push` / `pull`). See `README.md`.

2. **Store configuration scripts** under `scripts/` — GraphQL mutations
   and small automation files that define the store's data model
   (metaobjects, metafield definitions, product taxonomy). These are
   meant to be executed against the Shopify Admin API via the Shopify
   dev MCP in `admin-execution` mode, NOT as theme code.

Keep the two concerns separate: theme code should never be mutated just
to satisfy a data model change, and data model scripts should never
reach into Liquid templates.

## Shopify dev workflow

### Target store
- **Production store handle:** `mattiastore-3117.myshopify.com`
- There is **no dev / sandbox store** for this project. All data-model
  work is applied directly to production.
- There is **no automated backup tool** (no Rewind, no BackupMaster).
  This is a deliberate choice — additive definitions are low-risk —
  but it means typo'd keys are effectively permanent (deleting a
  definition cascades to any data stored under it).

### Tools we use
- **Shopify CLI** — `shopify theme dev/push/pull`, and
  `shopify store auth` / `shopify store execute` for Admin API calls.
- **Shopify dev MCP** (this repo's Claude Code session has it
  configured) — two modes:
  - `admin` — design and validate GraphQL queries/mutations
    (non-executing).
  - `admin-execution` — run validated operations against a real store.
- `validate_graphql_codeblocks` — **always** run this against any
  GraphQL operation BEFORE executing it. No exceptions.

### Golden rules
1. **Validate before you execute.** Every GraphQL mutation must go
   through `validate_graphql_codeblocks` first. If validation fails,
   fix and re-validate — do not "try it and see". This rule is the
   only safety net we have, since we run straight against production.
2. **Additive only, by default.** Creating new metaobject /
   metafield definitions is fine. Anything destructive (deleting
   definitions, deleting products/variants, bulk-overwriting existing
   metafield values) requires an **explicit user confirmation in the
   current turn** before execution.
3. **Read before you write.** Before creating a definition, query the
   Admin API to check whether one with the same `type` (metaobject)
   or `namespace + key` (metafield) already exists. If it does, skip —
   do not "fix" it by deleting and recreating.
4. **One change, one file.** Each metaobject or metafield definition
   lives in its own `.graphql` file under `scripts/shopify-data-model/`.
   Do not bundle unrelated definitions into one mutation.
5. **Idempotency matters.** A duplicate-key error from the Admin API
   on re-run should be treated as a no-op, not a failure. Pre-check
   beats catching the error after the fact.
6. **Don't invent fields.** If `validate_graphql_codeblocks` reports a
   field doesn't exist, search the Shopify dev docs via the MCP
   (`search_docs_chunks`) rather than guessing.
7. **Pause and ask before anything that touches existing products.**
   Definition creates don't touch products. Anything that does
   (productUpdate, metafieldsSet on an existing product,
   bulkOperationRunMutation that writes to products) needs explicit
   user confirmation.

## Product data model (authoritative summary)

**Full spec** lives in the Notion note *"Proposed product data model —
variants, attributes, tags, metafields"* (note page
`34b5bef6-6256-819b-8ceb-c721b149e85d`). A visual overview is in
`product-data-model-diagram.svg` at the repo root. Always read the
Notion note before making structural changes — it is the source of
truth.

Short version:

- **Three product types** (Shopify "product type" field):
  - `Jewelry` — gold-plated brass pieces.
  - `Glass sphere` — themed decorative glass spheres.
  - `Fan` — high-end fans.
- **Variants** — only for true SKU-level differences (size / finish /
  chain length). Max 3 option dimensions per Shopify's limits.
- **Product-type-scoped metafields** — stored under the namespace
  `custom.<type>.*` (e.g. `custom.jewelry.base_metal`). These describe
  properties specific to one family.
- **Shared metafields** — stored under `custom.shared.*`. These are
  fields every product family uses (Story, Care, Handcrafted flag,
  Lead time, etc.).
- **Metaobjects** (reusable cross-family records) — namespace root
  `custom_objects`:
  - `collection` (marketing/editorial groupings — distinct from
    Shopify's built-in "Collections")
  - `theme` (nautical, zodiac, celestial, etc.)
  - **DEFERRED:** `artisan` (public-facing maker attribution) — the
    user has decided not to surface artisan information publicly for
    now. Do not create the `artisan` metaobject or the matching
    `custom.shared.artisan` metafield until the user explicitly
    revisits this.
- **Tags** — reserved for internal operational flags only (e.g.
  `new-in`, `restock-soon`, `photo-needed`). Never for customer-facing
  taxonomy — use metafields / metaobjects for that.

## Scripts folder layout

```
scripts/shopify-data-model/
  README.md                    — top-level overview, run order
  metaobjects/
    README.md
    collection.graphql
    theme.graphql
  metafields/
    shared/
      README.md
      <one file per definition>
    jewelry/
      README.md
      <one file per definition>
    glass-sphere/
      README.md
      <one file per definition>
    fan/
      README.md
      <one file per definition>
```

When adding a new definition: create one `.graphql` file, validate it
with `validate_graphql_codeblocks`, then execute it against
`mattiastore-3117.myshopify.com`. Update the Notion task referencing
the file path with a one-line execution log (timestamp + returned ID
+ any user errors).

## Safety checklist before each execution against production

- [ ] GraphQL validated with `validate_graphql_codeblocks`.
- [ ] Pre-check query confirms the definition does not already exist
      (avoid duplicate-key error churn).
- [ ] Change is additive (creating a new definition/field), OR the
      user has explicitly confirmed a destructive change in this turn.
- [ ] A Notion task exists tracking the change.

There is no separate "dev store passed" gate because there is no dev
store on this project. The validation step is doing double duty.

## What NOT to do

- Don't edit theme files (`sections/`, `snippets/`, `templates/`,
  `blocks/`, `assets/`) as part of a data-model change. Theme updates
  to consume new metafields are a separate task.
- Don't run `shopify theme push` without being asked — theme sync is a
  deliberate step, not a side effect.
- Don't add an `AI Summary` field in Notion for this project.
- Don't fall back to the shared Projects/Tasks/Notes databases — always
  use the three Arte&Ingegno-specific IDs above.
