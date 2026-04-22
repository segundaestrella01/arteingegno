# Arte&Ingegno — Shopify Theme

Custom Shopify theme for Arte&Ingegno, a jewelry store. Based on the **Horizon** theme (v3.5.1) by Shopify.

## Structure

| Directory | Purpose |
|-----------|---------|
| `assets/` | JavaScript, CSS, SVG icons, and static files |
| `blocks/` | Reusable theme blocks |
| `config/` | Theme settings schema and data (`settings_schema.json`, `settings_data.json`) |
| `layout/` | Base layouts (`theme.liquid`, `password.liquid`) |
| `locales/` | Translation files (25+ languages) |
| `sections/` | Page sections (header, footer, hero, product, collection, etc.) |
| `snippets/` | Reusable Liquid partials |
| `templates/` | Page templates (product, collection, cart, blog, etc.) |

## Development

This theme is managed and deployed via the [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli).

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Authenticate
shopify auth login --store <store-name>.myshopify.com

# Start development server (live preview with hot reload)
shopify theme dev

# Push theme to store
shopify theme push

# Pull latest theme from store
shopify theme pull
```

## Base theme

Built on [Horizon](https://themes.shopify.com/themes/horizon) v3.5.1 — Shopify's official theme. Refer to the [Shopify theme documentation](https://help.shopify.com/manual/online-store/themes) for theming concepts.
