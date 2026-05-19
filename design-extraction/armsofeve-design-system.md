# Arms of Eve — Design System Extraction
## Arte&Ingegno Horizon Theme Reference

Inspected: https://uk.armsofeve.com/ · May 2025

---

## Colour Palette

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Near-black | `#111111` | rgb(17,17,17) | Headings, nav links, strong text |
| Charcoal body | `#50504F` | rgb(80,80,79) | Body text, links, muted text |
| Brand gold / accent | `#B19151` | rgb(177,145,81) | Nav highlights (GIFTING), Add to Cart button, star ratings, SALE accents |
| White | `#FFFFFF` | rgb(255,255,255) | Page background, button text on gold |
| Warm cream | `#F3F0EA` | rgb(243,240,234) | Footer background, secondary button background |
| Light cream | `#ECE6DC` | rgb(236,230,220) | Secondary action bg (gift wrapping button) |
| Sale red | `#AE262D` | rgb(174,38,45) | SALE nav label only |
| Border grey | `#E5E5EB` | — | Subtle borders, dividers |

**Design principle:** A single accent colour (`#B19151`) unifies CTAs, editorial highlights, and interactive elements. Everything else is achromatic or warm neutral.

### Horizon colour scheme mapping

| Arms of Eve | Horizon setting | Notes |
|---|---|---|
| `#FDFAF5` (warm white) | `background` scheme-1 | Slightly warmer than pure white |
| `#111111` | `foreground_heading` | Near-black headings |
| `#50504F` | `foreground` | Charcoal body text |
| `#50504F` | `primary` | Primary text colour |
| `#111111` | `primary_hover` | Hover state darkens |
| `#E5E5E0` | `border` | Subtle warm border |
| `#111111` | `shadow` | |
| `#B19151` | `primary_button_background` | Gold CTA |
| `#FFFFFF` | `primary_button_text` | |
| `#B19151` | `primary_button_border` | |
| `#8F7239` | `primary_button_hover_background` | Darker gold on hover |
| `#FFFFFF` | `primary_button_hover_text` | |
| `#8F7239` | `primary_button_hover_border` | |
| `rgba(0,0,0,0)` | `secondary_button_background` | Transparent |
| `#111111` | `secondary_button_text` | |
| `#111111` | `secondary_button_border` | |
| `#F3F0EA` | `secondary_button_hover_background` | Warm cream |
| `#50504F` | `secondary_button_hover_text` | |
| `#50504F` | `secondary_button_hover_border` | |

**scheme-2 (alternate sections):** `#F3F0EA` background — warm cream, used for footer and alt sections.

---

## Typography

### Fonts

Arms of Eve uses **Avenir** (self-hosted, licensed — cannot be copied).

| Role | Arms of Eve | Arte&Ingegno substitute | Rationale |
|---|---|---|---|
| Body / primary | Avenir 300 (Light) | **Jost 300** | Closest geometric sans on Google Fonts |
| Subheading | Avenir 500 (Medium) | **Jost 500** | |
| Heading / nav | Avenir 800 (ExtraBold) | **Jost 800** | |
| Decorative | Kugile (custom display) | *(logo image only)* | Not needed as CSS |
| Script accent | Vanessa (script) | *(optional future)* | |
| Serif body | Roman | **Cormorant Garamond** | For editorial serif moments |

**Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;800&family=Cormorant+Garamond:wght@400;600&display=swap
```

### Type Scale

| Element | Size | Weight | Transform | Letter-spacing | Line-height | Colour |
|---|---|---|---|---|---|---|
| h1 | 48px | 500 | UPPERCASE | 2.4px (0.05em) | 54px / 1.125 | `#111111` |
| h2 | 18px | 500 | UPPERCASE | 0.9px (0.05em) | 24px / 1.33 | `#111111` |
| h3 | 18px | 500 | UPPERCASE | 0.9px | 24px | varies |
| Product title (PDP h1) | 24px | 500 | UPPERCASE | 1.2px | 32px | `#111111` |
| Nav link | 12px | 800 | UPPERCASE | 0.6px (0.05em) | — | `#111111` |
| Body (p) | 14px | 300 | none | normal | 20px / 1.43 | `#50504F` |
| Price | 16px | 300 | none | normal | — | `#50504F` |
| Button | 12px | 800 | UPPERCASE | 0.6px | — | white / dark |
| Footer heading | 12px | 800 | UPPERCASE | 0.6px | — | `#111111` |
| Footer link | 12px | 400 | UPPERCASE | 0.6px | — | `#50504F` |

