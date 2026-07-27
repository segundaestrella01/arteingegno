# 0002 — Footer purpose, content scope, and top-navigation split

## Status

Accepted (2026-07-27).

## Context

The footer (`sections/footer-group.json`) previously duplicated the site's
newsletter signup ("Join our email list" heading + `email-signup` block) in
its top row. A separate, larger newsletter signup section already exists
higher on the page, making the footer copy redundant — a visitor who
dismissed or ignored the first prompt would immediately see it again.

Separately, footer text was unreadable. Several dead ends were tried and
discarded before finding the real fix (kept here so they aren't retried):

1. Overriding `color` on `footer`/`.footer` in `assets/arteingegno-identity.css`
   — didn't reach components that read Shopify's `--color-foreground`
   variable directly (`blocks/footer-policy-list.liquid`,
   `sections/footer-utilities.liquid`) instead of inheriting `color`.
2. Redeclaring `--color-foreground`/`--color-foreground-heading` scoped to
   `footer`, then forcing `color: var(--color-foreground-heading) !important`
   on every footer descendant — this masked the symptom without finding the
   cause, and broke the moment a section's actual color scheme turned out to
   differ from what was assumed.
3. Aliasing `--font-h3-color` (single hyphen — what `base.css`'s heading
   rules actually read, a Horizon typo; the color-scheme system only ever
   defines `--font-h3--color`, double hyphen) at `:root` in
   `arteingegno-identity.css`. This looked plausible but doesn't work: a
   custom property's `var()` references are resolved once, in the cascade
   context of wherever the alias itself is declared — declared at `:root`,
   it permanently resolves against `:root`'s own scheme (`scheme-1`) and
   never updates for a descendant in a different `.color-scheme-N`.

Reproducing locally (`shopify theme dev` + a headless Chrome check of
`getComputedStyle`) surfaced the actual causes:

- **The footer sections were never forest-colored to begin with.** Both
  `footer_m9NzUG` and `footer_utilities_jLGE8U` had `"color_scheme": ""` in
  `footer-group.json`. Shopify does not treat that as "no scheme" — a
  `color_scheme`-type setting with a blank/invalid value renders using the
  section's schema `"default"` instead (both sections' schemas default to
  `"scheme-1"`, confirmed by inspecting the rendered `class="... color-scheme-1"`
  in the live HTML). So the sections were rendering `scheme-1` (light
  parchment, dark text) all along, not forest.
- **`base.css`'s typo is real** (`color: var(--color, var(--font-hN-color))`
  should read `--font-hN--color`, double hyphen — see `assets/base.css:753,
  775, 798, 820, 842, 864`), confirmed by reading `--font-h3-color` vs.
  `--font-h3--color` via `getComputedStyle` inside a `.color-scheme-4`
  element: the double-hyphen one correctly resolved to that scheme's heading
  color, the single-hyphen one didn't exist anywhere and resolved to nothing.

The theme already ships a forest color scheme with the exact intended
palette — `scheme-4` in `config/settings_data.json` (background `#2b3d28`,
foreground `#c8b490`, foreground_heading `#f2ead8`) — it was just never
assigned to the footer sections.

