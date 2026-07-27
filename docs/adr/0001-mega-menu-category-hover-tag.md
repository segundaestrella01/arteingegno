# 0001 — Shared tag convention for mega-menu category hover panels

## Status

Accepted — **feature currently disabled** (2026-07-27). The header-menu block's
`menu_style` was switched from `category_hover_products` back to `text` in
`sections/header-group.json`, as part of flattening the top menu (Collezioni's dropdown
children promoted to top-level items, Contatti removed).

A first attempt kept the original settings as an extra inert block object next to the
live `header-menu` block in that same file, but Shopify's section schema validates every
entry under `blocks` — this section only permits its two declared static blocks, so any
extra key is rejected outright ("Blocks are not allowed in this context"), even one
nothing renders. The backup below lives here in the ADR instead, since this file isn't
parsed by Shopify.

**To restore:** paste the block below over the live `header-menu` block's `settings` in
`sections/header-group.json`.

```json
{
  "menu": "main-menu",
  "color_scheme": "",
  "type_font_primary_size": "0.875rem",
  "menu_font_style": "inverse",
  "type_font_primary_link": "body",
  "type_case_primary_link": "none",
  "menu_style": "category_hover_products",
  "category_hover_tag": "menu-featured",
  "category_hover_aspect_ratio": "4 / 5",
  "featured_products_aspect_ratio": "4 / 5",
  "featured_collections_aspect_ratio": "16 / 9",
  "image_border_radius": 0,
  "navigation_bar": false,
  "color_scheme_navigation_bar": "",
  "drawer_accordion": false,
  "drawer_accordion_expand_first": false,
  "drawer_dividers": false
}
```

## Context

The "Collezioni" mega-menu dropdown (and any other header-menu top-level item with children)
used to show a right-side "featured content" panel that was static for the whole dropdown —
computed once from the top-level link, not from whichever category a visitor was hovering. This
read as unrelated/broken content next to the hovered category.

`snippets/mega-menu-list.liquid` now supports a `category_hover_products` menu style: hovering a
left-column category swaps the right panel to show that category's own collection, filtered down
to products carrying a single shared tag. The panels are pre-rendered (hidden) server-side and
swapped via a `data-active-panel` attribute that `assets/header-menu.js`
(`activateHoverPanel`/`#onHoverPanelFocusIn`) sets on `pointerenter`/focus of a category link —
no fetch. A pure CSS `:has()`/`:hover` swap was tried first but reverted the panel to the default
category the instant the pointer left the category link, including mid-transit on a diagonal move
toward the panel it had just opened; tracking the last-hovered category in JS instead keeps it
shown until a different category is hovered or the submenu closes.

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
