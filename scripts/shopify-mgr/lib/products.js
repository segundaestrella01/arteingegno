'use strict';

const { graphql } = require('./client');

// Metafield type map — keyed by "namespace.key"
// Values must match the type used when the definition was created.
const METAFIELD_TYPES = {
  // Shared
  'custom_shared.story':          'multi_line_text_field',
  'custom_shared.care':           'multi_line_text_field',
  'custom_shared.handcrafted':    'boolean',
  'custom_shared.made_to_order':  'boolean',
  'custom_shared.lead_time_days': 'number_integer',
  'custom_shared.packaging':      'single_line_text_field',
  'custom_shared.occasion':       'list.single_line_text_field',
  // Jewelry
  'custom_jewelry.sub_type':        'single_line_text_field',
  'custom_jewelry.base_metal':      'single_line_text_field',
  'custom_jewelry.plating':         'single_line_text_field',
  'custom_jewelry.closure':         'single_line_text_field',
  'custom_jewelry.chain_length_cm': 'number_decimal',
  'custom_jewelry.weight_grams':    'number_decimal',
  'custom_jewelry.nickel_free':     'boolean',
  'custom_jewelry.hypoallergenic':  'boolean',
  // Glass sphere
  'custom_glass_sphere.scene':          'single_line_text_field',
  'custom_glass_sphere.glass_type':     'single_line_text_field',
  'custom_glass_sphere.diameter_cm':    'number_decimal',
  'custom_glass_sphere.weight_grams':   'number_decimal',
  'custom_glass_sphere.stand_included': 'boolean',
  'custom_glass_sphere.fragile':        'boolean',
  'custom_glass_sphere.suitable_as':    'list.single_line_text_field',
  'custom_glass_sphere.motif_image':    'file_reference',
  // Fan
  'custom_fan.sub_type':          'single_line_text_field',
  'custom_fan.ribs_material':     'single_line_text_field',
  'custom_fan.decoration':        'single_line_text_field',
  'custom_fan.rib_count':         'number_integer',
  'custom_fan.open_span_cm':      'number_decimal',
  'custom_fan.closed_length_cm':  'number_decimal',
  'custom_fan.sleeve_included':   'boolean',
  'custom_fan.historical_period': 'single_line_text_field',
};

// Namespace per product family — maps the metafields object keys to namespaces
const JEWELRY_NAMESPACE      = 'custom_jewelry';
const SHARED_NAMESPACE       = 'custom_shared';
const GLASS_SPHERE_NAMESPACE = 'custom_glass_sphere';
const FAN_NAMESPACE          = 'custom_fan';

// Shared keys — everything else is family-specific
const SHARED_KEYS = new Set([
  'story', 'care', 'handcrafted', 'made_to_order',
  'lead_time_days', 'packaging', 'occasion',
  'theme_refs', 'editorial_collections',
]);

const FAMILY_NAMESPACE = {
  Jewelry:      JEWELRY_NAMESPACE,
  'Glass sphere': GLASS_SPHERE_NAMESPACE,
  Fan:          FAN_NAMESPACE,
};

/**
 * Convert a flat metafields object into the array format Shopify expects.
 *
 * @param {object} metafields   e.g. { story: "...", sub_type: "Collana", ... }
 * @param {string} productType  "Jewelry" | "Glass sphere" | "Fan"
 * @returns {Array}
 */
function buildMetafieldsArray(metafields, productType) {
  const familyNs = FAMILY_NAMESPACE[productType];
  return Object.entries(metafields).map(([key, value]) => {
    const namespace = SHARED_KEYS.has(key) ? SHARED_NAMESPACE : familyNs;
    const type      = METAFIELD_TYPES[`${namespace}.${key}`];
    if (!type) throw new Error(`Unknown metafield type for ${namespace}.${key}`);
    return { namespace, key, value: String(value), type };
  });
}

const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        variants(first: 1) {
          nodes {
            id
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// API 2024-01+ removed `variants` from ProductInput; price is set on the
// auto-created default variant via a separate bulk-update call.
const UPDATE_VARIANT_PRICE_MUTATION = `
  mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Create a single product with metafields.
 *
 * @param {string} shop
 * @param {string} token
 * @param {object} productDef  One entry from a seeds file
 * @param {string} productType "Jewelry" | "Glass sphere" | "Fan"
 * @returns {Promise<object>}  The created product { id, title, handle }
 */
async function createProduct(shop, token, productDef, productType = 'Jewelry') {
  const metafields = buildMetafieldsArray(productDef.metafields, productType);

  const input = {
    title:           productDef.title,
    descriptionHtml: productDef.descriptionHtml,
    productType,
    vendor:          'Arte&Ingegno',
    status:          'DRAFT',
    metafields,
  };

  const data = await graphql(shop, token, CREATE_PRODUCT_MUTATION, { input });

  const { product, userErrors } = data.productCreate;

  if (userErrors && userErrors.length > 0) {
    throw new Error(
      `userErrors creating "${productDef.title}":\n` +
      userErrors.map(e => `  [${e.field}] ${e.message}`).join('\n')
    );
  }

  // Set price on the default variant that Shopify auto-creates
  const variantId = product.variants.nodes[0].id;
  const priceData = await graphql(shop, token, UPDATE_VARIANT_PRICE_MUTATION, {
    productId: product.id,
    variants:  [{ id: variantId, price: productDef.price }],
  });

  const { userErrors: variantErrors } = priceData.productVariantsBulkUpdate;
  if (variantErrors && variantErrors.length > 0) {
    throw new Error(
      `userErrors setting price for "${productDef.title}":\n` +
      variantErrors.map(e => `  [${e.field}] ${e.message}`).join('\n')
    );
  }

  return product;
}

/**
 * Seed multiple products, one at a time with a short delay to respect rate limits.
 *
 * @param {string}   shop
 * @param {string}   token
 * @param {object[]} products   Array of product definitions
 * @param {string}   productType
 * @param {boolean}  dryRun
 */
async function seedProducts(shop, token, products, productType = 'Jewelry', dryRun = false) {
  const label = dryRun ? '[dry-run] ' : '';
  console.log(`\n🌱 ${label}Seeding ${products.length} ${productType} products into ${shop}\n`);

  const results = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`  [${i + 1}/${products.length}] ${p.title.padEnd(45)}`);

    if (dryRun) {
      const mf = buildMetafieldsArray(p.metafields, productType);
      console.log(`📋 ${mf.length} metafields, price ${p.price}`);
      results.push({ title: p.title, status: 'dry-run' });
      continue;
    }

    try {
      const product = await createProduct(shop, token, p, productType);
      console.log(`✅ ${product.id}`);
      results.push({ title: p.title, status: 'ok', id: product.id, handle: product.handle });
    } catch (err) {
      console.log(`❌ ERROR`);
      console.error(`     ${err.message.split('\n').join('\n     ')}`);
      results.push({ title: p.title, status: 'error', error: err.message });
    }

    // Small delay between creates to stay within API rate limits
    if (i < products.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  const ok     = results.filter(r => r.status === 'ok').length;
  const errors = results.filter(r => r.status === 'error');

  console.log(`\n${'─'.repeat(60)}`);
  if (!dryRun) {
    console.log(`  Created: ${ok}  |  Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\n  Failed:');
      errors.forEach(r => console.log(`    - ${r.title}: ${r.error}`));
    }
    console.log(`\n  View in Shopify admin: https://${shop}/admin/products?status=draft`);
  }

  return results;
}

module.exports = { seedProducts, createProduct, buildMetafieldsArray };
