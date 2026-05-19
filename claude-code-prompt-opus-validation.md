# Claude Code prompt — Opus validation & repair pass

Paste this entire prompt into Claude Code (using Opus) to validate and fix the work
done by Sonnet in the previous session.

---

## What was done before this session

A Sonnet agent adapted the Horizon v3.5.1 theme to match the visual identity of
`https://uk.armsofeve.com/`. The changes were:

- `config/settings_data.json` — fonts updated to Jost + Cormorant Garamond, typography scale
  set to match Arms of Eve (uppercase headings, letter-spacing, sizes)
- `layout/theme.liquid` — Google Fonts `<link>` tag added
- `snippets/stylesheets.liquid` — custom CSS linked

Three page types were structured in templates:
- `templates/index.json` — homepage (hero + 2× product-list + brand story + trust signals + email)
- `templates/collection.json` — collection page (section + main-collection)
- `templates/product.json` — product page (product-information + swan_suggerisce + artisan_placeholder + product-recommendations)

The design extraction is documented in `design-extraction/armsofeve-design-system.md`.

---

## Your task

You are doing a **validation and repair pass**. Do not rebuild from scratch.
Read the current state of every relevant file first, identify gaps, then fix them
precisely. Work through the checklist below in order. For each item: read → assess →
fix if needed → move to the next.

---

## Checklist

### 1. Colour scheme tokens — LIKELY BROKEN

Read `config/settings_data.json` and check `color_schemes.scheme-1.settings`.

**Expected values** (from `design-extraction/armsofeve-design-system.md`):

| Key | Expected value |
|---|---|
| `background` | `#FDFAF5` (warm off-white, NOT pure `#ffffff`) |
| `foreground_heading` | `#111111` |
| `foreground` | `#50504F` |
| `primary` | `#50504F` |
| `primary_button_background` | `#B19151` (brand gold) |
| `primary_button_text` | `#FFFFFF` |
| `primary_button_border` | `#B19151` |
| `primary_button_hover_background` | `#8F7239` |
| `primary_button_hover_border` | `#8F7239` |
| `secondary_button_hover_background` | `#F3F0EA` |
| `border` | `#E5E5E0` |

If `scheme-1.background` is still `#ffffff` and `primary_button_background` is
still `#000000`, the colour pass was skipped. Fix by updating `settings_data.json`
directly — update scheme-1 (main) and scheme-2 (alternate sections, warm cream
`#F3F0EA` background) with the correct values from the design system doc.

Also verify scheme-2 background is `#F3F0EA` (warm cream used by Arms of Eve for
alternate sections and footer).

---

### 2. Homepage template (`templates/index.json`) — STRUCTURE AUDIT

Read `templates/index.json` and `sections/hero.liquid`.

**Check each section:**

#### 2a. Hero section
- Does the hero have a real image assigned (`image_1` pointing to a valid shop image)?
- Do the text blocks have meaningful placeholder content in Italian
  (matching the Arte&Ingegno brand — artisanal jewellery, nautical spheres, fans)?
- Is a `color_scheme` setting present? It should be set to `scheme-6` (transparent/dark
  overlay) so the hero image shows through.
- Is a CTA button block present with a link to a collection?

If content is missing or generic, update the blocks in `templates/index.json` with
appropriate Arte&Ingegno placeholder content.

#### 2b. Featured collection sections
There are two product-list sections: `featured_collection_new` pointing to collection
`new-arrivals` and `featured_collection_rings` pointing to `homepage-jewelry`.

Run this to verify those collections exist on the store:
```
shopify theme dev --store mattiastore-3117.myshopify.com
```
Then check via the Shopify Admin API (use the `shopify-dev-mcp` in `admin` mode):
```graphql
{
  collections(first: 20) {
    nodes { title handle }
  }
}
```
If `new-arrivals` or `homepage-jewelry` do not exist, update the `collection` setting
in the respective sections in `templates/index.json` to use a collection handle that
does exist. Do not create new collections — just point to an existing one.

#### 2c. Section type blocks
The `trust_signals` and `email_signup` sections use Horizon's generic `section` type
(`sections/section.liquid`). Verify that each has meaningful blocks defined in
`templates/index.json`. Specifically:
- `trust_signals` should have 3 column blocks, each containing an icon/text combination
  describing Arte&Ingegno's value propositions (e.g. "Artigianale", "Materiali pregiati",
  "Spedizione sicura")
- `email_signup` should have heading, subtext, and email form blocks

If blocks are empty objects `{}`, they will render as blank. Populate them.

---

### 3. Collection page (`templates/collection.json`) — STRUCTURE AUDIT

Read `templates/collection.json` in full.

**Known issue:** The template has two sections — a generic `section` at the top
with no blocks, and `main-collection`. The empty `section` will render as a blank
strip. Either:
- Add a collection-banner block to it (image + title overlay), OR
- Remove it entirely if there is no clear purpose

**Check `main-collection` section settings:**
Read `sections/main-collection.liquid` and verify that:
- `content_for 'block', type: 'filters'` — the filters block is properly wired.
  In Horizon's block-based architecture, this requires the template to declare a
  `filters` block. Check if `templates/collection.json` has a `filters` block defined
  under the `main` section's `blocks` key. If not, add it:
  ```json
  "filters": {
    "type": "filters",
    "settings": {}
  }
  ```
  And add `"filters"` to the section's `block_order` array.

