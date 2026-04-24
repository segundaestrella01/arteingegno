# Jewelry metafields

Attributes specific to the Jewelry product type. Namespace
`custom.jewelry.*`, `ownerType: PRODUCT`.

Every definition here should include a `validations` clause or
`access.admin` rule scoping visibility to Jewelry products where
practical — otherwise empty fields will clutter admin pages for
Fan and Glass sphere products.

| File                      | Key               | Type                          | Notes                                     |
|---------------------------|-------------------|-------------------------------|-------------------------------------------|
| `sub_type.graphql`        | `sub_type`        | `single_line_text_field`      | Necklace, earrings, bracelet, ring, etc.   |
| `base_metal.graphql`      | `base_metal`      | `single_line_text_field`      | Brass, sterling silver, etc.              |
| `plating.graphql`         | `plating`         | `single_line_text_field`      | Gold plating spec (thickness, karat)       |
| `nickel_free.graphql`     | `nickel_free`     | `boolean`                     |                                           |
| `hypoallergenic.graphql`  | `hypoallergenic`  | `boolean`                     |                                           |
| `weight_grams.graphql`    | `weight_grams`    | `number_decimal`              |                                           |
| `closure.graphql`         | `closure`         | `single_line_text_field`      | Lobster clasp, spring ring, etc.           |
| `chain_length_cm.graphql` | `chain_length_cm` | `number_decimal`              | Only relevant for necklaces/bracelets      |

## Variants vs metafields

These are **product-level** descriptors. Variant-level differences
(e.g. "18 inch vs 20 inch" chain length, "rose gold vs yellow gold"
plating) are Shopify **variant options**, not metafields.

If a product is always sold in one variant, store the value here; if
it varies by SKU, make it a variant option.
