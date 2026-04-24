# Glass sphere metafields

Attributes specific to the Glass sphere product type. Namespace
`custom.glass_sphere.*`, `ownerType: PRODUCT`.

| File                       | Key                | Type                       | Notes                                           |
|----------------------------|--------------------|----------------------------|-------------------------------------------------|
| `scene.graphql`            | `scene`            | `single_line_text_field`   | Short descriptor of the scene inside            |
| `motif_image.graphql`      | `motif_image`      | `file_reference`           | Close-up of the inner scene                     |
| `glass_type.graphql`       | `glass_type`       | `single_line_text_field`   | Murano, blown, crystal, etc.                    |
| `weight_grams.graphql`     | `weight_grams`     | `number_decimal`           |                                                 |
| `diameter_cm.graphql`      | `diameter_cm`      | `number_decimal`           |                                                 |
| `stand_included.graphql`   | `stand_included`   | `boolean`                  |                                                 |
| `suitable_as.graphql`      | `suitable_as`      | `list.single_line_text_field` | Paperweight, decoration, gift, etc.          |
| `fragile.graphql`          | `fragile`          | `boolean`                  | Defaults to true; shows handling note on PDP     |

## Namespace note

Shopify namespaces are a single dotted segment. We use
`custom.glass_sphere` (underscore, not hyphen) because metafield
definition namespaces must match `[a-zA-Z0-9_]+`.
