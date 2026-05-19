# Claude Code prompt — Arms of Eve → Horizon theme adaptation

Paste this entire prompt into Claude Code to start the execution.

---

## Context

You are working on the **Arte&Ingegno** Shopify store (`mattiastore-3117.myshopify.com`).

The repo root contains a **Horizon v3.5.1** theme (Shopify's open-source theme, MIT licence).
This is the **target base** — the theme we will build on and deploy.

The design inspiration is **Arms of Eve** (`https://uk.armsofeve.com/`), an Australian jewellery
brand with a clean, warm, editorial aesthetic that closely matches the Arte&Ingegno brand identity.
We are not copying their code — we are extracting their visual design language
(colours, typography, spacing, layout patterns) and reproducing it in Horizon with our own code.

---

## Goal

Adapt the Horizon theme to look and feel like Arms of Eve — same warmth, same editorial
minimalism, same category-first navigation — while keeping the Horizon Liquid architecture intact.

---

## Step 1 — Browser inspection of Arms of Eve

Use the `mcp__Claude_in_Chrome` tools to open and inspect the Arms of Eve website.
You need to extract live CSS values that are not available in the static HTML.

### 1a. Navigate and extract global CSS custom properties

```
navigate → https://uk.armsofeve.com/
```

Once loaded, run this JavaScript in the browser console to extract all CSS custom properties
defined on `:root`:

```javascript
const styles = getComputedStyle(document.documentElement);
const props = {};
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule.selectorText === ':root') {
        rule.style.cssText.split(';').forEach(decl => {
          const [prop, val] = decl.split(':');
          if (prop && prop.trim().startsWith('--')) {
            props[prop.trim()] = val ? val.trim() : '';
          }
        });
      }
    }
  } catch(e) {}
}
console.log(JSON.stringify(props, null, 2));
```

Save the output in `design-extraction/armsofeve-css-variables.json`.

### 1b. Extract typography

Still on the homepage, run:

```javascript
const fonts = new Set();
document.querySelectorAll('*').forEach(el => {
  const style = getComputedStyle(el);
  fonts.add(style.fontFamily);
});
// Log font stacks in use
console.log([...fonts].join('\n'));

// Also check heading sizes
['h1','h2','h3','h4','p','a','button'].forEach(tag => {
  const el = document.querySelector(tag);
  if (el) {
    const s = getComputedStyle(el);
    console.log(tag, {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textTransform: s.textTransform
    });
  }
});
```

Also check the `<head>` for Google Fonts `<link>` tags or `@font-face` declarations
by running:

```javascript
document.querySelectorAll('link[href*="fonts.googleapis"]').forEach(l => console.log(l.href));
```

### 1c. Extract colours from key UI elements

```javascript
const selectors = {
  background: 'body',
  headerBg: 'header',
  navLink: 'nav a',
  primaryButton: 'button, .btn, [class*="button"]',
  productCardBg: '[class*="card"], [class*="product"]',
  priceText: '[class*="price"]',
  footerBg: 'footer',
};

Object.entries(selectors).forEach(([name, sel]) => {
  const el = document.querySelector(sel);
  if (el) {
    const s = getComputedStyle(el);
    console.log(name, {
      bg: s.backgroundColor,
      color: s.color,
      border: s.borderColor,
    });
  }
});
```

### 1d. Extract spacing and layout values

```javascript
// Check key spacing patterns
const header = document.querySelector('header');
const nav = document.querySelector('nav');
const main = document.querySelector('main, #MainContent');

[header, nav, main].forEach((el, i) => {
  if (!el) return;
  const s = getComputedStyle(el);
  console.log(['header','nav','main'][i], {
    padding: s.padding,
    margin: s.margin,
    maxWidth: s.maxWidth,
    gap: s.gap,
  });
});
```

### 1e. Inspect the collection page layout

```
navigate → https://uk.armsofeve.com/collections/earrings
```

Inspect the product grid:

```javascript
const grid = document.querySelector('[class*="grid"], [class*="product-list"], ul');
if (grid) {
  const s = getComputedStyle(grid);
  console.log({
    display: s.display,
    gridTemplateColumns: s.gridTemplateColumns,
    gap: s.gap,
    padding: s.padding,
  });
}
// Check product card aspect ratio / image sizing
const img = document.querySelector('[class*="card"] img, [class*="product"] img');
if (img) {
  console.log('card image:', img.getBoundingClientRect(), getComputedStyle(img).objectFit);
}
```

Also note:
- Are subcategory filters displayed as horizontal scrollable pills?
- Is there a sort/filter bar above the grid?
- How many columns on desktop vs mobile?

### 1f. Inspect the header and announcement bar

Back on the homepage, note:
- Is the logo an image or text?
- Is the logo centered or left-aligned?
- Does the header stick on scroll?
- Is the announcement bar a separate strip above the header or inside it?
- What is the header background colour at rest and on scroll?

### 1g. Inspect a product page

```
navigate → https://uk.armsofeve.com/products/riley-gold-hoop-earrings-large
```

Note the layout:
- How many image columns vs info columns? (e.g. 60/40 split?)
- Is there an image gallery or single image with thumbnails?
- Where is the price relative to the title?
- How is the Add to Cart button styled (full-width, outlined, filled)?
- Are product tabs (Description / Care / Shipping) used, or is content always visible?
- Is there a sticky Add to Cart on scroll?

---

## Step 2 — Document findings

Write all extracted values into `design-extraction/armsofeve-design-system.md`.
Structure the document as:

```
## Colour palette
## Typography
## Spacing scale
## Header & navigation
## Collection page / product grid
## Product detail page
## Buttons & interactive elements
## Footer
## Micro-interactions & transitions
```

For every value, write the raw observed value AND a proposed mapping to the
equivalent Horizon CSS variable. Example:

```
| Observed value | Horizon variable to override |
|---|---|
| background: #F9F9F9 | --color-background |
| nav links: uppercase, 0.08em letter-spacing | --font-nav-* |
```

---

## Step 3 — Apply the design system to Horizon

Work section by section. Do not do a bulk find-and-replace.
Commit (mentally) to one section at a time and verify before moving on.

### 3a. Global CSS tokens

In `assets/base.css`, add or update a `:root` block that overrides Horizon's
default tokens with the Arms of Eve values. Keep Horizon's variable names —
only change the values. Group overrides with a clear comment:

```css
/* ============================================================
   Arte&Ingegno — visual identity overrides (inspired by Arms of Eve)
   ============================================================ */
:root {
  --color-background: #F9F9F9;  /* warm off-white */
  /* ... all other extracted values ... */
}
```

### 3b. Font loading

In `layout/theme.liquid`, update the `<head>` to load the same font families
used by Arms of Eve (Google Fonts `<link>` tags). Remove any Horizon default
fonts that are no longer needed.

### 3c. Header & announcement bar

Update `sections/header.liquid` (and `sections/announcement-bar.liquid` if
present) to match:
- Background colour
- Logo alignment (centred or left)
- Navigation link style (uppercase, letter-spacing, font size)
- Sticky behaviour

### 3d. Collection page / product grid

Update `sections/main-collection-product-grid.liquid` and related CSS to match:
- Grid column count (desktop and mobile)
- Card gap / padding
- Image aspect ratio
- Subcategory filter pills layout (horizontal scrollable row)
- Sort/filter bar position

### 3e. Product detail page

Update `sections/main-product.liquid` and related CSS to match:
- Two-column layout ratio
- Image gallery style
- Title / price / button stacking order
- Add to Cart button style (full-width, filled)
- Tabs or expanded content blocks

### 3f. Buttons & interactive elements

Update `assets/component-button.css` (or equivalent) to match:
- Primary button: background, text colour, border-radius, text-transform
- Secondary/outline button style
- Hover transitions

### 3g. Footer

Update `sections/footer.liquid` and related CSS to match:
- Three-column layout (About / Help / Connect pattern)
- Uppercase column headings
- Link style and spacing
- Background colour
- Social icon row

---

## Step 4 — Local preview

Start the development server:

```bash
shopify theme dev --store mattiastore-3117.myshopify.com
```

Open the preview URL alongside `https://uk.armsofeve.com/` and compare:
- Homepage
- A collection page
- A product detail page

Note any visual gaps and fix them iteratively before moving to Step 5.

---

## Step 5 — Push as a new unpublished theme

When visual parity is satisfactory, push the adapted Horizon theme as a new,
unpublished theme (do NOT publish yet — the user must approve it first):

```bash
shopify theme push \
  --store mattiastore-3117.myshopify.com \
  --unpublished \
  --theme-name "Arte&Ingegno Custom v1"
```

---

## What NOT to do

- Do not copy any code from the Arms of Eve website. Extract values and patterns, then rewrite.
- Do not run `shopify theme push` without `--unpublished` until the user explicitly approves.
- Do not touch files in `scripts/shopify-data-model/` — those are Admin API scripts, separate concern.
- Do not modify the store's metafield or metaobject definitions as part of this task.
- Do not add an AI Summary field in Notion for this project.

---

## Deliverables

1. `design-extraction/armsofeve-css-variables.json` — raw CSS variables from the browser
2. `design-extraction/armsofeve-design-system.md` — documented design system with Horizon mappings
3. Updated Horizon theme in the repo root with the Arms of Eve aesthetic applied
4. A new unpublished theme on `mattiastore-3117.myshopify.com` named "Arte&Ingegno Custom v1"

---

## Brand notes for judgment calls

Arte&Ingegno sells artisanal jewellery (gold-plated brass), nautical-themed glass spheres,
and high-end fans. Target customer: women aged 25–65 who value craftsmanship, durability,
and authenticity. The tone is warm, trustworthy, and artisanal — not cold or transactional.

When Arms of Eve offers multiple visual options (e.g. a neutral vs a cream background,
a lighter vs a bolder button), always lean toward the **warmer, softer** option.
The brand story is about the handcraft and the object's soul — the design should support that.
