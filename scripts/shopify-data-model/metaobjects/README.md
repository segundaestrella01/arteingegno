# Metaobject definitions

Reusable cross-family records. Each metaobject is a small structured
entity that multiple products can reference.

| File                  | Metaobject type | Purpose                                                                 |
|-----------------------|-----------------|-------------------------------------------------------------------------|
| `collection.graphql`  | `collection`    | Editorial / marketing groupings (distinct from Shopify's Collections)   |
| `theme.graphql`       | `theme`         | Thematic tags shown to customers (nautical, zodiac, celestial, etc.)    |

## Deferred

`artisan` (public maker attribution) is **deferred** by user decision.
Do not create the `artisan` metaobject definition or its associated
`custom.shared.artisan` metafield until the user explicitly revisits
the question. Anything customer-facing about who made a piece is, for
now, attributed to "Arte&Ingegno" the brand.

## Why metaobjects instead of tags?

Tags are opaque strings with no structure. A `theme` metaobject has a
name, a description, a hero image, and a slug — so the storefront can
render a dedicated theme page with real content, not just a filter
chip.

## Naming note

We use `collection` as the metaobject type even though Shopify has a
built-in product Collection concept. These "editorial collections" are
a **curatorial** artifact (e.g. "Summer 2026 capsule", "Gift ideas
under €50") that spans multiple Shopify Collections and product
types. Keep the distinction clear in the admin UI by naming the
metaobject **"Editorial collection"** in its display name.

## Run order

Run `collection.graphql` → `theme.graphql`. Order within this folder
only matters if one metaobject references another; at the time of
writing, they're independent.

After both succeed, capture the returned `gid://shopify/MetaobjectDefinition/...`
IDs — they need to be substituted into the variables payload of the
shared metafields that reference them
(`metafields/shared/theme_refs.graphql`,
`metafields/shared/editorial_collections.graphql`).
