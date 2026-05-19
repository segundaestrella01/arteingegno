# Claude Code prompt — Prestige → Horizon theme migration

Paste this entire prompt into Claude Code to start the execution.

---

## Context

You are working on the **Arte&Ingegno** Shopify store (`mattiastore-3117.myshopify.com`).

The repo root contains a **Horizon v3.5.1** theme (Shopify's open-source theme, MIT licence). This is the **target base** — the theme we will build on and eventually publish.

The store currently has a **Prestige** theme (by Maestrooo) installed in trial mode. We will pull its code **for analysis only** — to extract its visual design language (CSS tokens, typography, spacing, section layouts) and recreate those patterns inside Horizon. Prestige code will **never** be pushed to production; Horizon is the deliverable.

---

## Goal

Migrate the visual identity of the Prestige theme into Horizon so that the final Horizon theme looks and feels like Prestige, but is built entirely on our own open-source codebase.

---

## Step 1 — Identify the Prestige theme ID

Run in the terminal:

```bash
shopify theme list --store mattiastore-3117.myshopify.com
```

Note the numeric ID of the Prestige theme (it will appear as the currently published or most recently installed theme).

---

## Step 2 — Pull Prestige into a temporary analysis folder

Pull the Prestige theme into a separate directory (NOT into the repo root, which is Horizon):

```bash
mkdir -p /tmp/prestige-reference
shopify theme pull --store mattiastore-3117.myshopify.com --theme <PRESTIGE_THEME_ID> --path /tmp/prestige-reference
```

Do not mix Prestige files into the Horizon repo. Keep `/tmp/prestige-reference` strictly read-only for analysis.

---

## Step 3 — Extract the Prestige design system

From `/tmp/prestige-reference`, analyse and document the following. Write your findings into a new file `design-extraction/prestige-design-tokens.md` at the repo root.

### 3a. CSS custom properties / design tokens
Look in `assets/*.css` and `assets/*.scss` for:
- Colour palette (`--color-*`, or equivalent)
- Typography: font families, sizes, weights, line heights
- Spacing scale (margins, paddings, gaps)
- Border radius values
- Shadow definitions
- Transition / animation defaults

### 3b. Typography choices
- Which Google Fonts or custom fonts are loaded (check `layout/theme.liquid` for `<link>` tags and `@font-face` declarations)
- Heading hierarchy (h1–h4 sizes and weights)
- Body text size and line height
- Any special text treatments (letter-spacing, text-transform)

### 3c. Key section structure
For each of the following sections in `/tmp/prestige-reference/sections/`, note:
- The section's overall layout (grid / flex, column count, breakpoints)
- Which settings are exposed in `{% schema %}`
- Any unique UX patterns (e.g. sticky elements, overlays, animation hooks)

Sections to analyse:
1. Hero / banner (full-width image + text overlay)
2. Product page (`main-product.liquid` or equivalent)
3. Collection / product grid
4. Header and navigation
5. Footer
6. Featured collection or featured products
7. Announcement bar

### 3d. Icon set
List which icon library Prestige uses (Feather, custom SVG sprite, etc.) and where icons are defined.

---

## Step 4 — Map Prestige design onto Horizon

Using the extracted tokens, update the Horizon theme in the repo root. Work section by section — do not do a bulk find-and-replace.

### 4a. CSS variables
In `assets/base.css` (or the equivalent Horizon global stylesheet), introduce a `:root` block that overrides Horizon's default tokens with the values extracted from Prestige. Keep Horizon's variable names — only change the values. Example pattern:

```css
:root {
  /* Typography — matched to Prestige */
  --font-heading-family: 'Cormorant Garamond', serif; /* replace with actual value */
  --font-body-family: 'Jost', sans-serif;             /* replace with actual value */

  /* Colours */
  --color-background: #faf9f7;   /* replace with actual value */
  --color-foreground: #1a1a18;   /* replace with actual value */
  /* ... etc */
}
```

### 4b. Font loading
Update `layout/theme.liquid` to load the same font families that Prestige uses (Google Fonts `<link>` tags or `@font-face` blocks). Remove any Horizon fonts that are no longer needed.

### 4c. Section-by-section layout adjustments
For each section identified in Step 3c, compare the Prestige layout with the equivalent Horizon section. Document the differences, then update the Horizon section's Liquid and CSS to match Prestige's layout and spacing. Keep the Horizon schema structure — only change the visual output.

Priority order:
1. Header / navigation
2. Hero
3. Product page
4. Collection grid
5. Footer
6. Remaining sections

### 4d. Icon set
If Prestige uses a different icon set from Horizon, either:
- Add the matching icons to `assets/icons/` as individual SVG files (preferred), or
- Update `snippets/icon-*.liquid` to match Prestige's icon style

---

## Step 5 — Local preview

Start the development server against the store:

```bash
shopify theme dev --store mattiastore-3117.myshopify.com
```

Open the preview URL in a browser alongside the live Prestige theme. Compare section by section. Note any visual gaps and fix them iteratively.

---

## Step 6 — Push as a new unpublished theme

When the visual parity is satisfactory, push the Horizon theme to the store as a **new, unpublished theme** (do NOT publish yet):

```bash
shopify theme push --store mattiastore-3117.myshopify.com --unpublished --theme-name "Arte&Ingegno Custom v1"
```

This lets the user preview the new theme in the Shopify admin before going live.

---

## What NOT to do

- Do not copy Prestige `.liquid` files into the Horizon repo. Extract patterns and rewrite them.
- Do not push any Prestige code to the store.
- Do not run `shopify theme push` without `--unpublished` until the user explicitly approves publishing.
- Do not modify the store's data model (metafields, metaobjects) as part of this task — that is a separate concern.
- Do not touch files in `scripts/shopify-data-model/` — those are Admin API scripts, not theme code.

---

## Deliverables

1. `design-extraction/prestige-design-tokens.md` — documented design tokens extracted from Prestige
2. Updated Horizon theme in the repo root with Prestige's visual identity applied
3. A new unpublished theme on the store named "Arte&Ingegno Custom v1"

---

## Notes on the brand

Arte&Ingegno sells artisanal jewellery, nautical-themed glass spheres, and high-end fans. The target customer is women aged 25–65 who value craftsmanship and authenticity. The aesthetic should feel warm, trustworthy, and artisanal — not cold or transactional. When making judgment calls about visual choices (e.g. which Prestige style to carry over), lean toward the warmer, more editorial end of Prestige's options.
