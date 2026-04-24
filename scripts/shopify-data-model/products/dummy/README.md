# Dummy products (dev store only)

Placeholder for seed data — one dummy product per family (Jewelry,
Glass sphere, Fan) with every metafield and metaobject reference
populated, used to smoke-test the data model on the dev store before
touching production.

**Do not run these against the production store.**

Planned files:

- `seed_jewelry.graphql` — create one dummy necklace with full
  metafield coverage.
- `seed_glass_sphere.graphql` — create one dummy nautical sphere.
- `seed_fan.graphql` — create one dummy folding fan.

Each seed file should use `productCreate` (with variants) followed by
`metafieldsSet` to populate the per-product metafields. Kept separate
from the definitions folder because seeds are disposable and should
never be promoted to production.
