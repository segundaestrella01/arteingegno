# 0002 — Footer purpose, content scope, and top-navigation split

## Status

Accepted (2026-07-27).

## Context

The footer (`sections/footer-group.json`) previously duplicated the site's
newsletter signup ("Join our email list" heading + `email-signup` block) in
its top row. A separate, larger newsletter signup section already exists
higher on the page, making the footer copy redundant — a visitor who
dismissed or ignored the first prompt would immediately see it again.

Separately, footer text was unreadable: the footer's background is
`--color-brand-forest` (dark green), but several footer components
(`blocks/footer-policy-list.liquid`, `sections/footer-utilities.liquid`) read
Shopify's `--color-foreground` CSS custom property directly rather than
inheriting the `color` property. That variable is defined by
`snippets/color-schemes.liquid` and defaults at `:root` to `scheme-1`'s dark
warm-brown (`#4a4035`) — nearly invisible against forest green.
`assets/arteingegno-identity.css` only overrode the `color` *property* on
`footer`, never the `--color-foreground` *variable*, so anything reading the
variable directly ignored the override.

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

  This row's `color_scheme` was changed from `scheme-1` to `""` (inherit),
  so it renders forest-green like the rest of the footer instead of a
  separate light parchment band.

- **Bottom row** (`footer_utilities_jLGE8U`, unchanged) — copyright, the
  built-in Shopify policies popover, and social icons.

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
- If a future footer block needs a color that isn't `color`-property driven
  (i.e. it reads a `--color-*` variable directly), the fix belongs in the
  variable override block in `assets/arteingegno-identity.css` (section 22),
  not a one-off `color:` override — the whole point of this fix was that
  property-only overrides don't reach variable-reading components.