For footer content structure, [Arms of Eve's footer](https://uk.armsofeve.com/pages/who-we-are)
was used as the template: three accordion/column groups (About, Help,
Connect) plus a bottom bar (region selector, social icons, policy links,
copyright). Of those, only **About** and **Help** are in scope for now —
**Connect** (work-with-us, wholesale, stockists, referrals, ambassador
program) is deferred until Arte&Ingegno has content for it.

For footer content structure, [Arms of Eve's footer](https://uk.armsofeve.com/pages/who-we-are)
was used as the template: three accordion/column groups (About, Help,
Connect) plus a bottom bar (region selector, social icons, policy links,
copyright). Of those, only **About** and **Help** are in scope for now —
**Connect** (work-with-us, wholesale, stockists, referrals, ambassador
program) is deferred until Arte&Ingegno has content for it.

## Decision

**Footer scope: narrative + bureaucratic content only.** The footer is not a
product/category navigation surface — that's the top navigation's job (see
below). Concretely, the footer (`footer-group.json`) now has:

- **Top row** (`footer_m9NzUG`) — two `menu` blocks, mirroring Arms of Eve's
  About/Help pattern, with Italian headings and shown as mobile accordions:
  - **Chi Siamo** (block `menu_chi_siamo`, menu handle `footer-chi-siamo`) —
    narrative content: brand story, craftsmanship, care.
  - **Assistenza** (block `menu_assistenza`, menu handle `footer-assistenza`)
    — practical/bureaucratic content: FAQ, shipping & returns, contact.

  Both this row and the bottom row now have `"color_scheme": "scheme-4"`
  explicitly (not `""` — see Context: blank falls back to the schema
  default, `scheme-1`, not "inherit").

- **Bottom row** (`footer_utilities_jLGE8U`) — copyright, the built-in
  Shopify policies popover, and social icons. Content unchanged, only
  `color_scheme` set to `scheme-4` to match.

Additionally, `snippets/color-schemes.liquid` now also emits
`--font-h1-color` through `--font-h6-color` (single hyphen) alongside the
correctly-named `--font-h1--color` etc., inside the same per-scheme block —
this fixes `base.css`'s typo'd fallback everywhere, for every color scheme,
site-wide, not just the footer. (`assets/arteingegno-identity.css` no longer
carries any footer-specific color override — the sections' own
`color_scheme` handles it natively.)

**Top navigation scope: selling.** All product/category/collection
navigation belongs in the header/mega-menu, not the footer. The footer never
duplicates shop-by-category links.

**Menus referenced don't exist yet.** `menu.liquid` (the block type used)
silently renders nothing if its `menu` setting doesn't resolve to a real
Shopify navigation menu — this is expected until the merchant creates them.

To create them in **Admin → Online Store → Navigation**, use these exact
titles so the auto-generated handle matches what's wired into the theme:

| Title to enter in Admin | Resulting handle | Suggested links (placeholders — verify pages exist before publishing) |
|---|---|---|
| `Footer Chi Siamo` | `footer-chi-siamo` | La Nostra Storia (`/pages/la-nostra-storia`) · Lavorazione Artigianale (`/pages/lavorazione-artigianale`) · Guida alla Cura (`/pages/guida-alla-cura`) |
| `Footer Assistenza` | `footer-assistenza` | Domande Frequenti (`/pages/domande-frequenti`) · Spedizioni e Resi (`/pages/spedizioni-e-resi`) · Contattaci (`/pages/contatti`) |

The page handles above are guesses, not confirmed pages — this session had
no live Admin access (Shopify dev MCP wasn't loaded, storefront is
password-protected) to verify what pages already exist. Adjust the links
to real pages when creating the menus.

## Consequences

- Until the two menus above are created in Admin, the Chi Siamo/Assistenza
  columns render empty (no error, just nothing) — not a bug, expected
  fallback behavior of `menu.liquid`.
- The "Connect" column (work-with-us, wholesale, stockists, referrals,
  ambassador) from the Arms of Eve template is intentionally not ported.
  Revisit this ADR if/when that content exists.
- Any future footer content addition should be sorted into "Chi Siamo"
  (narrative/brand) vs "Assistenza" (practical/support) rather than growing
  a third ad-hoc column — that's the dividing line this ADR establishes.
- A blank `"color_scheme": ""` in any section/block JSON is not "no scheme" —
  it renders using that section's schema default. To make a section
  colorless/transparent, it needs an actual scheme built for that (e.g.
  `scheme-6`, which already has `background: rgba(0,0,0,0)`), not an empty
  string.
- If a future section's text still looks wrong after setting `color_scheme`
  correctly, verify with `getComputedStyle` in a real browser
  (`shopify theme dev` + chrome-devtools) before writing a CSS override —
  the override attempts above cost more time than the actual fix.
