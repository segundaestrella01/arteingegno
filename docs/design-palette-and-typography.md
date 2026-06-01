# Arte&Ingegno — Palette & Typography

**Concept: "Bosco & Ottone" (Forest & Brass)**
Applied: 2026-06-01

---

## Design principles

- Primary register: green, wood tones, plant-inspired earthy tones
- No cold white or clinical backgrounds — warm parchment/cream as the light neutral
- Forest green as the drama register for hero sections, newsletter strip, bold callouts
- Brass gold retained as the single accent/CTA color — it reads as literal metal
- Photo style: close-up on brass texture and stone, warm light, no studio white; lifestyle shots featuring skin and outdoor settings

---

## Color palette

### Core tokens

| Token | Hex | Role |
|-------|-----|------|
| Parchment Light | `#f2ead8` | Primary content background (scheme-1) |
| Parchment Mid | `#f9f4e8` | Input and card surfaces |
| Aged Linen | `#e4d9c0` | Alternating section background (scheme-2) |
| Clay | `#d5c9ae` | Deeper neutral / feature callouts (scheme-3) |
| Forest Green | `#2b3d28` | Hero, newsletter, bold sections (scheme-4) |
| Forest Mid | `#3d5438` | Hover surface on green backgrounds |
| Forest Border | `#4a6845` | Borders on green backgrounds |
| Deep Brown | `#1c1a12` | Footer background (scheme-5) |
| Brass Gold | `#b19151` | Primary buttons, selected variants, accents |
| Brass Hover | `#8f7239` | Button hover state |
| Warm Black | `#1e1a12` | Heading text |
| Warm Brown | `#4a4035` | Body text |
| Sand | `#c8b490` | Body text on forest green |
| Dune | `#b8a880` | Body text on deep brown footer |

### Scheme map

| Scheme | Background | Heading | Body | Use |
|--------|-----------|---------|------|-----|
| scheme-1 | `#f2ead8` | `#1e1a12` | `#4a4035` | Main content, product grids |
| scheme-2 | `#e4d9c0` | `#1e1a12` | `#4a4035` | Alternating sections |
| scheme-3 | `#d5c9ae` | `#1e1a12` | `#4a4035` | Feature callouts, deeper neutral |
| scheme-4 | `#2b3d28` | `#f2ead8` | `#c8b490` | Hero, newsletter CTA, bold blocks |
| scheme-5 | `#1c1a12` | `#f2ead8` | `#b8a880` | Footer |
| scheme-6 | transparent | `#f2ead8` | `#c8b490` | Overlay on dark/photo backgrounds |

---

## Typography

### Font families

| Role | Font | Shopify handle | Notes |
|------|------|---------------|-------|
| Heading | Playfair Display Bold | `playfair_display_n7` | Classic editorial serif; confident at display sizes |
| Subheading | Playfair Display Regular | `playfair_display_n4` | Same family, lighter weight |
| Body | DM Sans Regular | `dm_sans_n4` | Clean humanist sans, warm and readable |
| Accent / buttons | DM Sans Medium | `dm_sans_n5` | Works in uppercase for CTAs |

> **Note:** Cormorant Garamond (`cormorant_garamond_*`) is not in Shopify's font library — attempting to use it causes an upload error. Playfair Display was chosen as the closest available alternative: both are high-contrast, elegant display serifs suited to jewellery/artisan brands.

### Type scale

| Level | Size | Line height | Letter spacing | Case |
|-------|------|------------|----------------|------|
| H1 | 48px | display-tight | heading-normal | uppercase |
| H2 | 18px | display-tight | heading-normal | uppercase |
| H3 | 18px | display-normal | heading-normal | uppercase |
| H4 | 14px | display-tight | — | — |
| H5 | 12px | display-loose | — | — |
| H6 | 12px | display-loose | — | — |
| Body | 15px | body-loose | — | — |

**Letter spacing rationale:** Cormorant Garamond has generous natural spacing at large sizes; `heading-normal` prevents the overwide tracking that suited the previous geometric Jost font.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial palette v1 applied — replaced Jost with Playfair Display / DM Sans; introduced forest green scheme-4; shifted all neutrals from cold cream to warm parchment. Cormorant Garamond not available in Shopify font library — Playfair Display used instead. |
