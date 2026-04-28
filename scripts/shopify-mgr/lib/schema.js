'use strict';

const fs   = require('fs');
const path = require('path');
const { graphql } = require('./client');

// Path to the shopify-data-model scripts directory, relative to this file.
const SCHEMA_DIR = path.resolve(__dirname, '../../shopify-data-model');

// ---------------------------------------------------------------------------
// Execution order
// Metaobjects must come first (they're referenced by metafield validations).
// Within each section, order matches the README run order.
// ---------------------------------------------------------------------------
const APPLY_ORDER = [
  // 1. Metaobjects
  'metaobjects/collection.graphql',
  'metaobjects/theme.graphql',
  // 2. Shared metafields
  'metafields/shared/story.graphql',
  'metafields/shared/care.graphql',
  'metafields/shared/handcrafted.graphql',
  'metafields/shared/made_to_order.graphql',
  'metafields/shared/lead_time_days.graphql',
  'metafields/shared/packaging.graphql',
  'metafields/shared/occasion.graphql',
  // These two need metaobject IDs — resolved dynamically at runtime:
  'metafields/shared/theme_refs.graphql',
  'metafields/shared/editorial_collections.graphql',
  // PDP display fields
  'metafields/shared/badge_1.graphql',
  'metafields/shared/badge_2.graphql',
  'metafields/shared/badge_3.graphql',
  'metafields/shared/swan_suggestion.graphql',
  // 3. Jewelry
  'metafields/jewelry/sub_type.graphql',
  'metafields/jewelry/base_metal.graphql',
  'metafields/jewelry/plating.graphql',
  'metafields/jewelry/closure.graphql',
  'metafields/jewelry/chain_length_cm.graphql',
  'metafields/jewelry/weight_grams.graphql',
  'metafields/jewelry/nickel_free.graphql',
  'metafields/jewelry/hypoallergenic.graphql',
  // 4. Glass sphere
  'metafields/glass-sphere/scene.graphql',
  'metafields/glass-sphere/glass_type.graphql',
  'metafields/glass-sphere/diameter_cm.graphql',
  'metafields/glass-sphere/weight_grams.graphql',
  'metafields/glass-sphere/stand_included.graphql',
  'metafields/glass-sphere/fragile.graphql',
  'metafields/glass-sphere/suitable_as.graphql',
  'metafields/glass-sphere/motif_image.graphql',
  // 5. Fan
  'metafields/fan/sub_type.graphql',
  'metafields/fan/ribs_material.graphql',
  'metafields/fan/decoration.graphql',
  'metafields/fan/rib_count.graphql',
  'metafields/fan/open_span_cm.graphql',
  'metafields/fan/closed_length_cm.graphql',
  'metafields/fan/sleeve_included.graphql',
  'metafields/fan/historical_period.graphql',
  // 6. Collections
  'collections/new-arrivals.graphql',
  'collections/homepage-jewelry.graphql',
];

// ---------------------------------------------------------------------------
// .graphql file parser
//
// File format:
//   # ...header comments...
//   mutation SomeName(...) { ... }
//
//   # Variables payload:
//   #
//   # {
//   #   "definition": { ... }
//   # }
//
// The mutation is everything that is NOT a comment line.
// The variables JSON is embedded in comment lines (strip leading `# `).
// ---------------------------------------------------------------------------

/**
 * Parse a .graphql file into { query, variablesStr }.
 * variablesStr is the raw JSON string (may contain placeholder text
 * that needs substitution before parsing).
 *
 * @param {string} filePath  Absolute path to the .graphql file
 * @returns {{ query: string, variablesStr: string | null }}
 */
function parseGraphqlFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  // The mutation: non-comment, non-empty lines
  const query = lines
    .filter(l => !l.trimStart().startsWith('#'))
    .join('\n')
    .trim();

  // The variables: strip `# ` prefix from comment lines, then find the JSON block
  const commentText = lines
    .filter(l => l.trimStart().startsWith('#'))
    .map(l => l.replace(/^\s*#\s?/, ''))
    .join('\n');

  const jsonStart = commentText.indexOf('{');
  if (jsonStart === -1) return { query, variablesStr: null };

  // Slice from the first `{` to the matching closing `}`
  // (handles nested braces correctly)
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < commentText.length; i++) {
    if (commentText[i] === '{') depth++;
    else if (commentText[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }

  const variablesStr = jsonEnd !== -1
    ? commentText.slice(jsonStart, jsonEnd)
    : commentText.slice(jsonStart);

  return { query, variablesStr };
}

// ---------------------------------------------------------------------------
// Dynamic metaobject ID resolution
//
// theme_refs.graphql and editorial_collections.graphql contain placeholder
// strings for the metaobject definition GIDs. We resolve them at runtime
// by querying the store, so the tool is idempotent across sessions.
// ---------------------------------------------------------------------------

const ID_PLACEHOLDERS = {
  // key: placeholder string in the .graphql variables comment
  // value: { type: Shopify metaobject type to query }
  'theme_refs.graphql': {
    placeholder: '<theme metaobject definition ID from metaobjects/theme.graphql run>',
    metaobjectType: 'product_theme',
  },
  'editorial_collections.graphql': {
    placeholder: '<collection metaobject definition ID from metaobjects/collection.graphql run>',
    metaobjectType: 'brand_collection',
  },
};

async function resolveMetaobjectId(shop, token, metaobjectType) {
  const data = await graphql(shop, token, `
    query GetMetaobjectDefId($type: String!) {
      metaobjectDefinitionByType(type: $type) { id }
    }
  `, { type: metaobjectType });

  const id = data?.metaobjectDefinitionByType?.id;
  if (!id) throw new Error(
    `Metaobject definition for type "${metaobjectType}" not found on ${shop}. ` +
    `Run its .graphql file first.`
  );
  return id;
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

/**
 * Fetch and print all existing metaobject + product metafield definitions.
 */
async function check(shop, token) {
  console.log(`\n📋 Existing definitions on ${shop}\n`);

  const [metaobjData, metafieldData] = await Promise.all([
    graphql(shop, token, `query { metaobjectDefinitions(first: 50) { nodes { id type name } } }`),
    graphql(shop, token, `query { metafieldDefinitions(first: 100, ownerType: PRODUCT) { nodes { id namespace key name } } }`),
  ]);

  const metaobjs = metaobjData.metaobjectDefinitions.nodes;
  const metafields = metafieldData.metafieldDefinitions.nodes;

  if (metaobjs.length === 0) {
    console.log('  Metaobject definitions: none');
  } else {
    console.log('Metaobject definitions:');
    metaobjs.forEach(n => console.log(`  ✓ ${n.type.padEnd(30)} ${n.name.padEnd(30)} ${n.id}`));
  }

  console.log('');

  if (metafields.length === 0) {
    console.log('  Product metafield definitions: none');
  } else {
    console.log('Product metafield definitions:');
    metafields.forEach(n =>
      console.log(`  ✓ ${(n.namespace + '.' + n.key).padEnd(45)} ${n.name.padEnd(30)} ${n.id}`)
    );
  }
}

/**
 * Apply a single .graphql file against the store.
 *
 * @param {string}  shop
 * @param {string}  token
 * @param {string}  relPath   Relative to SCHEMA_DIR
 * @param {boolean} dryRun    If true, print what would be sent but don't execute
 * @returns {Promise<object|null>}
 */
async function applyFile(shop, token, relPath, dryRun = false) {
  const filePath = path.join(SCHEMA_DIR, relPath);

  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${relPath}`);
    return null;
  }

  const { query, variablesStr } = parseGraphqlFile(filePath);

  // Resolve any dynamic placeholders before parsing JSON
  let resolvedStr = variablesStr;
  const basename = path.basename(relPath);

  if (ID_PLACEHOLDERS[basename] && resolvedStr) {
    const { placeholder, metaobjectType } = ID_PLACEHOLDERS[basename];
    if (resolvedStr.includes(placeholder)) {
      if (dryRun) {
        console.log(`  ℹ️  Would resolve metaobject ID for type "${metaobjectType}"`);
      } else {
        const id = await resolveMetaobjectId(shop, token, metaobjectType);
        resolvedStr = resolvedStr.split(placeholder).join(id);
      }
    }
  }

  let variables = {};
  if (resolvedStr) {
    try {
      variables = JSON.parse(resolvedStr);
    } catch (e) {
      throw new Error(`Failed to parse variables in ${relPath}: ${e.message}\n---\n${resolvedStr}`);
    }
  }

  if (dryRun) {
    console.log(`\n[dry-run] Would execute ${relPath}`);
    console.log('  Query (first 200 chars):', query.slice(0, 200).replace(/\n/g, ' '));
    console.log('  Variables:', JSON.stringify(variables, null, 2).slice(0, 400));
    return null;
  }

  const data = await graphql(shop, token, query, variables);

  // Surface any userErrors returned inside the mutation response
  const responseValue = Object.values(data)[0]; // e.g. data.metaobjectDefinitionCreate
  if (responseValue?.userErrors?.length > 0) {
    const errs = responseValue.userErrors;
    const isDuplicate = errs.some(e =>
      e.code === 'TAKEN' || e.message?.toLowerCase().includes('already')
    );
    if (isDuplicate) return { _skipped: true };
    throw new Error(
      `userErrors in ${relPath}:\n` +
      errs.map(e => `  [${e.code}] ${e.field?.join('.') ?? ''}: ${e.message}`).join('\n')
    );
  }

  return data;
}

/**
 * Apply all definitions in APPLY_ORDER.
 *
 * @param {string}  shop
 * @param {string}  token
 * @param {boolean} dryRun
 */
async function applyAll(shop, token, dryRun = false) {
  const label = dryRun ? '[dry-run] ' : '';
  console.log(`\n🚀 ${label}Applying full schema to ${shop}\n`);

  const results = [];

  for (const file of APPLY_ORDER) {
    process.stdout.write(`  → ${file.padEnd(60)}`);
    try {
      const result = await applyFile(shop, token, file, dryRun);
      if (result?._skipped) {
        console.log('↩️  already exists');
        results.push({ file, status: 'skipped' });
      } else {
        console.log(dryRun ? '📋 (dry-run)' : '✅ done');
        results.push({ file, status: 'ok' });
      }
    } catch (err) {
      console.log(`❌ ERROR`);
      console.error(`     ${err.message.split('\n').join('\n     ')}`);
      results.push({ file, status: 'error', error: err.message });
    }
  }

  // Summary
  const ok      = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors  = results.filter(r => r.status === 'error');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Created: ${ok}  |  Already existed: ${skipped}  |  Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\n  Failed files:');
    errors.forEach(r => console.log(`    - ${r.file}`));
  }
}

module.exports = { check, applyFile, applyAll, parseGraphqlFile, APPLY_ORDER, SCHEMA_DIR };
