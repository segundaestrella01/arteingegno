# 0001 — Shared tag convention for mega-menu category hover panels

## Status

Accepted

## Context

The "Collezioni" mega-menu dropdown (and any other header-menu top-level item with children)
used to show a right-side "featured content" panel that was static for the whole dropdown —
computed once from the top-level link, not from whichever category a visitor was hovering. This
read as unrelated/broken content next to the hovered category.

`snippets/mega-menu-list.liquid` now supports a `category_hover_products` menu style: hovering a
left-column category swaps the right panel to show that category's own collection, filtered down
to products carrying a single shared tag. The panels are pre-rendered (hidden) server-side and
swapped via CSS `:has()`/`:hover`/`:focus` — no fetch, no JS state.

## Decision

The tag string is configured **once per header-menu block**, in the theme editor: **Header
section → Menu block → Submenu feature → Media type → "Category-featured products" → Shared
product tag** (setting id `category_hover_tag`, schema default `menu-featured`).

Because the tag lives in a theme setting rather than in the product data model docs, it's easy for
a future editor to lose track of which tag makes a product eligible for a hover panel. This ADR is
the place to look it up before tagging a product, instead of reverse-engineering it from theme
settings.

**Live tag value(s) in use** — update this table whenever a header-menu block's Media type is set
to "Category-featured products", or the tag value is changed:

| Menu block (theme / section) | Tag in use | Notes |
|---|---|---|
| _(none live yet — fill in once enabled)_ | `menu-featured` (schema default) | |

Rules:
- **Tags are case-sensitive.** The tag on the product must match the theme setting exactly.
- **One shared tag per header-menu block**, reused across every category in that menu — not one
  tag per category. A product becomes eligible for whichever category's hover panel it belongs to
  (by collection membership) simply by carrying this tag.
- Per `CLAUDE.md`'s existing tag rules ("Tags — reserved for internal operational flags only... never
  for customer-facing taxonomy"), this tag is an internal/operational flag (it drives layout, not
  customer-visible taxonomy) and fits the same convention — treat it the same way as `new-in` /
  `restock-soon` when deciding whether a product should carry it.

## Consequences

- Products need this exact tag applied deliberately — it won't happen implicitly from being in a
  collection.
- The hover-panel scan only looks at the first ~50 products of each category's collection
  (Liquid's default `collection.products` window; no `{% paginate %}` override was added to keep
  the per-category scan cheap). A collection with more than 50 products whose tagged items sort
  past position 50 won't surface in the hover panel — reorder the collection or keep tagged items
  near the front if this becomes an issue.
- Changing the tag value in the theme editor immediately changes which products qualify across
  every category in that menu — there's no per-category override.
