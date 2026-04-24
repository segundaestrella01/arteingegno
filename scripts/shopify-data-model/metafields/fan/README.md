# Fan metafields

Attributes specific to the Fan product type. Namespace `custom.fan.*`,
`ownerType: PRODUCT`.

| File                       | Key                | Type                       | Notes                                       |
|----------------------------|--------------------|----------------------------|---------------------------------------------|
| `sub_type.graphql`         | `sub_type`         | `single_line_text_field`   | Folding, fixed, brisé, pleated, etc.         |
| `ribs_material.graphql`    | `ribs_material`    | `single_line_text_field`   | Sandalwood, bamboo, mother-of-pearl, etc.    |
| `rib_count.graphql`        | `rib_count`        | `number_integer`           |                                             |
| `open_span_cm.graphql`     | `open_span_cm`     | `number_decimal`           | Width when fully opened                      |
| `closed_length_cm.graphql` | `closed_length_cm` | `number_decimal`           |                                             |
| `decoration.graphql`       | `decoration`       | `single_line_text_field`   | Hand-painted silk, lace, embroidery, etc.    |
| `sleeve_included.graphql`  | `sleeve_included`  | `boolean`                  | Protective sleeve included?                  |
| `historical_period.graphql`| `historical_period`| `single_line_text_field`   | Inspired-by period (Victorian, Belle Époque) |