**Key patterns:**
- Nearly all UI text uses UPPERCASE with 0.05em letter-spacing
- The design uses weight contrast (300 vs 800) much more than size contrast
- Line-heights are tight on headings (1.1–1.25×)

### Horizon typography settings mapping

| Setting | Old value | New value | Notes |
|---|---|---|---|
| `type_body_font` | `inter_n4` | `jost_n4` | Jost Regular 400 |
| `type_subheading_font` | `inter_n5` | `jost_n5` | Jost Medium 500 |
| `type_heading_font` | `inter_n7` | `jost_n8` | Jost ExtraBold 800 |
| `type_accent_font` | `inter_n7` | `jost_n8` | Jost ExtraBold 800 |
| `type_size_h1` | 56 | 48 | px |
| `type_size_h2` | 48 | 18 | px |
| `type_size_h3` | 32 | 18 | px |
| `type_size_h4` | 24 | 14 | px |
| `type_case_h1` | "none" | "uppercase" | |
| `type_case_h2` | "none" | "uppercase" | |
| `type_case_h3` | "none" | "uppercase" | |
| `type_letter_spacing_h1` | "heading-normal" | "heading-loose" | 0.03em → 0.05em target |
| `type_letter_spacing_h2` | "heading-normal" | "heading-loose" | |
| `type_letter_spacing_h3` | "heading-normal" | "heading-loose" | |

---

## Spacing Scale

| Element | Value | Notes |
|---|---|---|
| Header height desktop | 73px | Sticky |
| Announcement bar height | 32px | Desktop |
| Nav link padding | 28px 0 | Vertical only, no horizontal |
| Button padding | 12px 24px | Both primary and secondary |
| Product grid column gap | 4px | Very tight, almost edge-to-edge |
| Product grid row gap | 24px | |
| Product card image | 298×373px | Portrait, ~4:5 aspect ratio |

---

## Header & Navigation

**Structure:**
- Announcement bar: slim 32px strip above header. Scrolling text with offers.
- Header: sticky, transparent background, 73px tall on desktop.
- Logo: image, top-left, ~414×126px natural size.
- Nav: centred links, all uppercase 12px/800 weight, 0.6px letter-spacing, 28px vertical padding.
- Icons (search/account/wishlist/cart): right-aligned.

**Horizon mapping:**
- Sticky header → configure header section `sticky: true`
- Nav link style → CSS override on `.menu__list-item a`, `.mega-menu a`
- Announcement bar → `sections/announcement-bar.liquid` colour to gold accent or warm neutral

---

## Collection Page / Product Grid

**Subcategory navigation:**
- Horizontal scrollable row of image thumbnails with category label below.
- Not a standard Horizon section — closest equivalent: collection list section or custom.

**Filter bar:**
- Horizontal, above the grid, pill-shaped dropdown buttons.
- "METAL ▼ | MATERIAL ▼ | STYLE ▼ | COLOUR ▼" on left, "SORT ▼" on right.

**Product grid:**
- 4 columns desktop, ~3 columns tablet, 2 columns mobile.
- Column gap: 4px (tight edge-to-edge).
- Row gap: 24px.
- No card border, no border radius, transparent card background.

**Product card:**
- Image aspect ratio: ~4:5 (portrait, taller than wide).
- `object-fit: cover`.
- Wishlist heart icon top-right.
- Badge "BEST SELLER" — dark olive/brown background.
- Product name: small, uppercase, normal weight below image.
- Price: 14px, 300 weight.

