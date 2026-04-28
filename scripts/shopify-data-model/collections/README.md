# Collections

GraphQL mutations that create the Shopify Collections used by the
homepage product-list sections.

These are **Shopify native Collections** (navigational groupings), not
the `brand_collection` editorial metaobject defined under `metaobjects/`.

## Collections

| File | Handle | Type | Tag rule |
|------|--------|------|----------|
| `new-arrivals.graphql` | `new-arrivals` | Smart | `tag = new-in` |
| `homepage-jewelry.graphql` | `homepage-jewelry` | Smart | `tag = jewelry_homepage` |

## Tagging contract

To populate a collection, tag a product in the Shopify admin:

- **New Arrivals** — add tag `new-in` (existing operational flag, see CLAUDE.md)
- **Homepage Jewelry** — add tag `jewelry_homepage`

Remove the tag to take a product out of the collection automatically.

## How to run

1. Validate with `validate_graphql_codeblocks` (Shopify dev MCP, `api: "admin"`).
2. Pre-check that the handle doesn't already exist:
   ```graphql
   { collections(first: 5, query: "handle:new-arrivals") { edges { node { id handle } } } }
   ```
3. Execute against `mattiastore-3117.myshopify.com` via `admin-execution` mode.
4. Verify under Shopify admin → Products → Collections.
