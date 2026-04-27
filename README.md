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

## Store data model

Metaobject and metafield definitions are managed via `scripts/shopify-mgr/` — a zero-dependency Node.js CLI that talks directly to the Shopify Admin GraphQL API using a Partner-app OAuth token.

Definition files (one per definition) live under `scripts/shopify-data-model/`. Run order and ID resolution are handled automatically by the CLI.

### One-time setup

1. Create a Shopify Partner app at [partners.shopify.com](https://partners.shopify.com) with redirect URI `http://localhost:3456/callback` and scopes `read_products,write_products,read_metaobjects,write_metaobjects`.
2. Save the credentials:
   ```bash
   npm run shopify:configure
   ```
3. Authenticate against the store (opens a browser):
   ```bash
   npm run shopify:auth
   ```

### Common commands

| Command | What it does |
|---|---|
| `npm run shopify:check` | List all existing metaobject + metafield definitions on the store |
| `npm run shopify:apply:dry` | Preview what would be created (no writes) |
| `npm run shopify:apply` | Apply all definitions in order; skips any that already exist |
| `npm run shopify:stores` | List stores that have a saved token |

To apply a single file:
```bash
node scripts/shopify-mgr/cli.js schema apply mattiastore-3117.myshopify.com metaobjects/theme.graphql
```

Secrets are stored in `.env` at the project root (gitignored). See `scripts/shopify-mgr/README.md` for full documentation.

---

## Base theme

Built on [Horizon](https://themes.shopify.com/themes/horizon) v3.5.1 — Shopify's official theme. Refer to the [Shopify theme documentation](https://help.shopify.com/manual/online-store/themes) for theming concepts.