- Product card columns: `columns` setting should be `4` on desktop (matching Arms of Eve grid).
  If it is set to a lower value, update it.

- Subcategory navigation pills: Arms of Eve shows a horizontal scrollable row of
  subcategory links at the top of each collection page. Check if the `collection-links`
  section (`sections/collection-links.liquid`) exists. If it does, add it to
  `templates/collection.json` ABOVE the main section with a sensible `color_scheme`.

---

### 4. Product page (`templates/product.json`) — STRUCTURE AUDIT

Read `templates/product.json` in full and read `sections/product-information.liquid`.

#### 4a. Verify block wiring for product-information
The `product-information` section uses Horizon's block-based architecture:
- `content_for 'block', type: '_product-media-gallery', id: 'media-gallery'`
- `content_for 'block', type: '_product-details', id: 'product-details'`
- `content_for 'blocks'` (for additional blocks)

For these to render correctly, `templates/product.json` MUST have the `main` section
declare these blocks under its `blocks` key and `block_order`. Check if this is the case.

Expected structure in `templates/product.json` under `sections.main`:
```json
"blocks": {
  "media-gallery": {
    "type": "_product-media-gallery",
    "settings": {}
  },
  "product-details": {
    "type": "_product-details",
    "settings": {}
  }
},
"block_order": ["media-gallery", "product-details"]
```

If these blocks are missing or incomplete, the product page will render with no
image gallery and no product details. Fix immediately — this is the highest-priority
structural issue.

#### 4b. product-details block — nested blocks
The `_product-details` block itself contains nested blocks for: title, price, variant
selector, quantity, add-to-cart button, description, etc. Read `blocks/` directory
for `_product-details.liquid` to understand what nested blocks are expected.

Verify that `templates/product.json` has a complete set of nested blocks under
`product-details`. The minimum required set:
- `title` (product title)
- `price` (price display)
- `variant_picker` (variant selector)
- `quantity_selector`
- `buy_buttons` (add to cart)
- `description`

If any of these are missing from `block_order`, add them.

#### 4c. artisan_placeholder section — REMOVE
Per the project's CLAUDE.md, the artisan metaobject and any public artisan attribution
is **deferred** and must NOT be surfaced. The `artisan_placeholder` section in the
product template must be removed from `templates/product.json`. Delete both its
entry in `sections` and its entry in `order`.

#### 4d. swan_suggerisce section
This appears to be a custom editorial section (likely "Suggerisce" = "recommends" in
Italian). Verify it has non-empty blocks in `templates/product.json`. If the heading
and quote blocks exist with real content, keep it. If blocks are empty, populate with
a placeholder editorial message appropriate for Arte&Ingegno (e.g. a short statement
about craftsmanship or care, in Italian).

#### 4e. Sticky add to cart
Check that `sections.main.settings.enable_sticky_add_to_cart` is `true` in
`templates/product.json`. Arms of Eve uses a sticky ATC — this is a key UX pattern
to preserve.

---

### 5. Font loading — VERIFY

Read `layout/theme.liquid` and search for the Google Fonts `<link>` tag.

Expected URL:
```
https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,800;1,300&family=Cormorant+Garamond:wght@400;600&display=swap
```

If the tag is missing, malformed, or pointing to different weights, fix it.
Also verify it is placed inside `<head>` BEFORE the theme's own stylesheets.

---

### 6. CSS overrides — VERIFY

Read `snippets/stylesheets.liquid` to find the custom CSS file being loaded.
Then read that CSS file and verify it contains the Arte&Ingegno override block
with the correct `:root` custom properties (background, foreground, button colours,
typography variables matching Arms of Eve extracted values).

If the override block is missing or incomplete, add/complete it.
The override block should be clearly marked:
```css
/* ============================================================
   Arte&Ingegno — visual identity overrides (based on Arms of Eve)
   ============================================================ */
```

Key variables to check:
- `--color-background: #FDFAF5`
- `--color-foreground: #50504F`
- `--color-foreground-heading: #111111`
- Font families correctly assigned to Horizon's font variables

---

### 7. Final validation — dev server check

After all fixes are applied, start the dev server:
```bash
shopify theme dev --store mattiastore-3117.myshopify.com
```

Open the preview URL and verify:
- Homepage renders: hero image visible, product grids populated (or empty-but-structured
  if collections don't exist yet), no blank sections
- Collection page: navigate to any collection — product grid renders, filters work
- Product page: navigate to any product — image gallery renders on the left,
  product details (title, price, variants, ATC button) on the right

If anything fails to render, diagnose from the Liquid error output in the terminal
and fix.

---

### 8. Push as unpublished

Once validation passes:
```bash
shopify theme push \
  --store mattiastore-3117.myshopify.com \
  --unpublished \
  --theme-name "Arte&Ingegno Custom v1"
```

Do NOT publish. The user will review in the Shopify admin theme preview before going live.

---

## Rules

- Read every file before editing it.
- Validate all GraphQL with `validate_graphql_codeblocks` before executing against the store.
- Do not create new Shopify collections, products, or metafields as part of this task.
- Do not add an AI Summary field in Notion.
- Do not run `shopify theme push` without `--unpublished`.
- Do not surface artisan information anywhere (deferred per project spec).
- Keep all user-facing copy in Italian unless a specific piece of content is
  clearly English-only (e.g. brand names).