**Horizon mapping:**
| Arms of Eve | Horizon variable / setting |
|---|---|
| 4px column gap | `gap` override on `.product-grid` |
| 4:5 image ratio | `card_image_ratio` or CSS `aspect-ratio: 4/5` |
| No card border-radius | `card_corner_radius: 0` |
| 4-col desktop | section `columns_desktop: 4` |

---

## Product Detail Page

**Layout:**
- 2-column flex: ~60% image gallery, ~40% product info.
- No fixed `grid-template-columns` — uses flex.

**Left column (images):**
- Large editorial photograph.
- Thumbnail navigation (implied, 2+ images).
- "BEST SELLER" badge top-left of image.

**Right column (info):**
- Title: 24px, 500 weight, uppercase, 1.2px letter-spacing.
- Price: 16px, 300 weight, below title.
- Star rating with gold stars.
- Variant picker: small thumbnail images.
- "ADD TO CART" button: full-width, gold `#B19151`, white text, 0px border-radius.
- "FIND IN STORE" button: secondary, transparent, bordered.
- Buy-now text (Klarna).
- USP icon row: 1-year guarantee, gold plated, waterproof, free shipping.
- Gift wrapping option.

**Horizon mapping:**
- Product layout: `sections/main-product.liquid` media ratio 60/40.
- Add to Cart = primary button → already handled by colour scheme.
- No tabs visible — content shown inline.

---

## Buttons & Interactive Elements

| Button | Bg | Text | Border | Radius | Padding | Font |
|---|---|---|---|---|---|---|
| Primary (Add to Cart) | `#B19151` | `#FFFFFF` | none | 0px | 12px 24px | 12px/800/UPPERCASE/0.6px |
| Secondary (Find in Store) | transparent | `#111111` | 1px `#111111` | 0px | 12px 24px | same |
| Soft (Gift Wrapping) | `#ECE6DC` | `#111111` | none | 0px | 12px 24px | same |

**Key pattern:** Zero border-radius across the board. All buttons use the same font styling — only colour and border distinguish them.

**Horizon settings:**
- `button_border_radius_primary: 0`
- `button_border_radius_secondary: 0`
- `button_text_case: uppercase`

---

## Footer

**Background:** `#F3F0EA` (warm cream)
**Layout:** 3 columns — ABOUT | HELP | CONNECT

| Element | Style |
|---|---|
| Column headings | 12px, 800 weight, UPPERCASE, 0.6px letter-spacing, `#111111` |
| Column links | 12px, 400 weight, UPPERCASE, 0.6px letter-spacing, `#50504F` |
| Social icons | Row below columns |
| Email newsletter | Input + subscribe button |

**Horizon mapping:**
- Footer section colour scheme → scheme-2 (`#F3F0EA` background)
- Footer link text-transform → CSS override

---

## Micro-interactions & Transitions

- Hover on nav links: underline appears.
- Hover on product cards: slight zoom or second image swap (standard AoE pattern).
- No aggressive transitions — 250ms ease typical.
- Button hover: background darkens by ~15–20%.
- Announcement bar: scrolling marquee.

---

## CSS Overrides Required in Horizon

These values are not controllable via `settings_data.json` alone and need explicit CSS:

```css
/* Nav links — uppercase, tracked, extra-bold */
.menu__list-item a,
.mega-menu a,
header nav a {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

/* Buttons — sharp corners, tracked uppercase */
.button, .btn, [class*="button--primary"], [class*="button--secondary"] {
  border-radius: 0 !important;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 800;
  font-size: 0.75rem;
}

/* Headings — uppercase, tracked */
h1, h2, h3 {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer */
footer {
  background-color: #F3F0EA;
}

/* Product grid — tight columns */
.product-grid {
  column-gap: 4px;
  row-gap: 24px;
}

/* Product image — portrait 4:5 */
.product-card__image, .card__image {
  aspect-ratio: 4 / 5;
  object-fit: cover;
}
```
