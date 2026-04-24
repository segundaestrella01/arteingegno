# Shared metafields

Attributes every product family uses, stored under namespace
`custom.shared.*` with `ownerType: PRODUCT`.

| File                      | Key              | Type                         | Notes                                      |
|---------------------------|------------------|------------------------------|--------------------------------------------|
| `occasion.graphql`        | `occasion`       | `list.single_line_text_field` | Wedding, Christmas, birthday, etc.         |
| `handcrafted.graphql`     | `handcrafted`    | `boolean`                    | Defaults to true for A&I catalog            |
| `story.graphql`           | `story`          | `multi_line_text_field`      | The narrative shown on PDP                  |
| `care.graphql`            | `care`           | `multi_line_text_field`      | How to care for the piece                   |
| `made_to_order.graphql`   | `made_to_order`  | `boolean`                    | If true, show lead time prominently         |
| `lead_time_days.graphql`  | `lead_time_days` | `number_integer`             | Business days until ready to ship           |
| `packaging.graphql`       | `packaging`      | `single_line_text_field`     | Description of gift box / pouch included    |
| `theme_refs.graphql`      | `themes`         | `list.metaobject_reference`  | Links to `theme` metaobjects                |
| `editorial_collections.graphql` | `editorial_collections` | `list.metaobject_reference` | Links to `collection` metaobjects |
| `artisan_ref.graphql`     | `artisan`        | `metaobject_reference`       | Optional; links to `artisan` metaobject     |

Run `theme_refs.graphql`, `editorial_collections.graphql`, and
`artisan_ref.graphql` AFTER the matching metaobject definitions exist —
they reference those types.

## Why not `custom.product.*`?

Shopify's own docs suggest `custom` as the default namespace and
grouping by an app/feature-level key. We split:

- `custom.shared.*` — every product has these.
- `custom.jewelry.*` / `custom.glass_sphere.*` / `custom.fan.*` —
  only products of that type have these.

This lets the storefront decide what to render by looking at the
namespace prefix, without having to know every individual key.
